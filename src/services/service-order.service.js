import {
  findServiceOrderById,
  findServiceOrders,
  countServiceOrders,
  updateServiceOrder,
  deleteServiceOrder as deleteServiceOrderModel,
  findVehicleById,
  findVehicleServiceOrders,
  countVehicleServiceOrders,
  findTechnicianVehicleServiceOrders,
  findServicePayments,
  findServicePaymentsByOrderIds,
  createServiceOrderItem,
  findServiceOrderItemById,
  updateServiceOrderItem,
  deleteServiceOrderItem,
  createServiceOrderSparePart,
  findServiceOrderSparePartById,
  updateServiceOrderSparePart as updateServiceOrderSparePartModel,
  deleteServiceOrderSparePart,
  findWorkshopServiceById,
  findSparePartVariantById,
  findUserById,
  calculateServiceOrderItemSubtotal,
  calculateServiceOrderSparePartSubtotal,
  findServiceOrderTotals,
  updateServiceOrderTotals,
  withServiceOrderTransaction,
} from "@/models/service-order.model";

function createServiceError(
  message,
  status = 400,
  code = "SERVICE_ORDER_ERROR",
) {
  const error = new Error(message);
  error.status = status;
  error.statusCode = status;
  error.code = code;
  return error;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeId(value, label = "ID") {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(`${label} is invalid.`, 400, "INVALID_ID");
  }

  return id;
}

function normalizePagination(params = {}) {
  const page = Math.max(1, Math.trunc(toNumber(params.page, 1)));
  const perPage = Math.min(
    100,
    Math.max(1, Math.trunc(toNumber(params.per_page ?? params.perPage, 20))),
  );

  return {
    page,
    per_page: perPage,
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

function buildPaginationMeta(page, perPage, total) {
  return {
    page,
    per_page: perPage,
    total,
    total_pages: Math.ceil(total / perPage),
  };
}

function sanitizeQuantity(value) {
  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw createServiceError(
      "Quantity must be a positive integer.",
      422,
      "INVALID_QUANTITY",
    );
  }

  return quantity;
}

function sanitizeDiscount(value) {
  const discount = Number(value ?? 0);

  if (!Number.isFinite(discount) || discount < 0) {
    throw createServiceError(
      "Discount must be a non-negative number.",
      422,
      "INVALID_DISCOUNT",
    );
  }

  return discount;
}

function calculateItemSubtotal(quantity, unitPrice, discount = 0) {
  const normalizedQuantity = sanitizeQuantity(quantity);
  const normalizedPrice = Number(unitPrice);
  const normalizedDiscount = sanitizeDiscount(discount);

  if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
    throw createServiceError(
      "Unit price is invalid.",
      422,
      "INVALID_UNIT_PRICE",
    );
  }

  const grossTotal = normalizedQuantity * normalizedPrice;

  if (normalizedDiscount > grossTotal) {
    throw createServiceError(
      "Discount cannot exceed the item subtotal.",
      422,
      "DISCOUNT_EXCEEDS_SUBTOTAL",
    );
  }

  return grossTotal - normalizedDiscount;
}

function normalizePayments(payments = []) {
  return payments.map((payment) => ({
    ...payment,
    id: Number(payment.id),
    service_order_id: Number(payment.service_order_id),
    amount: toNumber(payment.amount),
  }));
}

async function attachPayments(order) {
  if (!order) return null;

  const payments = await findServicePayments(Number(order.id));

  return {
    ...order,
    payments: normalizePayments(payments),
  };
}

async function attachPaymentsToOrders(orders = []) {
  if (!orders.length) return [];

  const ids = orders.map((order) => Number(order.id));

  const payments = normalizePayments(await findServicePaymentsByOrderIds(ids));

  const groupedPayments = new Map();

  for (const payment of payments) {
    const orderId = Number(payment.service_order_id);

    if (!groupedPayments.has(orderId)) {
      groupedPayments.set(orderId, []);
    }

    groupedPayments.get(orderId).push(payment);
  }

  return orders.map((order) => ({
    ...order,
    payments: groupedPayments.get(Number(order.id)) || [],
  }));
}

async function ensureOrderExists(orderId) {
  const id = normalizeId(orderId, "Service order ID");
  const order = await findServiceOrderById(id);

  if (!order) {
    throw createServiceError(
      "Service order not found.",
      404,
      "SERVICE_ORDER_NOT_FOUND",
    );
  }

  return order;
}

async function ensureOrderEditable(orderId) {
  const order = await ensureOrderExists(orderId);

  if (["completed", "cancelled"].includes(order.status)) {
    throw createServiceError(
      "Completed or cancelled service orders cannot be edited.",
      422,
      "SERVICE_ORDER_NOT_EDITABLE",
    );
  }

  if (order.status === "pending") {
    throw createServiceError(
      "Service order items cannot be changed while service is in pending.",
      422,
      "SERVICE_ORDER_IN_PROGRESS",
    );
  }

  return order;
}

async function ensureOrderNotStarted(orderId) {
  const order = await ensureOrderExists(orderId);

  if (order.status === "in_progress") {
    throw createServiceError(
      "This action is not allowed while service is in progress.",
      422,
      "SERVICE_ORDER_IN_PROGRESS",
    );
  }

  if (["completed", "cancelled"].includes(order.status)) {
    throw createServiceError(
      "This action is not allowed for completed or cancelled orders.",
      422,
      "SERVICE_ORDER_CLOSED",
    );
  }

  return order;
}

async function recalculateServiceOrderTotal(orderId, tx) {
  const id = normalizeId(orderId, "Service order ID");

  const [serviceSubtotal, sparePartSubtotal, order] = await Promise.all([
    calculateServiceOrderItemSubtotal(id, tx),
    calculateServiceOrderSparePartSubtotal(id, tx),
    findServiceOrderTotals(id, tx),
  ]);

  if (!order) {
    throw createServiceError(
      "Service order not found.",
      404,
      "SERVICE_ORDER_NOT_FOUND",
    );
  }

  const subtotal = toNumber(serviceSubtotal) + toNumber(sparePartSubtotal);
  const discount = toNumber(order.discount);
  const tax = toNumber(order.tax);
  const paymentFee = toNumber(order.payment_fee);
  const grandTotal = Math.max(0, subtotal - discount + tax + paymentFee);
  const paidAmount = toNumber(order.paid_amount);
  const changeAmount = Math.max(0, paidAmount - grandTotal);

  await updateServiceOrderTotals(
    id,
    {
      subtotal,
      grand_total: grandTotal,
      change_amount: changeAmount,
    },
    tx,
  );

  return {
    subtotal,
    grand_total: grandTotal,
    change_amount: changeAmount,
  };
}

async function getUpdatedOrder(orderId) {
  const order = await ensureOrderExists(orderId);
  return attachPayments(order);
}

function buildSearchWhere(search) {
  if (!search) return {};

  return {
    OR: [
      { order_number: { contains: search } },
      { complaint: { contains: search } },
      {
        booking: {
          is: {
            OR: [
              { booking_number: { contains: search } },
              { customer_name: { contains: search } },
              { customer_phone: { contains: search } },
              {
                vehicle: {
                  is: {
                    plate_number: { contains: search },
                  },
                },
              },
            ],
          },
        },
      },
    ],
  };
}

function mergeWhere(...conditions) {
  const validConditions = conditions.filter(
    (condition) => condition && Object.keys(condition).length > 0,
  );

  if (validConditions.length === 0) return {};
  if (validConditions.length === 1) return validConditions[0];

  return { AND: validConditions };
}

export async function getServiceOrders(params = {}) {
  const { page, per_page, skip, take } = normalizePagination(params);
  const search = normalizeString(params.search);

  const conditions = [buildSearchWhere(search)];

  if (params.status) {
    conditions.push({ status: params.status });
  }

  if (params.payment_status) {
    conditions.push({ payment_status: params.payment_status });
  }

  if (params.technician_id !== undefined && params.technician_id !== "") {
    conditions.push({
      technician_id: normalizeId(params.technician_id, "Technician ID"),
    });
  }

  if (params.customer_id !== undefined && params.customer_id !== "") {
    conditions.push({
      booking: {
        is: {
          customer_id: normalizeId(params.customer_id, "Customer ID"),
        },
      },
    });
  }

  const where = mergeWhere(...conditions);

  const [orders, total] = await Promise.all([
    findServiceOrders({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
    }),
    countServiceOrders(where),
  ]);

  return {
    data: await attachPaymentsToOrders(orders),
    meta: buildPaginationMeta(page, per_page, total),
  };
}

export async function getVehicleServiceHistory(vehicleId, params = {}) {
  const id = normalizeId(vehicleId, "Vehicle ID");
  const vehicle = await findVehicleById(id);

  if (!vehicle) {
    throw createServiceError("Vehicle not found.", 404, "VEHICLE_NOT_FOUND");
  }

  const { page, per_page, skip, take } = normalizePagination(params);
  const where = {
    booking: {
      is: {
        vehicle_id: id,
      },
    },
  };

  const [orders, total] = await Promise.all([
    findVehicleServiceOrders(id, {
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
    }),
    countVehicleServiceOrders(id, where),
  ]);

  return {
    vehicle,
    data: await attachPaymentsToOrders(orders),
    meta: buildPaginationMeta(page, per_page, total),
  };
}

export async function getAdminServiceOrder(orderId) {
  return getUpdatedOrder(orderId);
}

export async function updateServiceOrderDiagnosis(orderId, diagnosis) {
  const id = normalizeId(orderId, "Service order ID");
  const value = normalizeString(diagnosis);

  if (!value) {
    throw createServiceError(
      "Diagnosis is required.",
      422,
      "DIAGNOSIS_REQUIRED",
    );
  }

  if (value.length > 5000) {
    throw createServiceError(
      "Diagnosis must not exceed 5000 characters.",
      422,
      "DIAGNOSIS_TOO_LONG",
    );
  }

  const order = await ensureOrderExists(id);

  if (order.status !== "in_progress") {
    throw createServiceError(
      "Diagnosis can only be updated while service is in progress.",
      422,
      "INVALID_SERVICE_ORDER_STATUS",
    );
  }

  await updateServiceOrder(id, {
    diagnosis: value,
  });

  return getUpdatedOrder(id);
}

export async function updateServiceOrderNotes(orderId, notes) {
  const id = normalizeId(orderId, "Service order ID");
  const value = notes == null ? null : normalizeString(notes);

  if (value && value.length > 5000) {
    throw createServiceError(
      "Notes must not exceed 5000 characters.",
      422,
      "NOTES_TOO_LONG",
    );
  }

  const order = await ensureOrderExists(id);

  if (order.status !== "in_progress") {
    throw createServiceError(
      "Notes can only be updated while service is in progress.",
      422,
      "INVALID_SERVICE_ORDER_STATUS",
    );
  }

  await updateServiceOrder(id, {
    notes: value || null,
  });

  return getUpdatedOrder(id);
}

export async function addServiceOrderService(orderId, data = {}) {
  const id = normalizeId(orderId, "Service order ID");
  const serviceId = normalizeId(data.service_id, "Service ID");
  const quantity = sanitizeQuantity(data.quantity ?? 1);
  const discount = sanitizeDiscount(data.discount ?? 0);

  await ensureOrderEditable(id);

  await withServiceOrderTransaction(async (tx) => {
    const service = await findWorkshopServiceById(serviceId, tx);

    if (!service || service.status !== true) {
      throw createServiceError(
        "Workshop service not found or inactive.",
        404,
        "WORKSHOP_SERVICE_NOT_FOUND",
      );
    }

    const unitPrice = toNumber(service.price, NaN);
    const subtotal = calculateItemSubtotal(quantity, unitPrice, discount);

    await createServiceOrderItem(
      {
        service_order_id: id,
        service_id: serviceId,
        name: service.name,
        quantity,
        unit_price: unitPrice,
        discount,
        subtotal,
      },
      tx,
    );

    await recalculateServiceOrderTotal(id, tx);
  });

  return getUpdatedOrder(id);
}

export async function updateServiceOrderService(orderId, itemId, data = {}) {
  const id = normalizeId(orderId, "Service order ID");
  const serviceItemId = normalizeId(itemId, "Service item ID");

  await ensureOrderEditable(id);

  if (data.quantity === undefined && data.discount === undefined) {
    throw createServiceError(
      "At least one field must be provided.",
      422,
      "EMPTY_UPDATE",
    );
  }

  await withServiceOrderTransaction(async (tx) => {
    const item = await findServiceOrderItemById(serviceItemId, tx);

    if (!item || Number(item.service_order_id) !== id) {
      throw createServiceError(
        "Service item not found.",
        404,
        "SERVICE_ITEM_NOT_FOUND",
      );
    }

    const quantity =
      data.quantity === undefined
        ? sanitizeQuantity(item.quantity)
        : sanitizeQuantity(data.quantity);

    const discount =
      data.discount === undefined
        ? sanitizeDiscount(item.discount)
        : sanitizeDiscount(data.discount);

    const unitPrice = toNumber(item.unit_price, NaN);
    const subtotal = calculateItemSubtotal(quantity, unitPrice, discount);

    await updateServiceOrderItem(
      serviceItemId,
      {
        quantity,
        discount,
        subtotal,
      },
      tx,
    );

    await recalculateServiceOrderTotal(id, tx);
  });

  return getUpdatedOrder(id);
}

export async function removeServiceOrderService(orderId, itemId) {
  const id = normalizeId(orderId, "Service order ID");
  const serviceItemId = normalizeId(itemId, "Service item ID");

  await ensureOrderEditable(id);

  await withServiceOrderTransaction(async (tx) => {
    const item = await findServiceOrderItemById(serviceItemId, tx);

    if (!item || Number(item.service_order_id) !== id) {
      throw createServiceError(
        "Service item not found.",
        404,
        "SERVICE_ITEM_NOT_FOUND",
      );
    }

    await deleteServiceOrderItem(serviceItemId, tx);
    await recalculateServiceOrderTotal(id, tx);
  });

  return getUpdatedOrder(id);
}

export async function addServiceOrderSparePart(orderId, data = {}) {
  const id = normalizeId(orderId, "Service order ID");
  const variantId = normalizeId(data.variant_id, "Variant ID");
  const quantity = sanitizeQuantity(data.quantity ?? 1);
  const discount = sanitizeDiscount(data.discount ?? 0);

  await ensureOrderEditable(id);

  await withServiceOrderTransaction(async (tx) => {
    const variant = await findSparePartVariantById(variantId, tx);

    if (!variant || variant.status !== true) {
      throw createServiceError(
        "Spare part variant not found or inactive.",
        404,
        "SPARE_PART_VARIANT_NOT_FOUND",
      );
    }

    if (!variant.spare_part || variant.spare_part.status !== "active") {
      throw createServiceError(
        "Spare part not found or inactive.",
        404,
        "SPARE_PART_NOT_FOUND",
      );
    }

    if (!variant.stock) {
      throw createServiceError(
        "Spare part stock record not found.",
        422,
        "SPARE_PART_STOCK_NOT_FOUND",
      );
    }

    const availableStock =
      toNumber(variant.stock.stock) - toNumber(variant.stock.reserved_stock);

    if (quantity > availableStock) {
      throw createServiceError(
        `Insufficient stock. Available stock: ${Math.max(0, availableStock)}.`,
        422,
        "INSUFFICIENT_STOCK",
      );
    }

    const unitPrice = toNumber(variant.price, NaN);
    const subtotal = calculateItemSubtotal(quantity, unitPrice, discount);

    await createServiceOrderSparePart(
      {
        service_order_id: id,
        spare_part_id: variant.spare_part_id,
        variant_id: variantId,
        name: variant.spare_part.name,
        sku: variant.sku || variant.spare_part.sku || null,
        quantity,
        unit_price: unitPrice,
        discount,
        subtotal,
      },
      tx,
    );

    await recalculateServiceOrderTotal(id, tx);
  });

  return getUpdatedOrder(id);
}

export async function updateServiceOrderSparePart(orderId, itemId, data = {}) {
  const id = normalizeId(orderId, "Service order ID");
  const sparePartItemId = normalizeId(itemId, "Spare part item ID");

  await ensureOrderEditable(id);

  if (data.quantity === undefined && data.discount === undefined) {
    throw createServiceError(
      "At least one field must be provided.",
      422,
      "EMPTY_UPDATE",
    );
  }

  await withServiceOrderTransaction(async (tx) => {
    const item = await findServiceOrderSparePartById(sparePartItemId, tx);

    if (!item || Number(item.service_order_id) !== id) {
      throw createServiceError(
        "Spare part item not found.",
        404,
        "SPARE_PART_ITEM_NOT_FOUND",
      );
    }

    const variant = await findSparePartVariantById(item.variant_id, tx);

    if (!variant || variant.status !== "active") {
      throw createServiceError(
        "Spare part variant not found or inactive.",
        404,
        "SPARE_PART_VARIANT_NOT_FOUND",
      );
    }

    if (!variant.stock) {
      throw createServiceError(
        "Spare part stock record not found.",
        422,
        "SPARE_PART_STOCK_NOT_FOUND",
      );
    }

    const quantity =
      data.quantity === undefined
        ? sanitizeQuantity(item.quantity)
        : sanitizeQuantity(data.quantity);

    const discount =
      data.discount === undefined
        ? sanitizeDiscount(item.discount)
        : sanitizeDiscount(data.discount);

    const availableStock =
      toNumber(variant.stock.stock) - toNumber(variant.stock.reserved_stock);

    if (quantity > availableStock) {
      throw createServiceError(
        `Insufficient stock. Available stock: ${Math.max(0, availableStock)}.`,
        422,
        "INSUFFICIENT_STOCK",
      );
    }

    const unitPrice = toNumber(item.unit_price, NaN);
    const subtotal = calculateItemSubtotal(quantity, unitPrice, discount);

    await updateServiceOrderSparePartModel(
      sparePartItemId,
      {
        quantity,
        discount,
        subtotal,
      },
      tx,
    );

    await recalculateServiceOrderTotal(id, tx);
  });

  return getUpdatedOrder(id);
}

export async function removeServiceOrderSparePart(orderId, itemId) {
  const id = normalizeId(orderId, "Service order ID");
  const sparePartItemId = normalizeId(itemId, "Spare part item ID");

  await ensureOrderEditable(id);

  await withServiceOrderTransaction(async (tx) => {
    const item = await findServiceOrderSparePartById(sparePartItemId, tx);

    if (!item || Number(item.service_order_id) !== id) {
      throw createServiceError(
        "Spare part item not found.",
        404,
        "SPARE_PART_ITEM_NOT_FOUND",
      );
    }

    await deleteServiceOrderSparePart(sparePartItemId, tx);
    await recalculateServiceOrderTotal(id, tx);
  });

  return getUpdatedOrder(id);
}

export async function confirmServiceOrder(orderId, confirmedById) {
  const id = normalizeId(orderId, "Service order ID");
  const userId = normalizeId(confirmedById, "User ID");
  const order = await ensureOrderExists(id);

  if (order.status !== "pending") {
    throw createServiceError(
      "Only pending service orders can be confirmed.",
      422,
      "INVALID_SERVICE_ORDER_STATUS",
    );
  }

  const user = await findUserById(userId);

  if (!user) {
    throw createServiceError("User not found.", 404, "USER_NOT_FOUND");
  }

  await updateServiceOrder(id, {
    status: "confirmed",
    confirmed_by_id: userId,
    confirmed_at: new Date(),
  });

  return getUpdatedOrder(id);
}

export async function startServiceOrder(orderId, technicianId = null) {
  const id = normalizeId(orderId, "Service order ID");
  const order = await ensureOrderExists(id);

  if (
    technicianId !== null &&
    Number(order.technician_id) !== Number(technicianId)
  ) {
    throw createServiceError(
      "You are not assigned to this service order.",
      403,
      "SERVICE_ORDER_FORBIDDEN",
    );
  }

  if (order.status !== "pending" && order.status !== "confirmed") {
    throw createServiceError(
      "Only pending or confirmed service orders can be started.",
      422,
      "INVALID_SERVICE_ORDER_STATUS",
    );
  }

  await updateServiceOrder(id, {
    status: "in_progress",
    started_at: new Date(),
  });

  return getUpdatedOrder(id);
}

export async function reopenServiceOrder(orderId) {
  const id = normalizeId(orderId, "Service order ID");
  const order = await ensureOrderExists(id);

  if (order.status !== "completed") {
    throw createServiceError(
      "Only completed service orders can be reopened.",
      422,
      "INVALID_SERVICE_ORDER_STATUS",
    );
  }

  if (order.payment_status === "paid") {
    throw createServiceError(
      "A paid service order cannot be reopened.",
      422,
      "SERVICE_ORDER_ALREADY_PAID",
    );
  }

  await updateServiceOrder(id, {
    status: "confirmed",
    started_at: null,
    completed_at: null,
  });

  return getUpdatedOrder(id);
}

export async function completeServiceOrder(orderId) {
  const id = normalizeId(orderId, "Service order ID");
  const order = await ensureOrderExists(id);

  if (order.status !== "in_progress") {
    throw createServiceError(
      "Only service orders in progress can be completed.",
      422,
      "INVALID_SERVICE_ORDER_STATUS",
    );
  }

  await updateServiceOrder(id, {
    status: "completed",
    completed_at: new Date(),
  });

  return getUpdatedOrder(id);
}

export async function cancelServiceOrder(orderId, notes) {
  const id = normalizeId(orderId, "Service order ID");
  const reason = normalizeString(notes);
  const order = await ensureOrderExists(id);

  if (!reason) {
    throw createServiceError(
      "Cancellation reason is required.",
      422,
      "CANCELLATION_REASON_REQUIRED",
    );
  }

  if (reason.length > 5000) {
    throw createServiceError(
      "Cancellation reason must not exceed 5000 characters.",
      422,
      "CANCELLATION_REASON_TOO_LONG",
    );
  }

  if (["completed", "cancelled"].includes(order.status)) {
    throw createServiceError(
      "Completed or cancelled service orders cannot be cancelled.",
      422,
      "INVALID_SERVICE_ORDER_STATUS",
    );
  }

  await updateServiceOrder(id, {
    status: "cancelled",
    cancelled_at: new Date(),
    notes: reason,
  });

  return getUpdatedOrder(id);
}

export async function deleteServiceOrder(orderId) {
  const id = normalizeId(orderId, "Service order ID");
  const order = await ensureOrderExists(id);

  if (order.status !== "pending") {
    throw createServiceError(
      "Only pending service orders can be deleted.",
      422,
      "INVALID_SERVICE_ORDER_STATUS",
    );
  }

  await deleteServiceOrderModel(id);

  return {
    id,
    deleted: true,
  };
}

export async function assignServiceOrderTechnician(orderId, technicianId) {
  const id = normalizeId(orderId, "Service order ID");
  const techId = normalizeId(technicianId, "Technician ID");
  const order = await ensureOrderExists(id);

  if (!["pending", "confirmed"].includes(order.status)) {
    throw createServiceError(
      "Technician can only be assigned to pending or confirmed service orders.",
      422,
      "INVALID_SERVICE_ORDER_STATUS",
    );
  }

  const technician = await findUserById(techId);

  if (!technician || technician.role !== "teknisi") {
    throw createServiceError(
      "Technician account not found.",
      404,
      "TECHNICIAN_NOT_FOUND",
    );
  }

  await updateServiceOrder(id, {
    technician_id: techId,
  });

  return getUpdatedOrder(id);
}

export async function getCustomerServiceOrders(customerId, params = {}) {
  const id = normalizeId(customerId, "Customer ID");
  const { page, per_page, skip, take } = normalizePagination(params);
  const search = normalizeString(params.search);

  const conditions = [
    {
      booking: {
        is: {
          customer_id: id,
        },
      },
    },
    buildSearchWhere(search),
  ];

  if (params.status) {
    conditions.push({ status: params.status });
  }

  if (params.payment_status) {
    conditions.push({ payment_status: params.payment_status });
  }

  const where = mergeWhere(...conditions);

  const [orders, total] = await Promise.all([
    findServiceOrders({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
    }),
    countServiceOrders(where),
  ]);

  return {
    data: await attachPaymentsToOrders(orders),
    meta: buildPaginationMeta(page, per_page, total),
  };
}

export async function getCustomerServiceOrder(customerId, orderId) {
  const customer = normalizeId(customerId, "Customer ID");
  const order = await ensureOrderExists(orderId);

  if (Number(order.booking?.customer_id) !== customer) {
    throw createServiceError(
      "You are not authorized to access this service order.",
      403,
      "FORBIDDEN",
    );
  }

  return attachPayments(order);
}

export async function getTechnicianServiceOrders(technicianId, params = {}) {
  const id = normalizeId(technicianId, "Technician ID");
  const { page, per_page, skip, take } = normalizePagination(params);
  const search = normalizeString(params.search);

  const where = mergeWhere(
    { technician_id: id },
    buildSearchWhere(search),
    params.status ? { status: params.status } : {},
  );

  const [orders, total] = await Promise.all([
    findServiceOrders({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
    }),
    countServiceOrders(where),
  ]);

  return {
    data: await attachPaymentsToOrders(orders),
    meta: buildPaginationMeta(page, per_page, total),
  };
}

export async function getTechnicianServiceOrder(technicianId, orderId) {
  const technician = normalizeId(technicianId, "Technician ID");
  const order = await ensureOrderExists(orderId);

  if (Number(order.technician_id) !== technician) {
    throw createServiceError(
      "You are not authorized to access this service order.",
      403,
      "FORBIDDEN",
    );
  }

  return attachPayments(order);
}

export async function getTechnicianVehicleServiceHistory(
  technicianId,
  params = {},
) {
  const id = normalizeId(technicianId, "Technician ID");
  const { page, per_page } = normalizePagination(params);
  const search = normalizeString(params.search);

  const where = mergeWhere(
    { technician_id: id },
    params.status ? { status: params.status } : {},
  );

  const orders = await findTechnicianVehicleServiceOrders({
    technicianId: id,
    where,
    orderBy: { created_at: "desc" },
  });

  const ordersWithPayments = await attachPaymentsToOrders(orders);
  const vehicles = new Map();

  for (const order of ordersWithPayments) {
    const vehicle = order.booking?.vehicle;

    if (!vehicle) continue;

    const vehicleId = Number(vehicle.id);

    if (!vehicles.has(vehicleId)) {
      vehicles.set(vehicleId, {
        vehicle,
        total_services: 0,
        last_serviced_at: order.completed_at || order.created_at,
        service_orders: [],
      });
    }

    const group = vehicles.get(vehicleId);

    group.total_services += 1;
    group.service_orders.push(order);

    const currentTimestamp = group.last_serviced_at
      ? new Date(group.last_serviced_at).getTime()
      : 0;

    const nextDate = order.completed_at || order.created_at;
    const nextTimestamp = nextDate ? new Date(nextDate).getTime() : 0;

    if (nextTimestamp > currentTimestamp) {
      group.last_serviced_at = nextDate;
    }
  }

  let results = [...vehicles.values()].sort((a, b) => {
    const dateA = a.last_serviced_at
      ? new Date(a.last_serviced_at).getTime()
      : 0;

    const dateB = b.last_serviced_at
      ? new Date(b.last_serviced_at).getTime()
      : 0;

    return dateB - dateA;
  });

  if (search) {
    const keyword = search.toLowerCase();

    results = results.filter(({ vehicle, service_orders }) => {
      const vehicleMatches = [
        vehicle.plate_number,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.color,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(keyword));

      const orderMatches = service_orders.some((order) =>
        [
          order.order_number,
          order.complaint,
          order.diagnosis,
          order.notes,
          order.booking?.booking_number,
          order.booking?.customer_name,
          order.booking?.customer_phone,
        ]
          .filter((value) => value !== null && value !== undefined)
          .some((value) => String(value).toLowerCase().includes(keyword)),
      );

      return vehicleMatches || orderMatches;
    });
  }

  const total = results.length;
  const skip = (page - 1) * per_page;

  return {
    data: results.slice(skip, skip + per_page),
    meta: buildPaginationMeta(page, per_page, total),
  };
}
