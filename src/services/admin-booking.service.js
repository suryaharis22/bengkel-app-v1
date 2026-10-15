import { prisma } from "@/lib/prisma";

import {
  countServiceBookings,
  createServiceBooking,
  findServiceBookingById,
  findServiceBookings,
  updateServiceBooking,
} from "@/models/service-booking.model";

import { findVehicleById, createVehicle } from "@/models/vehicle.model";
import { findUserById } from "@/models/user.model";
import { createServiceOrder } from "@/models/service-order.model";

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizePositiveInt(value, fieldName) {
  const normalized = Number(value);

  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw createServiceError(
      `${fieldName} must be a valid positive integer`,
      422,
    );
  }

  return normalized;
}

function normalizeString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
}

function normalizePlateNumber(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
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

function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(100000 + Math.random() * 900000);

  return `ORD-${year}${month}${day}-${random}`;
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

async function getAdminOrFail(adminId) {
  const normalizedAdminId = normalizePositiveInt(adminId, "Admin ID");
  const admin = await findUserById(normalizedAdminId);

  if (!admin) {
    throw createServiceError("Admin not found", 404);
  }

  if (admin.role !== "admin") {
    throw createServiceError("User is not an admin", 403);
  }

  return admin;
}

async function getCustomerOrFail(customerId) {
  const normalizedCustomerId = normalizePositiveInt(customerId, "Customer ID");
  const customer = await findUserById(normalizedCustomerId);

  if (!customer) {
    throw createServiceError("Customer not found", 404);
  }

  if (customer.role !== "customer") {
    throw createServiceError("User is not a customer", 422);
  }

  return customer;
}

async function getTechnicianOrFail(technicianId) {
  const normalizedTechnicianId = normalizePositiveInt(
    technicianId,
    "Technician ID",
  );
  const technician = await findUserById(normalizedTechnicianId);

  if (!technician) {
    throw createServiceError("Technician not found", 404);
  }

  if (technician.role !== "teknisi") {
    throw createServiceError("User is not a technician", 422);
  }

  return technician;
}

async function ensureBookingNumber(tx) {
  while (true) {
    const bookingNumber = generateBookingNumber();

    const existing = await tx.serviceBooking.findUnique({
      where: { booking_number: bookingNumber },
      select: { id: true },
    });

    if (!existing) {
      return bookingNumber;
    }
  }
}

async function ensureOrderNumber(tx) {
  while (true) {
    const orderNumber = generateOrderNumber();

    const existing = await tx.serviceOrder.findUnique({
      where: { order_number: orderNumber },
      select: { id: true },
    });

    if (!existing) {
      return orderNumber;
    }
  }
}

export async function getAdminBookings(adminId, options = {}) {
  await getAdminOrFail(adminId);

  const page = Math.max(1, Number(options.page) || 1);
  const perPage = Math.max(1, Number(options.per_page) || 20);
  const skip = (page - 1) * perPage;

  const technicianId =
    options.technician_id !== undefined &&
    options.technician_id !== null &&
    options.technician_id !== ""
      ? normalizePositiveInt(options.technician_id, "Technician ID")
      : undefined;

  const dateFrom = options.date_from
    ? normalizeDateTime(options.date_from)
    : undefined;

  const dateTo = options.date_to
    ? normalizeDateTime(options.date_to)
    : undefined;

  const filters = {
    search: normalizeString(options.search) || "",
    status: options.status,
    customer_type: options.customer_type,
    technician_id: technicianId,
    date_from: dateFrom,
    date_to: dateTo,
  };

  const [bookings, total] = await Promise.all([
    findServiceBookings({
      ...filters,
      skip,
      take: perPage,
    }),
    countServiceBookings(filters),
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

export async function getAdminBookingById(adminId, bookingId) {
  await getAdminOrFail(adminId);

  const normalizedBookingId = normalizePositiveInt(bookingId, "Booking ID");
  const booking = await findServiceBookingById(normalizedBookingId);

  if (!booking) {
    throw createServiceError("Booking not found", 404);
  }

  return sanitizeBooking(booking);
}

export async function createAdminCustomerBooking(adminId, data) {
  await getAdminOrFail(adminId);

  const customerId = normalizePositiveInt(data.customer_id, "Customer ID");
  const vehicleId = normalizePositiveInt(data.vehicle_id, "Vehicle ID");

  const customer = await getCustomerOrFail(customerId);
  const vehicle = await findVehicleById(vehicleId);

  if (!vehicle) {
    throw createServiceError("Vehicle not found", 404);
  }

  if (vehicle.user_id !== customer.id) {
    throw createServiceError("Vehicle does not belong to customer", 422);
  }

  const scheduledAt = normalizeDateTime(data.scheduled_at);

  const result = await prisma.$transaction(async (tx) => {
    const bookingNumber = await ensureBookingNumber(tx);

    return createServiceBooking(tx, {
      booking_number: bookingNumber,
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      customer_name: customer.username,
      customer_phone: customer.no_hp || "",
      complaint: String(data.complaint).trim(),
      notes: normalizeString(data.notes),
      scheduled_at: scheduledAt,
      status: "pending",
    });
  });

  return sanitizeBooking(result);
}

export async function createAdminGuestBooking(adminId, data) {
  await getAdminOrFail(adminId);

  if (!data?.vehicle) {
    throw createServiceError("Vehicle data is required", 422);
  }

  const plateNumber = normalizePlateNumber(data.vehicle.plate_number);

  if (!plateNumber) {
    throw createServiceError("Vehicle plate number is required", 422);
  }

  const scheduledAt = normalizeDateTime(data.scheduled_at);

  const result = await prisma.$transaction(async (tx) => {
    const vehicle = await createVehicle(tx, {
      user_id: null,
      plate_number: plateNumber,
      brand: String(data.vehicle.brand).trim(),
      model: String(data.vehicle.model).trim(),
      year:
        data.vehicle.year !== undefined &&
        data.vehicle.year !== null &&
        data.vehicle.year !== ""
          ? Number(data.vehicle.year)
          : null,
      color: normalizeString(data.vehicle.color),
    });

    const bookingNumber = await ensureBookingNumber(tx);

    return createServiceBooking(tx, {
      booking_number: bookingNumber,
      customer_id: null,
      vehicle_id: vehicle.id,
      customer_name: String(data.customer_name).trim(),
      customer_phone: String(data.customer_phone).trim(),
      complaint: String(data.complaint).trim(),
      notes: normalizeString(data.notes),
      scheduled_at: scheduledAt,
      status: "pending",
    });
  });

  return sanitizeBooking(result);
}

export async function confirmAdminBooking(adminId, bookingId, data = {}) {
  const admin = await getAdminOrFail(adminId);
  const normalizedBookingId = normalizePositiveInt(bookingId, "Booking ID");

  const normalizedTechnicianId = normalizePositiveInt(
    data?.technician_id,
    "Technician ID",
  );

  const technician = await getTechnicianOrFail(normalizedTechnicianId);
  const booking = await findServiceBookingById(normalizedBookingId);

  if (!booking) {
    throw createServiceError("Booking not found", 404);
  }

  if (booking.status !== "pending") {
    throw createServiceError("Only pending bookings can be confirmed", 409);
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingOrder = await tx.serviceOrder.findUnique({
      where: { booking_id: normalizedBookingId },
      select: {
        id: true,
        order_number: true,
      },
    });

    if (existingOrder) {
      throw createServiceError(
        "Service order already exists for this booking",
        409,
      );
    }

    const updatedNotes = normalizeString(data?.notes) || booking.notes;

    const updatedBooking = await updateServiceBooking(tx, normalizedBookingId, {
      status: "confirmed",
      notes: updatedNotes,
    });

    const orderNumber = await ensureOrderNumber(tx);

    await createServiceOrder(tx, {
      order_number: orderNumber,
      booking_id: normalizedBookingId,
      technician_id: technician.id,
      confirmed_by_id: admin.id,
      complaint: booking.complaint,
      diagnosis: null,
      notes: updatedNotes,
      subtotal: 0,
      discount: 0,
      tax: 0,
      grand_total: 0,
      payment_fee: 0,
      paid_amount: 0,
      change_amount: 0,
      payment_status: "unpaid",
      status: "pending",
      confirmed_at: new Date(),
    });

    return updatedBooking;
  });

  const updated = await findServiceBookingById(normalizedBookingId);

  return sanitizeBooking(updated || result);
}

export async function rejectAdminBooking(adminId, bookingId, data = {}) {
  await getAdminOrFail(adminId);

  const normalizedBookingId = normalizePositiveInt(bookingId, "Booking ID");
  const booking = await findServiceBookingById(normalizedBookingId);

  if (!booking) {
    throw createServiceError("Booking not found", 404);
  }

  if (booking.status !== "pending") {
    throw createServiceError("Only pending bookings can be rejected", 409);
  }

  const currentNotes = normalizeString(booking.notes);
  const rejectionReason = normalizeString(data.notes);

  const notes = rejectionReason
    ? currentNotes
      ? `${currentNotes}\nRejection reason: ${rejectionReason}`
      : `Rejection reason: ${rejectionReason}`
    : currentNotes;

  const updated = await updateServiceBooking(prisma, normalizedBookingId, {
    status: "rejected",
    notes,
  });

  return sanitizeBooking(updated);
}

export async function cancelAdminBooking(adminId, bookingId, data = {}) {
  await getAdminOrFail(adminId);

  const normalizedBookingId = normalizePositiveInt(bookingId, "Booking ID");
  const booking = await findServiceBookingById(normalizedBookingId);

  if (!booking) {
    throw createServiceError("Booking not found", 404);
  }

  if (booking.status === "cancelled" || booking.status === "rejected") {
    throw createServiceError("Booking is already closed", 409);
  }

  if (booking.service_order && booking.service_order.status !== "pending") {
    throw createServiceError(
      "Booking cannot be cancelled after service has started",
      409,
    );
  }

  const currentNotes = normalizeString(booking.notes);
  const cancellationReason = normalizeString(data.notes);

  const notes = cancellationReason
    ? currentNotes
      ? `${currentNotes}\nCancellation reason: ${cancellationReason}`
      : `Cancellation reason: ${cancellationReason}`
    : currentNotes;

  const updated = await updateServiceBooking(prisma, normalizedBookingId, {
    status: "cancelled",
    notes,
  });

  return sanitizeBooking(updated);
}
