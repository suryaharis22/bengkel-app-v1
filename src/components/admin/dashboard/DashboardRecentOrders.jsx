"use client";

import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  UserRound,
  Wrench,
  XCircle,
} from "lucide-react";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusConfig(status) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2,
        className: "bg-green-50 text-green-700",
      };

    case "in_progress":
      return {
        label: "In Progress",
        icon: LoaderCircle,
        className: "bg-blue-50 text-blue-700",
      };

    case "pending":
      return {
        label: "Pending",
        icon: Clock3,
        className: "bg-amber-50 text-amber-700",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        icon: XCircle,
        className: "bg-red-50 text-red-700",
      };

    default:
      return {
        label: status || "Unknown",
        icon: Clock3,
        className: "bg-gray-100 text-gray-600",
      };
  }
}

export default function DashboardRecentOrders({ orders = [] }) {
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  if (recentOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-5 py-8 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
          <Wrench size={21} />
        </div>

        <p className="mt-3 text-sm font-semibold text-gray-900">
          No service orders
        </p>

        <p className="mt-1 text-xs text-gray-500">
          There are no service orders to display.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentOrders.map((order) => {
        const status = getStatusConfig(order.status);

        const StatusIcon = status.icon;

        const customerName =
          order.booking?.customer?.username ||
          order.booking?.customer_name ||
          "Guest Customer";

        const vehicle = order.booking?.vehicle?.plate_number || "-";

        return (
          <div
            key={order.id}
            className="rounded-xl border border-gray-100 bg-gray-50 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {order.order_number}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {formatDate(order.created_at)}
                </p>
              </div>

              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
              >
                <StatusIcon size={12} />
                {status.label}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <UserRound size={14} className="shrink-0 text-gray-400" />

                <span className="truncate text-xs text-gray-600">
                  {customerName}
                </span>
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <Wrench size={14} className="shrink-0 text-gray-400" />

                <span className="truncate text-xs text-gray-600">
                  {vehicle}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
