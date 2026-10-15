import { prisma } from "@/lib/prisma";

const sparePartVariantSelect = {
  id: true,
  spare_part_id: true,
  name: true,
  sku: true,
  price: true,
  compare_price: true,
  cost_price: true,
  weight: true,
  status: true,
  created_at: true,
  updated_at: true,

  spare_part: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },

  stock: {
    select: {
      id: true,
      stock: true,
      reserved_stock: true,
      minimum_stock: true,
      updated_at: true,
    },
  },
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

export async function findSparePartVariantById(id) {
  return prisma.sparePartVariant.findUnique({
    where: {
      id,
    },
    select: sparePartVariantSelect,
  });
}

export async function findSparePartVariantBySku(sku) {
  return prisma.sparePartVariant.findUnique({
    where: {
      sku,
    },
    select: {
      id: true,
      spare_part_id: true,
      sku: true,
    },
  });
}

export async function findSparePartVariants(sparePartId) {
  return prisma.sparePartVariant.findMany({
    where: {
      spare_part_id: sparePartId,
    },
    orderBy: {
      created_at: "desc",
    },
    select: sparePartVariantSelect,
  });
}

export async function createSparePartVariant(data) {
  return prisma.sparePartVariant.create({
    data,
    select: sparePartVariantSelect,
  });
}

export async function updateSparePartVariant(id, data) {
  return prisma.sparePartVariant.update({
    where: {
      id,
    },
    data,
    select: sparePartVariantSelect,
  });
}

export async function deleteSparePartVariant(id) {
  return prisma.sparePartVariant.delete({
    where: {
      id,
    },
  });
}
