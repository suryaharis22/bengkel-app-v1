import {
  getGuestVehiclesController,
  createGuestVehicleController,
} from "@/controllers/vehicle.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

/*
|--------------------------------------------------------------------------
| GET /api/admin/vehicles/guest
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

    return getGuestVehiclesController(request, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/admin/vehicles/guest
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

    return createGuestVehicleController(request, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
