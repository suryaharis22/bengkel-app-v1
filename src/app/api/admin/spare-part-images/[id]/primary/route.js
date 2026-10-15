import { setPrimarySparePartImageController } from "@/controllers/spare-part-image.controller";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse } from "@/lib/response";

import { ROLES } from "@/constants/roles";

export async function PATCH(request, { params }) {
  try {
    const auth = await requireRole([ROLES.ADMIN]);

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    const resolvedParams = await params;

    const imageId = resolvedParams?.id;

    return setPrimarySparePartImageController(imageId);
  } catch {
    return errorResponse({
      code: 500,
      message: "Failed to set primary spare part image.",
    });
  }
}
