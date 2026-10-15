import {
  getSpareParts,
  getSparePartById,
  createNewSparePart,
  updateExistingSparePart,
  deleteExistingSparePart,
} from "@/services/spare-part.service";

import {
  createSparePartSchema,
  updateSparePartSchema,
} from "@/validations/spare-part.validation";

import { getZodErrors } from "@/lib/validation";

import { successResponse, errorResponse } from "@/lib/response";

function parseId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function handleControllerError(error, fallbackMessage) {
  const statusCode = error?.statusCode || 500;

  return errorResponse({
    code: statusCode,
    message: statusCode === 500 ? fallbackMessage : error.message,
  });
}

export async function getSparePartsController(request) {
  try {
    const result = await getSpareParts(request);

    return successResponse({
      code: 200,
      message: "Spare parts retrieved successfully.",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve spare parts.");
  }
}

export async function getSparePartController(sparePartId) {
  try {
    const id = parseId(sparePartId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid spare part ID.",
      });
    }

    const sparePart = await getSparePartById(id);

    return successResponse({
      code: 200,
      message: "Spare part retrieved successfully.",
      data: sparePart,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to retrieve spare part.");
  }
}

export async function createSparePartController(request) {
  try {
    const body = await request.json();

    const validation = createSparePartSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed.",
        errors: getZodErrors(validation.error),
      });
    }

    const sparePart = await createNewSparePart(validation.data);

    return successResponse({
      code: 201,
      message: "Spare part created successfully.",
      data: sparePart,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to create spare part.");
  }
}

export async function updateSparePartController(request, sparePartId) {
  try {
    /*
     * Next.js route params selalu
     * datang sebagai string.
     *
     * Contoh:
     * "1" -> 1
     */
    const id = parseId(sparePartId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid spare part ID.",
      });
    }

    const body = await request.json();

    const validation = updateSparePartSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed.",
        errors: getZodErrors(validation.error),
      });
    }

    const sparePart = await updateExistingSparePart(id, validation.data);

    return successResponse({
      code: 200,
      message: "Spare part updated successfully.",
      data: sparePart,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to update spare part.");
  }
}

export async function deleteSparePartController(sparePartId) {
  try {
    const id = parseId(sparePartId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid spare part ID.",
      });
    }

    await deleteExistingSparePart(id);

    return successResponse({
      code: 200,
      message: "Spare part deleted successfully.",
      data: null,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to delete spare part.");
  }
}
