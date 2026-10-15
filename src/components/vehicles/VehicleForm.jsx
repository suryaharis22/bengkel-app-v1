"use client";

import { useState } from "react";
import { Motorbike, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

const EMPTY_FORM = {
  vehicle_type: "Customer",
  user_id: "",
  plate_number: "",
  brand: "",
  model: "",
  year: "",
  color: "",
};

function normalizeVehicle(vehicle) {
  if (!vehicle) {
    return { ...EMPTY_FORM };
  }

  return {
    vehicle_type: vehicle.user_id ? "Customer" : "Guest",
    user_id: vehicle.user_id ? String(vehicle.user_id) : "",
    plate_number: vehicle.plate_number || "",
    brand: vehicle.brand || "",
    model: vehicle.model || "",
    year: vehicle.year ? String(vehicle.year) : "",
    color: vehicle.color || "",
  };
}

function getErrorMessage(error, fallback) {
  return (
    getAxiosError(error)?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function VehicleForm({
  vehicle = null,
  open = true,
  onClose,
  onSuccess,
}) {
  const isEdit = Boolean(vehicle?.id);

  const [form, setForm] = useState(() => normalizeVehicle(vehicle));
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleTypeChange(event) {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      vehicle_type: value,
      user_id: value === "Guest" ? "" : current.user_id,
    }));
  }

  function validateForm() {
    if (!form.plate_number.trim()) {
      toast.error("Plate number is required");
      return false;
    }

    if (!form.brand.trim()) {
      toast.error("Brand is required");
      return false;
    }

    if (!form.model.trim()) {
      toast.error("Model is required");
      return false;
    }

    if (form.year !== "") {
      const year = Number(form.year);

      if (!Number.isInteger(year)) {
        toast.error("Year must be a valid number");
        return false;
      }

      const currentYear = new Date().getFullYear();

      if (year < 1900 || year > currentYear + 1) {
        toast.error(`Year must be between 1900 and ${currentYear + 1}`);
        return false;
      }
    }

    if (form.vehicle_type === "Customer" && !form.user_id) {
      toast.error("Customer ID is required");
      return false;
    }

    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting || !validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        plate_number: form.plate_number.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: form.year === "" ? null : Number(form.year),
        color: form.color.trim() || null,
      };

      if (form.vehicle_type === "Customer") {
        payload.user_id = Number(form.user_id);
      } else {
        payload.user_id = null;
      }

      let response;

      if (isEdit) {
        response = await api.put(`/admin/vehicles/${vehicle.id}`, payload);
      } else if (form.vehicle_type === "Guest") {
        response = await api.post("/admin/vehicles/guest", payload);
      } else {
        response = await api.post("/admin/vehicles", payload);
      }

      const success = response?.data?.success !== false;

      if (!success) {
        throw new Error(response?.data?.message || "Failed to save vehicle");
      }

      toast.success(
        isEdit
          ? "Vehicle updated successfully"
          : "Vehicle created successfully",
      );

      onSuccess?.(response?.data?.data || response?.data);

      onClose?.();
    } catch (error) {
      console.error("Vehicle form error:", error);

      toast.error(
        getErrorMessage(
          error,
          isEdit ? "Failed to update vehicle" : "Failed to create vehicle",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) {
      return;
    }

    onClose?.();
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Motorbike size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-gray-900">
                {isEdit ? "Edit Vehicle" : "Add Vehicle"}
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                {isEdit
                  ? "Update vehicle information"
                  : "Add a new vehicle to the system"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="space-y-5 p-5">
            {/* VEHICLE TYPE */}
            {!isEdit ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Vehicle Type
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={[
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition",
                      form.vehicle_type === "Customer"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="vehicle_type"
                      value="Customer"
                      checked={form.vehicle_type === "Customer"}
                      onChange={handleTypeChange}
                      disabled={submitting}
                      className="h-4 w-4 accent-red-600"
                    />

                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Customer
                      </p>

                      <p className="text-xs text-gray-500">
                        Vehicle belongs to a customer
                      </p>
                    </div>
                  </label>

                  <label
                    className={[
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition",
                      form.vehicle_type === "Guest"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="vehicle_type"
                      value="Guest"
                      checked={form.vehicle_type === "Guest"}
                      onChange={handleTypeChange}
                      disabled={submitting}
                      className="h-4 w-4 accent-red-600"
                    />

                    <div>
                      <p className="text-sm font-medium text-gray-900">Guest</p>

                      <p className="text-xs text-gray-500">
                        Vehicle without registered customer
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            ) : null}

            {/* CUSTOMER ID */}
            {form.vehicle_type === "Customer" ? (
              <div>
                <label
                  htmlFor="user_id"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Customer ID
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="user_id"
                  name="user_id"
                  type="number"
                  min="1"
                  value={form.user_id}
                  onChange={handleChange}
                  placeholder="Enter customer ID"
                  disabled={submitting}
                  className={[
                    "h-10 w-full rounded-lg border border-gray-300",
                    "bg-white px-3 text-sm text-gray-900",
                    "outline-none transition",
                    "placeholder:text-gray-400",
                    "focus:border-red-500 focus:ring-2 focus:ring-red-100",
                    "disabled:cursor-not-allowed disabled:bg-gray-50",
                  ].join(" ")}
                />

                <p className="mt-1.5 text-xs text-gray-500">
                  Enter the registered customer user ID.
                </p>
              </div>
            ) : null}

            {/* PLATE / BRAND */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="plate_number"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Plate Number
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="plate_number"
                  name="plate_number"
                  type="text"
                  maxLength={20}
                  value={form.plate_number}
                  onChange={handleChange}
                  placeholder="e.g. B 1234 ABC"
                  disabled={submitting}
                  className={[
                    "h-10 w-full rounded-lg border border-gray-300",
                    "bg-white px-3 text-sm uppercase text-gray-900",
                    "outline-none transition",
                    "placeholder:text-gray-400",
                    "focus:border-red-500 focus:ring-2 focus:ring-red-100",
                    "disabled:cursor-not-allowed disabled:bg-gray-50",
                  ].join(" ")}
                />
              </div>

              <div>
                <label
                  htmlFor="brand"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Brand
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="brand"
                  name="brand"
                  type="text"
                  maxLength={100}
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="e.g. Honda"
                  disabled={submitting}
                  className={[
                    "h-10 w-full rounded-lg border border-gray-300",
                    "bg-white px-3 text-sm text-gray-900",
                    "outline-none transition",
                    "placeholder:text-gray-400",
                    "focus:border-red-500 focus:ring-2 focus:ring-red-100",
                    "disabled:cursor-not-allowed disabled:bg-gray-50",
                  ].join(" ")}
                />
              </div>
            </div>

            {/* MODEL / YEAR */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="model"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Model
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="model"
                  name="model"
                  type="text"
                  maxLength={100}
                  value={form.model}
                  onChange={handleChange}
                  placeholder="e.g. Vario 160"
                  disabled={submitting}
                  className={[
                    "h-10 w-full rounded-lg border border-gray-300",
                    "bg-white px-3 text-sm text-gray-900",
                    "outline-none transition",
                    "placeholder:text-gray-400",
                    "focus:border-red-500 focus:ring-2 focus:ring-red-100",
                    "disabled:cursor-not-allowed disabled:bg-gray-50",
                  ].join(" ")}
                />
              </div>

              <div>
                <label
                  htmlFor="year"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Year
                </label>

                <input
                  id="year"
                  name="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={form.year}
                  onChange={handleChange}
                  placeholder={String(new Date().getFullYear())}
                  disabled={submitting}
                  className={[
                    "h-10 w-full rounded-lg border border-gray-300",
                    "bg-white px-3 text-sm text-gray-900",
                    "outline-none transition",
                    "placeholder:text-gray-400",
                    "focus:border-red-500 focus:ring-2 focus:ring-red-100",
                    "disabled:cursor-not-allowed disabled:bg-gray-50",
                  ].join(" ")}
                />
              </div>
            </div>

            {/* COLOR */}
            <div>
              <label
                htmlFor="color"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Color
              </label>

              <input
                id="color"
                name="color"
                type="text"
                maxLength={50}
                value={form.color}
                onChange={handleChange}
                placeholder="e.g. Black"
                disabled={submitting}
                className={[
                  "h-10 w-full rounded-lg border border-gray-300",
                  "bg-white px-3 text-sm text-gray-900",
                  "outline-none transition",
                  "placeholder:text-gray-400",
                  "focus:border-red-500 focus:ring-2 focus:ring-red-100",
                  "disabled:cursor-not-allowed disabled:bg-gray-50",
                ].join(" ")}
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50/70 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className={[
                "inline-flex h-10 items-center justify-center gap-2",
                "rounded-lg border border-gray-300 bg-white px-4",
                "text-sm font-medium text-gray-700",
                "transition hover:bg-gray-50",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              <X size={16} />
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={[
                "inline-flex h-10 items-center justify-center gap-2",
                "rounded-lg bg-red-600 px-4",
                "text-sm font-medium text-white",
                "transition hover:bg-red-700",
                "disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEdit ? "Save Changes" : "Save Vehicle"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
