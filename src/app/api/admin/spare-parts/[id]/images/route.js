import {
  getSparePartImagesController,
  createSparePartImageController,
} from "@/controllers/spare-part-image.controller";

import { requireRole } from "@/middleware/role.middleware";

import { ROLES } from "@/constants/roles";

import { errorResponse } from "@/lib/response";

async function authorizeAdmin() {
  return requireRole([ROLES.ADMIN]);
}

export async function GET(request, { params }) {
  try {
    const auth = await authorizeAdmin();

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    const resolvedParams = await params;

    return getSparePartImagesController(resolvedParams.id);
  } catch {
    return errorResponse({
      code: 500,
      message: "Failed to retrieve spare part images.",
    });
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await authorizeAdmin();

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    const resolvedParams = await params;

    return createSparePartImageController(request, resolvedParams.id);
  } catch {
    return errorResponse({
      code: 500,
      message: "Failed to create spare part image.",
    });
  }
}
