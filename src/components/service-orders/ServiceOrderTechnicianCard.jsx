"use client";

import { useState } from "react";
import { Check, ChevronDown, Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

function getTechniciansFromResponse(response) {
  return (
    response?.data?.data?.data || response?.data?.data || response?.data || []
  );
}

export default function ServiceOrderTechnicianCard({ order, onRefresh }) {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const currentTechnicianId = order?.technician_id
    ? String(order.technician_id)
    : "";

  const effectiveTechnicianId = selectedTechnicianId || currentTechnicianId;

  const hasTechnician = Boolean(order?.technician_id);

  const isEditable =
    order?.status === "pending" || order?.status === "confirmed";

  const assignedTechnician =
    order?.technician ||
    technicians.find(
      (technician) => Number(technician.id) === Number(order?.technician_id),
    );

  async function loadTechnicians() {
    if (loaded || loading) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.get("/admin/technicians");

      const data = getTechniciansFromResponse(response);

      setTechnicians(Array.isArray(data) ? data : []);

      setLoaded(true);
    } catch (error) {
      const axiosError = getAxiosError(error);

      toast.error(axiosError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenTechnicianSelect() {
    loadTechnicians();
  }

  function handleTechnicianChange(event) {
    setSelectedTechnicianId(event.target.value);
  }

  async function handleAssign() {
    if (!effectiveTechnicianId) {
      toast.error("Please select a technician.");

      return;
    }

    const technicianId = Number(effectiveTechnicianId);

    if (!Number.isInteger(technicianId) || technicianId <= 0) {
      toast.error("Invalid technician selected.");

      return;
    }

    if (technicianId === Number(order?.technician_id)) {
      toast.info("This technician is already assigned.");

      return;
    }

    try {
      setSaving(true);

      await api.put(`/admin/service-orders/${order.id}/technician`, {
        technician_id: technicianId,
      });

      toast.success("Technician assigned successfully.");

      setSelectedTechnicianId("");
      setLoaded(false);
      setTechnicians([]);

      onRefresh?.();
    } catch (error) {
      const axiosError = getAxiosError(error);

      toast.error(axiosError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <UserCog size={20} />
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">
              PIC Technician
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Assign the technician responsible for this service order.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {hasTechnician ? (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
              <Check size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                Assigned Technician
              </p>

              <p className="truncate text-sm font-semibold text-gray-900">
                {assignedTechnician?.name ||
                  assignedTechnician?.username ||
                  assignedTechnician?.email ||
                  `Technician #${order.technician_id}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">
              No technician has been assigned yet.
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              Assign a PIC technician before starting the service.
            </p>
          </div>
        )}

        {isEditable ? (
          <div className="space-y-3">
            <label
              htmlFor="service-order-technician"
              className="block text-sm font-medium text-gray-700"
            >
              Select Technician
            </label>

            <div className="relative">
              <select
                id="service-order-technician"
                value={effectiveTechnicianId}
                onFocus={handleOpenTechnicianSelect}
                onChange={handleTechnicianChange}
                disabled={saving}
                className="h-11 w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <option value="">
                  {loading ? "Loading technicians..." : "Select technician"}
                </option>

                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name ||
                      technician.username ||
                      technician.email ||
                      `Technician #${technician.id}`}
                  </option>
                ))}
              </select>

              {loading ? (
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

            <button
              type="button"
              onClick={handleAssign}
              disabled={
                loading ||
                saving ||
                !effectiveTechnicianId ||
                Number(effectiveTechnicianId) === Number(order?.technician_id)
              }
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserCog size={17} />
                  {hasTechnician
                    ? "Update PIC Technician"
                    : "Assign PIC Technician"}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-sm text-gray-600">
              Technician assignment can no longer be changed after the service
              has started.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
