"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Motorbike,
  Check,
  Clock,
  FileText,
  LoaderCircle,
  MapPin,
  Phone,
  RefreshCw,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";

const STATUS_CONFIG = {
  pending: {
    label: "Menunggu Konfirmasi",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  confirmed: {
    label: "Dikonfirmasi",
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  technician_confirmed: {
    label: "Dikonfirmasi Teknisi",
    className: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  },
  rejected: {
    label: "Ditolak",
    className: "bg-red-50 text-red-700 ring-red-600/20",
  },
  cancelled: {
    label: "Dibatalkan",
    className: "bg-gray-100 text-gray-600 ring-gray-500/20",
  },
  completed: {
    label: "Selesai",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
};

function getValue(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== "",
  );
}

function formatText(value, fallback = "-") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getStatus(status) {
  const normalized = String(status || "pending").toLowerCase();

  return (
    STATUS_CONFIG[normalized] || {
      label: normalized.replaceAll("_", " "),
      className: "bg-gray-100 text-gray-600 ring-gray-500/20",
    }
  );
}

function getBookingStatus(booking) {
  return String(
    getValue(booking?.status, booking?.booking_status, "pending"),
  ).toLowerCase();
}

function getCustomer(booking) {
  return (
    booking?.customer ||
    booking?.user ||
    booking?.vehicle?.user ||
    booking?.vehicle?.customer ||
    booking?.service_booking?.customer ||
    null
  );
}

function getVehicle(booking) {
  return (
    booking?.vehicle ||
    booking?.customer_vehicle ||
    booking?.service_booking?.vehicle ||
    null
  );
}

function getSchedule(booking) {
  return getValue(
    booking?.scheduled_at,
    booking?.booking_date,
    booking?.service_date,
    booking?.schedule,
    booking?.scheduled_date,
    booking?.service_booking?.scheduled_at,
    booking?.service_booking?.booking_date,
  );
}

function getComplaint(booking) {
  return getValue(
    booking?.complaint,
    booking?.complaints,
    booking?.complaint_description,
    booking?.problem,
    booking?.problem_description,
    booking?.description,
    booking?.notes,
    booking?.service_booking?.complaint,
    booking?.service_booking?.complaint_description,
  );
}

function getCustomerName(customer, booking) {
  return getValue(
    customer?.name,
    customer?.username,
    customer?.full_name,
    customer?.fullname,
    booking?.customer_name,
    booking?.guest_name,
    booking?.name,
  );
}

function getPhone(customer, booking) {
  return getValue(
    customer?.no_hp,
    customer?.phone,
    customer?.phone_number,
    customer?.telephone,
    booking?.no_hp,
    booking?.phone,
    booking?.customer_phone,
    booking?.guest_phone,
  );
}

function getVehicleName(vehicle) {
  const brand = getValue(vehicle?.brand, vehicle?.brand_name);
  const model = getValue(vehicle?.model, vehicle?.vehicle_model);

  if (brand && model) {
    return `${brand} ${model}`;
  }

  return getValue(vehicle?.name, vehicle?.vehicle_name, brand, model);
}

function getPlateNumber(vehicle) {
  return getValue(
    vehicle?.plate_number,
    vehicle?.license_plate,
    vehicle?.registration_number,
    vehicle?.police_number,
    vehicle?.plate,
  );
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message || error?.response?.data?.error || fallback
  );
}

function InfoItem({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-gray-900">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

function DetailCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          <Icon size={20} />
        </div>

        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>

      {children}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
      <LoaderCircle size={32} className="animate-spin text-gray-500" />
      <p className="text-sm text-gray-500">Memuat detail booking...</p>
    </div>
  );
}

export default function TechnicianBookingDetail({ id }) {
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchBooking = useCallback(
    async (showLoading = true) => {
      if (!id) {
        setErrorMessage("ID booking tidak ditemukan.");
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        const response = await api.get(`/technician/bookings/${id}`);
        const payload = response?.data;

        if (payload?.success === false) {
          throw new Error(
            payload?.message || "Gagal mengambil detail booking.",
          );
        }

        const result = payload?.data ?? payload;

        const normalizedBooking =
          result?.booking ||
          result?.service_booking ||
          result?.data?.booking ||
          result;

        if (
          !normalizedBooking ||
          typeof normalizedBooking !== "object" ||
          Array.isArray(normalizedBooking) ||
          normalizedBooking?.id === undefined
        ) {
          throw new Error("Data detail booking tidak valid.");
        }

        setBooking(normalizedBooking);
      } catch (error) {
        const message =
          error?.message ||
          getErrorMessage(error, "Gagal mengambil detail booking.");

        setErrorMessage(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleAction = async (action) => {
    if (!booking?.id || processing) return;

    const actionConfig = {
      confirm: {
        endpoint: `/technician/bookings/${booking.id}/confirm`,
        successMessage: "Booking berhasil dikonfirmasi.",
        errorMessage: "Gagal mengonfirmasi booking.",
      },
      reject: {
        endpoint: `/technician/bookings/${booking.id}/reject`,
        successMessage: "Booking berhasil ditolak.",
        errorMessage: "Gagal menolak booking.",
      },
    };

    const config = actionConfig[action];

    if (!config) return;

    setProcessing(true);

    try {
      const response = await api.post(config.endpoint);
      const payload = response?.data;

      if (payload?.success === false) {
        throw new Error(payload?.message || config.errorMessage);
      }

      toast.success(payload?.message || config.successMessage);

      await fetchBooking(false);
    } catch (error) {
      toast.error(getErrorMessage(error, config.errorMessage));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <LoadingState />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Kembali
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
          <XCircle className="mx-auto mb-3 text-red-500" size={36} />

          <h2 className="text-lg font-semibold text-gray-900">
            Detail booking tidak tersedia
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            {errorMessage || "Data booking tidak ditemukan."}
          </p>

          <button
            type="button"
            onClick={() => fetchBooking()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <RefreshCw size={16} />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const status = getBookingStatus(booking);
  const statusConfig = getStatus(status);
  const customer = getCustomer(booking);
  const vehicle = getVehicle(booking);
  const schedule = getSchedule(booking);
  const complaint = getComplaint(booking);
  const customerName = getCustomerName(customer, booking);
  const customerPhone = getPhone(customer, booking);
  const vehicleName = getVehicleName(vehicle);
  const plateNumber = getPlateNumber(vehicle);

  const bookingId = getValue(booking?.id, id);
  const vehicleYear = getValue(
    vehicle?.year,
    vehicle?.production_year,
    vehicle?.manufacture_year,
  );

  const canConfirm = status === "pending";
  const canReject = ["pending", "confirmed"].includes(status);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => router.push("/teknisi/bookings")}
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
      >
        <ArrowLeft size={18} />
        Kembali ke Booking Pelanggan
      </button>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Detail Booking
            </h1>

            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500">ID Booking: #{bookingId}</p>
        </div>

        <button
          type="button"
          onClick={() => fetchBooking()}
          disabled={loading || processing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DetailCard title="Informasi Pelanggan" icon={UserRound}>
          <div className="space-y-5">
            <InfoItem
              icon={UserRound}
              label="Nama Pelanggan"
              value={formatText(customerName, "Pelanggan")}
            />

            <InfoItem
              icon={Phone}
              label="Nomor Telepon"
              value={formatText(customerPhone)}
            />
          </div>
        </DetailCard>

        <DetailCard title="Informasi Kendaraan" icon={Motorbike}>
          <div className="space-y-5">
            <InfoItem
              icon={Motorbike}
              label="Merek dan Model"
              value={formatText(vehicleName)}
            />

            <InfoItem
              icon={MapPin}
              label="Nomor Polisi"
              value={formatText(plateNumber)}
            />

            <InfoItem
              icon={CalendarDays}
              label="Tahun Kendaraan"
              value={formatText(vehicleYear)}
            />
          </div>
        </DetailCard>

        <DetailCard title="Jadwal Servis" icon={CalendarDays}>
          <div className="space-y-5">
            <InfoItem
              icon={CalendarDays}
              label="Tanggal Servis"
              value={formatDate(schedule)}
            />

            <InfoItem
              icon={Clock}
              label="Waktu Servis"
              value={
                schedule && (booking?.scheduled_time || booking?.service_time)
                  ? formatText(
                      getValue(booking?.scheduled_time, booking?.service_time),
                    )
                  : schedule
                    ? formatTime(schedule)
                    : "-"
              }
            />

            <InfoItem
              icon={FileText}
              label="Status Booking"
              value={statusConfig.label}
            />
          </div>
        </DetailCard>

        <DetailCard title="Keluhan Pelanggan" icon={FileText}>
          {complaint ? (
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
                {complaint}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Tidak ada keterangan keluhan yang tersedia.
              </p>
            </div>
          )}

          {booking?.created_at && (
            <p className="mt-4 text-xs text-gray-400">
              Booking dibuat pada {formatDate(booking.created_at)}
            </p>
          )}
        </DetailCard>
      </div>

      {(canConfirm || canReject) && (
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-gray-900">
            Tindakan Booking
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Pilih tindakan sesuai hasil pemeriksaan jadwal booking.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {canReject && (
              <button
                type="button"
                onClick={() => handleAction("reject")}
                disabled={processing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <X size={17} />
                )}
                Tolak Booking
              </button>
            )}

            {canConfirm && (
              <button
                type="button"
                onClick={() => handleAction("confirm")}
                disabled={processing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Check size={17} />
                )}
                Konfirmasi Booking
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
