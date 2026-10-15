import {
  createAdminServiceOrderPaymentController,
  getAdminServiceOrderPaymentController,
} from "@/controllers/admin-service-order-payment.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

export async function GET(request, context) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    return getAdminServiceOrderPaymentController(
      request,
      context,
      authorization,
    );
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

export async function POST(request, context) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    return createAdminServiceOrderPaymentController(
      request,
      context,
      authorization,
    );
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
