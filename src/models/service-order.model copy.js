import { prisma } from "@/lib/prisma";

const servicePaymentSelect = {
  id: true,
  service_order_id: true,
  payment_method: true,
  provider: true,
  amount: true,
  reference_number: true,
  midtrans_order_id: true,
  midtrans_transaction_id: true,
  midtrans_payment_type: true,
  midtrans_transaction_status: true,
  paid_at: true,
  created_at: true,
};

const serviceOrderSelect = {
  id: true,
  order_number: true,
  booking_id: true,
  technician_id: true,
  confirmed_by_id: true,
  complaint: true,
  diagnosis: true,
  notes: true,
  subtotal: true,
  discount: true,
  tax: true,
  grand_total: true,
  payment_fee: true,
  paid_amount: true,
  change_amount: true,
  payment_status: true,
  status: true,
  midtrans_order_id: true,
  midtrans_transaction_id: true,
  midtrans_payment_type: true,
  midtrans_transaction_status: true,
  confirmed_at: true,
  started_at: true,
  completed_at: true,
  cancelled_at: true,
  created_at: true,
  updated_at: true,

  booking: {
    select: {
      id: true,
      booking_number: true,
      customer_id: true,
      vehicle_id: true,
      customer_name: true,
      customer_phone: true,
      complaint: true,
      notes: true,
      scheduled_at: true,
      status: true,

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
        select: {
          id: true,
          user_id: true,
          plate_number: true,
          brand: true,
          model: true,
          year: true,
          color: true,
        },
      },
    },
  },

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
      no_hp: true,
      role: true,
    },
  },

  service_items: {
    orderBy: {
      id: "asc",
    },

    select: {
      id: true,
      service_order_id: true,
      service_id: true,
      name: true,
      quantity: true,
      unit_price: true,
      discount: true,
      subtotal: true,
      created_at: true,
      updated_at: true,

      service: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          status: true,
        },
      },
    },
  },

  spare_part_items: {
    orderBy: {
      id: "asc",
    },

    select: {
      id: true,
      service_order_id: true,
      spare_part_id: true,
      variant_id: true,
      name: true,
      sku: true,
      quantity: true,
      unit_price: true,
      discount: true,
      subtotal: true,
      created_at: true,
      updated_at: true,

      spare_part: {
        select: {
          id: true,
          category_id: true,
          brand_id: true,
          name: true,
          slug: true,
          sku: true,
          part_number: true,
          price: true,
          compare_price: true,
          cost_price: true,
          weight: true,
          status: true,
          is_featured: true,
        },
      },

      variant: {
        select: {
          id: true,
          spare_part_id: true,
          name: true,
          sku: true,
          price: true,
          compare_price: true,
          cost_price: true,
          weight: true,
          status: true,

          stock: {
            select: {
              id: true,
              variant_id: true,
              stock: true,
              reserved_stock: true,
              minimum_stock: true,
              updated_at: true,
            },
          },
        },
      },
    },
  },

  payments: {
    orderBy: {
      id: "asc",
    },

    select: servicePaymentSelect,
  },
};

const serviceOrderItemSelect = {
  id: true,
  service_order_id: true,
  service_id: true,
  name: true,
  quantity: true,
  unit_price: true,
  discount: true,
  subtotal: true,
  created_at: true,
  updated_at: true,

  service: {
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      status: true,
    },
  },
};

const serviceOrderSparePartSelect = {
  id: true,
  service_order_id: true,
  spare_part_id: true,
  variant_id: true,
  name: true,
  sku: true,
  quantity: true,
  unit_price: true,
  discount: true,
  subtotal: true,
  created_at: true,
  updated_at: true,

  spare_part: {
    select: {
      id: true,
      sku: true,
      name: true,
      status: true,
    },
  },

  variant: {
    select: {
      id: true,
      spare_part_id: true,
      name: true,
      sku: true,
      price: true,
      compare_price: true,
      cost_price: true,
      weight: true,
      status: true,

      stock: {
        select: {
          id: true,
          variant_id: true,
          stock: true,
          reserved_stock: true,
          minimum_stock: true,
          updated_at: true,
        },
      },
    },
  },
};

function buildServiceOrderWhere({
  search = "",
  technician_id,
  customer_id,
  status,
  payment_status,
} = {}) {
  const where = {};

  if (technician_id !== undefined && technician_id !== null) {
    where.technician_id = technician_id;
  }

  if (customer_id !== undefined && customer_id !== null) {
    where.booking = {
      is: {
        customer_id,
      },
    };
  }

  if (status) {
    where.status = status;
  }

  if (payment_status) {
    where.payment_status = payment_status;
  }

  const keyword = String(search).trim();

  if (keyword) {
    where.OR = [
      {
        order_number: {
          contains: keyword,
        },
      },
      {
        complaint: {
          contains: keyword,
        },
      },
      {
        diagnosis: {
          contains: keyword,
        },
      },
      {
        notes: {
          contains: keyword,
        },
      },
      {
        booking: {
          is: {
            booking_number: {
              contains: keyword,
            },
          },
        },
      },
      {
        booking: {
          is: {
            customer_name: {
              contains: keyword,
            },
          },
        },
      },
      {
        booking: {
          is: {
            customer_phone: {
              contains: keyword,
            },
          },
        },
      },
      {
        booking: {
          is: {
            vehicle: {
              is: {
                plate_number: {
                  contains: keyword,
                },
              },
            },
          },
        },
      },
      {
        booking: {
          is: {
            vehicle: {
              is: {
                brand: {
                  contains: keyword,
                },
              },
            },
          },
        },
      },
      {
        booking: {
          is: {
            vehicle: {
              is: {
                model: {
                  contains: keyword,
                },
              },
            },
          },
        },
      },
      {
        technician: {
          is: {
            username: {
              contains: keyword,
            },
          },
        },
      },
    ];
  }

  return where;
}

/**
 * SERVICE ORDER
 */

export async function findServiceOrderById(id, db = prisma) {
  return db.serviceOrder.findUnique({
    where: {
      id,
    },
    select: serviceOrderSelect,
  });
}

export async function findServiceOrderByNumber(orderNumber, db = prisma) {
  return db.serviceOrder.findUnique({
    where: {
      order_number: orderNumber,
    },
    select: serviceOrderSelect,
  });
}

export async function findServiceOrderByBookingId(bookingId, db = prisma) {
  return db.serviceOrder.findUnique({
    where: {
      booking_id: bookingId,
    },
    select: serviceOrderSelect,
  });
}

export async function findServiceOrders({
  search = "",
  technician_id,
  customer_id,
  status,
  payment_status,
  skip = 0,
  take = 20,
} = {}) {
  const where = buildServiceOrderWhere({
    search,
    technician_id,
    customer_id,
    status,
    payment_status,
  });

  const [orders, total] = await Promise.all([
    prisma.serviceOrder.findMany({
      where,
      skip,
      take,
      orderBy: {
        created_at: "desc",
      },
      select: serviceOrderSelect,
    }),

    prisma.serviceOrder.count({
      where,
    }),
  ]);

  return {
    data: orders,
    meta: {
      total,
    },
  };
}

export async function countServiceOrders({
  search = "",
  technician_id,
  customer_id,
  status,
  payment_status,
} = {}) {
  const where = buildServiceOrderWhere({
    search,
    technician_id,
    customer_id,
    status,
    payment_status,
  });

  return prisma.serviceOrder.count({
    where,
  });
}

/**
 * HISTORI SERVIS TEKNISI, DIKELOMPOKKAN BERDASARKAN KENDARAAN
 *
 * Satu grup berisi satu kendaraan dan seluruh histori servisnya.
 * Pagination diterapkan pada grup kendaraan, bukan pada order individual.
 *
 * Default status completed agar yang ditampilkan hanya servis selesai.
 * Kirim status: null untuk menyertakan semua status.
 */

export async function findTechnicianVehicleServiceHistory(
  {
    technician_id,
    search = "",
    status = "completed",
    skip = 0,
    take = 10,
  } = {},
  db = prisma,
) {
  if (
    technician_id === undefined ||
    technician_id === null ||
    !Number.isInteger(Number(technician_id)) ||
    Number(technician_id) <= 0
  ) {
    throw new Error("Technician ID tidak valid.");
  }

  const normalizedTechnicianId = Number(technician_id);
  const normalizedSkip = Math.max(0, Number(skip) || 0);
  const normalizedTake = Math.max(1, Number(take) || 10);

  const where = buildServiceOrderWhere({
    technician_id: normalizedTechnicianId,
    search,
    status,
  });

  const orders = await db.serviceOrder.findMany({
    where,
    orderBy: [
      {
        completed_at: "desc",
      },
      {
        created_at: "desc",
      },
      {
        id: "desc",
      },
    ],
    select: serviceOrderSelect,
  });

  const vehicleGroups = new Map();

  for (const order of orders) {
    const vehicle = order.booking?.vehicle;

    if (!vehicle?.id) {
      continue;
    }

    if (!vehicleGroups.has(vehicle.id)) {
      vehicleGroups.set(vehicle.id, {
        vehicle_id: vehicle.id,
        vehicle,
        total_services: 0,
        last_serviced_at: null,
        service_orders: [],
      });
    }

    const group = vehicleGroups.get(vehicle.id);

    group.service_orders.push(order);
    group.total_services += 1;

    const servicedAt = order.completed_at || order.created_at;

    if (
      servicedAt &&
      (!group.last_serviced_at ||
        new Date(servicedAt).getTime() >
          new Date(group.last_serviced_at).getTime())
    ) {
      group.last_serviced_at = servicedAt;
    }
  }

  const allGroups = Array.from(vehicleGroups.values()).sort((a, b) => {
    const dateA = a.last_serviced_at
      ? new Date(a.last_serviced_at).getTime()
      : 0;

    const dateB = b.last_serviced_at
      ? new Date(b.last_serviced_at).getTime()
      : 0;

    return dateB - dateA;
  });

  const totalVehicles = allGroups.length;

  const data = allGroups.slice(normalizedSkip, normalizedSkip + normalizedTake);

  return {
    data,
    meta: {
      total: totalVehicles,
      skip: normalizedSkip,
      take: normalizedTake,
      total_pages: Math.ceil(totalVehicles / normalizedTake),
    },
  };
}

/**
 * CREATE / UPDATE / DELETE SERVICE ORDER
 */

export async function createServiceOrder(tx, data) {
  return tx.serviceOrder.create({
    data,
    select: serviceOrderSelect,
  });
}

export async function updateServiceOrder(tx, id, data) {
  return tx.serviceOrder.update({
    where: {
      id,
    },
    data,
    select: serviceOrderSelect,
  });
}

export async function deleteServiceOrder(tx, id) {
  return tx.serviceOrder.delete({
    where: {
      id,
    },
  });
}

/**
 * USER
 */

export async function findUserById(id, db = prisma) {
  return db.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      username: true,
      email: true,
      no_hp: true,
      role: true,
    },
  });
}

/**
 * WORKSHOP SERVICE
 */

export async function findWorkshopServiceById(id, db = prisma) {
  return db.workshopService.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      status: true,
    },
  });
}

/**
 * SPARE PART VARIANT
 */

export async function findSparePartVariantById(id, db = prisma) {
  return db.sparePartVariant.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      spare_part_id: true,
      name: true,
      sku: true,
      price: true,
      compare_price: true,
      cost_price: true,
      weight: true,
      status: true,

      spare_part: {
        select: {
          id: true,
          name: true,
          sku: true,
          status: true,
        },
      },

      stock: {
        select: {
          id: true,
          variant_id: true,
          stock: true,
          reserved_stock: true,
          minimum_stock: true,
          updated_at: true,
        },
      },
    },
  });
}

/**
 * SERVICE ORDER ITEM
 */

export async function findServiceOrderItemById(orderId, itemId, db = prisma) {
  return db.serviceOrderItem.findFirst({
    where: {
      id: itemId,
      service_order_id: orderId,
    },
    select: serviceOrderItemSelect,
  });
}

export async function addServiceOrderItem(tx, data) {
  return tx.serviceOrderItem.create({
    data,
    select: serviceOrderItemSelect,
  });
}

export async function updateServiceOrderItem(tx, orderId, itemId, data) {
  return tx.serviceOrderItem.updateMany({
    where: {
      id: itemId,
      service_order_id: orderId,
    },
    data,
  });
}

export async function deleteServiceOrderItem(tx, orderId, itemId) {
  return tx.serviceOrderItem.deleteMany({
    where: {
      id: itemId,
      service_order_id: orderId,
    },
  });
}

/**
 * SERVICE ORDER SPARE PART
 */

export async function findServiceOrderSparePartItemById(
  orderId,
  itemId,
  db = prisma,
) {
  return db.serviceOrderSparePart.findFirst({
    where: {
      id: itemId,
      service_order_id: orderId,
    },
    select: serviceOrderSparePartSelect,
  });
}

export async function addServiceOrderSparePartItem(tx, data) {
  return tx.serviceOrderSparePart.create({
    data,
    select: serviceOrderSparePartSelect,
  });
}

export async function updateServiceOrderSparePartItem(
  tx,
  orderId,
  itemId,
  data,
) {
  return tx.serviceOrderSparePart.updateMany({
    where: {
      id: itemId,
      service_order_id: orderId,
    },
    data,
  });
}

export async function deleteServiceOrderSparePartItem(tx, orderId, itemId) {
  return tx.serviceOrderSparePart.deleteMany({
    where: {
      id: itemId,
      service_order_id: orderId,
    },
  });
}
