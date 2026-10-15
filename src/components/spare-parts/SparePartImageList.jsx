"use client";
import { useState } from "react";
import { Check, GripVertical, Loader2, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";
export default function SparePartImageList({
  sparePartId = null,
  images = [],
  loading = false,
  disabled = false,
  onChanged,
}) {
  const [draggedId, setDraggedId] = useState(null);
  const [deleteImage, setDeleteImage] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [primaryId, setPrimaryId] = useState(null);
  const [reordering, setReordering] = useState(false);
  function handleDragStart(event, imageId) {
    if (disabled || reordering) {
      return;
    }
    setDraggedId(imageId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(imageId));
  }
  function handleDragEnd() {
    setDraggedId(null);
  }
  function handleDragOver(event) {
    event.preventDefault();
    if (!disabled && !reordering) {
      event.dataTransfer.dropEffect = "move";
    }
  }
  async function handleDrop(event, targetId) {
    event.preventDefault();
    if (
      disabled ||
      reordering ||
      draggedId === null ||
      draggedId === targetId
    ) {
      setDraggedId(null);
      return;
    }
    if (!sparePartId) {
      setDraggedId(null);
      toast.error("Invalid spare part ID.");
      return;
    }
    const sourceIndex = images.findIndex((image) => image.id === draggedId);
    const targetIndex = images.findIndex((image) => image.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }
    const nextImages = [...images];
    const [movedImage] = nextImages.splice(sourceIndex, 1);
    nextImages.splice(targetIndex, 0, movedImage);
    setDraggedId(null);
    const hasChanged = nextImages.some(
      (image, index) => image.id !== images[index]?.id,
    );
    if (!hasChanged) {
      return;
    }
    const items = nextImages.map((image, index) => ({
      id: image.id,
      sort_order: index,
    }));
    try {
      setReordering(true);
      await api.patch("/admin/spare-part-images/reorder", {
        spare_part_id: Number(sparePartId),
        items,
      });
      toast.success("Image order updated successfully.");
      await onChanged?.();
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);
      toast.error(axiosError.message || "Failed to reorder images.");
    } finally {
      setReordering(false);
    }
  }
  async function handleSetPrimary(image) {
    if (disabled || primaryId !== null || image.is_primary) {
      return;
    }
    try {
      setPrimaryId(image.id);
      await api.patch(`/admin/spare-part-images/${image.id}/primary`);
      toast.success("Primary image updated successfully.");
      await onChanged?.();
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);
      toast.error(axiosError.message || "Failed to set primary image.");
    } finally {
      setPrimaryId(null);
    }
  }
  function handleDeleteClick(image) {
    if (disabled || deleting || reordering) {
      return;
    }
    setDeleteImage(image);
  }
  function handleCloseDeleteModal() {
    if (deleting) {
      return;
    }
    setDeleteImage(null);
  }
  async function handleConfirmDelete() {
    if (!deleteImage) {
      return;
    }
    try {
      setDeleting(true);
      await api.delete(`/admin/spare-part-images/${deleteImage.id}`);
      toast.success("Image deleted successfully.");
      setDeleteImage(null);
      await onChanged?.();
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);
      toast.error(axiosError.message || "Failed to delete image.");
    } finally {
      setDeleting(false);
    }
  }
  if (loading) {
    return null;
  }
  if (!images.length) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center">
        {" "}
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          {" "}
          <Star size={21} />{" "}
        </div>{" "}
        <h3 className="text-sm font-semibold text-gray-900">No images</h3>{" "}
        <p className="mt-1 text-sm text-gray-500">
          {" "}
          Upload an image to get started.{" "}
        </p>{" "}
      </div>
    );
  }
  return (
    <>
      {" "}
      <div className="mb-3 flex items-center justify-between">
        {" "}
        <div>
          {" "}
          <h3 className="text-sm font-semibold text-gray-900">Images</h3>{" "}
          <p className="mt-1 text-xs text-gray-500">
            {" "}
            Drag and drop images to reorder them.{" "}
          </p>{" "}
        </div>{" "}
        {reordering && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {" "}
            <Loader2 size={14} className="animate-spin" /> Saving order...{" "}
          </div>
        )}{" "}
      </div>{" "}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {" "}
        {images.map((image, index) => {
          const isDragging = draggedId === image.id;
          const isPrimaryLoading = primaryId === image.id;
          return (
            <div
              key={image.id}
              draggable={!disabled && !reordering}
              onDragStart={(event) => handleDragStart(event, image.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(event) => handleDrop(event, image.id)}
              className={[
                "overflow-hidden rounded-xl border bg-white transition",
                isDragging
                  ? "border-red-400 opacity-50 shadow-lg"
                  : "border-gray-200",
              ].join(" ")}
            >
              {" "}
              <div className="relative aspect-square bg-gray-100">
                {" "}
                <img
                  src={image.image_url}
                  alt={`Spare part image ${index + 1}`}
                  className="h-full w-full object-contain"
                />{" "}
                <div className="absolute left-2 top-2">
                  {" "}
                  <div className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg bg-white/90 text-gray-500 shadow-sm backdrop-blur active:cursor-grabbing">
                    {" "}
                    <GripVertical size={16} />{" "}
                  </div>{" "}
                </div>{" "}
                {image.is_primary && (
                  <div className="absolute right-2 top-2">
                    {" "}
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                      {" "}
                      <Star size={12} fill="currentColor" /> Primary{" "}
                    </span>{" "}
                  </div>
                )}{" "}
              </div>{" "}
              <div className="border-t border-gray-100 p-3">
                {" "}
                <div className="mb-3 flex items-center justify-between gap-2">
                  {" "}
                  <span className="text-xs text-gray-500">
                    {" "}
                    Position {index + 1}{" "}
                  </span>{" "}
                  <span className="text-xs text-gray-400">
                    {" "}
                    ID: {image.id}{" "}
                  </span>{" "}
                </div>{" "}
                <div className="flex gap-2">
                  {" "}
                  {!image.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(image)}
                      disabled={disabled || primaryId !== null || reordering}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {" "}
                      {isPrimaryLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Star size={14} />
                      )}{" "}
                      Primary{" "}
                    </button>
                  )}{" "}
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(image)}
                    disabled={disabled || deleting || reordering}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {" "}
                    <Trash2 size={14} /> Delete{" "}
                  </button>{" "}
                </div>{" "}
                {image.is_primary && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-red-600">
                    {" "}
                    <Check size={13} /> Primary image{" "}
                  </div>
                )}{" "}
              </div>{" "}
            </div>
          );
        })}{" "}
      </div>{" "}
      {deleteImage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          {" "}
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {" "}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              {" "}
              <div>
                {" "}
                <h2 className="text-lg font-semibold text-gray-900">
                  {" "}
                  Delete Image{" "}
                </h2>{" "}
                <p className="mt-1 text-sm text-gray-500">
                  {" "}
                  This action cannot be undone.{" "}
                </p>{" "}
              </div>{" "}
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {" "}
                <X size={18} />{" "}
              </button>{" "}
            </div>{" "}
            <div className="px-6 py-5">
              {" "}
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                {" "}
                <p className="text-sm text-red-700">
                  {" "}
                  Are you sure you want to delete this image?{" "}
                </p>{" "}
                {deleteImage.is_primary && (
                  <p className="mt-2 text-xs text-red-600">
                    {" "}
                    This is currently the primary image. Another image may
                    become primary after deletion.{" "}
                  </p>
                )}{" "}
              </div>{" "}
              <div className="mt-4 flex justify-center">
                {" "}
                <div className="h-32 w-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {" "}
                  <img
                    src={deleteImage.image_url}
                    alt="Image to delete"
                    className="h-full w-full object-contain"
                  />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              {" "}
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {" "}
                Cancel{" "}
              </button>{" "}
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {" "}
                {deleting ? (
                  <>
                    {" "}
                    <Loader2 size={16} className="animate-spin" />{" "}
                    Deleting...{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    <Trash2 size={16} /> Delete Image{" "}
                  </>
                )}{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </>
  );
}
