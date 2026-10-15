import { confirmAdminBookingController } from "@/controllers/admin.booking.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

export async function POST(request, { params }) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Authorization
    |--------------------------------------------------------------------------
    */

    const authorization = await requireRole(["admin"]);

    if (!authorization?.authorized) {
      return errorResponse({
        code: authorization?.statusCode || 401,
        message: authorization?.message || "Unauthorized",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Route Params
    |--------------------------------------------------------------------------
    */

    const resolvedParams = await params;

    const bookingId = resolvedParams?.id;

    if (
      bookingId === undefined ||
      bookingId === null ||
      String(bookingId).trim() === ""
    ) {
      return errorResponse({
        code: 422,
        message: "Booking ID is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Controller
    |--------------------------------------------------------------------------
    */

    return await confirmAdminBookingController(
      request,
      bookingId,
      authorization,
    );
  } catch (error) {
    console.error("POST /api/admin/bookings/[id]/confirm error:", error);

    return handleMiddlewareError(error, "Failed to confirm booking");
  }
}
