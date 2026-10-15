"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  CreditCard,
  FileText,
  Loader2,
  Mail,
  Package,
  Phone,
  Receipt,
  User,
  X,
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

function getPaymentMethodLabel(method) {
  const labels = {
    cash: "Cash",
    qris: "QRIS",
    transfer: "Transfer",
    debit: "Debit",
    ewallet: "E-Wallet",
  };

  return labels[method] || method || "-";
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-gray-800">
        {value || "-"}
      </p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5 p-5">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-gray-200" />

          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 rounded bg-gray-200" />
            <div className="h-10 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DetailDialog({ open, saleId, onClose }) {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!saleId) return;

    try {
      setLoading(true);
      setSale(null);

      const response = await api.get(`/admin/cashier/sales/${saleId}`);
      const result = response?.data;

      if (!result?.success) {
        throw new Error(
          result?.message || "Failed to retrieve transaction detail.",
        );
      }

      setSale(result.data);
    } catch (error) {
      console.error("Sale detail error:", error);
      toast.error(getAxiosError(error));
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    if (open && saleId) {
      fetchDetail();
    }

    if (!open) {
      setSale(null);
    }
  }, [open, saleId, fetchDetail]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const items = Array.isArray(sale?.items) ? sale.items : [];
  const payments = Array.isArray(sale?.payments) ? sale.payments : [];

  const subtotal = Number(sale?.subtotal || 0);
  const discount = Number(sale?.discount || 0);
  const tax = Number(sale?.tax || 0);
  const grandTotal = Number(sale?.grand_total || 0);
  const paymentFee = Number(sale?.payment_fee || 0);
  const amountToPay =
    Number(sale?.amount_to_pay ?? grandTotal + paymentFee) || 0;
  const paidAmount = Number(sale?.paid_amount || 0);
  const changeAmount = Number(sale?.change_amount || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Receipt size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-gray-900">
                Detail Transaksi
              </h2>

              <p className="truncate text-sm text-gray-500">
                {sale?.invoice_number || "Memuat transaksi..."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <DetailSkeleton />
          ) : !sale ? (
            <div className="flex min-h-[300px] items-center justify-center p-6">
              <div className="text-center">
                <p className="font-medium text-gray-900">
                  Data transaksi tidak ditemukan.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Silakan tutup dialog dan coba lagi.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 p-5">
              {/* Status */}
              <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-500">Invoice</p>

                  <p className="mt-1 font-bold text-gray-900">
                    {sale.invoice_number}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${getStatusClass(
                      sale.status,
                    )}`}
                  >
                    {getStatusLabel(sale.status)}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${getPaymentStatusClass(
                      sale.payment_status,
                    )}`}
                  >
                    {getPaymentStatusLabel(sale.payment_status)}
                  </span>
                </div>
              </div>

              {/* Customer & Cashier */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <User size={18} className="text-red-600" />

                  <h3 className="font-semibold text-gray-900">
                    Informasi Transaksi
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailRow
                    label="Customer"
                    value={
                      sale?.customer?.username ||
                      sale.customer_name ||
                      "Guest Customer"
                    }
                  />

                  <DetailRow
                    label="No. HP Customer"
                    value={sale?.customer?.no_hp || sale.customer_phone}
                  />

                  <DetailRow label="Kasir" value={sale?.cashier?.username} />

                  <DetailRow
                    label="Email Customer"
                    value={sale?.customer?.email}
                  />

                  <DetailRow
                    label="Tanggal Transaksi"
                    value={formatDate(sale.created_at)}
                  />

                  <DetailRow
                    label="Update Terakhir"
                    value={formatDate(sale.updated_at)}
                  />
                </div>
              </section>

              {/* Items */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Package size={18} className="text-red-600" />

                  <h3 className="font-semibold text-gray-900">
                    Item Transaksi
                  </h3>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="divide-y divide-gray-100">
                    {items.length === 0 ? (
                      <div className="p-5 text-center text-sm text-gray-500">
                        Tidak ada item transaksi.
                      </div>
                    ) : (
                      items.map((item) => {
                        const quantity = Number(item.quantity || 0);
                        const unitPrice = Number(item.unit_price || 0);
                        const itemDiscount = Number(item.discount || 0);
                        const itemSubtotal = Number(
                          item.subtotal || quantity * unitPrice - itemDiscount,
                        );

                        return (
                          <div key={item.id} className="p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900">
                                  {item.name}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  SKU: {item.sku || "-"}
                                </p>
                              </div>

                              <div className="grid grid-cols-3 gap-5 text-sm sm:text-right">
                                <div>
                                  <p className="text-xs text-gray-500">Qty</p>

                                  <p className="mt-1 font-medium text-gray-800">
                                    {quantity}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-gray-500">Harga</p>

                                  <p className="mt-1 font-medium text-gray-800">
                                    {formatRupiah(unitPrice)}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-gray-500">
                                    Subtotal
                                  </p>

                                  <p className="mt-1 font-semibold text-gray-900">
                                    {formatRupiah(itemSubtotal)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {itemDiscount > 0 && (
                              <p className="mt-2 text-xs text-green-600">
                                Diskon item: {formatRupiah(itemDiscount)}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>

              {/* Payment Summary */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard size={18} className="text-red-600" />

                  <h3 className="font-semibold text-gray-900">
                    Ringkasan Pembayaran
                  </h3>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Subtotal</span>

                      <span className="font-medium text-gray-800">
                        {formatRupiah(subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Diskon</span>

                      <span className="font-medium text-green-600">
                        - {formatRupiah(discount)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Pajak</span>

                      <span className="font-medium text-gray-800">
                        {formatRupiah(tax)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Biaya Pembayaran</span>

                      <span className="font-medium text-gray-800">
                        {formatRupiah(paymentFee)}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-gray-900">
                          Total
                        </span>

                        <span className="text-lg font-bold text-red-600">
                          {formatRupiah(amountToPay)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Dibayar</span>

                      <span className="font-medium text-gray-800">
                        {formatRupiah(paidAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Kembalian</span>

                      <span className="font-medium text-gray-800">
                        {formatRupiah(changeAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment History */}
              {payments.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Calendar size={18} className="text-red-600" />

                    <h3 className="font-semibold text-gray-900">
                      Riwayat Pembayaran
                    </h3>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="divide-y divide-gray-100">
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {getPaymentMethodLabel(payment.payment_method)}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {formatDate(payment.paid_at)}
                            </p>

                            {payment.reference_number && (
                              <p className="mt-1 break-all text-xs text-gray-500">
                                Ref: {payment.reference_number}
                              </p>
                            )}
                          </div>

                          <p className="font-semibold text-gray-900">
                            {formatRupiah(payment.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Midtrans */}
              {sale.midtrans_order_id && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-red-600" />

                    <h3 className="font-semibold text-gray-900">
                      Informasi Midtrans
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
                    <DetailRow
                      label="Order ID"
                      value={sale.midtrans_order_id}
                    />

                    <DetailRow
                      label="Transaction ID"
                      value={sale.midtrans_transaction_id}
                    />

                    <DetailRow
                      label="Payment Type"
                      value={sale.midtrans_payment_type}
                    />

                    <DetailRow
                      label="Transaction Status"
                      value={sale.midtrans_transaction_status}
                    />
                  </div>
                </section>
              )}

              {/* Notes */}
              {sale.notes && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-red-600" />

                    <h3 className="font-semibold text-gray-900">Catatan</h3>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                    {sale.notes}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
