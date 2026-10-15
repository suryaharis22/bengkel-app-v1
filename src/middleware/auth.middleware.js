import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { AUTH_COOKIE_NAME } from "@/constants/auth";

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}
