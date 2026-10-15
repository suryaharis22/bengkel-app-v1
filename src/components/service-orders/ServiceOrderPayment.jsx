"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Loader2, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import ServiceOrderPaymentHistory from "./ServiceOrderPaymentHistory";
import ServiceOrderPaymentModal from "./ServiceOrderPaymentModal";
import ServiceOrderPaymentSummary from "./ServiceOrderPaymentSummary";

function getResponseData(response) {
  return (
    response?.data?.data?.data || response?.data?.data || response?.data || null
  );
}

function getResponseMessage(response) {
  return (
    response?.data?.message ||
    response?.data?.data?.message ||
    "Payment processed successfully."
  );
}

function normalizePaymentData(data) {
  if (!data) {
    return null;
  }

  if (data.summary || data.payments || data.service_order) {
    return data;
  }

  if (data.data) {
    return normalizePaymentData(data.data);
  }

  return data;
}

function normalizeOrder(data) {
  if (!data) {
    return null;
  }

  const paymentData = normalizePaymentData(data);

  if (!paymentData) {
    return null;
  }

  const serviceOrder = paymentData.service_order;
  const summary = paymentData.summary || {};

  if (serviceOrder) {
    return {
      ...serviceOrder,
      ...summary,
      payments: paymentData.payments || [],
      midtrans: paymentData.midtrans || null,
    };
  }

  return {
    ...paymentData,
    ...summary,
    payments: paymentData.payments || [],
    midtrans: paymentData.midtrans || null,
  };
}

function getPaymentHistory(data) {
  const normalized = normalizePaymentData(data);

  if (!normalized) {
    return [];
  }

  return Array.isArray(normalized.payments) ? normalized.payments : [];
}

function getPaymentResult(data) {
  const normalized = normalizePaymentData(data);

  if (!normalized) {
    return null;
  }

  return normalized;
}

export default function ServiceOrderPayment({
  serviceOrderId,
  initialOrder = null,
  autoLoad = true,
}) {
  const [order, setOrder] = useState(normalizeOrder(initialOrder));
  const [payments, setPayments] = useState(getPaymentHistory(initialOrder));

  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const loadPayment = useCallback(
    async ({ showLoading = true } = {}) => {
      if (!serviceOrderId) {
        return null;
      }

      if (showLoading) {
        setLoading(true);
      }

      try {
        const response = await api.get(
          `/admin/service-orders/${serviceOrderId}/payment`,
        );

        const data = getResponseData(response);
        const normalized = normalizeOrder(data);
        const history = getPaymentHistory(data);

        if (normalized) {
          setOrder(normalized);
        }

        setPayments(history);

        return normalized;
      } catch (error) {
        const message = getAxiosError(
          error,
          "Failed to load service order payment.",
        );

        toast.error(message);

        throw error;
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [serviceOrderId],
  );

  useEffect(() => {
    if (!autoLoad || !serviceOrderId) {
      return;
    }

    const timer = setTimeout(() => {
      loadPayment().catch(() => {});
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [autoLoad, serviceOrderId, loadPayment]);

  const handleRefresh = async () => {
    try {
      await loadPayment();
    } catch {
      return;
    }
  };

  const handleOpenPayment = () => {
    if (!order) {
      toast.error("Service order payment data is not available.");
      return;
    }

    const paymentStatus = order.payment_status;

    if (paymentStatus === "paid") {
      toast.info("This service order has already been paid.");
      return;
    }

    if (paymentStatus === "refunded") {
      toast.error("A refunded service order cannot be paid.");
      return;
    }

    if (order.status === "cancelled") {
      toast.error("A cancelled service order cannot be paid.");
      return;
    }

    const remainingAmount =
      Number(order.remaining_amount) ||
      Math.max(
        (Number(order.total) || Number(order.grand_total) || 0) -
          (Number(order.paid_amount) || 0),
        0,
      );

    if (remainingAmount <= 0) {
      toast.info("There is no remaining payment.");
      return;
    }

    setPaymentModalOpen(true);
  };

  const handleClosePayment = () => {
    if (paymentLoading) {
      return;
    }

    setPaymentModalOpen(false);
  };

  const handlePayment = async (payload) => {
    if (!payload?.payment_method) {
      toast.error("Payment method is required.");
      return;
    }

    if (paymentLoading) {
      return;
    }

    setPaymentLoading(true);

    try {
      if (
        payload.payment_method !== "cash" &&
        typeof window !== "undefined" &&
        !window.snap
      ) {
        toast.error("Midtrans Snap belum siap. Silakan tunggu beberapa saat.");

        return;
      }

      const response = await api.post(
        `/admin/service-orders/${serviceOrderId}/payment`,
        payload,
      );

      const data = getResponseData(response);
      const result = getPaymentResult(data);

      const message = getResponseMessage(response);

      const paymentResult = result?.payment || null;

      const snapToken =
        paymentResult?.token ||
        paymentResult?.snap_token ||
        result?.token ||
        result?.snap_token ||
        result?.data?.payment?.token ||
        result?.data?.payment?.snap_token ||
        null;

      if (payload.payment_method !== "cash") {
        if (!snapToken) {
          throw new Error("Midtrans payment token tidak tersedia.");
        }

        setPaymentModalOpen(false);

        toast.success(message);

        window.snap.pay(snapToken, {
          onSuccess: async () => {
            toast.success("Pembayaran berhasil diproses.");

            await loadPayment({
              showLoading: false,
            });
          },

          onPending: async () => {
            toast.info("Pembayaran masih menunggu konfirmasi.");

            await loadPayment({
              showLoading: false,
            });
          },

          onError: async () => {
            toast.error("Pembayaran Midtrans gagal.");

            await loadPayment({
              showLoading: false,
            });
          },

          onClose: async () => {
            await loadPayment({
              showLoading: false,
            });
          },
        });

        return;
      }

      toast.success(message);

      setPaymentModalOpen(false);

      const refreshedOrder = await loadPayment({
        showLoading: false,
      });

      const changeAmount = Number(refreshedOrder?.change_amount) || 0;

      if (changeAmount > 0) {
        toast.success(
          `Payment successful. Change: ${new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(changeAmount)}`,
        );
      }
    } catch (error) {
      const message = getAxiosError(error, "Failed to process payment.");

      toast.error(message);

      throw new Error(message);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!serviceOrderId) {
    return (
      <section className="rounded-2xl border border-red-100 bg-red-50 p-5">
        <p className="text-sm font-medium text-red-700">
          Service order ID is required.
        </p>
      </section>
    );
  }

  if (loading && !order) {
    return (
      <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">Payment</h2>

              <p className="mt-0.5 text-sm text-gray-500">
                Loading payment information...
              </p>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-32 rounded bg-gray-100" />
              <div className="h-8 w-48 rounded bg-gray-100" />
              <div className="h-20 rounded-xl bg-gray-100" />
            </div>
          </div>
        </section>

        <ServiceOrderPaymentHistory payments={[]} loading />
      </div>
    );
  }

  if (!order) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">
            <CreditCard size={22} />
          </div>

          <h2 className="mt-4 text-base font-semibold text-gray-900">
            Payment Data Not Found
          </h2>

          <p className="mt-1 max-w-sm text-sm leading-5 text-gray-500">
            Payment information for this service order could not be loaded.
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Retry
          </button>
        </div>
      </section>
    );
  }

  const paymentStatus = order.payment_status;

  const remainingAmount =
    order.remaining_amount !== undefined && order.remaining_amount !== null
      ? Number(order.remaining_amount) || 0
      : Math.max(
          (Number(order.total) || Number(order.grand_total) || 0) -
            (Number(order.paid_amount) || 0),
          0,
        );

  const canPay =
    order.status !== "cancelled" &&
    paymentStatus !== "paid" &&
    paymentStatus !== "refunded" &&
    remainingAmount > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Wallet size={20} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-gray-900">
              Service Order Payment
            </h1>

            <p className="mt-0.5 truncate text-sm text-gray-500">
              {order.order_number || "Service Order"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || paymentLoading}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          Refresh
        </button>
      </div>

      <ServiceOrderPaymentSummary order={order} />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-gray-500" />

              <h2 className="text-base font-semibold text-gray-900">
                Payment Action
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {canPay
                ? "Process the remaining payment for this service order."
                : paymentStatus === "paid"
                  ? "This service order has been fully paid."
                  : paymentStatus === "refunded"
                    ? "This service order has been refunded."
                    : order.status === "cancelled"
                      ? "Cancelled service orders cannot be paid."
                      : "There is no remaining payment."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenPayment}
            disabled={!canPay || paymentLoading}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paymentLoading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Wallet size={17} />
            )}
            Make Payment
          </button>
        </div>
      </div>

      <ServiceOrderPaymentHistory payments={payments} loading={loading} />

      <ServiceOrderPaymentModal
        open={paymentModalOpen}
        order={{
          ...order,
          remaining_amount: remainingAmount,
        }}
        onClose={handleClosePayment}
        onSubmit={handlePayment}
        loading={paymentLoading}
      />
    </div>
  );
}
