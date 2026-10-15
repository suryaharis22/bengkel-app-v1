"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Loader2,
  MessageSquareWarning,
  Motorbike,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";
import CustomerVehicleForm from "@/components/customer/vehicles/CustomerVehicleForm";

const MAX_TEXT_LENGTH = 5000;

function formatVehicle(vehicle) {
  if (!vehicle) {
    return "-";
  }

  const brand = vehicle.brand || "";
  const model = vehicle.model || "";

  const plate =
    vehicle.plate_number ||
    vehicle.plateNumber ||
    vehicle.plat_nomor ||
    vehicle.platNomor ||
    vehicle.license_plate ||
    "";

  const name = [brand, model].filter(Boolean).join(" ");

  if (name && plate) {
    return `${name} • ${plate}`;
  }

  return name || plate || "-";
}

function getDefaultDateTime() {
  const now = new Date();

  now.setMinutes(now.getMinutes() + 30);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function extractVehicles(response) {
  const payload = response?.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  if (Array.isArray(payload?.vehicles)) {
    return payload.vehicles;
  }

  if (Array.isArray(payload?.data?.vehicles)) {
    return payload.data.vehicles;
  }

  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }

  return [];
}

export default function CustomerBookingForm({ onSuccess, onCancel }) {
  const router = useRouter();

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  const [vehicleId, setVehicleId] = useState("");

  const [complaint, setComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduledAt, setScheduledAt] = useState(getDefaultDateTime());

  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [errors, setErrors] = useState({});

  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);

  /**
   * Fetch vehicles dari API.
   * Fungsi ini dipakai untuk:
   * - Refresh
   * - Setelah Add Vehicle
   */
  async function loadVehicles({
    selectVehicleId = null,
    showLoading = true,
  } = {}) {
    if (showLoading) {
      setLoadingVehicles(true);
    }

    try {
      const response = await api.get("/customer/vehicles", {
        params: {
          page: 1,
          per_page: 100,
        },
      });

      const result = extractVehicles(response);

      setVehicles(result);

      if (result.length === 0) {
        setVehicleId("");
        return;
      }

      /**
       * Jika ada vehicle baru yang baru dibuat,
       * langsung pilih vehicle tersebut.
       */
      if (selectVehicleId) {
        const newVehicle = result.find(
          (vehicle) => String(vehicle.id) === String(selectVehicleId),
        );

        if (newVehicle) {
          setVehicleId(String(newVehicle.id));
          return;
        }
      }

      /**
       * Pertahankan vehicle yang sedang dipilih
       * jika masih tersedia.
       */
      setVehicleId((current) => {
        const exists = result.some(
          (vehicle) => String(vehicle.id) === String(current),
        );

        return exists ? current : "";
      });
    } catch (error) {
      const axiosError = getAxiosError(error);

      setVehicles([]);
      setVehicleId("");

      toast.error(axiosError?.message || "Failed to load customer vehicles.");
    } finally {
      if (showLoading) {
        setLoadingVehicles(false);
      }
    }
  }

  /**
   * Initial vehicle loading.
   *
   * Rule React terbaru `set-state-in-effect` mendeteksi
   * bahwa fungsi yang dipanggil di dalam effect melakukan
   * setState setelah request API.
   *
   * Initial API fetch memang diperlukan karena data vehicle
   * berasal dari backend, sehingga pengecualian hanya diberikan
   * untuk effect ini.
   */
  useEffect(() => {
    let active = true;

    async function fetchInitialVehicles() {
      setLoadingVehicles(true);

      try {
        const response = await api.get("/customer/vehicles", {
          params: {
            page: 1,
            per_page: 100,
          },
        });

        if (!active) {
          return;
        }

        const result = extractVehicles(response);

        setVehicles(result);

        if (result.length === 0) {
          setVehicleId("");
        }
      } catch (error) {
        if (!active) {
          return;
        }

        const axiosError = getAxiosError(error);

        setVehicles([]);
        setVehicleId("");

        toast.error(axiosError?.message || "Failed to load customer vehicles.");
      } finally {
        if (active) {
          setLoadingVehicles(false);
        }
      }
    }

    fetchInitialVehicles();

    return () => {
      active = false;
    };

    // Initial API fetch memang membutuhkan state update
    // setelah component mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, []);

  const selectedVehicle = useMemo(() => {
    return vehicles.find((vehicle) => String(vehicle.id) === String(vehicleId));
  }, [vehicles, vehicleId]);

  function validate() {
    const nextErrors = {};

    if (!vehicleId) {
      nextErrors.vehicle_id = "Please select a vehicle.";
    }

    if (!complaint.trim()) {
      nextErrors.complaint = "Complaint is required.";
    } else if (complaint.trim().length > MAX_TEXT_LENGTH) {
      nextErrors.complaint = "Complaint must not exceed 5000 characters.";
    }

    if (notes.trim().length > MAX_TEXT_LENGTH) {
      nextErrors.notes = "Notes must not exceed 5000 characters.";
    }

    if (!scheduledAt) {
      nextErrors.scheduled_at = "Scheduled date and time is required.";
    } else {
      const selectedDate = new Date(scheduledAt);

      if (Number.isNaN(selectedDate.getTime())) {
        nextErrors.scheduled_at = "Scheduled date and time must be valid.";
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting || redirecting) {
      return;
    }

    if (vehicles.length === 0) {
      toast.error("Please add a vehicle before creating a booking.");

      return;
    }

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/customer/bookings", {
        vehicle_id: Number(vehicleId),
        complaint: complaint.trim(),
        notes: notes.trim() || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
      });

      const booking = response?.data?.data;

      toast.success(response?.data?.message || "Booking created successfully.");

      onSuccess?.(booking);

      setRedirecting(true);
      setSubmitting(false);

      setTimeout(() => {
        router.push("/customer/bookings");
      }, 5000);
    } catch (error) {
      const axiosError = getAxiosError(error);

      toast.error(axiosError?.message || "Failed to create booking.");

      setSubmitting(false);
    }
  }

  function handleVehicleChange(event) {
    setVehicleId(event.target.value);

    if (errors.vehicle_id) {
      setErrors((current) => ({
        ...current,
        vehicle_id: undefined,
      }));
    }
  }

  function handleComplaintChange(event) {
    const value = event.target.value;

    if (value.length <= MAX_TEXT_LENGTH) {
      setComplaint(value);
    }

    if (errors.complaint) {
      setErrors((current) => ({
        ...current,
        complaint: undefined,
      }));
    }
  }

  function handleNotesChange(event) {
    const value = event.target.value;

    if (value.length <= MAX_TEXT_LENGTH) {
      setNotes(value);
    }

    if (errors.notes) {
      setErrors((current) => ({
        ...current,
        notes: undefined,
      }));
    }
  }

  function handleScheduledAtChange(event) {
    setScheduledAt(event.target.value);

    if (errors.scheduled_at) {
      setErrors((current) => ({
        ...current,
        scheduled_at: undefined,
      }));
    }
  }

  function handleOpenVehicleForm() {
    if (submitting || redirecting) {
      return;
    }

    setVehicleFormOpen(true);
  }

  function handleCloseVehicleForm() {
    setVehicleFormOpen(false);
  }

  async function handleVehicleSuccess(vehicle) {
    setVehicleFormOpen(false);

    if (!vehicle) {
      await loadVehicles({
        showLoading: false,
      });

      return;
    }

    /**
     * Update UI langsung agar vehicle baru
     * langsung terlihat tanpa menunggu request kedua.
     */
    setVehicles((current) => {
      const exists = current.some(
        (item) => String(item.id) === String(vehicle.id),
      );

      if (exists) {
        return current.map((item) =>
          String(item.id) === String(vehicle.id) ? vehicle : item,
        );
      }

      return [vehicle, ...current];
    });

    /**
     * Langsung pilih vehicle baru.
     */
    if (vehicle.id) {
      setVehicleId(String(vehicle.id));
    }

    /**
     * Sinkronisasi ulang dengan backend.
     */
    await loadVehicles({
      selectVehicleId: vehicle.id,
      showLoading: false,
    });

    toast.success("Vehicle added and selected.");
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* =========================
            VEHICLE
        ========================== */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Motorbike size={19} strokeWidth={2} />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">Vehicle</h2>

                  <p className="mt-0.5 text-sm text-gray-500">
                    Select the vehicle you want to service.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadVehicles({
                    showLoading: true,
                  })
                }
                disabled={loadingVehicles || submitting || redirecting}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={loadingVehicles ? "animate-spin" : ""}
                />

                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          <div className="p-5">
            {loadingVehicles ? (
              <div className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                Loading vehicles...
              </div>
            ) : vehicles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8">
                <div className="mx-auto max-w-md text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Motorbike size={23} />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-gray-900">
                    No vehicles registered
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-gray-500">
                    You don't have any registered vehicles yet. Please add a
                    vehicle before creating a booking.
                  </p>

                  <button
                    type="button"
                    onClick={handleOpenVehicleForm}
                    disabled={submitting || redirecting}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={16} />
                    Add Vehicle
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="vehicle_id"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Vehicle <span className="text-red-600">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleOpenVehicleForm}
                    disabled={submitting || redirecting}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={15} />
                    Add Vehicle
                  </button>
                </div>

                <select
                  id="vehicle_id"
                  value={vehicleId}
                  onChange={handleVehicleChange}
                  disabled={submitting || redirecting}
                  className={[
                    "h-11 w-full rounded-xl border",
                    "bg-white px-3 text-sm text-gray-900",
                    "outline-none transition",
                    errors.vehicle_id
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100",
                    "disabled:cursor-not-allowed disabled:bg-gray-50",
                  ].join(" ")}
                >
                  <option value="">Select vehicle</option>

                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {formatVehicle(vehicle)}
                    </option>
                  ))}
                </select>

                {errors.vehicle_id ? (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.vehicle_id}
                  </p>
                ) : null}

                {selectedVehicle ? (
                  <div className="mt-3 rounded-xl bg-gray-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-500">
                        <Motorbike size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {formatVehicle(selectedVehicle)}
                        </p>

                        <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-gray-500">
                          {selectedVehicle.year ? (
                            <span>Year {selectedVehicle.year}</span>
                          ) : null}

                          {selectedVehicle.color ? (
                            <>
                              <span>•</span>

                              <span>{selectedVehicle.color}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>

        {/* =========================
            SERVICE SCHEDULE
        ========================== */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <CalendarDays size={19} strokeWidth={2} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Service Schedule
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Choose your preferred service date and time.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <label
              htmlFor="scheduled_at"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Scheduled Date & Time <span className="text-red-600">*</span>
            </label>

            <input
              id="scheduled_at"
              type="datetime-local"
              value={scheduledAt}
              onChange={handleScheduledAtChange}
              disabled={submitting || redirecting}
              className={[
                "h-11 w-full rounded-xl border",
                "bg-white px-3 text-sm text-gray-900",
                "outline-none transition",
                errors.scheduled_at
                  ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100",
                "disabled:cursor-not-allowed disabled:bg-gray-50",
              ].join(" ")}
            />

            {errors.scheduled_at ? (
              <p className="mt-2 text-sm text-red-600">{errors.scheduled_at}</p>
            ) : (
              <p className="mt-2 text-xs text-gray-400">
                The workshop will review your requested schedule.
              </p>
            )}
          </div>
        </section>

        {/* =========================
            COMPLAINT
        ========================== */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <MessageSquareWarning size={19} strokeWidth={2} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">Complaint</h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Describe the problem with your vehicle.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <label
              htmlFor="complaint"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Complaint <span className="text-red-600">*</span>
            </label>

            <textarea
              id="complaint"
              value={complaint}
              onChange={handleComplaintChange}
              disabled={submitting || redirecting}
              rows={6}
              placeholder="Example: Engine makes unusual noise when accelerating..."
              className={[
                "w-full resize-y rounded-xl border",
                "bg-white px-3 py-3 text-sm text-gray-900",
                "outline-none transition",
                "placeholder:text-gray-400",
                errors.complaint
                  ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100",
                "disabled:cursor-not-allowed disabled:bg-gray-50",
              ].join(" ")}
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              {errors.complaint ? (
                <p className="text-sm text-red-600">{errors.complaint}</p>
              ) : (
                <span />
              )}

              <p
                className={[
                  "shrink-0 text-xs",
                  complaint.length >= MAX_TEXT_LENGTH
                    ? "text-red-600"
                    : "text-gray-400",
                ].join(" ")}
              >
                {complaint.length}/{MAX_TEXT_LENGTH}
              </p>
            </div>
          </div>
        </section>

        {/* =========================
            NOTES
        ========================== */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <FileText size={19} strokeWidth={2} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Additional Notes
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Add any additional information for the workshop.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Notes
            </label>

            <textarea
              id="notes"
              value={notes}
              onChange={handleNotesChange}
              disabled={submitting || redirecting}
              rows={5}
              placeholder="Example: Please check the brakes as well..."
              className={[
                "w-full resize-y rounded-xl border",
                "border-gray-200 bg-white",
                "px-3 py-3 text-sm text-gray-900",
                "outline-none transition",
                "placeholder:text-gray-400",
                "focus:border-red-500 focus:ring-2 focus:ring-red-100",
                "disabled:cursor-not-allowed disabled:bg-gray-50",
              ].join(" ")}
            />

            <div className="mt-2 flex justify-end">
              <p
                className={[
                  "text-xs",
                  notes.length >= MAX_TEXT_LENGTH
                    ? "text-red-600"
                    : "text-gray-400",
                ].join(" ")}
              >
                {notes.length}/{MAX_TEXT_LENGTH}
              </p>
            </div>

            {errors.notes ? (
              <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
            ) : null}
          </div>
        </section>

        {/* =========================
            REDIRECT MESSAGE
        ========================== */}
        {redirecting ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Booking berhasil disimpan. Anda akan dikembalikan ke halaman booking
            dalam 5 detik...
          </div>
        ) : null}

        {/* =========================
            ACTIONS
        ========================== */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting || redirecting}
            className={[
              "inline-flex h-11 items-center justify-center gap-2",
              "rounded-xl border border-gray-200",
              "px-5 text-sm font-semibold text-gray-700",
              "transition-colors hover:bg-gray-50",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            <X size={17} strokeWidth={2} />
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              submitting ||
              redirecting ||
              loadingVehicles ||
              vehicles.length === 0
            }
            className={[
              "inline-flex h-11 items-center justify-center gap-2",
              "rounded-xl bg-red-600 px-5",
              "text-sm font-semibold text-white",
              "transition-colors hover:bg-red-700",
              "disabled:cursor-not-allowed disabled:opacity-60",
            ].join(" ")}
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Creating Booking...
              </>
            ) : redirecting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <CalendarDays size={17} strokeWidth={2} />
                Create Booking
              </>
            )}
          </button>
        </div>
      </form>

      {/* =========================
          ADD VEHICLE MODAL
      ========================== */}
      {vehicleFormOpen ? (
        <CustomerVehicleForm
          key="new-customer-vehicle"
          vehicle={null}
          open={vehicleFormOpen}
          onClose={handleCloseVehicleForm}
          onSuccess={handleVehicleSuccess}
        />
      ) : null}
    </>
  );
}
