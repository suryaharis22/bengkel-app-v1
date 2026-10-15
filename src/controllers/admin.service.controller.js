import {
  addServiceOrderSparePartSchema,
  serviceOrderIdSchema,
} from "@/validations/service-order.validation";

import {
  addServiceOrderSparePart,
  getAdminServiceOrder,
} from "@/services/service-order.service";

import {
  getWorkshopServices,
  getWorkshopServiceById,
  createNewWorkshopService,
  updateExistingWorkshopService,
  deleteExistingWorkshopService,
} from "@/services/workshop-service.service";

import { errorResponse, successResponse } from "@/lib/response";

/**
 * ============================================================
 * HELPER FUNCTIONS
 * ============================================================
 */

function getAuthUserId(authorization) {
  return (
    authorization?.user?.id ??
    authorization?.userId ??
    authorization?.id ??
    null
  );
}

function getZodErrors(error) {
  if (!error?.issues) {
    return null;
  }

  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

function parseJsonBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("Request body must be a valid JSON object");
    error.statusCode = 400;
    error.code = "INVALID_REQUEST_BODY";
    throw error;
  }

  return body;
}

function parseServiceOrderId(value) {
  const parsed = serviceOrderIdSchema.safeParse({
    id: Number(value),
  });

  if (!parsed.success) {
    const error = new Error("Invalid service order ID");
    error.statusCode = 400;
    error.code = "INVALID_SERVICE_ORDER_ID";
    error.details = getZodErrors(parsed.error);
    throw error;
  }

  return parsed.data.id;
}

function handleControllerError(error, fallbackMessage) {
  if (error?.statusCode) {
    return errorResponse({
      code: error.statusCode,
      message: error.message,
      errors: error.details,
    });
  }

  if (error?.status) {
    return errorResponse({
      code: error.status,
      message: error.message,
      errors: error.details,
    });
  }

  switch (error?.code) {
    case "P2002":
      return errorResponse({
        code: 409,
        message: "Data already exists",
      });

    case "P2025":
      return errorResponse({
        code: 404,
        message: "Requested data was not found",
      });

    default:
      console.error(fallbackMessage, error);

      return errorResponse({
        code: 500,
        message: fallbackMessage,
      });
  }
}

function validateServiceName(name) {
  if (typeof name !== "string" || !name.trim()) {
    return "Service name is required";
  }

  if (name.trim().length > 150) {
    return "Service name must not exceed 150 characters";
  }

  return null;
}

function validateServiceDescription(description) {
  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return "Description must be a string or null";
  }

  if (typeof description === "string" && description.length > 5000) {
    return "Description must not exceed 5000 characters";
  }

  return null;
}

function validationError(message, field) {
  return errorResponse({
    code: 422,
    message,
    errors: field ? [{ field, message }] : undefined,
  });
}

/**
 * ============================================================
 * WORKSHOP SERVICES
 * ============================================================
 */

/**
 * GET /api/admin/services
 */
export async function getAdminWorkshopServicesController(
  request,
  authorization,
) {
  try {
    getAuthUserId(authorization);

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || undefined;

    const rawPage = Number(searchParams.get("page") || 1);
    const rawPerPage = Number(searchParams.get("per_page") || 10);

    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

    const perPage =
      Number.isInteger(rawPerPage) && rawPerPage > 0
        ? Math.min(100, rawPerPage)
        : 10;

    const result = await getWorkshopServices({
      search,
      status,
      page,
      per_page: perPage,
    });

    return successResponse({
      code: 200,
      message: "Workshop services retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve workshop services");
  }
}

/**
 * GET /api/admin/services/[id]
 */
export async function getAdminWorkshopServiceController(id, authorization) {
  try {
    getAuthUserId(authorization);

    const service = await getWorkshopServiceById(id);

    return successResponse({
      code: 200,
      message: "Workshop service retrieved successfully",
      data: service,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve workshop service");
  }
}

/**
 * POST /api/admin/services
 */
export async function createAdminWorkshopServiceController(
  request,
  authorization,
) {
  try {
    getAuthUserId(authorization);

    const body = parseJsonBody(await request.json());

    const nameError = validateServiceName(body.name);

    if (nameError) {
      return validationError(nameError, "name");
    }

    const descriptionError = validateServiceDescription(body.description);

    if (descriptionError) {
      return validationError(descriptionError, "description");
    }

    if (body.price === undefined || body.price === null || body.price === "") {
      return validationError(
        "Price must be a valid non-negative number",
        "price",
      );
    }

    const price = Number(body.price);

    if (!Number.isFinite(price) || price < 0) {
      return validationError(
        "Price must be a valid non-negative number",
        "price",
      );
    }

    const status = body.status === undefined ? true : body.status;

    if (typeof status !== "boolean") {
      return validationError("Status must be true or false", "status");
    }

    const description =
      body.description == null ? null : body.description.trim() || null;

    const service = await createNewWorkshopService({
      name: body.name.trim(),
      description,
      price,
      status,
    });

    return successResponse({
      code: 201,
      message: "Workshop service created successfully",
      data: service,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to create workshop service");
  }
}

/**
 * PUT /api/admin/services/[id]
 */
export async function updateAdminWorkshopServiceController(
  request,
  id,
  authorization,
) {
  try {
    getAuthUserId(authorization);

    const body = parseJsonBody(await request.json());

    const allowedFields = ["name", "description", "price", "status"];

    const updateData = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return validationError("At least one field must be provided for update");
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "name")) {
      const nameError = validateServiceName(updateData.name);

      if (nameError) {
        return validationError(nameError, "name");
      }

      updateData.name = updateData.name.trim();
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "description")) {
      const descriptionError = validateServiceDescription(
        updateData.description,
      );

      if (descriptionError) {
        return validationError(descriptionError, "description");
      }

      if (typeof updateData.description === "string") {
        updateData.description = updateData.description.trim() || null;
      }
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "price")) {
      if (updateData.price === null || updateData.price === "") {
        return validationError(
          "Price must be a valid non-negative number",
          "price",
        );
      }

      const price = Number(updateData.price);

      if (!Number.isFinite(price) || price < 0) {
        return validationError(
          "Price must be a valid non-negative number",
          "price",
        );
      }

      updateData.price = price;
    }

    if (
      Object.prototype.hasOwnProperty.call(updateData, "status") &&
      typeof updateData.status !== "boolean"
    ) {
      return validationError("Status must be true or false", "status");
    }

    const service = await updateExistingWorkshopService(id, updateData);

    return successResponse({
      code: 200,
      message: "Workshop service updated successfully",
      data: service,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to update workshop service");
  }
}

/**
 * DELETE /api/admin/services/[id]
 */
export async function deleteAdminWorkshopServiceController(id, authorization) {
  try {
    getAuthUserId(authorization);

    const deletedService = await deleteExistingWorkshopService(id);

    return successResponse({
      code: 200,
      message: "Workshop service deleted successfully",
      data: deletedService ?? null,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to delete workshop service");
  }
}

/**
 * ============================================================
 * SERVICE ORDERS
 * ============================================================
 */

/**
 * Retrieve an admin service order.
 */
export async function getAdminServiceOrderController(
  serviceOrderId,
  authorization,
) {
  try {
    getAuthUserId(authorization);

    const id = parseServiceOrderId(serviceOrderId);

    const serviceOrder = await getAdminServiceOrder(id);

    return successResponse({
      code: 200,
      message: "Service order retrieved successfully",
      data: serviceOrder,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve service order");
  }
}

/**
 * Add a spare part to a service order.
 */
export async function addAdminServiceOrderSparePartController(
  request,
  serviceOrderId,
  authorization,
) {
  try {
    const userId = getAuthUserId(authorization);

    const id = parseServiceOrderId(serviceOrderId);

    const body = parseJsonBody(await request.json());

    const parsed = addServiceOrderSparePartSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(parsed.error),
      });
    }

    const result = await addServiceOrderSparePart(id, {
      variant_id: parsed.data.variant_id,
      quantity: parsed.data.quantity,
      discount: parsed.data.discount,
      user_id: userId,
    });

    return successResponse({
      code: 201,
      message: "Spare part added to service order successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(
      error,
      "Failed to add spare part to service order",
    );
  }
}
