import {
  createNewSparePartVariant,
  deleteExistingSparePartVariant,
  getSparePartVariantById,
  getSparePartVariants,
  updateExistingSparePartVariant,
} from "@/services/spare-part-variant.service";

import {
  createSparePartVariantSchema,
  updateSparePartVariantSchema,
} from "@/validations/spare-part-variant.validation";

import { errorResponse, successResponse } from "@/lib/response";

import { getZodErrors } from "@/lib/validation";

function parseId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function getSparePartVariantsController(request, sparePartId) {
  try {
    const id = parseId(sparePartId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid spare part ID",
      });
    }

    const result = await getSparePartVariants(id);

    return successResponse({
      code: 200,
      message: "Spare part variants retrieved successfully",
      data: result.variants,
      meta: {
        spare_part: result.sparePart,
        total_items: result.total,
      },
    });
  } catch (error) {
    console.error("Get spare part variants error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode
        ? error.message
        : "Failed to retrieve spare part variants",
    });
  }
}

export async function createSparePartVariantController(request, sparePartId) {
  try {
    const id = parseId(sparePartId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid spare part ID",
      });
    }

    const body = await request.json();

    const validation = createSparePartVariantSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const variant = await createNewSparePartVariant(id, validation.data);

    return successResponse({
      code: 201,
      message: "Spare part variant created successfully",
      data: variant,
    });
  } catch (error) {
    console.error("Create spare part variant error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode
        ? error.message
        : "Failed to create spare part variant",
    });
  }
}

export async function getSparePartVariantController(request, id) {
  try {
    const variantId = parseId(id);

    if (!variantId) {
      return errorResponse({
        code: 422,
        message: "Invalid variant ID",
      });
    }

    const variant = await getSparePartVariantById(variantId);

    return successResponse({
      code: 200,
      message: "Spare part variant retrieved successfully",
      data: variant,
    });
  } catch (error) {
    console.error("Get spare part variant error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode
        ? error.message
        : "Failed to retrieve spare part variant",
    });
  }
}

export async function updateSparePartVariantController(request, id) {
  try {
    const variantId = parseId(id);

    if (!variantId) {
      return errorResponse({
        code: 422,
        message: "Invalid variant ID",
      });
    }

    const body = await request.json();

    const validation = updateSparePartVariantSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const variant = await updateExistingSparePartVariant(
      variantId,
      validation.data,
    );

    return successResponse({
      code: 200,
      message: "Spare part variant updated successfully",
      data: variant,
    });
  } catch (error) {
    console.error("Update spare part variant error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode
        ? error.message
        : "Failed to update spare part variant",
    });
  }
}

export async function deleteSparePartVariantController(request, id) {
  try {
    const variantId = parseId(id);

    if (!variantId) {
      return errorResponse({
        code: 422,
        message: "Invalid variant ID",
      });
    }

    await deleteExistingSparePartVariant(variantId);

    return successResponse({
      code: 200,
      message: "Spare part variant deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Delete spare part variant error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode
        ? error.message
        : "Failed to delete spare part variant",
    });
  }
}
