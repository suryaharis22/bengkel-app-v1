import {
  createServiceOrderPayment,
  getServiceOrderPayment,
} from "@/services/service-order-payment.service";

import { successResponse } from "@/lib/response";

async function getServiceOrderId(context) {
  const params = await context.params;

  const serviceOrderId = Number(params?.id);

  if (!Number.isInteger(serviceOrderId) || serviceOrderId <= 0) {
    const error = new Error("Invalid service order ID.");
    error.code = "INVALID_SERVICE_ORDER_ID";
    error.statusCode = 422;
    throw error;
  }

  return serviceOrderId;
}

export async function getAdminServiceOrderPaymentController(
  request,
  context,
  authorization,
) {
  const serviceOrderId = await getServiceOrderId(context);

  const result = await getServiceOrderPayment({
    serviceOrderId,
    includeHistory: true,
  });

  return successResponse({
    code: 200,
    message: "Service order payment fetched successfully.",
    data: result,
  });
}

export async function createAdminServiceOrderPaymentController(
  request,
  context,
  authorization,
) {
  const serviceOrderId = await getServiceOrderId(context);

  const body = await request.json();

  const userId = authorization?.user?.id ?? authorization?.userId ?? null;

  const result = await createServiceOrderPayment({
    serviceOrderId,
    userId,
    payment: body,
  });

  return successResponse({
    code: 200,
    message: result.message,
    data: result.data,
  });
}
