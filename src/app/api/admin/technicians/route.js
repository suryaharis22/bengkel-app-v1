import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const technicians = await prisma.user.findMany({
      where: {
        role: "teknisi",
      },
      select: {
        id: true,
        username: true,
        email: true,
        no_hp: true,
      },
      orderBy: {
        username: "asc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        code: "TECHNICIANS_FETCHED",
        message: "Technicians fetched successfully",
        data: technicians,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("GET /api/admin/technicians error:", error);

    return NextResponse.json(
      {
        success: false,
        code: "TECHNICIANS_FETCH_FAILED",
        message: "Failed to fetch technicians",
      },
      {
        status: 500,
      },
    );
  }
}
