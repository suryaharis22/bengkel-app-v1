import {
  getVehicleById,
  getCustomerVehicle,
  getCustomerVehicles,
  getVehicles,
  getGuestVehicles,
  createCustomerVehicle,
  createGuestVehicle,
  createAdminVehicle,
  updateCustomerVehicle,
  updateAdminVehicle,
  deleteCustomerVehicle,
  deleteAdminVehicle,
} from "@/services/vehicle.service";

import {
  vehicleQuerySchema,
  vehicleIdSchema,
  createCustomerVehicleSchema,
  createGuestVehicleSchema,
  createAdminVehicleSchema,
  updateCustomerVehicleSchema,
  updateAdminVehicleSchema,
} from "@/validations/vehicle.validation";

import { successResponse, errorResponse } from "@/lib/response";
import { getVehicleServiceHistory } from "@/services/service-order.service";

import { getZodErrors } from "@/lib/zod-error";

function parseId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function getAuthUserId(auth) {
  const userId = Number(auth?.user?.id ?? auth?.id ?? auth?.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  return userId;
}

function handleControllerError(error, fallbackMessage) {
  console.error(fallbackMessage, error);

  return errorResponse({
    code: error?.statusCode || error?.code || 500,
    message: error?.message || fallbackMessage,
  });
}

/*
|--------------------------------------------------------------------------
| VEHICLE SERVICE HISTORY
|--------------------------------------------------------------------------
*/

export async function getVehicleServiceHistoryController(
  vehicleId,
  auth,
  searchParams,
) {
  try {
    const adminId = getAuthUserId(auth);

    if (!adminId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const id = parseId(vehicleId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid vehicle ID",
      });
    }

    const page = searchParams?.get("page");
    const perPage = searchParams?.get("per_page");

    const result = await getVehicleServiceHistory(id, {
      page,
      per_page: perPage,
    });

    return successResponse({
      code: 200,
      message: "Vehicle service history retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(
      error,
      "Failed to get vehicle service history",
    );
  }
}

/*
|--------------------------------------------------------------------------
| CUSTOMER
|--------------------------------------------------------------------------
| GET /api/customer/vehicles
|--------------------------------------------------------------------------
*/

export async function getCustomerVehiclesController(request, auth) {
  try {
    const customerId = getAuthUserId(auth);

    if (!customerId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const { searchParams } = new URL(request.url);

    const validation = vehicleQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      per_page: searchParams.get("per_page") || undefined,
    });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const result = await getCustomerVehicles(customerId, validation.data);

    return successResponse({
      code: 200,
      message: "Customer vehicles retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to get customer vehicles");
  }
}

/*
|--------------------------------------------------------------------------
| GET CUSTOMER VEHICLE
|--------------------------------------------------------------------------
*/

export async function getCustomerVehicleController(vehicleId, auth) {
  try {
    const customerId = getAuthUserId(auth);

    if (!customerId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const id = parseId(vehicleId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid vehicle ID",
      });
    }

    const validation = vehicleIdSchema.safeParse({
      id,
    });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const vehicle = await getCustomerVehicle(customerId, validation.data.id);

    return successResponse({
      code: 200,
      message: "Vehicle retrieved successfully",
      data: vehicle,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to get vehicle");
  }
}

/*
|--------------------------------------------------------------------------
| CREATE CUSTOMER VEHICLE
|--------------------------------------------------------------------------
*/

export async function createCustomerVehicleController(request, auth) {
  try {
    const customerId = getAuthUserId(auth);

    if (!customerId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse({
        code: 400,
        message: "Invalid JSON request body",
      });
    }

    const validation = createCustomerVehicleSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const vehicle = await createCustomerVehicle(customerId, validation.data);

    return successResponse({
      code: 201,
      message: "Vehicle created successfully",
      data: vehicle,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to create vehicle");
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE CUSTOMER VEHICLE
|--------------------------------------------------------------------------
*/

export async function updateCustomerVehicleController(
  request,
  vehicleId,
  auth,
) {
  try {
    const customerId = getAuthUserId(auth);

    if (!customerId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const id = parseId(vehicleId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid vehicle ID",
      });
    }

    const idValidation = vehicleIdSchema.safeParse({
      id,
    });

    if (!idValidation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(idValidation.error),
      });
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse({
        code: 400,
        message: "Invalid JSON request body",
      });
    }

    const validation = updateCustomerVehicleSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const vehicle = await updateCustomerVehicle(
      customerId,
      idValidation.data.id,
      validation.data,
    );

    return successResponse({
      code: 200,
      message: "Vehicle updated successfully",
      data: vehicle,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to update vehicle");
  }
}

/*
|--------------------------------------------------------------------------
| DELETE CUSTOMER VEHICLE
|--------------------------------------------------------------------------
*/

export async function deleteCustomerVehicleController(vehicleId, auth) {
  try {
    const customerId = getAuthUserId(auth);

    if (!customerId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const id = parseId(vehicleId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid vehicle ID",
      });
    }

    const validation = vehicleIdSchema.safeParse({
      id,
    });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const result = await deleteCustomerVehicle(customerId, validation.data.id);

    return successResponse({
      code: 200,
      message: result.message,
      data: {
        id: result.id,
      },
    });
  } catch (error) {
    return handleControllerError(error, "Failed to delete vehicle");
  }
}

/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
| GET /api/admin/vehicles
|--------------------------------------------------------------------------
*/

export async function getVehiclesController(request, auth) {
  try {
    const adminId = getAuthUserId(auth);

    if (!adminId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const { searchParams } = new URL(request.url);

    const validation = vehicleQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      per_page: searchParams.get("per_page") || undefined,
    });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const result = await getVehicles(adminId, validation.data);

    return successResponse({
      code: 200,
      message: "Vehicles retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to get vehicles");
  }
}

/*
|--------------------------------------------------------------------------
| GET ADMIN VEHICLE
|--------------------------------------------------------------------------
*/

export async function getVehicleController(vehicleId, auth) {
  try {
    const adminId = getAuthUserId(auth);

    if (!adminId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const id = parseId(vehicleId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid vehicle ID",
      });
    }

    const validation = vehicleIdSchema.safeParse({
      id,
    });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const vehicle = await getVehicleById(validation.data.id);

    return successResponse({
      code: 200,
      message: "Vehicle retrieved successfully",
      data: vehicle,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to get vehicle");
  }
}

/*
|--------------------------------------------------------------------------
| GET GUEST VEHICLES
|--------------------------------------------------------------------------
*/

export async function getGuestVehiclesController(request, auth) {
  try {
    const adminId = getAuthUserId(auth);

    if (!adminId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const { searchParams } = new URL(request.url);

    const validation = vehicleQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      per_page: searchParams.get("per_page") || undefined,
    });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const result = await getGuestVehicles(adminId, validation.data);

    return successResponse({
      code: 200,
      message: "Guest vehicles retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to get guest vehicles");
  }
}

/*
|--------------------------------------------------------------------------
| CREATE ADMIN VEHICLE
|--------------------------------------------------------------------------
*/

export async function createAdminVehicleController(request, auth) {
  try {
    const adminId = getAuthUserId(auth);

    if (!adminId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse({
        code: 400,
        message: "Invalid JSON request body",
      });
    }

    const validation = createAdminVehicleSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const vehicle = await createAdminVehicle(adminId, validation.data);

    return successResponse({
      code: 201,
      message: "Vehicle created successfully",
      data: vehicle,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to create vehicle");
  }
}

/*
|--------------------------------------------------------------------------
| CREATE GUEST VEHICLE
|--------------------------------------------------------------------------
*/

export async function createGuestVehicleController(request, auth) {
  try {
    const adminId = getAuthUserId(auth);

    if (!adminId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse({
        code: 400,
        message: "Invalid JSON request body",
      });
    }

    const validation = createGuestVehicleSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const vehicle = await createGuestVehicle(adminId, validation.data);

    return successResponse({
      code: 201,
      message: "Guest vehicle created successfully",
      data: vehicle,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to create guest vehicle");
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE ADMIN VEHICLE
|--------------------------------------------------------------------------
*/

export async function updateAdminVehicleController(request, vehicleId, auth) {
  try {
    const adminId = getAuthUserId(auth);

    if (!adminId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const id = parseId(vehicleId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid vehicle ID",
      });
    }

    const idValidation = vehicleIdSchema.safeParse({
      id,
    });

    if (!idValidation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(idValidation.error),
      });
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse({
        code: 400,
        message: "Invalid JSON request body",
      });
    }

    const validation = updateAdminVehicleSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const vehicle = await updateAdminVehicle(
      adminId,
      idValidation.data.id,
      validation.data,
    );

    return successResponse({
      code: 200,
      message: "Vehicle updated successfully",
      data: vehicle,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to update vehicle");
  }
}

/*
|--------------------------------------------------------------------------
| DELETE ADMIN VEHICLE
|--------------------------------------------------------------------------
*/

export async function deleteAdminVehicleController(vehicleId, auth) {
  try {
    const adminId = getAuthUserId(auth);

    if (!adminId) {
      return errorResponse({
        code: 401,
        message: "Unauthorized",
      });
    }

    const id = parseId(vehicleId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid vehicle ID",
      });
    }

    const validation = vehicleIdSchema.safeParse({
      id,
    });

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed",
        errors: getZodErrors(validation.error),
      });
    }

    const result = await deleteAdminVehicle(adminId, validation.data.id);

    return successResponse({
      code: 200,
      message: result.message,
      data: {
        id: result.id,
      },
    });
  } catch (error) {
    return handleControllerError(error, "Failed to delete vehicle");
  }
}
