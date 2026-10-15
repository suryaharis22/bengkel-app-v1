import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";

import {
  ALLOWED_IMAGE_TYPES,
  getPublicImageUrl,
  getUploadConfig,
  getUploadDirectory,
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

  const uploadDirectory = getUploadDirectory(folder);

  await mkdir(uploadDirectory, {
    recursive: true,
  });

  const extension = ALLOWED_IMAGE_TYPES[file.type];

  const randomName = crypto.randomBytes(16).toString("hex");

  const fileName = `${Date.now()}-${randomName}${extension}`;

  const filePath = `${uploadDirectory}/${fileName}`;

  const bytes = await file.arrayBuffer();

  const buffer = Buffer.from(bytes);

  await writeFile(filePath, buffer);

  const imageUrl = getPublicImageUrl(folder, fileName);

  return {
    image_url: imageUrl,
    file_name: fileName,
    file_size: file.size,
    mime_type: file.type,
    folder,
  };
}
