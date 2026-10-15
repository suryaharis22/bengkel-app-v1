import {
  getSparePartController,
  updateSparePartController,
  deleteSparePartController,
} from "@/controllers/spare-part.controller";

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

    return getSparePartController(resolvedParams?.id);
  } catch {
    return errorResponse({
      code: 500,
      message: "Failed to retrieve spare part.",
    });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await authorizeAdmin();

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    const resolvedParams = await params;

    return updateSparePartController(request, resolvedParams?.id);
  } catch {
    return errorResponse({
      code: 500,
      message: "Failed to update spare part.",
    });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await authorizeAdmin();

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    const resolvedParams = await params;

    return deleteSparePartController(resolvedParams?.id);
  } catch {
    return errorResponse({
      code: 500,
      message: "Failed to delete spare part.",
    });
  }
}
