"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Eye, RefreshCw, Wrench } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import TechnicianServiceOrderFilter from "@/components/technician/TechnicianServiceOrderFilter";

const PER_PAGE = 10;

const STATUS_LABELS = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  in_progress: "Sedang Dikerjakan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-600/20",
  in_progress: "bg-violet-50 text-violet-700 ring-violet-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-red-50 text-red-700 ring-red-600/20",
};

const PAYMENT_STATUS_LABELS = {
  unpaid: "Belum Dibayar",
  partial: "Sebagian",
  paid: "Lunas",
  refunded: "Refund",
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

function getCustomerName(booking) {
  return (
    booking?.customer?.username ||
    booking?.customer?.name ||
    booking?.customer_name ||
    "-"
  );
}

function getVehicleName(booking) {
  const vehicle = booking?.vehicle;

  if (!vehicle) return "-";

  return [vehicle.brand, vehicle.model, vehicle.plate_number]
    .filter(Boolean)
    .join(" ");
}

function getOrderNumber(order) {
  return order?.order_number || `SO-${order?.id ?? "-"}`;
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

export default function TechnicianServiceOrderTable() {
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [page, setPage] = useState(1);

  const fetchBookings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/technician/bookings");
      const payload = response?.data;

      if (payload?.success === false) {
        throw new Error(payload?.message || "Gagal mengambil daftar booking.");
      }

      const result = payload?.data;
      const bookingList = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      setBookings(bookingList);
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
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const serviceOrders = useMemo(() => {
    return bookings
      .filter((booking) => booking?.service_order?.id != null)
      .map((booking) => ({
        ...booking,
        serviceOrder: booking.service_order,
      }));
  }, [bookings]);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return serviceOrders.filter((booking) => {
      const order = booking.serviceOrder;

      const matchesStatus = status === "all" || order?.status === status;

      const matchesPaymentStatus =
        paymentStatus === "all" || order?.payment_status === paymentStatus;

      const searchableText = [
        getOrderNumber(order),
        booking?.booking_number,
        getCustomerName(booking),
        getVehicleName(booking),
        booking?.complaint,
        booking?.vehicle?.plate_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      return matchesStatus && matchesPaymentStatus && matchesSearch;
    });
  }, [serviceOrders, search, status, paymentStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PER_PAGE));

  const paginatedOrders = useMemo(() => {
    const startIndex = (page - 1) * PER_PAGE;

    return filteredOrders.slice(startIndex, startIndex + PER_PAGE);
  }, [filteredOrders, page]);

  useEffect(() => {
    setPage(1);
  }, [search, status, paymentStatus]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleResetFilters = () => {
    setSearch("");
    setStatus("all");
    setPaymentStatus("all");
    setPage(1);
  };

  const handleOpenDetail = (booking) => {
    const orderId = booking?.serviceOrder?.id;

    if (!orderId) {
      toast.error("Service order tidak ditemukan.");
      return;
    }

    router.push(`/teknisi/service-orders/${orderId}`);
  };

  const columns = [
    {
      key: "order_number",
      label: "Nomor Service Order",
      render: (booking) => (
        <div className="min-w-36">
          <p className="font-semibold text-gray-900">
            {getOrderNumber(booking.serviceOrder)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Booking: {booking.booking_number || `#${booking.id}`}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Pelanggan",
      render: (booking) => (
        <span className="text-sm text-gray-700">
          {getCustomerName(booking)}
        </span>
      ),
    },
    {
      key: "vehicle",
      label: "Kendaraan",
      render: (booking) => (
        <div className="min-w-36">
          <p className="text-sm font-medium text-gray-800">
            {getVehicleName(booking)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {booking?.vehicle?.plate_number || "-"}
          </p>
        </div>
      ),
    },
    {
      key: "scheduled_at",
      label: "Jadwal Booking",
      render: (booking) => (
        <span className="whitespace-nowrap text-sm text-gray-600">
          {formatDate(booking.scheduled_at)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status Pekerjaan",
      render: (booking) => getStatusBadge(booking.serviceOrder?.status),
    },
    {
      key: "payment_status",
      label: "Pembayaran",
      render: (booking) => (
        <div className="min-w-28 space-y-1">
          {getPaymentStatusBadge(booking.serviceOrder?.payment_status)}
          <p className="text-xs text-gray-500">
            {formatCurrency(booking.serviceOrder?.grand_total)}
          </p>
        </div>
      ),
    },
  ];

  const renderActions = (booking) => (
    <button
      type="button"
      onClick={() => handleOpenDetail(booking)}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
    >
      <Eye size={16} />
      Detail
    </button>
  );

  const renderMobile = (booking) => (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">
            {getOrderNumber(booking.serviceOrder)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Booking: {booking.booking_number || `#${booking.id}`}
          </p>
        </div>

        {getStatusBadge(booking.serviceOrder?.status)}
      </div>

      <div className="space-y-2 text-sm">
        <p className="text-gray-700">
          <span className="text-gray-500">Pelanggan:</span>{" "}
          {getCustomerName(booking)}
        </p>

        <p className="text-gray-700">
          <span className="text-gray-500">Kendaraan:</span>{" "}
          {getVehicleName(booking)}
        </p>

        <p className="text-gray-700">
          <span className="text-gray-500">Jadwal:</span>{" "}
          {formatDate(booking.scheduled_at)}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-gray-500">Pembayaran:</span>
          {getPaymentStatusBadge(booking.serviceOrder?.payment_status)}
        </div>

        <p className="text-gray-700">
          <span className="text-gray-500">Total:</span>{" "}
          {formatCurrency(booking.serviceOrder?.grand_total)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => handleOpenDetail(booking)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        <Eye size={16} />
        Lihat Detail
      </button>
    </div>
  );

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
          onClick={() => fetchBookings(true)}
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
            {serviceOrders.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Sedang Dikerjakan</p>
          <p className="mt-2 text-2xl font-bold text-violet-700">
            {
              serviceOrders.filter(
                (booking) => booking.serviceOrder?.status === "in_progress",
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Selesai</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {
              serviceOrders.filter(
                (booking) => booking.serviceOrder?.status === "completed",
              ).length
            }
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        <TechnicianServiceOrderFilter
          search={search}
          status={status}
          paymentStatus={paymentStatus}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onPaymentStatusChange={setPaymentStatus}
          onReset={handleResetFilters}
        />

        <DataTable
          columns={columns}
          data={paginatedOrders}
          rowKey={(booking) => booking.serviceOrder.id}
          loading={loading}
          emptyMessage={
            serviceOrders.length === 0
              ? "Belum ada service order"
              : "Data tidak ditemukan"
          }
          emptyDescription={
            bookings.length > 0 && serviceOrders.length === 0
              ? "Booking yang diterima belum memiliki service order terkait."
              : "Coba ubah kata kunci pencarian atau filter status dan pembayaran."
          }
          emptyIcon={ClipboardList}
          renderMobile={renderMobile}
          renderActions={renderActions}
        />

        {!loading && filteredOrders.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan {(page - 1) * PER_PAGE + 1}–
              {Math.min(page * PER_PAGE, filteredOrders.length)} dari{" "}
              {filteredOrders.length} data
            </p>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
