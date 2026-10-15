import { prisma } from "@/lib/prisma";

import {
  countServiceBookings,
  createServiceBooking,
  findServiceBookingById,
  findServiceBookings,
  updateServiceBooking,
} from "@/models/service-booking.model";

import { findVehicleById } from "@/models/vehicle.model";

import { findUserById } from "@/models/user.model";

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
}

function normalizeString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();

  return normalized || null;
}

function normalizeDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw createServiceError("Invalid scheduled date and time", 422);
  }

  return date;
}

function generateBookingNumber() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  const random = Math.floor(100000 + Math.random() * 900000);

  return `BOOK-${year}${month}${day}-${random}`;
}

function sanitizeBooking(booking) {
  if (!booking) {
    return null;
  }

  return {
    id: booking.id,
    booking_number: booking.booking_number,
    customer_id: booking.customer_id,
    customer_name: booking.customer_name,
    customer_phone: booking.customer_phone,
    complaint: booking.complaint,
    notes: booking.notes,
    scheduled_at: booking.scheduled_at,
    status: booking.status,
    created_at: booking.created_at,
    updated_at: booking.updated_at,

    customer: booking.customer
      ? {
          id: booking.customer.id,
          username: booking.customer.username,
          email: booking.customer.email,
          no_hp: booking.customer.no_hp,
          role: booking.customer.role,
        }
      : null,

    vehicle: booking.vehicle
      ? {
          id: booking.vehicle.id,
          user_id: booking.vehicle.user_id,
          plate_number: booking.vehicle.plate_number,
          brand: booking.vehicle.brand,
          model: booking.vehicle.model,
          year: booking.vehicle.year,
          color: booking.vehicle.color,
        }
      : null,

    service_order: booking.service_order
      ? {
          id: booking.service_order.id,
          order_number: booking.service_order.order_number,
          technician_id: booking.service_order.technician_id,
          confirmed_by_id: booking.service_order.confirmed_by_id,
          status: booking.service_order.status,
          payment_status: booking.service_order.payment_status,
          grand_total: booking.service_order.grand_total,
        }
      : null,
  };
}

function sanitizeBookingList(bookings) {
  return bookings.map(sanitizeBooking);
}

async function getCustomerOrFail(customerId) {
  const customer = await findUserById(customerId);

  if (!customer) {
    throw createServiceError("Customer not found", 404);
  }

  if (customer.role !== "customer") {
    throw createServiceError("User is not a customer", 403);
  }

  return customer;
}

async function getCustomerVehicleOrFail(customerId, vehicleId) {
  const vehicle = await findVehicleById(vehicleId);

  if (!vehicle) {
    throw createServiceError("Vehicle not found", 404);
  }

  if (vehicle.user_id !== customerId) {
    throw createServiceError("Vehicle does not belong to customer", 403);
  }

  return vehicle;
}

async function ensureBookingNumber(tx) {
  let bookingNumber;

  do {
    bookingNumber = generateBookingNumber();

    const existing = await tx.serviceBooking.findUnique({
      where: {
        booking_number: bookingNumber,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return bookingNumber;
    }
  } while (true);
}

export async function getCustomerBookings(customerId, options = {}) {
  await getCustomerOrFail(customerId);

  const page = Number(options.page) || 1;

  const perPage = Number(options.per_page) || 20;

  const search = normalizeString(options.search) || "";

  const skip = (page - 1) * perPage;

  const [bookings, total] = await Promise.all([
    findServiceBookings({
      customer_id: customerId,
      search,
      status: options.status,
      skip,
      take: perPage,
    }),

    countServiceBookings({
      customer_id: customerId,
      search,
      status: options.status,
    }),
  ]);

  return {
    data: sanitizeBookingList(bookings),

    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  };
}

export async function getCustomerBooking(customerId, bookingId) {
  await getCustomerOrFail(customerId);

  const booking = await findServiceBookingById(bookingId);

  if (!booking) {
    throw createServiceError("Booking not found", 404);
  }

  if (booking.customer_id !== customerId) {
    throw createServiceError("Booking does not belong to customer", 403);
  }

  return sanitizeBooking(booking);
}

export async function createCustomerBooking(customerId, data) {
  await getCustomerOrFail(customerId);

  const vehicle = await getCustomerVehicleOrFail(customerId, data.vehicle_id);

  const scheduledAt = normalizeDateTime(data.scheduled_at);

  if (scheduledAt.getTime() <= Date.now()) {
    throw createServiceError(
      "Scheduled date and time must be in the future",
      422,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const bookingNumber = await ensureBookingNumber(tx);

    return createServiceBooking(tx, {
      booking_number: bookingNumber,

      customer_id: customerId,

      vehicle_id: vehicle.id,

      customer_name: vehicle.user?.username || "",

      customer_phone: vehicle.user?.no_hp || "",

      complaint: data.complaint.trim(),

      notes: normalizeString(data.notes),

      scheduled_at: scheduledAt,

      status: "pending",
    });
  });

  return sanitizeBooking(result);
}

export async function cancelCustomerBooking(customerId, bookingId, data) {
  await getCustomerOrFail(customerId);

  const booking = await findServiceBookingById(bookingId);

  if (!booking) {
    throw createServiceError("Booking not found", 404);
  }

  if (booking.customer_id !== customerId) {
    throw createServiceError("Booking does not belong to customer", 403);
  }

  if (booking.status !== "pending") {
    throw createServiceError("Only pending bookings can be cancelled", 409);
  }

  const currentNotes = normalizeString(booking.notes);

  const cancellationNotes = normalizeString(data?.notes);

  const notes = cancellationNotes
    ? currentNotes
      ? `${currentNotes}\nCancellation reason: ${cancellationNotes}`
      : `Cancellation reason: ${cancellationNotes}`
    : currentNotes;

  const updated = await updateServiceBooking(prisma, bookingId, {
    status: "cancelled",
    notes,
  });

  return sanitizeBooking(updated);
}
