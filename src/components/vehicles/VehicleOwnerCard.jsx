"use client";

import {
  AtSign,
  CircleUserRound,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-medium text-gray-900">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

export default function VehicleOwnerCard({ vehicle = null }) {
  if (!vehicle) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex min-h-[180px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
              <CircleUserRound size={22} />
            </div>

            <p className="mt-3 text-sm font-medium text-gray-700">
              Owner data not available
            </p>

            <p className="mt-1 text-xs text-gray-500">
              The owner information could not be loaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const owner = vehicle.customer || null;

  const isGuest = vehicle.type === "Guest";
  const isCustomer = vehicle.type === "Customer";

  /*
   * API:
   *
   * Customer:
   * vehicle.type === "Customer"
   * vehicle.customer.id
   * vehicle.customer.name
   * vehicle.customer.email
   * vehicle.customer.no_hp
   *
   * Guest:
   * vehicle.type === "Guest"
   * vehicle.customer.id === null
   * vehicle.customer.name
   * vehicle.customer.no_hp
   */

  const name = owner?.name || owner?.username || "-";

  const email = owner?.email || "-";

  const phone = owner?.no_hp || "-";

  /*
   |--------------------------------------------------------------------------
   | GUEST
   |--------------------------------------------------------------------------
   */

  if (isGuest) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
              <UserRound size={20} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Vehicle Owner
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Guest customer information
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-semibold text-gray-600">
            <ShieldCheck size={13} />
            Guest
          </span>
        </div>

        {/* PROFILE */}
        <div className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
              <UserRound size={28} />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-gray-900">
                {name}
              </h3>

              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <UserRound size={13} />
                <span>Guest Customer</span>
              </div>
            </div>
          </div>

          {/* CONTACT */}
          <div className="mt-5 grid grid-cols-1 gap-3">
            <InfoRow icon={Phone} label="Phone Number" value={phone} />
          </div>
        </div>
      </div>
    );
  }

  /*
   |--------------------------------------------------------------------------
   | CUSTOMER
   |--------------------------------------------------------------------------
   */

  if (isCustomer) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <CircleUserRound size={20} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Vehicle Owner
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Registered customer
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-[11px] font-semibold text-green-700">
            <ShieldCheck size={13} />
            Customer
          </span>
        </div>

        {/* PROFILE */}
        <div className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <CircleUserRound size={28} />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-gray-900">
                {name}
              </h3>

              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <AtSign size={13} />

                <span>Customer #{owner?.id || vehicle.user_id || "-"}</span>
              </div>
            </div>
          </div>

          {/* CONTACT */}
          <div className="mt-5 grid grid-cols-1 gap-3">
            <InfoRow icon={Mail} label="Email" value={email} />

            <InfoRow icon={Phone} label="Phone Number" value={phone} />
          </div>
        </div>
      </div>
    );
  }

  /*
   |--------------------------------------------------------------------------
   | UNKNOWN / NO BOOKING
   |--------------------------------------------------------------------------
   */

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
            <CircleUserRound size={20} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Vehicle Owner
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">Owner information</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm">
            <UserRound size={22} />
          </div>

          <h3 className="mt-3 text-sm font-semibold text-gray-900">
            No Owner Information
          </h3>

          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-gray-500">
            This vehicle does not have customer information from a service
            booking.
          </p>
        </div>
      </div>
    </div>
  );
}
