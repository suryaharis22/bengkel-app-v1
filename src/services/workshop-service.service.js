import {
  countWorkshopServices,
  createWorkshopService,
  deleteWorkshopService,
  findWorkshopServiceById,
  findWorkshopServiceByName,
  findWorkshopServices,
  updateWorkshopService,
} from "@/models/workshop-service.model";

function createWorkshopServiceError(message, statusCode = 400) {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
}

function normalizeStatus(status) {
  if (status === undefined || status === null || status === "") {
    return undefined;
  }

  if (status === "active" || status === true || status === "true") {
    return true;
  }

  if (status === "inactive" || status === false || status === "false") {
    return false;
  }

  throw createWorkshopServiceError("Invalid workshop service status", 400);
}

function normalizePagination(value, fallback) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    return fallback;
  }

  return number;
}

function normalizeSearch(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

/**
 * Get workshop services
 */
export async function getWorkshopServices(options = {}) {
  const search = normalizeSearch(options.search);

  const status = normalizeStatus(options.status);

  const page = normalizePagination(options.page, 1);

  const perPage = Math.min(
    100,
    normalizePagination(options.per_page ?? options.perPage, 10),
  );

  const skip = (page - 1) * perPage;

  const [services, total] = await Promise.all([
    findWorkshopServices({
      search,
      status,
      skip,
      take: perPage,
    }),

    countWorkshopServices({
      search,
      status,
    }),
  ]);

  return {
    data: services,

    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: total === 0 ? 1 : Math.ceil(total / perPage),
    },
  };
}

/**
 * Get workshop service by ID
 */
export async function getWorkshopServiceById(id) {
  const serviceId = Number(id);

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    throw createWorkshopServiceError("Invalid workshop service ID", 422);
  }

  const service = await findWorkshopServiceById(serviceId);

  if (!service) {
    throw createWorkshopServiceError("Workshop service not found", 404);
  }

  return service;
}

/**
 * Create workshop service
 */
export async function createNewWorkshopService(data) {
  const name = normalizeSearch(data?.name);

  if (!name) {
    throw createWorkshopServiceError("Workshop service name is required", 422);
  }

  const price = Number(data?.price);

  if (!Number.isFinite(price) || price < 0) {
    throw createWorkshopServiceError(
      "Workshop service price must be a valid non-negative number",
      422,
    );
  }

  const existingService = await findWorkshopServiceByName(name);

  if (existingService) {
    throw createWorkshopServiceError(
      "Workshop service name already exists",
      409,
    );
  }

  return createWorkshopService({
    name,
    description:
      data?.description === undefined ||
      data?.description === null ||
      String(data.description).trim() === ""
        ? null
        : String(data.description).trim(),
    price,
    status: data?.status ?? true,
  });
}

/**
 * Update workshop service
 */
export async function updateExistingWorkshopService(id, data) {
  const serviceId = Number(id);

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    throw createWorkshopServiceError("Invalid workshop service ID", 422);
  }

  const existingService = await findWorkshopServiceById(serviceId);

  if (!existingService) {
    throw createWorkshopServiceError("Workshop service not found", 404);
  }

  if (data.name !== undefined) {
    const name = normalizeSearch(data.name);

    if (!name) {
      throw createWorkshopServiceError(
        "Workshop service name cannot be empty",
        422,
      );
    }

    const existingByName = await findWorkshopServiceByName(name);

    if (existingByName && Number(existingByName.id) !== serviceId) {
      throw createWorkshopServiceError(
        "Workshop service name already exists",
        409,
      );
    }
  }

  if (data.price !== undefined) {
    const price = Number(data.price);

    if (!Number.isFinite(price) || price < 0) {
      throw createWorkshopServiceError(
        "Workshop service price must be a valid non-negative number",
        422,
      );
    }
  }

  const updateData = {};

  if (data.name !== undefined) {
    updateData.name = normalizeSearch(data.name);
  }

  if (data.description !== undefined) {
    const description = normalizeSearch(data.description);

    updateData.description = description || null;
  }

  if (data.price !== undefined) {
    updateData.price = Number(data.price);
  }

  if (data.status !== undefined) {
    updateData.status = Boolean(data.status);
  }

  return updateWorkshopService(serviceId, updateData);
}

/**
 * Delete workshop service
 */
export async function deleteExistingWorkshopService(id) {
  const serviceId = Number(id);

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    throw createWorkshopServiceError("Invalid workshop service ID", 422);
  }

  const existingService = await findWorkshopServiceById(serviceId);

  if (!existingService) {
    throw createWorkshopServiceError("Workshop service not found", 404);
  }

  if (existingService._count?.order_items > 0) {
    throw createWorkshopServiceError(
      "Workshop service cannot be deleted because it is already used in service orders",
      409,
    );
  }

  return deleteWorkshopService(serviceId);
}
