import {
  getTechnicianServiceOrder,
  getTechnicianServiceOrders,
  getTechnicianVehicleServiceHistory,
  updateServiceOrderDiagnosis,
  updateServiceOrderNotes,
  startServiceOrder,
  completeServiceOrder,
  cancelServiceOrder,
} from "@/services/service-order.service";

import {
  serviceOrderIdSchema,
  updateServiceOrderDiagnosisSchema,
  updateServiceOrderNotesSchema,
  cancelServiceOrderSchema,
} from "@/validations/service-order.validation";

import { successResponse, errorResponse } from "@/lib/response";
import { getZodErrors } from "@/lib/zod-error";

function getAuthUserId(auth) {
  return auth?.user?.id ?? auth?.id ?? auth?.userId;
}

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

function parsePaginationValue(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

const SERVICE_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

export async function getTechnicianServiceOrdersController(request, auth) {
  try {
    const technicianId = parseId(getAuthUserId(auth));

    if (!technicianId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const { searchParams } = new URL(request.url);

    const page = parsePaginationValue(searchParams.get("page"), 1);
    const perPage = parsePaginationValue(searchParams.get("per_page"), 10);
    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim();

    if (page === null || perPage === null) {
      return errorResponse({
        code: 422,
        message: "Invalid pagination parameters",
      });
    }

    if (perPage > 100) {
      return errorResponse({
        code: 422,
        message: "per_page must not exceed 100",
      });
    }

    if (search.length > 100) {
      return errorResponse({
        code: 422,
        message: "Search must not exceed 100 characters",
      });
    }

    if (status && !SERVICE_ORDER_STATUSES.includes(status)) {
      return errorResponse({
        code: 422,
        message: "Invalid service order status",
      });
    }

    const result = await getTechnicianServiceOrders(technicianId, {
      page,
      per_page: perPage,
      search,
      ...(status ? { status } : {}),
    });

    return successResponse({
      code: 200,
      message: "Technician service orders retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(
      error,
      "Failed to retrieve technician service orders",
    );
  }
}

export async function getTechnicianServiceOrderController(orderId, auth) {
  try {
    const technicianId = parseId(getAuthUserId(auth));
    const id = parseId(orderId);

    if (!technicianId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    const validation = serviceOrderIdSchema.safeParse({ id });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const order = await getTechnicianServiceOrder(technicianId, id);

    return successResponse({
      code: 200,
      message: "Service order retrieved successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve service order");
  }
}

export async function getTechnicianVehicleServiceHistoryController(
  request,
  auth,
) {
  try {
    const technicianId = parseId(getAuthUserId(auth));

    if (!technicianId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const { searchParams } = new URL(request.url);

    const page = parsePaginationValue(searchParams.get("page"), 1);
    const perPage = parsePaginationValue(searchParams.get("per_page"), 10);
    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim();

    if (page === null || perPage === null || perPage > 100) {
      return errorResponse({
        code: 422,
        message: "Invalid pagination parameters",
      });
    }

    if (search.length > 100) {
      return errorResponse({
        code: 422,
        message: "Search must not exceed 100 characters",
      });
    }

    const params = {
      page,
      per_page: perPage,
      search,
      ...(status ? { status } : {}),
    };

    const result = await getTechnicianVehicleServiceHistory(
      technicianId,
      params,
    );

    return successResponse({
      code: 200,
      message: "Technician vehicle service history retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(
      error,
      "Failed to retrieve technician vehicle service history",
    );
  }
}

export async function updateTechnicianServiceOrderDiagnosisController(
  request,
  orderId,
  auth,
) {
  try {
    const technicianId = parseId(getAuthUserId(auth));
    const id = parseId(orderId);

    if (!technicianId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    await getTechnicianServiceOrder(technicianId, id);

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

export async function updateTechnicianServiceOrderNotesController(
  request,
  orderId,
  auth,
) {
  try {
    const technicianId = parseId(getAuthUserId(auth));
    const id = parseId(orderId);

    if (!technicianId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    await getTechnicianServiceOrder(technicianId, id);

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

export async function startTechnicianServiceOrderController(orderId, auth) {
  try {
    const technicianId = parseId(getAuthUserId(auth));
    const id = parseId(orderId);

    if (!technicianId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    const order = await startServiceOrder(id, technicianId);

    return successResponse({
      code: 200,
      message: "Service order started successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to start service order");
  }
}

export async function completeTechnicianServiceOrderController(
  request,
  orderId,
  auth,
) {
  try {
    const technicianId = parseId(getAuthUserId(auth));
    const id = parseId(orderId);

    if (!technicianId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    await getTechnicianServiceOrder(technicianId, id);

    const order = await completeServiceOrder(id);

    return successResponse({
      code: 200,
      message: "Service order completed successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to complete service order");
  }
}

export async function cancelTechnicianServiceOrderController(
  request,
  orderId,
  auth,
) {
  try {
    const technicianId = parseId(getAuthUserId(auth));
    const id = parseId(orderId);

    if (!technicianId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    await getTechnicianServiceOrder(technicianId, id);

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
