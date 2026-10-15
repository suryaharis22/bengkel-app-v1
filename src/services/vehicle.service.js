import { prisma } from "@/lib/prisma";

import {
  findVehicleById,
  findVehicles,
  countVehicles,
  findVehicleByPlate,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/models/vehicle.model";

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
}

function normalizeString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();

  return normalized === "" ? null : normalized;
}

function normalizePlateNumber(value) {
  const plate = normalizeString(value);

  if (!plate) {
    throw createServiceError("Plate number is required", 422);
  }

  return plate.toUpperCase().replace(/\s+/g, " ");
}

function normalizeYear(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const year = Number(value);

  if (
    !Number.isInteger(year) ||
    year < 1900 ||
    year > new Date().getFullYear() + 1
  ) {
    throw createServiceError("Vehicle year is invalid", 422);
  }

  return year;
}

function sanitizeVehicle(vehicle) {
  if (!vehicle) {
    return null;
  }

  const latestServiceBooking = vehicle.service_bookings?.[0] ?? null;

  let type = null;
  let name = null;
  let customerPhone = null;

  if (latestServiceBooking) {
    if (latestServiceBooking.customer_id !== null) {
      type = "Customer";
      name = vehicle.user?.username ?? null;
      customerPhone = vehicle.user?.no_hp ?? null;
    } else {
      type = "Guest";
      name = latestServiceBooking.customer_name ?? null;
      customerPhone = latestServiceBooking.customer_phone ?? null;
    }
  }

  return {
    id: vehicle.id,
    user_id: vehicle.user_id,
    plate_number: vehicle.plate_number,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    created_at: vehicle.created_at,
    updated_at: vehicle.updated_at,
    customer: {
      id: vehicle.user?.id ?? null,
      username: vehicle.user?.username ?? null,
      name,
      email: vehicle.user?.email ?? null,
      no_hp: vehicle.user?.no_hp ?? customerPhone,
    },
    booking_count: vehicle._count?.service_bookings ?? 0,
    type,
  };
}

function sanitizeVehicleList(vehicles = []) {
  return vehicles.map(sanitizeVehicle);
}

/*
|--------------------------------------------------------------------------
| ADMIN VALIDATION
|--------------------------------------------------------------------------
*/

async function getAdminOrFail(adminId) {
  const admin = await prisma.user.findUnique({
    where: {
      id: adminId,
    },

    select: {
      id: true,
      role: true,
    },
  });

  if (!admin) {
    throw createServiceError("Admin not found", 404);
  }

  if (admin.role !== "admin") {
    throw createServiceError("Only admin can perform this action", 403);
  }

  return admin;
}

/*
|--------------------------------------------------------------------------
| CUSTOMER VALIDATION
|--------------------------------------------------------------------------
*/

async function getCustomerOrFail(customerId) {
  const customer = await prisma.user.findUnique({
    where: {
      id: customerId,
    },

    select: {
      id: true,
      username: true,
      email: true,
      no_hp: true,
      role: true,
    },
  });

  if (!customer) {
    throw createServiceError("Customer not found", 404);
  }

  if (customer.role !== "customer") {
    throw createServiceError("Only customer can perform this action", 403);
  }

  return customer;
}

/*
|--------------------------------------------------------------------------
| FIND CUSTOMER VEHICLE
|--------------------------------------------------------------------------
*/

async function getCustomerVehicleOrFail(customerId, vehicleId) {
  const vehicle = await findVehicleById(vehicleId);

  if (!vehicle) {
    throw createServiceError("Vehicle not found", 404);
  }

  if (vehicle.user_id !== customerId) {
    throw createServiceError("You do not have access to this vehicle", 403);
  }

  return vehicle;
}

/*
|--------------------------------------------------------------------------
| CHECK PLATE
|--------------------------------------------------------------------------
*/

async function ensurePlateAvailable(
  plateNumber,
  excludeVehicleId = null,
  tx = prisma,
) {
  const existingVehicle = await findVehicleByPlate(plateNumber, tx);

  if (!existingVehicle) {
    return;
  }

  if (excludeVehicleId && existingVehicle.id === excludeVehicleId) {
    return;
  }

  throw createServiceError("Plate number is already registered", 409);
}

/*
|--------------------------------------------------------------------------
| GET VEHICLE BY ID
|--------------------------------------------------------------------------
*/

export async function getVehicleById(vehicleId) {
  const id = Number(vehicleId);

  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError("Vehicle ID must be a positive integer", 422);
  }

  const vehicle = await findVehicleById(id);

  if (!vehicle) {
    throw createServiceError("Vehicle not found", 404);
  }

  return sanitizeVehicle(vehicle);
}

/*
|--------------------------------------------------------------------------
| GET CUSTOMER VEHICLE
|--------------------------------------------------------------------------
*/

export async function getCustomerVehicle(customerId, vehicleId) {
  await getCustomerOrFail(customerId);

  const id = Number(vehicleId);

  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError("Vehicle ID must be a positive integer", 422);
  }

  const vehicle = await getCustomerVehicleOrFail(customerId, id);

  return sanitizeVehicle(vehicle);
}

/*
|--------------------------------------------------------------------------
| GET CUSTOMER VEHICLES
|--------------------------------------------------------------------------
*/

export async function getCustomerVehicles(customerId, options = {}) {
  await getCustomerOrFail(customerId);

  const { search, page = 1, per_page = 20 } = options;

  const normalizedPage = Number(page);

  const normalizedPerPage = Number(per_page);

  if (!Number.isInteger(normalizedPage) || normalizedPage < 1) {
    throw createServiceError("Page must be a positive integer", 422);
  }

  if (!Number.isInteger(normalizedPerPage) || normalizedPerPage < 1) {
    throw createServiceError("Per page must be a positive integer", 422);
  }

  const normalizedSearch = search ? String(search).trim() : undefined;

  const skip = (normalizedPage - 1) * normalizedPerPage;

  const [vehicles, total] = await Promise.all([
    findVehicles({
      user_id: customerId,

      search: normalizedSearch,

      skip,

      take: normalizedPerPage,
    }),

    countVehicles({
      user_id: customerId,

      search: normalizedSearch,
    }),
  ]);

  return {
    data: sanitizeVehicleList(vehicles),

    meta: {
      page: normalizedPage,

      per_page: normalizedPerPage,

      total,

      total_pages: Math.ceil(total / normalizedPerPage),
    },
  };
}

/*
|--------------------------------------------------------------------------
| GET ADMIN VEHICLES
|--------------------------------------------------------------------------
*/

export async function getVehicles(adminId, options = {}) {
  await getAdminOrFail(adminId);

  const { search, page = 1, per_page = 20 } = options;

  const normalizedPage = Number(page);

  const normalizedPerPage = Number(per_page);

  if (!Number.isInteger(normalizedPage) || normalizedPage < 1) {
    throw createServiceError("Page must be a positive integer", 422);
  }

  if (!Number.isInteger(normalizedPerPage) || normalizedPerPage < 1) {
    throw createServiceError("Per page must be a positive integer", 422);
  }

  const normalizedSearch = search ? String(search).trim() : undefined;

  const skip = (normalizedPage - 1) * normalizedPerPage;

  const [vehicles, total] = await Promise.all([
    findVehicles({
      search: normalizedSearch,

      skip,

      take: normalizedPerPage,
    }),

    countVehicles({
      search: normalizedSearch,
    }),
  ]);

  return {
    data: sanitizeVehicleList(vehicles),

    meta: {
      page: normalizedPage,

      per_page: normalizedPerPage,

      total,

      total_pages: Math.ceil(total / normalizedPerPage),
    },
  };
}

/*
|--------------------------------------------------------------------------
| GET GUEST VEHICLES
|--------------------------------------------------------------------------
*/

export async function getGuestVehicles(adminId, options = {}) {
  await getAdminOrFail(adminId);

  const { search, page = 1, per_page = 20 } = options;

  const normalizedPage = Number(page);

  const normalizedPerPage = Number(per_page);

  if (!Number.isInteger(normalizedPage) || normalizedPage < 1) {
    throw createServiceError("Page must be a positive integer", 422);
  }

  if (!Number.isInteger(normalizedPerPage) || normalizedPerPage < 1) {
    throw createServiceError("Per page must be a positive integer", 422);
  }

  const normalizedSearch = search ? String(search).trim() : undefined;

  const skip = (normalizedPage - 1) * normalizedPerPage;

  const [vehicles, total] = await Promise.all([
    findVehicles({
      search: normalizedSearch,

      only_guest: true,

      skip,

      take: normalizedPerPage,
    }),

    countVehicles({
      search: normalizedSearch,

      only_guest: true,
    }),
  ]);

  return {
    data: sanitizeVehicleList(vehicles),

    meta: {
      page: normalizedPage,

      per_page: normalizedPerPage,

      total,

      total_pages: Math.ceil(total / normalizedPerPage),
    },
  };
}

/*
|--------------------------------------------------------------------------
| CREATE CUSTOMER VEHICLE
|--------------------------------------------------------------------------
*/

export async function createCustomerVehicle(customerId, data) {
  await getCustomerOrFail(customerId);

  const plateNumber = normalizePlateNumber(data?.plate_number);

  const brand = normalizeString(data?.brand);

  const model = normalizeString(data?.model);

  const year = normalizeYear(data?.year);

  const color = normalizeString(data?.color);

  if (!brand) {
    throw createServiceError("Vehicle brand is required", 422);
  }

  if (!model) {
    throw createServiceError("Vehicle model is required", 422);
  }

  await ensurePlateAvailable(plateNumber);

  const vehicle = await createVehicle(prisma, {
    user_id: customerId,

    plate_number: plateNumber,

    brand,

    model,

    year,

    color,
  });

  return sanitizeVehicle(vehicle);
}

/*
|--------------------------------------------------------------------------
| CREATE GUEST VEHICLE
|--------------------------------------------------------------------------
*/

export async function createGuestVehicle(adminId, data) {
  await getAdminOrFail(adminId);

  const plateNumber = normalizePlateNumber(data?.plate_number);

  const brand = normalizeString(data?.brand);

  const model = normalizeString(data?.model);

  const year = normalizeYear(data?.year);

  const color = normalizeString(data?.color);

  if (!brand) {
    throw createServiceError("Vehicle brand is required", 422);
  }

  if (!model) {
    throw createServiceError("Vehicle model is required", 422);
  }

  await ensurePlateAvailable(plateNumber);

  const vehicle = await createVehicle(prisma, {
    user_id: null,

    plate_number: plateNumber,

    brand,

    model,

    year,

    color,
  });

  return sanitizeVehicle(vehicle);
}

/*
|--------------------------------------------------------------------------
| CREATE ADMIN VEHICLE
|--------------------------------------------------------------------------
*/

export async function createAdminVehicle(adminId, data) {
  await getAdminOrFail(adminId);

  const plateNumber = normalizePlateNumber(data?.plate_number);

  const brand = normalizeString(data?.brand);

  const model = normalizeString(data?.model);

  const year = normalizeYear(data?.year);

  const color = normalizeString(data?.color);

  const userId =
    data?.user_id === null || data?.user_id === undefined
      ? null
      : Number(data.user_id);

  if (!brand) {
    throw createServiceError("Vehicle brand is required", 422);
  }

  if (!model) {
    throw createServiceError("Vehicle model is required", 422);
  }

  if (userId !== null && (!Number.isInteger(userId) || userId <= 0)) {
    throw createServiceError("Invalid user ID", 422);
  }

  if (userId !== null) {
    const customer = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        role: true,
      },
    });

    if (!customer) {
      throw createServiceError("Customer not found", 404);
    }

    if (customer.role !== "customer") {
      throw createServiceError(
        "Vehicle can only be assigned to a customer",
        422,
      );
    }
  }

  await ensurePlateAvailable(plateNumber);

  const vehicle = await createVehicle(prisma, {
    user_id: userId,

    plate_number: plateNumber,

    brand,

    model,

    year,

    color,
  });

  return sanitizeVehicle(vehicle);
}

/*
|--------------------------------------------------------------------------
| UPDATE CUSTOMER VEHICLE
|--------------------------------------------------------------------------
*/

export async function updateCustomerVehicle(customerId, vehicleId, data) {
  await getCustomerOrFail(customerId);

  const id = Number(vehicleId);

  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError("Vehicle ID must be a positive integer", 422);
  }

  const existingVehicle = await getCustomerVehicleOrFail(customerId, id);

  const updateData = {};

  if (data?.plate_number !== undefined) {
    const plateNumber = normalizePlateNumber(data.plate_number);

    await ensurePlateAvailable(plateNumber, id);

    updateData.plate_number = plateNumber;
  }

  if (data?.brand !== undefined) {
    const brand = normalizeString(data.brand);

    if (!brand) {
      throw createServiceError("Vehicle brand is required", 422);
    }

    updateData.brand = brand;
  }

  if (data?.model !== undefined) {
    const model = normalizeString(data.model);

    if (!model) {
      throw createServiceError("Vehicle model is required", 422);
    }

    updateData.model = model;
  }

  if (data?.year !== undefined) {
    updateData.year = normalizeYear(data.year);
  }

  if (data?.color !== undefined) {
    updateData.color = normalizeString(data.color);
  }

  if (Object.keys(updateData).length === 0) {
    throw createServiceError("At least one field must be provided", 422);
  }

  const vehicle = await updateVehicle(prisma, existingVehicle.id, updateData);

  return sanitizeVehicle(vehicle);
}

/*
|--------------------------------------------------------------------------
| UPDATE ADMIN VEHICLE
|--------------------------------------------------------------------------
*/

export async function updateAdminVehicle(adminId, vehicleId, data) {
  await getAdminOrFail(adminId);

  const id = Number(vehicleId);

  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError("Vehicle ID must be a positive integer", 422);
  }

  const existingVehicle = await findVehicleById(id);

  if (!existingVehicle) {
    throw createServiceError("Vehicle not found", 404);
  }

  const updateData = {};

  if (data?.user_id !== undefined) {
    const userId = data.user_id === null ? null : Number(data.user_id);

    if (userId !== null && (!Number.isInteger(userId) || userId <= 0)) {
      throw createServiceError("Invalid user ID", 422);
    }

    if (userId !== null) {
      const customer = await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          role: true,
        },
      });

      if (!customer) {
        throw createServiceError("Customer not found", 404);
      }

      if (customer.role !== "customer") {
        throw createServiceError(
          "Vehicle can only be assigned to a customer",
          422,
        );
      }
    }

    updateData.user_id = userId;
  }

  if (data?.plate_number !== undefined) {
    const plateNumber = normalizePlateNumber(data.plate_number);

    await ensurePlateAvailable(plateNumber, id);

    updateData.plate_number = plateNumber;
  }

  if (data?.brand !== undefined) {
    const brand = normalizeString(data.brand);

    if (!brand) {
      throw createServiceError("Vehicle brand is required", 422);
    }

    updateData.brand = brand;
  }

  if (data?.model !== undefined) {
    const model = normalizeString(data.model);

    if (!model) {
      throw createServiceError("Vehicle model is required", 422);
    }

    updateData.model = model;
  }

  if (data?.year !== undefined) {
    updateData.year = normalizeYear(data.year);
  }

  if (data?.color !== undefined) {
    updateData.color = normalizeString(data.color);
  }

  if (Object.keys(updateData).length === 0) {
    throw createServiceError("At least one field must be provided", 422);
  }

  const vehicle = await updateVehicle(prisma, id, updateData);

  return sanitizeVehicle(vehicle);
}

/*
|--------------------------------------------------------------------------
| DELETE CUSTOMER VEHICLE
|--------------------------------------------------------------------------
*/

export async function deleteCustomerVehicle(customerId, vehicleId) {
  await getCustomerOrFail(customerId);

  const id = Number(vehicleId);

  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError("Vehicle ID must be a positive integer", 422);
  }

  const vehicle = await getCustomerVehicleOrFail(customerId, id);

  if (vehicle._count?.service_bookings > 0) {
    throw createServiceError(
      "Vehicle cannot be deleted because it has service booking history",
      409,
    );
  }

  try {
    await deleteVehicle(prisma, id);
  } catch (error) {
    if (error?.code === "P2003") {
      throw createServiceError(
        "Vehicle cannot be deleted because it is already used by another record",
        409,
      );
    }

    throw error;
  }

  return {
    id,

    message: "Vehicle deleted successfully",
  };
}

/*
|--------------------------------------------------------------------------
| DELETE ADMIN VEHICLE
|--------------------------------------------------------------------------
*/

export async function deleteAdminVehicle(adminId, vehicleId) {
  await getAdminOrFail(adminId);

  const id = Number(vehicleId);

  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError("Vehicle ID must be a positive integer", 422);
  }

  const vehicle = await findVehicleById(id);

  if (!vehicle) {
    throw createServiceError("Vehicle not found", 404);
  }

  if (vehicle._count?.service_bookings > 0) {
    throw createServiceError(
      "Vehicle cannot be deleted because it has service booking history",
      409,
    );
  }

  try {
    await deleteVehicle(prisma, id);
  } catch (error) {
    if (error?.code === "P2003") {
      throw createServiceError(
        "Vehicle cannot be deleted because it is already used by another record",
        409,
      );
    }

    throw error;
  }

  return {
    id,

    message: "Vehicle deleted successfully",
  };
}
