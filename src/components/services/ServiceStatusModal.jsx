"use client";

import { AlertTriangle, Check, Loader2, X } from "lucide-react";

export default function ServiceStatusModal({
  open,
  service,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open || !service) {
    return null;
  }

  const isActive = service.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isActive
                  ? "bg-amber-50 text-amber-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {isActive ? (
                <AlertTriangle size={21} strokeWidth={2} />
              ) : (
                <Check size={21} strokeWidth={2} />
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isActive ? "Deactivate Service" : "Activate Service"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {isActive
                  ? "This service will no longer be available for new service orders."
                  : "This service will become available for new service orders."}
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
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Workshop Service
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {service.name}
            </p>
          </div>

          <p className="mt-4 text-sm leading-6 text-gray-600">
            {isActive
              ? "Existing service orders will not be affected. Only new service orders will no longer be able to use this service."
              : "Once activated, this service will be available again when creating new service orders."}
          </p>
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
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[150px] ${
              isActive
                ? "bg-amber-600 hover:bg-amber-700 hover:shadow"
                : "bg-red-600 hover:bg-red-700 hover:shadow"
            }`}
          >
            {loading && <Loader2 size={17} className="animate-spin" />}

            {loading
              ? isActive
                ? "Deactivating..."
                : "Activating..."
              : isActive
                ? "Deactivate Service"
                : "Activate Service"}
          </button>
        </div>
      </div>
    </div>
  );
}
