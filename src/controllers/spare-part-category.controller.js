import {
  createNewSparePartCategory,
  deleteExistingSparePartCategory,
  getSparePartCategories,
  getSparePartCategoryById,
  updateExistingSparePartCategory,
} from "@/services/spare-part-category.service";

import {
  createSparePartCategorySchema,
  updateSparePartCategorySchema,
} from "@/validations/spare-part-category.validation";

import { errorResponse, successResponse } from "@/lib/response";

import { createPaginationMeta, getPaginationParams } from "@/lib/pagination";

import { getZodErrors } from "@/lib/validation";

function parseOptionalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
}

function parseBoolean(value) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  if (value === "true" || value === true) {
    return true;
  }

  if (value === "false" || value === false) {
    return false;
  }

  return undefined;
}

export async function getSparePartCategoriesController(request) {
  try {
    const { searchParams } = new URL(request.url);

    const { page, perPage } = getPaginationParams(searchParams);

    const search = searchParams.get("search") || "";

    const status = parseBoolean(searchParams.get("status"));

    const parentId = parseOptionalNumber(searchParams.get("parent_id"));

    const result = await getSparePartCategories({
      page,
      perPage,
      search,
      status,
      parentId,
    });

    const meta = createPaginationMeta({
      page,
      perPage,
      totalItems: result.total,
    });

    return successResponse({
      code: 200,
      message: "Spare part categories retrieved successfully",
      data: result.categories,
      meta,
    });
  } catch (error) {
    console.error("Get spare part categories error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode
        ? error.message
        : "Failed to retrieve spare part categories",
    });
  }
}

export async function getSparePartCategoryController(request, id) {
  try {
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return errorResponse({
        code: 422,
        message: "Invalid spare part category ID",
      });
    }

    const category = await getSparePartCategoryById(categoryId);

    return successResponse({
      code: 200,
      message: "Spare part category retrieved successfully",
      data: category,
    });
  } catch (error) {
    console.error("Get spare part category error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode
        ? error.message
        : "Failed to retrieve spare part category",
    });
  }
}

export async function createSparePartCategoryController(request) {
  try {
    const body = await request.json();

    const validation = createSparePartCategorySchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const category = await createNewSparePartCategory(validation.data);

    return successResponse({
      code: 201,
      message: "Spare part category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Create spare part category error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode
        ? error.message
        : "Failed to create spare part category",
    });
  }
}

export async function updateSparePartCategoryController(request, id) {
  try {
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return errorResponse({
        code: 422,
        message: "Invalid spare part category ID",
      });
    }

    const body = await request.json();

    const validation = updateSparePartCategorySchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const category = await updateExistingSparePartCategory(
      categoryId,
      validation.data,
    );

    return successResponse({
      code: 200,
      message: "Spare part category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Update spare part category error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode
        ? error.message
        : "Failed to update spare part category",
    });
  }
}

export async function deleteSparePartCategoryController(request, id) {
  try {
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return errorResponse({
        code: 422,
        message: "Invalid spare part category ID",
      });
    }

    await deleteExistingSparePartCategory(categoryId);

    return successResponse({
      code: 200,
      message: "Spare part category deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Delete spare part category error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode
        ? error.message
        : "Failed to delete spare part category",
    });
  }
}
