"use client";
import { useCallback, useEffect, useState } from "react";
import Script from "next/script";
import {
  CreditCard,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Clock,
  XCircle,
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
      {" "}
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-xl border border-gray-200 bg-white p-4"
        >
          {" "}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {" "}
            <div className="space-y-3">
              {" "}
              <div className="h-4 w-40 rounded bg-gray-200" />{" "}
              <div className="h-3 w-56 rounded bg-gray-200" />{" "}
              <div className="h-3 w-32 rounded bg-gray-200" />{" "}
            </div>{" "}
            <div className="space-y-3 lg:text-right">
              {" "}
              <div className="ml-auto h-4 w-32 rounded bg-gray-200" />{" "}
              <div className="ml-auto h-8 w-24 rounded bg-gray-200" />{" "}
            </div>{" "}
          </div>{" "}
        </div>
      ))}{" "}
    </div>
  );
}
export default function Monitoring({ onOpenDetail }) {
  const [sales, setSales] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 50,
    total_items: 0,
    total_pages: 1,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingSaleId, setPayingSaleId] = useState(null);
  const [cancellingSaleId, setCancellingSaleId] = useState(null);
  const [cancelSale, setCancelSale] = useState(null);
  const isProduction =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  const midtransScriptSrc = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
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
            status: "completed",
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
        const items = Array.isArray(result.data) ? result.data : [];
        const pendingSales = items.filter(
          (sale) =>
            sale?.status === "completed" && sale?.payment_status === "unpaid",
        );
        setSales(pendingSales);
        setMeta(
          result.meta || {
            current_page: 1,
            per_page: 50,
            total_items: pendingSales.length,
            total_pages: 1,
          },
        );
      } catch (error) {
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
      fetchMonitoring({ silent: true });
    }, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchMonitoring]);
  const handleRefresh = () => {
    fetchMonitoring({ silent: true });
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
    if (sale.status === "cancelled") {
      toast.info("Transaksi ini sudah dibatalkan.");
      await fetchMonitoring({ silent: true });
      return;
    }
    if (!window.snap) {
      toast.error("Midtrans Snap belum siap. Silakan tunggu beberapa saat.");
      return;
    }
    try {
      setPayingSaleId(sale.id);
      const response = await api.get(
        `/admin/cashier/sales/${sale.id}/payments`,
      );
      const result = response?.data;
      if (!result?.success) {
        throw new Error(result?.message || "Failed to initialize payment.");
      }
      const token = result?.data?.token;
      if (!token) {
        throw new Error("Midtrans payment token tidak tersedia.");
      }
      window.snap.pay(token, {
        onSuccess: () => {
          toast.success("Pembayaran berhasil diproses.");
          fetchMonitoring({ silent: true });
        },
        onPending: () => {
          toast.info("Pembayaran masih menunggu.");
          fetchMonitoring({ silent: true });
        },
        onError: () => {
          toast.error("Pembayaran gagal.");
          fetchMonitoring({ silent: true });
        },
        onClose: () => {
          fetchMonitoring({ silent: true });
        },
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal membuka pembayaran."));
    } finally {
      setPayingSaleId(null);
    }
  };
  const openCancelModal = (sale) => {
    if (!sale?.id) {
      toast.error("ID transaksi tidak ditemukan.");
      return;
    }
    if (sale.status === "cancelled") {
      toast.info("Transaksi ini sudah dibatalkan.");
      fetchMonitoring({ silent: true });
      return;
    }
    if (sale.payment_status === "paid") {
      toast.error("Transaksi yang sudah dibayar tidak dapat dibatalkan.");
      return;
    }
    if (payingSaleId === sale.id || cancellingSaleId === sale.id) {
      return;
    }
    setCancelSale(sale);
  };
  const closeCancelModal = () => {
    if (cancellingSaleId) {
      return;
    }
    setCancelSale(null);
  };
  const handleCancelTransaction = async () => {
    if (!cancelSale?.id) {
      return;
    }
    const saleId = cancelSale.id;
    if (cancellingSaleId) {
      return;
    }
    try {
      setCancellingSaleId(saleId);
      const response = await api.patch(
        `/admin/cashier/sales/${saleId}/cancel`,
        {},
      );
      const result = response?.data;
      if (!result?.success) {
        throw new Error(result?.message || "Failed to cancel transaction.");
      }
      toast.success(result?.message || "Transaksi berhasil dibatalkan.");
      setCancelSale(null);
      await fetchMonitoring({ silent: true });
    } catch (error) {
      const status = error?.response?.status;
      const message = getErrorMessage(error, "Gagal membatalkan transaksi.");
      if (status === 422) {
        const alreadyCancelled =
          message.toLowerCase().includes("already been cancelled") ||
          message.toLowerCase().includes("already cancelled") ||
          message.toLowerCase().includes("sudah dibatalkan");
        if (alreadyCancelled) {
          setCancelSale(null);
          toast.info("Transaksi sudah dibatalkan.");
          await fetchMonitoring({ silent: true });
          return;
        }
      }
      toast.error(message);
    } finally {
      setCancellingSaleId(null);
    }
  };
  return (
    <>
      {" "}
      <Script
        src={midtransScriptSrc}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />{" "}
      <div className="space-y-5">
        {" "}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {" "}
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
            {" "}
            <div className="flex items-center justify-between">
              {" "}
              <div>
                {" "}
                <p className="text-sm font-medium text-yellow-700">
                  {" "}
                  Menunggu Pembayaran{" "}
                </p>{" "}
                <p className="mt-1 text-2xl font-bold text-yellow-900">
                  {" "}
                  {meta.total_items}{" "}
                </p>{" "}
              </div>{" "}
              <div className="rounded-lg bg-yellow-100 p-3 text-yellow-700">
                {" "}
                <Clock size={22} />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            {" "}
            <div className="flex items-center justify-between">
              {" "}
              <div>
                {" "}
                <p className="text-sm font-medium text-blue-700">
                  {" "}
                  Auto Refresh{" "}
                </p>{" "}
                <p className="mt-1 text-sm font-semibold text-blue-900">
                  {" "}
                  Setiap 5 detik{" "}
                </p>{" "}
              </div>{" "}
              <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
                {" "}
                <RefreshCw size={22} />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {" "}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {" "}
            <div className="relative w-full sm:max-w-md">
              {" "}
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />{" "}
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari invoice atau customer..."
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />{" "}
            </div>{" "}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {" "}
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />{" "}
              Refresh{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        {loading ? (
          <MonitoringSkeleton />
        ) : sales.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
            {" "}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              {" "}
              <CreditCard size={24} />{" "}
            </div>{" "}
            <h3 className="mt-4 text-base font-semibold text-gray-900">
              {" "}
              Tidak ada transaksi menunggu pembayaran{" "}
            </h3>{" "}
            <p className="mt-1 text-sm text-gray-500">
              {" "}
              Semua transaksi saat ini sudah diproses.{" "}
            </p>{" "}
          </div>
        ) : (
          <div className="space-y-3">
            {" "}
            {sales.map((sale) => {
              const paymentMethod =
                sale?.payments?.[0]?.payment_method ||
                sale?.payment_method ||
                sale?.midtrans_payment_type ||
                "qris";
              const grandTotal = Number(sale?.grand_total || 0);
              const paymentFee = Number(sale?.payment_fee || 0);
              const amountToPay =
                Number(sale?.amount_to_pay) || grandTotal + paymentFee;
              const isPaying = payingSaleId === sale.id;
              const isCancelling = cancellingSaleId === sale.id;
              const isProcessing = isPaying || isCancelling;
              return (
                <div
                  key={sale.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-red-200"
                >
                  {" "}
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    {" "}
                    <div className="min-w-0">
                      {" "}
                      <div className="flex flex-wrap items-center gap-2">
                        {" "}
                        <span className="font-semibold text-gray-900">
                          {" "}
                          {sale.invoice_number}{" "}
                        </span>{" "}
                        <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                          {" "}
                          Menunggu Pembayaran{" "}
                        </span>{" "}
                      </div>{" "}
                      <div className="mt-2 space-y-1 text-sm text-gray-500">
                        {" "}
                        <p>
                          {" "}
                          Customer:{" "}
                          <span className="font-medium text-gray-700">
                            {" "}
                            {getSaleCustomer(sale)}{" "}
                          </span>{" "}
                        </p>{" "}
                        <p>
                          {" "}
                          Kasir:{" "}
                          <span className="font-medium text-gray-700">
                            {" "}
                            {sale?.cashier?.username || "-"}{" "}
                          </span>{" "}
                        </p>{" "}
                        <p> {formatDate(sale.created_at)} </p>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:justify-end">
                      {" "}
                      <div className="min-w-[190px] sm:text-right">
                        {" "}
                        <div className="space-y-1 text-sm">
                          {" "}
                          <div className="flex items-center justify-between gap-6 sm:justify-end">
                            {" "}
                            <span className="text-gray-500">
                              {" "}
                              Grand Total{" "}
                            </span>{" "}
                            <span className="font-medium text-gray-700">
                              {" "}
                              {formatRupiah(grandTotal)}{" "}
                            </span>{" "}
                          </div>{" "}
                          {paymentFee > 0 && (
                            <div className="flex items-center justify-between gap-6 sm:justify-end">
                              {" "}
                              <span className="text-gray-500">
                                {" "}
                                Biaya Pembayaran{" "}
                              </span>{" "}
                              <span className="font-medium text-gray-700">
                                {" "}
                                {formatRupiah(paymentFee)}{" "}
                              </span>{" "}
                            </div>
                          )}{" "}
                        </div>{" "}
                        <div className="mt-2 border-t border-gray-200 pt-2">
                          {" "}
                          <div className="flex items-center justify-between gap-6 sm:justify-end">
                            {" "}
                            <span className="text-xs font-medium text-gray-500">
                              {" "}
                              Total Bayar{" "}
                            </span>{" "}
                            <span className="text-lg font-bold text-gray-900">
                              {" "}
                              {formatRupiah(amountToPay)}{" "}
                            </span>{" "}
                          </div>{" "}
                        </div>{" "}
                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentMethodClass(paymentMethod)}`}
                        >
                          {" "}
                          {getPaymentMethodLabel(paymentMethod)}{" "}
                        </span>{" "}
                      </div>{" "}
                      <div className="flex flex-wrap gap-2">
                        {" "}
                        <button
                          type="button"
                          onClick={() => onOpenDetail?.(sale.id)}
                          disabled={isProcessing}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {" "}
                          <Eye size={16} /> Detail{" "}
                        </button>{" "}
                        <button
                          type="button"
                          onClick={() => openCancelModal(sale)}
                          disabled={isProcessing}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {" "}
                          {isCancelling ? (
                            <>
                              {" "}
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />{" "}
                              Membatalkan...{" "}
                            </>
                          ) : (
                            <>
                              {" "}
                              <XCircle size={16} /> Batalkan{" "}
                            </>
                          )}{" "}
                        </button>{" "}
                        <button
                          type="button"
                          onClick={() => handlePayNow(sale)}
                          disabled={isProcessing}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {" "}
                          {isPaying ? (
                            <>
                              {" "}
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />{" "}
                              Memproses...{" "}
                            </>
                          ) : (
                            <>
                              {" "}
                              <CreditCard size={16} /> Bayar Sekarang{" "}
                            </>
                          )}{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>
              );
            })}{" "}
          </div>
        )}{" "}
      </div>{" "}
      {cancelSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCancelModal();
            }
          }}
        >
          {" "}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-transaction-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            {" "}
            <div className="flex items-start gap-4">
              {" "}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                {" "}
                <XCircle size={22} />{" "}
              </div>{" "}
              <div className="min-w-0">
                {" "}
                <h2
                  id="cancel-transaction-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {" "}
                  Batalkan Transaksi?{" "}
                </h2>{" "}
                <p className="mt-1 text-sm leading-6 text-gray-500">
                  {" "}
                  Apakah kamu yakin ingin membatalkan transaksi{" "}
                  <span className="font-semibold text-gray-700">
                    {" "}
                    {cancelSale.invoice_number}{" "}
                  </span>{" "}
                  ?{" "}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="mt-5 rounded-lg bg-red-50 p-4">
              {" "}
              <p className="text-sm leading-5 text-red-700">
                {" "}
                Transaksi akan dibatalkan dan stock item akan dikembalikan.{" "}
              </p>{" "}
            </div>{" "}
            <div className="mt-6 flex justify-end gap-3">
              {" "}
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={Boolean(cancellingSaleId)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {" "}
                Batal{" "}
              </button>{" "}
              <button
                type="button"
                onClick={handleCancelTransaction}
                disabled={Boolean(cancellingSaleId)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {" "}
                {cancellingSaleId ? (
                  <>
                    {" "}
                    <Loader2 size={16} className="animate-spin" />{" "}
                    Membatalkan...{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    <XCircle size={16} /> Ya, Batalkan{" "}
                  </>
                )}{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </>
  );
}
