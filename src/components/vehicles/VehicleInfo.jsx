"use client";

import {
  CalendarDays,
  Motorbike,
  CircleUserRound,
  Palette,
  RectangleHorizontal,
  Tag,
} from "lucide-react";

function InfoItem({ icon: Icon, label, value, className = "" }) {
  return (
    <div
      className={[
        "flex min-w-0 items-start gap-3 rounded-xl",
        "border border-gray-100 bg-gray-50/70 p-3.5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-gray-900">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

function getVehicleType(vehicle) {
  return vehicle?.user_id ? "Customer" : "Guest";
}

function getOwnerName(vehicle) {
  return vehicle?.user?.username || "Guest Vehicle";
}

function getYear(vehicle) {
  if (!vehicle?.year) {
    return "-";
  }

  return String(vehicle.year);
}

export default function VehicleInfo({ vehicle = null }) {
  if (!vehicle) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex min-h-[180px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
              <CarFroMotorbikent size={22} />
            </div>

            <p className="mt-3 text-sm font-medium text-gray-700">
              Vehicle data not available
            </p>

            <p className="mt-1 text-xs text-gray-500">
              The vehicle information could not be loaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const vehicleType = getVehicleType(vehicle);
  const ownerName = getOwnerName(vehicle);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Motorbike size={23} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-gray-900">
                {vehicle.brand || "-"} {vehicle.model || ""}
              </h2>

              <span
                className={[
                  "inline-flex items-center rounded-full px-2.5 py-1",
                  "text-[11px] font-semibold",
                  vehicleType === "Customer"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-gray-100 text-gray-600",
                ].join(" ")}
              >
                {vehicleType}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
              <RectangleHorizontal size={15} />

              <span className="font-medium tracking-wide">
                {vehicle.plate_number || "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Vehicle ID
          </p>

          <p className="mt-0.5 text-sm font-semibold text-gray-900">
            #{vehicle.id}
          </p>
        </div>
      </div>

      {/* VEHICLE DATA */}
      <div className="p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            icon={RectangleHorizontal}
            label="Plate Number"
            value={vehicle.plate_number}
          />

          <InfoItem icon={Tag} label="Brand" value={vehicle.brand} />

          <InfoItem icon={Motorbike} label="Model" value={vehicle.model} />

          <InfoItem icon={CalendarDays} label="Year" value={getYear(vehicle)} />

          <InfoItem icon={Palette} label="Color" value={vehicle.color} />

          <InfoItem icon={CircleUserRound} label="Owner" value={ownerName} />
        </div>
      </div>
    </div>
  );
}
