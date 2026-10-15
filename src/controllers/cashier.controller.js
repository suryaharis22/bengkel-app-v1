import {
  getCashierProducts,
  checkoutCashier,
  getCashierSales,
  getCashierSaleDetail,
  cancelCashierSale,
} from "@/services/cashier.service";

import {
  cashierProductQuerySchema,
  cashierCheckoutSchema,
  cashierSalesQuerySchema,
  cashierCancelSaleSchema,
} from "@/validations/cashier.validation";

import { successResponse, errorResponse } from "@/lib/response";

import { getZodErrors } from "@/lib/validation";

function parseId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function handleControllerError(error, fallbackMessage) {
  console.error("Cashier controller error:", error);

  const statusCode = error?.statusCode || error?.status || 500;

  return errorResponse({
    code: statusCode,
    message:
      statusCode >= 500 ? fallbackMessage : error?.message || fallbackMessage,
  });
}

export async function getCashierProductsController(request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = {
      search: searchParams.get("search") || "",
      brands: searchParams.get("brands") || "",
      categories: searchParams.get("categories") || "",
      page: searchParams.get("page") || "1",
      per_page: searchParams.get("per_page") || "20",
    };

    const validation = cashierProductQuerySchema.safeParse(query);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed.",
        errors: getZodErrors(validation.error),
      });
    }

    const result = await getCashierProducts({
      search: validation.data.search,
      brands: validation.data.brands,
      categories: validation.data.categories,
      page: validation.data.page,
      perPage: validation.data.per_page,
    });

    return successResponse({
      code: 200,
      message: "Cashier products retrieved successfully.",
      data: result.items,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve cashier products.");
  }
}

export async function checkoutCashierController(request, auth) {
  try {
    const body = await request.json();

    const validation = cashierCheckoutSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed.",
        errors: getZodErrors(validation.error),
      });
    }

    const cashierId = auth?.user?.id ?? auth?.userId ?? auth?.id ?? null;

    const parsedCashierId = parseId(cashierId);

    if (!parsedCashierId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized.",
      });
    }

    const result = await checkoutCashier({
      cashierId: parsedCashierId,

      customerId: validation.data.customer_id ?? null,

      customerName: validation.data.customer_name ?? null,

      customerPhone: validation.data.customer_phone ?? null,

      discount: validation.data.discount ?? 0,

      tax: validation.data.tax ?? 0,

      notes: validation.data.notes ?? null,

      items: validation.data.items,

      payment: validation.data.payment,
    });

    return successResponse({
      code: 201,
      message: "Cashier transaction completed successfully.",
      data: result,
    });
  } catch (error) {
    return handleControllerError(
      error,
      "Failed to complete cashier transaction.",
    );
  }
}

export async function getCashierSalesController(request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = {
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || undefined,
      payment_status: searchParams.get("payment_status") || undefined,
      page: searchParams.get("page") || "1",
      per_page: searchParams.get("per_page") || "20",
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
    };

    const validation = cashierSalesQuerySchema.safeParse(query);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed.",
        errors: getZodErrors(validation.error),
      });
    }

    const result = await getCashierSales({
      search: validation.data.search,
      status: validation.data.status,
      paymentStatus: validation.data.payment_status,
      page: validation.data.page,
      perPage: validation.data.per_page,
      dateFrom: validation.data.date_from,
      dateTo: validation.data.date_to,
    });

    return successResponse({
      code: 200,
      message: "Cashier sales retrieved successfully.",
      data: result.items,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve cashier sales.");
  }
}

export async function getCashierSaleDetailController(saleId) {
  try {
    const id = parseId(saleId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid sale ID.",
      });
    }

    const result = await getCashierSaleDetail(id);

    return successResponse({
      code: 200,
      message: "Cashier sale retrieved successfully.",
      data: result,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve cashier sale.");
  }
}

export async function cancelCashierSaleController(request, saleId) {
  try {
    const id = parseId(saleId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid sale ID.",
      });
    }

    const body = await request.json();

    const validation = cashierCancelSaleSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed.",
        errors: getZodErrors(validation.error),
      });
    }

    const result = await cancelCashierSale({
      id,
      notes: validation.data.notes ?? null,
    });

    return successResponse({
      code: 200,
      message: "Cashier sale cancelled successfully.",
      data: result,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to cancel cashier sale.");
  }
}
