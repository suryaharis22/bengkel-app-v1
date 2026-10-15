"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Motorbike,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  UserRound,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import TechnicianServiceOrderForm from "@/components/technician/service-orders/TechnicianServiceOrderForm";
import TechnicianServiceOrderStatusModal from "@/components/technician/service-orders/TechnicianServiceOrderStatusModal";

const STATUS_LABELS = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  technician_confirmed: "Dikonfirmasi Teknisi",
  in_progress: "Sedang Dikerjakan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
};

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-600/20",
  technician_confirmed: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  in_progress: "bg-violet-50 text-violet-700 ring-violet-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-red-50 text-red-700 ring-red-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
};

const PAYMENT_LABELS = {
  unpaid: "Belum Dibayar",
  partial: "Dibayar Sebagian",
  paid: "Lunas",
  refunded: "Dikembalikan",
};

const PAYMENT_STYLES = {
  unpaid: "bg-amber-50 text-amber-700 ring-amber-600/20",
  partial: "bg-blue-50 text-blue-700 ring-blue-600/20",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  refunded: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

function formatCurrency(value) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getOrderFromResponse(payload) {
  const data = payload?.data;

  return data?.service_order || data?.serviceOrder || data?.order || data;
}

function getCustomer(order) {
  return (
    order?.booking?.customer || order?.customer || order?.booking?.user || null
  );
}

function getVehicle(order) {
  return order?.booking?.vehicle || order?.vehicle || null;
}

function getCustomerName(order) {
  const customer = getCustomer(order);

  return (
    customer?.username ||
    customer?.name ||
    customer?.full_name ||
    order?.booking?.customer_name ||
    "-"
  );
}

function getCustomerPhone(order) {
  const customer = getCustomer(order);

  return (
    customer?.no_hp || customer?.phone || order?.booking?.customer_phone || "-"
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status] || "bg-gray-50 text-gray-600 ring-gray-500/20"
      }`}
    >
      {STATUS_LABELS[status] || status || "-"}
    </span>
  );
}

function PaymentBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
        PAYMENT_STYLES[status] || "bg-gray-50 text-gray-600 ring-gray-500/20"
      }`}
    >
      {PAYMENT_LABELS[status] || status || "-"}
    </span>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  className = "",
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={20} />
        </div>

        <div className="min-w-0 pt-0.5">
          <h2 className="text-sm font-bold text-gray-900 sm:text-base">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function InfoItem({ label, value, icon: Icon }) {
  const displayValue =
    value === null || value === undefined || value === "" ? "-" : value;

  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
      <p className="text-xs font-medium text-gray-500">{label}</p>

      <div className="mt-2 flex min-w-0 items-start gap-2">
        {Icon && <Icon size={15} className="mt-0.5 shrink-0 text-gray-400" />}

        <p className="min-w-0 break-words text-sm font-semibold leading-5 text-gray-900">
          {displayValue}
        </p>
      </div>
    </div>
  );
}

function ItemList({ title, items, emptyText, icon: Icon = ClipboardList }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon size={20} />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-xs text-gray-500">{list.length} item</p>
          </div>
        </div>

        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
          {list.length}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="px-5 py-9 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <ClipboardList size={22} />
          </div>

          <p className="mt-3 text-sm font-medium text-gray-700">
            Belum ada item
          </p>

          <p className="mt-1 text-xs text-gray-500">{emptyText}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {list.map((item, index) => {
            const variant =
              item?.variant ||
              item?.spare_part_variant ||
              item?.sparePartVariant;

            const sparePart =
              variant?.spare_part ||
              variant?.sparePart ||
              item?.spare_part ||
              item?.sparePart;

            const service = item?.service || null;

            const name =
              service?.name ||
              item?.service_name ||
              sparePart?.name ||
              variant?.name ||
              item?.name ||
              `Item ${index + 1}`;

            const quantity = Number(item?.quantity ?? 1);

            const unitPrice = Number(
              item?.unit_price ?? item?.unitPrice ?? item?.price ?? 0,
            );

            const subtotal =
              item?.subtotal != null
                ? Number(item.subtotal)
                : unitPrice * quantity;

            return (
              <div
                key={item?.id ?? `${name}-${index}`}
                className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-gray-50/80"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold leading-5 text-gray-900">
                      {name}
                    </p>

                    <p className="mt-1.5 text-xs leading-5 text-gray-500">
                      {quantity} × {formatCurrency(unitPrice)}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 text-right text-sm font-bold tabular-nums text-gray-900">
                  {formatCurrency(subtotal)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6">
        <div className="h-4 w-36 rounded bg-gray-200" />
        <div className="mt-4 h-8 w-64 max-w-full rounded bg-gray-200" />
        <div className="mt-4 flex gap-2">
          <div className="h-7 w-28 rounded-full bg-gray-100" />
          <div className="h-7 w-28 rounded-full bg-gray-100" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6"
          >
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((cell) => (
                <div key={cell} className="h-16 rounded-xl bg-gray-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getWorkStatusMessage(status) {
  switch (status) {
    case "pending":
      return "Menunggu konfirmasi admin sebelum pekerjaan dapat dimulai.";

    case "technician_confirmed":
      return "Status teknisi sudah dikonfirmasi. Pekerjaan dapat dimulai setelah admin mengonfirmasi service order.";

    case "in_progress":
      return "Pekerjaan sedang berlangsung. Penyelesaian dilakukan oleh admin.";

    case "completed":
      return "Pekerjaan ini sudah diselesaikan oleh admin.";

    case "cancelled":
      return "Pekerjaan ini sudah dibatalkan.";

    case "rejected":
      return "Pekerjaan ini sudah ditolak.";

    default:
      return "Tidak ada aksi yang tersedia untuk status pekerjaan ini.";
  }
}

export default function TechnicianServiceOrderDetail({ id }) {
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    action: "start",
  });

  const fetchOrder = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get(`/technician/service-orders/${id}`);

        const payload = response?.data;

        if (payload?.success === false) {
          throw new Error(
            payload?.message || "Gagal mengambil detail service order.",
          );
        }

        const result = getOrderFromResponse(payload);

        if (!result || result.id == null) {
          throw new Error("Data service order tidak ditemukan.");
        }

        setOrder(result);
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Gagal mengambil detail service order.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id, fetchOrder]);

  // Teknisi hanya dapat memulai order yang sudah dikonfirmasi admin.
  const runAction = async (action, serviceOrder) => {
    const targetOrder = serviceOrder || order;

    if (!targetOrder?.id || processing) return;

    if (action !== "start") {
      toast.error("Aksi tidak tersedia untuk teknisi.");
      return;
    }

    if (targetOrder.status !== "confirmed") {
      toast.error("Service order harus dikonfirmasi admin sebelum dimulai.");
      return;
    }

    try {
      setProcessing(true);

      await api.post(`/technician/service-orders/${targetOrder.id}/start`);

      toast.success("Service order berhasil dimulai.");

      setStatusModal((current) => ({
        ...current,
        open: false,
      }));

      await fetchOrder(true);
    } catch (error) {
      const responseData = error?.response?.data;
      const validationErrors = responseData?.errors;

      const validationMessage = Array.isArray(validationErrors)
        ? validationErrors
            .map((item) => item?.message || item?.msg || item)
            .filter(Boolean)
            .join(", ")
        : validationErrors && typeof validationErrors === "object"
          ? Object.values(validationErrors)
              .flat()
              .map((item) =>
                typeof item === "string" ? item : item?.message || item?.msg,
              )
              .filter(Boolean)
              .join(", ")
          : "";

      toast.error(
        responseData?.message ||
          validationMessage ||
          error?.message ||
          "Gagal memulai service order.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const openStatusModal = (action) => {
    if (action !== "start" || order?.status !== "confirmed") {
      return;
    }

    setStatusModal({
      open: true,
      action: "start",
    });
  };

  const closeStatusModal = () => {
    if (processing) return;

    setStatusModal((current) => ({
      ...current,
      open: false,
    }));
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
          <ClipboardList size={30} />
        </div>

        <h2 className="mt-5 text-lg font-bold text-gray-900">
          Service order tidak ditemukan
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
          Data tidak tersedia atau Anda tidak memiliki akses ke pekerjaan ini.
        </p>

        <button
          type="button"
          onClick={() => router.push("/teknisi/service-orders")}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  const booking = order.booking || {};
  const customer = getCustomer(order);
  const vehicle = getVehicle(order);
  const technician = order.technician || null;
  const confirmedBy = order.confirmed_by || order.confirmedBy || null;

  const serviceItems = order.service_items || order.serviceItems || [];
  const sparePartItems = order.spare_part_items || order.sparePartItems || [];

  const canStart = order.status === "confirmed";

  const orderNumber = order.order_number || `SO-${order.id}`;

  const grandTotal = Number(order.grand_total ?? 0);
  const paidAmount = Number(order.paid_amount ?? 0);
  const remainingAmount = Math.max(grandTotal - paidAmount, 0);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      {/* HEADER */}
      <header className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => router.push("/teknisi/service-orders")}
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              Kembali ke Service Order
            </button>

            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Detail Pekerjaan
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              {orderNumber}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Informasi pekerjaan, pelanggan, kendaraan, dan pembayaran.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={order.status} />

              {order.payment_status && (
                <PaymentBadge status={order.payment_status} />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchOrder(true)}
            disabled={refreshing || processing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Memperbarui..." : "Perbarui Data"}
          </button>
        </div>
      </header>

      {/* RINGKASAN */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-500">
              Status Pekerjaan
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Wrench size={19} />
            </div>
          </div>

          <div className="mt-4">
            <StatusBadge status={order.status} />
          </div>

          <p className="mt-3 text-xs leading-5 text-gray-500">
            Status terkini service order.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-500">Pelanggan</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <UserRound size={19} />
            </div>
          </div>

          <p className="mt-4 break-words text-base font-bold text-gray-900">
            {getCustomerName(order)}
          </p>

          <p className="mt-1 break-words text-xs text-gray-500">
            {getCustomerPhone(order)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-500">Kendaraan</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Motorbike size={19} />
            </div>
          </div>

          <p className="mt-4 break-words text-base font-bold text-gray-900">
            {[vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") || "-"}
          </p>

          <p className="mt-1 text-xs font-medium text-gray-500">
            {vehicle?.plate_number || "Nomor polisi belum tersedia"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-500">Sisa Pembayaran</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard size={19} />
            </div>
          </div>

          <p className="mt-4 break-words text-xl font-bold tracking-tight text-gray-900">
            {formatCurrency(remainingAmount)}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {PAYMENT_LABELS[order.payment_status] ||
              order.payment_status ||
              "Status belum tersedia"}
          </p>
        </div>
      </section>

      {/* INFORMASI PEKERJAAN */}
      <SectionCard
        icon={ClipboardList}
        title="Informasi Pekerjaan"
        description="Nomor order, jadwal booking, dan keluhan pelanggan."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="Nomor Service Order" value={orderNumber} />
          <InfoItem label="Nomor Booking" value={booking.booking_number} />
          <InfoItem
            label="Status Booking"
            value={STATUS_LABELS[booking.status] || booking.status}
          />
          <InfoItem
            label="Jadwal Booking"
            value={formatDate(booking.scheduled_at)}
            icon={CalendarDays}
          />
          <InfoItem
            label="Dibuat Pada"
            value={formatDate(order.created_at)}
            icon={Clock3}
          />
          <InfoItem
            label="Dikonfirmasi Pada"
            value={formatDate(order.confirmed_at)}
            icon={CheckCircle2}
          />
        </div>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <FileText size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">
                Keluhan Pelanggan
              </p>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                {booking.complaint || order.complaint || "Tidak ada keluhan."}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* PELANGGAN DAN KENDARAAN */}
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          icon={UserRound}
          title="Informasi Pelanggan"
          description="Informasi kontak pelanggan yang melakukan booking."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem
              label="Nama Pelanggan"
              value={getCustomerName(order)}
              icon={UserRound}
            />
            <InfoItem
              label="Nomor Telepon"
              value={getCustomerPhone(order)}
              icon={Phone}
            />
            <InfoItem label="Email" value={customer?.email} icon={Mail} />
          </div>
        </SectionCard>

        <SectionCard
          icon={Motorbike}
          title="Informasi Kendaraan"
          description="Identitas kendaraan yang akan diservis."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem
              label="Merek dan Model"
              value={
                [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") ||
                "-"
              }
              icon={Motorbike}
            />
            <InfoItem label="Nomor Polisi" value={vehicle?.plate_number} />
            <InfoItem label="Tahun Kendaraan" value={vehicle?.year} />
            <InfoItem label="Warna Kendaraan" value={vehicle?.color} />
          </div>
        </SectionCard>
      </div>

      {/* INFORMASI TEKNISI */}
      <SectionCard
        icon={Wrench}
        title="Informasi Teknisi"
        description="Teknisi yang bertanggung jawab atas pekerjaan ini."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoItem
            label="Nama Teknisi"
            value={technician?.username}
            icon={UserRound}
          />
          <InfoItem
            label="Email Teknisi"
            value={technician?.email}
            icon={Mail}
          />
          <InfoItem
            label="Nomor Telepon Teknisi"
            value={technician?.no_hp}
            icon={Phone}
          />
          <InfoItem
            label="Dikonfirmasi Oleh"
            value={confirmedBy?.username}
            icon={CheckCircle2}
          />
        </div>
      </SectionCard>

      {/* LAYANAN DAN SPARE PART */}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <ItemList
          title="Layanan Servis"
          items={serviceItems}
          emptyText="Belum ada layanan servis pada order ini."
          icon={Wrench}
        />

        <ItemList
          title="Spare Part"
          items={sparePartItems}
          emptyText="Belum ada spare part pada order ini."
          icon={Motorbike}
        />
      </div>

      {/* PEMBAYARAN */}
      <SectionCard
        icon={CreditCard}
        title="Informasi Pembayaran"
        description="Ringkasan biaya service order dan pembayaran pelanggan."
      >
        <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Total Pembayaran
              </p>

              <p className="mt-2 break-words text-2xl font-bold tracking-tight text-blue-950 sm:text-3xl">
                {formatCurrency(order.grand_total)}
              </p>

              <p className="mt-2 text-xs text-blue-800/70">
                Termasuk komponen biaya sesuai perhitungan order.
              </p>
            </div>

            {order.payment_status && (
              <div>
                <PaymentBadge status={order.payment_status} />
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3 border-t border-blue-100 pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-blue-700">Sudah Dibayar</p>
              <p className="mt-1.5 text-lg font-bold text-blue-950">
                {formatCurrency(order.paid_amount)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-blue-700">
                Sisa Pembayaran
              </p>
              <p className="mt-1.5 text-lg font-bold text-blue-950">
                {formatCurrency(remainingAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="Subtotal" value={formatCurrency(order.subtotal)} />
          <InfoItem label="Diskon" value={formatCurrency(order.discount)} />
          <InfoItem label="Pajak" value={formatCurrency(order.tax)} />
          <InfoItem
            label="Biaya Pembayaran"
            value={formatCurrency(order.payment_fee)}
          />
          <InfoItem
            label="Jumlah Dibayar"
            value={formatCurrency(order.paid_amount)}
          />
          <InfoItem
            label="Kembalian"
            value={formatCurrency(order.change_amount)}
          />
        </div>
      </SectionCard>

      {/* DIAGNOSIS DAN CATATAN */}
      <SectionCard
        icon={FileText}
        title="Diagnosis dan Catatan Teknisi"
        description="Catat hasil pemeriksaan, diagnosis, dan pekerjaan teknis."
      >
        <TechnicianServiceOrderForm
          key={`${order.id}-${order.updated_at || order.status}`}
          serviceOrderId={order.id}
          diagnosis={order.diagnosis || ""}
          notes={order.notes || ""}
          status={order.status}
          onSuccess={() => fetchOrder(true)}
        />
      </SectionCard>

      {/* AKSI PEKERJAAN */}
      <SectionCard
        icon={Wrench}
        title="Aksi Pekerjaan"
        description="Mulai pekerjaan setelah service order dikonfirmasi admin."
      >
        {canStart ? (
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Wrench size={20} />
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">
                  Pekerjaan siap dimulai
                </p>
                <p className="mt-1 text-sm leading-5 text-gray-600">
                  Pastikan informasi kendaraan, keluhan, dan layanan sudah
                  diperiksa sebelum memulai.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openStatusModal("start")}
              disabled={processing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Wrench size={17} />
              {processing ? "Memproses..." : "Mulai Pekerjaan"}
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-600">
              <Clock3 size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                {STATUS_LABELS[order.status] || "Status Pekerjaan"}
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {getWorkStatusMessage(order.status)}
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* MODAL KONFIRMASI */}
      <TechnicianServiceOrderStatusModal
        open={statusModal.open}
        action="start"
        serviceOrder={order}
        loading={processing}
        onClose={closeStatusModal}
        onConfirm={(action, serviceOrder) => runAction(action, serviceOrder)}
      />
    </div>
  );
}
