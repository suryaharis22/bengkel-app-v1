"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Receipt,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

function formatRupiah(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getErrorMessage(error, fallbackMessage) {
  const result = getAxiosError(error, fallbackMessage);

  if (typeof result === "string") {
    return result;
  }

  if (result?.message) {
    return result.message;
  }

  return fallbackMessage;
}

function getPaymentStatusLabel(status) {
  switch (status) {
    case "paid":
      return "Paid";
    case "partial":
      return "Partially Paid";
    case "unpaid":
      return "Unpaid";
    case "refunded":
      return "Refunded";
    default:
      return status || "Unknown";
  }
}

function getSaleStatusLabel(status) {
  switch (status) {
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    default:
      return status || "Unknown";
  }
}

function getPaymentStatusIcon(status) {
  if (status === "paid") {
    return CheckCircle2;
  }

  if (status === "cancelled" || status === "refunded") {
    return XCircle;
  }

  return Clock3;
}

function getPaymentStatusDescription(paymentStatus, saleStatus) {
  if (paymentStatus === "paid" && saleStatus === "completed") {
    return "Payment has been successfully completed.";
  }

  if (paymentStatus === "refunded" || saleStatus === "refunded") {
    return "This payment has been refunded.";
  }

  if (saleStatus === "cancelled") {
    return "This transaction has been cancelled.";
  }

  if (paymentStatus === "partial") {
    return "This transaction has been partially paid.";
  }

  return "Waiting for payment confirmation from Midtrans.";
}

function getMidtransStatusDescription(transactionStatus) {
  switch (transactionStatus) {
    case "settlement":
      return "Payment has been successfully settled by Midtrans.";

    case "capture":
      return "Payment has been successfully processed by Midtrans.";

    case "pending":
      return "Payment is still waiting for confirmation.";

    case "deny":
      return "Payment was denied by Midtrans.";

    case "cancel":
      return "Payment was cancelled.";

    case "expire":
      return "The payment session has expired.";

    case "failure":
      return "Payment failed.";

    default:
      return null;
  }
}

function formatPaymentMethod(value) {
  if (!value) {
    return "-";
  }

  switch (String(value).toLowerCase()) {
    case "cash":
      return "Cash";

    case "qris":
      return "QRIS";

    case "transfer":
      return "Bank Transfer";

    case "debit":
      return "Debit / Credit Card";

    case "ewallet":
      return "E-Wallet";

    case "gopay":
      return "GoPay";

    case "shopeepay":
      return "ShopeePay";

    case "bank_transfer":
      return "Bank Transfer";

    default:
      return value;
  }
}

export default function PaymentFinishPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("order_id") || "";
  const transactionStatus = searchParams.get("transaction_status") || "";

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(10);

  const goToCashier = useCallback(() => {
    router.replace("/admin/cashier");
  }, [router]);

  const fetchSale = useCallback(
    async ({ showLoading = false } = {}) => {
      if (!orderId) {
        setLoading(false);
        setError("Transaction order ID was not found.");
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        }

        setError("");

        const response = await api.get("/admin/cashier/sales", {
          params: {
            search: orderId,
            page: 1,
            per_page: 20,
          },
        });

        const result = response?.data;

        if (!result?.success) {
          throw new Error(
            result?.message || "Failed to retrieve transaction information.",
          );
        }

        const sales = Array.isArray(result?.data) ? result.data : [];

        const foundSale = sales.find(
          (item) =>
            item?.invoice_number === orderId ||
            item?.midtrans_order_id === orderId,
        );

        if (!foundSale) {
          throw new Error("Transaction not found.");
        }

        setSale(foundSale);
      } catch (requestError) {
        console.error("Fetch payment finish transaction error:", requestError);

        setError(
          getErrorMessage(
            requestError,
            "Failed to retrieve transaction information.",
          ),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId],
  );

  useEffect(() => {
    fetchSale({ showLoading: true });
  }, [fetchSale]);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const interval = setInterval(() => {
      fetchSale({ showLoading: false });
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchSale, orderId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (countdown !== 0) {
      return;
    }

    goToCashier();
  }, [countdown, goToCashier]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSale({ showLoading: false });
  };

  const paymentStatus = sale?.payment_status || "unpaid";
  const saleStatus = sale?.status || "completed";

  const StatusIcon = getPaymentStatusIcon(
    paymentStatus === "paid"
      ? "paid"
      : saleStatus === "cancelled" || saleStatus === "refunded"
        ? saleStatus
        : paymentStatus,
  );

  const midtransStatus =
    sale?.midtrans_transaction_status || transactionStatus || null;

  const midtransDescription = getMidtransStatusDescription(midtransStatus);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              </div>

              <h1 className="text-xl font-semibold text-gray-900">
                Processing Payment
              </h1>

              <p className="mt-2 max-w-md text-sm text-gray-500">
                Please wait while we retrieve your transaction information.
              </p>

              {orderId && (
                <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500">Order ID</p>
                  <p className="mt-1 break-all font-mono text-sm font-medium text-gray-900">
                    {orderId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !sale) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>

              <h1 className="text-xl font-semibold text-gray-900">
                Transaction Not Found
              </h1>

              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                {error}
              </p>

              {orderId && (
                <div className="mt-5 w-full rounded-lg bg-gray-50 px-4 py-3 text-left">
                  <p className="text-xs text-gray-500">Order ID</p>
                  <p className="mt-1 break-all font-mono text-sm font-medium text-gray-900">
                    {orderId}
                  </p>
                </div>
              )}

              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Try Again
                </button>

                <button
                  type="button"
                  onClick={goToCashier}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Back to Cashier
                </button>
              </div>

              <p className="mt-5 text-xs text-gray-400">
                Returning to cashier in {countdown} seconds...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-8 text-center sm:px-8">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                paymentStatus === "paid"
                  ? "bg-green-50"
                  : saleStatus === "cancelled" || saleStatus === "refunded"
                    ? "bg-red-50"
                    : "bg-amber-50"
              }`}
            >
              <StatusIcon
                className={`h-8 w-8 ${
                  paymentStatus === "paid"
                    ? "text-green-600"
                    : saleStatus === "cancelled" || saleStatus === "refunded"
                      ? "text-red-600"
                      : "text-amber-600"
                }`}
              />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              {paymentStatus === "paid"
                ? "Payment Successful"
                : saleStatus === "cancelled"
                  ? "Payment Cancelled"
                  : saleStatus === "refunded"
                    ? "Payment Refunded"
                    : "Payment Processing"}
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {getPaymentStatusDescription(paymentStatus, saleStatus)}
            </p>

            {midtransDescription && (
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-400">
                {midtransDescription}
              </p>
            )}
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Receipt className="h-5 w-5 text-red-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Invoice Number</p>

                  <p className="mt-1 break-all font-mono text-sm font-semibold text-gray-900">
                    {sale?.invoice_number || orderId}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Transaction Details
              </h2>

              <div className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-sm text-gray-500">Customer</span>

                  <span className="text-right text-sm font-medium text-gray-900">
                    {sale?.customer?.username ||
                      sale?.customer_name ||
                      "Guest Customer"}
                  </span>
                </div>

                {sale?.customer_phone && (
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-sm text-gray-500">Phone</span>

                    <span className="text-right text-sm font-medium text-gray-900">
                      {sale.customer_phone}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-sm text-gray-500">Payment Method</span>

                  <span className="text-right text-sm font-medium text-gray-900">
                    {formatPaymentMethod(
                      sale?.midtrans_payment_type ||
                        sale?.payments?.[0]?.payment_method,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-sm text-gray-500">Payment Status</span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      paymentStatus === "paid"
                        ? "bg-green-50 text-green-700"
                        : paymentStatus === "refunded"
                          ? "bg-gray-100 text-gray-700"
                          : paymentStatus === "partial"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {getPaymentStatusLabel(paymentStatus)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-sm text-gray-500">
                    Transaction Status
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      saleStatus === "completed"
                        ? "bg-green-50 text-green-700"
                        : saleStatus === "cancelled"
                          ? "bg-red-50 text-red-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {getSaleStatusLabel(saleStatus)}
                  </span>
                </div>

                {midtransStatus && (
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-sm text-gray-500">
                      Midtrans Status
                    </span>

                    <span className="text-right text-sm font-medium capitalize text-gray-900">
                      {midtransStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Payment Summary
              </h2>

              <div className="mt-3 rounded-xl border border-gray-200">
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-500">Subtotal</span>

                    <span className="text-sm font-medium text-gray-900">
                      {formatRupiah(sale?.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-500">Discount</span>

                    <span className="text-sm font-medium text-gray-900">
                      - {formatRupiah(sale?.discount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-500">Tax</span>

                    <span className="text-sm font-medium text-gray-900">
                      {formatRupiah(sale?.tax)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-500">Payment Fee</span>

                    <span className="text-sm font-medium text-gray-900">
                      {formatRupiah(sale?.payment_fee)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-gray-900">
                      Total Payment
                    </span>

                    <span className="text-lg font-bold text-red-600">
                      {formatRupiah(
                        sale?.amount_to_pay ??
                          Number(sale?.grand_total || 0) +
                            Number(sale?.payment_fee || 0),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {paymentStatus === "paid" && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Payment Confirmed
                    </p>

                    <p className="mt-1 text-xs leading-5 text-green-700">
                      The payment has been confirmed by the system and the
                      transaction has been completed successfully.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {paymentStatus !== "paid" &&
              saleStatus !== "cancelled" &&
              saleStatus !== "refunded" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Waiting for Confirmation
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        We are waiting for the payment status notification from
                        Midtrans. This page will automatically refresh the
                        transaction status.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh Status
              </button>

              <button
                type="button"
                onClick={goToCashier}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
              >
                <Receipt className="h-4 w-4" />
                Back to Cashier
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-400">
                Returning to cashier automatically in{" "}
                <span className="font-semibold text-gray-600">{countdown}</span>{" "}
                seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
