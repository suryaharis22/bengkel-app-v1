"use client";

import {
  LoaderCircle,
  Play,
  X,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const ACTION_CONFIG = {
  start: {
    title: "Mulai Servis",
    subtitle: "Konfirmasi pengerjaan servis kendaraan",
    description:
      "Pastikan kamu siap memulai pengerjaan servis ini sebelum melanjutkan.",
    buttonLabel: "Mulai Pengerjaan",
    buttonClass:
      "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-200",
    icon: Play,
    iconClass: "bg-indigo-100 text-indigo-600",
  },
};

const STATUS_CONFIG = {
  pending: {
    label: "Menunggu Konfirmasi Admin",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: Clock3,
  },
  confirmed: {
    label: "Dikonfirmasi",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CheckCircle2,
  },
  in_progress: {
    label: "Sedang Dikerjakan",
    className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    icon: Clock3,
  },
  completed: {
    label: "Selesai",
    className: "bg-green-50 text-green-700 ring-green-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Dibatalkan",
    className: "bg-gray-100 text-gray-600 ring-gray-200",
    icon: AlertCircle,
  },
  rejected: {
    label: "Ditolak",
    className: "bg-red-50 text-red-700 ring-red-200",
    icon: AlertCircle,
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status.replaceAll("_", " ") || "-",
    className: "bg-gray-100 text-gray-600 ring-gray-200",
    icon: AlertCircle,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset sm:text-sm ${config.className}`}
    >
      <Icon size={15} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}

function StatusMessage({ status }) {
  const messages = {
    pending: {
      title: "Menunggu konfirmasi admin",
      description:
        "Servis belum dikonfirmasi oleh admin. Pengerjaan hanya dapat dimulai setelah status berubah menjadi Dikonfirmasi.",
      className: "border-amber-200 bg-amber-50 text-amber-800",
      icon: Clock3,
    },
    confirmed: {
      title: "Servis siap dimulai",
      description:
        "Servis telah dikonfirmasi oleh admin. Kamu bisa memulai pengerjaan sekarang.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
      icon: CheckCircle2,
    },
    in_progress: {
      title: "Servis sedang berjalan",
      description:
        "Pengerjaan servis ini sudah dimulai. Kamu tidak perlu memulai pengerjaan kembali.",
      className: "border-indigo-200 bg-indigo-50 text-indigo-800",
      icon: Clock3,
    },
  };

  const message = messages[status] || {
    title: "Servis tidak dapat dimulai",
    description:
      "Status servis saat ini tidak memungkinkan pengerjaan dimulai. Silakan periksa kembali detail servis.",
    className: "border-gray-200 bg-gray-50 text-gray-700",
    icon: AlertCircle,
  };

  const Icon = message.icon;

  return (
    <div
      role={status === "pending" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border p-4 ${message.className}`}
    >
      <Icon size={20} className="mt-0.5 shrink-0" />

      <div className="min-w-0">
        <p className="text-sm font-semibold">{message.title}</p>
        <p className="mt-1 text-sm leading-6 opacity-90">
          {message.description}
        </p>
      </div>
    </div>
  );
}

export default function TechnicianServiceOrderStatusModal({
  open = false,
  action = "start",
  serviceOrder = null,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open || action !== "start") return null;

  const config = ACTION_CONFIG.start;
  const Icon = config.icon;

  const orderId = serviceOrder?.id;
  const currentStatus = String(serviceOrder?.status || "");

  // Hanya service order berstatus confirmed yang bisa dimulai.
  const canStart =
    currentStatus === "confirmed" &&
    orderId !== undefined &&
    orderId !== null &&
    !loading;

  const handleConfirm = () => {
    if (!canStart) return;

    onConfirm?.("start", serviceOrder);
  };

  const handleClose = () => {
    if (loading) return;

    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-order-modal-title"
        aria-describedby="service-order-modal-description"
        className="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
      >
        {/* Header */}
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${config.iconClass}`}
              >
                <Icon size={23} />
              </div>

              <div className="min-w-0">
                <h2
                  id="service-order-modal-title"
                  className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
                >
                  {config.title}
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {config.subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              aria-label="Tutup modal"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-5 p-5 sm:p-6">
          <p
            id="service-order-modal-description"
            className="text-sm leading-6 text-slate-600"
          >
            {config.description}
          </p>

          {/* Service Order ID */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Service Order
            </p>

            <p className="mt-1.5 break-all text-lg font-bold tracking-tight text-slate-900">
              #{orderId ?? "-"}
            </p>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status Saat Ini
              </p>

              <StatusBadge status={currentStatus} />
            </div>
          </div>

          {/* Status Information */}
          <StatusMessage status={currentStatus} />

          {/* Confirmation Notice */}
          {currentStatus === "confirmed" && (
            <p className="text-xs leading-5 text-slate-500">
              Dengan melanjutkan, kamu mengonfirmasi bahwa pengerjaan servis
              akan dimulai.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 p-5 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Kembali
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canStart}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${config.buttonClass}`}
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Play size={17} fill="currentColor" />
                <span>{config.buttonLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
