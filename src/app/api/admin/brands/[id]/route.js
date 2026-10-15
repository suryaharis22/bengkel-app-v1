import {
  deleteBrandController,
  getBrandController,
  updateBrandController,
} from "@/controllers/brand.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

export async function GET(request, { params }) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id } = await params;

    return getBrandController(request, id);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

export async function PUT(request, { params }) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id } = await params;

    return updateBrandController(request, id);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

export async function DELETE(request, { params }) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id } = await params;

    return deleteBrandController(request, id);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
