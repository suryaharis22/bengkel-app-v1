import {
  countSparePartImages,
  createSparePartImage,
  deleteSparePartImage,
  findSparePartById,
  findSparePartImageById,
  findSparePartImages,
  reorderSparePartImages,
  setPrimarySparePartImage,
  updateSparePartImage,
} from "@/models/spare-part-image.model";

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

function sanitizeSparePartImage(image) {
  if (!image) {
    return null;
  }

  return {
    id: image.id,

    spare_part_id: image.spare_part_id,

    image_url: image.image_url,

    sort_order: image.sort_order,

    is_primary: image.is_primary,

    created_at: image.created_at,
  };
}

export async function getSparePartImages(sparePartId) {
  const sparePart = await findSparePartById(sparePartId);

  if (!sparePart) {
    throw createServiceError("Spare part not found", 404);
  }

  const images = await findSparePartImages(sparePartId);

  return {
    sparePart: {
      id: sparePart.id,
      name: sparePart.name,
      slug: sparePart.slug,
    },

    images: images.map(sanitizeSparePartImage),

    total: images.length,
  };
}

export async function createNewSparePartImage(sparePartId, data) {
  const sparePart = await findSparePartById(sparePartId);

  if (!sparePart) {
    throw createServiceError("Spare part not found", 404);
  }

  const totalImages = await countSparePartImages(sparePartId);

  const isPrimary = data.is_primary === true || totalImages === 0;

  let sortOrder = data.sort_order;

  if (sortOrder === undefined) {
    sortOrder = totalImages;
  }

  if (isPrimary) {
    const image = await createSparePartImage({
      spare_part_id: sparePartId,

      image_url: data.image_url,

      sort_order: sortOrder,

      is_primary: false,
    });

    const primaryImage = await setPrimarySparePartImage(image.id, sparePartId);

    return sanitizeSparePartImage(primaryImage);
  }

  const image = await createSparePartImage({
    spare_part_id: sparePartId,

    image_url: data.image_url,

    sort_order: sortOrder,

    is_primary: false,
  });

  return sanitizeSparePartImage(image);
}

export async function updateExistingSparePartImage(id, data) {
  const existingImage = await findSparePartImageById(id);

  if (!existingImage) {
    throw createServiceError("Spare part image not found", 404);
  }

  const updateData = {
    ...(data.image_url !== undefined && {
      image_url: data.image_url,
    }),

    ...(data.sort_order !== undefined && {
      sort_order: data.sort_order,
    }),
  };

  const image = await updateSparePartImage(id, updateData);

  return sanitizeSparePartImage(image);
}

export async function deleteExistingSparePartImage(id) {
  const existingImage = await findSparePartImageById(id);

  if (!existingImage) {
    throw createServiceError("Spare part image not found", 404);
  }

  const wasPrimary = existingImage.is_primary;

  const sparePartId = existingImage.spare_part_id;

  await deleteSparePartImage(id);

  if (wasPrimary) {
    const remainingImages = await findSparePartImages(sparePartId);

    if (remainingImages.length > 0) {
      await setPrimarySparePartImage(remainingImages[0].id, sparePartId);
    }
  }
}

export async function setSparePartImageAsPrimary(id) {
  const existingImage = await findSparePartImageById(id);

  if (!existingImage) {
    throw createServiceError("Spare part image not found", 404);
  }

  const image = await setPrimarySparePartImage(id, existingImage.spare_part_id);

  return sanitizeSparePartImage(image);
}

export async function reorderExistingSparePartImages(sparePartId, items) {
  const sparePart = await findSparePartById(sparePartId);

  if (!sparePart) {
    throw createServiceError("Spare part not found", 404);
  }

  const existingImages = await findSparePartImages(sparePartId);

  const existingImageIds = new Set(existingImages.map((image) => image.id));

  const receivedIds = new Set();

  for (const item of items) {
    if (!existingImageIds.has(item.id)) {
      throw createServiceError(
        `Image ID ${item.id} does not belong to this spare part`,
        422,
      );
    }

    if (receivedIds.has(item.id)) {
      throw createServiceError(`Duplicate image ID ${item.id}`, 422);
    }

    receivedIds.add(item.id);
  }

  if (receivedIds.size !== existingImages.length) {
    throw createServiceError(
      "All spare part images must be included when reordering",
      422,
    );
  }

  const images = await reorderSparePartImages(sparePartId, items);

  return images.map(sanitizeSparePartImage);
}
