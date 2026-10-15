import {
  createSparePartVariant,
  deleteSparePartVariant,
  findSparePartById,
  findSparePartVariantById,
  findSparePartVariantBySku,
  findSparePartVariants,
  updateSparePartVariant,
} from "@/models/spare-part-variant.model";

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

function sanitizeSparePartVariant(variant) {
  if (!variant) {
    return null;
  }

  return {
    id: variant.id,

    spare_part_id: variant.spare_part_id,

    spare_part: variant.spare_part
      ? {
          id: variant.spare_part.id,
          name: variant.spare_part.name,
          slug: variant.spare_part.slug,
        }
      : null,

    name: variant.name,

    sku: variant.sku,

    price: variant.price?.toString() ?? null,

    compare_price: variant.compare_price?.toString() ?? null,

    cost_price: variant.cost_price?.toString() ?? null,

    weight: variant.weight,

    status: variant.status,

    stock: variant.stock
      ? {
          id: variant.stock.id,

          stock: variant.stock.stock,

          reserved_stock: variant.stock.reserved_stock,

          minimum_stock: variant.stock.minimum_stock,

          available_stock: Math.max(
            0,
            variant.stock.stock - variant.stock.reserved_stock,
          ),

          updated_at: variant.stock.updated_at,
        }
      : null,

    created_at: variant.created_at,

    updated_at: variant.updated_at,
  };
}

export async function getSparePartVariants(sparePartId) {
  const sparePart = await findSparePartById(sparePartId);

  if (!sparePart) {
    throw createServiceError("Spare part not found", 404);
  }

  const variants = await findSparePartVariants(sparePartId);

  return {
    sparePart: {
      id: sparePart.id,
      name: sparePart.name,
      slug: sparePart.slug,
    },

    variants: variants.map(sanitizeSparePartVariant),

    total: variants.length,
  };
}

export async function getSparePartVariantById(id) {
  const variant = await findSparePartVariantById(id);

  if (!variant) {
    throw createServiceError("Spare part variant not found", 404);
  }

  return sanitizeSparePartVariant(variant);
}

export async function createNewSparePartVariant(sparePartId, data) {
  const sparePart = await findSparePartById(sparePartId);

  if (!sparePart) {
    throw createServiceError("Spare part not found", 404);
  }

  const existingSku = await findSparePartVariantBySku(data.sku);

  if (existingSku) {
    throw createServiceError("Variant SKU already exists", 409);
  }

  const variant = await createSparePartVariant({
    spare_part_id: sparePartId,

    name: data.name,

    sku: data.sku,

    price: data.price,

    compare_price: data.compare_price ?? null,

    cost_price: data.cost_price ?? null,

    weight: data.weight ?? null,

    status: data.status ?? true,
  });

  return sanitizeSparePartVariant(variant);
}

export async function updateExistingSparePartVariant(id, data) {
  const existingVariant = await findSparePartVariantById(id);

  if (!existingVariant) {
    throw createServiceError("Spare part variant not found", 404);
  }

  if (data.sku !== undefined && data.sku !== existingVariant.sku) {
    const existingSku = await findSparePartVariantBySku(data.sku);

    if (existingSku && existingSku.id !== id) {
      throw createServiceError("Variant SKU already exists", 409);
    }
  }

  const updateData = {
    ...(data.name !== undefined && {
      name: data.name,
    }),

    ...(data.sku !== undefined && {
      sku: data.sku,
    }),

    ...(data.price !== undefined && {
      price: data.price,
    }),

    ...(data.compare_price !== undefined && {
      compare_price: data.compare_price ?? null,
    }),

    ...(data.cost_price !== undefined && {
      cost_price: data.cost_price ?? null,
    }),

    ...(data.weight !== undefined && {
      weight: data.weight ?? null,
    }),

    ...(data.status !== undefined && {
      status: data.status,
    }),
  };

  const variant = await updateSparePartVariant(id, updateData);

  return sanitizeSparePartVariant(variant);
}

export async function deleteExistingSparePartVariant(id) {
  const existingVariant = await findSparePartVariantById(id);

  if (!existingVariant) {
    throw createServiceError("Spare part variant not found", 404);
  }

  if (existingVariant.stock) {
    const hasStock =
      existingVariant.stock.stock > 0 ||
      existingVariant.stock.reserved_stock > 0;

    if (hasStock) {
      throw createServiceError(
        "Cannot delete variant because it has stock",
        409,
      );
    }
  }

  await deleteSparePartVariant(id);
}
