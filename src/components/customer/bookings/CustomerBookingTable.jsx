"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Car, Eye, FileText, Search } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";

const PER_PAGE = 10;

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700",
  },

  confirmed: {
    label: "Confirmed",
    className: "bg-blue-50 text-blue-700",
  },

  technician_confirmed: {
    label: "Technician Confirmed",
    className: "bg-green-50 text-green-700",
  },

  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700",
  },

  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-600",
  },
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusConfig(status) {
  return (
    STATUS_CONFIG[status] || {
      label: status || "-",
      className: "bg-gray-100 text-gray-600",
    }
  );
}

function getVehicleLabel(booking) {
  const vehicle = booking?.vehicle;

  if (!vehicle) {
    return "-";
  }

  const brand = vehicle.brand || "";
  const model = vehicle.model || "";
  const plate = vehicle.plat_nomor || vehicle.platNomor || "";

  const vehicleName = [brand, model].filter(Boolean).join(" ");

  if (vehicleName && plate) {
    return `${vehicleName} • ${plate}`;
  }

  return vehicleName || plate || "-";
}

function getBookingCode(booking) {
  return (
    booking?.booking_code ||
    booking?.bookingCode ||
    booking?.code ||
    `#${booking?.id || "-"}`
  );
}

export default function CustomerBookingTable() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    let active = true;

    const params = {
      page,
      per_page: PER_PAGE,
    };

    const trimmedSearch = search.trim();

    if (trimmedSearch) {
      params.search = trimmedSearch;
    }

    if (status) {
      params.status = status;
    }

    async function loadBookings() {
      setLoading(true);

      try {
        const response = await api.get("/customer/bookings", {
          params,
          signal: controller.signal,
        });

        if (!active || controller.signal.aborted) {
          return;
        }

        const responseData = response.data;

        setBookings(responseData?.data || []);
        setTotal(responseData?.meta?.total || 0);
        setTotalPages(Math.max(1, responseData?.meta?.total_pages || 1));
      } catch (error) {
        if (
          error?.code === "ERR_CANCELED" ||
          controller.signal.aborted ||
          !active
        ) {
          return;
        }

        const axiosError = getAxiosError(error);

        toast.error(axiosError.message);

        setBookings([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (active && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, search, status, refreshKey]);

  function handleSearchChange(event) {
    setSearch(event.target.value);
    setPage(1);
  }

  function handleStatusChange(event) {
    setStatus(event.target.value);
    setPage(1);
  }

  function handleResetFilter() {
    setSearch("");
    setStatus("");
    setPage(1);
  }

  function handleView(booking) {
    /*
     * Detail page akan kita buat pada tahap berikutnya.
     *
     * Untuk sementara arahkan berdasarkan id.
     */
    window.location.href = `/customer/bookings/${booking.id}`;
  }

  function handleRefresh() {
    setRefreshKey((current) => current + 1);
  }

  const columns = useMemo(
    () => [
      {
        key: "booking_code",
        label: "Booking",
        render: (booking) => {
          const statusConfig = getStatusConfig(booking.status);

          return (
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <CalendarDays size={18} strokeWidth={2} />
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">
                  {getBookingCode(booking)}
                </p>

                <span
                  className={[
                    "mt-1 inline-flex rounded-full px-2 py-0.5",
                    "text-[11px] font-semibold",
                    statusConfig.className,
                  ].join(" ")}
                >
                  {statusConfig.label}
                </span>
              </div>
            </div>
          );
        },
      },

      {
        key: "vehicle",
        label: "Vehicle",
        render: (booking) => {
          const vehicle = booking.vehicle;

          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <Car
                size={17}
                className="shrink-0 text-gray-400"
                strokeWidth={2}
              />

              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">
                  {getVehicleLabel(booking)}
                </p>

                {vehicle?.year ? (
                  <p className="mt-0.5 text-xs text-gray-500">{vehicle.year}</p>
                ) : null}
              </div>
            </div>
          );
        },
      },

      {
        key: "complaint",
        label: "Complaint",
        render: (booking) => (
          <div className="max-w-sm">
            <p className="line-clamp-2 text-sm text-gray-700">
              {booking.complaint || "-"}
            </p>
          </div>
        ),
      },

      {
        key: "scheduled_at",
        label: "Schedule",
        render: (booking) => (
          <div>
            <p className="font-medium text-gray-900">
              {formatDate(booking.scheduled_at)}
            </p>

            <p className="mt-0.5 text-xs text-gray-500">
              {formatDateTime(booking.scheduled_at).split(" ").slice(-1)[0] ||
                "-"}
            </p>
          </div>
        ),
      },

      {
        key: "created_at",
        label: "Created",
        render: (booking) => formatDate(booking.created_at),
      },
    ],
    [],
  );

  function renderActions(booking) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => handleView(booking)}
          aria-label={`View ${getBookingCode(booking)}`}
          title="View booking"
          className={[
            "inline-flex h-9 w-9 items-center justify-center",
            "rounded-lg text-gray-500",
            "transition-colors",
            "hover:bg-gray-100 hover:text-gray-900",
          ].join(" ")}
        >
          <Eye size={17} strokeWidth={2} />
        </button>
      </div>
    );
  }

  function renderMobile(booking) {
    const statusConfig = getStatusConfig(booking.status);

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <CalendarDays size={18} strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-gray-900">
                  {getBookingCode(booking)}
                </h3>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {getVehicleLabel(booking)}
                </p>
              </div>

              <span
                className={[
                  "shrink-0 rounded-full px-2.5 py-1",
                  "text-[11px] font-semibold",
                  statusConfig.className,
                ].join(" ")}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 p-3">
          <div className="flex items-start gap-2">
            <FileText
              size={16}
              className="mt-0.5 shrink-0 text-gray-400"
              strokeWidth={2}
            />

            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400">Complaint</p>

              <p className="mt-1 text-sm leading-5 text-gray-700">
                {booking.complaint || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs font-medium text-gray-400">Schedule</p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatDate(booking.scheduled_at)}
            </p>

            <p className="mt-0.5 text-xs text-gray-500">
              {formatDateTime(booking.scheduled_at).split(" ").slice(-1)[0] ||
                "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400">Created</p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatDate(booking.created_at)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => handleView(booking)}
            className={[
              "inline-flex h-9 items-center justify-center gap-2",
              "rounded-lg border border-gray-200",
              "px-3 text-sm font-medium text-gray-700",
              "transition-colors hover:bg-gray-50",
            ].join(" ")}
          >
            <Eye size={16} strokeWidth={2} />
            View Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            My Bookings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and manage your workshop service bookings.
          </p>
        </div>

        <a
          href="/customer/bookings/create"
          className={[
            "inline-flex items-center justify-center gap-2",
            "rounded-xl bg-red-600 px-4 py-2.5",
            "text-sm font-semibold text-white",
            "transition-colors hover:bg-red-700",
          ].join(" ")}
        >
          <CalendarDays size={18} strokeWidth={2} />
          New Booking
        </a>
      </div>

      {/* Filter */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search booking or complaint..."
              className={[
                "h-10 w-full rounded-lg border border-gray-200",
                "bg-white pl-10 pr-3",
                "text-sm text-gray-900",
                "outline-none transition",
                "placeholder:text-gray-400",
                "focus:border-red-500 focus:ring-2 focus:ring-red-100",
              ].join(" ")}
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={handleStatusChange}
            className={[
              "h-10 rounded-lg border border-gray-200",
              "bg-white px-3",
              "text-sm text-gray-700",
              "outline-none transition",
              "focus:border-red-500 focus:ring-2 focus:ring-red-100",
            ].join(" ")}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="technician_confirmed">Technician Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Reset */}
          {(search || status) && (
            <button
              type="button"
              onClick={handleResetFilter}
              className={[
                "h-10 rounded-lg border border-gray-200",
                "px-4 text-sm font-medium text-gray-600",
                "transition-colors hover:bg-gray-50",
              ].join(" ")}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">Booking List</h2>

            <p className="mt-0.5 text-sm text-gray-500">
              {total} booking{total === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className={[
              "rounded-lg border border-gray-200",
              "px-3 py-2 text-xs font-medium text-gray-600",
              "transition-colors hover:bg-gray-50",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            Refresh
          </button>
        </div>

        <DataTable
          columns={columns}
          data={bookings}
          rowKey="id"
          loading={loading}
          emptyMessage="No bookings found"
          emptyDescription={
            search || status
              ? "Try changing your search or filter."
              : "You do not have any service bookings yet."
          }
          emptyIcon={<CalendarDays size={24} strokeWidth={2} />}
          renderActions={renderActions}
          actionsLabel="Actions"
          renderMobile={renderMobile}
          className="rounded-none border-0 shadow-none"
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={loading}
        />
      </div>
    </div>
  );
}
