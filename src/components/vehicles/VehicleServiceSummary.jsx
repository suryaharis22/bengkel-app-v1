"use client";

import {
  Activity,
  CheckCircle2,
  Clock3,
  DollarSign,
  History,
  Wrench,
  XCircle,
} from "lucide-react";

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "Rp 0";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "Rp 0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  description,
  iconClassName = "",
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            {label}
          </p>

          <p className="mt-1.5 text-xl font-bold text-gray-900">{value}</p>

          {description ? (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          ) : null}
        </div>

        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            iconClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function getNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

export default function VehicleServiceSummary({ summary = null }) {
  const data = summary || {};

  const totalServices = getNumber(
    data.total_services ?? data.total_service ?? data.total,
  );

  const completedServices = getNumber(
    data.completed_services ?? data.completed ?? data.total_completed,
  );

  const inProgressServices = getNumber(
    data.in_progress_services ?? data.in_progress ?? data.total_in_progress,
  );

  const cancelledServices = getNumber(
    data.cancelled_services ?? data.cancelled ?? data.total_cancelled,
  );

  const totalSpending = getNumber(
    data.total_spending ??
      data.total_spent ??
      data.total_amount ??
      data.total_revenue,
  );

  const hasSpendingData =
    data.total_spending !== undefined ||
    data.total_spent !== undefined ||
    data.total_amount !== undefined ||
    data.total_revenue !== undefined;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Activity size={20} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Service Summary
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              Service activity for this vehicle
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-medium text-gray-500 sm:flex">
          <History size={13} />
          Service History
        </div>
      </div>

      {/* SUMMARY */}
      <div className="p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryItem
            icon={Wrench}
            label="Total Services"
            value={totalServices}
            description="All service records"
            iconClassName="bg-red-50 text-red-600"
          />

          <SummaryItem
            icon={CheckCircle2}
            label="Completed"
            value={completedServices}
            description="Completed services"
            iconClassName="bg-green-50 text-green-600"
          />

          <SummaryItem
            icon={Clock3}
            label="In Progress"
            value={inProgressServices}
            description="Active service orders"
            iconClassName="bg-amber-50 text-amber-600"
          />

          <SummaryItem
            icon={XCircle}
            label="Cancelled"
            value={cancelledServices}
            description="Cancelled services"
            iconClassName="bg-gray-100 text-gray-500"
          />
        </div>

        {/* TOTAL SPENDING */}
        {hasSpendingData ? (
          <div className="mt-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <DollarSign size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Total Spending
                    </p>

                    <p className="mt-1 text-base font-bold text-gray-900">
                      {formatCurrency(totalSpending)}
                    </p>
                  </div>
                </div>

                <span className="hidden text-xs text-gray-500 sm:block">
                  Service transaction total
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
