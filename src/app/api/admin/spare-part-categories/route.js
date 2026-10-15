import {
  createSparePartCategoryController,
  getSparePartCategoriesController,
} from "@/controllers/spare-part-category.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

export async function GET(request) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    return getSparePartCategoriesController(request);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

export async function POST(request) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    return createSparePartCategoryController(request);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
