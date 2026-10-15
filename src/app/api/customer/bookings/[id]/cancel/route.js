import { cancelCustomerBookingController } from "@/controllers/customer.booking.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

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

    return cancelCustomerBookingController(request, id, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
