import {
  getAdminBookings,
  getAdminBookingById,
  createAdminCustomerBooking,
  createAdminGuestBooking,
  confirmAdminBooking,
  rejectAdminBooking,
  cancelAdminBooking,
} from "@/services/admin-booking.service";

import {
  adminBookingQuerySchema,
  adminBookingIdSchema,
  adminCreateBookingSchema,
  adminCreateRegisteredBookingSchema,
  adminCreateGuestBookingSchema,
  adminConfirmBookingSchema,
  adminRejectBookingSchema,
  adminCancelBookingSchema,
} from "@/validations/admin-booking.validation";

import { successResponse, errorResponse } from "@/lib/response";
import { getZodErrors } from "@/lib/zod-error";

function getAuthUserId(auth) {
  return auth?.user?.id ?? auth?.userId ?? auth?.id ?? null;
}

function parseId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

async function parseRequestBody(request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return {};
  }

  const text = await request.text();

  if (!text.trim()) {
    return {};
  }

  let body;

  try {
    body = JSON.parse(text);
  } catch {
    const error = new Error("Invalid JSON request body");
    error.statusCode = 400;
    error.code = "INVALID_REQUEST_BODY";
    throw error;
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("Request body must be a JSON object");
    error.statusCode = 400;
    error.code = "INVALID_REQUEST_BODY";
    throw error;
  }

  return body;
}

function normalizeConfirmBookingBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }

  const normalizedBody = { ...body };

  if (
    normalizedBody.technician_id !== undefined &&
    normalizedBody.technician_id !== null &&
    normalizedBody.technician_id !== ""
  ) {
    normalizedBody.technician_id = Number(normalizedBody.technician_id);
  }

  return normalizedBody;
}

function handleControllerError(error, fallbackMessage) {
  console.error("Admin Booking Controller Error:", error);

  return errorResponse({
    code: error?.statusCode || 500,
    message: error?.message || fallbackMessage,
    ...(error?.errors ? { errors: error.errors } : {}),
  });
}

function validateAdminAuth(auth) {
  const adminId = getAuthUserId(auth);

  if (!adminId) {
    return {
      error: errorResponse({
        code: 401,
        message: "Unauthorized",
      }),
    };
  }

  return { adminId };
}

export async function getAdminBookingsController(request, auth) {
  try {
    const { adminId, error } = validateAdminAuth(auth);

    if (error) {
      return error;
    }

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const validation = adminBookingQuerySchema.safeParse(query);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const result = await getAdminBookings(adminId, validation.data);

    return successResponse({
      code: 200,
      message: "Bookings retrieved successfully",
      data: result?.data ?? [],
      meta: result?.meta ?? null,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve bookings");
  }
}

export async function getAdminBookingController(bookingId, auth) {
  try {
    const { adminId, error } = validateAdminAuth(auth);

    if (error) {
      return error;
    }

    const id = parseId(bookingId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid booking ID",
      });
    }

    const validation = adminBookingIdSchema.safeParse({ id });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const booking = await getAdminBookingById(adminId, id);

    return successResponse({
      code: 200,
      message: "Booking retrieved successfully",
      data: booking,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve booking");
  }
}

export async function createAdminBookingController(request, auth) {
  try {
    const { adminId, error } = validateAdminAuth(auth);

    if (error) {
      return error;
    }

    const body = await parseRequestBody(request);
    const validation = adminCreateBookingSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const data = validation.data;
    let booking;

    if (data.customer_type === "registered") {
      booking = await createAdminCustomerBooking(adminId, data);
    } else {
      booking = await createAdminGuestBooking(adminId, {
        ...data,
        vehicle: {
          plate_number: data.plate_number,
          brand: data.brand,
          model: data.model,
          year: data.year,
          color: data.color,
        },
      });
    }

    return successResponse({
      code: 201,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to create booking");
  }
}

export async function createAdminCustomerBookingController(request, auth) {
  try {
    const { adminId, error } = validateAdminAuth(auth);

    if (error) {
      return error;
    }

    const body = await parseRequestBody(request);
    const validation = adminCreateRegisteredBookingSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const booking = await createAdminCustomerBooking(adminId, validation.data);

    return successResponse({
      code: 201,
      message: "Customer booking created successfully",
      data: booking,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to create customer booking");
  }
}

export async function createAdminGuestBookingController(request, auth) {
  try {
    const { adminId, error } = validateAdminAuth(auth);

    if (error) {
      return error;
    }

    const body = await parseRequestBody(request);
    const validation = adminCreateGuestBookingSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const data = validation.data;

    const booking = await createAdminGuestBooking(adminId, {
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      vehicle: {
        plate_number: data.plate_number,
        brand: data.brand,
        model: data.model,
        year: data.year,
        color: data.color,
      },
      complaint: data.complaint,
      notes: data.notes,
      scheduled_at: data.scheduled_at,
    });

    return successResponse({
      code: 201,
      message: "Guest booking created successfully",
      data: booking,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to create guest booking");
  }
}

export async function confirmAdminBookingController(request, bookingId, auth) {
  try {
    const { adminId, error } = validateAdminAuth(auth);

    if (error) {
      return error;
    }

    const id = parseId(bookingId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid booking ID",
      });
    }

    const body = await parseRequestBody(request);
    const normalizedBody = normalizeConfirmBookingBody(body);
    const validation = adminConfirmBookingSchema.safeParse(normalizedBody);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const booking = await confirmAdminBooking(adminId, id, validation.data);

    return successResponse({
      code: 200,
      message: "Booking confirmed successfully",
      data: booking,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to confirm booking");
  }
}

export async function rejectAdminBookingController(request, bookingId, auth) {
  try {
    const { adminId, error } = validateAdminAuth(auth);

    if (error) {
      return error;
    }

    const id = parseId(bookingId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid booking ID",
      });
    }

    const body = await parseRequestBody(request);
    const validation = adminRejectBookingSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const booking = await rejectAdminBooking(adminId, id, validation.data);

    return successResponse({
      code: 200,
      message: "Booking rejected successfully",
      data: booking,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to reject booking");
  }
}

export async function cancelAdminBookingController(request, bookingId, auth) {
  try {
    const { adminId, error } = validateAdminAuth(auth);

    if (error) {
      return error;
    }

    const id = parseId(bookingId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid booking ID",
      });
    }

    const body = await parseRequestBody(request);
    const validation = adminCancelBookingSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const booking = await cancelAdminBooking(adminId, id, validation.data);

    return successResponse({
      code: 200,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to cancel booking");
  }
}
