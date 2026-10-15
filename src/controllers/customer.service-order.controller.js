import { getCustomerServiceOrder } from "@/services/service-order.service";

import { serviceOrderIdSchema } from "@/validations/service-order.validation";

import { successResponse, errorResponse } from "@/lib/response";

import { getZodErrors } from "@/lib/zod-error";

function getAuthUserId(auth) {
  return auth?.user?.id ?? auth?.id ?? auth?.userId;
}

function parseId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function handleControllerError(error, fallbackMessage) {
  console.error(error);

  return errorResponse({
    code: error?.statusCode || 500,
    message: error?.message || fallbackMessage,
  });
}

/**
 * GET CUSTOMER SERVICE ORDER DETAIL
 *
 * GET /api/customer/service-orders/[id]
 */
export async function getCustomerServiceOrderController(orderId, auth) {
  try {
    const customerId = getAuthUserId(auth);

    const id = parseId(orderId);

    if (!customerId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid service order ID",
      });
    }

    const validation = serviceOrderIdSchema.safeParse({
      id,
    });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    /**
     * IMPORTANT:
     *
     * getCustomerServiceOrder()
     * menerima parameter:
     *
     * serviceOrderId,
     * customerId
     *
     * Jadi jangan dibalik.
     */
    const order = await getCustomerServiceOrder(id, customerId);

    return successResponse({
      code: 200,
      message: "Service order retrieved successfully",
      data: order,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve service order");
  }
}
