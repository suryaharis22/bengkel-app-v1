"use client";

import { CalendarDays, ClipboardList, Hash, UserRound } from "lucide-react";

import ServiceOrderStatusBadge from "./ServiceOrderStatusBadge";

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

export default function ServiceOrderHeader({ order }) {
  if (!order) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <ClipboardList size={24} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">Service Order</h1>

              <ServiceOrderStatusBadge status={order.status} />
            </div>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Hash size={15} />
                {order.order_number || "-"}
              </div>

              <div className="flex items-center gap-1.5">
                <CalendarDays size={15} />
                {formatDate(order.created_at)}
              </div>

              {order.technician && (
                <div className="flex items-center gap-1.5">
                  <UserRound size={15} />
                  {order.technician.username}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
