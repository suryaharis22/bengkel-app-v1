import { getCustomerServiceOrderController } from "@/controllers/customer.service-order.controller";

import { cancelTechnicianServiceOrderController } from "@/controllers/technician.service-order.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

/**
 * GET
 *
 * GET /api/customer/service-orders/[id]
 *
 * Get customer service order detail.
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

    return await getCustomerServiceOrderController(id, authorization);
  } catch (error) {
    console.error("GET /api/customer/service-orders/[id] error:", error);

    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

/**
 * POST
 *
 * POST /api/customer/service-orders/[id]
 *
 * Customer cancels service order.
 */
export async function POST(request, { params }) {
  try {
    const authorization = await requireRole(["customer"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id } = await params;

    return await cancelTechnicianServiceOrderController(
      request,
      id,
      authorization,
    );
  } catch (error) {
    console.error("POST /api/customer/service-orders/[id] error:", error);

    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
