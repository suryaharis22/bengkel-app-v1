"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X, Wrench } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

const initialForm = {
  name: "",
  description: "",
  price: "",
  status: true,
};

export default function ServiceForm({
  open,
  service = null,
  onClose,
  onSuccess,
}) {
  const isEdit = Boolean(service);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (service) {
      setForm({
        name: service.name ?? "",
        description: service.description ?? "",
        price:
          service.price !== null && service.price !== undefined
            ? String(service.price)
            : "",
        status: Boolean(service.status),
      });

      return;
    }

    setForm(initialForm);
  }, [open, service]);

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

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();

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

    if (
      form.price === "" ||
      form.price === null ||
      Number.isNaN(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      toast.error("Valid service price is required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        description: description || null,
        price: Number(form.price),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-form-title"
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Wrench size={21} strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <h2
                id="service-form-title"
                className="text-lg font-semibold text-gray-900"
              >
                {isEdit ? "Edit Workshop Service" : "Add Workshop Service"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
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
            aria-label="Close"
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto px-6 py-6">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="service-name"
                  className="mb-2 block text-sm font-medium text-gray-800"
                >
                  Service Name
                  <span className="ml-1 text-red-500">*</span>
                </label>

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
                  className="block h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 caret-red-600 outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                />

                <div className="mt-1.5 flex justify-between gap-4">
                  <p className="text-xs text-gray-400">
                    Enter the name of the workshop service.
                  </p>

                  <span className="shrink-0 text-xs text-gray-400">
                    {form.name.length}/150
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="service-description"
                  className="mb-2 block text-sm font-medium text-gray-800"
                >
                  Description
                </label>

                <textarea
                  id="service-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter service description..."
                  disabled={loading}
                  rows={4}
                  maxLength={5000}
                  className="block w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 caret-red-600 outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                />

                <div className="mt-1.5 flex justify-between gap-4">
                  <p className="text-xs text-gray-400">
                    Optional service description.
                  </p>

                  <span className="shrink-0 text-xs text-gray-400">
                    {form.description.length}/5000
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="service-price"
                  className="mb-2 block text-sm font-medium text-gray-800"
                >
                  Service Price
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-sm font-medium text-gray-500">
                      Rp
                    </span>
                  </div>

                  <input
                    id="service-price"
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="1"
                    disabled={loading}
                    className="block h-11 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-sm font-medium text-gray-900 caret-red-600 outline-none transition-all placeholder:font-normal placeholder:text-gray-400 hover:border-gray-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                <p className="mt-1.5 text-xs text-gray-400">
                  Enter the base price for this service.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Service Status
                </label>

                <label
                  htmlFor="service-status"
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3.5 transition-all ${
                    form.status
                      ? "border-red-200 bg-red-50/60"
                      : "border-gray-200 bg-gray-50"
                  } ${
                    loading
                      ? "cursor-not-allowed opacity-60"
                      : "hover:border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        form.status
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <Check size={18} strokeWidth={2.5} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Active Service
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {form.status
                          ? "Available for service orders."
                          : "Hidden from service orders."}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      id="service-status"
                      name="status"
                      type="checkbox"
                      checked={form.status}
                      onChange={handleChange}
                      disabled={loading}
                      className="peer sr-only"
                    />

                    <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-red-600 peer-focus:ring-4 peer-focus:ring-red-500/20" />

                    <div className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50/80 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[100px]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[150px]"
            >
              {loading && <Loader2 size={17} className="animate-spin" />}

              {loading
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                  ? "Update Service"
                  : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
