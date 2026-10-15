"use client";

import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

export default function VehicleDeleteModal({
  open = false,
  vehicle = null,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  const vehicleName = [vehicle?.brand, vehicle?.model]
    .filter(Boolean)
    .join(" ");

  const plateNumber = vehicle?.plate_number || "-";

  function handleClose() {
    if (loading) {
      return;
    }

    onClose?.();
  }

  function handleConfirm() {
    if (loading) {
      return;
    }

    onConfirm?.(vehicle);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900">
                Delete Vehicle
              </h2>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Are you sure you want to delete this vehicle?
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="px-5 py-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm">
                <Trash2 size={19} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {vehicleName || "Vehicle"}
                </p>

                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  {plateNumber}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex gap-3">
              <AlertTriangle
                size={17}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <p className="text-xs leading-5 text-amber-800">
                This action cannot be undone. Make sure this vehicle is no
                longer needed before continuing.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50/70 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className={[
              "inline-flex h-10 items-center justify-center gap-2",
              "rounded-lg border border-gray-300 bg-white px-4",
              "text-sm font-medium text-gray-700",
              "transition hover:bg-gray-50",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            <X size={16} />
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={[
              "inline-flex h-10 items-center justify-center gap-2",
              "rounded-lg bg-red-600 px-4",
              "text-sm font-medium text-white",
              "transition hover:bg-red-700",
              "disabled:cursor-not-allowed disabled:opacity-60",
            ].join(" ")}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Vehicle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
