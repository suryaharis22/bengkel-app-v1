"use client";

import { useState } from "react";
import { Motorbike, X } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";
import { formatPlateNumber, ViewPlateNumber } from "@/utils/formatPlateNumber";

const CURRENT_YEAR = new Date().getFullYear();

const INITIAL_FORM = {
  plate_region: "",
  plate_number: "",
  plate_suffix: "",
  brand: "",
  model: "",
  year: "",
  color: "",
};

/**
 * Pastikan semua value yang masuk ke input
 * selalu berupa string.
 */
function safeString(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

/**
 * Parse:
 * B-1234-ABC
 *
 * menjadi:
 * {
 *   plate_region: "B",
 *   plate_number: "1234",
 *   plate_suffix: "ABC"
 * }
 */
function parsePlateNumber(plateNumber) {
  const value = safeString(plateNumber).trim();

  if (!value) {
    return {
      plate_region: "",
      plate_number: "",
      plate_suffix: "",
    };
  }

  const parts = value
    .split("-")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    plate_region: safeString(parts[0]).toUpperCase(),
    plate_number: safeString(parts[1]),
    plate_suffix: safeString(parts.slice(2).join("")).toUpperCase(),
  };
}

/**
 * Membuat state awal form.
 */
function createInitialForm(vehicle) {
  if (!vehicle) {
    return {
      ...INITIAL_FORM,
    };
  }

  const plate = parsePlateNumber(vehicle.plate_number);

  return {
    plate_region: safeString(plate.plate_region),
    plate_number: safeString(plate.plate_number),
    plate_suffix: safeString(plate.plate_suffix),

    brand: safeString(vehicle.brand),
    model: safeString(vehicle.model),

    year:
      vehicle.year !== null && vehicle.year !== undefined
        ? safeString(vehicle.year)
        : "",

    color: safeString(vehicle.color),
  };
}

export default function CustomerVehicleForm({
  vehicle = null,
  open = false,
  onClose,
  onSuccess,
}) {
  const isEdit = Boolean(vehicle);

  const [form, setForm] = useState(() => createInitialForm(vehicle));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!open) {
    return null;
  }

  /**
   * Handle input biasa.
   */
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: safeString(value),
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  /**
   * Handle input nomor polisi.
   *
   * Region  -> huruf saja
   * Number  -> angka saja
   * Suffix  -> huruf saja
   */
  function handlePlateChange(event) {
    const { name, value } = event.target;

    let normalizedValue = safeString(value).toUpperCase();

    if (name === "plate_region") {
      normalizedValue = normalizedValue.replace(/[^A-Z]/g, "");
    }

    if (name === "plate_number") {
      normalizedValue = normalizedValue.replace(/\D/g, "");
    }

    if (name === "plate_suffix") {
      normalizedValue = normalizedValue.replace(/[^A-Z]/g, "");
    }

    setForm((current) => ({
      ...current,
      [name]: normalizedValue,
    }));

    setErrors((current) => ({
      ...current,
      plate_region: "",
      plate_number: "",
      plate_suffix: "",
    }));
  }

  /**
   * Validasi form.
   */
  function validateForm() {
    const nextErrors = {};

    const region = safeString(form.plate_region).trim();
    const number = safeString(form.plate_number).trim();
    const suffix = safeString(form.plate_suffix).trim();

    const brand = safeString(form.brand).trim();
    const model = safeString(form.model).trim();
    const year = safeString(form.year).trim();
    const color = safeString(form.color).trim();

    /*
     * Plate Region
     */
    if (!region) {
      nextErrors.plate_region = "Region is required.";
    } else if (region.length > 5) {
      nextErrors.plate_region = "Region must not exceed 5 characters.";
    } else if (!/^[A-Z]+$/.test(region)) {
      nextErrors.plate_region = "Region must contain letters only.";
    }

    /*
     * Plate Number
     */
    if (!number) {
      nextErrors.plate_number = "Number is required.";
    } else if (!/^\d+$/.test(number)) {
      nextErrors.plate_number = "Number must contain digits only.";
    } else if (number.length > 6) {
      nextErrors.plate_number = "Number must not exceed 6 digits.";
    }

    /*
     * Plate Suffix
     */
    if (suffix.length > 5) {
      nextErrors.plate_suffix = "Suffix must not exceed 5 characters.";
    } else if (suffix && !/^[A-Z]+$/.test(suffix)) {
      nextErrors.plate_suffix = "Suffix must contain letters only.";
    }

    /*
     * Brand
     */
    if (!brand) {
      nextErrors.brand = "Brand is required.";
    } else if (brand.length > 100) {
      nextErrors.brand = "Brand must not exceed 100 characters.";
    }

    /*
     * Model
     */
    if (!model) {
      nextErrors.model = "Model is required.";
    } else if (model.length > 100) {
      nextErrors.model = "Model must not exceed 100 characters.";
    }

    /*
     * Year
     */
    if (year) {
      const yearNumber = Number(year);

      if (!Number.isInteger(yearNumber)) {
        nextErrors.year = "Year must be a valid number.";
      } else if (yearNumber < 1900) {
        nextErrors.year = "Year must be greater than or equal to 1900.";
      } else if (yearNumber > CURRENT_YEAR + 1) {
        nextErrors.year = "Year must not be in the distant future.";
      }
    }

    /*
     * Color
     */
    if (color.length > 50) {
      nextErrors.color = "Color must not exceed 50 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  /**
   * Submit form.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!validateForm()) {
      toast.error("Please check the form and try again.");
      return;
    }

    setLoading(true);

    const plateNumber = formatPlateNumber(
      safeString(form.plate_region),
      safeString(form.plate_number),
      safeString(form.plate_suffix),
    );

    const payload = {
      plate_number: plateNumber,
      brand: safeString(form.brand).trim(),
      model: safeString(form.model).trim(),
      year: safeString(form.year).trim() ? Number(form.year) : null,
      color: safeString(form.color).trim()
        ? safeString(form.color).trim()
        : null,
    };

    try {
      let response;

      if (isEdit) {
        response = await api.put(`/customer/vehicles/${vehicle.id}`, payload);

        toast.success("Vehicle updated successfully.");
      } else {
        response = await api.post("/customer/vehicles", payload);

        toast.success("Vehicle added successfully.");
      }

      const responseVehicle = response?.data?.data || null;

      onSuccess?.(responseVehicle);
    } catch (error) {
      const axiosError = getAxiosError(error);

      toast.error(axiosError.message || "Failed to save vehicle.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Close modal.
   */
  function handleClose() {
    if (loading) {
      return;
    }

    onClose?.();
  }

  const formattedPlate = formatPlateNumber(
    safeString(form.plate_region),
    safeString(form.plate_number),
    safeString(form.plate_suffix),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[95vh] w-full flex-col overflow-hidden bg-white shadow-xl sm:max-w-lg sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Motorbike size={19} strokeWidth={2} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                {isEdit ? "Edit Vehicle" : "Add Vehicle"}
              </h2>

              <p className="mt-0.5 text-sm text-gray-500">
                {isEdit
                  ? "Update your vehicle information."
                  : "Add your vehicle information."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="space-y-5 p-5">
            {/* Plate Number */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Plate Number
                <span className="ml-1 text-red-600">*</span>
              </label>

              <div className="grid grid-cols-[0.8fr_1.4fr_1.2fr] gap-2">
                {/* Region */}
                <input
                  id="plate_region"
                  name="plate_region"
                  type="text"
                  value={form.plate_region ?? ""}
                  onChange={handlePlateChange}
                  maxLength={5}
                  placeholder="B"
                  autoComplete="off"
                  className={[
                    "h-11 w-full rounded-xl border",
                    "bg-white px-3 text-center text-sm font-semibold text-gray-900",
                    "uppercase outline-none transition",
                    "placeholder:text-gray-400",
                    errors.plate_region
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100",
                  ].join(" ")}
                />

                {/* Number */}
                <input
                  id="plate_number"
                  name="plate_number"
                  type="text"
                  inputMode="numeric"
                  value={form.plate_number ?? ""}
                  onChange={handlePlateChange}
                  maxLength={6}
                  placeholder="1234"
                  autoComplete="off"
                  className={[
                    "h-11 w-full rounded-xl border",
                    "bg-white px-3 text-center text-sm font-semibold text-gray-900",
                    "outline-none transition",
                    "placeholder:text-gray-400",
                    errors.plate_number
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100",
                  ].join(" ")}
                />

                {/* Suffix */}
                <input
                  id="plate_suffix"
                  name="plate_suffix"
                  type="text"
                  value={form.plate_suffix ?? ""}
                  onChange={handlePlateChange}
                  maxLength={5}
                  placeholder="ABC"
                  autoComplete="off"
                  className={[
                    "h-11 w-full rounded-xl border",
                    "bg-white px-3 text-center text-sm font-semibold text-gray-900",
                    "uppercase outline-none transition",
                    "placeholder:text-gray-400",
                    errors.plate_suffix
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100",
                  ].join(" ")}
                />
              </div>

              {/* Plate errors */}
              {errors.plate_region ? (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.plate_region}
                </p>
              ) : null}

              {errors.plate_number ? (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.plate_number}
                </p>
              ) : null}

              {errors.plate_suffix ? (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.plate_suffix}
                </p>
              ) : null}

              {/* Preview */}
              {formattedPlate ? (
                <p className="mt-1.5 text-xs text-gray-400">
                  Preview:{" "}
                  <span className="font-semibold text-gray-700">
                    {ViewPlateNumber(formattedPlate)}
                  </span>
                </p>
              ) : null}
            </div>

            {/* Brand */}
            <div>
              <label
                htmlFor="brand"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Brand
                <span className="ml-1 text-red-600">*</span>
              </label>

              <input
                id="brand"
                name="brand"
                type="text"
                value={form.brand ?? ""}
                onChange={handleChange}
                maxLength={100}
                placeholder="Honda"
                autoComplete="off"
                className={[
                  "h-11 w-full rounded-xl border",
                  "bg-white px-3.5 text-sm text-gray-900",
                  "outline-none transition",
                  "placeholder:text-gray-400",
                  errors.brand
                    ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100",
                ].join(" ")}
              />

              {errors.brand ? (
                <p className="mt-1.5 text-xs text-red-600">{errors.brand}</p>
              ) : null}
            </div>

            {/* Model */}
            <div>
              <label
                htmlFor="model"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Model
                <span className="ml-1 text-red-600">*</span>
              </label>

              <input
                id="model"
                name="model"
                type="text"
                value={form.model ?? ""}
                onChange={handleChange}
                maxLength={100}
                placeholder="Vario 160"
                autoComplete="off"
                className={[
                  "h-11 w-full rounded-xl border",
                  "bg-white px-3.5 text-sm text-gray-900",
                  "outline-none transition",
                  "placeholder:text-gray-400",
                  errors.model
                    ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100",
                ].join(" ")}
              />

              {errors.model ? (
                <p className="mt-1.5 text-xs text-red-600">{errors.model}</p>
              ) : null}
            </div>

            {/* Year + Color */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Year */}
              <div>
                <label
                  htmlFor="year"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Year
                </label>

                <input
                  id="year"
                  name="year"
                  type="number"
                  value={form.year ?? ""}
                  onChange={handleChange}
                  min={1900}
                  max={CURRENT_YEAR + 1}
                  placeholder={String(CURRENT_YEAR)}
                  className={[
                    "h-11 w-full rounded-xl border",
                    "bg-white px-3.5 text-sm text-gray-900",
                    "outline-none transition",
                    "placeholder:text-gray-400",
                    errors.year
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100",
                  ].join(" ")}
                />

                {errors.year ? (
                  <p className="mt-1.5 text-xs text-red-600">{errors.year}</p>
                ) : null}
              </div>

              {/* Color */}
              <div>
                <label
                  htmlFor="color"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Color
                </label>

                <input
                  id="color"
                  name="color"
                  type="text"
                  value={form.color ?? ""}
                  onChange={handleChange}
                  maxLength={50}
                  placeholder="Black"
                  autoComplete="off"
                  className={[
                    "h-11 w-full rounded-xl border",
                    "bg-white px-3.5 text-sm text-gray-900",
                    "outline-none transition",
                    "placeholder:text-gray-400",
                    errors.color
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100",
                  ].join(" ")}
                />

                {errors.color ? (
                  <p className="mt-1.5 text-xs text-red-600">{errors.color}</p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50/70 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
