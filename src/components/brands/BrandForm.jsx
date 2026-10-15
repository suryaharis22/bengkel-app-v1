"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import ImageUpload from "@/components/common/ImageUpload";

const initialForm = {
  name: "",
  slug: "",
  description: "",
  logo_url: "",
  status: true,
};

export default function BrandForm({
  open,
  mode = "create",
  brand = null,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialForm);

  const [submitting, setSubmitting] = useState(false);

  const isEdit = mode === "edit";

  const isLoading = loading || submitting;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (isEdit && brand) {
      setForm({
        name: brand.name || "",
        slug: brand.slug || "",
        description: brand.description || "",
        logo_url: brand.logo_url || "",
        status: brand.status ?? true,
      });

      return;
    }

    setForm(initialForm);
  }, [open, isEdit, brand]);

  if (!open) {
    return null;
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleLogoChange(value) {
    setForm((current) => ({
      ...current,
      logo_url: value,
    }));
  }

  async function uploadLogo(file) {
    if (!file) {
      return null;
    }

    if (!(file instanceof File)) {
      return null;
    }

    const formData = new FormData();

    formData.append("folder", "brands");

    formData.append("file", file);

    const response = await api.post("/admin/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data?.data?.image_url || null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Brand name is required.");

      return;
    }

    if (!form.slug.trim()) {
      toast.error("Brand slug is required.");

      return;
    }

    if (!isEdit && !form.logo_url) {
      toast.error("Brand logo is required.");

      return;
    }

    try {
      setSubmitting(true);

      let logoUrl = typeof form.logo_url === "string" ? form.logo_url : "";

      if (form.logo_url instanceof File) {
        logoUrl = await uploadLogo(form.logo_url);
      }

      if (!logoUrl && !isEdit) {
        toast.error("Failed to upload brand logo.");

        return;
      }

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        logo_url: logoUrl || null,
        status: Boolean(form.status),
      };

      if (isEdit) {
        await api.put(`/admin/brands/${brand.id}`, payload);
      } else {
        await api.post("/admin/brands", payload);
      }

      toast.success(
        isEdit ? "Brand updated successfully." : "Brand created successfully.",
      );

      await onSubmit?.(payload);
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);

      toast.error(axiosError.message || "Failed to submit brand.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? "Edit Brand" : "Add Brand"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isEdit
                ? "Update spare part brand information."
                : "Create a new spare part brand."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="space-y-5 p-6">
            <div>
              <label
                htmlFor="brand-name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Name
                <span className="ml-1 text-red-600">*</span>
              </label>

              <input
                id="brand-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Example: Honda"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="brand-slug"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Slug
                <span className="ml-1 text-red-600">*</span>
              </label>

              <input
                id="brand-slug"
                name="slug"
                type="text"
                value={form.slug}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="honda"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="brand-description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="brand-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={isLoading}
                rows={4}
                placeholder="Brand description..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
              />
            </div>

            <ImageUpload
              value={form.logo_url}
              onChange={handleLogoChange}
              disabled={isLoading}
              label="Brand Logo"
              required={!isEdit}
            />

            <p className="text-xs text-gray-500">
              {isEdit
                ? "Leave the current logo unchanged or upload a new logo."
                : "Brand logo is required. Supported formats: JPG, PNG, WEBP. Maximum 2 MB."}
            </p>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                name="status"
                type="checkbox"
                checked={form.status}
                onChange={handleChange}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />

              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}

              {isEdit ? "Update Brand" : "Create Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
