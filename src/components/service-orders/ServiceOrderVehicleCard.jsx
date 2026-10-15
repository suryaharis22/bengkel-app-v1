"use client";

import { Bike, Palette, Tag } from "lucide-react";

export default function ServiceOrderVehicleCard({ order }) {
  const vehicle = order?.booking?.vehicle;

  if (!vehicle) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Bike size={20} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">Vehicle</h2>

            <p className="text-sm text-gray-500">Vehicle information</p>
          </div>
        </div>

        <p className="mt-5 text-sm text-gray-500">
          Vehicle information is not available.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Bike size={20} />
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">Vehicle</h2>

          <p className="text-sm text-gray-500">Vehicle information</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Plate Number
          </p>

          <p className="mt-1 text-sm font-bold uppercase text-gray-900">
            {vehicle.plate_number || "-"}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Brand
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {vehicle.brand || "-"}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Model
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {vehicle.model || "-"}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Year
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {vehicle.year || "-"}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:col-span-2">
          <Palette size={16} className="text-gray-400" />

          <span className="text-sm text-gray-600">{vehicle.color || "-"}</span>

          <Tag size={15} className="ml-2 text-gray-300" />
        </div>
      </div>
    </section>
  );
}
