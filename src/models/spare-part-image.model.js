import { prisma } from "@/lib/prisma";

const sparePartImageSelect = {
  id: true,
  spare_part_id: true,
  image_url: true,
  sort_order: true,
  is_primary: true,
  created_at: true,
};

export async function findSparePartById(id) {
  return prisma.sparePart.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

export async function findSparePartImageById(id) {
  return prisma.sparePartImage.findUnique({
    where: {
      id,
    },
    select: {
      ...sparePartImageSelect,

      spare_part: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function findSparePartImages(sparePartId) {
  return prisma.sparePartImage.findMany({
    where: {
      spare_part_id: sparePartId,
    },
    orderBy: [
      {
        sort_order: "asc",
      },
      {
        id: "asc",
      },
    ],
    select: sparePartImageSelect,
  });
}

export async function countSparePartImages(sparePartId) {
  return prisma.sparePartImage.count({
    where: {
      spare_part_id: sparePartId,
    },
  });
}

export async function createSparePartImage(data) {
  return prisma.sparePartImage.create({
    data,
    select: sparePartImageSelect,
  });
}

export async function updateSparePartImage(id, data) {
  return prisma.sparePartImage.update({
    where: {
      id,
    },
    data,
    select: sparePartImageSelect,
  });
}

export async function deleteSparePartImage(id) {
  return prisma.sparePartImage.delete({
    where: {
      id,
    },
    select: sparePartImageSelect,
  });
}

export async function setPrimarySparePartImage(id, sparePartId) {
  return prisma.$transaction(async (tx) => {
    await tx.sparePartImage.updateMany({
      where: {
        spare_part_id: sparePartId,
        is_primary: true,
      },
      data: {
        is_primary: false,
      },
    });

    return tx.sparePartImage.update({
      where: {
        id,
      },
      data: {
        is_primary: true,
      },
      select: sparePartImageSelect,
    });
  });
}

export async function reorderSparePartImages(sparePartId, items) {
  return prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.sparePartImage.update({
        where: {
          id: item.id,
        },
        data: {
          sort_order: item.sort_order,
        },
      });
    }

    return tx.sparePartImage.findMany({
      where: {
        spare_part_id: sparePartId,
      },
      orderBy: [
        {
          sort_order: "asc",
        },
        {
          id: "asc",
        },
      ],
      select: sparePartImageSelect,
    });
  });
}
