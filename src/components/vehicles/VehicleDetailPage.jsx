"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  UserRound,
  Mail,
  Phone,
  Palette,
  Wrench,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Motorbike,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

function parseVehicleId(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function getVehicleFromResponse(response) {
  const data = response?.data;

  if (data?.success && data?.data) {
    return data.data;
  }

  if (data?.data?.data) {
    return data.data.data;
  }

  if (data?.data) {
    return data.data;
  }

  return data;
}

function getCustomerName(customer) {
  if (!customer) {
    return "-";
  }

  return (
    customer.username ||
    customer.name ||
    customer.full_name ||
    customer.email ||
    "-"
  );
}

function getCustomerEmail(customer) {
  return customer?.email || "-";
}

function getCustomerPhone(customer) {
  return customer?.no_hp || customer?.phone || "-";
}

function getVehicleType(vehicle) {
  if (vehicle?.user_id !== null && vehicle?.user_id !== undefined) {
    return "Customer";
  }

  return "Guest";
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
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function LoadingState() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Memuat detail kendaraan...</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle className="h-6 w-6" />
        </div>

        <h2 className="text-lg font-semibold text-gray-900">
          Gagal memuat kendaraan
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          {message || "Terjadi kesalahan saat mengambil data kendaraan."}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </button>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-gray-900">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

function VehicleTypeBadge({ type }) {
  const isCustomer = type === "Customer";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        isCustomer ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700",
      ].join(" ")}
    >
      {type}
    </span>
  );
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const vehicleId = parseVehicleId(params?.id);

  async function loadVehicle() {
    if (!vehicleId) {
      setLoading(false);
      setError("ID kendaraan tidak valid.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("[VehicleDetail] GET vehicle:", vehicleId);

      const response = await api.get(`/admin/vehicles/${vehicleId}`);

      console.log("[VehicleDetail] API response:", response);

      const vehicleData = getVehicleFromResponse(response);

      console.log("[VehicleDetail] Vehicle data:", vehicleData);

      if (!vehicleData || typeof vehicleData !== "object") {
        throw new Error("Data kendaraan tidak ditemukan.");
      }

      setVehicle(vehicleData);
    } catch (error) {
      console.error("[VehicleDetail] GET vehicle error:", error);

      const message =
        getAxiosError(error) ||
        error?.message ||
        "Gagal memuat detail kendaraan.";

      setVehicle(null);
      setError(message);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log("[VehicleDetail] USE EFFECT RUN");
    console.log("[VehicleDetail] params:", params);
    console.log("[VehicleDetail] vehicleId:", vehicleId);

    loadVehicle();
  }, [vehicleId]);

  function handleBack() {
    router.push("/admin/vehicles");
  }

  function handleEdit() {
    if (!vehicleId) {
      return;
    }

    router.push(`/admin/vehicles/${vehicleId}/edit`);
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error && !vehicle) {
    return (
      <div className="p-4 md:p-6">
        <button
          type="button"
          onClick={handleBack}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Kendaraan
        </button>

        <ErrorState message={error} onRetry={loadVehicle} />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message="Data kendaraan tidak ditemukan."
          onRetry={loadVehicle}
        />
      </div>
    );
  }

  const vehicleType = getVehicleType(vehicle);
  const customer = vehicle.customer || vehicle.user || null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Kendaraan
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
              <Motorbike className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                Detail Kendaraan
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Informasi lengkap kendaraan dan pemilik.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEdit}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          <Eye className="h-4 w-4" />
          Edit Kendaraan
        </button>
      </div>

      {/* Vehicle Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Informasi Kendaraan
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Data utama kendaraan.
              </p>
            </div>

            <VehicleTypeBadge type={vehicleType} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InfoItem
              icon={Car}
              label="Nomor Polisi"
              value={vehicle.plate_number}
            />

            <InfoItem icon={Car} label="Merek" value={vehicle.brand} />

            <InfoItem icon={Car} label="Model" value={vehicle.model} />

            <InfoItem icon={CalendarDays} label="Tahun" value={vehicle.year} />

            <InfoItem icon={Palette} label="Warna" value={vehicle.color} />

            <InfoItem
              icon={Wrench}
              label="Jumlah Booking"
              value={vehicle.booking_count ?? 0}
            />

            <InfoItem
              icon={CalendarDays}
              label="Dibuat"
              value={formatDate(vehicle.created_at)}
            />

            <InfoItem
              icon={CalendarDays}
              label="Terakhir Diubah"
              value={formatDate(vehicle.updated_at)}
            />
          </div>
        </div>

        {/* Customer */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-gray-700" />

              <h2 className="text-base font-semibold text-gray-900">Pemilik</h2>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Informasi pemilik kendaraan.
            </p>
          </div>

          {vehicleType === "Customer" && customer ? (
            <div className="space-y-5">
              <InfoItem
                icon={UserRound}
                label="Username"
                value={getCustomerName(customer)}
              />

              <InfoItem
                icon={Mail}
                label="Email"
                value={getCustomerEmail(customer)}
              />

              <InfoItem
                icon={Phone}
                label="Nomor HP"
                value={getCustomerPhone(customer)}
              />
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Kendaraan Guest
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Kendaraan ini tidak terhubung dengan akun customer.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service History */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
            <Wrench className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Riwayat Service
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Riwayat service kendaraan akan ditampilkan di sini.
            </p>
          </div>
        </div>

        <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
          <div className="text-center">
            <Wrench className="mx-auto h-8 w-8 text-gray-400" />

            <p className="mt-3 text-sm font-medium text-gray-700">
              Belum ada riwayat service
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Riwayat service akan muncul ketika kendaraan memiliki service
              order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
