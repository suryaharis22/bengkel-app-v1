"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Motorbike,
  Check,
  Eye,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";

const PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Menunggu Konfirmasi" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "technician_confirmed", label: "Dikonfirmasi Teknisi" },
  { value: "rejected", label: "Ditolak" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "in_progress", label: "Sedang Dikerjakan" },
  { value: "completed", label: "Selesai" },
];

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-600/20",
  technician_confirmed: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
  cancelled: "bg-gray-100 text-gray-600 ring-gray-500/20",
  in_progress: "bg-violet-50 text-violet-700 ring-violet-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

function getItems(response) {
  const body = response?.data;

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  if (Array.isArray(body?.data?.items)) return body.data.items;
  if (Array.isArray(body?.items)) return body.items;

  return [];
}

function getValue(object, paths, fallback = "-") {
  for (const path of paths) {
    const value = path
      .split(".")
      .reduce((current, key) => current?.[key], object);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function getBookingId(booking) {
  return booking?.id ?? booking?.booking_id;
}

function getStatus(booking) {
  return String(
    getValue(booking, ["status", "booking_status"], "pending"),
  ).toLowerCase();
}

function getStatusLabel(status) {
  const option = STATUS_OPTIONS.find((item) => item.value === status);

  return (
    option?.label ??
    status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function getCustomerName(booking) {
  return getValue(booking, [
    "customer.username",
    "customer.name",
    "customer.full_name",
    "user.username",
    "user.name",
    "vehicle.user.username",
    "vehicle.user.name",
    "customer_name",
    "name",
  ]);
}

function getCustomerPhone(booking) {
  return getValue(booking, [
    "customer.no_hp",
    "customer.phone",
    "user.no_hp",
    "user.phone",
    "vehicle.user.no_hp",
    "no_hp",
    "phone",
  ]);
}

function getVehicle(booking) {
  const vehicle = booking?.vehicle ?? booking?.Vehicle ?? {};

  const brand = getValue(vehicle, ["brand", "vehicle_brand"], "");
  const model = getValue(vehicle, ["model", "vehicle_model"], "");
  const plate = getValue(
    vehicle,
    ["plate_number", "license_plate", "registration_number"],
    "-",
  );

  return {
    name:
      [brand, model].filter(Boolean).join(" ") || "Kendaraan belum tersedia",
    plate,
  };
}

function getComplaint(booking) {
  return getValue(
    booking,
    ["complaint", "problem", "description", "kendala", "notes"],
    "Tidak ada keluhan",
  );
}

function getSchedule(booking) {
  return getValue(
    booking,
    [
      "scheduled_at",
      "booking_datetime",
      "schedule_date",
      "scheduled_date",
      "service_date",
      "booking_date",
    ],
    null,
  );
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

function formatTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function BookingStatus({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600 ring-gray-500/20"
      }`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function BookingSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-5 h-5 w-48 animate-pulse rounded bg-gray-100" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-lg bg-gray-100"
          />
        ))}
      </div>
    </div>
  );
}

export default function TechnicianBookingTable() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/technician/bookings");
      setBookings(getItems(response));
    } catch (err) {
      const message =
        err?.response?.data?.message || "Gagal memuat daftar booking.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filteredBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const status = getStatus(booking);
      const vehicle = getVehicle(booking);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      const searchableText = [
        getBookingId(booking),
        getCustomerName(booking),
        getCustomerPhone(booking),
        vehicle.name,
        vehicle.plate,
        getComplaint(booking),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!keyword || searchableText.includes(keyword));
    });
  }, [bookings, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;

    return filteredBookings.slice(start, start + PER_PAGE);
  }, [filteredBookings, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleAction = async () => {
    if (!confirmation) return;

    const { booking, action } = confirmation;
    const bookingId = getBookingId(booking);

    if (!bookingId) {
      toast.error("ID booking tidak ditemukan.");
      setConfirmation(null);
      return;
    }

    setProcessingId(bookingId);

    try {
      const endpoint =
        action === "confirm"
          ? `/technician/bookings/${bookingId}/confirm`
          : `/technician/bookings/${bookingId}/reject`;

      const response = await api.post(endpoint);

      toast.success(
        response?.data?.message ||
          (action === "confirm"
            ? "Booking berhasil dikonfirmasi."
            : "Booking berhasil ditolak."),
      );

      setConfirmation(null);
      await loadBookings(true);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Aksi booking gagal diproses.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "customer",
        label: "Pelanggan",
        render: (booking) => (
          <div className="flex min-w-44 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserRound size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">
                {getCustomerName(booking)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {getCustomerPhone(booking)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Booking #{getBookingId(booking) ?? "-"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "vehicle",
        label: "Kendaraan",
        render: (booking) => {
          const vehicle = getVehicle(booking);

          return (
            <div className="min-w-36">
              <p className="font-medium text-gray-800">{vehicle.name}</p>
              <p className="mt-1 text-xs text-gray-500">{vehicle.plate}</p>
            </div>
          );
        },
      },
      {
        key: "complaint",
        label: "Keluhan",
        cellClassName: "max-w-60",
        render: (booking) => (
          <p className="line-clamp-2 min-w-36 text-gray-600">
            {getComplaint(booking)}
          </p>
        ),
      },
      {
        key: "schedule",
        label: "Jadwal Servis",
        render: (booking) => {
          const schedule = getSchedule(booking);

          return (
            <div className="min-w-32">
              <p className="font-medium text-gray-700">
                {formatDate(schedule)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {formatTime(schedule)}
              </p>
            </div>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        render: (booking) => <BookingStatus status={getStatus(booking)} />,
      },
    ],
    [],
  );

  const renderActions = (booking) => {
    const bookingId = getBookingId(booking);
    const status = getStatus(booking);
    const canRespond = ["pending", "confirmed"].includes(status);
    const processing = processingId === bookingId;

    return (
      <div className="flex items-center justify-end gap-2">
        <Link
          href={`/teknisi/bookings/${bookingId}`}
          title="Detail booking"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <Eye size={15} />
          Detail
        </Link>

        {canRespond && (
          <>
            <button
              type="button"
              title="Konfirmasi booking"
              disabled={processing || processingId !== null}
              onClick={() => setConfirmation({ booking, action: "confirm" })}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check size={16} />
            </button>

            <button
              type="button"
              title="Tolak booking"
              disabled={processing || processingId !== null}
              onClick={() => setConfirmation({ booking, action: "reject" })}
              className="inline-flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>
    );
  };

  const renderMobile = (booking) => {
    const bookingId = getBookingId(booking);
    const vehicle = getVehicle(booking);
    const status = getStatus(booking);
    const schedule = getSchedule(booking);
    const canRespond = ["pending", "confirmed"].includes(status);

    return (
      <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserRound size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">
                {getCustomerName(booking)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {getCustomerPhone(booking)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Booking #{bookingId ?? "-"}
              </p>
            </div>
          </div>

          <BookingStatus status={status} />
        </div>

        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <div className="flex items-start gap-2.5">
            <Motorbike size={17} className="mt-0.5 shrink-0 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                {vehicle.name}
              </p>
              <p className="mt-1 text-xs text-gray-500">{vehicle.plate}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CalendarDays size={17} className="mt-0.5 shrink-0 text-gray-400" />
            <p className="text-sm text-gray-700">
              {formatDate(schedule)} · {formatTime(schedule)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Keluhan
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {getComplaint(booking)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          <Link
            href={`/teknisi/bookings/${bookingId}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Eye size={16} />
            Detail
          </Link>

          {canRespond && (
            <>
              <button
                type="button"
                disabled={processingId !== null}
                onClick={() => setConfirmation({ booking, action: "reject" })}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <X size={16} />
                Tolak
              </button>

              <button
                type="button"
                disabled={processingId !== null}
                onClick={() => setConfirmation({ booking, action: "confirm" })}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check size={16} />
                Konfirmasi
              </button>
            </>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Booking Pelanggan
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola permintaan servis, periksa keluhan, dan respons booking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadBookings(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Muat Ulang
        </button>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => loadBookings()}
            className="font-semibold underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Booking</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {loading ? "—" : bookings.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Menunggu Konfirmasi</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {loading
              ? "—"
              : bookings.filter((booking) => getStatus(booking) === "pending")
                  .length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Hasil Filter</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {loading ? "—" : filteredBookings.length}
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari pelanggan, kendaraan, nomor polisi..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="relative lg:w-64">
            <Filter
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={paginatedBookings}
          rowKey={(booking) => getBookingId(booking)}
          loading={loading}
          skeleton={<BookingSkeleton />}
          emptyMessage={
            error ? "Data booking belum tersedia" : "Booking tidak ditemukan"
          }
          emptyDescription={
            error
              ? "Periksa koneksi atau coba muat ulang data."
              : "Coba ubah kata kunci pencarian atau filter status."
          }
          emptyIcon={<CalendarDays size={24} />}
          renderActions={renderActions}
          actionsLabel="Aksi"
          renderMobile={renderMobile}
        />

        {!loading && filteredBookings.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan {(currentPage - 1) * PER_PAGE + 1}–
              {Math.min(currentPage * PER_PAGE, filteredBookings.length)} dari{" "}
              {filteredBookings.length} booking
            </p>

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              showPageInfo={false}
              previousLabel="Sebelumnya"
              nextLabel="Berikutnya"
            />
          </div>
        )}
      </div>

      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-confirmation-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div
              className={`flex size-12 items-center justify-center rounded-xl ${
                confirmation.action === "confirm"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {confirmation.action === "confirm" ? (
                <Check size={22} />
              ) : (
                <X size={22} />
              )}
            </div>

            <h2
              id="booking-confirmation-title"
              className="mt-4 text-lg font-bold text-gray-900"
            >
              {confirmation.action === "confirm"
                ? "Konfirmasi booking?"
                : "Tolak booking?"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {confirmation.action === "confirm"
                ? "Pastikan jadwal, kendaraan, dan keluhan pelanggan sudah diperiksa sebelum melanjutkan."
                : "Kamu akan mengirim permintaan penolakan booking ini."}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={processingId !== null}
                onClick={() => setConfirmation(null)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={processingId !== null}
                onClick={handleAction}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                  confirmation.action === "confirm"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processingId !== null && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}
                {confirmation.action === "confirm"
                  ? "Ya, Konfirmasi"
                  : "Ya, Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
