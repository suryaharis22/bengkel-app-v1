import { getTechnicianBookingsController } from "@/controllers/technician.booking.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

export async function GET(request) {
  try {
    const authorization = await requireRole(["teknisi"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    return getTechnicianBookingsController(request, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
