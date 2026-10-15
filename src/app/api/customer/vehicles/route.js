import {
  getCustomerVehiclesController,
  createCustomerVehicleController,
} from "@/controllers/vehicle.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

/*
|--------------------------------------------------------------------------
| GET /api/customer/vehicles
|--------------------------------------------------------------------------
*/

export async function GET(request) {
  try {
    const authorization = await requireRole(["customer"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    return getCustomerVehiclesController(request, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/customer/vehicles
|--------------------------------------------------------------------------
*/

export async function POST(request) {
  try {
    const authorization = await requireRole(["customer"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    return createCustomerVehicleController(request, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
