"use client";

import { CalendarClock, Motorbike, Clock3, UserRound } from "lucide-react";

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

function getScheduleDate(booking) {
  return getValue(
    booking,
    [
      "scheduled_at",
      "booking_date",
      "service_date",
      "booking_datetime",
      "schedule_date",
      "scheduled_date",
      "date",
    ],
    null,
  );
}

function isToday(value) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatTime(value) {
  if (!value) return "Waktu belum ditentukan";

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

function formatStatus(status) {
  if (!status) return "Belum diketahui";

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (["completed", "technician_confirmed"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }

  if (["confirmed", "in_progress"].includes(normalized)) {
    return "bg-blue-50 text-blue-700 ring-blue-600/20";
  }

  if (["rejected", "cancelled"].includes(normalized)) {
    return "bg-red-50 text-red-700 ring-red-600/20";
  }

  return "bg-amber-50 text-amber-700 ring-amber-600/20";
}

export default function TechnicianTodaySchedule({
  bookings = [],
  loading = false,
  onOpenBooking,
}) {
  const todayBookings = bookings
    .filter((booking) => isToday(getScheduleDate(booking)))
    .sort((a, b) => {
      const first = new Date(getScheduleDate(a)).getTime();
      const second = new Date(getScheduleDate(b)).getTime();

      return first - second;
    });

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarClock size={21} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Jadwal Servis Hari Ini
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Booking yang dijadwalkan hari ini
              </p>
            </div>
          </div>
        </div>

        {!loading && (
          <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {todayBookings.length} jadwal
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-xl border border-gray-100 p-4"
              >
                <div className="h-4 w-2/5 rounded bg-gray-100" />
                <div className="mt-3 h-3 w-3/5 rounded bg-gray-100" />
                <div className="mt-3 h-3 w-1/3 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-5 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
              <CalendarClock size={24} />
            </div>

            <h3 className="mt-3 text-sm font-semibold text-gray-900">
              Tidak ada jadwal servis hari ini
            </h3>

            <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
              Jadwal booking yang ditugaskan kepada Anda akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayBookings.map((booking, index) => {
              const id = booking.id;
              const status = getValue(booking, ["status"], "pending");
              const customer = getNestedValue(
                booking,
                [
                  "customer.username",
                  "customer.name",
                  "user.username",
                  "user.name",
                  "vehicle.user.username",
                  "vehicle.user.name",
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
              const plate = getNestedValue(
                booking,
                ["vehicle.plate_number", "plate_number"],
                "Nomor polisi belum tersedia",
              );
              const scheduleDate = getScheduleDate(booking);

              return (
                <button
                  key={id ?? `booking-${index}`}
                  type="button"
                  onClick={() => onOpenBooking?.(booking)}
                  className="w-full rounded-xl border border-gray-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {vehicle || "Kendaraan"}
                        </h3>

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getStatusClass(status)}`}
                        >
                          {formatStatus(status)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-gray-500 sm:grid-cols-2">
                        <p className="flex min-w-0 items-center gap-2">
                          <UserRound
                            size={15}
                            className="shrink-0 text-gray-400"
                          />
                          <span className="truncate">{customer}</span>
                        </p>

                        <p className="flex min-w-0 items-center gap-2">
                          <Motorbike
                            size={15}
                            className="shrink-0 text-gray-400"
                          />
                          <span className="truncate">{plate}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-gray-700">
                      <Clock3 size={16} className="text-blue-600" />
                      {formatTime(scheduleDate)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
