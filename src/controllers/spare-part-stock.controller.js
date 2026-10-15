import {
  adjustExistingSparePartStock,
  getSparePartStock,
  updateSparePartStockSettings,
} from "@/services/spare-part-stock.service";

import {
  adjustSparePartStockSchema,
  updateSparePartStockSchema,
} from "@/validations/spare-part-stock.validation";

import { errorResponse, successResponse } from "@/lib/response";

import { getZodErrors } from "@/lib/validation";

function parseVariantId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function getSparePartStockController(request, variantId) {
  try {
    const id = parseVariantId(variantId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid variant ID",
      });
    }

    const stock = await getSparePartStock(id);

    return successResponse({
      code: 200,
      message: "Spare part stock retrieved successfully",
      data: stock,
    });
  } catch (error) {
    console.error("Get spare part stock error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode
        ? error.message
        : "Failed to retrieve spare part stock",
    });
  }
}

export async function updateSparePartStockController(request, variantId) {
  try {
    const id = parseVariantId(variantId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid variant ID",
      });
    }

    const body = await request.json();

    const validation = updateSparePartStockSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const stock = await updateSparePartStockSettings(id, validation.data);

    return successResponse({
      code: 200,
      message: "Spare part stock settings updated successfully",
      data: stock,
    });
  } catch (error) {
    console.error("Update spare part stock error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode
        ? error.message
        : "Failed to update spare part stock",
    });
  }
}

export async function adjustSparePartStockController(request, variantId) {
  try {
    const id = parseVariantId(variantId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid variant ID",
      });
    }

    const body = await request.json();

    const validation = adjustSparePartStockSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const stock = await adjustExistingSparePartStock(id, validation.data);

    return successResponse({
      code: 200,
      message: "Spare part stock adjusted successfully",
      data: stock,
    });
  } catch (error) {
    console.error("Adjust spare part stock error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode
        ? error.message
        : "Failed to adjust spare part stock",
    });
  }
}
