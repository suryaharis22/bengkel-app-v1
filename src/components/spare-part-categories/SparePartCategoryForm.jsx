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
  parent_id: "",
  description: "",
  image_url: "",
  sort_order: 0,
  status: true,
};
export default function SparePartCategoryForm({
  open,
  mode = "create",
  category = null,
  categories = [],
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialForm);
  const isEdit = mode === "edit";
  useEffect(() => {
    if (!open) {
      return;
    }
    if (isEdit && category) {
      setForm({
        name: category.name || "",
        slug: category.slug || "",
        parent_id: category.parent_id ? String(category.parent_id) : "",
        description: category.description || "",
        image_url: category.image_url || "",
        sort_order: category.sort_order ?? 0,
        status: category.status ?? true,
      });
      return;
    }
    setForm(initialForm);
  }, [open, isEdit, category]);
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
  function handleImageChange(value) {
    setForm((current) => ({ ...current, image_url: value }));
  }
  async function uploadImageIfNeeded(imageValue) {
    if (!imageValue) {
      return "";
    }
    if (typeof imageValue === "string") {
      return imageValue;
    }
    if (!imageValue.file) {
      return imageValue.url || "";
    }
    const formData = new FormData();
    formData.append("folder", "categories");
    formData.append("file", imageValue.file);
    const response = await api.post("/admin/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.data?.image_url || "";
  }
  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const imageUrl = await uploadImageIfNeeded(form.image_url);
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        description: form.description.trim(),
        image_url: imageUrl,
        sort_order: Number(form.sort_order) || 0,
        status: Boolean(form.status),
      };
      await onSubmit(payload);
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);
      toast.error(axiosError.message || "Failed to submit category form.");
    }
  }
  const availableParentCategories = categories.filter(
    (item) => !isEdit || item.id !== category?.id,
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {" "}
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {" "}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          {" "}
          <div>
            {" "}
            <h2 className="text-lg font-semibold text-gray-900">
              {" "}
              {isEdit ? "Edit Category" : "Add Category"}{" "}
            </h2>{" "}
            <p className="mt-1 text-sm text-gray-500">
              {" "}
              {isEdit
                ? "Update spare part category information."
                : "Create a new spare part category."}{" "}
            </p>{" "}
          </div>{" "}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {" "}
            <X size={18} />{" "}
          </button>{" "}
        </div>{" "}
        <form onSubmit={handleSubmit} className="overflow-y-auto">
          {" "}
          <div className="space-y-5 p-6">
            {" "}
            <div>
              {" "}
              <label
                htmlFor="category-name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                {" "}
                Name <span className="ml-1 text-red-600"> * </span>{" "}
              </label>{" "}
              <input
                id="category-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Example: Engine Parts"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label
                htmlFor="category-slug"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                {" "}
                Slug <span className="ml-1 text-red-600"> * </span>{" "}
              </label>{" "}
              <input
                id="category-slug"
                name="slug"
                type="text"
                value={form.slug}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="engine-parts"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label
                htmlFor="category-parent-id"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                {" "}
                Parent Category{" "}
              </label>{" "}
              <select
                id="category-parent-id"
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
                disabled={loading}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
              >
                {" "}
                <option value=""> Root Category </option>{" "}
                {availableParentCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {" "}
                    {item.name}{" "}
                  </option>
                ))}{" "}
              </select>{" "}
            </div>{" "}
            <div>
              {" "}
              <label
                htmlFor="category-description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                {" "}
                Description{" "}
              </label>{" "}
              <textarea
                id="category-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={loading}
                rows={4}
                placeholder="Category description..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
              />{" "}
            </div>{" "}
            <ImageUpload
              value={form.image_url}
              onChange={handleImageChange}
              disabled={loading}
              label="Category Image"
            />{" "}
            <div>
              {" "}
              <label
                htmlFor="category-sort-order"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                {" "}
                Sort Order{" "}
              </label>{" "}
              <input
                id="category-sort-order"
                name="sort_order"
                type="number"
                min="0"
                value={form.sort_order}
                onChange={handleChange}
                disabled={loading}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
              />{" "}
            </div>{" "}
            <label className="flex cursor-pointer items-center gap-3">
              {" "}
              <input
                name="status"
                type="checkbox"
                checked={form.status}
                onChange={handleChange}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />{" "}
              <span className="text-sm font-medium text-gray-700">
                {" "}
                Active{" "}
              </span>{" "}
            </label>{" "}
          </div>{" "}
          <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            {" "}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {" "}
              Cancel{" "}
            </button>{" "}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {" "}
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}{" "}
              {isEdit ? "Update Category" : "Create Category"}{" "}
            </button>{" "}
          </div>{" "}
        </form>{" "}
      </div>{" "}
    </div>
  );
}
