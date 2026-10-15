export const UPLOAD_CONFIG = {
  categories: {
    directory: "categories",
    maxFiles: 1,
  },

  brands: {
    directory: "brands",
    maxFiles: 1,
  },

  "spare-parts": {
    directory: "spare-parts",
    maxFiles: 10,
  },
};

export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export function getUploadConfig(folder) {
  return UPLOAD_CONFIG[folder] || null;
}

export function validateImageFile(file) {
  if (!file) {
    return {
      valid: false,
      message: "Image file is required.",
    };
  }

  if (typeof File === "undefined" || !(file instanceof File)) {
    return {
      valid: false,
      message: "Invalid image file.",
    };
  }

  if (!ALLOWED_IMAGE_TYPES[file.type]) {
    return {
      valid: false,
      message: "Only JPG, PNG, and WEBP images are allowed.",
    };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      message: "Image file cannot be empty.",
    };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      message: "Image size must not exceed 2 MB.",
    };
  }

  return {
    valid: true,
    message: null,
  };
}
