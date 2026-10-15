"use client";

import { useState } from "react";
import {
  CalendarDays,
  Loader2,
  Motorbike,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";
import { formatPlateNumber } from "@/utils/formatPlateNumber";

const initialForm = {
  customer_name: "",
  customer_phone: "",
  plate_region: "",
  plate_number_value: "",
  plate_suffix: "",
  brand: "",
  model: "",
  year: "",
  color: "",
  complaint: "",
  notes: "",
  scheduled_at: "",
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    getAxiosError(error) ||
    "Failed to create guest booking."
  );
}

function getFieldError(errors, field) {
  const error = errors?.[field];

  if (Array.isArray(error)) {
    return error[0] || "";
  }

  if (typeof error === "object" && error !== null) {
    return error.message || "";
  }

  return error || "";
}

function convertDateTimeToIso(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export default function BookingGuestForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    let nextValue = value;

    if (
      name === "plate_region" ||
      name === "plate_number_value" ||
      name === "plate_suffix"
    ) {
      nextValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    }

    setForm((current) => ({
      ...current,
      [name]: nextValue,
    }));

    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];

      return next;
    });
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.customer_name.trim()) {
      nextErrors.customer_name = "Customer name is required.";
    }

    if (!form.customer_phone.trim()) {
      nextErrors.customer_phone = "Customer phone is required.";
    }

    if (!form.plate_region.trim()) {
      nextErrors.plate_region = "Plate region is required.";
    }

    if (!form.plate_number_value.trim()) {
      nextErrors.plate_number_value = "Plate number is required.";
    }

    if (!form.plate_suffix.trim()) {
      nextErrors.plate_suffix = "Plate suffix is required.";
    }

    if (!form.brand.trim()) {
      nextErrors.brand = "Vehicle brand is required.";
    }

    if (!form.model.trim()) {
      nextErrors.model = "Vehicle model is required.";
    }

    if (form.year) {
      const year = Number(form.year);
      const currentYear = new Date().getFullYear();

      if (!Number.isInteger(year)) {
        nextErrors.year = "Year must be a valid number.";
      } else if (year < 1900) {
        nextErrors.year = "Year must be greater than or equal to 1900.";
      } else if (year > currentYear + 1) {
        nextErrors.year = `Year must not exceed ${currentYear + 1}.`;
      }
    }

    if (!form.complaint.trim()) {
      nextErrors.complaint = "Complaint is required.";
    }

    if (!form.scheduled_at) {
      nextErrors.scheduled_at = "Scheduled date and time is required.";
    }

    if (form.scheduled_at && !convertDateTimeToIso(form.scheduled_at)) {
      nextErrors.scheduled_at = "Scheduled date and time is invalid.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!validateForm()) {
      toast.error("Please complete the required fields.");
      return;
    }

    const scheduledAt = convertDateTimeToIso(form.scheduled_at);

    const plateNumber = formatPlateNumber(
      form.plate_region,
      form.plate_number_value,
      form.plate_suffix,
    );

    const payload = {
      customer_type: "guest",
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      plate_number: plateNumber,
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: form.year ? Number(form.year) : null,
      color: form.color.trim() || null,
      complaint: form.complaint.trim(),
      notes: form.notes.trim() || null,
      scheduled_at: scheduledAt,
    };

    try {
      setLoading(true);
      setErrors({});

      const response = await api.post("/admin/bookings", payload);

      const booking =
        response?.data?.data?.data ||
        response?.data?.data ||
        response?.data?.booking ||
        null;

      toast.success(
        response?.data?.message || "Guest booking created successfully.",
      );

      setForm(initialForm);

      if (typeof onSuccess === "function") {
        onSuccess(booking);
      }
    } catch (error) {
      const responseErrors = error?.response?.data?.errors;

      if (responseErrors && typeof responseErrors === "object") {
        setErrors(responseErrors);
      }

      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function inputClassName(field) {
    const hasError = Boolean(getFieldError(errors, field));

    return [
      "w-full rounded-lg border bg-white px-3 py-2.5",
      "text-sm text-gray-900 outline-none transition",
      "placeholder:text-gray-400",
      "focus:ring-2",
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
        : "border-gray-200 focus:border-red-500 focus:ring-red-100",
      loading ? "cursor-not-allowed bg-gray-50" : "",
    ].join(" ");
  }

  function textareaClassName(field) {
    const hasError = Boolean(getFieldError(errors, field));

    return [
      "w-full resize-none rounded-lg border bg-white px-3 py-2.5",
      "text-sm text-gray-900 outline-none transition",
      "placeholder:text-gray-400",
      "focus:ring-2",
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
        : "border-gray-200 focus:border-red-500 focus:ring-red-100",
      loading ? "cursor-not-allowed bg-gray-50" : "",
    ].join(" ");
  }

  const plateRegionError = getFieldError(errors, "plate_region");
  const plateNumberError = getFieldError(errors, "plate_number_value");
  const plateSuffixError = getFieldError(errors, "plate_suffix");

  const plateError = plateRegionError || plateNumberError || plateSuffixError;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <UserRound size={18} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Customer Information
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              Enter the guest customer information.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="customer_name"
              className="text-sm font-medium text-gray-700"
            >
              Customer Name
              <span className="ml-1 text-red-500">*</span>
            </label>

            <div className="relative">
              <UserRound
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="customer_name"
                name="customer_name"
                type="text"
                value={form.customer_name}
                onChange={handleChange}
                placeholder="Enter customer name"
                maxLength={100}
                disabled={loading}
                autoComplete="name"
                className={`${inputClassName("customer_name")} pl-9`}
              />
            </div>

            {getFieldError(errors, "customer_name") && (
              <p className="text-xs text-red-600">
                {getFieldError(errors, "customer_name")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="customer_phone"
              className="text-sm font-medium text-gray-700"
            >
              Phone Number
              <span className="ml-1 text-red-500">*</span>
            </label>

            <div className="relative">
              <Phone
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="customer_phone"
                name="customer_phone"
                type="tel"
                inputMode="numeric"
                value={form.customer_phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  handleChange({
                    target: {
                      name: "customer_phone",
                      value,
                    },
                  });
                }}
                placeholder="08xxxxxxxxxx"
                maxLength={15}
                disabled={loading}
                autoComplete="tel"
                className={`${inputClassName("customer_phone")} pl-9`}
              />
            </div>

            {getFieldError(errors, "customer_phone") && (
              <p className="text-xs text-red-600">
                {getFieldError(errors, "customer_phone")}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Motorbike size={18} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Vehicle Information
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              Enter the vehicle information.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* PLATE NUMBER */}
          <div className="space-y-1.5">
            <label
              htmlFor="plate_region"
              className="text-sm font-medium text-gray-700"
            >
              Plate Number
              <span className="ml-1 text-red-500">*</span>
            </label>

            <div className="flex items-start gap-2">
              <div className="w-20 shrink-0">
                <input
                  id="plate_region"
                  name="plate_region"
                  type="text"
                  value={form.plate_region}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/[^a-zA-Z]/g, "")
                      .toUpperCase()
                      .slice(0, 2);

                    handleChange({
                      target: {
                        name: "plate_region",
                        value,
                      },
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key.length === 1 && !/[a-zA-Z]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="AG"
                  maxLength={2}
                  disabled={loading}
                  autoComplete="off"
                  className={inputClassName("plate_region")}
                />
              </div>

              <span className="pt-2.5 text-sm font-medium text-gray-400">
                -
              </span>

              <div className="w-24 shrink-0">
                <input
                  id="plate_number_value"
                  name="plate_number_value"
                  type="text"
                  inputMode="numeric"
                  value={form.plate_number_value}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 4);

                    handleChange({
                      target: {
                        name: "plate_number_value",
                        value,
                      },
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key.length === 1 && !/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="1234"
                  maxLength={4}
                  disabled={loading}
                  autoComplete="off"
                  className={inputClassName("plate_number_value")}
                />
              </div>

              <span className="pt-2.5 text-sm font-medium text-gray-400">
                -
              </span>

              <div className="min-w-0 flex-1">
                <input
                  id="plate_suffix"
                  name="plate_suffix"
                  type="text"
                  value={form.plate_suffix}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/[^a-zA-Z]/g, "")
                      .toUpperCase()
                      .slice(0, 3);

                    handleChange({
                      target: {
                        name: "plate_suffix",
                        value,
                      },
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key.length === 1 && !/[a-zA-Z]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="CBC"
                  maxLength={3}
                  disabled={loading}
                  autoComplete="off"
                  className={inputClassName("plate_suffix")}
                />
              </div>
            </div>

            {plateError && <p className="text-xs text-red-600">{plateError}</p>}

            <p className="text-xs text-gray-400">Format: AG-1234-CBC</p>
          </div>

          {/* BRAND */}
          <div className="space-y-1.5">
            <label
              htmlFor="brand"
              className="text-sm font-medium text-gray-700"
            >
              Brand
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="brand"
              name="brand"
              type="text"
              value={form.brand}
              onChange={handleChange}
              placeholder="Honda, Yamaha, Suzuki..."
              maxLength={100}
              disabled={loading}
              className={inputClassName("brand")}
            />

            {getFieldError(errors, "brand") && (
              <p className="text-xs text-red-600">
                {getFieldError(errors, "brand")}
              </p>
            )}
          </div>

          {/* MODEL */}
          <div className="space-y-1.5">
            <label
              htmlFor="model"
              className="text-sm font-medium text-gray-700"
            >
              Model
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="model"
              name="model"
              type="text"
              value={form.model}
              onChange={handleChange}
              placeholder="Vario 150, Avanza..."
              maxLength={100}
              disabled={loading}
              className={inputClassName("model")}
            />

            {getFieldError(errors, "model") && (
              <p className="text-xs text-red-600">
                {getFieldError(errors, "model")}
              </p>
            )}
          </div>

          {/* YEAR */}
          <div className="space-y-1.5">
            <label htmlFor="year" className="text-sm font-medium text-gray-700">
              Year
            </label>

            <input
              id="year"
              name="year"
              type="number"
              value={form.year}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                handleChange({
                  target: {
                    name: "year",
                    value,
                  },
                });
              }}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder={String(new Date().getFullYear())}
              min={1900}
              max={new Date().getFullYear() + 1}
              disabled={loading}
              className={`${inputClassName("year")} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            />

            {getFieldError(errors, "year") && (
              <p className="text-xs text-red-600">
                {getFieldError(errors, "year")}
              </p>
            )}
          </div>

          {/* COLOR */}
          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="color"
              className="text-sm font-medium text-gray-700"
            >
              Color
            </label>

            <input
              id="color"
              name="color"
              type="text"
              value={form.color}
              onChange={handleChange}
              placeholder="Black, White, Red..."
              maxLength={50}
              disabled={loading}
              className={inputClassName("color")}
            />

            {getFieldError(errors, "color") && (
              <p className="text-xs text-red-600">
                {getFieldError(errors, "color")}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <CalendarDays size={18} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Booking Information
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              Set the service schedule and vehicle complaint.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* SCHEDULED AT */}
          <div className="space-y-1.5">
            <label
              htmlFor="scheduled_at"
              className="text-sm font-medium text-gray-700"
            >
              Scheduled Date & Time
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="scheduled_at"
              name="scheduled_at"
              type="datetime-local"
              value={form.scheduled_at}
              onChange={handleChange}
              disabled={loading}
              className={inputClassName("scheduled_at")}
            />

            {getFieldError(errors, "scheduled_at") && (
              <p className="text-xs text-red-600">
                {getFieldError(errors, "scheduled_at")}
              </p>
            )}
          </div>

          {/* COMPLAINT */}
          <div className="space-y-1.5">
            <label
              htmlFor="complaint"
              className="text-sm font-medium text-gray-700"
            >
              Complaint / Kendala
              <span className="ml-1 text-red-500">*</span>
            </label>

            <textarea
              id="complaint"
              name="complaint"
              value={form.complaint}
              onChange={handleChange}
              placeholder="Describe the vehicle problem..."
              rows={4}
              maxLength={5000}
              disabled={loading}
              className={textareaClassName("complaint")}
            />

            {getFieldError(errors, "complaint") && (
              <p className="text-xs text-red-600">
                {getFieldError(errors, "complaint")}
              </p>
            )}
          </div>

          {/* NOTES */}
          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="notes"
              className="text-sm font-medium text-gray-700"
            >
              Notes
            </label>

            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
              rows={4}
              maxLength={5000}
              disabled={loading}
              className={textareaClassName("notes")}
            />

            {getFieldError(errors, "notes") && (
              <p className="text-xs text-red-600">
                {getFieldError(errors, "notes")}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ACTIONS */}
      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={16} />
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save size={16} />
              Create Booking
            </>
          )}
        </button>
      </div>
    </form>
  );
}
