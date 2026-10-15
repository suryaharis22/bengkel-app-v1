import { prisma } from "@/lib/prisma";

import {
  getServiceOrderPaymentProvider,
  isMidtransPaymentMethod,
  isValidServiceOrderPaymentMethod,
} from "@/validations/service-order-payment.validation";

import { createMidtransSnapTransactionForServiceOrder } from "@/services/midtrans.service";

const PAYMENT_FEE_RATES = {
  qris: 0.007,
  ewallet: 0.02,
};

const PAYMENT_FIXED_FEES = {
  transfer: 4000,
  debit: 0,
  cash: 0,
};

function createServiceError(message, statusCode = 500, code = null) {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (code) {
    error.code = code;
  }

  return error;
}

function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
}

function calculatePaymentFee(paymentMethod, amount) {
  const normalizedAmount = roundMoney(amount);

  if (paymentMethod === "cash") {
    return 0;
  }

  if (PAYMENT_FEE_RATES[paymentMethod]) {
    return roundMoney(normalizedAmount * PAYMENT_FEE_RATES[paymentMethod]);
  }

  if (PAYMENT_FIXED_FEES[paymentMethod] !== undefined) {
    return PAYMENT_FIXED_FEES[paymentMethod];
  }

  return 0;
}

function getPaymentAmount(serviceOrder) {
  const grandTotal = roundMoney(serviceOrder.grand_total);
  const paymentFee = roundMoney(serviceOrder.payment_fee);
  const paidAmount = roundMoney(serviceOrder.paid_amount);
  const total = roundMoney(grandTotal + paymentFee);

  return {
    grandTotal,
    paymentFee,
    paidAmount,
    total,
    remaining: roundMoney(Math.max(total - paidAmount, 0)),
    remainingBeforeFee: roundMoney(Math.max(grandTotal - paidAmount, 0)),
  };
}

function serializePayment(payment) {
  if (!payment) {
    return null;
  }

  return {
    id: payment.id,
    service_order_id: payment.service_order_id,
    payment_method: payment.payment_method,
    provider: payment.provider,
    amount: toNumber(payment.amount),
    reference_number: payment.reference_number ?? null,
    midtrans_order_id: payment.midtrans_order_id ?? null,
    midtrans_transaction_id: payment.midtrans_transaction_id ?? null,
    midtrans_payment_type: payment.midtrans_payment_type ?? null,
    midtrans_transaction_status: payment.midtrans_transaction_status ?? null,
    paid_at: payment.paid_at,
    created_at: payment.created_at,
  };
}

function serializeServiceOrderPayment(serviceOrder) {
  const paymentAmount = getPaymentAmount(serviceOrder);

  return {
    service_order: {
      id: serviceOrder.id,
      order_number: serviceOrder.order_number,
      status: serviceOrder.status,
      payment_status: serviceOrder.payment_status,
    },
    summary: {
      subtotal: toNumber(serviceOrder.subtotal),
      discount: toNumber(serviceOrder.discount),
      tax: toNumber(serviceOrder.tax),
      grand_total: paymentAmount.grandTotal,
      payment_fee: paymentAmount.paymentFee,
      total: paymentAmount.total,
      paid_amount: paymentAmount.paidAmount,
      remaining_amount: paymentAmount.remaining,
      change_amount: toNumber(serviceOrder.change_amount),
    },
    midtrans: {
      order_id: serviceOrder.midtrans_order_id,
      transaction_id: serviceOrder.midtrans_transaction_id,
      payment_type: serviceOrder.midtrans_payment_type,
      transaction_status: serviceOrder.midtrans_transaction_status,
    },
    payments: serviceOrder.payments?.map(serializePayment) ?? [],
  };
}

async function getServiceOrderForPayment(tx, serviceOrderId) {
  const serviceOrder = await tx.serviceOrder.findUnique({
    where: {
      id: serviceOrderId,
    },
    include: {
      booking: {
        include: {
          customer: {
            select: {
              id: true,
              username: true,
              email: true,
              no_hp: true,
            },
          },
          vehicle: true,
        },
      },
      technician: {
        select: {
          id: true,
          username: true,
          email: true,
          no_hp: true,
        },
      },
      service_items: {
        include: {
          service: true,
        },
        orderBy: {
          id: "asc",
        },
      },
      spare_part_items: {
        include: {
          spare_part: true,
          variant: true,
        },
        orderBy: {
          id: "asc",
        },
      },
      payments: {
        orderBy: {
          created_at: "desc",
        },
      },
    },
  });

  if (!serviceOrder) {
    throw createServiceError(
      "Service order not found.",
      404,
      "SERVICE_ORDER_NOT_FOUND",
    );
  }

  return serviceOrder;
}

/**
 * Mengurangi stok spare part yang digunakan oleh service order.
 *
 * Harus dipanggil dalam transaksi Prisma.
 * Item dengan variant_id yang sama digabung agar stok tidak
 * dikurangi berkali-kali untuk variant yang sama.
 */
async function deductServiceOrderStock(tx, serviceOrderId) {
  const items = await tx.serviceOrderSparePart.findMany({
    where: {
      service_order_id: serviceOrderId,
    },
    select: {
      variant_id: true,
      quantity: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (items.length === 0) {
    return;
  }

  const quantities = new Map();

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw createServiceError(
        `Invalid spare part quantity for ${item.name}.`,
        422,
        "INVALID_SPARE_PART_QUANTITY",
      );
    }

    quantities.set(
      item.variant_id,
      (quantities.get(item.variant_id) ?? 0) + item.quantity,
    );
  }

  for (const [variantId, quantity] of quantities) {
    const stock = await tx.sparePartStock.findUnique({
      where: {
        variant_id: variantId,
      },
      select: {
        stock: true,
        reserved_stock: true,
      },
    });

    if (!stock) {
      throw createServiceError(
        `Stock record not found for spare part variant ID ${variantId}.`,
        409,
        "SPARE_PART_STOCK_NOT_FOUND",
      );
    }

    const reservedStock = toNumber(stock.reserved_stock);
    const availableStock = toNumber(stock.stock) - reservedStock;

    if (availableStock < quantity) {
      throw createServiceError(
        `Insufficient stock for spare part variant ID ${variantId}. Available stock: ${availableStock}, required: ${quantity}.`,
        409,
        "INSUFFICIENT_SPARE_PART_STOCK",
      );
    }

    // Atomic update untuk mencegah stok menjadi negatif.
    const updated = await tx.sparePartStock.updateMany({
      where: {
        variant_id: variantId,
        stock: {
          gte: quantity + reservedStock,
        },
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    if (updated.count !== 1) {
      throw createServiceError(
        `Unable to deduct stock for spare part variant ID ${variantId}. Please retry.`,
        409,
        "SPARE_PART_STOCK_UPDATE_FAILED",
      );
    }
  }
}

/**
 * Tandai service order sebagai lunas dan potong stok tepat satu kali.
 *
 * Pemotongan stok hanya dilakukan ketika update status dari unpaid/partial
 * ke paid berhasil. Jika order sudah paid, stok tidak dipotong kembali.
 *
 * Seluruh proses harus berjalan dalam satu transaksi Prisma.
 */
async function markServiceOrderPaid(
  tx,
  {
    serviceOrderId,
    paidAmount,
    paymentFee,
    midtransOrderId,
    midtransTransactionId,
    midtransPaymentType,
    midtransTransactionStatus,
  },
) {
  const updated = await tx.serviceOrder.updateMany({
    where: {
      id: serviceOrderId,
      payment_status: {
        in: ["unpaid", "partial"],
      },
    },
    data: {
      paid_amount: roundMoney(paidAmount),
      payment_status: "paid",
      payment_fee: roundMoney(paymentFee),
      change_amount: 0,
      ...(midtransOrderId !== undefined && {
        midtrans_order_id: midtransOrderId,
      }),
      ...(midtransTransactionId !== undefined && {
        midtrans_transaction_id: midtransTransactionId,
      }),
      ...(midtransPaymentType !== undefined && {
        midtrans_payment_type: midtransPaymentType,
      }),
      ...(midtransTransactionStatus !== undefined && {
        midtrans_transaction_status: midtransTransactionStatus,
      }),
    },
  });

  if (updated.count === 0) {
    const currentOrder = await tx.serviceOrder.findUnique({
      where: {
        id: serviceOrderId,
      },
      select: {
        payment_status: true,
      },
    });

    if (currentOrder?.payment_status === "paid") {
      // Sudah lunas: kemungkinan webhook Midtrans sudah memprosesnya.
      // Jangan mengurangi stok lagi.
      return false;
    }

    throw createServiceError(
      "Service order payment status changed. Please reload the order.",
      409,
      "SERVICE_ORDER_PAYMENT_CONFLICT",
    );
  }

  // Jika pengurangan stok gagal, perubahan status lunas juga di-rollback.
  await deductServiceOrderStock(tx, serviceOrderId);

  return true;
}

export async function getServiceOrderPayment({
  serviceOrderId,
  includeHistory = true,
}) {
  const serviceOrder = await prisma.serviceOrder.findUnique({
    where: {
      id: serviceOrderId,
    },
    include: {
      payments: includeHistory
        ? {
            orderBy: {
              created_at: "desc",
            },
          }
        : false,
    },
  });

  if (!serviceOrder) {
    throw createServiceError(
      "Service order not found.",
      404,
      "SERVICE_ORDER_NOT_FOUND",
    );
  }

  return serializeServiceOrderPayment({
    ...serviceOrder,
    payments: includeHistory ? serviceOrder.payments : [],
  });
}

export async function createServiceOrderPayment({
  serviceOrderId,
  userId,
  payment,
}) {
  const paymentMethod = String(payment?.payment_method ?? "").toLowerCase();

  if (!isValidServiceOrderPaymentMethod(paymentMethod)) {
    throw createServiceError(
      "Invalid payment method.",
      422,
      "INVALID_PAYMENT_METHOD",
    );
  }

  const provider = getServiceOrderPaymentProvider(paymentMethod);

  if (!provider) {
    throw createServiceError(
      "Invalid payment provider.",
      422,
      "INVALID_PAYMENT_PROVIDER",
    );
  }

  const serviceOrder = await getServiceOrderForPayment(prisma, serviceOrderId);

  if (serviceOrder.status === "cancelled") {
    throw createServiceError(
      "Cancelled service order cannot be paid.",
      422,
      "SERVICE_ORDER_CANCELLED",
    );
  }

  if (serviceOrder.payment_status === "paid") {
    throw createServiceError(
      "Service order has already been paid.",
      422,
      "SERVICE_ORDER_ALREADY_PAID",
    );
  }

  if (serviceOrder.payment_status === "refunded") {
    throw createServiceError(
      "Refunded service order cannot be paid.",
      422,
      "SERVICE_ORDER_REFUNDED",
    );
  }

  if (isMidtransPaymentMethod(paymentMethod)) {
    return createMidtransServiceOrderPayment({
      serviceOrder,
      payment,
      paymentMethod,
      userId,
    });
  }

  return createCashServiceOrderPayment({
    serviceOrder,
    payment,
    userId,
    paymentMethod,
    provider,
  });
}

async function createCashServiceOrderPayment({
  serviceOrder,
  payment,
  paymentMethod,
  provider,
}) {
  const amount = roundMoney(payment?.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw createServiceError(
      "Payment amount must be greater than 0.",
      422,
      "INVALID_PAYMENT_AMOUNT",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const currentOrder = await tx.serviceOrder.findUnique({
      where: {
        id: serviceOrder.id,
      },
    });

    if (!currentOrder) {
      throw createServiceError(
        "Service order not found.",
        404,
        "SERVICE_ORDER_NOT_FOUND",
      );
    }

    if (currentOrder.status === "cancelled") {
      throw createServiceError(
        "Cancelled service order cannot be paid.",
        422,
        "SERVICE_ORDER_CANCELLED",
      );
    }

    if (
      currentOrder.payment_status === "paid" ||
      currentOrder.payment_status === "refunded"
    ) {
      throw createServiceError(
        "Service order cannot be paid in its current payment status.",
        409,
        "SERVICE_ORDER_NOT_PAYABLE",
      );
    }

    const paymentAmount = getPaymentAmount(currentOrder);

    if (amount < paymentAmount.remaining) {
      throw createServiceError(
        `Payment amount must be at least ${paymentAmount.remaining}.`,
        422,
        "INSUFFICIENT_PAYMENT_AMOUNT",
      );
    }

    const changeAmount = roundMoney(amount - paymentAmount.remaining);
    const paidAmount = roundMoney(
      paymentAmount.paidAmount + paymentAmount.remaining,
    );

    const servicePayment = await tx.servicePayment.create({
      data: {
        service_order_id: currentOrder.id,
        payment_method: paymentMethod,
        provider,
        amount: paymentAmount.remaining,
        reference_number: payment?.reference_number ?? null,
        paid_at: new Date(),
      },
    });

    await markServiceOrderPaid(tx, {
      serviceOrderId: currentOrder.id,
      paidAmount,
      paymentFee: 0,
    });

    await tx.serviceOrder.update({
      where: {
        id: currentOrder.id,
      },
      data: {
        change_amount: changeAmount,
      },
    });

    const updatedServiceOrder = await getServiceOrderForPayment(
      tx,
      currentOrder.id,
    );

    return {
      servicePayment,
      serviceOrder: updatedServiceOrder,
    };
  });

  return {
    code: "SERVICE_ORDER_CASH_PAYMENT_CREATED",
    message: "Service order payment created successfully.",
    data: {
      payment: serializePayment(result.servicePayment),
      ...serializeServiceOrderPayment(result.serviceOrder),
    },
  };
}

/**
 * Sinkronisasi jika Midtrans mengembalikan transaksi yang sudah lunas
 * ketika Snap transaction dibuat.
 *
 * Fungsi ini idempoten: jika webhook lebih dahulu menandai order paid,
 * markServiceOrderPaid tidak akan mengurangi stok kembali.
 */
async function synchronizePaidMidtransServiceOrder({
  serviceOrder,
  paymentMethod,
  paymentAmount,
  midtransResult,
}) {
  const transactionId = midtransResult?.transaction_id ?? null;
  const orderId =
    midtransResult?.order_id ?? serviceOrder.midtrans_order_id ?? null;
  const transactionStatus = midtransResult?.transaction_status ?? "settlement";
  const paymentType = midtransResult?.payment_type ?? null;
  const amount = roundMoney(midtransResult?.amount ?? paymentAmount.total);

  if (amount <= 0) {
    throw createServiceError(
      "Invalid settled Midtrans payment amount.",
      422,
      "INVALID_SETTLED_PAYMENT_AMOUNT",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const currentOrder = await tx.serviceOrder.findUnique({
      where: {
        id: serviceOrder.id,
      },
      include: {
        payments: {
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    if (!currentOrder) {
      throw createServiceError(
        "Service order not found.",
        404,
        "SERVICE_ORDER_NOT_FOUND",
      );
    }

    if (currentOrder.payment_status === "refunded") {
      throw createServiceError(
        "Refunded service order cannot be synchronized as paid.",
        409,
        "SERVICE_ORDER_REFUNDED",
      );
    }

    const existingPayment = currentOrder.payments.find(
      (item) =>
        (transactionId && item.midtrans_transaction_id === transactionId) ||
        (transactionId && item.reference_number === transactionId) ||
        (orderId && item.midtrans_order_id === orderId),
    );

    let servicePayment;

    const paymentData = {
      payment_method: paymentMethod,
      provider: "midtrans",
      amount,
      reference_number:
        transactionId ?? existingPayment?.reference_number ?? null,
      midtrans_order_id: orderId ?? existingPayment?.midtrans_order_id ?? null,
      midtrans_transaction_id:
        transactionId ?? existingPayment?.midtrans_transaction_id ?? null,
      midtrans_payment_type:
        paymentType ?? existingPayment?.midtrans_payment_type ?? null,
      midtrans_transaction_status: transactionStatus,
      paid_at: existingPayment?.paid_at ?? new Date(),
    };

    if (existingPayment) {
      servicePayment = await tx.servicePayment.update({
        where: {
          id: existingPayment.id,
        },
        data: paymentData,
      });
    } else {
      servicePayment = await tx.servicePayment.create({
        data: {
          service_order_id: currentOrder.id,
          ...paymentData,
        },
      });
    }

    const aggregate = await tx.servicePayment.aggregate({
      where: {
        service_order_id: currentOrder.id,
      },
      _sum: {
        amount: true,
      },
    });

    const grandTotal = roundMoney(currentOrder.grand_total);
    const paymentFee = roundMoney(paymentAmount.paymentFee);
    const total = roundMoney(grandTotal + paymentFee);
    const amountRecorded = roundMoney(aggregate._sum.amount);

    const newPaidAmount = Math.min(
      Math.max(roundMoney(currentOrder.paid_amount), amountRecorded),
      total,
    );

    const paymentStatus = newPaidAmount >= total ? "paid" : "partial";

    if (paymentStatus === "paid") {
      await markServiceOrderPaid(tx, {
        serviceOrderId: currentOrder.id,
        paidAmount: newPaidAmount,
        paymentFee,
        midtransOrderId: orderId,
        midtransTransactionId: transactionId,
        midtransPaymentType: paymentType,
        midtransTransactionStatus: transactionStatus,
      });
    } else {
      await tx.serviceOrder.updateMany({
        where: {
          id: currentOrder.id,
          payment_status: {
            in: ["unpaid", "partial"],
          },
        },
        data: {
          paid_amount: newPaidAmount,
          payment_status: "partial",
          payment_fee: paymentFee,
          change_amount: 0,
          midtrans_order_id: orderId ?? currentOrder.midtrans_order_id,
          midtrans_transaction_id:
            transactionId ?? currentOrder.midtrans_transaction_id,
          midtrans_payment_type:
            paymentType ?? currentOrder.midtrans_payment_type,
          midtrans_transaction_status: transactionStatus,
        },
      });
    }

    const updatedServiceOrder = await getServiceOrderForPayment(
      tx,
      currentOrder.id,
    );

    return {
      servicePayment,
      serviceOrder: updatedServiceOrder,
      alreadyExisted: Boolean(existingPayment),
    };
  });

  return result;
}

async function createMidtransServiceOrderPayment({
  serviceOrder,
  paymentMethod,
}) {
  if (!isMidtransPaymentMethod(paymentMethod)) {
    throw createServiceError(
      "Invalid Midtrans payment method.",
      422,
      "INVALID_MIDTRANS_PAYMENT_METHOD",
    );
  }

  const grandTotal = roundMoney(serviceOrder.grand_total);
  const paidAmount = roundMoney(serviceOrder.paid_amount);
  const remainingBeforeFee = roundMoney(Math.max(grandTotal - paidAmount, 0));

  if (remainingBeforeFee <= 0) {
    throw createServiceError(
      "Service order has no remaining balance.",
      422,
      "SERVICE_ORDER_NO_REMAINING_BALANCE",
    );
  }

  const paymentFee = calculatePaymentFee(paymentMethod, remainingBeforeFee);
  const totalAmount = roundMoney(remainingBeforeFee + paymentFee);

  const updatedServiceOrder = await prisma.serviceOrder.update({
    where: {
      id: serviceOrder.id,
    },
    data: {
      payment_fee: paymentFee,
      change_amount: 0,
    },
    include: {
      booking: {
        include: {
          customer: {
            select: {
              id: true,
              username: true,
              email: true,
              no_hp: true,
            },
          },
          vehicle: true,
        },
      },
      technician: {
        select: {
          id: true,
          username: true,
          email: true,
          no_hp: true,
        },
      },
      service_items: {
        include: {
          service: true,
        },
        orderBy: {
          id: "asc",
        },
      },
      spare_part_items: {
        include: {
          spare_part: true,
          variant: true,
        },
        orderBy: {
          id: "asc",
        },
      },
      payments: {
        orderBy: {
          created_at: "desc",
        },
      },
    },
  });

  const midtransResult = await createMidtransSnapTransactionForServiceOrder({
    serviceOrder: updatedServiceOrder,
    paymentMethod,
    amount: totalAmount,
  });

  if (midtransResult?.already_paid) {
    const synchronized = await synchronizePaidMidtransServiceOrder({
      serviceOrder: updatedServiceOrder,
      paymentMethod,
      paymentAmount: {
        grandTotal,
        paymentFee,
        total: totalAmount,
        paidAmount,
        remaining: remainingBeforeFee,
        remainingBeforeFee,
      },
      midtransResult,
    });

    return {
      code: "SERVICE_ORDER_MIDTRANS_PAYMENT_SYNCHRONIZED",
      message:
        "Service order Midtrans payment was already settled and synchronized successfully.",
      data: {
        service_order: {
          id: synchronized.serviceOrder.id,
          order_number: synchronized.serviceOrder.order_number,
          payment_status: synchronized.serviceOrder.payment_status,
          status: synchronized.serviceOrder.status,
        },
        payment: {
          ...serializePayment(synchronized.servicePayment),
          payment_fee: paymentFee,
          token: null,
          redirect_url: null,
        },
        ...serializeServiceOrderPayment(synchronized.serviceOrder),
      },
    };
  }

  return {
    code: "SERVICE_ORDER_MIDTRANS_PAYMENT_CREATED",
    message: "Service order Midtrans payment created successfully.",
    data: {
      service_order: {
        id: updatedServiceOrder.id,
        order_number: updatedServiceOrder.order_number,
        payment_status: updatedServiceOrder.payment_status,
      },
      payment: {
        provider: "midtrans",
        payment_method: paymentMethod,
        amount: totalAmount,
        payment_fee: paymentFee,
        midtrans_order_id:
          midtransResult?.order_id ??
          midtransResult?.midtrans_order_id ??
          updatedServiceOrder.midtrans_order_id,
        token: midtransResult?.token ?? midtransResult?.snap_token ?? null,
        redirect_url: midtransResult?.redirect_url ?? null,
      },
      summary: {
        grand_total: grandTotal,
        previous_paid_amount: paidAmount,
        remaining_amount: remainingBeforeFee,
        payment_fee: paymentFee,
        total_payment: totalAmount,
      },
    },
  };
}
