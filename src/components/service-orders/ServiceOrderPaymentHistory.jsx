"use client";

import {
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  History,
  Loader2,
  QrCode,
  Smartphone,
  Wallet,
  XCircle,
} from "lucide-react";

function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(toNumber(value));
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

function getPaymentMethodConfig(method) {
  switch (method) {
    case "cash":
      return {
        label: "Cash",
        icon: Banknote,
        className: "bg-green-50 text-green-600",
      };

    case "qris":
      return {
        label: "QRIS",
        icon: QrCode,
        className: "bg-blue-50 text-blue-600",
      };

    case "ewallet":
      return {
        label: "E-Wallet",
        icon: Smartphone,
        className: "bg-purple-50 text-purple-600",
      };

    case "transfer":
      return {
        label: "Transfer",
        icon: CreditCard,
        className: "bg-orange-50 text-orange-600",
      };

    case "debit":
      return {
        label: "Debit",
        icon: CreditCard,
        className: "bg-cyan-50 text-cyan-600",
      };

    default:
      return {
        label: method || "Unknown",
        icon: Wallet,
        className: "bg-gray-50 text-gray-600",
      };
  }
}

function getProviderLabel(provider) {
  switch (provider) {
    case "midtrans":
      return "Midtrans";

    case "cash":
      return "Cash";

    default:
      return provider || "-";
  }
}

function getTransactionStatusConfig(payment) {
  if (payment.provider === "cash") {
    return {
      label: "Paid",
      icon: CheckCircle2,
      className: "bg-green-50 text-green-700 ring-green-600/20",
    };
  }

  switch (payment.midtrans_transaction_status) {
    case "settlement":
    case "capture":
      return {
        label: "Paid",
        icon: CheckCircle2,
        className: "bg-green-50 text-green-700 ring-green-600/20",
      };

    case "pending":
      return {
        label: "Pending",
        icon: Clock3,
        className: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
      };

    case "expire":
      return {
        label: "Expired",
        icon: Clock3,
        className: "bg-gray-50 text-gray-600 ring-gray-500/20",
      };

    case "cancel":
    case "deny":
      return {
        label:
          payment.midtrans_transaction_status === "deny"
            ? "Denied"
            : "Cancelled",
        icon: XCircle,
        className: "bg-red-50 text-red-700 ring-red-600/20",
      };

    case "refund":
    case "partial_refund":
      return {
        label: "Refunded",
        icon: XCircle,
        className: "bg-purple-50 text-purple-700 ring-purple-600/20",
      };

    default:
      return {
        label: payment.midtrans_transaction_status || "Paid",
        icon: CheckCircle2,
        className: "bg-gray-50 text-gray-700 ring-gray-500/20",
      };
  }
}

function DetailItem({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-all text-xs font-medium text-gray-700">
        {value}
      </p>
    </div>
  );
}

function PaymentCard({ payment }) {
  const method = getPaymentMethodConfig(payment.payment_method);

  const MethodIcon = method.icon;

  const transactionStatus = getTransactionStatusConfig(payment);

  const StatusIcon = transactionStatus.icon;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              method.className,
            ].join(" ")}
          >
            <MethodIcon size={19} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {method.label}
              </h3>

              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {getProviderLabel(payment.provider)}
              </span>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              {formatDate(payment.paid_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <p className="text-base font-bold text-gray-900">
            {formatCurrency(payment.amount)}
          </p>

          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
              "text-[11px] font-semibold ring-1 ring-inset",
              transactionStatus.className,
            ].join(" ")}
          >
            <StatusIcon size={12} />
            {transactionStatus.label}
          </span>
        </div>
      </div>

      {(payment.reference_number ||
        payment.midtrans_order_id ||
        payment.midtrans_transaction_id ||
        payment.midtrans_payment_type ||
        payment.midtrans_transaction_status) && (
        <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Reference Number"
            value={payment.reference_number}
          />

          <DetailItem
            label="Midtrans Order ID"
            value={payment.midtrans_order_id}
          />

          <DetailItem
            label="Transaction ID"
            value={payment.midtrans_transaction_id}
          />

          <DetailItem
            label="Payment Type"
            value={payment.midtrans_payment_type}
          />

          <DetailItem
            label="Transaction Status"
            value={payment.midtrans_transaction_status}
          />
        </div>
      )}
    </div>
  );
}

export default function ServiceOrderPaymentHistory({
  payments = [],
  loading = false,
}) {
  if (loading) {
    return (
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Payment History
            </h2>

            <p className="mt-0.5 text-sm text-gray-500">
              Loading payment history...
            </p>
          </div>
        </div>

        <div className="space-y-3 p-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-100" />

                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded bg-gray-100" />
                    <div className="h-3 w-32 rounded bg-gray-100" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="ml-auto h-4 w-24 rounded bg-gray-100" />
                  <div className="ml-auto h-5 w-16 rounded-full bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <History size={20} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Payment History
            </h2>

            <p className="mt-0.5 text-sm text-gray-500">
              Payment transactions for this service order
            </p>
          </div>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <FileText size={15} className="text-gray-400" />

          <span className="text-xs font-medium text-gray-600">
            {payments.length}{" "}
            {payments.length === 1 ? "Transaction" : "Transactions"}
          </span>
        </div>
      </div>

      <div className="p-5">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">
              <History size={22} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-gray-900">
              No Payment History
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
              No payment transaction has been recorded for this service order
              yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
