"use client";

import {
  Banknote,
  Calculator,
  CircleDollarSign,
  CreditCard,
  Receipt,
} from "lucide-react";

function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  const amount = toNumber(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPaymentStatusConfig(status) {
  switch (status) {
    case "paid":
      return {
        label: "Paid",
        className: "bg-green-50 text-green-700 ring-green-600/20",
      };

    case "partial":
      return {
        label: "Partial",
        className: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
      };

    case "refunded":
      return {
        label: "Refunded",
        className: "bg-purple-50 text-purple-700 ring-purple-600/20",
      };

    case "unpaid":
    default:
      return {
        label: "Unpaid",
        className: "bg-red-50 text-red-700 ring-red-600/20",
      };
  }
}

function SummaryRow({ label, value, valueClassName = "text-gray-900" }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-gray-500">{label}</span>

      <span
        className={["text-sm font-medium", valueClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

export default function ServiceOrderPaymentSummary({ order }) {
  if (!order) {
    return null;
  }

  const paymentStatus = getPaymentStatusConfig(order.payment_status);

  const subtotal = toNumber(order.subtotal);
  const discount = toNumber(order.discount);
  const tax = toNumber(order.tax);
  const grandTotal = toNumber(order.grand_total);
  const paymentFee = toNumber(order.payment_fee);
  const paidAmount = toNumber(order.paid_amount);
  const changeAmount = toNumber(order.change_amount);

  const total =
    order.total !== undefined && order.total !== null
      ? toNumber(order.total)
      : grandTotal + paymentFee;

  const remainingAmount =
    order.remaining_amount !== undefined && order.remaining_amount !== null
      ? toNumber(order.remaining_amount)
      : Math.max(total - paidAmount, 0);

  const isPaid = paymentStatus.label === "Paid";
  const hasRemaining = remainingAmount > 0;
  const hasChange = changeAmount > 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Receipt size={20} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Payment Summary
            </h2>

            <p className="mt-0.5 text-sm text-gray-500">
              Summary of service order payment
            </p>
          </div>
        </div>

        <span
          className={[
            "inline-flex w-fit items-center rounded-full px-3 py-1.5",
            "text-xs font-semibold ring-1 ring-inset",
            paymentStatus.className,
          ].join(" ")}
        >
          {paymentStatus.label}
        </span>
      </div>

      <div className="p-5">
        <div className="divide-y divide-gray-100">
          <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />

          {discount > 0 && (
            <SummaryRow
              label="Discount"
              value={`- ${formatCurrency(discount)}`}
              valueClassName="text-red-600"
            />
          )}

          {tax > 0 && <SummaryRow label="Tax" value={formatCurrency(tax)} />}

          <SummaryRow
            label="Grand Total"
            value={formatCurrency(grandTotal)}
            valueClassName="font-semibold text-gray-900"
          />

          {paymentFee > 0 && (
            <SummaryRow
              label="Payment Fee"
              value={formatCurrency(paymentFee)}
              valueClassName="text-orange-600"
            />
          )}
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500">Total Payment</p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatCurrency(total)}
              </p>

              {paymentFee > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Grand total + payment fee
                </p>
              )}
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm ring-1 ring-gray-100">
              <Calculator size={21} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <Banknote size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500">Paid Amount</p>

                <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                  {formatCurrency(paidAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  hasRemaining
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600",
                ].join(" ")}
              >
                <CreditCard size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500">
                  Remaining Amount
                </p>

                <p
                  className={[
                    "mt-1 truncate text-sm font-semibold",
                    hasRemaining ? "text-red-600" : "text-green-600",
                  ].join(" ")}
                >
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {hasChange && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div>
              <p className="text-xs font-medium text-blue-600">Change Amount</p>

              <p className="mt-1 text-sm font-bold text-blue-700">
                {formatCurrency(changeAmount)}
              </p>
            </div>

            <Banknote size={20} className="shrink-0 text-blue-500" />
          </div>
        )}

        {hasRemaining && !isPaid && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <div>
              <p className="text-xs font-medium text-red-600">
                Remaining Payment
              </p>

              <p className="mt-1 text-sm font-bold text-red-700">
                {formatCurrency(remainingAmount)}
              </p>
            </div>

            <CircleDollarSign size={20} className="shrink-0 text-red-500" />
          </div>
        )}

        {!hasRemaining && isPaid && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
            <div>
              <p className="text-xs font-medium text-green-600">
                Payment Completed
              </p>

              <p className="mt-1 text-sm font-bold text-green-700">
                Fully Paid
              </p>
            </div>

            <CircleDollarSign size={20} className="shrink-0 text-green-500" />
          </div>
        )}
      </div>
    </section>
  );
}
