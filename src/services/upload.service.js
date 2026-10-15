import crypto from "crypto";
import { put } from "@vercel/blob";

import {
  ALLOWED_IMAGE_TYPES,
  getUploadConfig,
  validateImageFile,
} from "@/lib/upload";

export async function uploadImage({ file, folder }) {
  const config = getUploadConfig(folder);

  if (!config) {
    const error = new Error("Invalid upload folder.");
    error.statusCode = 422;
    throw error;
  }

  const validation = validateImageFile(file);

  if (!validation.valid) {
    const error = new Error(validation.message);
    error.statusCode = 422;
    throw error;
  }

  const extension = ALLOWED_IMAGE_TYPES[file.type];
  const randomName = crypto.randomBytes(16).toString("hex");
  const fileName = `${Date.now()}-${randomName}${extension}`;
  const blobPath = `${config.directory}/${fileName}`;

  let blob;

  try {
    blob = await put(blobPath, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
  } catch (cause) {
    // Catat detail error di server, jangan pernah mencatat token.
    console.error("Vercel Blob upload failed:", {
      name: cause instanceof Error ? cause.name : "UnknownError",
      message: cause instanceof Error ? cause.message : String(cause),
      status: cause?.status,
      code: cause?.code,
      folder,
      fileSize: file.size,
      mimeType: file.type,
    });

    const error = new Error("Failed to upload image to storage.");
    error.statusCode = 500;
    throw error;
  }

  return {
    image_url: blob.url,
    file_name: fileName,
    file_size: file.size,
    mime_type: file.type,
    folder,
  };
}
