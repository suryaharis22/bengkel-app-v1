import {
  deleteSparePartVariantController,
  getSparePartVariantController,
  updateSparePartVariantController,
} from "@/controllers/spare-part-variant.controller";

import { requireRole } from "@/middleware/role.middleware";
import { errorResponse } from "@/lib/response";
import { ROLES } from "@/constants/roles";

export async function GET(request, context) {
  try {
    const auth = await requireRole([ROLES.ADMIN]);

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    const { id } = await context.params;

    return getSparePartVariantController(request, id);
  } catch (error) {
    console.error("GET spare part variant route error:", error);

    return errorResponse({
      code: 500,
      message: "Failed to retrieve spare part variant",
    });
  }
}

export async function PUT(request, context) {
  try {
    const auth = await requireRole([ROLES.ADMIN]);

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    const { id } = await context.params;

    return updateSparePartVariantController(request, id);
  } catch (error) {
    console.error("PUT spare part variant route error:", error);

    return errorResponse({
      code: 500,
      message: "Failed to update spare part variant",
    });
  }
}

export async function DELETE(request, context) {
  try {
    const auth = await requireRole([ROLES.ADMIN]);

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    const { id } = await context.params;

    return deleteSparePartVariantController(request, id);
  } catch (error) {
    console.error("DELETE spare part variant route error:", error);

    return errorResponse({
      code: 500,
      message: "Failed to delete spare part variant",
    });
  }
}
