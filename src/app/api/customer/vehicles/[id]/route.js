import {
  getCustomerVehicleController,
  updateCustomerVehicleController,
  deleteCustomerVehicleController,
} from "@/controllers/vehicle.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

/*
|--------------------------------------------------------------------------
| GET /api/customer/vehicles/[id]
|--------------------------------------------------------------------------
*/

export async function GET(request, { params }) {
  try {
    const authorization = await requireRole(["customer"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id } = await params;

    return getCustomerVehicleController(id, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

/*
|--------------------------------------------------------------------------
| PUT /api/customer/vehicles/[id]
|--------------------------------------------------------------------------
*/

export async function PUT(request, { params }) {
  try {
    const authorization = await requireRole(["customer"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id } = await params;

    return updateCustomerVehicleController(request, id, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

/*
|--------------------------------------------------------------------------
| DELETE /api/customer/vehicles/[id]
|--------------------------------------------------------------------------
*/

export async function DELETE(request, { params }) {
  try {
    const authorization = await requireRole(["customer"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id } = await params;

    return deleteCustomerVehicleController(id, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
