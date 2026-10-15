import { ROLES } from "@/constants/roles";
import { requireRole } from "@/middleware/role.middleware";
import { errorResponse, successResponse } from "@/lib/response";
import { getUploadConfig } from "@/lib/upload";
import { uploadImage } from "@/services/upload.service";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const auth = await requireRole([ROLES.ADMIN]);

    if (!auth.authorized) {
      return errorResponse({
        code: auth.statusCode,
        message: auth.message,
      });
    }

    const formData = await request.formData();

    const folder = formData.get("folder");
    const file = formData.get("file");

    if (typeof folder !== "string" || !folder) {
      return errorResponse({
        code: 422,
        message: "Upload folder is required.",
      });
    }

    const config = getUploadConfig(folder);

    if (!config) {
      return errorResponse({
        code: 422,
        message: "Invalid upload folder.",
      });
    }

    if (!file) {
      return errorResponse({
        code: 422,
        message: "Image file is required.",
      });
    }

    const data = await uploadImage({
      file,
      folder,
    });

    return successResponse({
      code: 201,
      message: "Image uploaded successfully.",
      data,
    });
  } catch (error) {
    console.error("Upload image error:", error);

    return errorResponse({
      code: error.statusCode || 500,
      message: error.statusCode ? error.message : "Failed to upload image.",
    });
  }
}
