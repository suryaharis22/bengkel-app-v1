"use client";

import { CheckCircle2, Clock3, LoaderCircle, XCircle } from "lucide-react";

function StatusItem({ icon: Icon, label, value, className }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${className}`}
        >
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-gray-500">{label}</p>

          <p className="mt-0.5 text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardOrderStatus({
  pending = 0,
  inProgress = 0,
  completed = 0,
  cancelled = 0,
  total = 0,
}) {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatusItem
          icon={Clock3}
          label="Pending"
          value={pending}
          className="bg-amber-50 text-amber-600"
        />

        <StatusItem
          icon={LoaderCircle}
          label="In Progress"
          value={inProgress}
          className="bg-blue-50 text-blue-600"
        />

        <StatusItem
          icon={CheckCircle2}
          label="Completed"
          value={completed}
          className="bg-green-50 text-green-600"
        />

        <StatusItem
          icon={XCircle}
          label="Cancelled"
          value={cancelled}
          className="bg-red-50 text-red-600"
        />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <span className="text-sm font-medium text-gray-600">
          Total Service Orders
        </span>

        <span className="text-sm font-bold text-gray-900">{total}</span>
      </div>
    </div>
  );
}
