import {
  adjustSparePartStock,
  createSparePartStock,
  findSparePartStockByVariantId,
  findSparePartVariantById,
  updateSparePartStock,
} from "@/models/spare-part-stock.model";

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

function sanitizeSparePartStock(stock) {
  if (!stock) {
    return null;
  }

  const availableStock = Math.max(0, stock.stock - stock.reserved_stock);

  let stockStatus = "normal";

  if (availableStock <= 0) {
    stockStatus = "out_of_stock";
  } else if (availableStock <= stock.minimum_stock) {
    stockStatus = "low_stock";
  }

  return {
    id: stock.id,

    variant_id: stock.variant_id,

    variant: stock.variant
      ? {
          id: stock.variant.id,
          name: stock.variant.name,
          sku: stock.variant.sku,

          spare_part: stock.variant.spare_part
            ? {
                id: stock.variant.spare_part.id,
                name: stock.variant.spare_part.name,
                slug: stock.variant.spare_part.slug,
              }
            : null,
        }
      : null,

    stock: stock.stock,

    reserved_stock: stock.reserved_stock,

    available_stock: availableStock,

    minimum_stock: stock.minimum_stock,

    stock_status: stockStatus,

    updated_at: stock.updated_at,
  };
}

async function getOrCreateStock(variantId) {
  const existingStock = await findSparePartStockByVariantId(variantId);

  if (existingStock) {
    return existingStock;
  }

  return createSparePartStock(variantId);
}

export async function getSparePartStock(variantId) {
  const variant = await findSparePartVariantById(variantId);

  if (!variant) {
    throw createServiceError("Spare part variant not found", 404);
  }

  const stock = await getOrCreateStock(variantId);

  return sanitizeSparePartStock(stock);
}

export async function updateSparePartStockSettings(variantId, data) {
  const variant = await findSparePartVariantById(variantId);

  if (!variant) {
    throw createServiceError("Spare part variant not found", 404);
  }

  await getOrCreateStock(variantId);

  const updatedStock = await updateSparePartStock(variantId, {
    minimum_stock: data.minimum_stock,
  });

  return sanitizeSparePartStock(updatedStock);
}

export async function adjustExistingSparePartStock(variantId, data) {
  const variant = await findSparePartVariantById(variantId);

  if (!variant) {
    throw createServiceError("Spare part variant not found", 404);
  }

  if (!variant.status) {
    throw createServiceError("Spare part variant is inactive", 422);
  }

  await getOrCreateStock(variantId);

  const adjustmentQuantity =
    data.type === "in" ? data.quantity : -data.quantity;

  const stock = await adjustSparePartStock(variantId, adjustmentQuantity);

  return sanitizeSparePartStock(stock);
}
