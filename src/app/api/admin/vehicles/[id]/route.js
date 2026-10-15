import {
  getVehicleController,
  updateAdminVehicleController,
  deleteAdminVehicleController,
} from "@/controllers/vehicle.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

/*
|--------------------------------------------------------------------------
| GET /api/admin/vehicles/[id]
|--------------------------------------------------------------------------
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

    return getVehicleController(id, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

/*
|--------------------------------------------------------------------------
| PUT /api/admin/vehicles/[id]
|--------------------------------------------------------------------------
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

    return updateAdminVehicleController(request, id, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

/*
|--------------------------------------------------------------------------
| DELETE /api/admin/vehicles/[id]
|--------------------------------------------------------------------------
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

    return deleteAdminVehicleController(id, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
