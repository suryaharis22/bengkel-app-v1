"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const MAX_FILES = 10;

export default function SparePartImageUpload({
  sparePartId,
  disabled = false,
  onUploaded,
}) {
  const inputRef = useRef(null);

  const [uploading, setUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });

  const isDisabled = disabled || uploading || !sparePartId;

  function handleSelectFiles() {
    if (isDisabled) {
      return;
    }

    inputRef.current?.click();
  }

  async function uploadSingleImage(file) {
    const uploadFormData = new FormData();

    uploadFormData.append("folder", "spare-parts");

    uploadFormData.append("file", file);

    const uploadResponse = await api.post("/admin/uploads", uploadFormData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const imageUrl = uploadResponse.data?.data?.image_url;

    if (!imageUrl) {
      throw new Error("Image upload failed. Image URL was not returned.");
    }

    const imageResponse = await api.post(
      `/admin/spare-parts/${sparePartId}/images`,
      {
        image_url: imageUrl,
        is_primary: false,
      },
    );

    return imageResponse.data?.data || null;
  }

  async function handleFileChange(event) {
    const files = Array.from(event.target.files || []);

    event.target.value = "";

    if (!files.length) {
      return;
    }

    if (files.length > MAX_FILES) {
      toast.error(`You can upload a maximum of ${MAX_FILES} images at once.`);
      return;
    }

    const invalidFiles = files.filter(
      (file) =>
        !ALLOWED_TYPES.includes(file.type) ||
        file.size <= 0 ||
        file.size > MAX_FILE_SIZE,
    );

    if (invalidFiles.length > 0) {
      const invalidType = invalidFiles.find(
        (file) => !ALLOWED_TYPES.includes(file.type),
      );

      if (invalidType) {
        toast.error("Only JPG, PNG and WEBP images are allowed.");
        return;
      }

      const emptyFile = invalidFiles.find((file) => file.size <= 0);

      if (emptyFile) {
        toast.error("Image file cannot be empty.");
        return;
      }

      toast.error("Each image must not exceed 2 MB.");
      return;
    }

    try {
      setUploading(true);

      setUploadProgress({
        current: 0,
        total: files.length,
      });

      let successCount = 0;

      for (let index = 0; index < files.length; index += 1) {
        try {
          await uploadSingleImage(files[index]);

          successCount += 1;

          setUploadProgress({
            current: index + 1,
            total: files.length,
          });
        } catch (requestError) {
          const axiosError = getAxiosError(requestError);

          toast.error(
            `Failed to upload "${files[index].name}": ${
              axiosError.message || "Upload failed."
            }`,
          );
        }
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} image${
            successCount > 1 ? "s" : ""
          } uploaded successfully.`,
        );

        await onUploaded?.();
      }
    } finally {
      setUploading(false);

      setUploadProgress({
        current: 0,
        total: 0,
      });
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileChange}
        disabled={isDisabled}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleSelectFiles}
        disabled={isDisabled}
        className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white px-6 py-8 text-center transition hover:border-red-300 hover:bg-red-50/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          {uploading ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <ImageIcon size={22} />
          )}
        </div>

        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {uploading ? (
            <>
              Uploading {uploadProgress.current}/{uploadProgress.total}
              ...
            </>
          ) : (
            <>
              <Upload size={16} />
              Select Images
            </>
          )}
        </div>

        {uploading ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle2 size={14} className="text-green-500" />
            Please wait while images are uploaded.
          </div>
        ) : (
          <>
            <p className="mt-2 text-xs text-gray-500">Select multiple images</p>

            <p className="mt-1 text-xs text-gray-500">JPG, PNG or WEBP</p>

            <p className="mt-1 text-xs text-gray-500">
              Maximum 2 MB per image · Maximum {MAX_FILES} images
            </p>
          </>
        )}
      </button>

      {uploading && uploadProgress.total > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>Upload progress</span>

            <span>
              {uploadProgress.current} / {uploadProgress.total}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-red-600 transition-all duration-300"
              style={{
                width: `${
                  (uploadProgress.current / uploadProgress.total) * 100
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
