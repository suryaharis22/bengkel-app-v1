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
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

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
    return (
      customer?.name || customer?.username || customer?.email || "Customer"
    );
  }

  if (vehicle?.user_id !== null && vehicle?.user_id !== undefined) {
    return "Customer";
  }

  return "Guest";
}

function getCustomerEmail(vehicle) {
  const customer = vehicle?.customer;

  if (customer && typeof customer === "object") {
    return customer?.email || null;
  }

  return null;
}

function getBookingCount(vehicle) {
  const count = Number(vehicle?.booking_count);

  if (!Number.isFinite(count)) {
    return 0;
  }

  return count;
}

function VehicleTypeBadge({ vehicle }) {
  const type = getVehicleType(vehicle);
  const isCustomer = type === "Customer";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-xs font-medium",
        isCustomer ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600",
      ].join(" ")}
    >
      {isCustomer ? <UsersRound size={13} /> : <Motorbike size={13} />}

      {type}
    </span>
  );
}

function VehicleMobileCard({ vehicle, onView, onEdit, onDelete }) {
  const customerName = getCustomerName(vehicle);
  const bookingCount = getBookingCount(vehicle);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Motorbike size={18} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {vehicle?.plate_number || "-"}
              </p>

              <p className="truncate text-xs text-gray-500">
                {vehicle?.brand || "-"} {vehicle?.model || ""}
              </p>
            </div>
          </div>
        </div>

        <VehicleTypeBadge vehicle={vehicle} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Owner
          </p>

          <p className="mt-1 truncate text-sm font-medium text-gray-800">
            {customerName}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Services
          </p>

          <p className="mt-1 text-sm font-medium text-gray-800">
            {bookingCount}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Year
          </p>

          <p className="mt-1 text-sm font-medium text-gray-800">
            {vehicle?.year || "-"}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Color
          </p>

          <p className="mt-1 truncate text-sm font-medium text-gray-800">
            {vehicle?.color || "-"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => onView?.(vehicle)}
          className={[
            "inline-flex h-9 items-center justify-center gap-1.5",
            "rounded-lg border border-gray-200 bg-white px-3",
            "text-xs font-medium text-gray-700",
            "transition hover:bg-gray-50",
          ].join(" ")}
        >
          <Eye size={14} />
          View
        </button>

        <button
          type="button"
          onClick={() => onEdit?.(vehicle)}
          className={[
            "inline-flex h-9 items-center justify-center gap-1.5",
            "rounded-lg border border-gray-200 bg-white px-3",
            "text-xs font-medium text-gray-700",
            "transition hover:bg-gray-50",
          ].join(" ")}
        >
          <Edit size={14} />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(vehicle)}
          className={[
            "inline-flex h-9 items-center justify-center gap-1.5",
            "rounded-lg border border-red-100 bg-red-50 px-3",
            "text-xs font-medium text-red-600",
            "transition hover:bg-red-100",
          ].join(" ")}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
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
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: String(page),
          per_page: String(PER_PAGE),
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const response = await api.get(`/admin/vehicles?${params.toString()}`);

        if (cancelled) {
          return;
        }

        const vehicleData = getVehiclesFromResponse(response);
        const meta = getMetaFromResponse(response);

        const responsePage = Number(meta?.page);
        const responseTotalPages = Number(meta?.total_pages);

        setVehicles(vehicleData);

        if (Number.isInteger(responsePage) && responsePage > 0) {
          setPage(responsePage);
        }

        setTotalPages(
          Number.isInteger(responseTotalPages) && responseTotalPages > 0
            ? responseTotalPages
            : 1,
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

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
    if (!type) {
      return vehicles;
    }

    return vehicles.filter((vehicle) => getVehicleType(vehicle) === type);
  }, [vehicles, type]);

  const columns = useMemo(
    () => [
      {
        key: "vehicle",
        label: "Vehicle",
        render: (vehicle) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Motorbike size={19} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {vehicle?.plate_number || "-"}
              </p>

              <p className="truncate text-xs text-gray-500">
                {vehicle?.brand || "-"} {vehicle?.model || ""}
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
          <span className="text-sm text-gray-700">{vehicle?.year || "-"}</span>
        ),
      },
      {
        key: "color",
        label: "Color",
        render: (vehicle) => (
          <span className="text-sm text-gray-700">{vehicle?.color || "-"}</span>
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
    setPage(1);
  }

  function handleReset() {
    setSearch("");
    setType("");
    setPage(1);
  }

  function handleRefresh() {
    if (loading) {
      return;
    }

    setRefreshKey((current) => current + 1);
  }

  function handleView(vehicle) {
    if (vehicle?.id === null || vehicle?.id === undefined) {
      toast.error("Vehicle ID not found.");
      return;
    }

    const vehicleId = Number(vehicle.id);

    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      toast.error("Invalid vehicle ID.");
      return;
    }

    router.push(`/admin/vehicles/${vehicleId}`);
  }

  function handleEdit(vehicle) {
    if (vehicle?.id === null || vehicle?.id === undefined) {
      toast.error("Vehicle ID not found.");
      return;
    }

    const vehicleId = Number(vehicle.id);

    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      toast.error("Invalid vehicle ID.");
      return;
    }

    router.push(`/admin/vehicles/${vehicleId}/edit`);
  }

  function handleDeleteClick(vehicle) {
    if (!vehicle?.id) {
      toast.error("Vehicle ID not found.");
      return;
    }

    setDeleteVehicle(vehicle);
  }

  async function handleDeleteConfirm() {
    if (!deleteVehicle?.id || deleting) {
      return;
    }

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
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vehicles</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage customer and guest vehicles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className={[
              "inline-flex h-10 items-center justify-center gap-2",
              "rounded-lg border border-gray-200 bg-white px-3",
              "text-sm font-medium text-gray-700 shadow-sm",
              "transition hover:bg-gray-50",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />

            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/vehicles/create")}
            className={[
              "inline-flex h-10 items-center justify-center gap-2",
              "rounded-lg bg-red-600 px-4",
              "text-sm font-medium text-white shadow-sm",
              "transition hover:bg-red-700",
            ].join(" ")}
          >
            <Plus size={17} />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* FILTER */}
      <VehicleFilter
        search={search}
        type={type}
        onSearchChange={handleSearchChange}
        onTypeChange={handleTypeChange}
        onReset={handleReset}
      />

      {/* TABLE */}
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
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => handleView(vehicle)}
              className={[
                "inline-flex h-8 items-center justify-center gap-1.5",
                "rounded-lg border border-gray-200 bg-white px-2.5",
                "text-xs font-medium text-gray-700",
                "transition hover:bg-gray-50",
              ].join(" ")}
              title="View vehicle"
            >
              <Eye size={14} />
              View
            </button>

            <button
              type="button"
              onClick={() => handleEdit(vehicle)}
              className={[
                "inline-flex h-8 items-center justify-center gap-1.5",
                "rounded-lg border border-gray-200 bg-white px-2.5",
                "text-xs font-medium text-gray-700",
                "transition hover:bg-gray-50",
              ].join(" ")}
              title="Edit vehicle"
            >
              <Edit size={14} />
              Edit
            </button>

            <button
              type="button"
              onClick={() => handleDeleteClick(vehicle)}
              className={[
                "inline-flex h-8 items-center justify-center",
                "rounded-lg border border-red-100 bg-red-50 px-2.5",
                "text-red-600",
                "transition hover:bg-red-100",
              ].join(" ")}
              title="Delete vehicle"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
        actionsLabel="Actions"
        className="overflow-hidden"
      />

      {/* PAGINATION */}
      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={loading}
          showPageInfo
        />
      )}

      {/* DELETE MODAL */}
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
