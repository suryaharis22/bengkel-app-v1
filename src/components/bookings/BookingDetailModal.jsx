"use client";

import {
  CalendarDays,
  Clock3,
  Loader2,
  Motorbike,
  Phone,
  User,
  X,
} from "lucide-react";

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

export default function BookingDetailModal({
  open,
  booking,
  loading = false,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Booking Detail
            </p>

            <h2 className="mt-1 text-lg font-semibold text-gray-900">
              {loading ? "Loading booking..." : booking?.booking_number || "-"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Loader2 size={20} className="animate-spin text-red-600" />
                Loading booking detail...
              </div>
            </div>
          ) : booking ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-xs text-gray-400">Status</p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                      booking.status,
                    )}`}
                  >
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-400">Scheduled</p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDateTime(booking.scheduled_at)}
                  </p>
                </div>
              </div>

              <section className="rounded-xl border border-gray-200">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Customer
                  </h3>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <User size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Name</p>

                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {booking.customer_name || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <Phone size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Phone</p>

                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {booking.customer_phone || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Vehicle
                  </h3>
                </div>

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <Motorbike size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {booking.vehicle?.plate_number ||
                          booking.vehicle?.plat_nomor ||
                          "-"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {[
                          booking.vehicle?.brand,
                          booking.vehicle?.model,
                          booking.vehicle?.year,
                          booking.vehicle?.color,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Schedule
                  </h3>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <CalendarDays size={18} className="mt-0.5 text-red-600" />

                    <div>
                      <p className="text-xs text-gray-400">Scheduled Date</p>

                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {booking.scheduled_at
                          ? new Intl.DateTimeFormat("id-ID", {
                              dateStyle: "medium",
                            }).format(new Date(booking.scheduled_at))
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock3 size={18} className="mt-0.5 text-red-600" />

                    <div>
                      <p className="text-xs text-gray-400">Scheduled Time</p>

                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {booking.scheduled_at
                          ? new Intl.DateTimeFormat("id-ID", {
                              timeStyle: "short",
                            }).format(new Date(booking.scheduled_at))
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Complaint
                  </h3>
                </div>

                <div className="p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {booking.complaint || "-"}
                  </p>
                </div>
              </section>

              {booking.notes ? (
                <section className="rounded-xl border border-gray-200">
                  <div className="border-b border-gray-200 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Notes
                    </h3>
                  </div>

                  <div className="p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {booking.notes}
                    </p>
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center text-sm text-gray-500">
              Booking not found.
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-gray-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[100px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
