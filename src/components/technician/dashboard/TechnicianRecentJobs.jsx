"use client";

import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Clock3,
  UserRound,
} from "lucide-react";

function getValue(item, keys, fallback = "-") {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function getNestedValue(item, paths, fallback = "-") {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => {
      return current?.[key];
    }, item);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function formatDate(value) {
  if (!value) return "Tanggal belum tersedia";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatus(status) {
  if (!status) return "Belum diketahui";

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "completed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalized === "in_progress") {
    return "bg-blue-50 text-blue-700";
  }

  if (["cancelled", "rejected"].includes(normalized)) {
    return "bg-red-50 text-red-700";
  }

  if (["confirmed", "technician_confirmed"].includes(normalized)) {
    return "bg-indigo-50 text-indigo-700";
  }

  return "bg-amber-50 text-amber-700";
}

export default function TechnicianRecentJobs({
  bookings = [],
  loading = false,
  limit = 5,
  onOpenBooking,
}) {
  const recentBookings = [...bookings]
    .sort((a, b) => {
      const dateA = new Date(
        getValue(a, ["created_at", "createdAt", "updated_at"], 0),
      ).getTime();

      const dateB = new Date(
        getValue(b, ["created_at", "createdAt", "updated_at"], 0),
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, limit);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <ClipboardList size={21} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Pekerjaan Terbaru
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Aktivitas booking terbaru
            </p>
          </div>
        </div>

        <span className="hidden text-xs text-gray-400 sm:inline">
          Maksimal {limit} data
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-center gap-3 px-5 py-4"
            >
              <div className="h-10 w-10 rounded-xl bg-gray-100" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-2/5 rounded bg-gray-100" />
                <div className="mt-2 h-3 w-3/5 rounded bg-gray-100" />
              </div>
              <div className="h-6 w-20 rounded-full bg-gray-100" />
            </div>
          ))
        ) : recentBookings.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center px-5 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
              <ClipboardList size={24} />
            </div>

            <h3 className="mt-3 text-sm font-semibold text-gray-900">
              Belum ada pekerjaan
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Booking terbaru yang ditugaskan kepada Anda akan muncul di sini.
            </p>
          </div>
        ) : (
          recentBookings.map((booking, index) => {
            const status = getValue(booking, ["status"], "pending");

            const customer = getNestedValue(
              booking,
              [
                "customer.username",
                "customer.name",
                "user.username",
                "user.name",
                "vehicle.user.username",
                "customer_name",
              ],
              "Pelanggan",
            );

            const vehicle = [
              getNestedValue(booking, ["vehicle.brand", "brand"], ""),
              getNestedValue(booking, ["vehicle.model", "model"], ""),
            ]
              .filter(Boolean)
              .join(" ");

            const date = getValue(
              booking,
              ["created_at", "createdAt", "booking_date", "scheduled_at"],
              null,
            );

            return (
              <button
                key={booking.id ?? `recent-${index}`}
                type="button"
                onClick={() => onOpenBooking?.(booking)}
                className="group flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition group-hover:bg-white">
                  <ClipboardList size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {vehicle || `Booking #${booking.id ?? "-"}`}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <UserRound size={13} />
                      <span className="max-w-36 truncate">{customer}</span>
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={13} />
                      {formatDate(date)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(status)}`}
                  >
                    {formatStatus(status)}
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-700">
                    Detail
                    <ArrowRight size={13} />
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
