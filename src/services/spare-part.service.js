import {
  createSparePart,
  deleteSparePart,
  findSparePartById,
  findSpareParts,
  updateSparePart,
  countSpareParts,
  findCategoryById,
  findBrandById,
  findSparePartBySku,
  findSparePartBySlug,
  findSparePartBySkuExceptId,
  findSparePartBySlugExceptId,
  countSparePartImages,
  countSparePartVariants,
} from "@/models/spare-part.model";

function createServiceError(message, statusCode) {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
}

function sanitizeDecimal(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return value.toString();
}

function sanitizeSparePart(sparePart) {
  if (!sparePart) {
    return null;
  }

  return {
    id: sparePart.id,

    category_id: sparePart.category_id,

    brand_id: sparePart.brand_id,

    name: sparePart.name,

    slug: sparePart.slug,

    sku: sparePart.sku,

    part_number: sparePart.part_number,

    description: sparePart.description,

    short_description: sparePart.short_description,

    price: sanitizeDecimal(sparePart.price),

    compare_price: sanitizeDecimal(sparePart.compare_price),

    cost_price: sanitizeDecimal(sparePart.cost_price),

    weight: sparePart.weight,

    status: sparePart.status,

    is_featured: sparePart.is_featured,

    created_at: sparePart.created_at,

    updated_at: sparePart.updated_at,

    category: sparePart.category
      ? {
          id: sparePart.category.id,
          name: sparePart.category.name,
          slug: sparePart.category.slug,
          status: sparePart.category.status,
        }
      : null,

    brand: sparePart.brand
      ? {
          id: sparePart.brand.id,
          name: sparePart.brand.name,
          slug: sparePart.brand.slug,
          logo_url: sparePart.brand.logo_url,
          status: sparePart.brand.status,
        }
      : null,

    images: Array.isArray(sparePart.images)
      ? sparePart.images.map((image) => ({
          id: image.id,
          spare_part_id: image.spare_part_id,
          image_url: image.image_url,
          sort_order: image.sort_order,
          is_primary: image.is_primary,
          created_at: image.created_at,
        }))
      : [],

    variants: Array.isArray(sparePart.variants)
      ? sparePart.variants.map((variant) => ({
          id: variant.id,
          spare_part_id: variant.spare_part_id,
          name: variant.name,
          sku: variant.sku,
          price: sanitizeDecimal(variant.price),
          compare_price: sanitizeDecimal(variant.compare_price),
          cost_price: sanitizeDecimal(variant.cost_price),
          weight: variant.weight,
          status: variant.status,
          created_at: variant.created_at,
          updated_at: variant.updated_at,

          stock: variant.stock
            ? {
                id: variant.stock.id,
                variant_id: variant.stock.variant_id,
                stock: variant.stock.stock,
                reserved_stock: variant.stock.reserved_stock,
                minimum_stock: variant.stock.minimum_stock,
                updated_at: variant.stock.updated_at,
              }
            : null,
        }))
      : [],
  };
}

function parseIds(value) {
  if (!value) return [];

  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => /^\d+$/.test(item))
        .map(Number)
        .filter((id) => Number.isSafeInteger(id) && id > 0),
    ),
  ];
}

export async function getSpareParts(request) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const pageParam = Number(searchParams.get("page"));
  const perPageParam = Number(searchParams.get("per_page"));

  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const perPage =
    Number.isInteger(perPageParam) && perPageParam > 0
      ? Math.min(perPageParam, 100)
      : 10;

  const skip = (page - 1) * perPage;

  // Search
  const search = searchParams.get("search")?.trim() || "";

  // Mendukung brands=6 atau brands=6,16
  // Juga mendukung parameter lama brand_id=6
  const brandsParam =
    searchParams.get("brands") ?? searchParams.get("brand_id");

  // Mendukung categories=8 atau categories=8,34
  // Juga mendukung parameter lama category_id=8
  const categoriesParam =
    searchParams.get("categories") ?? searchParams.get("category_id");

  const brandIds = parseIds(brandsParam);
  const categoryIds = parseIds(categoriesParam);

  const status = searchParams.get("status");
  const featured = searchParams.get("is_featured");

  // Semua filter diterapkan langsung pada query Prisma.
  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { sku: { contains: search } },
            { slug: { contains: search } },
            { part_number: { contains: search } },
          ],
        }
      : {}),

    ...(brandIds.length > 0
      ? {
          brand_id: {
            in: brandIds,
          },
        }
      : {}),

    ...(categoryIds.length > 0
      ? {
          category_id: {
            in: categoryIds,
          },
        }
      : {}),

    ...(status
      ? {
          status,
        }
      : {}),

    ...(featured === "true"
      ? { is_featured: true }
      : featured === "false"
        ? { is_featured: false }
        : {}),
  };

  // Data dan total wajib memakai filter WHERE yang sama.
  const [totalItems, spareParts] = await Promise.all([
    countSpareParts(where),
    findSpareParts(where, skip, perPage),
  ]);

  const totalPages = Math.ceil(totalItems / perPage);

  return {
    data: spareParts.map(sanitizeSparePart),
    meta: {
      current_page: page,
      per_page: perPage,
      total_items: totalItems,
      total_pages: totalPages,
    },
  };
}

export async function getSparePartById(id) {
  const sparePart = await findSparePartById(id);

  if (!sparePart) {
    throw createServiceError("Spare part not found", 404);
  }

  return sanitizeSparePart(sparePart);
}

export async function createNewSparePart(data) {
  const categoryId = Number(data.category_id);

  const brandId = Number(data.brand_id);

  const category = await findCategoryById(categoryId);

  if (!category) {
    throw createServiceError("Category not found", 404);
  }

  if (!category.status) {
    throw createServiceError("Category is inactive", 422);
  }

  const brand = await findBrandById(brandId);

  if (!brand) {
    throw createServiceError("Brand not found", 404);
  }

  if (!brand.status) {
    throw createServiceError("Brand is inactive", 422);
  }

  const existingSku = await findSparePartBySku(data.sku);

  if (existingSku) {
    throw createServiceError("SKU already exists", 409);
  }

  const existingSlug = await findSparePartBySlug(data.slug);

  if (existingSlug) {
    throw createServiceError("Slug already exists", 409);
  }

  const sparePart = await createSparePart({
    ...data,

    category_id: categoryId,

    brand_id: brandId,

    price: data.price.toString(),

    compare_price:
      data.compare_price === null ? null : data.compare_price.toString(),

    cost_price: data.cost_price === null ? null : data.cost_price.toString(),
  });

  return sanitizeSparePart(sparePart);
}

export async function updateExistingSparePart(id, data) {
  /*
   * Safety check.
   *
   * Controller sudah mengubah
   * "1" menjadi 1.
   */
  const sparePartId = Number(id);

  if (!Number.isInteger(sparePartId) || sparePartId <= 0) {
    throw createServiceError("Invalid spare part ID", 422);
  }

  /*
   * Cari spare part existing.
   *
   * Di sinilah sebelumnya error:
   *
   * id: "1"
   *
   * Sekarang:
   *
   * id: 1
   */
  const existing = await findSparePartById(sparePartId);

  if (!existing) {
    throw createServiceError("Spare part not found", 404);
  }

  const categoryId = Number(data.category_id);

  const brandId = Number(data.brand_id);

  const category = await findCategoryById(categoryId);

  if (!category) {
    throw createServiceError("Category not found", 404);
  }

  if (!category.status) {
    throw createServiceError("Category is inactive", 422);
  }

  const brand = await findBrandById(brandId);

  if (!brand) {
    throw createServiceError("Brand not found", 404);
  }

  if (!brand.status) {
    throw createServiceError("Brand is inactive", 422);
  }

  /*
   * Check duplicate SKU
   * selain record sendiri.
   */
  const duplicateSku = await findSparePartBySkuExceptId(data.sku, sparePartId);

  if (duplicateSku) {
    throw createServiceError("SKU already exists", 409);
  }

  /*
   * Check duplicate slug
   * selain record sendiri.
   */
  const duplicateSlug = await findSparePartBySlugExceptId(
    data.slug,
    sparePartId,
  );

  if (duplicateSlug) {
    throw createServiceError("Slug already exists", 409);
  }

  const updateData = {
    name: data.name,

    slug: data.slug,

    sku: data.sku,

    part_number: data.part_number,

    category_id: categoryId,

    brand_id: brandId,

    short_description: data.short_description,

    description: data.description,

    price: data.price.toString(),

    compare_price:
      data.compare_price === null ? null : data.compare_price.toString(),

    cost_price: data.cost_price === null ? null : data.cost_price.toString(),

    weight: data.weight,

    status: data.status,

    is_featured: data.is_featured,
  };

  const updated = await updateSparePart(sparePartId, updateData);

  return sanitizeSparePart(updated);
}

export async function deleteExistingSparePart(id) {
  const sparePartId = Number(id);

  if (!Number.isInteger(sparePartId) || sparePartId <= 0) {
    throw createServiceError("Invalid spare part ID", 422);
  }

  const existing = await findSparePartById(sparePartId);

  if (!existing) {
    throw createServiceError("Spare part not found", 404);
  }

  const [totalImages, totalVariants] = await Promise.all([
    countSparePartImages(sparePartId),

    countSparePartVariants(sparePartId),
  ]);

  if (totalImages > 0) {
    throw createServiceError(
      "Spare part cannot be deleted because it still has images.",
      409,
    );
  }

  if (totalVariants > 0) {
    throw createServiceError(
      "Spare part cannot be deleted because it still has variants.",
      409,
    );
  }

  await deleteSparePart(sparePartId);
}
