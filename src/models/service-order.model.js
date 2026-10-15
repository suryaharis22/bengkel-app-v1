import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const serviceOrderSelect = {
  id: true,
  order_number: true,
  booking_id: true,
  technician_id: true,
  confirmed_by_id: true,
  complaint: true,
  diagnosis: true,
  notes: true,
  subtotal: true,
  discount: true,
  tax: true,
  grand_total: true,
  payment_fee: true,
  paid_amount: true,
  change_amount: true,
  payment_status: true,
  status: true,
  midtrans_order_id: true,
  midtrans_transaction_id: true,
  midtrans_payment_type: true,
  midtrans_transaction_status: true,
  confirmed_at: true,
  started_at: true,
  completed_at: true,
  cancelled_at: true,
  created_at: true,
  updated_at: true,

  booking: {
    select: {
      id: true,
      booking_number: true,
      customer_id: true,
      vehicle_id: true,
      customer_name: true,
      customer_phone: true,
      complaint: true,
      notes: true,
      scheduled_at: true,
      status: true,

      customer: {
        select: {
          id: true,
          username: true,
          email: true,
          no_hp: true,
          role: true,
        },
      },

      vehicle: {
        select: {
          id: true,
          user_id: true,
          plate_number: true,
          brand: true,
          model: true,
          year: true,
          color: true,
        },
      },
    },
  },

  technician: {
    select: {
      id: true,
      username: true,
      email: true,
      no_hp: true,
      role: true,
    },
  },

  confirmed_by: {
    select: {
      id: true,
      username: true,
      email: true,
      no_hp: true,
      role: true,
    },
  },

  service_items: {
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      service_order_id: true,
      service_id: true,
      name: true,
      quantity: true,
      unit_price: true,
      discount: true,
      subtotal: true,
      created_at: true,
      updated_at: true,

      service: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          status: true,
        },
      },
    },
  },

  spare_part_items: {
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      service_order_id: true,
      spare_part_id: true,
      variant_id: true,
      name: true,
      sku: true,
      quantity: true,
      unit_price: true,
      discount: true,
      subtotal: true,
      created_at: true,
      updated_at: true,

      spare_part: {
        select: {
          id: true,
          name: true,
          sku: true,
          status: true,
        },
      },

      variant: {
        select: {
          id: true,
          spare_part_id: true,
          name: true,
          sku: true,
          price: true,
          compare_price: true,
          cost_price: true,
          weight: true,
          status: true,

          stock: {
            select: {
              id: true,
              variant_id: true,
              stock: true,
              reserved_stock: true,
              minimum_stock: true,
              updated_at: true,
            },
          },
        },
      },
    },
  },
};

function getClient(client = prisma) {
  return client;
}

export async function createServiceOrder(tx, data) {
  if (!tx || typeof tx.serviceOrder?.create !== "function") {
    throw new Error("Invalid Prisma transaction client in createServiceOrder");
  }

  return tx.serviceOrder.create({
    data,
    select: serviceOrderSelect,
  });
}

export async function findServiceOrderById(id, client = prisma) {
  return getClient(client).serviceOrder.findUnique({
    where: { id: Number(id) },
    select: serviceOrderSelect,
  });
}

export async function findServiceOrderByOrderNumber(
  orderNumber,
  client = prisma,
) {
  return getClient(client).serviceOrder.findUnique({
    where: {
      order_number: orderNumber,
    },
    select: serviceOrderSelect,
  });
}

export async function findServiceOrderRecordById(id, client = prisma) {
  return getClient(client).serviceOrder.findUnique({
    where: { id: Number(id) },
  });
}

export async function findServiceOrders(
  { where = {}, skip = 0, take = 20, orderBy = { created_at: "desc" } } = {},
  client = prisma,
) {
  return getClient(client).serviceOrder.findMany({
    where,
    skip,
    take,
    orderBy,
    select: serviceOrderSelect,
  });
}

export async function countServiceOrders(where = {}, client = prisma) {
  return getClient(client).serviceOrder.count({
    where,
  });
}

export async function updateServiceOrder(id, data, client = prisma) {
  return getClient(client).serviceOrder.update({
    where: {
      id: Number(id),
    },
    data,
    select: serviceOrderSelect,
  });
}

export async function updateServiceOrderRecord(id, data, client = prisma) {
  return getClient(client).serviceOrder.update({
    where: {
      id: Number(id),
    },
    data,
  });
}

export async function deleteServiceOrder(id, client = prisma) {
  return getClient(client).serviceOrder.delete({
    where: {
      id: Number(id),
    },
  });
}

export async function findVehicleById(id, client = prisma) {
  return getClient(client).vehicle.findUnique({
    where: {
      id: Number(id),
    },
    select: {
      id: true,
      user_id: true,
      plate_number: true,
      brand: true,
      model: true,
      year: true,
      color: true,
    },
  });
}

export async function findVehicleServiceOrders(
  vehicleId,
  { where = {}, skip = 0, take = 20, orderBy = { created_at: "desc" } } = {},
  client = prisma,
) {
  return getClient(client).serviceOrder.findMany({
    where: {
      ...where,
      booking: {
        is: {
          ...(where.booking?.is || {}),
          vehicle_id: Number(vehicleId),
        },
      },
    },
    skip,
    take,
    orderBy,
    select: serviceOrderSelect,
  });
}

export async function countVehicleServiceOrders(
  vehicleId,
  where = {},
  client = prisma,
) {
  return getClient(client).serviceOrder.count({
    where: {
      ...where,
      booking: {
        is: {
          ...(where.booking?.is || {}),
          vehicle_id: Number(vehicleId),
        },
      },
    },
  });
}

export async function findTechnicianVehicleServiceOrders(
  { technicianId, where = {}, orderBy = { created_at: "desc" } } = {},
  client = prisma,
) {
  return getClient(client).serviceOrder.findMany({
    where: {
      ...where,
      technician_id: Number(technicianId),
    },
    orderBy,
    select: serviceOrderSelect,
  });
}

export async function findServicePayments(orderId, client = prisma) {
  const id = Number(orderId);

  const payments = await getClient(client).$queryRaw`
    SELECT
      id,
      service_order_id,
      payment_method,
      provider,
      amount,
      reference_number,
      midtrans_order_id,
      midtrans_transaction_id,
      midtrans_payment_type,
      midtrans_transaction_status,
      paid_at,
      created_at
    FROM service_payments
    WHERE service_order_id = ${id}
    ORDER BY id ASC
  `;

  return payments;
}

export async function findServicePaymentsByOrderIds(
  orderIds = [],
  client = prisma,
) {
  const ids = [
    ...new Set(
      orderIds.map(Number).filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];

  if (ids.length === 0) {
    return [];
  }

  return getClient(client).$queryRaw`
    SELECT
      id,
      service_order_id,
      payment_method,
      provider,
      amount,
      reference_number,
      midtrans_order_id,
      midtrans_transaction_id,
      midtrans_payment_type,
      midtrans_transaction_status,
      paid_at,
      created_at
    FROM service_payments
    WHERE service_order_id IN (${Prisma.join(ids)})
    ORDER BY id ASC
  `;
}

export async function createServiceOrderItem(data, client = prisma) {
  return getClient(client).serviceOrderItem.create({
    data,
  });
}

export async function findServiceOrderItemById(id, client = prisma) {
  return getClient(client).serviceOrderItem.findUnique({
    where: {
      id: Number(id),
    },
  });
}

export async function updateServiceOrderItem(id, data, client = prisma) {
  return getClient(client).serviceOrderItem.update({
    where: {
      id: Number(id),
    },
    data,
  });
}

export async function deleteServiceOrderItem(id, client = prisma) {
  return getClient(client).serviceOrderItem.delete({
    where: {
      id: Number(id),
    },
  });
}

export async function createServiceOrderSparePart(data, client = prisma) {
  return getClient(client).serviceOrderSparePart.create({
    data,
  });
}

export async function findServiceOrderSparePartById(id, client = prisma) {
  return getClient(client).serviceOrderSparePart.findUnique({
    where: {
      id: Number(id),
    },
  });
}

export async function updateServiceOrderSparePart(id, data, client = prisma) {
  return getClient(client).serviceOrderSparePart.update({
    where: {
      id: Number(id),
    },
    data,
  });
}

export async function deleteServiceOrderSparePart(id, client = prisma) {
  return getClient(client).serviceOrderSparePart.delete({
    where: {
      id: Number(id),
    },
  });
}

export async function findWorkshopServiceById(id, client = prisma) {
  return getClient(client).workshopService.findUnique({
    where: {
      id: Number(id),
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      status: true,
    },
  });
}

export async function findSparePartVariantById(id, client = prisma) {
  return getClient(client).sparePartVariant.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      spare_part: {
        select: {
          id: true,
          name: true,
          sku: true,
          status: true,
        },
      },
      stock: {
        select: {
          id: true,
          variant_id: true,
          stock: true,
          reserved_stock: true,
          minimum_stock: true,
          updated_at: true,
        },
      },
    },
  });
}

export async function findUserById(id, client = prisma) {
  return getClient(client).user.findUnique({
    where: {
      id: Number(id),
    },
    select: {
      id: true,
      username: true,
      email: true,
      no_hp: true,
      role: true,
    },
  });
}

export async function calculateServiceOrderItemSubtotal(
  orderId,
  client = prisma,
) {
  const result = await getClient(client).serviceOrderItem.aggregate({
    where: {
      service_order_id: Number(orderId),
    },
    _sum: {
      subtotal: true,
    },
  });

  return result._sum.subtotal ?? 0;
}

export async function calculateServiceOrderSparePartSubtotal(
  orderId,
  client = prisma,
) {
  const result = await getClient(client).serviceOrderSparePart.aggregate({
    where: {
      service_order_id: Number(orderId),
    },
    _sum: {
      subtotal: true,
    },
  });

  return result._sum.subtotal ?? 0;
}

export async function findServiceOrderTotals(orderId, client = prisma) {
  return getClient(client).serviceOrder.findUnique({
    where: {
      id: Number(orderId),
    },
    select: {
      id: true,
      subtotal: true,
      discount: true,
      tax: true,
      payment_fee: true,
      paid_amount: true,
      grand_total: true,
      change_amount: true,
      payment_status: true,
      status: true,
    },
  });
}

export async function updateServiceOrderTotals(orderId, data, client = prisma) {
  return getClient(client).serviceOrder.update({
    where: {
      id: Number(orderId),
    },
    data,
    select: {
      id: true,
      subtotal: true,
      discount: true,
      tax: true,
      payment_fee: true,
      paid_amount: true,
      grand_total: true,
      change_amount: true,
      payment_status: true,
      status: true,
    },
  });
}
export async function withServiceOrderTransaction(callback) {
  return prisma.$transaction((tx) => callback(tx));
}

export async function findServiceOrderByMidtransOrderId(
  orderId,
  client = prisma,
) {
  if (!orderId) {
    return null;
  }

  return client.serviceOrder.findUnique({
    where: { midtrans_order_id: orderId },
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
      service_items: true,
      spare_part_items: true,
      payments: {
        orderBy: { created_at: "desc" },
      },
    },
  });
}

export async function updateServiceOrderMidtransData(
  id,
  orderId,
  clearTransaction = false,
  client = prisma,
) {
  return client.serviceOrder.update({
    where: { id: Number(id) },
    data: {
      midtrans_order_id: orderId,
      ...(clearTransaction
        ? {
            midtrans_transaction_id: null,
            midtrans_payment_type: null,
            midtrans_transaction_status: null,
          }
        : {}),
    },
  });
}

async function deductServiceOrderSparePartStock(tx, serviceOrderId) {
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

  // Tidak ada spare part yang digunakan.
  if (items.length === 0) return;

  // Gabungkan item dengan variant yang sama.
  const quantities = new Map();

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(`Kuantitas spare part tidak valid: ${item.name}`);
    }

    quantities.set(
      item.variant_id,
      (quantities.get(item.variant_id) || 0) + item.quantity,
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
      throw new Error(
        `Data stok tidak ditemukan untuk variant ID ${variantId}.`,
      );
    }

    const availableStock = Number(stock.stock) - Number(stock.reserved_stock);

    if (availableStock < quantity) {
      throw new Error(
        `Stok tidak mencukupi untuk variant ID ${variantId}. ` +
          `Tersedia: ${availableStock}, dibutuhkan: ${quantity}.`,
      );
    }

    const updated = await tx.sparePartStock.updateMany({
      where: {
        variant_id: variantId,
        stock: {
          gte: quantity + Number(stock.reserved_stock),
        },
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    if (updated.count !== 1) {
      throw new Error(`Gagal mengurangi stok variant ID ${variantId}.`);
    }
  }
}

export async function processServiceOrderMidtransNotification(
  orderId,
  notification,
) {
  return prisma.$transaction(async (tx) => {
    const serviceOrder = await findServiceOrderByMidtransOrderId(orderId, tx);

    if (!serviceOrder) {
      return null;
    }

    const transactionStatus = notification.transaction_status;
    const transactionId = notification.transaction_id || null;
    const paymentType = notification.payment_type || null;

    const transactionData = {
      midtrans_transaction_id: transactionId,
      midtrans_payment_type: paymentType,
      midtrans_transaction_status: transactionStatus || null,
    };

    // Capture hanya diterima jika fraud status dinyatakan aman.
    if (
      transactionStatus === "capture" &&
      notification.fraud_status !== "accept"
    ) {
      return tx.serviceOrder.update({
        where: {
          id: serviceOrder.id,
        },
        data: transactionData,
      });
    }

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      const paymentAmount = Math.round(Number(notification.gross_amount) || 0);

      if (paymentAmount <= 0) {
        throw new Error("Jumlah pembayaran Midtrans tidak valid.");
      }

      // Cari pembayaran yang sama agar webhook berulang tidak
      // membuat catatan pembayaran baru.
      const existingPayment = serviceOrder.payments?.find(
        (payment) =>
          (transactionId &&
            payment.midtrans_transaction_id === transactionId) ||
          (transactionId && payment.reference_number === transactionId) ||
          (orderId && payment.midtrans_order_id === orderId),
      );

      if (existingPayment) {
        await tx.servicePayment.update({
          where: {
            id: existingPayment.id,
          },
          data: {
            payment_method: getServicePaymentMethod(paymentType),
            provider: "midtrans",
            amount: paymentAmount,
            reference_number: transactionId ?? existingPayment.reference_number,
            midtrans_order_id: orderId,
            midtrans_transaction_id:
              transactionId ?? existingPayment.midtrans_transaction_id,
            midtrans_payment_type: paymentType,
            midtrans_transaction_status: transactionStatus,
          },
        });
      } else {
        await tx.servicePayment.create({
          data: {
            service_order_id: serviceOrder.id,
            payment_method: getServicePaymentMethod(paymentType),
            provider: "midtrans",
            amount: paymentAmount,
            reference_number: transactionId,
            midtrans_order_id: orderId,
            midtrans_transaction_id: transactionId,
            midtrans_payment_type: paymentType,
            midtrans_transaction_status: transactionStatus,
            paid_at: new Date(),
          },
        });
      }

      // Hitung total pembayaran yang tercatat, termasuk pembayaran
      // sebelumnya jika pesanan dibayar secara bertahap.
      const aggregate = await tx.servicePayment.aggregate({
        where: {
          service_order_id: serviceOrder.id,
        },
        _sum: {
          amount: true,
        },
      });

      const grandTotal = Math.round(Number(serviceOrder.grand_total) || 0);

      const paymentFee = Math.round(Number(serviceOrder.payment_fee) || 0);

      const total = grandTotal + paymentFee;

      const amountRecorded = Math.round(Number(aggregate._sum.amount) || 0);

      const currentPaidAmount = Math.round(
        Number(serviceOrder.paid_amount) || 0,
      );

      const paidAmount = Math.min(
        Math.max(currentPaidAmount, amountRecorded),
        total,
      );

      const isPaid = paidAmount >= total;

      if (isPaid) {
        // Status hanya bisa berubah ke paid jika sebelumnya
        // unpaid/partial. Ini menjadi pengaman agar stok tidak
        // dipotong ulang oleh webhook yang sama.
        const updated = await tx.serviceOrder.updateMany({
          where: {
            id: serviceOrder.id,
            payment_status: {
              in: ["unpaid", "partial"],
            },
          },
          data: {
            paid_amount: paidAmount,
            payment_status: "paid",
            change_amount: 0,
            ...transactionData,
          },
        });

        if (updated.count === 1) {
          // Pengurangan stok berada dalam transaksi database yang
          // sama dengan perubahan status pembayaran.
          await deductServiceOrderSparePartStock(tx, serviceOrder.id);
        } else {
          const currentOrder = await tx.serviceOrder.findUnique({
            where: {
              id: serviceOrder.id,
            },
            select: {
              payment_status: true,
            },
          });

          if (currentOrder?.payment_status !== "paid") {
            throw new Error(
              "Status pembayaran berubah. Silakan periksa pesanan.",
            );
          }

          // Sudah paid: jangan potong stok lagi.
          await tx.serviceOrder.update({
            where: {
              id: serviceOrder.id,
            },
            data: transactionData,
          });
        }
      } else {
        await tx.serviceOrder.update({
          where: {
            id: serviceOrder.id,
          },
          data: {
            paid_amount: paidAmount,
            payment_status: "partial",
            change_amount: 0,
            ...transactionData,
          },
        });
      }

      return tx.serviceOrder.findUnique({
        where: {
          id: serviceOrder.id,
        },
        include: {
          payments: {
            orderBy: {
              created_at: "desc",
            },
          },
          spare_part_items: true,
        },
      });
    }

    if (transactionStatus === "pending") {
      return tx.serviceOrder.update({
        where: {
          id: serviceOrder.id,
        },
        data: transactionData,
      });
    }

    if (["expire", "cancel", "deny"].includes(transactionStatus)) {
      if (
        serviceOrder.payment_status === "paid" ||
        serviceOrder.payment_status === "refunded"
      ) {
        return serviceOrder;
      }

      return tx.serviceOrder.update({
        where: {
          id: serviceOrder.id,
        },
        data: {
          payment_status: "unpaid",
          ...transactionData,
        },
      });
    }

    return tx.serviceOrder.update({
      where: {
        id: serviceOrder.id,
      },
      data: transactionData,
    });
  });
}

function getServicePaymentMethod(paymentType) {
  if (!paymentType) return "qris";

  const normalized = String(paymentType).toLowerCase();

  if (
    normalized.includes("qris") ||
    normalized === "gopay" ||
    normalized === "shopeepay"
  ) {
    return "qris";
  }

  if (normalized.includes("bank_transfer") || normalized.includes("va")) {
    return "transfer";
  }

  if (normalized.includes("credit_card") || normalized.includes("debit")) {
    return "debit";
  }

  if (
    normalized.includes("wallet") ||
    normalized.includes("ewallet") ||
    normalized === "dana" ||
    normalized === "ovo"
  ) {
    return "ewallet";
  }

  return "qris";
}
