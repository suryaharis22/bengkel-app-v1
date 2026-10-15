import {
  findSaleById,
  findSaleByInvoiceNumber,
  findSales,
  countSales,
  getCashierProducts as getCashierProductsModel,
  findCashierCustomerById,
  findCashierById,
  createCashierCheckoutTransaction,
  cancelUnpaidSaleTransaction,
  findSaleForCancellation,
  cancelCashierSaleTransaction,
} from "@/models/sale.model";

import {
  createMidtransSnapTransaction,
  cancelMidtransTransaction,
  refundMidtransTransaction,
} from "@/services/midtrans.service";

function createServiceError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function calculatePaymentFee(paymentMethod, grandTotal) {
  const amount = roundMoney(grandTotal);

  switch (paymentMethod) {
    case "qris":
      return roundMoney(amount * 0.007);
    case "ewallet":
      return roundMoney(amount * 0.02);
    case "transfer":
      return 4000;
    case "cash":
    case "debit":
    default:
      return 0;
  }
}

function isMidtransPaymentMethod(paymentMethod) {
  return ["qris", "ewallet", "transfer", "debit"].includes(paymentMethod);
}

function serializeSale(sale) {
  if (!sale) {
    return null;
  }

  const grandTotal = toNumber(sale.grand_total);
  const paymentFee = toNumber(sale.payment_fee);

  return {
    id: sale.id,
    invoice_number: sale.invoice_number,
    cashier: sale.cashier
      ? {
          id: sale.cashier.id,
          username: sale.cashier.username,
          email: sale.cashier.email ?? null,
          no_hp: sale.cashier.no_hp ?? null,
        }
      : null,
    customer: sale.customer
      ? {
          id: sale.customer.id,
          username: sale.customer.username,
          email: sale.customer.email ?? null,
          no_hp: sale.customer.no_hp ?? null,
        }
      : null,
    customer_name: sale.customer_name ?? null,
    customer_phone: sale.customer_phone ?? null,
    subtotal: toNumber(sale.subtotal),
    discount: toNumber(sale.discount),
    tax: toNumber(sale.tax),
    grand_total: grandTotal,
    payment_fee: paymentFee,
    amount_to_pay: roundMoney(grandTotal + paymentFee),
    paid_amount: toNumber(sale.paid_amount),
    change_amount: toNumber(sale.change_amount),
    payment_status: sale.payment_status,
    status: sale.status,
    midtrans_order_id: sale.midtrans_order_id ?? null,
    midtrans_transaction_id: sale.midtrans_transaction_id ?? null,
    midtrans_payment_type: sale.midtrans_payment_type ?? null,
    midtrans_transaction_status: sale.midtrans_transaction_status ?? null,
    notes: sale.notes ?? null,
    created_at: sale.created_at,
    updated_at: sale.updated_at,
    items: sale.items
      ? sale.items.map((item) => ({
          id: item.id,
          variant_id: item.variant_id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: toNumber(item.unit_price),
          discount: toNumber(item.discount),
          subtotal: toNumber(item.subtotal),
          variant: item.variant
            ? {
                id: item.variant.id,
                spare_part_id: item.variant.spare_part_id,
                name: item.variant.name,
                sku: item.variant.sku,
                price: toNumber(item.variant.price),
              }
            : null,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }))
      : undefined,
    payments: sale.payments
      ? sale.payments.map((payment) => ({
          id: payment.id,
          payment_method: payment.payment_method,
          amount: toNumber(payment.amount),
          reference_number: payment.reference_number ?? null,
          paid_at: payment.paid_at,
          created_at: payment.created_at,
        }))
      : undefined,
  };
}

function serializeSaleList(sale) {
  const grandTotal = toNumber(sale.grand_total);
  const paymentFee = toNumber(sale.payment_fee);

  return {
    id: sale.id,
    invoice_number: sale.invoice_number,
    cashier: sale.cashier
      ? {
          id: sale.cashier.id,
          username: sale.cashier.username,
        }
      : null,
    customer: sale.customer
      ? {
          id: sale.customer.id,
          username: sale.customer.username,
          email: sale.customer.email ?? null,
          no_hp: sale.customer.no_hp ?? null,
        }
      : null,
    customer_name: sale.customer_name ?? null,
    customer_phone: sale.customer_phone ?? null,
    subtotal: toNumber(sale.subtotal),
    discount: toNumber(sale.discount),
    tax: toNumber(sale.tax),
    grand_total: grandTotal,
    payment_fee: paymentFee,
    amount_to_pay: roundMoney(grandTotal + paymentFee),
    paid_amount: toNumber(sale.paid_amount),
    change_amount: toNumber(sale.change_amount),
    payment_status: sale.payment_status,
    status: sale.status,
    midtrans_order_id: sale.midtrans_order_id ?? null,
    midtrans_transaction_id: sale.midtrans_transaction_id ?? null,
    midtrans_payment_type: sale.midtrans_payment_type ?? null,
    midtrans_transaction_status: sale.midtrans_transaction_status ?? null,
    notes: sale.notes ?? null,
    total_items: sale._count?.items ?? 0,
    total_payments: sale._count?.payments ?? 0,
    created_at: sale.created_at,
    updated_at: sale.updated_at,
  };
}

function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const timestamp = Date.now().toString().slice(-6);

  return `INV-${year}${month}${day}-${timestamp}`;
}

async function generateUniqueInvoiceNumber() {
  let invoiceNumber;
  let exists = true;

  while (exists) {
    invoiceNumber = generateInvoiceNumber();
    exists = Boolean(await findSaleByInvoiceNumber(invoiceNumber));
  }

  return invoiceNumber;
}

export async function getCashierProducts({
  search = "",
  brands = "",
  categories = "",
  page = 1,
  perPage = 20,
} = {}) {
  try {
    const parseIds = (value, fieldName) => {
      const values = Array.isArray(value)
        ? value
        : String(value ?? "").trim()
          ? String(value).split(",")
          : [];

      const ids = values.map((value) => {
        const normalized = String(value).trim();

        if (!/^[1-9]\d*$/.test(normalized)) {
          throw createServiceError(
            `${fieldName} must contain positive integer IDs.`,
            400,
          );
        }

        const id = Number(normalized);

        if (!Number.isSafeInteger(id)) {
          throw createServiceError(`${fieldName} contains an invalid ID.`, 400);
        }

        return id;
      });

      return [...new Set(ids)];
    };

    const brandIds = parseIds(brands, "Brands");
    const categoryIds = parseIds(categories, "Categories");

    return await getCashierProductsModel({
      search: String(search ?? "").trim(),
      brands: brandIds,
      categories: categoryIds,
      page: Math.max(1, Number(page) || 1),
      perPage: Math.min(100, Math.max(1, Number(perPage) || 20)),
    });
  } catch (error) {
    console.error("getCashierProducts error:", error);

    if (error?.statusCode) {
      throw error;
    }

    throw createServiceError(
      error?.message || "Failed to retrieve cashier products.",
      500,
    );
  }
}
async function validateCustomer(customerId) {
  if (customerId === null || customerId === undefined || customerId === "") {
    return null;
  }

  const normalizedCustomerId = Number(customerId);

  if (!Number.isInteger(normalizedCustomerId) || normalizedCustomerId <= 0) {
    throw createServiceError("Invalid customer ID.", 422);
  }

  const customer = await findCashierCustomerById(normalizedCustomerId);

  if (!customer) {
    throw createServiceError("Customer not found.", 404);
  }

  if (customer.role !== "customer") {
    throw createServiceError("Selected user is not a customer.", 422);
  }

  return customer;
}

function calculateCheckout(items, variants, discount, tax) {
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
  const saleItems = [];
  let subtotal = 0;

  for (const item of items) {
    const variant = variantMap.get(Number(item.variant_id));

    if (!variant) {
      throw createServiceError(
        `Spare part variant with ID ${item.variant_id} was not found.`,
        404,
      );
    }

    if (!variant.stock) {
      throw createServiceError(
        `Stock has not been configured for ${variant.name}.`,
        422,
      );
    }

    const availableStock =
      toNumber(variant.stock.stock) - toNumber(variant.stock.reserved_stock);

    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw createServiceError(`Invalid quantity for ${variant.name}.`, 422);
    }

    if (quantity > availableStock) {
      throw createServiceError(
        `Insufficient stock for ${variant.name}. Available stock: ${availableStock}.`,
        422,
      );
    }

    const unitPrice = roundMoney(toNumber(variant.price));
    const itemSubtotal = roundMoney(unitPrice * quantity);

    subtotal = roundMoney(subtotal + itemSubtotal);

    saleItems.push({
      variant_id: variant.id,
      name: variant.name,
      sku: variant.sku,
      quantity,
      unit_price: unitPrice,
      discount: 0,
      subtotal: itemSubtotal,
    });
  }

  const normalizedDiscount = roundMoney(discount);
  const normalizedTax = roundMoney(tax);

  if (!Number.isFinite(normalizedDiscount) || !Number.isFinite(normalizedTax)) {
    throw createServiceError("Invalid discount or tax amount.", 422);
  }

  if (normalizedDiscount < 0) {
    throw createServiceError("Discount cannot be negative.", 422);
  }

  if (normalizedTax < 0) {
    throw createServiceError("Tax cannot be negative.", 422);
  }

  if (normalizedDiscount > subtotal) {
    throw createServiceError("Discount cannot be greater than subtotal.", 422);
  }

  const taxableAmount = roundMoney(subtotal - normalizedDiscount);
  const grandTotal = roundMoney(taxableAmount + normalizedTax);

  return {
    saleItems,
    subtotal,
    discount: normalizedDiscount,
    tax: normalizedTax,
    grandTotal,
  };
}

export async function checkoutCashier({
  cashierId,
  customerId = null,
  customerName = null,
  customerPhone = null,
  discount = 0,
  tax = 0,
  notes = null,
  items,
  payment,
}) {
  if (!cashierId) {
    throw createServiceError("Cashier ID is required.", 401);
  }

  const normalizedCashierId = Number(cashierId);

  if (!Number.isInteger(normalizedCashierId) || normalizedCashierId <= 0) {
    throw createServiceError("Invalid cashier ID.", 422);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw createServiceError("At least one sale item is required.", 422);
  }

  if (!payment?.payment_method) {
    throw createServiceError("Payment method is required.", 422);
  }

  const cashier = await findCashierById(normalizedCashierId);

  if (!cashier) {
    throw createServiceError("Cashier not found.", 404);
  }

  if (cashier.role !== "admin") {
    throw createServiceError(
      "Only admin can perform cashier transactions.",
      403,
    );
  }

  const paymentMethod = String(payment.payment_method).toLowerCase();
  const isCash = paymentMethod === "cash";
  const isMidtrans = isMidtransPaymentMethod(paymentMethod);

  if (!isCash && !isMidtrans) {
    throw createServiceError(
      `Unsupported payment method: ${paymentMethod}.`,
      422,
    );
  }

  const normalizedItems = items.map((item) => ({
    variant_id: Number(item.variant_id),
    quantity: Number(item.quantity),
  }));

  for (const item of normalizedItems) {
    if (
      !Number.isInteger(item.variant_id) ||
      item.variant_id <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw createServiceError("Invalid sale item or quantity.", 422);
    }
  }

  const variantIds = normalizedItems.map((item) => item.variant_id);

  if (new Set(variantIds).size !== variantIds.length) {
    throw createServiceError(
      "Duplicate spare part variant is not allowed.",
      422,
    );
  }

  const customer = await validateCustomer(customerId);
  const invoiceNumber = await generateUniqueInvoiceNumber();

  let transactionResult;

  try {
    transactionResult = await createCashierCheckoutTransaction({
      variantIds,
      buildCheckout: (variants) => {
        const calculation = calculateCheckout(
          normalizedItems,
          variants,
          discount,
          tax,
        );

        const paymentFee = calculatePaymentFee(
          paymentMethod,
          calculation.grandTotal,
        );

        const amountToPay = roundMoney(calculation.grandTotal + paymentFee);

        let paymentAmount = 0;
        let changeAmount = 0;

        if (isCash) {
          paymentAmount = Number(payment.amount);

          if (!Number.isFinite(paymentAmount) || paymentAmount < amountToPay) {
            throw createServiceError(
              `Payment amount is less than the required amount of ${amountToPay}.`,
              422,
            );
          }

          paymentAmount = roundMoney(paymentAmount);
          changeAmount = roundMoney(paymentAmount - amountToPay);
        }

        return {
          saleData: {
            invoice_number: invoiceNumber,
            cashier_id: normalizedCashierId,
            customer_id: customer?.id ?? null,
            customer_name:
              String(customerName ?? "").trim() || customer?.username || null,
            customer_phone:
              String(customerPhone ?? "").trim() || customer?.no_hp || null,
            subtotal: calculation.subtotal,
            discount: calculation.discount,
            tax: calculation.tax,
            grand_total: calculation.grandTotal,
            payment_fee: paymentFee,
            paid_amount: isCash ? paymentAmount : 0,
            change_amount: changeAmount,
            payment_status: isCash ? "paid" : "unpaid",
            status: "completed",
            midtrans_order_id: isMidtrans ? invoiceNumber : null,
            notes: String(notes ?? "").trim() || null,
          },
          saleItems: calculation.saleItems,
          paymentData: isCash
            ? {
                payment_method: "cash",
                amount: paymentAmount,
                reference_number:
                  String(payment.reference_number ?? "").trim() || null,
                paid_at: new Date(),
              }
            : null,
          result: {
            isCash,
            isMidtrans,
            paymentMethod,
            paymentFee,
            amountToPay,
            paymentAmount,
            changeAmount,
          },
        };
      },
    });

    const saleId = transactionResult?.saleId;

    if (!saleId) {
      throw createServiceError(
        "Created sale transaction could not be identified.",
        500,
      );
    }

    const sale = await findSaleById(saleId);

    if (!sale) {
      throw createServiceError(
        "Created sale transaction could not be retrieved.",
        500,
      );
    }

    const checkoutResult = transactionResult.result ?? transactionResult;

    if (checkoutResult.isCash) {
      return {
        ...serializeSale(sale),
        payment_method: checkoutResult.paymentMethod,
        snap_token: null,
        redirect_url: null,
        payment: {
          method: checkoutResult.paymentMethod,
          status: "paid",
          payment_fee: checkoutResult.paymentFee,
          amount_to_pay: checkoutResult.amountToPay,
          paid_amount: checkoutResult.paymentAmount,
          change_amount: checkoutResult.changeAmount,
          snap_token: null,
          redirect_url: null,
        },
      };
    }

    const midtransResult = await createMidtransSnapTransaction({
      sale,
      customer: sale.customer,
    });

    return {
      ...serializeSale(sale),
      payment_method: checkoutResult.paymentMethod,
      snap_token: midtransResult.token,
      redirect_url: midtransResult.redirect_url,
      payment: {
        method: checkoutResult.paymentMethod,
        status: "pending",
        payment_fee: checkoutResult.paymentFee,
        amount_to_pay: checkoutResult.amountToPay,
        paid_amount: 0,
        change_amount: 0,
        snap_token: midtransResult.token,
        redirect_url: midtransResult.redirect_url,
      },
    };
  } catch (error) {
    const saleId = transactionResult?.saleId;

    if (isMidtrans && saleId) {
      try {
        await cancelUnpaidSaleTransaction(
          saleId,
          "Midtrans transaction could not be created. Transaction cancelled automatically.",
        );
      } catch (rollbackError) {
        console.error("Failed to rollback Midtrans sale:", rollbackError);
      }
    }

    if (error?.statusCode) {
      throw error;
    }

    console.error("checkoutCashier error:", error);

    throw createServiceError(
      error?.message || "Failed to complete cashier transaction.",
      500,
    );
  }
}

export async function getCashierSales({
  search = "",
  status,
  paymentStatus,
  page = 1,
  perPage = 20,
  dateFrom,
  dateTo,
}) {
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = Math.max(1, Number(perPage) || 20);
  const normalizedSearch = String(search ?? "").trim();
  const where = {};

  if (normalizedSearch) {
    where.OR = [
      {
        invoice_number: {
          contains: normalizedSearch,
        },
      },
      {
        customer_name: {
          contains: normalizedSearch,
        },
      },
      {
        customer_phone: {
          contains: normalizedSearch,
        },
      },
      {
        cashier: {
          username: {
            contains: normalizedSearch,
          },
        },
      },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (paymentStatus) {
    where.payment_status = paymentStatus;
  }

  if (dateFrom || dateTo) {
    where.created_at = {};

    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00`);

      if (Number.isNaN(from.getTime())) {
        throw createServiceError("Invalid start date.", 422);
      }

      where.created_at.gte = from;
    }

    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59.999`);

      if (Number.isNaN(to.getTime())) {
        throw createServiceError("Invalid end date.", 422);
      }

      where.created_at.lte = to;
    }
  }

  const skip = (currentPage - 1) * pageSize;

  const [sales, totalItems] = await Promise.all([
    findSales({
      where,
      skip,
      take: pageSize,
    }),
    countSales(where),
  ]);

  return {
    items: sales.map(serializeSaleList),
    meta: {
      current_page: currentPage,
      per_page: pageSize,
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / pageSize),
    },
  };
}

export async function getCashierSaleDetail(id) {
  const saleId = Number(id);

  if (!Number.isInteger(saleId) || saleId <= 0) {
    throw createServiceError("Invalid sale transaction ID.", 422);
  }

  const sale = await findSaleById(saleId);

  if (!sale) {
    throw createServiceError("Sale transaction not found.", 404);
  }

  return serializeSale(sale);
}

export async function cancelCashierSale({ id, notes = null }) {
  const saleId = Number(id);

  if (!Number.isInteger(saleId) || saleId <= 0) {
    throw createServiceError("Invalid sale transaction ID.", 422);
  }

  const sale = await findSaleForCancellation(saleId);

  if (!sale) {
    throw createServiceError("Sale transaction not found.", 404);
  }

  if (sale.status === "cancelled") {
    return {
      id: sale.id,
      invoice_number: sale.invoice_number,
      status: sale.status,
      payment_status: sale.payment_status,
      notes: sale.notes,
      updated_at: sale.updated_at,
    };
  }

  if (sale.status === "refunded") {
    throw createServiceError(
      "Refunded sale transaction cannot be cancelled.",
      422,
    );
  }

  const hasMidtransTransaction =
    Boolean(sale.midtrans_order_id) || Boolean(sale.midtrans_transaction_id);

  if (hasMidtransTransaction) {
    const orderId = sale.midtrans_order_id;

    if (!orderId) {
      throw createServiceError(
        "Midtrans order ID is missing for this transaction.",
        422,
      );
    }

    const midtransStatus = sale.midtrans_transaction_status;

    if (midtransStatus === "settlement") {
      await refundMidtransTransaction(orderId, {
        reason:
          String(notes ?? "").trim() ||
          `Refund for cancelled sale ${sale.invoice_number}`,
      });
    } else if (midtransStatus === "capture" || midtransStatus === "pending") {
      await cancelMidtransTransaction(orderId);
    } else if (
      midtransStatus === "cancel" ||
      midtransStatus === "expire" ||
      midtransStatus === "deny"
    ) {
      // Transaksi Midtrans sudah tidak aktif.
    } else if (midtransStatus === "refund") {
      throw createServiceError(
        "Midtrans transaction has already been refunded.",
        422,
      );
    } else {
      throw createServiceError(
        midtransStatus
          ? `Midtrans transaction cannot be cancelled from status "${midtransStatus}".`
          : "Midtrans transaction status is unavailable. Cancellation was not processed.",
        422,
      );
    }
  }

  const updatedSale = await cancelCashierSaleTransaction(
    saleId,
    String(notes ?? "").trim() || "Transaction cancelled.",
  );

  return {
    id: updatedSale.id,
    invoice_number: updatedSale.invoice_number,
    status: updatedSale.status,
    payment_status: updatedSale.payment_status,
    notes: updatedSale.notes,
    updated_at: updatedSale.updated_at,
  };
}
