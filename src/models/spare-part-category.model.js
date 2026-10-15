import { prisma } from "@/lib/prisma";

const categorySelect = {
  id: true,
  parent_id: true,
  name: true,
  slug: true,
  description: true,
  image_url: true,
  sort_order: true,
  status: true,
  created_at: true,
  updated_at: true,

  parent: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },

  _count: {
    select: {
      children: true,
      spare_parts: true,
    },
  },
};

/**
 * Menyesuaikan nama spare_parts menjadi products
 * agar kompatibel dengan frontend yang sudah ada.
 */
function formatCategory(category) {
  if (!category) return category;

  const { spare_parts, ...counts } = category._count ?? {};

  return {
    ...category,
    _count: {
      ...counts,
      products: spare_parts ?? 0,
    },
  };
}

export async function findSparePartCategoryById(id) {
  const category = await prisma.sparePartCategory.findUnique({
    where: { id },
    select: categorySelect,
  });

  return formatCategory(category);
}

export async function findSparePartCategoryBySlug(slug) {
  const category = await prisma.sparePartCategory.findUnique({
    where: { slug },
    select: categorySelect,
  });

  return formatCategory(category);
}

export async function findSparePartCategoryByName(name) {
  return prisma.sparePartCategory.findFirst({
    where: { name },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function findSparePartCategories({
  skip = 0,
  take = 10,
  search = "",
  status,
  parentId,
}) {
  const where = {
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
              },
            },
            {
              slug: {
                contains: search,
              },
            },
          ],
        }
      : {}),

    ...(status !== undefined ? { status } : {}),

    ...(parentId !== undefined
      ? {
          parent_id: parentId,
        }
      : {}),
  };

  const [categories, total] = await Promise.all([
    prisma.sparePartCategory.findMany({
      where,
      skip,
      take,
      orderBy: [
        {
          sort_order: "asc",
        },
        {
          name: "asc",
        },
      ],
      select: categorySelect,
    }),

    prisma.sparePartCategory.count({
      where,
    }),
  ]);

  return {
    categories: categories.map(formatCategory),
    total,
  };
}

export async function findChildCategories(parentId) {
  return prisma.sparePartCategory.findMany({
    where: {
      parent_id: parentId,
    },
    select: {
      id: true,
    },
  });
}

export async function createSparePartCategory(data) {
  const category = await prisma.sparePartCategory.create({
    data,
    select: categorySelect,
  });

  return formatCategory(category);
}

export async function updateSparePartCategory(id, data) {
  const category = await prisma.sparePartCategory.update({
    where: { id },
    data,
    select: categorySelect,
  });

  return formatCategory(category);
}

export async function deleteSparePartCategory(id) {
  return prisma.sparePartCategory.delete({
    where: { id },
  });
}
