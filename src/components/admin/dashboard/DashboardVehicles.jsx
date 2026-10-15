"use client";

import { CalendarDays, Motorbike, UserRound } from "lucide-react";

function getVehicleOwner(vehicle) {
  if (vehicle.type === "Guest") {
    return vehicle.customer?.name || "Guest Customer";
  }

  return vehicle.customer?.username || vehicle.customer?.name || "Unassigned";
}

export default function DashboardVehicles({ vehicles = [] }) {
  const recentVehicles = [...vehicles]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  if (recentVehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-5 py-8 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
          <Motorbike size={21} />
        </div>

        <p className="mt-3 text-sm font-semibold text-gray-900">No vehicles</p>

        <p className="mt-1 text-xs text-gray-500">
          There are no vehicles to display.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentVehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          className="rounded-xl border border-gray-100 bg-gray-50 p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Motorbike size={18} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {vehicle.plate_number}
                </p>

                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {vehicle.brand} {vehicle.model}
                </p>
              </div>
            </div>

            {vehicle.type && (
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  vehicle.type === "Guest"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {vehicle.type}
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <UserRound size={14} className="shrink-0 text-gray-400" />

              <span className="truncate text-xs text-gray-600">
                {getVehicleOwner(vehicle)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="shrink-0 text-gray-400" />

              <span className="text-xs text-gray-600">
                {vehicle.booking_count || 0} booking
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
