import {
  getSparePartsController,
  createSparePartController,
} from "@/controllers/spare-part.controller";

import { requireRole } from "@/middleware/role.middleware";

import { ROLES } from "@/constants/roles";

import { errorResponse } from "@/lib/response";

export async function GET(request) {
  try {
    const auth = await requireRole([ROLES.ADMIN]);

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    return getSparePartsController(request);
  } catch {
    return errorResponse({
      code: 500,
      message: "Failed to retrieve spare parts.",
    });
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole([ROLES.ADMIN]);

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    return createSparePartController(request);
  } catch {
    return errorResponse({
      code: 500,
      message: "Failed to create spare part.",
    });
  }
}
