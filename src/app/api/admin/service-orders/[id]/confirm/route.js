import { confirmAdminServiceOrderController } from "@/controllers/admin.service-order.controller";
import { requireRole } from "@/middleware/role.middleware";
import { handleMiddlewareError } from "@/middleware/error.middleware";
import { errorResponse } from "@/lib/response";

export async function PUT(request, { params }) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return authorization.response;
    }

    const { id } = await params;

    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    const userId =
      authorization?.user?.id ??
      authorization?.userId ??
      authorization?.id ??
      null;

    return await confirmAdminServiceOrderController(orderId, userId);
  } catch (error) {
    return handleMiddlewareError(error);
  }
}
