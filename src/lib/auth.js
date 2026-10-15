import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import { AUTH_COOKIE_NAME } from "@/constants/auth";

export { AUTH_COOKIE_NAME };

export async function getAuthToken() {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
}

export async function getAuthUser() {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function requireAuth() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(role) {
  const user = await requireAuth();

  if (user.role !== role) {
    const dashboardRoutes = {
      admin: "/admin/dashboard",
      teknisi: "/teknisi/dashboard",
      customer: "/customer/dashboard",
    };

    redirect(dashboardRoutes[user.role] || "/login");
  }

  return user;
}
