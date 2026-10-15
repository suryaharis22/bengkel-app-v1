import {
  getVehiclesController,
  createAdminVehicleController,
} from "@/controllers/vehicle.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

/*
|--------------------------------------------------------------------------
| GET /api/admin/vehicles
|--------------------------------------------------------------------------
*/

export async function GET(request) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    return getVehiclesController(request, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/admin/vehicles
|--------------------------------------------------------------------------
*/

export async function POST(request) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    return createAdminVehicleController(request, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
