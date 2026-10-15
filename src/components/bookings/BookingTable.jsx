"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Eye,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";

import BookingFilter from "@/components/bookings/BookingFilter";
import BookingTableSkeleton from "@/components/bookings/BookingTableSkeleton";
import BookingStatusModal from "@/components/bookings/BookingStatusModal";
import BookingDetailModal from "@/components/bookings/BookingDetailModal";

import { ViewPlateNumber } from "@/utils/formatPlateNumber";

const PER_PAGE = 10;

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status) {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    technician_confirmed: "Technician Confirmed",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  return labels[status] || status || "-";
}

function getStatusClass(status) {
  const classes = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-green-100 text-green-700",
    technician_confirmed: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
  };

  return classes[status] || "bg-gray-100 text-gray-600";
}

function getCustomerType(booking) {
  if (booking?.customer_id !== null && booking?.customer_id !== undefined) {
    return "registered";
  }

  return "guest";
}

function getCustomerTypeLabel(type) {
  return type === "registered" ? "Registered" : "Guest";
}

function getCustomerTypeClass(type) {
  return type === "registered"
    ? "bg-blue-50 text-blue-700"
    : "bg-purple-50 text-purple-700";
}

function getCustomerName(booking) {
  return (
    booking?.customer_name ||
    booking?.customer?.username ||
    booking?.customer?.name ||
    "-"
  );
}

function getCustomerPhone(booking) {
  return (
    booking?.customer_phone ||
    booking?.customer?.no_hp ||
    booking?.customer?.phone ||
    "-"
  );
}

function getVehicle(booking) {
  return booking?.vehicle || null;
}

function getVehiclePlate(booking) {
  const vehicle = getVehicle(booking);

  const plate =
    vehicle?.plate_number || vehicle?.plat_nomor || vehicle?.plate || "";

  if (!plate) {
    return "-";
  }

  return ViewPlateNumber(plate);
}

function getVehicleName(booking) {
  const vehicle = getVehicle(booking);

  const name = [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ");

  return name || "-";
}

function getMetaTotal(meta) {
  const value =
    meta?.total ?? meta?.total_items ?? meta?.totalItems ?? meta?.count ?? 0;

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function getMetaTotalPages(meta, total) {
  const value =
    meta?.total_pages ?? meta?.totalPages ?? meta?.last_page ?? meta?.lastPage;

  if (value !== undefined && value !== null) {
    const number = Number(value);

    if (Number.isFinite(number) && number > 0) {
      return Math.max(1, Math.ceil(number));
    }
  }

  if (total <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(total / PER_PAGE));
}

function getBookingList(response) {
  const responseData = response?.data;

  if (Array.isArray(responseData?.data?.data)) {
    return responseData.data.data;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData)) {
    return responseData;
  }

  return [];
}

function getBookingMeta(response) {
  const responseData = response?.data;

  if (responseData?.meta && typeof responseData.meta === "object") {
    return responseData.meta;
  }

  if (responseData?.data?.meta && typeof responseData.data.meta === "object") {
    return responseData.data.meta;
  }

  return {};
}

function getApiErrorMessage(error, fallback) {
  const axiosError = getAxiosError(error);

  if (typeof axiosError === "string" && axiosError.trim()) {
    return axiosError;
  }

  if (
    axiosError &&
    typeof axiosError === "object" &&
    typeof axiosError.message === "string" &&
    axiosError.message.trim()
  ) {
    return axiosError.message;
  }

  if (
    typeof error?.response?.data?.message === "string" &&
    error.response.data.message.trim()
  ) {
    return error.response.data.message;
  }

  return fallback;
}

export default function BookingTable() {
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [customerType, setCustomerType] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusAction, setStatusAction] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    let active = true;

    async function loadBookings() {
      setLoading(true);

      const params = {
        page,
        per_page: PER_PAGE,
      };

      const safeSearch = search.trim();

      if (safeSearch) {
        params.search = safeSearch;
      }

      if (status) {
        params.status = status;
      }

      if (customerType) {
        params.customer_type = customerType;
      }

      try {
        const response = await api.get("/admin/bookings", {
          params,
          signal: controller.signal,
        });

        if (!active || controller.signal.aborted) {
          return;
        }

        const data = getBookingList(response);
        const meta = getBookingMeta(response);

        const nextTotal = getMetaTotal(meta);
        const nextTotalPages = getMetaTotalPages(meta, nextTotal);

        setBookings(data);
        setTotal(nextTotal);
        setTotalPages(nextTotalPages);

        if (page > nextTotalPages) {
          setPage(nextTotalPages);
        }
      } catch (error) {
        if (
          error?.code === "ERR_CANCELED" ||
          controller.signal.aborted ||
          !active
        ) {
          return;
        }

        toast.error(getApiErrorMessage(error, "Failed to load bookings."));

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
  }, [page, search, status, customerType, refreshKey]);

  function handleSearchChange(value) {
    setSearch(typeof value === "string" ? value : "");
    setPage(1);
  }

  function handleStatusChange(value) {
    setStatus(typeof value === "string" ? value : "");
    setPage(1);
  }

  function handleCustomerTypeChange(value) {
    setCustomerType(typeof value === "string" ? value : "");
    setPage(1);
  }

  function handleResetFilter() {
    setSearch("");
    setStatus("");
    setCustomerType("");
    setPage(1);
  }

  async function handleOpenDetail(booking) {
    if (!booking?.id) {
      return;
    }

    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedBooking(null);

    try {
      const response = await api.get(`/admin/bookings/${booking.id}`);

      const responseData = response?.data;

      const detail =
        responseData?.data?.data ||
        responseData?.data ||
        responseData?.booking ||
        null;

      setSelectedBooking(detail);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load booking detail."));

      setDetailOpen(false);
      setSelectedBooking(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleCloseDetail() {
    if (detailLoading) {
      return;
    }

    setDetailOpen(false);
    setSelectedBooking(null);
  }

  function handleOpenStatus(booking, action) {
    if (!booking?.id || !action) {
      return;
    }

    setStatusTarget(booking);
    setStatusAction(action);
  }

  function handleCloseStatus() {
    if (statusLoading) {
      return;
    }

    setStatusTarget(null);
    setStatusAction(null);
  }

  async function handleConfirmStatus(payload = {}) {
    if (!statusTarget?.id || !statusAction || statusLoading) {
      return;
    }

    setStatusLoading(true);

    try {
      let requestBody = {};

      if (statusAction === "confirm") {
        const technicianId = Number(payload?.technician_id);

        if (!Number.isInteger(technicianId) || technicianId <= 0) {
          toast.error("Please select a valid technician.");

          return;
        }

        requestBody = {
          technician_id: technicianId,
        };
      }

      if (typeof payload?.notes === "string" && payload.notes.trim()) {
        requestBody.notes = payload.notes.trim();
      }

      await api.post(
        `/admin/bookings/${statusTarget.id}/${statusAction}`,
        requestBody,
      );

      const messages = {
        confirm: "Booking confirmed successfully.",
        reject: "Booking rejected successfully.",
        cancel: "Booking cancelled successfully.",
      };

      toast.success(
        messages[statusAction] || "Booking status updated successfully.",
      );

      setStatusTarget(null);
      setStatusAction(null);

      setRefreshKey((current) => current + 1);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, `Failed to ${statusAction} booking.`),
      );
    } finally {
      setStatusLoading(false);
    }
  }

  function handleRefresh() {
    if (loading) {
      return;
    }

    setRefreshKey((current) => current + 1);
  }

  const columns = useMemo(
    () => [
      {
        key: "number",
        label: "#",
        headerClassName: "w-16",
        cellClassName: "text-gray-500",
        render: (_, index) => (page - 1) * PER_PAGE + index + 1,
      },
      {
        key: "booking_number",
        label: "Booking",
        render: (booking) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">
              {booking?.booking_number || "-"}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {formatDateTime(booking?.created_at)}
            </p>
          </div>
        ),
      },
      {
        key: "customer",
        label: "Customer",
        render: (booking) => {
          const type = getCustomerType(booking);

          return (
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">
                {getCustomerName(booking)}
              </p>

              <div className="mt-1 flex min-w-0 items-center gap-2">
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${getCustomerTypeClass(
                    type,
                  )}`}
                >
                  {type === "registered" ? (
                    <UserRound size={11} />
                  ) : (
                    <UsersRound size={11} />
                  )}

                  {getCustomerTypeLabel(type)}
                </span>

                <span className="truncate text-xs text-gray-500">
                  {getCustomerPhone(booking)}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "vehicle",
        label: "Vehicle",
        render: (booking) => (
          <div className="min-w-0">
            <p className="font-medium text-gray-900">
              {getVehiclePlate(booking)}
            </p>

            <p className="mt-1 truncate text-xs text-gray-500">
              {getVehicleName(booking)}
            </p>
          </div>
        ),
      },
      {
        key: "scheduled_at",
        label: "Schedule",
        render: (booking) => (
          <p className="font-medium text-gray-900">
            {formatDateTime(booking?.scheduled_at)}
          </p>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (booking) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
              booking?.status,
            )}`}
          >
            {getStatusLabel(booking?.status)}
          </span>
        ),
      },
    ],
    [page],
  );

  function renderActions(booking) {
    const canConfirm = booking?.status === "pending";

    const canReject = booking?.status === "pending";

    const canCancel =
      booking?.status === "pending" || booking?.status === "confirmed";

    return (
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => handleOpenDetail(booking)}
          title="View booking"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        >
          <Eye size={15} />
        </button>
        {booking?.service_order?.id && (
          <button
            type="button"
            onClick={() =>
              router.push(`/admin/service-orders/${booking.service_order.id}`)
            }
            title="View service order"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
          >
            <ClipboardList size={15} />
          </button>
        )}

        {canConfirm && (
          <button
            type="button"
            onClick={() => handleOpenStatus(booking, "confirm")}
            title="Confirm booking"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 transition hover:bg-green-50 hover:text-green-700"
          >
            <CheckCircle2 size={15} />
          </button>
        )}

        {canReject && (
          <button
            type="button"
            onClick={() => handleOpenStatus(booking, "reject")}
            title="Reject booking"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 hover:text-red-700"
          >
            <XCircle size={15} />
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            onClick={() => handleOpenStatus(booking, "cancel")}
            title="Cancel booking"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50 hover:text-amber-700"
          >
            <X size={15} />
          </button>
        )}
      </div>
    );
  }

  function renderMobile(booking, index) {
    const rowNumber = (page - 1) * PER_PAGE + index + 1;

    const customerType = getCustomerType(booking);

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <CalendarDays size={18} />
            </div>

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-xs text-gray-400">
                  #{rowNumber}
                </span>

                <h3 className="truncate text-sm font-semibold text-gray-900">
                  {booking?.booking_number || "-"}
                </h3>
              </div>

              <p className="mt-1 truncate text-xs text-gray-500">
                {getCustomerName(booking)}
              </p>

              <span
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${getCustomerTypeClass(
                  customerType,
                )}`}
              >
                {customerType === "registered" ? (
                  <UserRound size={11} />
                ) : (
                  <UsersRound size={11} />
                )}

                {getCustomerTypeLabel(customerType)}
              </span>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
              booking?.status,
            )}`}
          >
            {getStatusLabel(booking?.status)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs text-gray-400">Vehicle</p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {getVehiclePlate(booking)}
            </p>

            <p className="mt-1 truncate text-xs text-gray-500">
              {getVehicleName(booking)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400">Schedule</p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {formatDateTime(booking?.scheduled_at)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-400">Phone</p>

            <p className="mt-1 text-sm text-gray-700">
              {getCustomerPhone(booking)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400">Created</p>

            <p className="mt-1 text-sm text-gray-700">
              {formatDateTime(booking?.created_at)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => handleOpenDetail(booking)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Eye size={15} />
            View
          </button>
          {booking?.service_order?.id && (
            <button
              type="button"
              onClick={() =>
                router.push(`/admin/service-orders/${booking.service_order.id}`)
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-blue-200 px-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
            >
              <ClipboardList size={15} />
              Service Order
            </button>
          )}

          {booking?.status === "pending" && (
            <>
              <button
                type="button"
                onClick={() => handleOpenStatus(booking, "confirm")}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-green-200 px-3 text-sm font-medium text-green-700 transition hover:bg-green-50"
              >
                <CheckCircle2 size={15} />
                Confirm
              </button>

              <button
                type="button"
                onClick={() => handleOpenStatus(booking, "reject")}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <XCircle size={15} />
                Reject
              </button>
            </>
          )}

          {(booking?.status === "pending" ||
            booking?.status === "confirmed") && (
            <button
              type="button"
              onClick={() => handleOpenStatus(booking, "cancel")}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-200 px-3 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <CalendarDays size={22} />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900">Bookings</h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage registered customer and guest service bookings.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin/bookings/create")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
        >
          <Plus size={18} />
          Add Booking
        </button>
      </div>

      <BookingFilter
        search={search}
        status={status}
        customerType={customerType}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onCustomerTypeChange={handleCustomerTypeChange}
        onReset={handleResetFilter}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Booking List
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {total} booking
              {total === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <DataTable
          columns={columns}
          data={bookings}
          rowKey="id"
          loading={loading}
          skeleton={<BookingTableSkeleton />}
          emptyMessage="No bookings found"
          emptyDescription={
            search || status || customerType
              ? "There are no bookings matching the current filters."
              : "No bookings have been created yet."
          }
          emptyIcon={<Search size={24} />}
          renderActions={renderActions}
          actionsLabel="Actions"
          renderMobile={renderMobile}
          className="rounded-none border-0 shadow-none"
          tableClassName="min-w-[1150px]"
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={loading}
        />
      </div>

      <BookingDetailModal
        open={detailOpen}
        booking={selectedBooking}
        loading={detailLoading}
        onClose={handleCloseDetail}
      />

      <BookingStatusModal
        open={Boolean(statusTarget)}
        booking={statusTarget}
        action={statusAction}
        loading={statusLoading}
        onClose={handleCloseStatus}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
