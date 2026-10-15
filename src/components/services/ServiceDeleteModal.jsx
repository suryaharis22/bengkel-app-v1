"use client";

import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

export default function ServiceDeleteModal({
  open,
  service,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open || !service) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={21} strokeWidth={2} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Delete Workshop Service
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} strokeWidth={2} />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
            <div className="flex gap-3">
              <AlertTriangle
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="text-sm font-semibold text-red-900">
                  Are you sure you want to delete this service?
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  The workshop service and its data will be permanently removed.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Workshop Service
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {service.name}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {service._count?.order_items ?? 0} service order item
              {service._count?.order_items === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50/80 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[100px]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[150px]"
          >
            {loading && <Loader2 size={17} className="animate-spin" />}

            {loading ? "Deleting..." : "Delete Service"}
          </button>
        </div>
      </div>
    </div>
  );
}
