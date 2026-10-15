"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Eye,
  RefreshCw,
  RotateCcw,
  Search,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";

const PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "in_progress", label: "Sedang Dikerjakan" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "Semua Pembayaran" },
  { value: "unpaid", label: "Belum Dibayar" },
  { value: "partial", label: "Sebagian" },
  { value: "paid", label: "Lunas" },
  { value: "refunded", label: "Refund" },
];

const STATUS_LABELS = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  in_progress: "Sedang Dikerjakan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const PAYMENT_STATUS_LABELS = {
  unpaid: "Belum Dibayar",
  partial: "Sebagian",
  paid: "Lunas",
  refunded: "Refund",
};

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-600/20",
  in_progress: "bg-violet-50 text-violet-700 ring-violet-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-red-50 text-red-700 ring-red-600/20",
};

const PAYMENT_STATUS_STYLES = {
  unpaid: "bg-amber-50 text-amber-700 ring-amber-600/20",
  partial: "bg-orange-50 text-orange-700 ring-orange-600/20",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  refunded: "bg-gray-100 text-gray-700 ring-gray-500/20",
};

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCurrency(value) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function getBooking(order) {
  return (
    order?.booking ?? order?.service_booking ?? order?.serviceBooking ?? {}
  );
}

function getCustomerName(order) {
  const booking = getBooking(order);
  const customer = booking?.customer ?? order?.customer;

  return (
    customer?.username ||
    customer?.name ||
    booking?.customer_name ||
    order?.customer_name ||
    "-"
  );
}

function getVehicle(order) {
  const booking = getBooking(order);

  return booking?.vehicle ?? order?.vehicle ?? null;
}

function getVehicleName(order) {
  const vehicle = getVehicle(order);

  if (!vehicle) return "-";

  return (
    [vehicle.brand, vehicle.model].filter(Boolean).join(" ") ||
    vehicle.plate_number ||
    "-"
  );
}

function getPlateNumber(order) {
  return getVehicle(order)?.plate_number || "-";
}

function getOrderNumber(order) {
  return order?.order_number || `SO-${order?.id ?? "-"}`;
}

function getBookingNumber(order) {
  const booking = getBooking(order);

  return (
    booking?.booking_number ||
    order?.booking_number ||
    (booking?.id != null ? `#${booking.id}` : "-")
  );
}

function getScheduledAt(order) {
  const booking = getBooking(order);

  return booking?.scheduled_at ?? order?.scheduled_at ?? null;
}

function getComplaint(order) {
  const booking = getBooking(order);

  return booking?.complaint ?? order?.complaint ?? "";
}

function getStatusBadge(status) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        STATUS_STYLES[status] || "bg-gray-50 text-gray-600 ring-gray-500/20"
      }`}
    >
      {STATUS_LABELS[status] || status || "-"}
    </span>
  );
}

function getPaymentStatusBadge(status) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        PAYMENT_STATUS_STYLES[status] ||
        "bg-gray-50 text-gray-600 ring-gray-500/20"
      }`}
    >
      {PAYMENT_STATUS_LABELS[status] || status || "-"}
    </span>
  );
}

function normalizeOrderResponse(payload) {
  const result = payload?.data;

  const orders = Array.isArray(result)
    ? result
    : Array.isArray(result?.data)
      ? result.data
      : [];

  const meta = payload?.meta ?? result?.meta ?? {};

  return {
    orders,
    meta: {
      current_page: Number(meta.current_page ?? meta.page ?? 1),
      per_page: Number(meta.per_page ?? PER_PAGE),
      total_items: Number(meta.total_items ?? meta.total ?? orders.length),
      total_pages: Number(meta.total_pages ?? 1),
    },
  };
}

export default function TechnicianServiceOrderTable() {
  const router = useRouter();

  const [serviceOrders, setServiceOrders] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: PER_PAGE,
    total_items: 0,
    total_pages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [page, setPage] = useState(1);

  const fetchServiceOrders = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const params = {
          page,
          per_page: PER_PAGE,
        };

        const keyword = search.trim();

        if (keyword) {
          params.search = keyword;
        }

        if (status !== "all") {
          params.status = status;
        }

        const response = await api.get("/technician/service-orders", {
          params,
        });

        const payload = response?.data;

        if (payload?.success === false) {
          throw new Error(
            payload?.message || "Gagal mengambil daftar service order.",
          );
        }

        const result = normalizeOrderResponse(payload);

        setServiceOrders(result.orders);
        setMeta(result.meta);
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Gagal mengambil daftar service order.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, status],
  );

  useEffect(() => {
    fetchServiceOrders();
  }, [fetchServiceOrders]);

  const filteredOrders = useMemo(() => {
    if (paymentStatus === "all") {
      return serviceOrders;
    }

    return serviceOrders.filter(
      (order) => order?.payment_status === paymentStatus,
    );
  }, [serviceOrders, paymentStatus]);

  const hasFilter =
    search.trim() !== "" || status !== "all" || paymentStatus !== "all";

  const handleResetFilters = () => {
    setSearch("");
    setStatus("all");
    setPaymentStatus("all");
    setPage(1);
  };

  const columns = [
    {
      key: "order_number",
      label: "Nomor Service Order",
      render: (order) => (
        <div className="min-w-36">
          <p className="font-semibold text-gray-900">{getOrderNumber(order)}</p>
          <p className="mt-1 text-xs text-gray-500">
            Booking: {getBookingNumber(order)}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Pelanggan",
      render: (order) => (
        <span className="text-sm text-gray-700">{getCustomerName(order)}</span>
      ),
    },
    {
      key: "vehicle",
      label: "Kendaraan",
      render: (order) => (
        <div className="min-w-36">
          <p className="text-sm font-medium text-gray-800">
            {getVehicleName(order)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{getPlateNumber(order)}</p>
        </div>
      ),
    },
    {
      key: "scheduled_at",
      label: "Jadwal Booking",
      render: (order) => (
        <span className="whitespace-nowrap text-sm text-gray-600">
          {formatDate(getScheduledAt(order))}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status Pekerjaan",
      render: (order) => getStatusBadge(order?.status),
    },
    {
      key: "payment_status",
      label: "Pembayaran",
      render: (order) => (
        <div className="min-w-28 space-y-1">
          {getPaymentStatusBadge(order?.payment_status)}
          <p className="text-xs text-gray-500">
            {formatCurrency(order?.grand_total)}
          </p>
        </div>
      ),
    },
  ];

  const handleOpenDetail = (order) => {
    if (!order?.id) {
      toast.error("Service order tidak ditemukan.");
      return;
    }

    router.push(`/teknisi/service-orders/${order.id}`);
  };

  const renderActions = (order) => (
    <button
      type="button"
      onClick={() => handleOpenDetail(order)}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
    >
      <Eye size={16} />
      Detail
    </button>
  );

  const renderMobile = (order) => (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{getOrderNumber(order)}</p>
          <p className="mt-1 text-xs text-gray-500">
            Booking: {getBookingNumber(order)}
          </p>
        </div>

        {getStatusBadge(order?.status)}
      </div>

      <div className="space-y-2 text-sm">
        <p className="text-gray-700">
          <span className="text-gray-500">Pelanggan:</span>{" "}
          {getCustomerName(order)}
        </p>

        <p className="text-gray-700">
          <span className="text-gray-500">Kendaraan:</span>{" "}
          {getVehicleName(order)}
        </p>

        <p className="text-gray-700">
          <span className="text-gray-500">Nomor Polisi:</span>{" "}
          {getPlateNumber(order)}
        </p>

        <p className="text-gray-700">
          <span className="text-gray-500">Jadwal:</span>{" "}
          {formatDate(getScheduledAt(order))}
        </p>

        {getComplaint(order) && (
          <p className="text-gray-700">
            <span className="text-gray-500">Keluhan:</span>{" "}
            {getComplaint(order)}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">Pembayaran:</span>
          {getPaymentStatusBadge(order?.payment_status)}
        </div>

        <p className="text-gray-700">
          <span className="text-gray-500">Total:</span>{" "}
          {formatCurrency(order?.grand_total)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => handleOpenDetail(order)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        <Eye size={16} />
        Lihat Detail
      </button>
    </div>
  );

  const totalPages = Math.max(1, meta.total_pages);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl">
            <Wrench size={24} className="text-blue-600" />
            Service Order
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Daftar pekerjaan servis kendaraan yang ditugaskan kepada Anda.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchServiceOrders(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Service Order</p>
            <ClipboardList size={20} className="text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {meta.total_items}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">
            Sedang Dikerjakan di Halaman Ini
          </p>
          <p className="mt-2 text-2xl font-bold text-violet-700">
            {
              serviceOrders.filter((order) => order?.status === "in_progress")
                .length
            }
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Selesai di Halaman Ini</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {
              serviceOrders.filter((order) => order?.status === "completed")
                .length
            }
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px_auto]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Cari nomor order, pelanggan, kendaraan..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleResetFilters}
            disabled={!hasFilter}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={filteredOrders}
            rowKey={(order) => order.id}
            loading={loading}
            emptyMessage={
              meta.total_items === 0
                ? "Belum ada service order"
                : "Data tidak ditemukan"
            }
            emptyDescription={
              meta.total_items === 0
                ? "Belum ada pekerjaan servis yang ditugaskan kepada Anda."
                : "Coba ubah kata kunci pencarian atau filter status dan pembayaran."
            }
            emptyIcon={ClipboardList}
            renderMobile={renderMobile}
            renderActions={renderActions}
          />
        </div>

        {!loading && meta.total_items > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan {(meta.current_page - 1) * meta.per_page + 1}–
              {Math.min(meta.current_page * meta.per_page, meta.total_items)}{" "}
              dari {meta.total_items} data
            </p>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={loading || refreshing}
            />
          </div>
        )}
      </div>
    </div>
  );
}
