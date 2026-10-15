import {
  deleteAdminWorkshopServiceController,
  getAdminWorkshopServiceController,
  updateAdminWorkshopServiceController,
} from "@/controllers/admin.service.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

/**
 * GET /api/admin/services/[id]
 * Retrieve a workshop service by ID.
 */
export async function GET(request, { params }) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id } = await params;

    return getAdminWorkshopServiceController(id, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

/**
 * PUT /api/admin/services/[id]
 * Update a workshop service.
 */
export async function PUT(request, { params }) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id } = await params;

    return updateAdminWorkshopServiceController(request, id, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

/**
 * DELETE /api/admin/services/[id]
 * Delete a workshop service.
 */
export async function DELETE(request, { params }) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id } = await params;

    return deleteAdminWorkshopServiceController(id, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
