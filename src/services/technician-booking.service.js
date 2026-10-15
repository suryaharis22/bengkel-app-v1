import { prisma } from "@/lib/prisma";

import {
  confirmTechnicianServiceBooking,
  countServiceBookings,
  findServiceBookingById,
  findServiceBookings,
  rejectTechnicianServiceBooking,
} from "@/models/service-booking.model";

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

async function getTechnicianOrFail(technicianId) {
  const technician = await findUserById(technicianId);

  if (!technician) {
    throw createServiceError("Technician not found", 404);
  }

  if (technician.role !== "teknisi") {
    throw createServiceError("User is not a technician", 403);
  }

  return technician;
}

async function getAssignedBookingOrFail(technicianId, bookingId) {
  const booking = await findServiceBookingById(bookingId);

  if (!booking) {
    throw createServiceError("Booking not found", 404);
  }

  if (!booking.service_order) {
    throw createServiceError("Service order not found", 404);
  }

  if (booking.service_order.technician_id !== technicianId) {
    throw createServiceError("Booking is not assigned to this technician", 403);
  }

  return booking;
}

export async function getTechnicianBookings(technicianId, options = {}) {
  await getTechnicianOrFail(technicianId);

  const page = Math.max(1, Number(options.page) || 1);
  const perPage = Math.max(1, Number(options.per_page) || 20);
  const skip = (page - 1) * perPage;
  const search = normalizeString(options.search) || "";

  const filters = {
    technician_id: technicianId,
    search,
    status: options.status,
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

export async function getTechnicianBookingById(technicianId, bookingId) {
  await getTechnicianOrFail(technicianId);

  const booking = await getAssignedBookingOrFail(technicianId, bookingId);

  return sanitizeBooking(booking);
}

export async function confirmTechnicianBooking(technicianId, bookingId) {
  await getTechnicianOrFail(technicianId);

  const booking = await getAssignedBookingOrFail(technicianId, bookingId);

  if (booking.status !== "confirmed") {
    throw createServiceError(
      "Only confirmed bookings can be accepted by technician",
      409,
    );
  }

  await prisma.$transaction(async (tx) => {
    const currentBooking = await tx.serviceBooking.findFirst({
      where: {
        id: bookingId,
        status: "confirmed",
        service_order: {
          is: {
            technician_id: technicianId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!currentBooking) {
      throw createServiceError(
        "Booking status changed or booking is not assigned to this technician",
        409,
      );
    }

    await confirmTechnicianServiceBooking(tx, bookingId);
  });

  const updated = await findServiceBookingById(bookingId);

  return sanitizeBooking(updated);
}

export async function rejectTechnicianBooking(
  technicianId,
  bookingId,
  data = {},
) {
  await getTechnicianOrFail(technicianId);

  const booking = await getAssignedBookingOrFail(technicianId, bookingId);

  if (booking.status !== "confirmed") {
    throw createServiceError(
      "Only confirmed bookings can be rejected by technician",
      409,
    );
  }

  const currentNotes = normalizeString(booking.notes);
  const reason = normalizeString(data.notes);

  const notes = reason
    ? currentNotes
      ? `${currentNotes}\nTechnician rejection reason: ${reason}`
      : `Technician rejection reason: ${reason}`
    : currentNotes;

  const result = await prisma.$transaction(async (tx) => {
    const currentBooking = await tx.serviceBooking.findFirst({
      where: {
        id: bookingId,
        status: "confirmed",
        service_order: {
          is: {
            technician_id: technicianId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!currentBooking) {
      throw createServiceError(
        "Booking status changed or booking is not assigned to this technician",
        409,
      );
    }

    return rejectTechnicianServiceBooking(tx, bookingId, notes);
  });

  return sanitizeBooking(result);
}
