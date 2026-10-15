import { cancelCashierSaleController } from "@/controllers/cashier.controller";
import { requireRole } from "@/middleware/role.middleware";
import { errorResponse } from "@/lib/response";
import { handleMiddlewareError } from "@/middleware/error.middleware";

export async function PATCH(request, { params }) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return errorResponse({
        code: authorization.statusCode,
        message: authorization.message,
      });
    }

    const { id } = await params;

    return cancelCashierSaleController(request, id);
  } catch (error) {
    return handleMiddlewareError(error, "Failed to authorize request");
  }
}
