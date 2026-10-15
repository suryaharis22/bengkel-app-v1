import { cookies } from "next/headers";

import { loginSchema, registerSchema } from "@/validations/auth.validation";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "@/services/auth.service";

import { AUTH_COOKIE_NAME, getAuthUser } from "@/lib/auth";

import { errorResponse, successResponse } from "@/lib/response";

import { getZodErrors } from "@/lib/validation";

const COOKIE_MAX_AGE = 60 * 60 * 24; // 1 hari

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

async function getRequestBody(request) {
  try {
    return await request.json();
  } catch {
    const error = new Error("Invalid request body");
    error.statusCode = 400;

    throw error;
  }
}

export async function registerController(request) {
  try {
    const body = await getRequestBody(request);

    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const user = await registerUser(validation.data);

    return successResponse({
      code: 201,
      message: "Registration successful",
      data: user,
    });
  } catch (error) {
    console.error("Register error:", error);

    return errorResponse({
      code: error?.statusCode || 500,
      message: error?.statusCode ? error.message : "Failed to register user",
    });
  }
}

export async function loginController(request) {
  try {
    const body = await getRequestBody(request);

    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const { identifier, password } = validation.data;

    const result = await loginUser(identifier, password);

    const cookieStore = await cookies();

    cookieStore.set(AUTH_COOKIE_NAME, result.token, COOKIE_OPTIONS);

    return successResponse({
      code: 200,
      message: "Login successful",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return errorResponse({
      code: error?.statusCode || 500,
      message: error?.statusCode ? error.message : "Failed to login",
    });
  }
}

export async function logoutController() {
  try {
    const cookieStore = await cookies();

    cookieStore.set(AUTH_COOKIE_NAME, "", {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });

    return successResponse({
      code: 200,
      message: "Logout successful",
      data: null,
    });
  } catch (error) {
    console.error("Logout error:", error);

    return errorResponse({
      code: 500,
      message: "Failed to logout",
    });
  }
}

export async function meController() {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return errorResponse({
        code: 401,
        message: "Unauthenticated",
      });
    }

    const user = await getCurrentUser(authUser.id);

    return successResponse({
      code: 200,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Me error:", error);

    return errorResponse({
      code: error?.statusCode || 500,
      message: error?.statusCode ? error.message : "Failed to retrieve user",
    });
  }
}
