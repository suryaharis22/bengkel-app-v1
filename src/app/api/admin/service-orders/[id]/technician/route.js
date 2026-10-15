import { assignAdminServiceOrderTechnicianController } from "@/controllers/admin.service-order.controller";
import { errorResponse } from "@/lib/response";
import { handleMiddlewareError } from "@/middleware/error.middleware";
import { requireRole } from "@/middleware/role.middleware";

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

    return await assignAdminServiceOrderTechnicianController(request, orderId);
  } catch (error) {
    return handleMiddlewareError(error);
  }
}
