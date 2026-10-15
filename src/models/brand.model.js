import { prisma } from "@/lib/prisma";

const brandSelect = {
  id: true,
  name: true,
  slug: true,
  logo_url: true,
  description: true,
  status: true,
  created_at: true,
  updated_at: true,

  _count: {
    select: {
      spare_parts: true,
    },
  },
};

export async function findBrandById(id) {
  return prisma.brand.findUnique({
    where: { id },
    select: brandSelect,
  });
}

export async function findBrandBySlug(slug) {
  return prisma.brand.findUnique({
    where: { slug },
    select: brandSelect,
  });
}

export async function findBrandByName(name) {
  return prisma.brand.findFirst({
    where: { name },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function findBrands({ skip = 0, take = 10, search = "", status }) {
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
  };

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      skip,
      take,
      orderBy: {
        name: "asc",
      },
      select: brandSelect,
    }),

    prisma.brand.count({
      where,
    }),
  ]);

  return {
    brands,
    total,
  };
}

export async function createBrand(data) {
  return prisma.brand.create({
    data,
    select: brandSelect,
  });
}

export async function updateBrand(id, data) {
  return prisma.brand.update({
    where: { id },
    data,
    select: brandSelect,
  });
}

export async function deleteBrand(id) {
  return prisma.brand.delete({
    where: { id },
  });
}
