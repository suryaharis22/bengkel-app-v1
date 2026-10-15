import {
  createBrand,
  deleteBrand,
  findBrandById,
  findBrandByName,
  findBrands,
  findBrandBySlug,
  updateBrand,
} from "@/models/brand.model";

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

function sanitizeBrand(brand) {
  if (!brand) {
    return null;
  }

  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logo_url: brand.logo_url,
    description: brand.description,
    status: brand.status,

    spare_parts_count: brand._count?.spare_parts ?? 0,

    created_at: brand.created_at,
    updated_at: brand.updated_at,
  };
}

export async function getBrands({
  page = 1,
  perPage = 10,
  search = "",
  status,
}) {
  const skip = (page - 1) * perPage;

  const result = await findBrands({
    skip,
    take: perPage,
    search,
    status,
  });

  return {
    brands: result.brands.map(sanitizeBrand),
    total: result.total,
  };
}

export async function getBrandById(id) {
  const brand = await findBrandById(id);

  if (!brand) {
    throw createServiceError("Brand not found", 404);
  }

  return sanitizeBrand(brand);
}

export async function createNewBrand(data) {
  const existingName = await findBrandByName(data.name);

  if (existingName) {
    throw createServiceError("Brand name already exists", 409);
  }

  const existingSlug = await findBrandBySlug(data.slug);

  if (existingSlug) {
    throw createServiceError("Brand slug already exists", 409);
  }

  const brand = await createBrand({
    name: data.name,
    slug: data.slug,
    logo_url: data.logo_url || null,
    description: data.description || null,
    status: data.status ?? true,
  });

  return sanitizeBrand(brand);
}

export async function updateExistingBrand(id, data) {
  const existingBrand = await findBrandById(id);

  if (!existingBrand) {
    throw createServiceError("Brand not found", 404);
  }

  if (data.name !== undefined && data.name !== existingBrand.name) {
    const existingName = await findBrandByName(data.name);

    if (existingName && existingName.id !== id) {
      throw createServiceError("Brand name already exists", 409);
    }
  }

  if (data.slug !== undefined && data.slug !== existingBrand.slug) {
    const existingSlug = await findBrandBySlug(data.slug);

    if (existingSlug && existingSlug.id !== id) {
      throw createServiceError("Brand slug already exists", 409);
    }
  }

  const updateData = {
    ...(data.name !== undefined && {
      name: data.name,
    }),

    ...(data.slug !== undefined && {
      slug: data.slug,
    }),

    ...(data.logo_url !== undefined && {
      logo_url: data.logo_url || null,
    }),

    ...(data.description !== undefined && {
      description: data.description || null,
    }),

    ...(data.status !== undefined && {
      status: data.status,
    }),
  };

  const brand = await updateBrand(id, updateData);

  return sanitizeBrand(brand);
}

export async function deleteExistingBrand(id) {
  const existingBrand = await findBrandById(id);

  if (!existingBrand) {
    throw createServiceError("Brand not found", 404);
  }

  if (existingBrand._count?.spare_parts > 0) {
    throw createServiceError(
      "Cannot delete brand because it is used by spare parts",
      409,
    );
  }

  await deleteBrand(id);
}
