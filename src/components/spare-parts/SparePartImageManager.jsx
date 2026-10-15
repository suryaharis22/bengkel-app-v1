"use client";

import { useCallback, useEffect, useState } from "react";
import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import SparePartImageList from "@/components/spare-parts/SparePartImageList";
import SparePartImageSkeleton from "@/components/spare-parts/SparePartImageSkeleton";
import SparePartImageUpload from "@/components/spare-parts/SparePartImageUpload";

export default function SparePartImageManager({
  open,
  sparePart = null,
  onClose,
}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchImages = useCallback(async () => {
    if (!sparePart?.id) {
      setImages([]);
      return;
    }

    try {
      setLoading(true);

      const response = await api.get(
        `/admin/spare-parts/${sparePart.id}/images`,
      );

      const data = response.data?.data;

      setImages(Array.isArray(data?.images) ? data.images : []);
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);

      toast.error(axiosError.message || "Failed to load spare part images.");

      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [sparePart?.id]);

  useEffect(() => {
    if (!open || !sparePart?.id) {
      return;
    }

    fetchImages();
  }, [open, sparePart?.id, fetchImages]);

  async function handleRefreshImages() {
    if (!sparePart?.id) {
      return;
    }

    try {
      setRefreshing(true);

      await fetchImages();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleImageUploaded() {
    await handleRefreshImages();
  }

  if (!open || !sparePart) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <ImageIcon size={19} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-gray-900">
                Manage Images
              </h2>

              <p className="mt-1 truncate text-sm text-gray-500">
                {sparePart.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading || refreshing}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Spare Part
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-gray-900">
                    {sparePart.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    SKU
                  </p>

                  <p className="mt-1 font-mono text-sm text-gray-700">
                    {sparePart.sku}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Total Images
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {images.length}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Upload Images
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Select multiple JPG, PNG or WEBP images. The first image
                  becomes primary automatically when no primary image exists.
                </p>
              </div>

              <SparePartImageUpload
                sparePartId={sparePart.id}
                disabled={loading || refreshing}
                onUploaded={handleImageUploaded}
              />
            </div>

            <div>
              {loading ? (
                <SparePartImageSkeleton />
              ) : (
                <SparePartImageList
                  sparePartId={sparePart.id}
                  images={images}
                  loading={loading}
                  disabled={refreshing}
                  onChanged={handleRefreshImages}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
          <p className="text-xs text-gray-500">
            {refreshing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                Refreshing images...
              </span>
            ) : (
              "Drag and drop images to change their order."
            )}
          </p>

          <button
            type="button"
            onClick={onClose}
            disabled={loading || refreshing}
            className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
