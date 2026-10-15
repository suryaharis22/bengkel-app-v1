"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
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
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSaleCustomer(sale) {
  return (
    sale?.customer?.username ||
    sale?.customer_name ||
    sale?.customer_phone ||
    "Guest Customer"
  );
}

function getStatusLabel(status) {
  const labels = {
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };

  return labels[status] || status || "-";
}

function getStatusClass(status) {
  const classes = {
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    refunded: "bg-purple-100 text-purple-700",
  };

  return classes[status] || "bg-gray-100 text-gray-700";
}

function getPaymentStatusLabel(status) {
  const labels = {
    unpaid: "Unpaid",
    partial: "Partial",
    paid: "Paid",
    refunded: "Refunded",
  };

  return labels[status] || status || "-";
}

function getPaymentStatusClass(status) {
  const classes = {
    unpaid: "bg-yellow-100 text-yellow-700",
    partial: "bg-orange-100 text-orange-700",
    paid: "bg-green-100 text-green-700",
    refunded: "bg-purple-100 text-purple-700",
  };

  return classes[status] || "bg-gray-100 text-gray-700";
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-xl border border-gray-200 bg-white p-4"
        >
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="mt-3 h-3 w-56 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-32 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function History({ onOpenDetail }) {
  const [sales, setSales] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 1,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(
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
            status: status || undefined,
            payment_status: paymentStatus || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            page,
            per_page: 10,
          },
        });

        const result = response?.data;

        if (!result?.success) {
          throw new Error(
            result?.message || "Failed to retrieve transaction history.",
          );
        }

        setSales(Array.isArray(result.data) ? result.data : []);

        setMeta(
          result.meta || {
            current_page: page,
            per_page: 10,
            total_items: 0,
            total_pages: 1,
          },
        );
      } catch (error) {
        console.error("History fetch error:", error);

        if (!silent) {
          toast.error(getAxiosError(error));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, status, paymentStatus, dateFrom, dateTo, page],
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handlePaymentStatusChange = (event) => {
    setPaymentStatus(event.target.value);
    setPage(1);
  };

  const handleDateFromChange = (event) => {
    setDateFrom(event.target.value);
    setPage(1);
  };

  const handleDateToChange = (event) => {
    setDateTo(event.target.value);
    setPage(1);
  };

  const handleResetFilter = () => {
    setSearch("");
    setStatus("");
    setPaymentStatus("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleRefresh = () => {
    fetchHistory({ silent: true });
  };

  const canPrevious = page > 1;
  const canNext = page < Number(meta.total_pages || 1);

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Histori Transaksi</h2>
            <p className="mt-1 text-xs text-gray-500">
              Daftar seluruh transaksi kasir.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {/* Search */}
          <div className="relative lg:col-span-3">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Cari invoice, customer..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={handleStatusChange}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          >
            <option value="">Semua Status</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentStatus}
            onChange={handlePaymentStatusChange}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          >
            <option value="">Semua Pembayaran</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={handleDateFromChange}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={handleDateToChange}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />

          {/* Reset */}
          <button
            type="button"
            onClick={handleResetFilter}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Filter size={16} />
            Reset Filter
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <HistorySkeleton />
      ) : sales.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">
            Tidak ada histori transaksi
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Belum ada transaksi yang sesuai dengan filter.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Invoice
                    </th>
                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Customer
                    </th>
                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Kasir
                    </th>
                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Total
                    </th>
                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Pembayaran
                    </th>
                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Tanggal
                    </th>
                    <th className="px-5 py-3 text-right font-semibold text-gray-600">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="transition hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-semibold text-gray-900">
                          {sale.invoice_number}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {getSaleCustomer(sale)}
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {sale?.cashier?.username || "-"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-900">
                        {formatRupiah(
                          sale.amount_to_pay ??
                            Number(sale.grand_total || 0) +
                              Number(sale.payment_fee || 0),
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                            sale.status,
                          )}`}
                        >
                          {getStatusLabel(sale.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentStatusClass(
                            sale.payment_status,
                          )}`}
                        >
                          {getPaymentStatusLabel(sale.payment_status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                        {formatDate(sale.created_at)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenDetail?.(sale.id)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        >
                          <Eye size={15} />
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile */}
          <div className="space-y-3 lg:hidden">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {sale.invoice_number}
                    </p>

                    <p className="mt-1 truncate text-sm text-gray-500">
                      {getSaleCustomer(sale)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                      sale.status,
                    )}`}
                  >
                    {getStatusLabel(sale.status)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatRupiah(
                        sale.amount_to_pay ??
                          Number(sale.grand_total || 0) +
                            Number(sale.payment_fee || 0),
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Pembayaran</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentStatusClass(
                        sale.payment_status,
                      )}`}
                    >
                      {getPaymentStatusLabel(sale.payment_status)}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Kasir</p>
                    <p className="mt-1 text-sm font-medium text-gray-700">
                      {sale?.cashier?.username || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Tanggal</p>
                    <p className="mt-1 text-sm text-gray-700">
                      {formatDate(sale.created_at)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenDetail?.(sale.id)}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                >
                  <Eye size={16} />
                  Lihat Detail
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan{" "}
              <span className="font-medium text-gray-700">{sales.length}</span>{" "}
              dari{" "}
              <span className="font-medium text-gray-700">
                {meta.total_items || 0}
              </span>{" "}
              transaksi
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canPrevious || loading}
                onClick={() => setPage((current) => current - 1)}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Sebelumnya
              </button>

              <span className="px-2 text-sm font-medium text-gray-700">
                {page} / {meta.total_pages || 1}
              </span>

              <button
                type="button"
                disabled={!canNext || loading}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Berikutnya
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
