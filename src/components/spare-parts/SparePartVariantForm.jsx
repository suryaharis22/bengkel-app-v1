"use client";
import { useEffect, useState } from "react";
import { Boxes, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";
const INITIAL_FORM = {
  name: "",
  sku: "",
  price: "",
  compare_price: "",
  cost_price: "",
  weight: "",
  status: true,
};
function getInitialForm(variant) {
  if (!variant) {
    return INITIAL_FORM;
  }
  return {
    name: variant.name || "",
    sku: variant.sku || "",
    price:
      variant.price !== null && variant.price !== undefined
        ? String(variant.price)
        : "",
    compare_price:
      variant.compare_price !== null && variant.compare_price !== undefined
        ? String(variant.compare_price)
        : "",
    cost_price:
      variant.cost_price !== null && variant.cost_price !== undefined
        ? String(variant.cost_price)
        : "",
    weight:
      variant.weight !== null && variant.weight !== undefined
        ? String(variant.weight)
        : "",
    status: variant.status !== undefined ? Boolean(variant.status) : true,
  };
}
function validateForm(form) {
  const errors = {};
  if (!form.name.trim()) {
    errors.name = "Variant name is required.";
  } else if (form.name.trim().length > 100) {
    errors.name = "Variant name must not exceed 100 characters.";
  }
  if (!form.sku.trim()) {
    errors.sku = "SKU is required.";
  } else if (form.sku.trim().length > 50) {
    errors.sku = "SKU must not exceed 50 characters.";
  }
  if (form.price === "" || form.price === null || form.price === undefined) {
    errors.price = "Price is required.";
  } else if (Number.isNaN(Number(form.price))) {
    errors.price = "Price must be a valid number.";
  } else if (Number(form.price) < 0) {
    errors.price = "Price must not be negative.";
  }
  if (form.compare_price !== "") {
    if (Number.isNaN(Number(form.compare_price))) {
      errors.compare_price = "Compare price must be a valid number.";
    } else if (Number(form.compare_price) < 0) {
      errors.compare_price = "Compare price must not be negative.";
    }
  }
  if (form.cost_price !== "") {
    if (Number.isNaN(Number(form.cost_price))) {
      errors.cost_price = "Cost price must be a valid number.";
    } else if (Number(form.cost_price) < 0) {
      errors.cost_price = "Cost price must not be negative.";
    }
  }
  if (form.weight !== "") {
    if (Number.isNaN(Number(form.weight))) {
      errors.weight = "Weight must be a valid number.";
    } else if (!Number.isInteger(Number(form.weight))) {
      errors.weight = "Weight must be an integer.";
    } else if (Number(form.weight) < 0) {
      errors.weight = "Weight must not be negative.";
    }
  }
  return errors;
}
function parseNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return Number(value);
}
export default function SparePartVariantForm({
  open,
  sparePartId,
  variant = null,
  onClose,
  onSaved,
}) {
  const isEditMode = Boolean(variant?.id);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(getInitialForm(variant));
    setErrors({});
  }, [open, variant]);
  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }
      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
  }
  function handleClose() {
    if (saving) {
      return;
    }
    setErrors({});
    onClose?.();
  }
  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) {
      return;
    }
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please correct the highlighted fields.");
      return;
    }
    if (!sparePartId) {
      toast.error("Spare part ID is required.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      compare_price: parseNumber(form.compare_price),
      cost_price: parseNumber(form.cost_price),
      weight: form.weight === "" ? null : Number(form.weight),
      status: Boolean(form.status),
    };
    try {
      setSaving(true);
      if (isEditMode) {
        await api.put(`/admin/spare-part-variants/${variant.id}`, payload);
        toast.success("Variant updated successfully.");
      } else {
        await api.post(`/admin/spare-parts/${sparePartId}/variants`, payload);
        toast.success("Variant created successfully.");
      }
      await onSaved?.();
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);
      if (axiosError.errors) {
        setErrors(axiosError.errors);
      }
      toast.error(
        axiosError.message ||
          (isEditMode
            ? "Failed to update variant."
            : "Failed to create variant."),
      );
    } finally {
      setSaving(false);
    }
  }
  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      {" "}
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {" "}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          {" "}
          <div className="flex min-w-0 items-center gap-3">
            {" "}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
              {" "}
              <Boxes size={19} />{" "}
            </div>{" "}
            <div className="min-w-0">
              {" "}
              <h2 className="truncate text-lg font-semibold text-gray-900">
                {" "}
                {isEditMode ? "Edit Variant" : "Add Variant"}{" "}
              </h2>{" "}
              <p className="mt-1 truncate text-sm text-gray-500">
                {" "}
                {isEditMode
                  ? "Update variant information."
                  : "Add a new variant to this spare part."}{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            {" "}
            <X size={18} />{" "}
          </button>{" "}
        </div>{" "}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {" "}
          <div className="flex-1 overflow-y-auto">
            {" "}
            <div className="space-y-5 p-6">
              {" "}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                {" "}
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {" "}
                  Spare Part{" "}
                </p>{" "}
                <p className="mt-1 truncate text-sm font-medium text-gray-900">
                  {" "}
                  {sparePartId ? `Spare Part #${sparePartId}` : "-"}{" "}
                </p>{" "}
              </div>{" "}
              <div>
                {" "}
                <label
                  htmlFor="variant-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  {" "}
                  Variant Name <span className="ml-1 text-red-500">*</span>{" "}
                </label>{" "}
                <input
                  id="variant-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="e.g. Original, Standard, 100mm"
                  maxLength={100}
                  className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${errors.name ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-300 focus:border-red-500 focus:ring-red-100"}`}
                />{" "}
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-600"> {errors.name} </p>
                )}{" "}
              </div>{" "}
              <div>
                {" "}
                <label
                  htmlFor="variant-sku"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  {" "}
                  SKU <span className="ml-1 text-red-500">*</span>{" "}
                </label>{" "}
                <input
                  id="variant-sku"
                  name="sku"
                  type="text"
                  value={form.sku}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="e.g. BP-001-ORI"
                  maxLength={50}
                  className={`h-11 w-full rounded-lg border bg-white px-3 font-mono text-sm text-gray-900 outline-none transition placeholder:font-sans placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${errors.sku ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-300 focus:border-red-500 focus:ring-red-100"}`}
                />{" "}
                {errors.sku && (
                  <p className="mt-1.5 text-xs text-red-600"> {errors.sku} </p>
                )}{" "}
              </div>{" "}
              <div className="grid gap-5 md:grid-cols-2">
                {" "}
                <div>
                  {" "}
                  <label
                    htmlFor="variant-price"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {" "}
                    Price <span className="ml-1 text-red-500">*</span>{" "}
                  </label>{" "}
                  <div className="relative">
                    {" "}
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
                      {" "}
                      Rp{" "}
                    </span>{" "}
                    <input
                      id="variant-price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      disabled={saving}
                      placeholder="0"
                      className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${errors.price ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-300 focus:border-red-500 focus:ring-red-100"}`}
                    />{" "}
                  </div>{" "}
                  {errors.price && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {" "}
                      {errors.price}{" "}
                    </p>
                  )}{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label
                    htmlFor="variant-compare-price"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {" "}
                    Compare Price{" "}
                  </label>{" "}
                  <div className="relative">
                    {" "}
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
                      {" "}
                      Rp{" "}
                    </span>{" "}
                    <input
                      id="variant-compare-price"
                      name="compare_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.compare_price}
                      onChange={handleChange}
                      disabled={saving}
                      placeholder="0"
                      className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${errors.compare_price ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-300 focus:border-red-500 focus:ring-red-100"}`}
                    />{" "}
                  </div>{" "}
                  {errors.compare_price && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {" "}
                      {errors.compare_price}{" "}
                    </p>
                  )}{" "}
                  <p className="mt-1.5 text-xs text-gray-400">
                    {" "}
                    Optional original or reference price.{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <div className="grid gap-5 md:grid-cols-2">
                {" "}
                <div>
                  {" "}
                  <label
                    htmlFor="variant-cost-price"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {" "}
                    Cost Price{" "}
                  </label>{" "}
                  <div className="relative">
                    {" "}
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
                      {" "}
                      Rp{" "}
                    </span>{" "}
                    <input
                      id="variant-cost-price"
                      name="cost_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.cost_price}
                      onChange={handleChange}
                      disabled={saving}
                      placeholder="0"
                      className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${errors.cost_price ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-300 focus:border-red-500 focus:ring-red-100"}`}
                    />{" "}
                  </div>{" "}
                  {errors.cost_price && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {" "}
                      {errors.cost_price}{" "}
                    </p>
                  )}{" "}
                  <p className="mt-1.5 text-xs text-gray-400">
                    {" "}
                    Internal cost price.{" "}
                  </p>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label
                    htmlFor="variant-weight"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {" "}
                    Weight{" "}
                  </label>{" "}
                  <div className="relative">
                    {" "}
                    <input
                      id="variant-weight"
                      name="weight"
                      type="number"
                      min="0"
                      step="1"
                      value={form.weight}
                      onChange={handleChange}
                      disabled={saving}
                      placeholder="0"
                      className={`h-11 w-full rounded-lg border bg-white px-3 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${errors.weight ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-300 focus:border-red-500 focus:ring-red-100"}`}
                    />{" "}
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                      {" "}
                      gram{" "}
                    </span>{" "}
                  </div>{" "}
                  {errors.weight && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {" "}
                      {errors.weight}{" "}
                    </p>
                  )}{" "}
                </div>{" "}
              </div>{" "}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                {" "}
                <label className="flex cursor-pointer items-start gap-3">
                  {" "}
                  <input
                    type="checkbox"
                    name="status"
                    checked={form.status}
                    onChange={handleChange}
                    disabled={saving}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />{" "}
                  <span>
                    {" "}
                    <span className="block text-sm font-medium text-gray-800">
                      {" "}
                      Active Variant{" "}
                    </span>{" "}
                    <span className="mt-1 block text-xs leading-5 text-gray-500">
                      {" "}
                      Active variants can be used and managed in the system.
                      Disable this option to mark the variant as inactive.{" "}
                    </span>{" "}
                  </span>{" "}
                </label>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
            {" "}
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {" "}
              Cancel{" "}
            </button>{" "}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {" "}
              {saving ? (
                <>
                  {" "}
                  <Loader2 size={16} className="animate-spin" />{" "}
                  {isEditMode ? "Updating..." : "Creating..."}{" "}
                </>
              ) : (
                <>
                  {" "}
                  <Boxes size={16} />{" "}
                  {isEditMode ? "Update Variant" : "Create Variant"}{" "}
                </>
              )}{" "}
            </button>{" "}
          </div>{" "}
        </form>{" "}
      </div>{" "}
    </div>
  );
}
