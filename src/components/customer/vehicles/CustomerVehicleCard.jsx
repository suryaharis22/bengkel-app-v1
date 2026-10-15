"use client";

import { Edit, Eye, Motorbike, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { ViewPlateNumber } from "@/utils/formatPlateNumber";

export default function CustomerVehicleCard({
  vehicle,
  selectable = false,
  onSelect,
  onEdit,
  onDelete,
}) {
  const router = useRouter();

  if (!vehicle) {
    return null;
  }

  function handleSelect() {
    if (!selectable) {
      return;
    }

    onSelect?.(vehicle);
  }

  function handleDetail(event) {
    event.stopPropagation();

    if (!vehicle.id) {
      return;
    }

    router.push(`/customer/vehicles/${vehicle.id}`);
  }

  function handleEdit(event) {
    event.stopPropagation();

    if (!vehicle.id) {
      return;
    }

    onEdit?.(vehicle);
  }

  function handleDelete(event) {
    event.stopPropagation();

    if (!vehicle.id) {
      return;
    }

    onDelete?.(vehicle);
  }

  const plateNumber = ViewPlateNumber(vehicle.plate_number || "");

  const vehicleName = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");

  return (
    <div
      className={[
        "rounded-2xl border bg-white p-5 shadow-sm",
        "transition-all",
        selectable
          ? [
              "cursor-pointer",
              "border-gray-200",
              "hover:border-red-300",
              "hover:shadow-md",
            ].join(" ")
          : "border-gray-200",
      ].join(" ")}
      onClick={handleSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Motorbike size={22} strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-gray-900">
              {plateNumber || "-"}
            </h3>

            <p className="mt-0.5 truncate text-sm text-gray-500">
              {vehicleName || "-"}
            </p>
          </div>
        </div>

        {selectable ? (
          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
            Select
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs font-medium text-gray-400">Model</p>

          <p className="mt-1 truncate text-sm font-semibold text-gray-900">
            {vehicle.model || "-"}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400">Year</p>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {vehicle.year || "-"}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400">Color</p>

          <p className="mt-1 truncate text-sm font-semibold text-gray-900">
            {vehicle.color || "-"}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400">Plate</p>

          <p className="mt-1 truncate text-sm font-semibold text-gray-900">
            {plateNumber || "-"}
          </p>
        </div>
      </div>

      {!selectable ? (
        <div
          className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-4"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleDetail}
            className={[
              "inline-flex h-9 items-center justify-center gap-2",
              "rounded-lg border border-gray-200",
              "px-3 text-sm font-medium text-gray-700",
              "transition-colors hover:bg-gray-50",
            ].join(" ")}
          >
            <Eye size={15} />
            Detail
          </button>

          <button
            type="button"
            onClick={handleEdit}
            className={[
              "inline-flex h-9 items-center justify-center gap-2",
              "rounded-lg border border-gray-200",
              "px-3 text-sm font-medium text-gray-700",
              "transition-colors hover:bg-gray-50",
            ].join(" ")}
          >
            <Edit size={15} />
            Edit
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className={[
              "inline-flex h-9 items-center justify-center gap-2",
              "rounded-lg border border-red-200",
              "px-3 text-sm font-medium text-red-600",
              "transition-colors hover:bg-red-50",
            ].join(" ")}
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
