"use client";

import {
  Loader2,
  Save,
  Search,
  X,
  Wrench,
  Minus,
  Plus,
  Check,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getServiceList(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function isActiveService(service) {
  return (
    service?.status === true ||
    service?.status === 1 ||
    service?.status === "1" ||
    service?.status === "active"
  );
}

export default function ServiceOrderServiceForm({
  order,
  item,
  onClose,
  onSuccess,
}) {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [search, setSearch] = useState("");
  const [serviceId, setServiceId] = useState(
    item?.service_id ? String(item.service_id) : "",
  );
  const [quantity, setQuantity] = useState(String(item?.quantity || 1));

  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const requestIdRef = useRef(0);

  // Search service without blocking the entire modal.
  const loadServices = useCallback(
    async (keyword = "") => {
      const requestId = ++requestIdRef.current;

      setSearchLoading(true);
      setSearchError(false);

      try {
        const response = await api.get("/admin/services", {
          params: {
            search: keyword.trim() || undefined,
            page: 1,
            per_page: 10,
          },
        });

        // Ignore an outdated response when a newer search has started.
        if (requestId !== requestIdRef.current) return;

        const serviceList = getServiceList(response);
        const activeServices = serviceList.filter(isActiveService);

        setServices(activeServices);

        // Preserve the selected service even when it is absent
        // from the current search results.
        if (serviceId) {
          const selected = serviceList.find(
            (service) => Number(service.id) === Number(serviceId),
          );

          if (selected) {
            setSelectedService(selected);
          }
        }
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        setSearchError(true);
        toast.error(getAxiosError(error).message);
      } finally {
        if (requestId === requestIdRef.current) {
          setSearchLoading(false);
        }
      }
    },
    [serviceId],
  );

  // Debounce only the service list search.
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadServices(search);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, loadServices]);

  // Load the existing service for edit mode.
  useEffect(() => {
    if (!item?.service_id) return;

    let cancelled = false;

    async function loadCurrentService() {
      try {
        const response = await api.get("/admin/services", {
          params: {
            search: String(item.service_id),
            page: 1,
            per_page: 10,
          },
        });

        if (cancelled) return;

        const serviceList = getServiceList(response);
        const currentService = serviceList.find(
          (service) => Number(service.id) === Number(item.service_id),
        );

        if (currentService) {
          setSelectedService(currentService);
        }
      } catch {
        // Do not interrupt the form if the current service cannot be loaded.
      }
    }

    loadCurrentService();

    return () => {
      cancelled = true;
    };
  }, [item?.service_id]);

  const total = Number(selectedService?.price || 0) * Number(quantity || 0);

  function handleSelectService(service) {
    setServiceId(String(service.id));
    setSelectedService(service);
    setSearch("");
  }

  function handleQuantityChange(value) {
    if (value === "" || /^\d+$/.test(value)) {
      setQuantity(value);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!serviceId || !selectedService) {
      toast.error("Please select a service");
      return;
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isSafeInteger(parsedQuantity) || parsedQuantity <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }

    if (!item && !isActiveService(selectedService)) {
      toast.error("Selected workshop service is inactive");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        service_id: Number(serviceId),
        quantity: parsedQuantity,
      };

      const response = item
        ? await api.put(
            `/admin/service-orders/${order.id}/services/${item.id}`,
            payload,
          )
        : await api.post(`/admin/service-orders/${order.id}/services`, payload);

      toast.success(
        response.data?.message || "Service item saved successfully",
      );

      onSuccess?.();
    } catch (error) {
      toast.error(getAxiosError(error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div className="flex max-h-[95dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Wrench size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900">
                {item ? "Edit Service" : "Add Service"}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Search and select a workshop service
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
            {/* Service search */}
            <section>
              <label
                htmlFor="service_search"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Workshop Service
              </label>

              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="service_search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search service name..."
                  disabled={loading}
                  autoComplete="off"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Only this list changes to loading state */}
              <div className="relative mt-2 overflow-hidden rounded-xl border border-gray-200">
                {searchLoading && (
                  <div className="absolute right-3 top-3 z-10">
                    <Loader2 size={16} className="animate-spin text-red-600" />
                  </div>
                )}

                {searchError ? (
                  <div className="px-3 py-5 text-center">
                    <p className="text-sm text-red-600">
                      Failed to load services.
                    </p>
                    <button
                      type="button"
                      onClick={() => loadServices(search)}
                      className="mt-2 text-sm font-medium text-red-600 hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : services.length === 0 && searchLoading ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    Searching services...
                  </div>
                ) : services.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-gray-500">
                    No active services found.
                  </p>
                ) : (
                  <div
                    className={`max-h-52 divide-y divide-gray-100 overflow-y-auto transition-opacity ${
                      searchLoading ? "opacity-50" : "opacity-100"
                    }`}
                  >
                    {services.map((service) => {
                      const selected = Number(service.id) === Number(serviceId);

                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => handleSelectService(service)}
                          disabled={loading}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-gray-50 ${
                            selected ? "bg-red-50/70" : "bg-white"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-gray-800">
                              {service.name}
                            </span>

                            {service.category?.name && (
                              <span className="mt-0.5 block truncate text-xs text-gray-500">
                                {service.category.name}
                              </span>
                            )}
                          </span>

                          <span className="flex shrink-0 items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(service.price)}
                            </span>

                            {selected && (
                              <Check size={16} className="text-red-600" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <p className="mt-1.5 text-xs text-gray-400">
                Showing up to 10 matching services.
              </p>
            </section>

            {/* Selected service */}
            {selectedService && (
              <section className="rounded-xl border border-red-100 bg-red-50/50 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-red-600">
                      Selected service
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                      {selectedService.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Unit price: {formatCurrency(selectedService.price)}
                    </p>
                    {!isActiveService(selectedService) && (
                      <p className="mt-1 text-xs font-medium text-amber-600">
                        Inactive service
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setServiceId("");
                      setSelectedService(null);
                    }}
                    disabled={loading}
                    aria-label="Remove selected service"
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              </section>
            )}

            {/* Quantity */}
            <section>
              <label
                htmlFor="service_quantity"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Quantity
              </label>

              <div className="flex h-11 w-full items-center overflow-hidden rounded-xl border border-gray-200 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100">
                <button
                  type="button"
                  disabled={loading || Number(quantity || 0) <= 1}
                  onClick={() =>
                    setQuantity(String(Math.max(1, Number(quantity || 1) - 1)))
                  }
                  aria-label="Decrease quantity"
                  className="flex h-full w-11 shrink-0 items-center justify-center text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
                >
                  <Minus size={15} />
                </button>

                <input
                  id="service_quantity"
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => handleQuantityChange(event.target.value)}
                  onBlur={() => {
                    if (!quantity || Number(quantity) < 1) {
                      setQuantity("1");
                    }
                  }}
                  disabled={loading}
                  className="h-full min-w-0 flex-1 border-x border-gray-100 text-center text-sm font-semibold text-gray-900 outline-none"
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setQuantity(String(Number(quantity || 0) + 1))}
                  aria-label="Increase quantity"
                  className="flex h-full w-11 shrink-0 items-center justify-center text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
                >
                  <Plus size={15} />
                </button>
              </div>
            </section>

            {/* Subtotal */}
            <section className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Estimated subtotal</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatCurrency(selectedService?.price)} ×{" "}
                    {Number(quantity || 0)}
                  </p>
                </div>

                <p className="break-all text-right text-base font-bold text-gray-900 sm:text-lg">
                  {formatCurrency(total)}
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-white p-4 sm:flex-row sm:justify-end sm:px-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 w-full rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                searchLoading ||
                !serviceId ||
                !selectedService ||
                !quantity ||
                Number(quantity) <= 0 ||
                (!item && !isActiveService(selectedService))
              }
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}

              {loading ? "Saving..." : item ? "Save Changes" : "Add Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
