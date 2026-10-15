import { addAdminServiceOrderServiceController } from "@/controllers/admin.service-order.controller";
import { requireRole } from "@/middleware/role.middleware";
import { errorResponse } from "@/lib/response";
import { handleMiddlewareError } from "@/middleware/error.middleware";

export async function POST(request, { params }) {
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

    return await addAdminServiceOrderServiceController(request, orderId);
  } catch (error) {
    return handleMiddlewareError(error);
  }
}
