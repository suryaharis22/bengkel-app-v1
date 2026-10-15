import { prisma } from "@/lib/prisma";

export async function findWorkshopServiceById(id, tx = prisma) {
  return tx.workshopService.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          order_items: true,
        },
      },
    },
  });
}

export async function findWorkshopServices(
  { search = "", status, skip = 0, take = 10 },
  tx = prisma,
) {
  const where = {
    ...(search
      ? {
          name: {
            contains: search,
          },
        }
      : {}),
    ...(status !== undefined
      ? {
          status,
        }
      : {}),
  };

  return tx.workshopService.findMany({
    where,
    skip,
    take,
    orderBy: {
      created_at: "desc",
    },
    include: {
      _count: {
        select: {
          order_items: true,
        },
      },
    },
  });
}

export async function countWorkshopServices(
  { search = "", status },
  tx = prisma,
) {
  const where = {
    ...(search
      ? {
          name: {
            contains: search,
          },
        }
      : {}),
    ...(status !== undefined
      ? {
          status,
        }
      : {}),
  };

  return tx.workshopService.count({
    where,
  });
}

export async function findWorkshopServiceByName(name, tx = prisma) {
  return tx.workshopService.findFirst({
    where: {
      name,
    },
  });
}

export async function createWorkshopService(data, tx = prisma) {
  return tx.workshopService.create({
    data,
    include: {
      _count: {
        select: {
          order_items: true,
        },
      },
    },
  });
}

export async function updateWorkshopService(id, data, tx = prisma) {
  return tx.workshopService.update({
    where: {
      id,
    },
    data,
    include: {
      _count: {
        select: {
          order_items: true,
        },
      },
    },
  });
}

export async function deleteWorkshopService(id, tx = prisma) {
  return tx.workshopService.delete({
    where: {
      id,
    },
  });
}
