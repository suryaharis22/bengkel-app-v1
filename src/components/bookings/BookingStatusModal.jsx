"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Loader2,
  UserCog,
  X,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

const statusConfig = {
  confirm: {
    title: "Confirm Booking",
    description:
      "Assign a technician PIC to this booking before confirming it.",
    button: "Confirm Booking",
    loading: "Confirming...",
    icon: Check,
    iconClass: "bg-green-50 text-green-600",
    buttonClass: "bg-green-600 hover:bg-green-700",
  },

  reject: {
    title: "Reject Booking",
    description:
      "This booking will be rejected and cannot continue to the service order process.",
    button: "Reject Booking",
    loading: "Rejecting...",
    icon: AlertTriangle,
    iconClass: "bg-red-50 text-red-600",
    buttonClass: "bg-red-600 hover:bg-red-700",
  },

  cancel: {
    title: "Cancel Booking",
    description:
      "This booking will be cancelled. Existing related data will remain unchanged.",
    button: "Cancel Booking",
    loading: "Cancelling...",
    icon: AlertTriangle,
    iconClass: "bg-amber-50 text-amber-600",
    buttonClass: "bg-amber-600 hover:bg-amber-700",
  },
};

function getTechniciansFromResponse(response) {
  const data =
    response?.data?.data?.data ?? response?.data?.data ?? response?.data ?? [];

  return Array.isArray(data) ? data : [];
}

function normalizeTechnician(technician) {
  const id = Number(technician?.id);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return {
    ...technician,
    id,
  };
}

function getTechnicianName(technician) {
  return (
    technician?.name ||
    technician?.username ||
    technician?.full_name ||
    technician?.email ||
    `Technician #${technician?.id ?? "-"}`
  );
}

function getInitialTechnicianId(booking) {
  const value =
    booking?.technician_id ??
    booking?.technician?.id ??
    booking?.technicianId ??
    "";

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return "";
  }

  return String(id);
}

function BookingStatusModalContent({
  booking,
  action,
  loading = false,
  onClose,
  onConfirm,
}) {
  const isConfirm = action === "confirm";

  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(() =>
    getInitialTechnicianId(booking),
  );
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  useEffect(() => {
    if (!isConfirm) {
      return undefined;
    }

    let active = true;
    const controller = new AbortController();

    async function fetchTechnicians() {
      try {
        setLoadingTechnicians(true);

        const response = await api.get("/admin/technicians", {
          signal: controller.signal,
        });

        if (!active || controller.signal.aborted) {
          return;
        }

        const data = getTechniciansFromResponse(response);

        const normalizedTechnicians = data
          .map(normalizeTechnician)
          .filter(Boolean);

        setTechnicians(normalizedTechnicians);
      } catch (error) {
        if (
          error?.code === "ERR_CANCELED" ||
          controller.signal.aborted ||
          !active
        ) {
          return;
        }

        const axiosError = getAxiosError(error);

        toast.error(axiosError?.message || "Failed to load technicians.");

        setTechnicians([]);
      } finally {
        if (active && !controller.signal.aborted) {
          setLoadingTechnicians(false);
        }
      }
    }

    fetchTechnicians();

    return () => {
      active = false;
      controller.abort();
    };
  }, [isConfirm]);

  function handleTechnicianChange(event) {
    const value = event.target.value;

    if (!value) {
      setSelectedTechnicianId("");
      return;
    }

    const technicianId = Number(value);

    if (!Number.isInteger(technicianId) || technicianId <= 0) {
      setSelectedTechnicianId("");
      return;
    }

    setSelectedTechnicianId(String(technicianId));
  }

  function handleConfirm() {
    if (loading) {
      return;
    }

    if (isConfirm) {
      if (!selectedTechnicianId) {
        toast.error("Please select a technician.");
        return;
      }

      const technicianId = Number(selectedTechnicianId);

      if (!Number.isInteger(technicianId) || technicianId <= 0) {
        toast.error("Invalid technician selected.");
        return;
      }

      const technicianExists = technicians.some(
        (technician) => Number(technician.id) === technicianId,
      );

      if (!technicianExists) {
        toast.error("Selected technician is not available.");
        return;
      }

      const payload = {
        technician_id: technicianId,
      };

      console.log("BOOKING STATUS MODAL PAYLOAD:", payload);

      onConfirm(payload);

      return;
    }

    onConfirm();
  }

  const config = statusConfig[action] || statusConfig.confirm;

  const Icon = config.icon;

  const normalizedSelectedTechnicianId = Number(selectedTechnicianId);

  const hasValidTechnician =
    Number.isInteger(normalizedSelectedTechnicianId) &&
    normalizedSelectedTechnicianId > 0;

  const canConfirm = !isConfirm || hasValidTechnician;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}
            >
              <Icon size={21} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {config.title}
              </h2>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                {config.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Booking
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {booking?.booking_number ||
                booking?.bookingNumber ||
                `#${booking?.id ?? "-"}`}
            </p>

            {booking?.customer_name ? (
              <p className="mt-1 text-xs text-gray-500">
                {booking.customer_name}
              </p>
            ) : booking?.customer?.name ? (
              <p className="mt-1 text-xs text-gray-500">
                {booking.customer.name}
              </p>
            ) : booking?.customer?.username ? (
              <p className="mt-1 text-xs text-gray-500">
                {booking.customer.username}
              </p>
            ) : null}
          </div>

          {isConfirm ? (
            <div className="space-y-2">
              <label
                htmlFor="booking-technician"
                className="block text-sm font-medium text-gray-700"
              >
                PIC Technician
                <span className="ml-1 text-red-500">*</span>
              </label>

              <div className="relative">
                <UserCog
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400"
                />

                <select
                  id="booking-technician"
                  value={selectedTechnicianId}
                  onChange={handleTechnicianChange}
                  disabled={loading || loadingTechnicians}
                  className="h-11 w-full appearance-none rounded-xl border border-gray-300 bg-white px-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                >
                  <option value="">
                    {loadingTechnicians
                      ? "Loading technicians..."
                      : technicians.length === 0
                        ? "No technicians available"
                        : "Select technician"}
                  </option>

                  {technicians.map((technician) => (
                    <option key={technician.id} value={String(technician.id)}>
                      {getTechnicianName(technician)}
                    </option>
                  ))}
                </select>

                {loadingTechnicians ? (
                  <Loader2
                    size={18}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
                  />
                ) : (
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                )}
              </div>

              {technicians.length === 0 && !loadingTechnicians ? (
                <p className="text-xs leading-5 text-amber-600">
                  No technicians available. Please add an active technician
                  first.
                </p>
              ) : (
                <p className="text-xs leading-5 text-gray-500">
                  Select the technician responsible for this booking.
                </p>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50/80 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              loading ||
              !canConfirm ||
              (isConfirm && (loadingTechnicians || technicians.length === 0))
            }
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${config.buttonClass}`}
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : null}

            {loading ? config.loading : config.button}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingStatusModal({
  open,
  booking,
  action,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open || !booking || !action) {
    return null;
  }

  const modalKey = `${booking.id ?? "new"}-${action}`;

  return (
    <BookingStatusModalContent
      key={modalKey}
      booking={booking}
      action={action}
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
