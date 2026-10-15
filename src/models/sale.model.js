import { prisma } from "@/lib/prisma";

function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

function createModelError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const saleInclude = {
  cashier: {
    select: {
      id: true,
      username: true,
      email: true,
      no_hp: true,
    },
  },
  customer: {
    select: {
      id: true,
      username: true,
      email: true,
      no_hp: true,
    },
  },
  items: {
    orderBy: {
      id: "asc",
    },
    include: {
      variant: {
        select: {
          id: true,
          spare_part_id: true,
          name: true,
          sku: true,
          price: true,
        },
      },
    },
  },
  payments: {
    orderBy: {
      id: "asc",
    },
  },
};

const saleListInclude = {
  cashier: {
    select: {
      id: true,
      username: true,
    },
  },
  customer: {
    select: {
      id: true,
      username: true,
      email: true,
      no_hp: true,
    },
  },
  _count: {
    select: {
      items: true,
      payments: true,
    },
  },
};

export async function createSale(tx, data) {
  return tx.sale.create({
    data,
  });
}

export async function updateSale(tx, id, data) {
  return tx.sale.update({
    where: {
      id: Number(id),
    },
    data,
  });
}

export async function findSaleById(id) {
  return prisma.sale.findUnique({
    where: {
      id: Number(id),
    },
    include: saleInclude,
  });
}

export async function findSaleByInvoiceNumber(invoiceNumber) {
  return prisma.sale.findUnique({
    where: {
      invoice_number: invoiceNumber,
    },
  });
}

export async function findSaleByMidtransOrderId(orderId) {
  return prisma.sale.findFirst({
    where: {
      midtrans_order_id: orderId,
    },
    include: saleInclude,
  });
}

export async function findSales({ where = {}, skip = 0, take = 20 } = {}) {
  return prisma.sale.findMany({
    where,
    skip,
    take,
    orderBy: {
      created_at: "desc",
    },
    include: saleListInclude,
  });
}

export async function countSales(where = {}) {
  return prisma.sale.count({
    where,
  });
}

export async function createSalePayment(tx, data) {
  return tx.salePayment.create({
    data,
  });
}

export async function createManySaleItems(tx, data) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      count: 0,
    };
  }

  return tx.saleItem.createMany({
    data,
  });
}

export async function findCashierCustomerById(id) {
  return prisma.user.findUnique({
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

export async function findCashierById(id) {
  return prisma.user.findUnique({
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

export async function getCashierProducts({
  search = "",
  brands = [],
  categories = [],
  page = 1,
  perPage = 20,
} = {}) {
  const normalizedSearch = String(search ?? "").trim();
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = Math.max(1, Number(perPage) || 20);

  // Mendukung array ID maupun string "1,2,3"
  const normalizeIds = (value) => {
    const values = Array.isArray(value)
      ? value
      : String(value ?? "").trim()
        ? String(value).split(",")
        : [];

    return values.map(Number);
  };

  const brandIds = normalizeIds(brands);
  const categoryIds = normalizeIds(categories);

  const where = {
    status: true,
  };

  const andConditions = [];

  // Filter berdasarkan banyak brand
  if (brandIds.length > 0) {
    andConditions.push({
      spare_part: {
        is: {
          brand_id: {
            in: brandIds,
          },
        },
      },
    });
  }

  // Filter berdasarkan banyak kategori
  if (categoryIds.length > 0) {
    andConditions.push({
      spare_part: {
        is: {
          category_id: {
            in: categoryIds,
          },
        },
      },
    });
  }

  // Multi-search: setiap kata kunci wajib cocok pada salah satu kolom
  const searchTerms = normalizedSearch.split(/[,\s]+/).filter(Boolean);

  const contains = (field, term) => ({
    [field]: {
      contains: term,
    },
  });

  for (const term of searchTerms) {
    andConditions.push({
      OR: [
        // Data varian
        contains("name", term),
        contains("sku", term),

        // Data produk
        {
          spare_part: {
            is: {
              OR: [
                contains("name", term),
                contains("slug", term),
                contains("sku", term),
                contains("part_number", term),
                contains("description", term),
                contains("short_description", term),

                // Brand
                {
                  brand: {
                    is: {
                      OR: [
                        contains("name", term),
                        contains("slug", term),
                        contains("logo_url", term),
                        contains("description", term),
                      ],
                    },
                  },
                },

                // Category
                {
                  category: {
                    is: {
                      OR: [
                        contains("name", term),
                        contains("slug", term),
                        contains("description", term),
                        contains("image_url", term),
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const [items, total] = await Promise.all([
    prisma.sparePartVariant.findMany({
      where,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      orderBy: {
        id: "desc",
      },
      include: {
        stock: true,
        spare_part: {
          include: {
            // Gambar dari spare_part_images berdasarkan spare_part_id
            images: {
              orderBy: [
                { is_primary: "desc" },
                { sort_order: "asc" },
                { id: "asc" },
              ],
              select: {
                id: true,
                spare_part_id: true,
                image_url: true,
                sort_order: true,
                is_primary: true,
              },
            },

            brand: {
              select: {
                name: true,
                slug: true,
                logo_url: true,
                description: true,
              },
            },

            category: {
              select: {
                name: true,
                slug: true,
                description: true,
                image_url: true,
              },
            },
          },
        },
      },
    }),

    prisma.sparePartVariant.count({
      where,
    }),
  ]);

  return {
    items,
    meta: {
      current_page: currentPage,
      per_page: pageSize,
      total_items: total,
      total_pages: Math.ceil(total / pageSize),
    },
  };
}

export async function createCashierCheckoutTransaction({
  variantIds,
  buildCheckout,
}) {
  return prisma.$transaction(
    async (tx) => {
      const uniqueVariantIds = [...new Set(variantIds.map(Number))];

      const variants = await tx.sparePartVariant.findMany({
        where: {
          id: {
            in: uniqueVariantIds,
          },
          status: true,
        },
        include: {
          stock: true,
        },
      });

      if (variants.length !== uniqueVariantIds.length) {
        throw createModelError(
          "One or more spare part variants were not found or are inactive.",
          422,
        );
      }

      const checkout = buildCheckout(variants);

      const sale = await tx.sale.create({
        data: checkout.saleData,
      });

      await createManySaleItems(
        tx,
        checkout.saleItems.map((item) => ({
          ...item,
          sale_id: sale.id,
        })),
      );

      for (const item of checkout.saleItems) {
        const stock = await tx.sparePartStock.findUnique({
          where: {
            variant_id: item.variant_id,
          },
        });

        if (!stock) {
          throw createModelError(
            `Stock for variant ID ${item.variant_id} was not found.`,
            422,
          );
        }

        const availableStock =
          toNumber(stock.stock) - toNumber(stock.reserved_stock);

        if (availableStock < item.quantity) {
          throw createModelError(
            `Insufficient stock for variant ID ${item.variant_id}.`,
            422,
          );
        }

        const result = await tx.sparePartStock.updateMany({
          where: {
            variant_id: item.variant_id,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (result.count !== 1) {
          throw createModelError(
            `Failed to update stock for variant ID ${item.variant_id}.`,
            409,
          );
        }
      }

      if (checkout.paymentData) {
        await createSalePayment(tx, {
          ...checkout.paymentData,
          sale_id: sale.id,
        });
      }

      return {
        saleId: sale.id,
        result: checkout.result,
      };
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

export async function findSaleForCancellation(id) {
  return prisma.sale.findUnique({
    where: {
      id: Number(id),
    },
    select: {
      id: true,
      invoice_number: true,
      status: true,
      payment_status: true,
      payment_fee: true,
      grand_total: true,
      paid_amount: true,
      notes: true,
      midtrans_order_id: true,
      midtrans_transaction_id: true,
      midtrans_payment_type: true,
      midtrans_transaction_status: true,
      updated_at: true,
      items: {
        select: {
          variant_id: true,
          quantity: true,
        },
      },
    },
  });
}

export async function findSaleForCancellationTransaction(tx, id) {
  return tx.sale.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      items: {
        select: {
          variant_id: true,
          quantity: true,
        },
      },
    },
  });
}

async function restoreSaleStock(tx, items) {
  for (const item of items) {
    const result = await tx.sparePartStock.updateMany({
      where: {
        variant_id: item.variant_id,
      },
      data: {
        stock: {
          increment: item.quantity,
        },
      },
    });

    if (result.count !== 1) {
      throw createModelError(
        `Failed to restore stock for variant ID ${item.variant_id}.`,
        409,
      );
    }
  }
}

export async function updateSaleCancellation(tx, id, data) {
  return tx.sale.update({
    where: {
      id: Number(id),
    },
    data,
  });
}

export async function cancelUnpaidSaleTransaction(id, notes) {
  return prisma.$transaction(
    async (tx) => {
      const sale = await findSaleForCancellationTransaction(tx, id);

      if (!sale) {
        throw createModelError("Sale transaction not found.", 404);
      }

      if (sale.status === "cancelled") {
        return sale;
      }

      if (sale.payment_status === "paid") {
        throw createModelError(
          "Paid sale cannot be cancelled as an unpaid sale.",
          422,
        );
      }

      if (
        sale.midtrans_transaction_status === "settlement" ||
        sale.midtrans_transaction_status === "capture"
      ) {
        throw createModelError(
          "A completed Midtrans payment cannot be rolled back as unpaid.",
          422,
        );
      }

      await restoreSaleStock(tx, sale.items);

      return updateSaleCancellation(tx, sale.id, {
        status: "cancelled",
        payment_status: "unpaid",
        notes,
      });
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

export async function cancelCashierSaleTransaction(id, notes) {
  return prisma.$transaction(
    async (tx) => {
      const sale = await findSaleForCancellationTransaction(tx, id);

      if (!sale) {
        throw createModelError("Sale transaction not found.", 404);
      }

      if (sale.status === "cancelled") {
        return sale;
      }

      if (sale.status === "refunded") {
        throw createModelError(
          "Refunded sale transaction cannot be cancelled.",
          422,
        );
      }

      await restoreSaleStock(tx, sale.items);

      return updateSaleCancellation(tx, sale.id, {
        status: "cancelled",
        notes,
      });
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

export async function updateSaleMidtransData(id, data) {
  return prisma.sale.update({
    where: {
      id: Number(id),
    },
    data,
  });
}

export async function updateSaleMidtransDataByOrderId(orderId, data) {
  return prisma.sale.updateMany({
    where: {
      midtrans_order_id: orderId,
    },
    data,
  });
}

export async function updateSaleMidtransTransaction({
  orderId,
  transactionId,
  transactionStatus,
  paymentType,
  paymentStatus,
  paidAmount,
  notes,
}) {
  return prisma.$transaction(
    async (tx) => {
      const sale = await tx.sale.findFirst({
        where: {
          midtrans_order_id: orderId,
        },
        include: {
          payments: true,
        },
      });

      if (!sale) {
        throw createModelError(
          `Sale with Midtrans order ID "${orderId}" was not found.`,
          404,
        );
      }

      const alreadyPaid =
        sale.payment_status === "paid" ||
        sale.midtrans_transaction_status === "settlement";

      const isSuccessfulPayment =
        transactionStatus === "settlement" || transactionStatus === "capture";

      if (alreadyPaid && !isSuccessfulPayment) {
        return sale;
      }

      const updateData = {
        midtrans_transaction_id: transactionId ?? sale.midtrans_transaction_id,
        midtrans_transaction_status:
          transactionStatus ?? sale.midtrans_transaction_status,
        midtrans_payment_type: paymentType ?? sale.midtrans_payment_type,
      };

      if (isSuccessfulPayment) {
        updateData.payment_status = "paid";
        updateData.paid_amount =
          paidAmount === undefined || paidAmount === null
            ? toNumber(sale.grand_total) + toNumber(sale.payment_fee)
            : toNumber(paidAmount);
      } else if (
        transactionStatus === "pending" &&
        sale.payment_status !== "paid"
      ) {
        updateData.payment_status = "unpaid";
      } else if (
        transactionStatus === "expire" ||
        transactionStatus === "cancel" ||
        transactionStatus === "deny"
      ) {
        updateData.payment_status = "unpaid";
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const updatedSale = await tx.sale.update({
        where: {
          id: sale.id,
        },
        data: updateData,
      });

      if (isSuccessfulPayment && sale.payments.length === 0) {
        await tx.salePayment.create({
          data: {
            sale_id: sale.id,
            payment_method: paymentType || "transfer",
            amount:
              paidAmount === undefined || paidAmount === null
                ? toNumber(sale.grand_total) + toNumber(sale.payment_fee)
                : toNumber(paidAmount),
            reference_number: transactionId ?? orderId,
            paid_at: new Date(),
          },
        });
      }

      return updatedSale;
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

export async function findSaleForMidtransNotification(orderId) {
  return prisma.sale.findFirst({
    where: {
      midtrans_order_id: orderId,
    },
    include: {
      items: true,
      payments: true,
    },
  });
}

export async function findSaleForMidtransSnap(saleId, client = prisma) {
  return client.sale.findUnique({
    where: { id: Number(saleId) },
    include: {
      customer: {
        select: {
          id: true,
          username: true,
          email: true,
          no_hp: true,
        },
      },
      items: {
        orderBy: { id: "asc" },
      },
      payments: true,
    },
  });
}

export async function updateSaleMidtransOrder(
  saleId,
  orderId,
  clearTransaction = false,
  client = prisma,
) {
  return client.sale.update({
    where: { id: Number(saleId) },
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

export async function prepareSaleForMidtransRetry(saleId) {
  return prisma.$transaction(
    async (tx) => {
      const id = Number(saleId);

      const sale = await tx.sale.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: { id: "asc" },
          },
        },
      });

      if (!sale) {
        throw createModelError("Sale not found.", 404);
      }

      if (
        sale.status !== "cancelled" ||
        !["cancel", "expire", "deny"].includes(sale.midtrans_transaction_status)
      ) {
        throw createModelError("Sale is not eligible for payment retry.", 422);
      }

      const claimed = await tx.sale.updateMany({
        where: {
          id,
          status: "cancelled",
          payment_status: { not: "paid" },
          midtrans_transaction_status: {
            in: ["cancel", "expire", "deny"],
          },
        },
        data: {
          status: "completed",
          payment_status: "unpaid",
          midtrans_transaction_id: null,
          midtrans_payment_type: null,
          midtrans_transaction_status: null,
        },
      });

      if (claimed.count !== 1) {
        throw createModelError(
          "Sale payment retry is already being processed. Please try again.",
          409,
        );
      }

      for (const item of sale.items || []) {
        const quantity = Number(item.quantity) || 0;

        if (quantity <= 0) {
          continue;
        }

        const stock = await tx.sparePartStock.findUnique({
          where: {
            variant_id: item.variant_id,
          },
        });

        if (!stock) {
          throw createModelError(
            `Stock not found for variant ${item.variant_id}.`,
            422,
          );
        }

        const availableStock =
          Number(stock.stock || 0) - Number(stock.reserved_stock || 0);

        if (availableStock < quantity) {
          throw createModelError(
            `Insufficient stock for ${item.name || `variant ${item.variant_id}`}. Available: ${availableStock}, required: ${quantity}.`,
            422,
          );
        }

        const updatedStock = await tx.sparePartStock.updateMany({
          where: {
            variant_id: item.variant_id,
            stock: {
              gte: quantity,
            },
          },
          data: {
            stock: {
              decrement: quantity,
            },
          },
        });

        if (updatedStock.count !== 1) {
          throw createModelError(
            `Failed to reserve stock for ${item.name || `variant ${item.variant_id}`}.`,
            409,
          );
        }
      }

      return tx.sale.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              username: true,
              email: true,
              no_hp: true,
            },
          },
          items: {
            orderBy: { id: "asc" },
          },
          payments: true,
        },
      });
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

export async function processSaleMidtransNotification(orderId, notification) {
  return prisma.$transaction(
    async (tx) => {
      const sale = await tx.sale.findFirst({
        where: {
          midtrans_order_id: orderId,
        },
        include: {
          items: true,
          payments: true,
        },
      });

      if (!sale) {
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

      if (sale.status === "refunded" || sale.payment_status === "paid") {
        return sale;
      }

      if (sale.status === "cancelled") {
        return sale;
      }

      if (
        transactionStatus === "capture" &&
        notification.fraud_status !== "accept"
      ) {
        return tx.sale.update({
          where: { id: sale.id },
          data: transactionData,
        });
      }

      if (
        transactionStatus === "capture" ||
        transactionStatus === "settlement"
      ) {
        const paymentAmount = Math.round(
          Number(notification.gross_amount) || 0,
        );

        if (paymentAmount <= 0) {
          throw createModelError("Invalid Midtrans payment amount.", 422);
        }

        const existingPayment = sale.payments?.find(
          (payment) => payment.reference_number === transactionId,
        );

        if (!existingPayment) {
          await tx.salePayment.create({
            data: {
              sale_id: sale.id,
              payment_method: getMidtransSalePaymentMethod(paymentType),
              amount: paymentAmount,
              reference_number: transactionId || orderId,
              paid_at: new Date(),
            },
          });
        }

        return tx.sale.update({
          where: { id: sale.id },
          data: {
            paid_amount: paymentAmount,
            change_amount: 0,
            payment_status: "paid",
            status: "completed",
            ...transactionData,
          },
        });
      }

      if (transactionStatus === "pending") {
        return tx.sale.update({
          where: { id: sale.id },
          data: transactionData,
        });
      }

      if (["expire", "cancel", "deny"].includes(transactionStatus)) {
        const claimed = await tx.sale.updateMany({
          where: {
            id: sale.id,
            status: { not: "cancelled" },
            payment_status: { not: "paid" },
          },
          data: {
            status: "cancelled",
            payment_status: "unpaid",
            notes: "Transaction cancelled.",
            ...transactionData,
          },
        });

        if (claimed.count !== 1) {
          return tx.sale.findUnique({
            where: { id: sale.id },
            include: {
              items: true,
              payments: true,
            },
          });
        }

        for (const item of sale.items || []) {
          const quantity = Number(item.quantity) || 0;

          if (quantity <= 0) {
            continue;
          }

          const restored = await tx.sparePartStock.updateMany({
            where: {
              variant_id: item.variant_id,
            },
            data: {
              stock: {
                increment: quantity,
              },
            },
          });

          if (restored.count !== 1) {
            throw createModelError(
              `Failed to restore stock for variant ID ${item.variant_id}.`,
              409,
            );
          }
        }

        return tx.sale.findUnique({
          where: { id: sale.id },
          include: {
            items: true,
            payments: true,
          },
        });
      }

      return tx.sale.update({
        where: { id: sale.id },
        data: transactionData,
      });
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

function getMidtransSalePaymentMethod(paymentType) {
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
