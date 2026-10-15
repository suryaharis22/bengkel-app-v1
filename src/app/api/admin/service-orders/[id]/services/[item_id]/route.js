import {
  updateAdminServiceOrderServiceController,
  removeAdminServiceOrderServiceController,
} from "@/controllers/admin.service-order.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

export async function PUT(request, { params }) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id, item_id } = await params;

    return updateAdminServiceOrderServiceController(request, id, item_id);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

export async function DELETE(request, { params }) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id, item_id } = await params;

    return removeAdminServiceOrderServiceController(id, item_id);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
