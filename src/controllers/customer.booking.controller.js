import {
  getCustomerBookings,
  getCustomerBooking,
  createCustomerBooking,
  cancelCustomerBooking,
} from "@/services/customer-booking.service";

import {
  serviceBookingQuerySchema,
  serviceBookingIdSchema,
  createCustomerBookingSchema,
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

export async function getCustomerBookingsController(request, auth) {
  try {
    const customerId = getAuthUserId(auth);

    if (!customerId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const { searchParams } = new URL(request.url);

    const query = serviceBookingQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!query.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(query.error),
      });
    }

    const result = await getCustomerBookings(customerId, query.data);

    return successResponse({
      code: 200,
      message: "Customer bookings retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve customer bookings");
  }
}

export async function getCustomerBookingController(bookingId, auth) {
  try {
    const customerId = getAuthUserId(auth);

    if (!customerId) {
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

    const booking = await getCustomerBooking(customerId, id);

    return successResponse({
      code: 200,
      message: "Booking retrieved successfully",
      data: booking,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve booking");
  }
}

export async function createCustomerBookingController(request, auth) {
  try {
    const customerId = getAuthUserId(auth);

    if (!customerId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const body = await request.json();

    const validation = createCustomerBookingSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const booking = await createCustomerBooking(customerId, validation.data);

    return successResponse({
      code: 201,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to create booking");
  }
}

export async function cancelCustomerBookingController(
  request,
  bookingId,
  auth,
) {
  try {
    const customerId = getAuthUserId(auth);

    if (!customerId) {
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

    const booking = await cancelCustomerBooking(
      customerId,
      id,
      validation.data,
    );

    return successResponse({
      code: 200,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to cancel booking");
  }
}
