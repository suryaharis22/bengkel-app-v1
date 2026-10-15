import { prisma } from "@/lib/prisma";

const sparePartInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  },

  brand: {
    select: {
      id: true,
      name: true,
      slug: true,
      logo_url: true,
      status: true,
    },
  },

  images: {
    orderBy: [
      {
        is_primary: "desc",
      },
      {
        sort_order: "asc",
      },
      {
        id: "asc",
      },
    ],
  },

  variants: {
    orderBy: {
      id: "asc",
    },

    include: {
      stock: true,
    },
  },
};

export async function findSpareParts(where, skip, take) {
  return prisma.sparePart.findMany({
    where,

    skip,

    take,

    orderBy: {
      created_at: "desc",
    },

    include: sparePartInclude,
  });
}

export async function countSpareParts(where) {
  return prisma.sparePart.count({
    where,
  });
}

export async function findSparePartById(id) {
  /*
   * Pastikan model selalu menerima
   * Int, bukan String.
   */
  const sparePartId = Number(id);

  return prisma.sparePart.findUnique({
    where: {
      id: sparePartId,
    },

    include: sparePartInclude,
  });
}

export async function findCategoryById(id) {
  const categoryId = Number(id);

  return prisma.sparePartCategory.findUnique({
    where: {
      id: categoryId,
    },

    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  });
}

export async function findBrandById(id) {
  const brandId = Number(id);

  return prisma.brand.findUnique({
    where: {
      id: brandId,
    },

    select: {
      id: true,
      name: true,
      slug: true,
      logo_url: true,
      status: true,
    },
  });
}

export async function findSparePartBySku(sku) {
  return prisma.sparePart.findUnique({
    where: {
      sku,
    },
  });
}

export async function findSparePartBySlug(slug) {
  return prisma.sparePart.findUnique({
    where: {
      slug,
    },
  });
}

export async function findSparePartBySkuExceptId(sku, id) {
  const sparePartId = Number(id);

  return prisma.sparePart.findFirst({
    where: {
      sku,

      NOT: {
        id: sparePartId,
      },
    },
  });
}

export async function findSparePartBySlugExceptId(slug, id) {
  const sparePartId = Number(id);

  return prisma.sparePart.findFirst({
    where: {
      slug,

      NOT: {
        id: sparePartId,
      },
    },
  });
}

export async function createSparePart(data) {
  return prisma.sparePart.create({
    data,

    include: sparePartInclude,
  });
}

export async function updateSparePart(id, data) {
  const sparePartId = Number(id);

  return prisma.sparePart.update({
    where: {
      id: sparePartId,
    },

    data,

    include: sparePartInclude,
  });
}

export async function deleteSparePart(id) {
  const sparePartId = Number(id);

  return prisma.sparePart.delete({
    where: {
      id: sparePartId,
    },
  });
}

export async function countSparePartImages(sparePartId) {
  const id = Number(sparePartId);

  return prisma.sparePartImage.count({
    where: {
      spare_part_id: id,
    },
  });
}

export async function countSparePartVariants(sparePartId) {
  const id = Number(sparePartId);

  return prisma.sparePartVariant.count({
    where: {
      spare_part_id: id,
    },
  });
}
