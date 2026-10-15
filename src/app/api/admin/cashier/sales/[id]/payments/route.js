import { createSnapPaymentForSale } from "@/services/midtrans.service";

import { requireRole } from "@/middleware/role.middleware";

import { errorResponse, successResponse } from "@/lib/response";

import { handleMiddlewareError } from "@/middleware/error.middleware";

export async function GET(request, { params }) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id } = await params;

    const result = await createSnapPaymentForSale(id);

    return successResponse({
      code: 200,
      message: "Midtrans payment token retrieved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Cashier payment route error:", error);

    return handleMiddlewareError(error, "Failed to create payment transaction");
  }
}
