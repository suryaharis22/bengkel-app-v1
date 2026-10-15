"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  Wrench,
  XCircle,
} from "lucide-react";

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
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

function getStatusConfig(status) {
  const configs = {
    pending: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 ring-amber-600/20",
      icon: ClipboardList,
    },
    confirmed: {
      label: "Confirmed",
      className: "bg-blue-50 text-blue-700 ring-blue-600/20",
      icon: CheckCircle2,
    },
    in_progress: {
      label: "In Progress",
      className: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
      icon: Wrench,
    },
    completed: {
      label: "Completed",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      icon: CheckCircle2,
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-50 text-red-700 ring-red-600/20",
      icon: XCircle,
    },
  };

  return (
    configs[status] || {
      label: status || "-",
      className: "bg-gray-50 text-gray-700 ring-gray-600/20",
      icon: ClipboardList,
    }
  );
}

function StatusBadge({ status }) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-xs font-semibold ring-1 ring-inset",
        config.className,
      ].join(" ")}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

function getOrderNumber(item) {
  return item?.order_number || item?.service_order?.order_number || "-";
}

function getOrderDate(item) {
  return (
    item?.created_at ||
    item?.service_order?.created_at ||
    item?.booking?.scheduled_at ||
    item?.service_order?.booking?.scheduled_at
  );
}

function getOrderStatus(item) {
  return item?.status || item?.service_order?.status || null;
}

function getGrandTotal(item) {
  return item?.grand_total ?? item?.service_order?.grand_total ?? 0;
}

function getComplaint(item) {
  return item?.complaint || item?.service_order?.complaint || "-";
}

function getServiceItems(item) {
  return item?.service_items || item?.service_order?.service_items || [];
}

function getSparePartItems(item) {
  return item?.spare_part_items || item?.service_order?.spare_part_items || [];
}

function getServiceOrderId(item) {
  return item?.id || item?.service_order?.id;
}

export default function VehicleServiceHistory({
  vehicleId,
  serviceHistory = [],
  loading = false,
}) {
  if (loading) {
    return null;
  }

  if (!serviceHistory.length) {
    return (
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <ClipboardList size={18} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Service History
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Vehicle service history
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <FileText size={22} />
          </div>

          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            No service history
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            This vehicle does not have any service records yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <ClipboardList size={18} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Service History
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              {serviceHistory.length} service record
              {serviceHistory.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/70 text-left">
              <th className="px-5 py-3 font-semibold text-gray-600">
                Service Order
              </th>

              <th className="px-4 py-3 font-semibold text-gray-600">Date</th>

              <th className="px-4 py-3 font-semibold text-gray-600">
                Complaint
              </th>

              <th className="px-4 py-3 text-center font-semibold text-gray-600">
                Items
              </th>

              <th className="px-4 py-3 text-right font-semibold text-gray-600">
                Total
              </th>

              <th className="px-4 py-3 text-center font-semibold text-gray-600">
                Status
              </th>

              <th className="px-5 py-3 text-right font-semibold text-gray-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {serviceHistory.map((item) => {
              const orderId = getServiceOrderId(item);
              const orderNumber = getOrderNumber(item);
              const serviceItems = getServiceItems(item);
              const sparePartItems = getSparePartItems(item);

              return (
                <tr
                  key={orderId}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{orderNumber}</p>

                    <p className="mt-1 text-xs text-gray-500">
                      Order ID: {orderId}
                    </p>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} className="text-gray-400" />
                      {formatDate(getOrderDate(item))}
                    </div>
                  </td>

                  <td className="max-w-[220px] px-4 py-4">
                    <p className="truncate text-gray-700">
                      {getComplaint(item)}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center gap-2 text-xs">
                      <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">
                        {serviceItems.length} service
                      </span>

                      <span className="rounded-md bg-purple-50 px-2 py-1 text-purple-700">
                        {sparePartItems.length} part
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right font-semibold text-gray-900">
                    {formatCurrency(getGrandTotal(item))}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <StatusBadge status={getOrderStatus(item)} />
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/vehicles/${vehicleId}/service-history/${orderId}`}
                      className={[
                        "inline-flex h-9 items-center gap-2 rounded-lg",
                        "border border-gray-300 bg-white px-3",
                        "text-xs font-semibold text-gray-700",
                        "transition hover:bg-gray-50 hover:text-gray-900",
                      ].join(" ")}
                    >
                      <Eye size={15} />
                      View Detail
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 p-4 md:hidden">
        {serviceHistory.map((item) => {
          const orderId = getServiceOrderId(item);
          const serviceItems = getServiceItems(item);
          const sparePartItems = getSparePartItems(item);

          return (
            <div
              key={orderId}
              className="rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {getOrderNumber(item)}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                    <CalendarDays size={13} />
                    {formatDate(getOrderDate(item))}
                  </div>
                </div>

                <StatusBadge status={getOrderStatus(item)} />
              </div>

              <div className="mt-4 rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500">Complaint</p>

                <p className="mt-1 text-sm text-gray-800">
                  {getComplaint(item)}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Services</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {serviceItems.length}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Spare Parts</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {sparePartItems.length}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-500">Grand Total</p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {formatCurrency(getGrandTotal(item))}
                  </p>
                </div>

                <Link
                  href={`/admin/vehicles/${vehicleId}/service-history/${orderId}`}
                  className={[
                    "inline-flex h-9 items-center gap-2 rounded-lg",
                    "bg-red-600 px-3",
                    "text-xs font-semibold text-white",
                    "transition hover:bg-red-700",
                  ].join(" ")}
                >
                  <Eye size={15} />
                  Detail
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
