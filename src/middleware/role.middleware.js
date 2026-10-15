import { getAuthenticatedUser } from "@/middleware/auth.middleware";

export async function requireRole(allowedRoles = []) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      authorized: false,
      statusCode: 401,
      message: "Unauthenticated",
      user: null,
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      statusCode: 403,
      message: "Forbidden",
      user,
    };
  }

  return {
    authorized: true,
    statusCode: 200,
    message: "Authorized",
    user,
  };
}
