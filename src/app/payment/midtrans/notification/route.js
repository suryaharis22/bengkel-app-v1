import { NextResponse } from "next/server";

import { handleMidtransNotification } from "@/services/midtrans.service";

export async function POST(request) {
  try {
    const notification = await request.json();

    const result = await handleMidtransNotification(notification);

    return NextResponse.json(
      {
        success: true,
        message: "Midtrans notification processed successfully.",
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Midtrans notification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to process Midtrans notification.",
      },
      {
        status: error?.statusCode || 500,
      },
    );
  }
}
