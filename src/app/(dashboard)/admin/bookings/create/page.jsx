"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, UserRoundPlus } from "lucide-react";

import BookingGuestForm from "@/components/bookings/BookingGuestForm";

export default function CreateBookingPage() {
  const router = useRouter();

  function handleBack() {
    router.push("/admin/bookings");
  }

  function handleSuccess() {
    router.push("/admin/bookings");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back to bookings"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <CalendarDays size={22} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">
                Create Guest Booking
              </h1>

              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                <UserRoundPlus size={12} />
                Guest
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Create a service booking for a customer without an account.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <BookingGuestForm onSuccess={handleSuccess} onCancel={handleBack} />
      </div>
    </div>
  );
}
