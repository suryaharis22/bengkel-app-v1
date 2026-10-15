import {
  deleteUserController,
  getUserByIdController,
  updateUserController,
} from "@/controllers/user.controller";
import { requireRole } from "@/middleware/role.middleware";
import { errorResponse } from "@/lib/response";
import { handleMiddlewareError } from "@/middleware/error.middleware";

async function authorizeAdmin() {
  const authorization = await requireRole(["admin"]);

  if (!authorization.authorized) {
    return {
      error: errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      }),
    };
  }

  return {
    user: authorization.user,
  };
}

function getUserId(params) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function GET(request, { params }) {
  try {
    const authorization = await authorizeAdmin();

    if (authorization.error) {
      return authorization.error;
    }

    const resolvedParams = await params;
    const id = getUserId(resolvedParams);

    if (!id) {
      return errorResponse({
        code: 400,
        message: "Invalid user ID",
      });
    }

    return getUserByIdController(id);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

export async function PUT(request, { params }) {
  try {
    const authorization = await authorizeAdmin();

    if (authorization.error) {
      return authorization.error;
    }

    const resolvedParams = await params;
    const id = getUserId(resolvedParams);

    if (!id) {
      return errorResponse({
        code: 400,
        message: "Invalid user ID",
      });
    }

    return updateUserController(request, id);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

export async function DELETE(request, { params }) {
  try {
    const authorization = await authorizeAdmin();

    if (authorization.error) {
      return authorization.error;
    }

    const resolvedParams = await params;
    const id = getUserId(resolvedParams);

    if (!id) {
      return errorResponse({
        code: 400,
        message: "Invalid user ID",
      });
    }

    return deleteUserController(id, Number(authorization.user.id));
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
