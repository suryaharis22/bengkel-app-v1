import {
  createUserController,
  getUsersController,
} from "@/controllers/user.controller";
import { requireRole } from "@/middleware/role.middleware";
import { errorResponse } from "@/lib/response";
import { handleMiddlewareError } from "@/middleware/error.middleware";

async function authorizeAdmin() {
  const authorization = await requireRole(["admin"]);

  if (!authorization.authorized) {
    return errorResponse({
      code: authorization.statusCode,
      message: authorization.message,
    });
  }

  return null;
}

export async function GET(request) {
  try {
    const authorizationError = await authorizeAdmin();

    if (authorizationError) {
      return authorizationError;
    }

    return getUsersController(request);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}

export async function POST(request) {
  try {
    const authorizationError = await authorizeAdmin();

    if (authorizationError) {
      return authorizationError;
    }

    return createUserController(request);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
