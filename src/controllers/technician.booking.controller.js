import {
  getTechnicianBookings,
  getTechnicianBookingById,
  confirmTechnicianBooking,
  rejectTechnicianBooking,
} from "@/services/technician-booking.service";

import {
  serviceBookingQuerySchema,
  serviceBookingIdSchema,
  cancelCustomerBookingSchema,
} from "@/validations/customer-booking.validation";

import { successResponse, errorResponse } from "@/lib/response";

import { getZodErrors } from "@/lib/zod-error";

function getAuthUserId(auth) {
  return auth?.user?.id ?? auth?.id ?? auth?.userId;
}

function parseId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function handleControllerError(error, fallbackMessage) {
  console.error(error);

  return errorResponse({
    code: error?.statusCode || 500,
    message: error?.message || fallbackMessage,
  });
}

export async function getTechnicianBookingsController(request, auth) {
  try {
    const technicianId = getAuthUserId(auth);

    if (!technicianId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const { searchParams } = new URL(request.url);

    const validation = serviceBookingQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const result = await getTechnicianBookings(technicianId, validation.data);

    return successResponse({
      code: 200,
      message: "Technician bookings retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(
      error,
      "Failed to retrieve technician bookings",
    );
  }
}

export async function getTechnicianBookingController(bookingId, auth) {
  try {
    const technicianId = getAuthUserId(auth);

    if (!technicianId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const id = parseId(bookingId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid booking ID",
      });
    }

    const validation = serviceBookingIdSchema.safeParse({
      id,
    });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const booking = await getTechnicianBookingById(technicianId, id);

    return successResponse({
      code: 200,
      message: "Booking retrieved successfully",
      data: booking,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve booking");
  }
}

export async function confirmTechnicianBookingController(bookingId, auth) {
  try {
    const technicianId = getAuthUserId(auth);

    if (!technicianId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const id = parseId(bookingId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid booking ID",
      });
    }

    const validation = serviceBookingIdSchema.safeParse({
      id,
    });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const booking = await confirmTechnicianBooking(technicianId, id);

    return successResponse({
      code: 200,
      message: "Booking confirmed by technician",
      data: booking,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to confirm booking");
  }
}

export async function rejectTechnicianBookingController(
  request,
  bookingId,
  auth,
) {
  try {
    const technicianId = getAuthUserId(auth);

    if (!technicianId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const id = parseId(bookingId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid booking ID",
      });
    }

    const body = await request.json();

    const validation = cancelCustomerBookingSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const booking = await rejectTechnicianBooking(
      technicianId,
      id,
      validation.data,
    );

    return successResponse({
      code: 200,
      message: "Booking rejected by technician",
      data: booking,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to reject booking");
  }
}
