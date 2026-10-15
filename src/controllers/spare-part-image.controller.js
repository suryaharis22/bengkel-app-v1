import {
  getSparePartImages,
  createNewSparePartImage,
  updateExistingSparePartImage,
  deleteExistingSparePartImage,
  setSparePartImageAsPrimary,
  reorderExistingSparePartImages,
} from "@/services/spare-part-image.service";

import {
  createSparePartImageSchema,
  updateSparePartImageSchema,
  reorderSparePartImagesSchema,
} from "@/validations/spare-part-image.validation";

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

export async function getSparePartImagesController(sparePartId) {
  try {
    const id = parseId(sparePartId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid spare part ID.",
      });
    }

    const result = await getSparePartImages(id);

    return successResponse({
      code: 200,
      message: "Spare part images retrieved successfully.",
      data: result,
    });
  } catch (error) {
    return handleControllerError(
      error,
      "Failed to retrieve spare part images.",
    );
  }
}

export async function createSparePartImageController(request, sparePartId) {
  try {
    const id = parseId(sparePartId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid spare part ID.",
      });
    }

    const body = await request.json();

    const validation = createSparePartImageSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed.",
        errors: getZodErrors(validation.error),
      });
    }

    const image = await createNewSparePartImage(id, validation.data);

    return successResponse({
      code: 201,
      message: "Spare part image created successfully.",
      data: image,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to create spare part image.");
  }
}

export async function updateSparePartImageController(request, imageId) {
  try {
    const id = parseId(imageId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid image ID.",
      });
    }

    const body = await request.json();

    const validation = updateSparePartImageSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed.",
        errors: getZodErrors(validation.error),
      });
    }

    const image = await updateExistingSparePartImage(id, validation.data);

    return successResponse({
      code: 200,
      message: "Spare part image updated successfully.",
      data: image,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to update spare part image.");
  }
}

export async function deleteSparePartImageController(imageId) {
  try {
    const id = parseId(imageId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid image ID.",
      });
    }

    await deleteExistingSparePartImage(id);

    return successResponse({
      code: 200,
      message: "Spare part image deleted successfully.",
      data: null,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to delete spare part image.");
  }
}

export async function setPrimarySparePartImageController(imageId) {
  try {
    const id = parseId(imageId);

    if (!id) {
      return errorResponse({
        code: 422,
        message: "Invalid image ID.",
      });
    }

    const image = await setSparePartImageAsPrimary(id);

    return successResponse({
      code: 200,
      message: "Primary image updated successfully.",
      data: image,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to set primary image.");
  }
}

export async function reorderSparePartImagesController(request) {
  try {
    const body = await request.json();

    const validation = reorderSparePartImagesSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        code: 422,
        message: "Validation failed.",
        errors: getZodErrors(validation.error),
      });
    }

    const sparePartId = parseId(validation.data.spare_part_id);

    if (!sparePartId) {
      return errorResponse({
        code: 422,
        message: "Invalid spare part ID.",
      });
    }

    const images = await reorderExistingSparePartImages(
      sparePartId,
      validation.data.items,
    );

    return successResponse({
      code: 200,
      message: "Spare part images reordered successfully.",
      data: images,
    });
  } catch (error) {
    return handleControllerError(error, "Failed to reorder spare part images.");
  }
}
