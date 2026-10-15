import { adjustSparePartStockController } from "@/controllers/spare-part-stock.controller";

import { requireRole } from "@/middleware/role.middleware";
import { errorResponse } from "@/lib/response";
import { ROLES } from "@/constants/roles";

export async function POST(request, context) {
  try {
    const auth = await requireRole([ROLES.ADMIN]);

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    const { id } = await context.params;

    return adjustSparePartStockController(request, id);
  } catch (error) {
    console.error("POST spare part stock adjustment route error:", error);

    return errorResponse({
      code: 500,
      message: "Failed to adjust spare part stock",
    });
  }
}
