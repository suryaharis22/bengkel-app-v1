"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";

export default function ImageUpload({
  value = "",
  onChange,
  disabled = false,
  label = "Image",
  required = false,
}) {
  const inputRef = useRef(null);

  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!value) {
      setPreview("");
      return;
    }

    if (typeof value === "string") {
      setPreview(value);
      return;
    }

    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);

      setPreview(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    if (value?.url) {
      setPreview(value.url);
      return;
    }

    setPreview("");
  }, [value]);

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      onChange?.(null);

      event.target.value = "";

      return;
    }

    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      onChange?.(null);

      event.target.value = "";

      return;
    }

    onChange?.(file);
  }

  function handleRemove() {
    onChange?.("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleSelect() {
    if (disabled) {
      return;
    }

    inputRef.current?.click();
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}

        {required && <span className="ml-1 text-red-600">*</span>}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          <div className="flex min-h-[220px] items-center justify-center p-4">
            <img
              src={preview}
              alt={`${label} preview`}
              className="max-h-52 max-w-full object-contain"
            />
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-700">
                {typeof value === "string"
                  ? "Current image"
                  : value?.name || value?.file?.name || "Selected image"}
              </p>

              <p className="mt-0.5 text-xs text-gray-500">
                JPG, PNG or WEBP · Max 2 MB
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelect}
                disabled={disabled}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload size={15} />
                Change
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                title="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSelect}
          disabled={disabled}
          className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition hover:border-red-300 hover:bg-red-50/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <ImageIcon size={22} />
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Upload size={16} />
            Upload {label}
          </div>

          <p className="mt-2 text-xs text-gray-500">JPG, PNG or WEBP</p>

          <p className="mt-1 text-xs text-gray-500">Maximum file size 2 MB</p>
        </button>
      )}
    </div>
  );
}
