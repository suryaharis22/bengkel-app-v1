"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Loader2,
  Motorbike,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    pending: "bg-yellow-50 text-yellow-700",
    confirmed: "bg-blue-50 text-blue-700",
    technician_confirmed: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
  };

  return classes[status] || "bg-gray-100 text-gray-600";
}

function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <div className="mt-1 text-sm text-gray-900">{children || "-"}</div>
    </div>
  );
}

export default function CustomerBookingDetailPage({ params }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadBooking() {
      try {
        const { id } = await params;

        if (!id) {
          throw new Error("Booking ID is required");
        }

        const response = await api.get(`/customer/bookings/${id}`);

        if (!active) {
          return;
        }

        const responseData = response.data;

        setBooking(responseData?.data || null);
      } catch (error) {
        if (!active) {
          return;
        }

        const axiosError = getAxiosError(error);

        toast.error(axiosError.message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBooking();

    return () => {
      active = false;
    };
  }, [params]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="animate-spin" size={18} />
          Loading booking...
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <Link
          href="/customer/bookings"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          Back to Bookings
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">
            Booking not found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            The booking you are looking for could not be found.
          </p>
        </div>
      </div>
    );
  }

  const vehicle = booking.vehicle;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/customer/bookings"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={17} />
            Back to Bookings
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Booking Detail
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View the details of your service booking.
          </p>
        </div>

        <span
          className={[
            "inline-flex w-fit items-center rounded-full px-3 py-1.5",
            "text-xs font-semibold",
            getStatusClass(booking.status),
          ].join(" ")}
        >
          {getStatusLabel(booking.status)}
        </span>
      </div>

      {/* Booking Number */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <FileText size={20} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Booking Number
            </p>

            <h2 className="mt-1 text-lg font-bold text-gray-900">
              {booking.booking_number || booking.bookingNumber || "-"}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Booking Information */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CalendarDays size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Booking Information
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Schedule and booking details
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            <DetailItem label="Scheduled Date">
              {formatDate(booking.scheduled_at)}
            </DetailItem>

            <DetailItem label="Status">
              {getStatusLabel(booking.status)}
            </DetailItem>

            <DetailItem label="Created At">
              {formatDate(booking.created_at)}
            </DetailItem>

            <DetailItem label="Updated At">
              {formatDate(booking.updated_at)}
            </DetailItem>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Motorbike size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Vehicle Information
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Vehicle selected for this booking
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            <DetailItem label="Plate Number">
              {vehicle?.plat_nomor || vehicle?.platNomor}
            </DetailItem>

            <DetailItem label="Brand">{vehicle?.brand}</DetailItem>

            <DetailItem label="Model">{vehicle?.model}</DetailItem>

            <DetailItem label="Year">{vehicle?.year}</DetailItem>

            <DetailItem label="Color">{vehicle?.color}</DetailItem>
          </div>
        </div>
      </div>

      {/* Complaint & Notes */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Customer Request</h2>

          <p className="mt-0.5 text-sm text-gray-500">
            Complaint and additional notes submitted with this booking.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Complaint
            </p>

            <div className="mt-2 rounded-xl bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {booking.complaint || "-"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Notes
            </p>

            <div className="mt-2 rounded-xl bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {booking.notes || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Link
          href="/customer/bookings"
          className={[
            "inline-flex h-10 items-center justify-center gap-2",
            "rounded-xl border border-gray-200 bg-white",
            "px-4 text-sm font-medium text-gray-700",
            "transition-colors hover:bg-gray-50",
          ].join(" ")}
        >
          <ArrowLeft size={17} />
          Back to Bookings
        </Link>
      </div>
    </div>
  );
}
