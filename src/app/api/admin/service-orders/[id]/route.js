import { getAdminServiceOrderController } from "@/controllers/admin.service-order.controller";
import { requireRole } from "@/middleware/role.middleware";
import { errorResponse } from "@/lib/response";
import { handleMiddlewareError } from "@/middleware/error.middleware";

export async function GET(request, { params }) {
  try {
    const authorization = await requireRole(["admin"]);

    if (!authorization.authorized) {
      return authorization.response;
    }

    const { id } = await params;

    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return errorResponse("Invalid service order ID", 400);
    }

    return await getAdminServiceOrderController(orderId);
  } catch (error) {
    return handleMiddlewareError(error);
  }
}
