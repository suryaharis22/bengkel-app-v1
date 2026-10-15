import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME } from "@/constants/auth";

const PROTECTED_ROUTES = {
  admin: "/admin",
  teknisi: "/teknisi",
  customer: "/customer",
};

async function verifyAuthToken(token) {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not defined");
      return null;
    }

    const secretKey = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(token, secretKey);

    return payload;
  } catch (error) {
    console.error("Proxy JWT verification failed:", error);

    return null;
  }
}

function getRequiredRole(pathname) {
  if (pathname.startsWith(PROTECTED_ROUTES.admin)) {
    return "admin";
  }

  if (pathname.startsWith(PROTECTED_ROUTES.teknisi)) {
    return "teknisi";
  }

  if (pathname.startsWith(PROTECTED_ROUTES.customer)) {
    return "customer";
  }

  return null;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const requiredRole = getRequiredRole(pathname);

  if (!requiredRole) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await verifyAuthToken(token);

  if (!user) {
    const response = NextResponse.redirect(new URL("/login", request.url));

    response.cookies.delete(AUTH_COOKIE_NAME);

    return response;
  }

  if (user.role !== requiredRole) {
    const dashboardRoutes = {
      admin: "/admin/dashboard",
      teknisi: "/teknisi/dashboard",
      customer: "/customer/dashboard",
    };

    const userDashboard = dashboardRoutes[user.role];

    if (userDashboard) {
      return NextResponse.redirect(new URL(userDashboard, request.url));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teknisi/:path*", "/customer/:path*"],
};
