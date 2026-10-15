"use client";

import {
  ArrowDownToLine,
  ArrowUpToLine,
  CircleDollarSign,
  Receipt,
} from "lucide-react";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function DashboardSalesSummary({
  total = 0,
  paid = 0,
  unpaid = 0,
  revenue = 0,
  paidRevenue = 0,
  unpaidRevenue = 0,
}) {
  return (
    <div>
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <CircleDollarSign size={20} />
          </div>

          <div>
            <p className="text-xs text-gray-500">Total Sales Revenue</p>

            <p className="mt-0.5 text-xl font-bold text-gray-900">
              {formatRupiah(revenue)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-green-50/50 p-4">
          <div className="flex items-center gap-2">
            <ArrowUpToLine size={16} className="text-green-600" />

            <span className="text-xs font-medium text-gray-600">Paid</span>
          </div>

          <p className="mt-2 text-lg font-bold text-gray-900">{paid}</p>

          <p className="mt-1 text-xs text-gray-500">
            {formatRupiah(paidRevenue)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2">
            <ArrowDownToLine size={16} className="text-amber-600" />

            <span className="text-xs font-medium text-gray-600">Unpaid</span>
          </div>

          <p className="mt-2 text-lg font-bold text-gray-900">{unpaid}</p>

          <p className="mt-1 text-xs text-gray-500">
            {formatRupiah(unpaidRevenue)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Receipt size={16} className="text-gray-500" />

          <span className="text-sm font-medium text-gray-600">
            Total Transactions
          </span>
        </div>

        <span className="text-sm font-bold text-gray-900">{total}</span>
      </div>
    </div>
  );
}
