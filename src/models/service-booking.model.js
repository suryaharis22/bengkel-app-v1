import { prisma } from "@/lib/prisma";

const bookingInclude = {
  customer: {
    select: {
      id: true,
      username: true,
      email: true,
      no_hp: true,
      role: true,
    },
  },

  vehicle: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          no_hp: true,
          role: true,
        },
      },
    },
  },

  service_order: {
    include: {
      technician: {
        select: {
          id: true,
          username: true,
          email: true,
          no_hp: true,
          role: true,
        },
      },

      confirmed_by: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      },
    },
  },
};

function buildServiceBookingWhere({
  customer_id,
  customer_type,
  status,
  technician_id,
  search,
  date_from,
  date_to,
} = {}) {
  const where = {};

  if (customer_type === "registered") {
    where.customer_id = {
      not: null,
    };
  } else if (customer_type === "guest") {
    where.customer_id = null;
  } else if (customer_id !== undefined) {
    where.customer_id = customer_id;
  }

  if (status) {
    where.status = status;
  }

  if (technician_id !== undefined) {
    where.service_order = {
      is: {
        technician_id,
      },
    };
  }

  if (search) {
    where.OR = [
      {
        booking_number: {
          contains: search,
        },
      },
      {
        customer_name: {
          contains: search,
        },
      },
      {
        customer_phone: {
          contains: search,
        },
      },
      {
        complaint: {
          contains: search,
        },
      },
      {
        vehicle: {
          is: {
            plate_number: {
              contains: search,
            },
          },
        },
      },
      {
        vehicle: {
          is: {
            brand: {
              contains: search,
            },
          },
        },
      },
      {
        vehicle: {
          is: {
            model: {
              contains: search,
            },
          },
        },
      },
    ];
  }

  if (date_from || date_to) {
    where.scheduled_at = {};

    if (date_from) {
      where.scheduled_at.gte = date_from;
    }

    if (date_to) {
      where.scheduled_at.lte = date_to;
    }
  }

  return where;
}

export async function findServiceBookingById(id, tx = prisma) {
  return tx.serviceBooking.findUnique({
    where: {
      id,
    },
    include: bookingInclude,
  });
}

export async function findServiceBookings(
  {
    customer_id,
    customer_type,
    status,
    technician_id,
    search,
    date_from,
    date_to,
    skip = 0,
    take = 20,
  } = {},
  tx = prisma,
) {
  const where = buildServiceBookingWhere({
    customer_id,
    customer_type,
    status,
    technician_id,
    search,
    date_from,
    date_to,
  });

  return tx.serviceBooking.findMany({
    where,
    include: bookingInclude,
    orderBy: [
      {
        scheduled_at: "desc",
      },
      {
        id: "desc",
      },
    ],
    skip,
    take,
  });
}

export async function countServiceBookings(
  {
    customer_id,
    customer_type,
    status,
    technician_id,
    search,
    date_from,
    date_to,
  } = {},
  tx = prisma,
) {
  const where = buildServiceBookingWhere({
    customer_id,
    customer_type,
    status,
    technician_id,
    search,
    date_from,
    date_to,
  });

  return tx.serviceBooking.count({
    where,
  });
}

export async function createServiceBooking(tx, data) {
  return tx.serviceBooking.create({
    data,
    include: bookingInclude,
  });
}

export async function updateServiceBooking(tx, id, data) {
  return tx.serviceBooking.update({
    where: {
      id,
    },
    data,
    include: bookingInclude,
  });
}

export async function deleteServiceBooking(tx, id) {
  return tx.serviceBooking.delete({
    where: {
      id,
    },
  });
}

export async function confirmTechnicianServiceBooking(tx, bookingId) {
  await tx.serviceBooking.update({
    where: {
      id: bookingId,
    },
    data: {
      status: "technician_confirmed",
    },
  });

  return tx.serviceOrder.update({
    where: {
      booking_id: bookingId,
    },
    data: {
      status: "confirmed",
      confirmed_at: new Date(),
    },
  });
}

export async function rejectTechnicianServiceBooking(tx, bookingId, notes) {
  const updatedBooking = await tx.serviceBooking.update({
    where: {
      id: bookingId,
    },
    data: {
      status: "rejected",
      notes,
    },
    include: bookingInclude,
  });

  await tx.serviceOrder.update({
    where: {
      booking_id: bookingId,
    },
    data: {
      status: "cancelled",
      cancelled_at: new Date(),
    },
  });

  return updatedBooking;
}
