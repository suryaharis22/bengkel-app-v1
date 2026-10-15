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
  createNewWorkshopService,
} from "@/services/workshop-service.service";

import { errorResponse, successResponse } from "@/lib/response";

/**
 * Get authenticated user ID
 */
function getAuthUserId(authorization) {
  return (
    authorization?.user?.id ??
    authorization?.userId ??
    authorization?.id ??
    null
  );
}

/**
 * Format Zod validation errors
 */
function getZodErrors(error) {
  if (!error?.issues) {
    return null;
  }

  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * Validate JSON request body
 */
function parseJsonBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("Request body must be a valid JSON object");

    error.statusCode = 400;
    error.code = "INVALID_REQUEST_BODY";

    throw error;
  }

  return body;
}

/**
 * Validate service order ID
 */
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

/**
 * Handle controller errors
 */
function handleControllerError(error, fallbackMessage) {
  if (error?.statusCode) {
    return errorResponse({
      code: error.statusCode,
      message: error.message,
      errors: error.details,
    });
  }

  /**
   * Workshop service menggunakan `status`
   * sedangkan service order menggunakan `statusCode`.
   */
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

/**
 * ============================================================
 * WORKSHOP SERVICE
 * ============================================================
 */

/**
 * GET /api/admin/services
 *
 * Get workshop services with:
 * - search
 * - status
 * - page
 * - per_page
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

    const page = Math.max(1, Number(searchParams.get("page") || 1));

    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("per_page") || 10)),
    );

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
 * POST /api/admin/services
 *
 * Create new workshop service
 */
export async function createAdminWorkshopServiceController(
  request,
  authorization,
) {
  try {
    getAuthUserId(authorization);

    const body = parseJsonBody(await request.json());

    const name = String(body.name ?? "").trim();

    const description =
      body.description === null || body.description === undefined
        ? null
        : String(body.description).trim();

    const price = Number(body.price);

    const status = body.status === undefined ? true : Boolean(body.status);

    /**
     * Validate name
     */
    if (!name) {
      return errorResponse({
        code: 422,
        message: "Service name is required",
        errors: [
          {
            field: "name",
            message: "Service name is required",
          },
        ],
      });
    }

    if (name.length > 150) {
      return errorResponse({
        code: 422,
        message: "Service name must not exceed 150 characters",
        errors: [
          {
            field: "name",
            message: "Service name must not exceed 150 characters",
          },
        ],
      });
    }

    /**
     * Validate description
     */
    if (description && description.length > 5000) {
      return errorResponse({
        code: 422,
        message: "Description must not exceed 5000 characters",
        errors: [
          {
            field: "description",
            message: "Description must not exceed 5000 characters",
          },
        ],
      });
    }

    /**
     * Validate price
     */
    if (!Number.isFinite(price) || price < 0) {
      return errorResponse({
        code: 422,
        message: "Valid service price is required",
        errors: [
          {
            field: "price",
            message: "Price must be a valid non-negative number",
          },
        ],
      });
    }

    /**
     * Create service
     */
    const service = await createNewWorkshopService({
      name,
      description: description || null,
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
 * ============================================================
 * SERVICE ORDER
 * ============================================================
 */

/**
 * Get Admin Service Order
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
 * Add Spare Part to Service Order
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
