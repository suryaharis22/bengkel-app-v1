"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import { ViewPlateNumber } from "@/utils/formatPlateNumber";

export default function CustomerVehicleDeleteModal({
  vehicle,
  open = false,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  if (!open || !vehicle) {
    return null;
  }

  const plateNumber = ViewPlateNumber(vehicle.plate_number || "");

  const vehicleName = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");

  async function handleDelete() {
    if (loading || !vehicle?.id) {
      return;
    }

    setLoading(true);

    try {
      await api.delete(`/customer/vehicles/${vehicle.id}`);

      toast.success("Vehicle deleted successfully.");

      onSuccess?.(vehicle);
    } catch (error) {
      console.error("Delete customer vehicle error:", error);

      const axiosError = getAxiosError(error);

      toast.error(axiosError?.message || "Failed to delete vehicle.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) {
      return;
    }

    onClose?.();
  }

  function handleOverlayClick(event) {
    if (event.target !== event.currentTarget) {
      return;
    }

    handleClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={handleOverlayClick}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Delete Vehicle</h2>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className={[
              "flex h-9 w-9 items-center justify-center",
              "rounded-lg text-gray-500",
              "transition hover:bg-gray-100",
              "hover:text-gray-900",
              "disabled:cursor-not-allowed",
              "disabled:opacity-50",
            ].join(" ")}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Warning Icon */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle size={21} strokeWidth={2} />
            </div>

            {/* Message */}
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900">
                Delete this vehicle?
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                This action cannot be undone. The vehicle will be removed from
                your account.
              </p>

              {/* Vehicle Preview */}
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="font-semibold text-gray-900">
                  {plateNumber || "-"}
                </p>

                {vehicleName ? (
                  <p className="mt-0.5 text-sm text-gray-500">{vehicleName}</p>
                ) : null}

                {vehicle.color ? (
                  <p className="mt-1 text-xs text-gray-400">{vehicle.color}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50/70 px-5 py-4 sm:flex-row sm:justify-end">
          {/* Cancel */}
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className={[
              "h-10 rounded-lg",
              "border border-gray-200 bg-white",
              "px-4 text-sm font-medium text-gray-700",
              "transition hover:bg-gray-50",
              "disabled:cursor-not-allowed",
              "disabled:opacity-50",
            ].join(" ")}
          >
            Cancel
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className={[
              "inline-flex h-10 items-center justify-center gap-2",
              "rounded-lg bg-red-600 px-4",
              "text-sm font-semibold text-white",
              "transition hover:bg-red-700",
              "disabled:cursor-not-allowed",
              "disabled:opacity-50",
            ].join(" ")}
          >
            <Trash2 size={16} strokeWidth={2} />

            {loading ? "Deleting..." : "Delete Vehicle"}
          </button>
        </div>
      </div>
    </div>
  );
}
