"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

import CustomerBookingForm from "@/components/customer/bookings/CustomerBookingForm";

export default function CustomerCreateBookingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/customer/bookings"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Bookings
        </Link>

        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <CalendarDays size={21} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Create Booking
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Schedule a service for your vehicle.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <CustomerBookingForm />
    </div>
  );
}
