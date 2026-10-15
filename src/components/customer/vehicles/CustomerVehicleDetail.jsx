"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Edit, Loader2, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import VehicleInfo from "@/components/vehicles/VehicleInfo";
import VehicleServiceSummary from "@/components/vehicles/VehicleServiceSummary";
import CustomerVehicleServiceHistory from "./CustomerVehicleServiceHistory";

function getErrorMessage(error, fallback) {
  return (
    getAxiosError(error, fallback) ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function getVehicleFromResponse(response) {
  return (
    response?.data?.data?.data || response?.data?.data || response?.data || null
  );
}

function getServiceHistoryFromResponse(response) {
  const data = response?.data?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

export default function CustomerVehicleDetail() {
  const params = useParams();
  const router = useRouter();

  const vehicleId = params?.id;

  const [vehicle, setVehicle] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [refreshKey, setRefreshKey] = useState(0);

  // ============================================================
  // LOAD VEHICLE
  // ============================================================

  useEffect(() => {
    if (!vehicleId) {
      return;
    }

    let cancelled = false;

    async function fetchVehicle() {
      setLoading(true);

      try {
        const response = await api.get(`/customer/vehicles/${vehicleId}`);

        if (cancelled) {
          return;
        }

        const success = response?.data?.success !== false;

        if (!success) {
          throw new Error(response?.data?.message || "Failed to load vehicle");
        }

        const vehicleData = getVehicleFromResponse(response);

        if (!vehicleData) {
          throw new Error("Vehicle data not found");
        }

        setVehicle(vehicleData);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Load customer vehicle detail error:", error);

        setVehicle(null);

        toast.error(getErrorMessage(error, "Failed to load vehicle detail"));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchVehicle();

    return () => {
      cancelled = true;
    };
  }, [vehicleId, refreshKey]);

  // ============================================================
  // LOAD SERVICE HISTORY
  // ============================================================

  useEffect(() => {
    if (!vehicleId) {
      return;
    }

    let cancelled = false;

    async function fetchServiceHistory() {
      setLoadingHistory(true);

      try {
        const response = await api.get(
          `/customer/vehicles/${vehicleId}/service-history`,
        );

        if (cancelled) {
          return;
        }

        const success = response?.data?.success !== false;

        if (!success) {
          throw new Error(
            response?.data?.message || "Failed to load service history",
          );
        }

        const history = getServiceHistoryFromResponse(response);

        setServiceHistory(history);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Load customer vehicle service history error:", error);

        setServiceHistory([]);

        toast.error(
          getErrorMessage(error, "Failed to load vehicle service history"),
        );
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    fetchServiceHistory();

    return () => {
      cancelled = true;
    };
  }, [vehicleId, refreshKey]);

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  // ============================================================
  // EDIT
  // ============================================================

  const handleEdit = useCallback(
    (currentVehicle) => {
      if (!currentVehicle?.id) {
        return;
      }

      router.push(`/customer/vehicles/${currentVehicle.id}/edit`);
    },
    [router],
  );

  // ============================================================
  // BACK
  // ============================================================

  const handleBack = useCallback(() => {
    router.push("/customer/vehicles");
  }, [router]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading && !vehicle) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />

          <span>Loading vehicle...</span>
        </div>
      </div>
    );
  }

  // ============================================================
  // NOT FOUND
  // ============================================================

  if (!vehicle && !loading) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={handleBack}
          className={[
            "inline-flex h-9 items-center gap-2",
            "rounded-lg border border-gray-300 bg-white",
            "px-3 text-sm font-medium text-gray-700",
            "transition hover:bg-gray-50",
          ].join(" ")}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-900">
            Vehicle not found
          </p>

          <p className="mt-1 text-xs text-gray-500">
            The requested vehicle could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Vehicles
          </button>

          <h1 className="text-xl font-bold text-gray-900">Vehicle Detail</h1>

          <p className="mt-1 text-sm text-gray-500">
            View your vehicle information and service history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* REFRESH */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || loadingHistory}
            className={[
              "inline-flex h-10 items-center gap-2",
              "rounded-lg border border-gray-300 bg-white",
              "px-3 text-sm font-medium text-gray-700",
              "transition hover:bg-gray-50",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            <RefreshCw
              size={16}
              className={loading || loadingHistory ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {/* EDIT */}
          {vehicle && (
            <button
              type="button"
              onClick={() => handleEdit(vehicle)}
              className={[
                "inline-flex h-10 items-center gap-2",
                "rounded-lg bg-red-600 px-4",
                "text-sm font-semibold text-white",
                "transition hover:bg-red-700",
              ].join(" ")}
            >
              <Edit size={16} />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* VEHICLE INFORMATION */}
      <VehicleInfo vehicle={vehicle} />

      {/* SERVICE SUMMARY */}
      <VehicleServiceSummary
        vehicle={vehicle}
        serviceSummary={null}
        loading={loadingHistory}
      />

      {/* SERVICE HISTORY */}
      <CustomerVehicleServiceHistory
        vehicleId={vehicle?.id}
        serviceHistory={serviceHistory}
        loading={loadingHistory}
      />
    </div>
  );
}
