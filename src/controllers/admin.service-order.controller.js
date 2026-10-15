import {
  getServiceOrders,
  getAdminServiceOrder,
  assignServiceOrderTechnician,
  updateServiceOrderDiagnosis,
  updateServiceOrderNotes,
  addServiceOrderService,
  updateServiceOrderService,
  removeServiceOrderService,
  addServiceOrderSparePart,
  updateServiceOrderSparePart,
  removeServiceOrderSparePart,
  reopenServiceOrder,
  confirmServiceOrder,
  startServiceOrder,
  completeServiceOrder,
  cancelServiceOrder,
} from "@/services/service-order.service";

import {
  serviceOrderQuerySchema,
  serviceOrderIdSchema,
  serviceOrderItemIdSchema,
  serviceOrderSparePartItemIdSchema,
  addServiceOrderServiceSchema,
  addServiceOrderSparePartSchema,
  updateServiceOrderServiceSchema,
  updateServiceOrderSparePartSchema,
  updateServiceOrderDiagnosisSchema,
  updateServiceOrderNotesSchema,
  completeServiceOrderSchema,
  cancelServiceOrderSchema,
} from "@/validations/service-order.validation";

import { successResponse, errorResponse } from "@/lib/response";

import { getZodErrors } from "@/lib/zod-error";

function parseId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function handleControllerError(error, fallbackMessage) {
  console.error(error);

  return errorResponse({
    code: error?.statusCode || 500,
    message: error?.message || fallbackMessage,
  });
}

export async function getAdminServiceOrdersController(request) {
  try {
    const { searchParams } = new URL(request.url);

    const validation = serviceOrderQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const result = await getServiceOrders(validation.data);

    return successResponse({
      code: 200,
      message: "Service orders retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve service orders");
  }
}

export async function getAdminServiceOrderController(orderId) {
  try {
    const id = parseId(orderId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    const validation = serviceOrderIdSchema.safeParse({
      id,
    });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const order = await getAdminServiceOrder(id);

    return successResponse({
      code: 200,
      message: "Service order retrieved successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve service order");
  }
}

export async function updateAdminServiceOrderDiagnosisController(
  request,
  orderId,
) {
  try {
    const id = parseId(orderId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    const body = await request.json();

    const validation = updateServiceOrderDiagnosisSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const order = await updateServiceOrderDiagnosis(
      id,
      validation.data.diagnosis,
    );

    return successResponse({
      code: 200,
      message: "Diagnosis updated successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to update diagnosis");
  }
}

export async function updateAdminServiceOrderNotesController(request, orderId) {
  try {
    const id = parseId(orderId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    const body = await request.json();

    const validation = updateServiceOrderNotesSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const order = await updateServiceOrderNotes(id, validation.data.notes);

    return successResponse({
      code: 200,
      message: "Notes updated successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to update notes");
  }
}

export async function addAdminServiceOrderServiceController(request, orderId) {
  try {
    const id = parseId(orderId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    const body = await request.json();

    const validation = addServiceOrderServiceSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const order = await addServiceOrderService(id, validation.data);

    return successResponse({
      code: 201,
      message: "Service added successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to add service");
  }
}

export async function updateAdminServiceOrderServiceController(
  request,
  orderId,
  itemId,
) {
  try {
    const id = parseId(orderId);
    const item = parseId(itemId);

    if (!id || !item) {
      return errorResponse({
        code: 422,
        message: "Invalid service order or item ID",
      });
    }

    const validationId = serviceOrderItemIdSchema.safeParse({
      id,
      item_id: item,
    });

    if (!validationId.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validationId.error),
      });
    }

    const body = await request.json();

    const validation = updateServiceOrderServiceSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const order = await updateServiceOrderService(id, item, validation.data);

    return successResponse({
      code: 200,
      message: "Service updated successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to update service");
  }
}

export async function assignAdminServiceOrderTechnicianController(
  request,
  serviceOrderId,
) {
  try {
    const id = parseId(serviceOrderId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    const body = await request.json();

    const technicianId = parseId(body?.technician_id);

    if (!technicianId) {
      return errorResponse({
        code: 422,
        message: "Invalid technician ID",
      });
    }

    const order = await assignServiceOrderTechnician(id, technicianId);

    return successResponse({
      code: 200,
      message: "Technician assigned successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to assign technician");
  }
}

export async function removeAdminServiceOrderServiceController(
  orderId,
  itemId,
) {
  try {
    const id = parseId(orderId);
    const item = parseId(itemId);

    if (!id || !item) {
      return errorResponse({
        code: 422,
        message: "Invalid service order or item ID",
      });
    }

    const order = await removeServiceOrderService(id, item);

    return successResponse({
      code: 200,
      message: "Service removed successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to remove service");
  }
}

export async function addAdminServiceOrderSparePartController(
  request,
  orderId,
) {
  try {
    const id = parseId(orderId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    const body = await request.json();

    const validation = addServiceOrderSparePartSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const order = await addServiceOrderSparePart(id, validation.data);

    return successResponse({
      code: 201,
      message: "Spare part added successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to add spare part");
  }
}

export async function updateAdminServiceOrderSparePartController(
  request,
  orderId,
  itemId,
) {
  try {
    const id = parseId(orderId);
    const item = parseId(itemId);

    if (!id || !item) {
      return errorResponse({
        code: 422,
        message: "Invalid service order or item ID",
      });
    }

    const validationId = serviceOrderSparePartItemIdSchema.safeParse({
      id,
      item_id: item,
    });

    if (!validationId.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validationId.error),
      });
    }

    const body = await request.json();

    const validation = updateServiceOrderSparePartSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const order = await updateServiceOrderSparePart(id, item, validation.data);

    return successResponse({
      code: 200,
      message: "Spare part updated successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to update spare part");
  }
}

export async function removeAdminServiceOrderSparePartController(
  orderId,
  itemId,
) {
  try {
    const id = parseId(orderId);
    const item = parseId(itemId);

    if (!id || !item) {
      return errorResponse({
        code: 422,
        message: "Invalid service order or item ID",
      });
    }

    const order = await removeServiceOrderSparePart(id, item);

    return successResponse({
      code: 200,
      message: "Spare part removed successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to remove spare part");
  }
}

/**
 * Confirm Service Order
 */
export async function confirmAdminServiceOrderController(
  orderId,
  confirmedById = null,
) {
  try {
    const id = parseId(orderId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    const validation = serviceOrderIdSchema.safeParse({
      id,
    });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const confirmedBy = confirmedById !== null ? parseId(confirmedById) : null;

    if (confirmedById !== null && !confirmedBy) {
      return errorResponse({
        code: 422,
        message: "Invalid confirming user ID",
      });
    }

    const order = await confirmServiceOrder(id, confirmedBy);

    return successResponse({
      code: 200,
      message: "Service order confirmed successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to confirm service order");
  }
}

export async function startAdminServiceOrderController(orderId) {
  try {
    const id = parseId(orderId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    const validation = serviceOrderIdSchema.safeParse({
      id,
    });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const order = await startServiceOrder(id);

    return successResponse({
      code: 200,
      message: "Service order started successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to start service order");
  }
}

export async function completeAdminServiceOrderController(request, orderId) {
  try {
    const id = parseId(orderId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    let body = {};

    try {
      const contentType = request.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const rawBody = await request.text();

        if (rawBody.trim()) {
          body = JSON.parse(rawBody);
        }
      }
    } catch (error) {
      return errorResponse({
        code: 400,
        message: "Request body must contain valid JSON",
      });
    }

    const validation = completeServiceOrderSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const order = await completeServiceOrder(id, validation.data);

    return successResponse({
      code: 200,
      message: "Service order completed successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to complete service order");
  }
}

export async function reopenAdminServiceOrderController(serviceOrderId) {
  const order = await reopenServiceOrder(serviceOrderId);

  return successResponse({
    message: "Service order reopened successfully",
    data: order,
  });
}

export async function cancelAdminServiceOrderController(request, orderId) {
  try {
    const id = parseId(orderId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    const body = await request.json();

    const validation = cancelServiceOrderSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const order = await cancelServiceOrder(id, validation.data);

    return successResponse({
      code: 200,
      message: "Service order cancelled successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to cancel service order");
  }
}
