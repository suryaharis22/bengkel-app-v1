"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Motorbike,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import CustomerVehicleCard from "./CustomerVehicleCard";
import CustomerVehicleForm from "./CustomerVehicleForm";
import Pagination from "@/components/ui/Pagination";

const PER_PAGE = 20;

function getVehiclesFromResponse(response) {
  const data = response?.data;

  if (data?.success && Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.data)) {
    return data.data.data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

function getMetaFromResponse(response) {
  const data = response?.data;

  if (data?.success && data?.meta) {
    return data.meta;
  }

  if (data?.meta) {
    return data.meta;
  }

  if (data?.data?.meta) {
    return data.data.meta;
  }

  return {};
}

export default function CustomerVehicleList({
  onSelect = null,
  selectable = false,
}) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadVehicles = useCallback(
    async ({ showLoading = true } = {}) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const params = {
          page,
          per_page: PER_PAGE,
        };

        const trimmedSearch = search.trim();

        if (trimmedSearch) {
          params.search = trimmedSearch;
        }

        const response = await api.get("/customer/vehicles", {
          params,
        });

        const vehicleData = getVehiclesFromResponse(response);
        const meta = getMetaFromResponse(response);

        setVehicles(vehicleData);

        const responsePage = Number(meta?.page);
        const responseTotalPages = Number(meta?.total_pages);

        if (
          Number.isInteger(responsePage) &&
          responsePage > 0 &&
          responsePage !== page
        ) {
          setPage(responsePage);
        }

        setTotalPages(
          Number.isInteger(responseTotalPages) && responseTotalPages > 0
            ? responseTotalPages
            : 1,
        );
      } catch (error) {
        console.error("Failed to fetch customer vehicles:", error);

        setVehicles([]);
        setTotalPages(1);

        toast.error(getAxiosError(error, "Failed to load your vehicles."));
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [page, search],
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchVehicles() {
      if (!cancelled) {
        await loadVehicles();
      }
    }

    fetchVehicles();

    return () => {
      cancelled = true;
    };
  }, [loadVehicles]);

  function handleVehicleSelect(vehicle) {
    if (!selectable) {
      return;
    }

    onSelect?.(vehicle);
  }

  function handleCreate() {
    setSelectedVehicle(null);
    setFormOpen(true);
  }

  function handleEdit(vehicle) {
    setSelectedVehicle(vehicle);
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setSelectedVehicle(null);
  }

  function handleFormSuccess(vehicle) {
    handleCloseForm();

    if (!vehicle) {
      loadVehicles({ showLoading: false });
      return;
    }

    setVehicles((current) => {
      const exists = current.some((item) => item.id === vehicle.id);

      if (exists) {
        return current.map((item) => (item.id === vehicle.id ? vehicle : item));
      }

      return [vehicle, ...current];
    });

    loadVehicles({ showLoading: false });
  }

  function handleDelete(vehicle) {
    if (!vehicle?.id) {
      return;
    }

    setSelectedVehicle(vehicle);
    setDeleteOpen(true);
  }

  function handleCloseDelete() {
    if (deleting) {
      return;
    }

    setDeleteOpen(false);
    setSelectedVehicle(null);
  }

  async function handleConfirmDelete() {
    if (!selectedVehicle?.id || deleting) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete(`/customer/vehicles/${selectedVehicle.id}`);

      const deletedVehicleId = selectedVehicle.id;

      setVehicles((current) =>
        current.filter((vehicle) => vehicle.id !== deletedVehicleId),
      );

      setDeleteOpen(false);
      setSelectedVehicle(null);

      toast.success("Vehicle deleted successfully.");

      if (vehicles.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        await loadVehicles({ showLoading: false });
      }
    } catch (error) {
      console.error("Failed to delete customer vehicle:", error);

      toast.error(getAxiosError(error, "Failed to delete vehicle."));
    } finally {
      setDeleting(false);
    }
  }

  function handleSearchChange(event) {
    const value = event.target.value;

    setSearch(value);
    setPage(1);
  }

  function handleClearSearch() {
    setSearch("");
    setPage(1);
  }

  function handleRefresh() {
    if (loading) {
      return;
    }

    loadVehicles();
  }

  function handlePageChange(nextPage) {
    if (loading) {
      return;
    }

    const normalizedPage = Number(nextPage);

    if (
      !Number.isInteger(normalizedPage) ||
      normalizedPage < 1 ||
      normalizedPage > totalPages
    ) {
      return;
    }

    setPage(normalizedPage);
  }

  const hasSearch = search.trim().length > 0;

  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
              My Vehicles
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage the vehicles registered to your account.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className={[
                "inline-flex h-10 items-center justify-center gap-2",
                "rounded-lg border border-gray-200",
                "bg-white px-3 text-sm font-medium text-gray-700",
                "shadow-sm transition-colors hover:bg-gray-50",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />

              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleCreate}
              className={[
                "inline-flex h-10 items-center justify-center gap-2",
                "rounded-lg bg-red-600 px-4",
                "text-sm font-semibold text-white",
                "shadow-sm transition-colors hover:bg-red-700",
              ].join(" ")}
            >
              <Plus size={17} />
              Add Vehicle
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative max-w-xl">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search plate, brand, or model..."
              className={[
                "h-10 w-full rounded-lg border border-gray-300",
                "bg-white pl-10 pr-10 text-sm text-gray-900",
                "outline-none transition",
                "placeholder:text-gray-400",
                "focus:border-red-500 focus:ring-2 focus:ring-red-100",
              ].join(" ")}
            />

            {hasSearch ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gray-200" />

                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-gray-200" />

                    <div className="h-3 w-24 rounded bg-gray-200" />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="h-3 w-full rounded bg-gray-200" />

                  <div className="h-3 w-3/4 rounded bg-gray-200" />
                </div>

                <div className="mt-5 flex gap-2">
                  <div className="h-9 flex-1 rounded-lg bg-gray-200" />

                  <div className="h-9 w-20 rounded-lg bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* EMPTY */}
        {!loading && vehicles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 shadow-sm">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Motorbike size={26} strokeWidth={2} />
              </div>

              <h3 className="mt-4 text-base font-semibold text-gray-900">
                {hasSearch ? "No vehicles found" : "No vehicles registered"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {hasSearch
                  ? "Try adjusting your search."
                  : "Add your vehicle first before creating a service booking."}
              </p>

              {hasSearch ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className={[
                    "mt-5 inline-flex items-center justify-center gap-2",
                    "rounded-lg border border-gray-200 bg-white px-4 py-2.5",
                    "text-sm font-semibold text-gray-700",
                    "transition-colors hover:bg-gray-50",
                  ].join(" ")}
                >
                  <X size={17} />
                  Clear Search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreate}
                  className={[
                    "mt-5 inline-flex items-center justify-center gap-2",
                    "rounded-lg bg-red-600 px-4 py-2.5",
                    "text-sm font-semibold text-white",
                    "transition-colors hover:bg-red-700",
                  ].join(" ")}
                >
                  <Plus size={17} />
                  Add Vehicle
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* VEHICLE LIST */}
        {!loading && vehicles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((vehicle) => (
                <CustomerVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  selectable={selectable}
                  onSelect={handleVehicleSelect}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disabled={loading}
              showPageInfo
            />
          </>
        ) : null}

        {/* VEHICLE FORM */}
        {formOpen ? (
          <CustomerVehicleForm
            open={formOpen}
            vehicle={selectedVehicle}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
          />
        ) : null}
      </div>

      {/* DELETE MODAL */}
      {deleteOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseDelete();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-vehicle-title"
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Trash2 size={21} />
                </div>

                <div>
                  <h2
                    id="delete-vehicle-title"
                    className="text-lg font-bold text-gray-900"
                  >
                    Delete Vehicle
                  </h2>

                  <p className="mt-0.5 text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDelete}
                disabled={deleting}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-red-600 shadow-sm">
                    <Motorbike size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {selectedVehicle?.plate_number || "-"}
                    </p>

                    <p className="mt-0.5 truncate text-sm text-gray-500">
                      {[selectedVehicle?.brand, selectedVehicle?.model]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <p>
                  Are you sure you want to delete this vehicle? All related
                  vehicle data may no longer be available.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseDelete}
                disabled={deleting}
                className={[
                  "inline-flex h-10 items-center justify-center",
                  "rounded-lg border border-gray-200 bg-white px-4",
                  "text-sm font-semibold text-gray-700",
                  "transition-colors hover:bg-gray-50",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                ].join(" ")}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className={[
                  "inline-flex h-10 items-center justify-center gap-2",
                  "rounded-lg bg-red-600 px-4",
                  "text-sm font-semibold text-white",
                  "transition-colors hover:bg-red-700",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                ].join(" ")}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Vehicle
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
