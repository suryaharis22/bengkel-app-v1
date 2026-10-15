import { getTechnicianBookingController } from "@/controllers/technician.booking.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

export async function GET(request, { params }) {
  try {
    const authorization = await requireRole(["teknisi"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id } = await params;

    return getTechnicianBookingController(id, authorization);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
