"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarCheck,
  Clock3,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import TechnicianSummaryCards from "@/components/technician/dashboard/TechnicianSummaryCards";
import TechnicianTodaySchedule from "@/components/technician/dashboard/TechnicianTodaySchedule";
import TechnicianRecentJobs from "@/components/technician/dashboard/TechnicianRecentJobs";

const STATUS_CONFIG = [
  {
    key: "pending",
    label: "Menunggu",
    color: "bg-amber-500",
    textColor: "text-amber-700",
    background: "bg-amber-50",
  },
  {
    key: "confirmed",
    label: "Dikonfirmasi",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    background: "bg-blue-50",
  },
  {
    key: "technician_confirmed",
    label: "Dikonfirmasi Teknisi",
    color: "bg-indigo-500",
    textColor: "text-indigo-700",
    background: "bg-indigo-50",
  },
  {
    key: "in_progress",
    label: "Dalam Proses",
    color: "bg-violet-500",
    textColor: "text-violet-700",
    background: "bg-violet-50",
  },
  {
    key: "completed",
    label: "Selesai",
    color: "bg-emerald-500",
    textColor: "text-emerald-700",
    background: "bg-emerald-50",
  },
  {
    key: "cancelled",
    label: "Dibatalkan",
    color: "bg-red-500",
    textColor: "text-red-700",
    background: "bg-red-50",
  },
  {
    key: "rejected",
    label: "Ditolak",
    color: "bg-rose-500",
    textColor: "text-rose-700",
    background: "bg-rose-50",
  },
];

function extractBookings(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.data?.data)) {
    return responseData.data.data;
  }

  if (Array.isArray(responseData?.data?.bookings)) {
    return responseData.data.bookings;
  }

  if (Array.isArray(responseData?.bookings)) {
    return responseData.bookings;
  }

  return [];
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Gagal mengambil data dashboard teknisi."
  );
}

function getBookingDate(booking) {
  return (
    booking?.scheduled_at ||
    booking?.booking_date ||
    booking?.service_date ||
    booking?.booking_datetime ||
    booking?.schedule_date ||
    booking?.scheduled_date ||
    booking?.date ||
    null
  );
}

function isToday(value) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function normalizeStatus(value) {
  return String(value || "pending").toLowerCase();
}

export default function TechnicianDashboard() {
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchBookings = useCallback(async (signal) => {
    try {
      setError("");

      const response = await api.get("/technician/bookings", {
        signal,
      });

      if (signal.aborted) return;

      if (response?.data?.success === false) {
        throw new Error(
          response.data.message || "Gagal mengambil data booking.",
        );
      }

      setBookings(extractBookings(response.data));
    } catch (requestError) {
      if (
        signal.aborted ||
        requestError?.code === "ERR_CANCELED" ||
        requestError?.name === "CanceledError"
      ) {
        return;
      }

      const message = getErrorMessage(requestError);

      setError(message);
      toast.error(message);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    fetchBookings(controller.signal);

    return () => controller.abort();
  }, [fetchBookings, refreshKey]);

  const todayBookings = useMemo(
    () => bookings.filter((booking) => isToday(getBookingDate(booking))),
    [bookings],
  );

  const summary = useMemo(() => {
    const completedJobs = bookings.filter((booking) => {
      return (
        normalizeStatus(booking?.status) === "completed" ||
        normalizeStatus(
          booking?.service_order?.status || booking?.serviceOrder?.status,
        ) === "completed"
      );
    }).length;

    const totalJobs = bookings.filter((booking) => {
      return Boolean(
        booking?.service_order ||
        booking?.serviceOrder ||
        booking?.service_order_id ||
        booking?.serviceOrderId,
      );
    }).length;

    return {
      totalBookings: bookings.length,
      totalJobs,
      todaySchedules: todayBookings.length,
      completedJobs,
    };
  }, [bookings, todayBookings]);

  const statusCounts = useMemo(() => {
    return STATUS_CONFIG.map((status) => ({
      ...status,
      count: bookings.filter(
        (booking) => normalizeStatus(booking?.status) === status.key,
      ).length,
    }));
  }, [bookings]);

  const totalStatusBookings = statusCounts.reduce(
    (total, item) => total + item.count,
    0,
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((current) => current + 1);
  };

  const handleOpenBooking = (booking) => {
    if (!booking?.id) {
      toast.error("ID booking tidak tersedia.");
      return;
    }

    router.push(`/teknisi/bookings/${booking.id}`);
  };

  return (
    <main className="min-w-0 space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Wrench size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Dashboard Teknisi
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Pantau jadwal dan pekerjaan servis Anda.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {error && !loading && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Gagal memuat dashboard
              </p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Coba lagi
          </button>
        </div>
      )}

      <TechnicianSummaryCards summary={summary} loading={loading} />

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="min-w-0 xl:col-span-3">
          <TechnicianTodaySchedule
            bookings={bookings}
            loading={loading}
            onOpenBooking={handleOpenBooking}
          />
        </div>

        <div className="min-w-0 xl:col-span-2">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CalendarCheck size={21} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Status Booking
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Ringkasan status booking Anda
                </p>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="mb-2 flex justify-between gap-3">
                      <div className="h-3 w-28 rounded bg-gray-100" />
                      <div className="h-3 w-8 rounded bg-gray-100" />
                    </div>
                    <div className="h-2 rounded-full bg-gray-100" />
                  </div>
                ))
              ) : totalStatusBookings === 0 ? (
                <div className="py-8 text-center">
                  <Clock3 size={28} className="mx-auto text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Belum ada data status
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Status akan ditampilkan setelah booking tersedia.
                  </p>
                </div>
              ) : (
                statusCounts
                  .filter((item) => item.count > 0)
                  .map((item) => {
                    const percentage = Math.round(
                      (item.count / totalStatusBookings) * 100,
                    );

                    return (
                      <div key={item.key}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`}
                            />
                            <span className="truncate text-sm font-medium text-gray-700">
                              {item.label}
                            </span>
                          </div>

                          <span className="shrink-0 text-sm font-semibold text-gray-900">
                            {item.count}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${item.color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {!loading && totalStatusBookings > 0 && (
              <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-3">
                <p className="text-xs text-gray-500">
                  Total {totalStatusBookings} booking
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <TechnicianRecentJobs
        bookings={bookings}
        loading={loading}
        limit={5}
        onOpenBooking={handleOpenBooking}
      />
    </main>
  );
}
