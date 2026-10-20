"use client";

import { useEffect, useState } from "react";
import { Boxes, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";
import { formatRupiahInput, parseRupiahInput } from "@/lib/format-rupiah";

const INITIAL_FORM = {
  name: "",
  sku: "",
  price: "",
  compare_price: "",
  cost_price: "",
  weight: "",
  status: true,
};

const PRICE_FIELDS = ["price", "compare_price", "cost_price"];

function getInitialForm(variant) {
  if (!variant) {
    return { ...INITIAL_FORM };
  }

  return {
    name: variant.name || "",
    sku: variant.sku || "",
    price:
      variant.price !== null && variant.price !== undefined
        ? formatRupiahInput(variant.price)
        : "",
    compare_price:
      variant.compare_price !== null && variant.compare_price !== undefined
        ? formatRupiahInput(variant.compare_price)
        : "",
    cost_price:
      variant.cost_price !== null && variant.cost_price !== undefined
        ? formatRupiahInput(variant.cost_price)
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

  if (!form.price.trim()) {
    errors.price = "Price is required.";
  } else {
    const price = parseRupiahInput(form.price);

    if (!Number.isFinite(price)) {
      errors.price = "Price must be a valid number.";
    } else if (price < 0) {
      errors.price = "Price must not be negative.";
    }
  }

  if (form.compare_price !== "") {
    const comparePrice = parseRupiahInput(form.compare_price);

    if (!Number.isFinite(comparePrice)) {
      errors.compare_price = "Compare price must be a valid number.";
    } else if (comparePrice < 0) {
      errors.compare_price = "Compare price must not be negative.";
    }
  }

  if (form.cost_price !== "") {
    const costPrice = parseRupiahInput(form.cost_price);

    if (!Number.isFinite(costPrice)) {
      errors.cost_price = "Cost price must be a valid number.";
    } else if (costPrice < 0) {
      errors.cost_price = "Cost price must not be negative.";
    }
  }

  if (form.weight !== "") {
    const weight = Number(form.weight);

    if (!Number.isFinite(weight)) {
      errors.weight = "Weight must be a valid number.";
    } else if (!Number.isInteger(weight)) {
      errors.weight = "Weight must be an integer.";
    } else if (weight < 0) {
      errors.weight = "Weight must not be negative.";
    }
  }

  return errors;
}

function parseOptionalPrice(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return parseRupiahInput(value);
}

function getInputClass(hasError, extraClass = "") {
  return [
    "h-11 w-full rounded-lg border bg-white text-sm text-gray-900",
    "outline-none transition placeholder:text-gray-400",
    "focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100",
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
      : "border-gray-300 focus:border-red-500 focus:ring-red-100",
    extraClass,
  ].join(" ");
}

function FormField({ label, htmlFor, required, error, hint, children }) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-xs leading-5 text-red-600">{error}</p>
      )}

      {!error && hint && (
        <p className="mt-1.5 text-xs leading-5 text-gray-400">{hint}</p>
      )}
    </div>
  );
}

function PriceInput({
  id,
  name,
  value,
  onChange,
  disabled,
  error,
  placeholder = "0",
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-gray-400">
        Rp
      </span>

      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={getInputClass(Boolean(error), "pl-10 pr-3 tabular-nums")}
      />
    </div>
  );
}

export default function SparePartVariantForm({
  open,
  sparePartId,
  variant = null,
  onClose,
  onSaved,
}) {
  const isEditMode = Boolean(variant?.id);

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(getInitialForm(variant));
    setErrors({});
  }, [open, variant]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    let nextValue = type === "checkbox" ? checked : value;

    if (PRICE_FIELDS.includes(name)) {
      nextValue = formatRupiahInput(value);
    }

    setForm((current) => ({
      ...current,
      [name]: nextValue,
    }));

    setErrors((current) => {
      if (!current[name]) return current;

      const nextErrors = { ...current };
      delete nextErrors[name];

      return nextErrors;
    });
  }

  function handleClose() {
    if (saving) return;

    setErrors({});
    onClose?.();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

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
      price: parseRupiahInput(form.price),
      compare_price: parseOptionalPrice(form.compare_price),
      cost_price: parseOptionalPrice(form.cost_price),
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-5">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Boxes size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                {isEditMode ? "Edit Variant" : "Add Variant"}
              </h2>

              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                {isEditMode
                  ? "Update variant information."
                  : "Add a new variant to this spare part."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-5 sm:p-6">
              {/* Spare part information */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Spare Part
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {sparePartId ? `Spare Part #${sparePartId}` : "-"}
                </p>
              </div>

              {/* Basic information */}
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Basic Information
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the variant name and its unique SKU.
                  </p>
                </div>

                <FormField
                  label="Variant Name"
                  htmlFor="variant-name"
                  required
                  error={errors.name}
                >
                  <input
                    id="variant-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="e.g. Original, Standard, 100mm"
                    maxLength={100}
                    className={getInputClass(Boolean(errors.name), "px-3")}
                  />
                </FormField>

                <FormField
                  label="SKU"
                  htmlFor="variant-sku"
                  required
                  error={errors.sku}
                  hint="A unique code used to identify this variant."
                >
                  <input
                    id="variant-sku"
                    name="sku"
                    type="text"
                    value={form.sku}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="e.g. BP-001-ORI"
                    maxLength={50}
                    className={getInputClass(
                      Boolean(errors.sku),
                      "px-3 font-mono",
                    )}
                  />
                </FormField>
              </section>

              <div className="border-t border-gray-100" />

              {/* Pricing */}
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Pricing
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter prices in Rupiah. Thousands are separated
                    automatically.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Selling Price"
                    htmlFor="variant-price"
                    required
                    error={errors.price}
                  >
                    <PriceInput
                      id="variant-price"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      disabled={saving}
                      error={errors.price}
                    />
                  </FormField>

                  <FormField
                    label="Compare Price"
                    htmlFor="variant-compare-price"
                    error={errors.compare_price}
                    hint="Optional original or reference price."
                  >
                    <PriceInput
                      id="variant-compare-price"
                      name="compare_price"
                      value={form.compare_price}
                      onChange={handleChange}
                      disabled={saving}
                      error={errors.compare_price}
                    />
                  </FormField>

                  <FormField
                    label="Cost Price"
                    htmlFor="variant-cost-price"
                    error={errors.cost_price}
                    hint="Internal purchase or cost price."
                  >
                    <PriceInput
                      id="variant-cost-price"
                      name="cost_price"
                      value={form.cost_price}
                      onChange={handleChange}
                      disabled={saving}
                      error={errors.cost_price}
                    />
                  </FormField>

                  <FormField
                    label="Weight"
                    htmlFor="variant-weight"
                    error={errors.weight}
                    hint="Enter the weight in grams."
                  >
                    <div className="relative">
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
                        className={getInputClass(
                          Boolean(errors.weight),
                          "px-3 pr-14",
                        )}
                      />

                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                        gram
                      </span>
                    </div>
                  </FormField>
                </div>
              </section>

              <div className="border-t border-gray-100" />

              {/* Status */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Variant Status
                </h3>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="status"
                    checked={form.status}
                    onChange={handleChange}
                    disabled={saving}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />

                  <span>
                    <span className="block text-sm font-medium text-gray-800">
                      Active Variant
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-gray-500">
                      Active variants can be used and managed in the system.
                      Disable this option to mark the variant as inactive.
                    </span>
                  </span>
                </label>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Boxes size={16} />
                  {isEditMode ? "Update Variant" : "Create Variant"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
