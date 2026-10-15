"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Motorbike,
} from "lucide-react";

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

function formatTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusConfig(status) {
  const configs = {
    pending: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700",
    },
    confirmed: {
      label: "Confirmed",
      className: "bg-green-50 text-green-700",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-50 text-red-700",
    },
    completed: {
      label: "Completed",
      className: "bg-blue-50 text-blue-700",
    },
  };

  return (
    configs[status] || {
      label: status || "Unknown",
      className: "bg-gray-100 text-gray-600",
    }
  );
}

export default function RecentBooking({ bookings = [] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>

          <p className="mt-0.5 text-sm text-gray-500">
            Your latest service bookings
          </p>
        </div>

        <FileText size={20} className="text-gray-400" />
      </div>

      {bookings.length === 0 ? (
        <div className="flex min-h-[220px] items-center justify-center px-6 py-10">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <CalendarDays size={21} />
            </div>

            <h3 className="mt-3 text-sm font-semibold text-gray-900">
              No bookings yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              You have not created any service booking.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {bookings.map((booking) => {
            const status = getStatusConfig(booking.status);

            return (
              <div key={booking.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {booking.booking_number}
                      </p>

                      <span
                        className={[
                          "rounded-full px-2.5 py-1",
                          "text-[11px] font-semibold",
                          status.className,
                        ].join(" ")}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                      <Motorbike size={16} className="shrink-0 text-gray-400" />

                      <span>
                        {booking.vehicle?.brand} {booking.vehicle?.model}
                      </span>

                      <span className="text-gray-300">•</span>

                      <span>{booking.vehicle?.plate_number}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600 sm:justify-end">
                      <CalendarDays size={16} className="text-gray-400" />

                      <span>{formatDate(booking.scheduled_at)}</span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 sm:justify-end">
                      <Clock3 size={14} />

                      <span>{formatTime(booking.scheduled_at)}</span>
                    </div>
                  </div>
                </div>

                {booking.complaint ? (
                  <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
                    <p className="text-xs font-medium text-gray-400">
                      Complaint
                    </p>

                    <p className="mt-1 text-sm leading-5 text-gray-700">
                      {booking.complaint}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
