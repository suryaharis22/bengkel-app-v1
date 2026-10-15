import {
  getSparePartStockController,
  updateSparePartStockController,
} from "@/controllers/spare-part-stock.controller";

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

    return getSparePartStockController(request, id);
  } catch (error) {
    console.error("GET spare part stock route error:", error);

    return errorResponse({
      code: 500,
      message: "Failed to retrieve spare part stock",
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

    return updateSparePartStockController(request, id);
  } catch (error) {
    console.error("PUT spare part stock route error:", error);

    return errorResponse({
      code: 500,
      message: "Failed to update spare part stock",
    });
  }
}
