"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import ServiceOrderActions from "./ServiceOrderActions";
import ServiceOrderComplaintCard from "./ServiceOrderComplaintCard";
import ServiceOrderCustomerCard from "./ServiceOrderCustomerCard";
import ServiceOrderHeader from "./ServiceOrderHeader";
import ServiceOrderPaymentHistory from "./ServiceOrderPaymentHistory";
import ServiceOrderPaymentSummary from "./ServiceOrderPaymentSummary";
import ServiceOrderServiceList from "./ServiceOrderServiceList";
import ServiceOrderSparePartList from "./ServiceOrderSparePartList";
import ServiceOrderTechnicianCard from "./ServiceOrderTechnicianCard";
import ServiceOrderVehicleCard from "./ServiceOrderVehicleCard";

function getOrderFromResponse(response) {
  return (
    response?.data?.data?.data || response?.data?.data || response?.data || null
  );
}

export default function ServiceOrderDetail({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadOrder = useCallback(
    async (signal) => {
      if (!orderId) {
        setOrder(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/admin/service-orders/${orderId}`, {
          signal,
        });

        if (signal.aborted) {
          return;
        }

        const data = getOrderFromResponse(response);

        setOrder(data);
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || signal.aborted) {
          return;
        }

        const axiosError = getAxiosError(error);

        toast.error(axiosError.message);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [orderId],
  );

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      loadOrder(controller.signal);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadOrder, refreshKey]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((current) => current + 1);
  }, []);

  if (loading && !order) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Loader2 size={20} className="animate-spin text-red-600" />
          Loading service order...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
        <div className="text-center">
          <h2 className="text-base font-semibold text-gray-900">
            Service order not found
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            The requested service order could not be loaded.
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const payments = Array.isArray(order.payments) ? order.payments : [];

  return (
    <div className="relative space-y-6">
      <ServiceOrderHeader order={order} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ServiceOrderCustomerCard order={order} />

        <ServiceOrderVehicleCard order={order} />
      </div>

      <ServiceOrderTechnicianCard order={order} onRefresh={handleRefresh} />

      <ServiceOrderComplaintCard order={order} />

      <ServiceOrderServiceList order={order} onRefresh={handleRefresh} />

      <ServiceOrderSparePartList order={order} onRefresh={handleRefresh} />

      {/* Payment summary */}
      <ServiceOrderPaymentSummary order={order} />

      {/* Payment transaction history */}
      {payments.length > 0 && (
        <ServiceOrderPaymentHistory payments={payments} loading={loading} />
      )}

      {/* Order actions and payment modal */}
      <ServiceOrderActions order={order} onRefresh={handleRefresh} />

      {loading && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-lg">
          <Loader2 size={16} className="animate-spin text-red-600" />
          Updating order...
        </div>
      )}
    </div>
  );
}
