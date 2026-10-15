import { NextResponse } from "next/server";

import { handleMidtransNotification } from "@/services/midtrans.service";

export async function POST(request) {
  try {
    const notification = await request.json();

    console.log(
      "Midtrans notification received:",
      JSON.stringify(notification, null, 2),
    );

    const result = await handleMidtransNotification(notification);

    return NextResponse.json(
      {
        success: true,
        code: 200,
        message: "Midtrans notification processed successfully.",
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Midtrans notification error:", error);

    const statusCode = error?.statusCode || error?.status || 500;

    return NextResponse.json(
      {
        success: false,
        code: statusCode,
        message:
          statusCode >= 500
            ? "Failed to process Midtrans notification."
            : error?.message || "Failed to process Midtrans notification.",
      },
      { status: statusCode },
    );
  }
}
