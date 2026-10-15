import { prisma } from "@/lib/prisma";

const vehicleInclude = {
  user: {
    select: {
      id: true,
      username: true,
      email: true,
      no_hp: true,
      role: true,
    },
  },

  service_bookings: {
    select: {
      id: true,
      customer_id: true,
      customer_name: true,
      customer_phone: true,
      updated_at: true,
    },
    orderBy: {
      updated_at: "desc",
    },
    take: 1,
  },

  _count: {
    select: {
      service_bookings: true,
    },
  },
};

export async function findVehicleById(id, tx = prisma) {
  return tx.vehicle.findUnique({
    where: {
      id,
    },
    include: vehicleInclude,
  });
}

export async function findVehicles(
  { user_id, search, only_guest = false, skip = 0, take = 20 } = {},
  tx = prisma,
) {
  const where = {};

  if (user_id !== undefined) {
    where.user_id = user_id;
  }

  if (only_guest) {
    where.user_id = null;
  }

  if (search) {
    where.OR = [
      {
        plate_number: {
          contains: search,
        },
      },
      {
        brand: {
          contains: search,
        },
      },
      {
        model: {
          contains: search,
        },
      },
    ];
  }

  return tx.vehicle.findMany({
    where,
    include: vehicleInclude,
    orderBy: [
      {
        created_at: "desc",
      },
      {
        id: "desc",
      },
    ],
    skip,
    take,
  });
}

export async function countVehicles(
  { user_id, search, only_guest = false } = {},
  tx = prisma,
) {
  const where = {};

  if (user_id !== undefined) {
    where.user_id = user_id;
  }

  if (only_guest) {
    where.user_id = null;
  }

  if (search) {
    where.OR = [
      {
        plate_number: {
          contains: search,
        },
      },
      {
        brand: {
          contains: search,
        },
      },
      {
        model: {
          contains: search,
        },
      },
    ];
  }

  return tx.vehicle.count({
    where,
  });
}

export async function findVehicleByPlate(plateNumber, tx = prisma) {
  return tx.vehicle.findFirst({
    where: {
      plate_number: plateNumber,
    },
  });
}

export async function createVehicle(tx, data) {
  return tx.vehicle.create({
    data,
    include: vehicleInclude,
  });
}

export async function updateVehicle(tx, id, data) {
  return tx.vehicle.update({
    where: {
      id,
    },
    data,
    include: vehicleInclude,
  });
}

export async function deleteVehicle(tx, id) {
  return tx.vehicle.delete({
    where: {
      id,
    },
  });
}
