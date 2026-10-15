import {
  createNewUser,
  deleteExistingUser,
  getUserById,
  getUsers,
  updateExistingUser,
} from "@/services/user.service";
import { errorResponse, successResponse } from "@/lib/response";
import { createPaginationMeta, getPaginationParams } from "@/lib/pagination";
import {
  createUserSchema,
  updateUserSchema,
} from "@/validations/user.validation";
import { getZodErrors } from "@/lib/validation";

export async function getUsersController(request) {
  try {
    const { searchParams } = new URL(request.url);

    const { page, perPage } = getPaginationParams(searchParams);

    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || undefined;

    const result = await getUsers({
      page,
      perPage,
      search,
      role,
    });

    const meta = createPaginationMeta({
      page,
      perPage,
      totalItems: result.total,
    });

    return successResponse({
      code: 200,
      message: "Users retrieved successfully",
      data: result.users,
      meta,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode ? error.message : "Failed to retrieve users",
    });
  }
}

export async function createUserController(request) {
  try {
    const body = await request.json();

    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const user = await createNewUser(validation.data);

    return successResponse({
      code: 201,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    console.error("Create user error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode ? error.message : "Failed to create user",
    });
  }
}

export async function getUserByIdController(id) {
  try {
    const user = await getUserById(id);

    return successResponse({
      code: 200,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode ? error.message : "Failed to retrieve user",
    });
  }
}

export async function updateUserController(request, id) {
  try {
    const body = await request.json();

    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const user = await updateExistingUser(id, validation.data);

    return successResponse({
      code: 200,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update user error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode ? error.message : "Failed to update user",
    });
  }
}

export async function deleteUserController(id, currentUserId) {
  try {
    if (id === currentUserId) {
      return errorResponse({
        code: 422,
        message: "You cannot delete your own account",
      });
    }

    await deleteExistingUser(id);

    return successResponse({
      code: 200,
      message: "User deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode ? error.message : "Failed to delete user",
    });
  }
}
