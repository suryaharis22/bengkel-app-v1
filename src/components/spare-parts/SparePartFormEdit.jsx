"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Boxes, Image as ImageIcon, Loader2, Save, X } from "lucide-react";

import SparePartImageManager from "@/components/spare-parts/SparePartImageManager";
import SearchableSelect from "@/components/spare-parts/SearchableSelect";

const initialForm = {
  name: "",
  slug: "",
  sku: "",
  part_number: "",
  category_id: "",
  brand_id: "",
  short_description: "",
  description: "",
  price: "",
  compare_price: "",
  cost_price: "",
  weight: "",
  status: "draft",
  is_featured: false,
};

export default function SparePartFormEdit({
  open,
  sparePart = null,
  categories = [],
  brands = [],
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [imageManagerOpen, setImageManagerOpen] = useState(false);

  const isEdit = true;

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrors({});
    setImageManagerOpen(false);

    if (isEdit && sparePart) {
      setForm({
        name: sparePart.name || "",
        slug: sparePart.slug || "",
        sku: sparePart.sku || "",
        part_number: sparePart.part_number || "",
        category_id: sparePart.category_id ? String(sparePart.category_id) : "",
        brand_id: sparePart.brand_id ? String(sparePart.brand_id) : "",
        short_description: sparePart.short_description || "",
        description: sparePart.description || "",
        price:
          sparePart.price !== null && sparePart.price !== undefined
            ? String(sparePart.price)
            : "",
        compare_price:
          sparePart.compare_price !== null &&
          sparePart.compare_price !== undefined
            ? String(sparePart.compare_price)
            : "",
        cost_price:
          sparePart.cost_price !== null && sparePart.cost_price !== undefined
            ? String(sparePart.cost_price)
            : "",
        weight:
          sparePart.weight !== null && sparePart.weight !== undefined
            ? String(sparePart.weight)
            : "",
        status: sparePart.status || "draft",
        is_featured: Boolean(sparePart.is_featured),
      });

      return;
    }

    setForm(initialForm);
  }, [open, isEdit, sparePart]);

  if (!open) {
    return null;
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((current) => {
        const next = {
          ...current,
        };

        delete next[name];

        return next;
      });
    }
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Spare part name is required.";
    }

    if (!form.slug.trim()) {
      nextErrors.slug = "Spare part slug is required.";
    }

    if (!form.sku.trim()) {
      nextErrors.sku = "SKU is required.";
    }

    if (!form.part_number.trim()) {
      nextErrors.part_number = "Part number is required.";
    }

    if (!form.category_id) {
      nextErrors.category_id = "Category is required.";
    }

    if (!form.brand_id) {
      nextErrors.brand_id = "Brand is required.";
    }

    if (form.price === "" || Number.isNaN(Number(form.price))) {
      nextErrors.price = "Price is required.";
    } else if (Number(form.price) < 0) {
      nextErrors.price = "Price must not be negative.";
    }

    if (form.compare_price !== "") {
      if (Number.isNaN(Number(form.compare_price))) {
        nextErrors.compare_price = "Compare price must be a valid number.";
      } else if (Number(form.compare_price) < 0) {
        nextErrors.compare_price = "Compare price must not be negative.";
      }
    }

    if (form.cost_price !== "") {
      if (Number.isNaN(Number(form.cost_price))) {
        nextErrors.cost_price = "Cost price must be a valid number.";
      } else if (Number(form.cost_price) < 0) {
        nextErrors.cost_price = "Cost price must not be negative.";
      }
    }

    if (form.weight !== "") {
      const weight = Number(form.weight);

      if (Number.isNaN(weight)) {
        nextErrors.weight = "Weight must be a valid number.";
      } else if (!Number.isInteger(weight)) {
        nextErrors.weight = "Weight must be an integer.";
      } else if (weight < 0) {
        nextErrors.weight = "Weight must not be negative.";
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function getPayload() {
    return {
      name: form.name.trim(),
      slug: form.slug.trim(),
      sku: form.sku.trim(),
      part_number: form.part_number.trim(),
      category_id: Number(form.category_id),
      brand_id: Number(form.brand_id),
      short_description: form.short_description.trim() || null,
      description: form.description.trim() || null,
      price: Number(form.price),
      compare_price:
        form.compare_price === "" ? null : Number(form.compare_price),
      cost_price: form.cost_price === "" ? null : Number(form.cost_price),
      weight: form.weight === "" ? null : Number(form.weight),
      status: form.status,
      is_featured: Boolean(form.is_featured),
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = getPayload();

    await onSubmit?.(payload);
  }

  function handleOpenImageManager() {
    if (!isEdit || !sparePart?.id) {
      return;
    }

    setImageManagerOpen(true);
  }

  function handleCloseImageManager() {
    setImageManagerOpen(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isEdit ? "Edit Spare Part" : "Add Spare Part"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {isEdit
                  ? "Update spare part information."
                  : "Create a new spare part."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto">
            <div className="space-y-6 p-6">
              {/* Basic Information */}
              <section>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Basic Information
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    General information about the spare part.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="spare-part-name"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Name
                      <span className="ml-1 text-red-600">*</span>
                    </label>

                    <input
                      id="spare-part-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Example: Kampas Rem Depan"
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:bg-gray-100 ${
                        errors.name
                          ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                          : "border-gray-300 focus:border-red-600 focus:ring-red-100"
                      }`}
                    />

                    {errors.name && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="spare-part-sku"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      SKU
                      <span className="ml-1 text-red-600">*</span>
                    </label>

                    <input
                      id="spare-part-sku"
                      name="sku"
                      type="text"
                      value={form.sku}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Example: HON-BRK-001"
                      className={`h-10 w-full rounded-lg border bg-white px-3 font-mono text-sm text-gray-900 outline-none transition placeholder:font-sans placeholder:text-gray-400 focus:ring-2 disabled:bg-gray-100 ${
                        errors.sku
                          ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                          : "border-gray-300 focus:border-red-600 focus:ring-red-100"
                      }`}
                    />

                    {errors.sku && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.sku}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="spare-part-slug"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Slug
                      <span className="ml-1 text-red-600">*</span>
                    </label>

                    <input
                      id="spare-part-slug"
                      name="slug"
                      type="text"
                      value={form.slug}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="kampas-rem-depan"
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:bg-gray-100 ${
                        errors.slug
                          ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                          : "border-gray-300 focus:border-red-600 focus:ring-red-100"
                      }`}
                    />

                    {errors.slug && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.slug}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="spare-part-part-number"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Part Number
                      <span className="ml-1 text-red-600">*</span>
                    </label>

                    <input
                      id="spare-part-part-number"
                      name="part_number"
                      type="text"
                      value={form.part_number}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Example: AHM-SPX1-001"
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:bg-gray-100 ${
                        errors.part_number
                          ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                          : "border-gray-300 focus:border-red-600 focus:ring-red-100"
                      }`}
                    />

                    {errors.part_number && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.part_number}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="spare-part-category"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Category
                      <span className="ml-1 text-red-600">*</span>
                    </label>

                    <SearchableSelect
                      id="spare-part-category"
                      value={form.category_id}
                      onChange={(value) =>
                        handleChange({
                          target: { name: "category_id", value, type: "text" },
                        })
                      }
                      endpoint="/api/admin/spare-part-categories"
                      placeholder="Search category..."
                      disabled={loading}
                      error={Boolean(errors.category_id)}
                      initialOptions={categories}
                      selectedLabel={
                        sparePart?.category?.name ||
                        sparePart?.category_name ||
                        categories.find(
                          (item) =>
                            String(item.id) === String(form.category_id),
                        )?.name ||
                        ""
                      }
                    />

                    {errors.category_id && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.category_id}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="spare-part-brand"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Brand
                      <span className="ml-1 text-red-600">*</span>
                    </label>

                    <SearchableSelect
                      id="spare-part-brand"
                      value={form.brand_id}
                      onChange={(value) =>
                        handleChange({
                          target: { name: "brand_id", value, type: "text" },
                        })
                      }
                      endpoint="/api/admin/brands"
                      placeholder="Search brand..."
                      disabled={loading}
                      error={Boolean(errors.brand_id)}
                      initialOptions={brands}
                      selectedLabel={
                        sparePart?.brand?.name ||
                        sparePart?.brand_name ||
                        brands.find(
                          (item) => String(item.id) === String(form.brand_id),
                        )?.name ||
                        ""
                      }
                    />

                    {errors.brand_id && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.brand_id}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Description */}
              <section>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Description
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Add descriptions to help identify the spare part.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="spare-part-short-description"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Short Description
                    </label>

                    <input
                      id="spare-part-short-description"
                      name="short_description"
                      type="text"
                      maxLength={255}
                      value={form.short_description}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Short description of the spare part..."
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="spare-part-description"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="spare-part-description"
                      name="description"
                      rows={5}
                      value={form.description}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Detailed spare part description..."
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </section>

              {/* Pricing */}
              <section>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Pricing
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Set the selling and reference prices.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label
                      htmlFor="spare-part-price"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Price
                      <span className="ml-1 text-red-600">*</span>
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        Rp
                      </span>

                      <input
                        id="spare-part-price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="0"
                        className={`h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:bg-gray-100 ${
                          errors.price
                            ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                            : "border-gray-300 focus:border-red-600 focus:ring-red-100"
                        }`}
                      />
                    </div>

                    {errors.price && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.price}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="spare-part-compare-price"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Compare Price
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        Rp
                      </span>

                      <input
                        id="spare-part-compare-price"
                        name="compare_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.compare_price}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="0"
                        className={`h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:bg-gray-100 ${
                          errors.compare_price
                            ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                            : "border-gray-300 focus:border-red-600 focus:ring-red-100"
                        }`}
                      />
                    </div>

                    {errors.compare_price && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.compare_price}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="spare-part-cost-price"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Cost Price
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        Rp
                      </span>

                      <input
                        id="spare-part-cost-price"
                        name="cost_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.cost_price}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="0"
                        className={`h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:bg-gray-100 ${
                          errors.cost_price
                            ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                            : "border-gray-300 focus:border-red-600 focus:ring-red-100"
                        }`}
                      />
                    </div>

                    {errors.cost_price && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.cost_price}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Additional Information */}
              <section>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Additional Information
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Configure status and other spare part settings.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="spare-part-weight"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Weight
                    </label>

                    <div className="relative">
                      <input
                        id="spare-part-weight"
                        name="weight"
                        type="number"
                        min="0"
                        step="1"
                        value={form.weight}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="0"
                        className={`h-10 w-full rounded-lg border bg-white px-3 pr-14 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:bg-gray-100 ${
                          errors.weight
                            ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                            : "border-gray-300 focus:border-red-600 focus:ring-red-100"
                        }`}
                      />

                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        gram
                      </span>
                    </div>

                    {errors.weight && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.weight}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="spare-part-status"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Status
                    </label>

                    <select
                      id="spare-part-status"
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      disabled={loading}
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                    >
                      <option value="draft">Draft</option>

                      <option value="active">Active</option>

                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <input
                    name="is_featured"
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Featured Spare Part
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Mark this spare part as featured.
                    </p>
                  </div>
                </label>
              </section>

              {/* Images */}
              <section>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Images
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Manage images separately from spare part information.
                  </p>
                </div>

                {isEdit && sparePart?.id ? (
                  <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                        <ImageIcon size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Spare Part Images
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Upload, reorder, set primary, or delete images.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenImageManager}
                      disabled={loading}
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ImageIcon size={16} />
                      Manage Images
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                      <ImageIcon size={19} />
                    </div>

                    <p className="mt-3 text-sm font-medium text-gray-700">
                      Create the spare part first
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      After the spare part has been created, you can manage its
                      images here.
                    </p>
                  </div>
                )}
              </section>

              {/* Variants */}
              <section>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Variants
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Manage different variants, SKUs, pricing, and status.
                  </p>
                </div>

                {isEdit && sparePart?.id ? (
                  <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                        <Boxes size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Spare Part Variants
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Add, edit, or delete variants for this spare part.
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/admin/spare-parts/${sparePart.id}/variants`}
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                      <Boxes size={16} />
                      Manage Variants
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                      <Boxes size={19} />
                    </div>

                    <p className="mt-3 text-sm font-medium text-gray-700">
                      Create the spare part first
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      After the spare part has been created, you can manage its
                      variants here.
                    </p>
                  </div>
                )}
              </section>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />

                    {isEdit ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save size={16} />

                    {isEdit ? "Update Spare Part" : "Create Spare Part"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SparePartImageManager
        open={imageManagerOpen}
        sparePart={sparePart}
        onClose={handleCloseImageManager}
      />
    </>
  );
}
