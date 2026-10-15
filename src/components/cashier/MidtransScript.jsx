"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CreditCard,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

function formatRupiah(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getErrorMessage(error, fallback = "Terjadi kesalahan.") {
  const result = getAxiosError(error);

  if (typeof result === "string") {
    return result;
  }

  if (result && typeof result === "object") {
    if (typeof result.message === "string") {
      return result.message;
    }

    if (result.errors && typeof result.errors === "object") {
      const firstError = Object.values(result.errors)[0];

      if (Array.isArray(firstError)) {
        return firstError[0] || fallback;
      }

      if (typeof firstError === "string") {
        return firstError;
      }
    }
  }

  return fallback;
}

function getPaymentMethodLabel(method) {
  const labels = {
    cash: "Cash",
    qris: "QRIS",
    transfer: "Transfer",
    debit: "Debit",
    ewallet: "E-Wallet",
  };

  return labels[method] || method || "Midtrans";
}

function getPaymentMethodClass(method) {
  const classes = {
    cash: "bg-gray-100 text-gray-700",
    qris: "bg-blue-100 text-blue-700",
    transfer: "bg-purple-100 text-purple-700",
    debit: "bg-orange-100 text-orange-700",
    ewallet: "bg-green-100 text-green-700",
  };

  return classes[method] || "bg-blue-100 text-blue-700";
}

function getSaleCustomer(sale) {
  return (
    sale?.customer?.username ||
    sale?.customer_name ||
    sale?.customer_phone ||
    "Guest Customer"
  );
}

function MonitoringSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-xl border border-gray-200 bg-white p-4"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="h-3 w-56 rounded bg-gray-200" />
              <div className="h-3 w-32 rounded bg-gray-200" />
            </div>

            <div className="space-y-3 lg:text-right">
              <div className="ml-auto h-4 w-32 rounded bg-gray-200" />
              <div className="ml-auto h-8 w-24 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Monitoring({ onOpenDetail }) {
  const [sales, setSales] = useState([]);

  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 20,
    total_items: 0,
    total_pages: 1,
  });

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [payingSaleId, setPayingSaleId] = useState(null);

  const fetchMonitoring = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get("/admin/cashier/sales", {
          params: {
            search,
            payment_status: "unpaid",
            page: 1,
            per_page: 50,
          },
        });

        const result = response?.data;

        if (!result?.success) {
          throw new Error(
            result?.message || "Failed to retrieve transactions.",
          );
        }

        setSales(Array.isArray(result.data) ? result.data : []);

        setMeta(
          result.meta || {
            current_page: 1,
            per_page: 50,
            total_items: 0,
            total_pages: 1,
          },
        );
      } catch (error) {
        console.error("Monitoring fetch error:", error);

        if (!silent) {
          toast.error(getErrorMessage(error, "Gagal mengambil transaksi."));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search],
  );

  useEffect(() => {
    fetchMonitoring();
  }, [fetchMonitoring]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMonitoring({
        silent: true,
      });
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchMonitoring]);

  const handleRefresh = () => {
    fetchMonitoring({
      silent: true,
    });
  };

  const handlePayNow = async (sale) => {
    if (!sale?.id) {
      toast.error("ID transaksi tidak ditemukan.");
      return;
    }

    if (sale.payment_status === "paid") {
      toast.info("Transaksi ini sudah dibayar.");
      return;
    }

    if (!window.snap) {
      toast.error("Midtrans Snap belum siap. Silakan tunggu beberapa saat.");
      return;
    }

    try {
      setPayingSaleId(sale.id);

      const response = await api.get(`/admin/cashier/sales/${sale.id}/payment`);

      const result = response?.data;

      if (!result?.success) {
        throw new Error(result?.message || "Gagal membuat pembayaran.");
      }

      const token = result?.data?.token || result?.data?.snap_token;

      if (!token) {
        throw new Error("Midtrans payment token tidak tersedia.");
      }

      window.snap.pay(token, {
        onSuccess: () => {
          toast.success("Pembayaran berhasil diproses.");

          fetchMonitoring({
            silent: true,
          });
        },

        onPending: () => {
          toast.info("Pembayaran masih menunggu.");

          fetchMonitoring({
            silent: true,
          });
        },

        onError: () => {
          toast.error("Pembayaran gagal.");

          fetchMonitoring({
            silent: true,
          });
        },

        onClose: () => {
          fetchMonitoring({
            silent: true,
          });
        },
      });
    } catch (error) {
      console.error("Pay now error:", error);

      toast.error(getErrorMessage(error, "Gagal membuka pembayaran."));
    } finally {
      setPayingSaleId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">
                Menunggu Pembayaran
              </p>

              <p className="mt-1 text-2xl font-bold text-yellow-900">
                {meta.total_items}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-100 p-3 text-yellow-700">
              <Clock size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Auto Refresh</p>

              <p className="mt-1 text-sm font-semibold text-blue-900">
                Setiap 5 detik
              </p>
            </div>

            <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
              <RefreshCw size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari invoice atau customer..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <MonitoringSkeleton />
      ) : sales.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CreditCard size={24} />
          </div>

          <h3 className="mt-4 text-base font-semibold text-gray-900">
            Tidak ada transaksi menunggu pembayaran
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Semua transaksi saat ini sudah diproses.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => {
            const paymentMethod =
              sale?.payments?.[0]?.payment_method ||
              sale?.payment_method ||
              sale?.midtrans_payment_type ||
              "qris";

            const amountToPay =
              Number(sale?.amount_to_pay) ||
              Number(sale?.grand_total || 0) + Number(sale?.payment_fee || 0);

            const isPaying = payingSaleId === sale.id;

            return (
              <div
                key={sale.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-red-200"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {sale.invoice_number}
                      </span>

                      <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                        Menunggu Pembayaran
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-gray-500">
                      <p>
                        Customer:{" "}
                        <span className="font-medium text-gray-700">
                          {getSaleCustomer(sale)}
                        </span>
                      </p>

                      <p>
                        Kasir:{" "}
                        <span className="font-medium text-gray-700">
                          {sale?.cashier?.username || "-"}
                        </span>
                      </p>

                      <p>{formatDate(sale.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
                    <div className="sm:text-right">
                      <p className="text-xs text-gray-500">Total</p>

                      <p className="text-lg font-bold text-gray-900">
                        {formatRupiah(amountToPay)}
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentMethodClass(
                          paymentMethod,
                        )}`}
                      >
                        {getPaymentMethodLabel(paymentMethod)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenDetail?.(sale.id)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                      >
                        <Eye size={16} />
                        Detail
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePayNow(sale)}
                        disabled={isPaying}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPaying ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <CreditCard size={16} />
                            Bayar Sekarang
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
