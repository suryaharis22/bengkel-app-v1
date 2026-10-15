import { reorderSparePartImagesController } from "@/controllers/spare-part-image.controller";

import { requireRole } from "@/middleware/role.middleware";
import { errorResponse } from "@/lib/response";
import { ROLES } from "@/constants/roles";

export async function PATCH(request) {
  try {
    const auth = await requireRole([ROLES.ADMIN]);

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    return reorderSparePartImagesController(request);
  } catch (error) {
    console.error("PATCH reorder spare part images route error:", error);

    return errorResponse({
      code: 500,
      message: "Failed to reorder spare part images",
    });
  }
}
