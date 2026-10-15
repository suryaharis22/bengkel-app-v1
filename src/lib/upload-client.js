import api from "@/lib/axios";

export async function uploadImage(file, folder) {
  if (!(file instanceof File)) {
    throw new Error("Invalid image file.");
  }

  const formData = new FormData();

  formData.append("folder", folder);

  formData.append("file", file);

  const response = await api.post("/admin/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const imageUrl = response.data?.data?.image_url;

  if (!imageUrl) {
    throw new Error("Image URL was not returned by the server.");
  }

  return response.data.data;
}

export async function uploadImages(files, folder) {
  if (!Array.isArray(files)) {
    throw new Error("Files must be an array.");
  }

  if (files.length === 0) {
    return [];
  }

  const uploadedImages = [];

  for (const file of files) {
    const data = await uploadImage(file, folder);

    uploadedImages.push(data);
  }

  return uploadedImages;
}
