import {
  createSparePartVariantController,
  getSparePartVariantsController,
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

    return getSparePartVariantsController(request, id);
  } catch (error) {
    console.error("GET spare part variants route error:", error);

    return errorResponse({
      code: 500,
      message: "Failed to retrieve spare part variants",
    });
  }
}

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

    return createSparePartVariantController(request, id);
  } catch (error) {
    console.error("POST spare part variant route error:", error);

    return errorResponse({
      code: 500,
      message: "Failed to create spare part variant",
    });
  }
}
