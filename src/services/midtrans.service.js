import crypto from "node:crypto";

import { snap, coreApi } from "@/lib/midtrans";

import {
  findSaleByMidtransOrderId,
  findSaleForMidtransSnap,
  updateSaleMidtransOrder,
  prepareSaleForMidtransRetry,
  processSaleMidtransNotification,
} from "@/models/sale.model";

import {
  findServiceOrderByMidtransOrderId,
  updateServiceOrderMidtransData,
  processServiceOrderMidtransNotification,
} from "@/models/service-order.model";

function createServiceError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value) {
  return Math.round(toNumber(value));
}

function verifyMidtransSignature(notification) {
  const orderId = notification?.order_id;
  const statusCode = notification?.status_code;
  const grossAmount = notification?.gross_amount;
  const signatureKey = notification?.signature_key;

  if (
    !orderId ||
    !statusCode ||
    grossAmount === undefined ||
    grossAmount === null ||
    !signatureKey
  ) {
    throw createServiceError("Invalid Midtrans notification payload.", 400);
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    throw createServiceError("MIDTRANS_SERVER_KEY is not configured.", 500);
  }

  const expectedSignature = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const actualBuffer = Buffer.from(String(signatureKey), "hex");

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw createServiceError("Invalid Midtrans signature.", 401);
  }

  return true;
}

function getCustomerDetails(sale, customer) {
  return {
    first_name: customer?.username || sale?.customer_name || "Customer",
    email: customer?.email || "customer@example.com",
    phone: customer?.no_hp || sale?.customer_phone || undefined,
  };
}

function getServiceOrderCustomerDetails(serviceOrder) {
  const customer = serviceOrder?.booking?.customer;
  const booking = serviceOrder?.booking;

  return {
    first_name: customer?.username || booking?.customer_name || "Customer",
    email: customer?.email || "customer@example.com",
    phone: customer?.no_hp || booking?.customer_phone || undefined,
  };
}

function getBaseItemDetails(sale) {
  return (sale?.items || [])
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = roundMoney(item.unit_price);

      if (quantity <= 0 || unitPrice <= 0) {
        return null;
      }

      return {
        id: String(item.variant_id),
        price: unitPrice,
        quantity,
        name: item.name,
      };
    })
    .filter(Boolean);
}

function getItemDetailsTotal(items) {
  return items.reduce(
    (total, item) =>
      total + roundMoney(item.price) * Number(item.quantity || 0),
    0,
  );
}

function getItemDetails(sale) {
  const items = getBaseItemDetails(sale);
  const itemDetailsTotal = getItemDetailsTotal(items);
  const grandTotal = roundMoney(sale?.grand_total);
  const paymentFee = roundMoney(sale?.payment_fee);
  const adjustment = grandTotal - itemDetailsTotal;

  if (adjustment !== 0) {
    items.push({
      id: "order-adjustment",
      price: adjustment,
      quantity: 1,
      name: adjustment < 0 ? "Discount" : "Tax / Adjustment",
    });
  }

  if (paymentFee > 0) {
    items.push({
      id: "payment-fee",
      price: paymentFee,
      quantity: 1,
      name: "Payment Fee",
    });
  }

  return items;
}

function getSnapGrossAmount(sale) {
  return roundMoney(sale?.grand_total) + roundMoney(sale?.payment_fee);
}

function getServiceOrderBaseItemDetails(serviceOrder) {
  const items = [];

  for (const item of serviceOrder?.service_items || []) {
    const quantity = Number(item.quantity || 0);
    const unitPrice = roundMoney(item.unit_price);

    if (quantity <= 0 || unitPrice <= 0) {
      continue;
    }

    items.push({
      id: `service-${item.id}`,
      price: unitPrice,
      quantity,
      name: item.name,
    });
  }

  for (const item of serviceOrder?.spare_part_items || []) {
    const quantity = Number(item.quantity || 0);
    const unitPrice = roundMoney(item.unit_price);

    if (quantity <= 0 || unitPrice <= 0) {
      continue;
    }

    items.push({
      id: `spare-part-${item.id}`,
      price: unitPrice,
      quantity,
      name: item.name,
    });
  }

  return items;
}

function getServiceOrderItemDetails(serviceOrder) {
  const grandTotal = roundMoney(serviceOrder?.grand_total);
  const paymentFee = roundMoney(serviceOrder?.payment_fee);
  const paidAmount = roundMoney(serviceOrder?.paid_amount);
  const remainingPrincipal = Math.max(grandTotal - paidAmount, 0);

  if (remainingPrincipal <= 0) {
    return [];
  }

  if (paidAmount > 0) {
    const items = [
      {
        id: `service-order-balance-${serviceOrder.id}`,
        price: remainingPrincipal,
        quantity: 1,
        name: `Remaining balance ${
          serviceOrder.order_number || serviceOrder.id
        }`,
      },
    ];

    if (paymentFee > 0) {
      items.push({
        id: "service-order-payment-fee",
        price: paymentFee,
        quantity: 1,
        name: "Payment Fee",
      });
    }

    return items;
  }

  const items = getServiceOrderBaseItemDetails(serviceOrder);
  const itemDetailsTotal = getItemDetailsTotal(items);
  const adjustment = grandTotal - itemDetailsTotal;

  if (adjustment !== 0) {
    items.push({
      id: "service-order-adjustment",
      price: adjustment,
      quantity: 1,
      name: adjustment < 0 ? "Discount" : "Tax / Adjustment",
    });
  }

  if (paymentFee > 0) {
    items.push({
      id: "service-order-payment-fee",
      price: paymentFee,
      quantity: 1,
      name: "Payment Fee",
    });
  }

  return items;
}

function getServiceOrderSnapGrossAmount(serviceOrder) {
  const grandTotal = roundMoney(serviceOrder?.grand_total);
  const paymentFee = roundMoney(serviceOrder?.payment_fee);
  const paidAmount = roundMoney(serviceOrder?.paid_amount);
  const remainingPrincipal = Math.max(grandTotal - paidAmount, 0);

  return remainingPrincipal + paymentFee;
}

function generateMidtransOrderId(identifier) {
  return `${identifier}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

function getMidtransErrorMessage(
  error,
  fallbackMessage = "Failed to process Midtrans transaction.",
) {
  return (
    error?.ApiResponse?.error_messages?.join(", ") ||
    error?.ApiResponse?.status_message ||
    error?.message ||
    fallbackMessage
  );
}

async function getExistingMidtransStatus(orderId) {
  if (!orderId) {
    return null;
  }

  try {
    return await coreApi.transaction.status(orderId);
  } catch (error) {
    const statusCode = error?.ApiResponse?.status_code || error?.status_code;
    const errorMessages = error?.ApiResponse?.error_messages || [];
    const message = String(error?.message || "").toLowerCase();

    const isNotFound =
      statusCode === "404" ||
      statusCode === 404 ||
      errorMessages.some((item) =>
        String(item).toLowerCase().includes("transaction doesn't exist"),
      ) ||
      message.includes("transaction doesn't exist") ||
      message.includes("transaction not found") ||
      message.includes("not found");

    if (isNotFound) {
      return null;
    }

    console.error("Midtrans get transaction status error:", {
      response: error?.ApiResponse || null,
      message: error?.message || null,
    });

    throw createServiceError(
      "Failed to check Midtrans transaction status.",
      502,
    );
  }
}

export async function cancelMidtransTransaction(orderId) {
  if (!orderId) {
    throw createServiceError("Midtrans order ID is required.", 400);
  }

  try {
    const response = await coreApi.transaction.cancel(orderId);

    console.log("Midtrans transaction cancelled successfully:", {
      orderId,
      transactionId: response?.transaction_id || null,
      transactionStatus: response?.transaction_status || null,
    });

    return response;
  } catch (error) {
    console.error("Midtrans cancel transaction error:", {
      orderId,
      apiResponse: error?.ApiResponse || null,
      message: error?.message || null,
    });

    throw createServiceError(
      getMidtransErrorMessage(error, "Failed to cancel Midtrans transaction."),
      502,
    );
  }
}

export async function refundMidtransTransaction(orderId, options = {}) {
  if (!orderId) {
    throw createServiceError("Midtrans order ID is required.", 400);
  }

  const refundKey = options.refundKey || `REFUND-${orderId}-${Date.now()}`;

  const refundData = {
    refund_key: refundKey,
  };

  if (options.amount !== undefined && options.amount !== null) {
    refundData.amount = roundMoney(options.amount);
  }

  if (options.reason) {
    refundData.reason = options.reason;
  }

  try {
    const response = await coreApi.transaction.refund(orderId, refundData);

    console.log("Midtrans transaction refund requested successfully:", {
      orderId,
      refundKey,
      amount: refundData.amount || null,
      transactionStatus: response?.transaction_status || null,
    });

    return response;
  } catch (error) {
    console.error("Midtrans transaction refund error:", {
      orderId,
      refundKey,
      apiResponse: error?.ApiResponse || null,
      message: error?.message || null,
    });

    throw createServiceError(
      getMidtransErrorMessage(error, "Failed to refund Midtrans transaction."),
      502,
    );
  }
}

async function createSnapTransaction(transaction) {
  try {
    const response = await snap.createTransaction(transaction);

    return {
      token: response.token,
      redirect_url: response.redirect_url || null,
    };
  } catch (error) {
    console.error(
      "Midtrans create transaction error:",
      error?.ApiResponse || error?.message || error,
    );

    throw createServiceError(
      getMidtransErrorMessage(error, "Failed to create Midtrans transaction."),
      502,
    );
  }
}

export async function createMidtransSnapTransaction({ sale, customer }) {
  if (!sale) {
    throw createServiceError("Sale data is required.", 400);
  }

  if (!sale.midtrans_order_id) {
    throw createServiceError("Midtrans order ID is required.", 400);
  }

  const itemDetails = getItemDetails(sale);
  const grossAmount = getSnapGrossAmount(sale);
  const itemDetailsTotal = getItemDetailsTotal(itemDetails);

  if (grossAmount <= 0) {
    throw createServiceError("Invalid transaction amount.", 422);
  }

  if (grossAmount !== itemDetailsTotal) {
    console.error("Midtrans amount mismatch:", {
      grossAmount,
      itemDetailsTotal,
      grandTotal: roundMoney(sale.grand_total),
      paymentFee: roundMoney(sale.payment_fee),
      itemDetails,
    });

    throw createServiceError(
      "Midtrans transaction amount does not match item details.",
      422,
    );
  }

  let orderId = sale.midtrans_order_id;
  const existingTransaction = await getExistingMidtransStatus(orderId);

  if (existingTransaction) {
    const transactionStatus = existingTransaction.transaction_status;

    console.log("Existing Midtrans transaction:", {
      orderId,
      transactionStatus,
      transactionId: existingTransaction.transaction_id || null,
    });

    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      throw createServiceError(
        "This Midtrans transaction has already been paid.",
        422,
      );
    }

    if (!["pending", "expire", "cancel", "deny"].includes(transactionStatus)) {
      throw createServiceError(
        `Midtrans transaction is currently "${transactionStatus}".`,
        422,
      );
    }

    const oldOrderId = orderId;
    orderId = generateMidtransOrderId(sale.invoice_number);

    await updateSaleMidtransOrder(sale.id, orderId, true);

    sale.midtrans_order_id = orderId;
    sale.midtrans_transaction_id = null;
    sale.midtrans_payment_type = null;
    sale.midtrans_transaction_status = null;

    if (transactionStatus === "pending") {
      await cancelMidtransTransaction(oldOrderId);
    }
  }

  const transaction = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    item_details: itemDetails,
    customer_details: getCustomerDetails(sale, customer),
  };

  const result = await createSnapTransaction(transaction);

  return {
    ...result,
    order_id: orderId,
  };
}

export async function createMidtransSnapTransactionForServiceOrder({
  serviceOrder,
  paymentMethod,
  amount,
}) {
  if (!serviceOrder) {
    throw createServiceError("Service order data is required.", 400);
  }

  if (!paymentMethod) {
    throw createServiceError("Payment method is required.", 400);
  }

  const requestedAmount = roundMoney(amount);

  if (requestedAmount <= 0) {
    throw createServiceError("Invalid transaction amount.", 422);
  }

  const grandTotal = roundMoney(serviceOrder.grand_total);
  const paymentFee = roundMoney(serviceOrder.payment_fee);
  const paidAmount = roundMoney(serviceOrder.paid_amount);
  const remainingPrincipal = Math.max(grandTotal - paidAmount, 0);

  if (remainingPrincipal <= 0) {
    throw createServiceError("Service order has no remaining balance.", 422);
  }

  const grossAmount = getServiceOrderSnapGrossAmount(serviceOrder);

  if (grossAmount <= 0) {
    throw createServiceError("Invalid transaction amount.", 422);
  }

  const itemDetails = getServiceOrderItemDetails(serviceOrder);
  const itemDetailsTotal = getItemDetailsTotal(itemDetails);

  if (grossAmount !== itemDetailsTotal) {
    console.error("Service order Midtrans amount mismatch:", {
      serviceOrderId: serviceOrder.id,
      orderNumber: serviceOrder.order_number,
      requestedAmount,
      grossAmount,
      itemDetailsTotal,
      grandTotal,
      paymentFee,
      paidAmount,
      remainingPrincipal,
      itemDetails,
    });

    throw createServiceError(
      "Midtrans service order amount does not match item details.",
      422,
    );
  }

  let orderId = serviceOrder.midtrans_order_id;

  if (!orderId) {
    orderId = generateMidtransOrderId(serviceOrder.order_number);

    await updateServiceOrderMidtransData(serviceOrder.id, orderId, true);

    serviceOrder.midtrans_order_id = orderId;
  }

  const existingTransaction = await getExistingMidtransStatus(orderId);

  if (existingTransaction) {
    const transactionStatus = existingTransaction.transaction_status;
    const transactionId = existingTransaction.transaction_id || null;

    console.log("Existing Service Order Midtrans transaction:", {
      serviceOrderId: serviceOrder.id,
      orderId,
      transactionStatus,
      transactionId,
    });

    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      return {
        success: true,
        already_paid: true,
        order_id: orderId,
        transaction_id: transactionId,
        transaction_status: transactionStatus,
        amount: grossAmount,
        payment_method: paymentMethod,
        payment_fee: paymentFee,
        token: null,
        redirect_url: null,
        message:
          "This service order Midtrans transaction has already been paid.",
      };
    }

    if (!["pending", "expire", "cancel", "deny"].includes(transactionStatus)) {
      throw createServiceError(
        `Midtrans transaction is currently "${transactionStatus}".`,
        422,
      );
    }

    const oldOrderId = orderId;
    orderId = generateMidtransOrderId(serviceOrder.order_number);

    await updateServiceOrderMidtransData(serviceOrder.id, orderId, true);

    serviceOrder.midtrans_order_id = orderId;
    serviceOrder.midtrans_transaction_id = null;
    serviceOrder.midtrans_payment_type = null;
    serviceOrder.midtrans_transaction_status = null;

    if (transactionStatus === "pending") {
      await cancelMidtransTransaction(oldOrderId);
    }
  }

  const transaction = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    item_details: itemDetails,
    customer_details: getServiceOrderCustomerDetails(serviceOrder),
    custom_field1: String(serviceOrder.id),
    custom_field2: String(serviceOrder.order_number),
    custom_field3: String(paymentMethod),
  };

  const result = await createSnapTransaction(transaction);

  return {
    ...result,
    order_id: orderId,
    amount: grossAmount,
    payment_method: paymentMethod,
    payment_fee: paymentFee,
    already_paid: false,
  };
}

export async function createSnapPaymentForSale(saleId) {
  const id = Number(saleId);

  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError("Invalid sale ID.", 422);
  }

  let sale = await findSaleForMidtransSnap(id);

  if (!sale) {
    throw createServiceError("Sale not found.", 404);
  }

  if (sale.status === "refunded") {
    throw createServiceError("Refunded transaction cannot be paid.", 422);
  }

  if (sale.payment_status === "paid") {
    throw createServiceError("This transaction has already been paid.", 422);
  }

  const canRetryMidtransPayment =
    sale.status === "cancelled" &&
    ["cancel", "expire", "deny"].includes(sale.midtrans_transaction_status);

  if (sale.status === "cancelled" && !canRetryMidtransPayment) {
    throw createServiceError("Cancelled transaction cannot be paid.", 422);
  }

  if (canRetryMidtransPayment) {
    sale = await prepareSaleForMidtransRetry(id);
  }

  if (!sale.midtrans_order_id) {
    const orderId = generateMidtransOrderId(sale.invoice_number);

    await updateSaleMidtransOrder(sale.id, orderId);
    sale.midtrans_order_id = orderId;
  }

  const result = await createMidtransSnapTransaction({
    sale,
    customer: sale.customer,
  });

  return {
    sale_id: sale.id,
    invoice_number: sale.invoice_number,
    order_id: result.order_id || sale.midtrans_order_id,
    amount: getSnapGrossAmount(sale),
    token: result.token,
    redirect_url: result.redirect_url,
  };
}

export async function handleMidtransNotification(notification) {
  // Verifikasi signature sebelum memproses notifikasi.
  verifyMidtransSignature(notification);

  const orderId = notification.order_id;

  // Coba cari service order terlebih dahulu.
  const serviceOrder = await findServiceOrderByMidtransOrderId(orderId);

  if (serviceOrder) {
    // Status pembayaran dan pengurangan stok ditangani model
    // dalam satu transaksi database.
    const result = await processServiceOrderMidtransNotification(
      orderId,
      notification,
    );

    if (!result) {
      throw createServiceError(
        "Service order tidak ditemukan saat memproses notifikasi.",
        404,
      );
    }

    return {
      ignored: false,
      type: "service_order",
      order_id: orderId,
      data: result,
    };
  }

  // Jika bukan service order, coba cari sale.
  const sale = await findSaleByMidtransOrderId(orderId);

  if (!sale) {
    console.log(
      "Ignoring Midtrans notification for unknown/old order:",
      orderId,
    );

    return {
      ignored: true,
      order_id: orderId,
      reason:
        "Sale or Service Order does not reference this Midtrans order ID.",
    };
  }

  const result = await processSaleMidtransNotification(orderId, notification);

  return {
    ignored: false,
    type: "sale",
    order_id: orderId,
    data: result,
  };
}
