"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Motorbike,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Trash2,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import DataTable from "../ui/DataTable";
import Pagination from "../ui/Pagination";
import VehicleDeleteModal from "@/components/vehicles/VehicleDeleteModal";
import VehicleFilter from "@/components/vehicles/VehicleFilter";
import VehicleTableSkeleton from "@/components/vehicles/VehicleTableSkeleton";

const PER_PAGE = 10;

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

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getVehicleType(vehicle) {
  if (vehicle?.type) {
    return vehicle.type;
  }

  return vehicle?.user_id !== null && vehicle?.user_id !== undefined
    ? "Customer"
    : "Guest";
}

function getCustomerName(vehicle) {
  const customer = vehicle?.customer;

  if (customer && typeof customer === "object") {
    return customer.name || customer.username || customer.email || "Customer";
  }

  if (vehicle?.user_id !== null && vehicle?.user_id !== undefined) {
    return "Customer";
  }

  return "Guest";
}

function getCustomerEmail(vehicle) {
  const customer = vehicle?.customer;

  if (customer && typeof customer === "object") {
    return customer.email || null;
  }

  return null;
}

function getBookingCount(vehicle) {
  const count = Number(vehicle?.booking_count);

  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function VehicleTypeBadge({ vehicle }) {
  const type = getVehicleType(vehicle);
  const isCustomer = type.toLowerCase() === "customer";

  return (
    <span
      className={[
        "inline-flex w-fit shrink-0 items-center gap-1.5",
        "whitespace-nowrap rounded-full px-2.5 py-1",
        "text-xs font-medium",
        isCustomer ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600",
      ].join(" ")}
    >
      {isCustomer ? (
        <UsersRound size={13} aria-hidden="true" />
      ) : (
        <Motorbike size={13} aria-hidden="true" />
      )}

      {type}
    </span>
  );
}

function VehicleMobileCard({ vehicle, onView, onEdit, onDelete }) {
  const customerName = getCustomerName(vehicle);
  const bookingCount = getBookingCount(vehicle);

  const details = [
    { label: "Owner", value: customerName },
    { label: "Services", value: bookingCount },
    { label: "Year", value: vehicle?.year || "-" },
    { label: "Color", value: vehicle?.color || "-" },
  ];

  return (
    <article className="w-full min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Motorbike size={20} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900">
              {vehicle?.plate_number || "-"}
            </h3>

            <p className="mt-0.5 truncate text-xs text-gray-500">
              {[vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") ||
                "-"}
            </p>
          </div>
        </div>

        <VehicleTypeBadge vehicle={vehicle} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="min-w-0 rounded-lg border border-gray-100 bg-gray-50/80 p-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
              {detail.label}
            </p>

            <p className="mt-1 truncate text-sm font-medium text-gray-800">
              {detail.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => onView?.(vehicle)}
          aria-label={`View vehicle ${vehicle?.plate_number || ""}`}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <Eye size={14} aria-hidden="true" />
          View
        </button>

        <button
          type="button"
          onClick={() => onEdit?.(vehicle)}
          aria-label={`Edit vehicle ${vehicle?.plate_number || ""}`}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <Edit size={14} aria-hidden="true" />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(vehicle)}
          aria-label={`Delete vehicle ${vehicle?.plate_number || ""}`}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-medium text-red-600 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <Trash2 size={14} aria-hidden="true" />
          Delete
        </button>
      </div>
    </article>
  );
}

export default function VehicleTable() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  const [deleteVehicle, setDeleteVehicle] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadVehicles() {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(PER_PAGE),
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const response = await api.get(`/admin/vehicles?${params.toString()}`);

        if (cancelled) return;

        const vehicleData = getVehiclesFromResponse(response);
        const meta = getMetaFromResponse(response);

        const responsePage = Number(meta?.page);
        const responseTotalPages = Number(meta?.total_pages);

        setVehicles(vehicleData);

        if (Number.isInteger(responsePage) && responsePage > 0) {
          setPage((current) =>
            current === responsePage ? current : responsePage,
          );
        }

        setTotalPages(
          Number.isInteger(responseTotalPages) && responseTotalPages > 0
            ? responseTotalPages
            : 1,
        );
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to fetch vehicles:", error);

        setVehicles([]);
        setTotalPages(1);

        toast.error(getAxiosError(error, "Failed to load vehicles."));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVehicles();

    return () => {
      cancelled = true;
    };
  }, [page, search, refreshKey]);

  const filteredVehicles = useMemo(() => {
    if (!type) return vehicles;

    return vehicles.filter(
      (vehicle) => getVehicleType(vehicle).toLowerCase() === type.toLowerCase(),
    );
  }, [vehicles, type]);

  const columns = useMemo(
    () => [
      {
        key: "vehicle",
        label: "Vehicle",
        render: (vehicle) => (
          <div className="flex min-w-[190px] items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Motorbike size={19} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p
                className="truncate text-sm font-semibold text-gray-900"
                title={vehicle?.plate_number || ""}
              >
                {vehicle?.plate_number || "-"}
              </p>

              <p className="mt-0.5 truncate text-xs text-gray-500">
                {[vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") ||
                  "-"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "owner",
        label: "Owner",
        render: (vehicle) => {
          const customerName = getCustomerName(vehicle);
          const customerEmail = getCustomerEmail(vehicle);

          return (
            <div className="min-w-[150px]">
              <p className="truncate text-sm font-medium text-gray-800">
                {customerName}
              </p>

              {customerEmail ? (
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {customerEmail}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        key: "type",
        label: "Type",
        render: (vehicle) => <VehicleTypeBadge vehicle={vehicle} />,
      },
      {
        key: "year",
        label: "Year",
        render: (vehicle) => (
          <span className="whitespace-nowrap text-sm text-gray-700">
            {vehicle?.year || "-"}
          </span>
        ),
      },
      {
        key: "color",
        label: "Color",
        render: (vehicle) => (
          <span className="whitespace-nowrap text-sm text-gray-700">
            {vehicle?.color || "-"}
          </span>
        ),
      },
      {
        key: "booking_count",
        label: "Services",
        render: (vehicle) => (
          <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
            {getBookingCount(vehicle)}
          </span>
        ),
      },
      {
        key: "created_at",
        label: "Created",
        render: (vehicle) => (
          <span className="whitespace-nowrap text-sm text-gray-500">
            {formatDate(vehicle?.created_at)}
          </span>
        ),
      },
    ],
    [],
  );

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleTypeChange(value) {
    setType(value);
  }

  function handleReset() {
    setSearch("");
    setType("");
    setPage(1);
  }

  function handleRefresh() {
    if (loading) return;

    setRefreshKey((current) => current + 1);
  }

  function getValidVehicleId(vehicle) {
    const vehicleId = Number(vehicle?.id);

    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      toast.error("Invalid vehicle ID.");
      return null;
    }

    return vehicleId;
  }

  function handleView(vehicle) {
    const vehicleId = getValidVehicleId(vehicle);

    if (vehicleId === null) return;

    router.push(`/admin/vehicles/${vehicleId}`);
  }

  function handleEdit(vehicle) {
    const vehicleId = getValidVehicleId(vehicle);

    if (vehicleId === null) return;

    router.push(`/admin/vehicles/${vehicleId}/edit`);
  }

  function handleDeleteClick(vehicle) {
    const vehicleId = getValidVehicleId(vehicle);

    if (vehicleId === null) return;

    setDeleteVehicle(vehicle);
  }

  async function handleDeleteConfirm() {
    if (!deleteVehicle?.id || deleting) return;

    try {
      setDeleting(true);

      await api.delete(`/admin/vehicles/${deleteVehicle.id}`);

      toast.success("Vehicle deleted successfully.");
      setDeleteVehicle(null);

      if (vehicles.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        setRefreshKey((current) => current + 1);
      }
    } catch (error) {
      console.error("Failed to delete vehicle:", error);

      toast.error(getAxiosError(error, "Failed to delete vehicle."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-5">
      {/* Page header */}
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Motorbike size={21} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                Vehicles
              </h1>

              <p className="mt-0.5 text-sm text-gray-500">
                Manage customer and guest vehicles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            <RefreshCw
              size={16}
              aria-hidden="true"
              className={loading ? "animate-spin" : ""}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/vehicles/create")}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 sm:flex-none"
          >
            <Plus size={17} aria-hidden="true" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="w-full min-w-0">
        <VehicleFilter
          search={search}
          type={type}
          onSearchChange={handleSearchChange}
          onTypeChange={handleTypeChange}
          onReset={handleReset}
        />
      </div>

      {/* Table and pagination */}
      <section className="w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Vehicle List
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              View and manage registered vehicles.
            </p>
          </div>

          <span className="inline-flex w-fit items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {filteredVehicles.length}{" "}
            {filteredVehicles.length === 1 ? "vehicle" : "vehicles"}
          </span>
        </div>

        <div className="w-full min-w-0">
          <DataTable
            columns={columns}
            data={filteredVehicles}
            rowKey={(vehicle) => vehicle.id}
            loading={loading}
            emptyMessage="No vehicles found"
            emptyDescription={
              search || type
                ? "Try adjusting your search or filter."
                : "There are no vehicles available yet."
            }
            emptyIcon={Motorbike}
            skeleton={<VehicleTableSkeleton />}
            renderMobile={(vehicle) => (
              <VehicleMobileCard
                vehicle={vehicle}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            )}
            renderActions={(vehicle) => (
              <div className="flex min-w-max items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => handleView(vehicle)}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  title="View vehicle"
                  aria-label={`View ${vehicle?.plate_number || "vehicle"}`}
                >
                  <Eye size={14} aria-hidden="true" />
                  View
                </button>

                <button
                  type="button"
                  onClick={() => handleEdit(vehicle)}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  title="Edit vehicle"
                  aria-label={`Edit ${vehicle?.plate_number || "vehicle"}`}
                >
                  <Edit size={14} aria-hidden="true" />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteClick(vehicle)}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 px-2.5 text-red-600 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  title="Delete vehicle"
                  aria-label={`Delete ${vehicle?.plate_number || "vehicle"}`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            )}
            actionsLabel="Actions"
            className="min-w-0"
          />
        </div>

        {!loading && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={loading}
            showPageInfo
          />
        )}
      </section>

      {/* Delete confirmation */}
      <VehicleDeleteModal
        open={Boolean(deleteVehicle)}
        vehicle={deleteVehicle}
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setDeleteVehicle(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
