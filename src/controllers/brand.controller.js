import {
  createNewBrand,
  deleteExistingBrand,
  getBrandById,
  getBrands,
  updateExistingBrand,
} from "@/services/brand.service";

import {
  createBrandSchema,
  updateBrandSchema,
} from "@/validations/brand.validation";

import { errorResponse, successResponse } from "@/lib/response";

import { createPaginationMeta, getPaginationParams } from "@/lib/pagination";

import { getZodErrors } from "@/lib/validation";

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

export async function getBrandsController(request) {
  try {
    const { searchParams } = new URL(request.url);

    const { page, perPage } = getPaginationParams(searchParams);

    const search = searchParams.get("search") || "";

    const status = parseBoolean(searchParams.get("status"));

    const result = await getBrands({
      page,
      perPage,
      search,
      status,
    });

    const meta = createPaginationMeta({
      page,
      perPage,
      totalItems: result.total,
    });

    return successResponse({
      code: 200,
      message: "Brands retrieved successfully",
      data: result.brands,
      meta,
    });
  } catch (error) {
    console.error("Get brands error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode ? error.message : "Failed to retrieve brands",
    });
  }
}

export async function getBrandController(request, id) {
  try {
    const brandId = Number(id);

    if (!Number.isInteger(brandId) || brandId <= 0) {
      return errorResponse({
        code: 422,
        message: "Invalid brand ID",
      });
    }

    const brand = await getBrandById(brandId);

    return successResponse({
      code: 200,
      message: "Brand retrieved successfully",
      data: brand,
    });
  } catch (error) {
    console.error("Get brand error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode ? error.message : "Failed to retrieve brand",
    });
  }
}

export async function createBrandController(request) {
  try {
    const body = await request.json();

    const validation = createBrandSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const brand = await createNewBrand(validation.data);

    return successResponse({
      code: 201,
      message: "Brand created successfully",
      data: brand,
    });
  } catch (error) {
    console.error("Create brand error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode ? error.message : "Failed to create brand",
    });
  }
}

export async function updateBrandController(request, id) {
  try {
    const brandId = Number(id);

    if (!Number.isInteger(brandId) || brandId <= 0) {
      return errorResponse({
        code: 422,
        message: "Invalid brand ID",
      });
    }

    const body = await request.json();

    const validation = updateBrandSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const brand = await updateExistingBrand(brandId, validation.data);

    return successResponse({
      code: 200,
      message: "Brand updated successfully",
      data: brand,
    });
  } catch (error) {
    console.error("Update brand error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode ? error.message : "Failed to update brand",
    });
  }
}

export async function deleteBrandController(request, id) {
  try {
    const brandId = Number(id);

    if (!Number.isInteger(brandId) || brandId <= 0) {
      return errorResponse({
        code: 422,
        message: "Invalid brand ID",
      });
    }

    await deleteExistingBrand(brandId);

    return successResponse({
      code: 200,
      message: "Brand deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Delete brand error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode ? error.message : "Failed to delete brand",
    });
  }
}
