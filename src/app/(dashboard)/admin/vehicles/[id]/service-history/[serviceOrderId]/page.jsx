"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  Loader2,
  Motorbike,
  ReceiptText,
  UserRound,
  Wrench,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

function getErrorMessage(error, fallback) {
  return (
    getAxiosError(error)?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function getServiceOrderFromResponse(response) {
  return (
    response?.data?.data?.data || response?.data?.data || response?.data || null
  );
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
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Rp 0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
}

function getStatusConfig(status) {
  switch (String(status || "").toLowerCase()) {
    case "completed":
      return {
        label: "Completed",
        className: "bg-green-50 text-green-700",
        icon: CheckCircle2,
      };

    case "in_progress":
      return {
        label: "In Progress",
        className: "bg-blue-50 text-blue-700",
        icon: Wrench,
      };

    case "confirmed":
      return {
        label: "Confirmed",
        className: "bg-indigo-50 text-indigo-700",
        icon: CheckCircle2,
      };

    case "pending":
      return {
        label: "Pending",
        className: "bg-amber-50 text-amber-700",
        icon: Clock3,
      };

    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-gray-100 text-gray-600",
        icon: XCircle,
      };

    default:
      return {
        label: status || "Unknown",
        className: "bg-gray-100 text-gray-600",
        icon: ClipboardList,
      };
  }
}

function getPaymentStatusConfig(status) {
  switch (String(status || "").toLowerCase()) {
    case "paid":
      return {
        label: "Paid",
        className: "bg-green-50 text-green-700",
      };

    case "partial":
      return {
        label: "Partial",
        className: "bg-amber-50 text-amber-700",
      };

    case "refunded":
      return {
        label: "Refunded",
        className: "bg-purple-50 text-purple-700",
      };

    default:
      return {
        label: "Unpaid",
        className: "bg-gray-100 text-gray-600",
      };
  }
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
      <div className="flex items-center gap-2 text-gray-400">
        <Icon size={15} />

        <span className="text-[11px] font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-gray-900">
        {value || "-"}
      </p>
    </div>
  );
}

function SectionCard({ title, description, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Icon size={19} />
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>

          {description ? (
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Loader2 size={23} className="animate-spin" />
        </div>

        <p className="mt-4 text-sm font-medium text-gray-700">
          Loading service order...
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Please wait while the service order is loaded.
        </p>
      </div>
    </div>
  );
}

function NotFoundState({ vehicleId }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
          <ClipboardList size={25} />
        </div>

        <h2 className="mt-4 text-base font-semibold text-gray-900">
          Service Order Not Found
        </h2>

        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-5 text-gray-500">
          The requested service order could not be found.
        </p>

        <Link
          href={`/admin/vehicles/${vehicleId}`}
          className={[
            "mt-5 inline-flex h-10 items-center gap-2",
            "rounded-lg bg-red-600 px-4",
            "text-sm font-medium text-white",
            "transition hover:bg-red-700",
          ].join(" ")}
        >
          <ArrowLeft size={16} />
          Back to Vehicle
        </Link>
      </div>
    </div>
  );
}

export default function VehicleServiceOrderDetailPage() {
  const params = useParams();
  const router = useRouter();

  const vehicleId = params?.id;
  const serviceOrderId = params?.serviceOrderId;

  const [serviceOrder, setServiceOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadServiceOrder = useCallback(async () => {
    if (!serviceOrderId) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.get(`/admin/service-orders/${serviceOrderId}`);

      const success = response?.data?.success !== false;

      if (!success) {
        throw new Error(
          response?.data?.message || "Failed to load service order",
        );
      }

      const data = getServiceOrderFromResponse(response);

      if (!data) {
        throw new Error("Service order data not found");
      }

      setServiceOrder(data);
    } catch (error) {
      console.error("Load service order detail error:", error);

      setServiceOrder(null);

      toast.error(
        getErrorMessage(error, "Failed to load service order detail"),
      );
    } finally {
      setLoading(false);
    }
  }, [serviceOrderId]);

  useEffect(() => {
    loadServiceOrder();
  }, [loadServiceOrder]);

  if (loading && !serviceOrder) {
    return <LoadingState />;
  }

  if (!serviceOrder) {
    return <NotFoundState vehicleId={vehicleId} />;
  }

  const status = getStatusConfig(serviceOrder.status);
  const StatusIcon = status.icon;

  const paymentStatus = getPaymentStatusConfig(serviceOrder.payment_status);

  const booking = serviceOrder.booking;
  const vehicle = booking?.vehicle;
  const technician = serviceOrder.technician;

  const serviceItems = Array.isArray(serviceOrder.service_items)
    ? serviceOrder.service_items
    : [];

  const sparePartItems = Array.isArray(serviceOrder.spare_part_items)
    ? serviceOrder.spare_part_items
    : [];

  const total = serviceOrder.grand_total ?? serviceOrder.subtotal ?? 0;

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/admin/vehicles/${vehicleId}`)}
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center",
              "rounded-xl border border-gray-200 bg-white",
              "text-gray-500 shadow-sm",
              "transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700",
            ].join(" ")}
            aria-label="Back to vehicle detail"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold text-gray-900">
                Service Order Detail
              </h1>

              <span className="hidden text-sm text-gray-400 sm:inline">/</span>

              <span className="truncate text-sm font-medium text-gray-500">
                {serviceOrder.order_number || `#${serviceOrder.id}`}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Complete service order information.
            </p>
          </div>
        </div>

        <div
          className={[
            "inline-flex w-fit items-center gap-1.5 rounded-full",
            "px-3 py-1.5 text-xs font-semibold",
            status.className,
          ].join(" ")}
        >
          <StatusIcon size={14} />
          {status.label}
        </div>
      </div>

      {/* ORDER SUMMARY */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Wrench size={23} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Service Order
                </p>

                <h2 className="mt-1 truncate text-lg font-bold text-gray-900">
                  {serviceOrder.order_number || `#${serviceOrder.id}`}
                </h2>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <CalendarDays size={13} />
                  Created {formatDate(serviceOrder.created_at)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Grand Total
              </p>

              <p className="mt-1 text-lg font-bold text-gray-900">
                {formatCurrency(total)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem
            icon={CalendarDays}
            label="Created At"
            value={formatDate(serviceOrder.created_at)}
          />

          <DetailItem
            icon={Clock3}
            label="Confirmed At"
            value={formatDate(serviceOrder.confirmed_at)}
          />

          <DetailItem
            icon={Wrench}
            label="Started At"
            value={formatDate(serviceOrder.started_at)}
          />

          <DetailItem
            icon={CheckCircle2}
            label="Completed At"
            value={formatDate(serviceOrder.completed_at)}
          />
        </div>
      </div>

      {/* VEHICLE + TECHNICIAN */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="Vehicle"
          description="Vehicle associated with this service order"
          icon={Motorbike}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem
              icon={Motorbike}
              label="Vehicle"
              value={
                vehicle
                  ? `${vehicle.brand || ""} ${vehicle.model || ""}`.trim()
                  : "-"
              }
            />

            <DetailItem
              icon={ClipboardList}
              label="Plate Number"
              value={vehicle?.plate_number}
            />

            <DetailItem
              icon={CalendarDays}
              label="Year"
              value={vehicle?.year}
            />

            <DetailItem
              icon={UserRound}
              label="Owner"
              value={booking?.customer_name}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Technician"
          description="Technician assigned to this service order"
          icon={UserRound}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem
              icon={UserRound}
              label="Technician"
              value={technician?.username}
            />

            <DetailItem
              icon={UserRound}
              label="Technician ID"
              value={technician?.id ? `#${technician.id}` : "-"}
            />

            <DetailItem
              icon={Wrench}
              label="Service Items"
              value={`${serviceItems.length} item${
                serviceItems.length !== 1 ? "s" : ""
              }`}
            />

            <DetailItem
              icon={ReceiptText}
              label="Spare Parts"
              value={`${sparePartItems.length} item${
                sparePartItems.length !== 1 ? "s" : ""
              }`}
            />
          </div>
        </SectionCard>
      </div>

      {/* COMPLAINT */}
      <SectionCard
        title="Complaint & Diagnosis"
        description="Customer complaint and technician diagnosis"
        icon={ClipboardList}
      >
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Complaint
            </p>

            <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {serviceOrder.complaint || "-"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Diagnosis
            </p>

            <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {serviceOrder.diagnosis || "-"}
              </p>
            </div>
          </div>

          {serviceOrder.notes ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Notes
              </p>

              <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {serviceOrder.notes}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>

      {/* SERVICE ITEMS */}
      <SectionCard
        title="Service Items"
        description="Services performed on this vehicle"
        icon={Wrench}
      >
        {serviceItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
            <Wrench size={22} className="mx-auto text-gray-400" />

            <p className="mt-2 text-sm font-medium text-gray-700">
              No service items
            </p>

            <p className="mt-1 text-xs text-gray-500">
              No service item has been recorded for this order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Service
                  </th>

                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Qty
                  </th>

                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Price
                  </th>

                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {serviceItems.map((item, index) => {
                  const quantity = Number(item.quantity ?? 1);

                  const price = Number(item.price ?? 0);

                  const itemTotal =
                    item.total ?? item.subtotal ?? quantity * price;

                  const serviceName =
                    item.service?.name ||
                    item.name ||
                    `Service Item ${index + 1}`;

                  return (
                    <tr
                      key={item.id || index}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {serviceName}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-center text-sm text-gray-700">
                        {quantity}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-gray-700">
                        {formatCurrency(price)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* SPARE PARTS */}
      <SectionCard
        title="Spare Parts"
        description="Spare parts used during this service"
        icon={ReceiptText}
      >
        {sparePartItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
            <ReceiptText size={22} className="mx-auto text-gray-400" />

            <p className="mt-2 text-sm font-medium text-gray-700">
              No spare parts
            </p>

            <p className="mt-1 text-xs text-gray-500">
              No spare part has been recorded for this order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Spare Part
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    SKU
                  </th>

                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Qty
                  </th>

                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Price
                  </th>

                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {sparePartItems.map((item, index) => {
                  const quantity = Number(item.quantity ?? 1);

                  const price = Number(item.price ?? 0);

                  const itemTotal =
                    item.total ?? item.subtotal ?? quantity * price;

                  const variant = item.variant || item.spare_part_variant;

                  const partName =
                    variant?.name || item.name || `Spare Part ${index + 1}`;

                  const sku = variant?.sku || item.sku || "-";

                  return (
                    <tr
                      key={item.id || index}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {partName}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-500">{sku}</td>

                      <td className="px-4 py-4 text-center text-sm text-gray-700">
                        {quantity}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-gray-700">
                        {formatCurrency(price)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* PAYMENT */}
      <SectionCard
        title="Payment"
        description="Payment information for this service order"
        icon={CreditCard}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem
            icon={ReceiptText}
            label="Subtotal"
            value={formatCurrency(serviceOrder.subtotal)}
          />

          <DetailItem
            icon={ReceiptText}
            label="Discount"
            value={formatCurrency(serviceOrder.discount)}
          />

          <DetailItem
            icon={ReceiptText}
            label="Tax"
            value={formatCurrency(serviceOrder.tax)}
          />

          <DetailItem
            icon={CreditCard}
            label="Payment Status"
            value={paymentStatus.label}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            icon={ReceiptText}
            label="Grand Total"
            value={formatCurrency(serviceOrder.grand_total)}
          />

          <DetailItem
            icon={CreditCard}
            label="Paid Amount"
            value={formatCurrency(serviceOrder.paid_amount)}
          />

          <DetailItem
            icon={ReceiptText}
            label="Change"
            value={formatCurrency(serviceOrder.change_amount)}
          />
        </div>

        <div className="mt-4">
          <span
            className={[
              "inline-flex items-center rounded-full px-3 py-1.5",
              "text-xs font-semibold",
              paymentStatus.className,
            ].join(" ")}
          >
            Payment: {paymentStatus.label}
          </span>
        </div>
      </SectionCard>
    </div>
  );
}
