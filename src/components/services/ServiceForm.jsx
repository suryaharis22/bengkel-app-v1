"use client";

import { useState } from "react";
import {
  Check,
  Loader2,
  X,
  Wrench,
  CircleDollarSign,
  FileText,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";
import { formatRupiahInput, parseRupiahInput } from "@/lib/format-rupiah";

const INITIAL_FORM = {
  name: "",
  description: "",
  price: "",
  status: true,
};

function createInitialForm(service) {
  if (!service) {
    return { ...INITIAL_FORM };
  }

  return {
    name: service.name ?? "",
    description: service.description ?? "",
    price:
      service.price !== null && service.price !== undefined
        ? formatRupiahInput(service.price)
        : "",
    status: Boolean(service.status),
  };
}

export default function ServiceForm({
  open,
  service = null,
  onClose,
  onSuccess,
}) {
  if (!open) {
    return null;
  }

  // Remount the inner form when the selected service changes.
  const formKey = service?.id ?? "new-service";

  return (
    <ServiceFormContent
      key={formKey}
      service={service}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function ServiceFormContent({ service, onClose, onSuccess }) {
  const isEdit = Boolean(service);

  const [form, setForm] = useState(() => createInitialForm(service));
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : name === "price"
            ? formatRupiahInput(value)
            : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    const name = form.name.trim();
    const description = form.description.trim();
    const price = parseRupiahInput(form.price);

    if (!name) {
      toast.error("Service name is required");
      return;
    }

    if (name.length > 150) {
      toast.error("Service name must not exceed 150 characters");
      return;
    }

    if (description.length > 5000) {
      toast.error("Description must not exceed 5000 characters");
      return;
    }

    if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) {
      toast.error("Valid service price is required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        description: description || null,
        price, // Tetap angka, contoh: 150000
        status: Boolean(form.status),
      };

      if (isEdit) {
        await api.put(`/admin/services/${service.id}`, payload);
        toast.success("Workshop service updated successfully");
      } else {
        await api.post("/admin/services", payload);
        toast.success("Workshop service created successfully");
      }

      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(
        getAxiosError(
          error,
          isEdit
            ? "Failed to update workshop service"
            : "Failed to create workshop service",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "block w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose?.();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-form-title"
        className="flex max-h-[94dvh] w-full min-w-0 flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:max-h-[90dvh] sm:max-w-xl sm:rounded-2xl"
      >
        {/* Header */}
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Wrench size={21} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h2
                id="service-form-title"
                className="text-base font-bold tracking-tight text-gray-900 sm:text-lg"
              >
                {isEdit ? "Edit Workshop Service" : "Add Workshop Service"}
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                {isEdit
                  ? "Update workshop service information."
                  : "Create a new workshop service."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
            <div className="space-y-5">
              {/* Service name */}
              <div>
                <label
                  htmlFor="service-name"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Service Name <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Tag
                    size={17}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="service-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Example: Engine Oil Change"
                    disabled={loading}
                    maxLength={150}
                    autoComplete="off"
                    required
                    className={`${inputClass} h-11 pl-10`}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-400">
                    Enter the workshop service name.
                  </p>

                  <span className="text-xs tabular-nums text-gray-400">
                    {form.name.length}/150
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="service-description"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Description
                  <span className="ml-1 font-normal text-gray-400">
                    (Optional)
                  </span>
                </label>

                <div className="relative">
                  <FileText
                    size={17}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-3.5 text-gray-400"
                  />

                  <textarea
                    id="service-description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe what is included in this service..."
                    disabled={loading}
                    rows={4}
                    maxLength={5000}
                    className={`${inputClass} resize-y py-3 pl-10 leading-6`}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-400">
                    Additional details about the service.
                  </p>

                  <span className="text-xs tabular-nums text-gray-400">
                    {form.description.length}/5000
                  </span>
                </div>
              </div>

              {/* Price */}
              <div>
                <label
                  htmlFor="service-price"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Service Price <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <CircleDollarSign size={18} aria-hidden="true" />
                  </div>

                  <span className="pointer-events-none absolute inset-y-0 left-10 flex items-center text-sm font-medium text-gray-500">
                    Rp
                  </span>

                  <input
                    id="service-price"
                    name="price"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0"
                    disabled={loading}
                    required
                    className={`${inputClass} h-11 pl-[4.25rem] font-medium tabular-nums`}
                  />
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Enter the service price in Indonesian Rupiah (IDR), for
                  example 150.000.
                </p>
              </div>

              {/* Status */}
              <div>
                <p className="mb-2 block text-sm font-semibold text-gray-800">
                  Service Status
                </p>

                <label
                  htmlFor="service-status"
                  className={[
                    "flex cursor-pointer items-center justify-between gap-4",
                    "rounded-xl border p-4 transition-colors",
                    form.status
                      ? "border-red-200 bg-red-50/60"
                      : "border-gray-200 bg-gray-50",
                    loading ? "cursor-not-allowed opacity-60" : "",
                  ].join(" ")}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        form.status
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-200 text-gray-500",
                      ].join(" ")}
                    >
                      <Check size={19} aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        Active Service
                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {form.status
                          ? "Available for service orders."
                          : "Hidden from service orders."}
                      </p>
                    </div>
                  </div>

                  <span className="relative inline-flex h-6 w-11 shrink-0">
                    <input
                      id="service-status"
                      name="status"
                      type="checkbox"
                      checked={form.status}
                      onChange={handleChange}
                      disabled={loading}
                      className="peer sr-only"
                    />

                    <span className="absolute inset-0 rounded-full bg-gray-300 transition-colors peer-checked:bg-red-600 peer-focus-visible:ring-4 peer-focus-visible:ring-red-500/20" />

                    <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/80 px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-28"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-40"
            >
              {loading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Check size={17} aria-hidden="true" />
              )}

              {loading
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                  ? "Update Service"
                  : "Create Service"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
