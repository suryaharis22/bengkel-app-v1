import {
  updateSparePartImageController,
  deleteSparePartImageController,
} from "@/controllers/spare-part-image.controller";

import { requireRole } from "@/middleware/role.middleware";

import { ROLES } from "@/constants/roles";

import { errorResponse } from "@/lib/response";

export async function PUT(request, { params }) {
  try {
    const auth = await requireRole([ROLES.ADMIN]);

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    const resolvedParams = await params;

    return updateSparePartImageController(request, resolvedParams.id);
  } catch {
    return errorResponse({
      code: 500,
      message: "Failed to update spare part image.",
    });
  }
}

export async function DELETE(request, { params }) {
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

    return deleteSparePartImageController(imageId);
  } catch {
    return errorResponse({
      code: 500,
      message: "Failed to delete spare part image.",
    });
  }
}
