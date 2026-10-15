"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  CreditCard,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Trash2,
  UserCog,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import ServiceOrderPaymentModal from "./ServiceOrderPaymentModal";

function getActionConfig(status, paymentStatus) {
  const isPaid = paymentStatus === "paid";
  const isRefunded = paymentStatus === "refunded";

  switch (status) {
    case "pending":
      return {
        primary: {
          label: "Confirm Order",
          icon: CheckCircle2,
          endpoint: "confirm",
        },
        canCancel: true,
        canDelete: true,
        canReopen: false,
        canPay: false,
      };

    case "confirmed":
      return {
        primary: {
          label: "Start Service",
          icon: PlayCircle,
          endpoint: "start",
        },
        canCancel: true,
        canDelete: false,
        canReopen: false,
        canPay: false,
      };

    case "in_progress":
      return {
        primary: {
          label: "Complete Order",
          icon: CheckCircle2,
          endpoint: "complete",
        },
        canCancel: true,
        canDelete: false,
        canReopen: false,
        canPay: false,
      };

    case "completed":
      return {
        primary: null,
        canCancel: false,
        canDelete: false,
        canReopen: !isPaid && !isRefunded,
        canPay: !isPaid && !isRefunded,
      };

    case "cancelled":
      return {
        primary: null,
        canCancel: false,
        canDelete: false,
        canReopen: false,
        canPay: false,
      };

    default:
      return {
        primary: null,
        canCancel: false,
        canDelete: false,
        canReopen: false,
        canPay: false,
      };
  }
}

function getResponseData(response) {
  return (
    response?.data?.data?.data || response?.data?.data || response?.data || null
  );
}

function getResponseMessage(response, fallback) {
  return response?.data?.message || response?.data?.data?.message || fallback;
}

export default function ServiceOrderActions({ order, onRefresh }) {
  const router = useRouter();

  const [loadingAction, setLoadingAction] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  if (!order) {
    return null;
  }

  const config = getActionConfig(order.status, order.payment_status);

  const isLoading = Boolean(loadingAction || paymentLoading);

  const hasTechnician = Boolean(order.technician_id);

  const isConfirmed = order.status === "confirmed";
  const isCompleted = order.status === "completed";
  const isCancelled = order.status === "cancelled";
  const isPending = order.status === "pending";
  const isInProgress = order.status === "in_progress";

  const canStartService = isConfirmed && hasTechnician;

  const PrimaryIcon = config.primary?.icon;

  function openConfirmation(type) {
    if (isLoading) return;
    setConfirmation(type);
  }

  function closeConfirmation() {
    if (isLoading) return;
    setConfirmation(null);
  }

  async function handleStatusAction(action) {
    if (!action || isLoading) return;

    if (action.endpoint === "start" && !hasTechnician) {
      toast.error(
        "Please assign a PIC technician before starting the service.",
      );
      return;
    }

    setLoadingAction(action.endpoint);

    try {
      const response = await api.put(
        `/admin/service-orders/${order.id}/${action.endpoint}`,
      );

      toast.success(getResponseMessage(response, `${action.label} successful`));

      setConfirmation(null);
      await onRefresh?.();
    } catch (error) {
      toast.error(getAxiosError(error).message);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleReopen() {
    if (isLoading) return;

    if (
      order.payment_status === "paid" ||
      order.payment_status === "refunded"
    ) {
      toast.error(
        "Order yang sudah dibayar atau direfund tidak dapat dibuka kembali.",
      );
      setConfirmation(null);
      return;
    }

    setLoadingAction("reopen");

    try {
      const response = await api.put(
        `/admin/service-orders/${order.id}/reopen`,
      );

      toast.success(
        getResponseMessage(response, "Service order reopened successfully"),
      );

      setConfirmation(null);
      await onRefresh?.();
    } catch (error) {
      toast.error(getAxiosError(error).message);
    } finally {
      setLoadingAction(null);
    }
  }

  function handlePayment() {
    if (isLoading) return;

    if (order.status !== "completed") {
      toast.error("Pembayaran hanya dapat dilakukan setelah servis selesai.");
      return;
    }

    if (
      order.payment_status === "paid" ||
      order.payment_status === "refunded"
    ) {
      toast.info("Order ini tidak dapat dibayar.");
      return;
    }

    const grandTotal = Number(
      order.grand_total ?? order.total ?? order.subtotal ?? 0,
    );

    const paidAmount = Number(order.paid_amount ?? 0);

    const remainingAmount =
      order.remaining_amount != null
        ? Number(order.remaining_amount)
        : Math.max(grandTotal - paidAmount, 0);

    if (remainingAmount <= 0) {
      toast.info("Tidak ada sisa pembayaran.");
      return;
    }

    setPaymentModalOpen(true);
  }

  async function handleSubmitPayment(payload) {
    if (paymentLoading || loadingAction) return;

    if (!payload?.payment_method) {
      toast.error("Pilih metode pembayaran terlebih dahulu.");
      return;
    }

    setPaymentLoading(true);

    try {
      const response = await api.post(
        `/admin/service-orders/${order.id}/payment`,
        payload,
      );

      const result = getResponseData(response);

      const message = getResponseMessage(
        response,
        "Pembayaran berhasil diproses.",
      );

      if (payload.payment_method === "cash") {
        setPaymentModalOpen(false);
        toast.success(message);

        await onRefresh?.();
        return;
      }

      const payment = result?.payment ?? result?.data?.payment;

      const snapToken =
        payment?.token ||
        payment?.snap_token ||
        result?.token ||
        result?.snap_token;

      if (!snapToken) {
        throw new Error(
          "Token pembayaran Midtrans tidak ditemukan pada response API.",
        );
      }

      if (typeof window === "undefined" || !window.snap) {
        throw new Error(
          "Midtrans Snap belum dimuat. Periksa konfigurasi Snap.",
        );
      }

      setPaymentModalOpen(false);

      window.snap.pay(snapToken, {
        onSuccess: async () => {
          toast.success("Pembayaran berhasil.");

          try {
            await onRefresh?.();
          } catch {
            toast.error(
              "Pembayaran berhasil, tetapi detail order gagal diperbarui.",
            );
          }
        },

        onPending: async () => {
          toast.info("Pembayaran menunggu konfirmasi.");

          try {
            await onRefresh?.();
          } catch {
            // Data dapat diperbarui kembali melalui tombol Refresh.
          }
        },

        onError: async () => {
          toast.error("Pembayaran Midtrans gagal.");

          try {
            await onRefresh?.();
          } catch {
            // Data dapat diperbarui kembali melalui tombol Refresh.
          }
        },

        onClose: async () => {
          try {
            await onRefresh?.();
          } catch {
            // Data dapat diperbarui kembali melalui tombol Refresh.
          }
        },
      });
    } catch (error) {
      toast.error(getAxiosError(error, "Gagal memproses pembayaran.").message);
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleCancel() {
    if (isLoading) return;

    setLoadingAction("cancel");

    try {
      const response = await api.put(
        `/admin/service-orders/${order.id}/cancel`,
      );

      toast.success(
        getResponseMessage(response, "Service order cancelled successfully"),
      );

      setConfirmation(null);
      await onRefresh?.();
    } catch (error) {
      toast.error(getAxiosError(error).message);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleDelete() {
    if (isLoading) return;

    setLoadingAction("delete");

    try {
      const response = await api.delete(`/admin/service-orders/${order.id}`);

      toast.success(
        getResponseMessage(response, "Service order deleted successfully"),
      );

      router.push("/admin/service-orders");
    } catch (error) {
      toast.error(getAxiosError(error).message);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleRefresh() {
    if (isLoading) return;

    try {
      await onRefresh?.();
    } catch (error) {
      toast.error(getAxiosError(error).message);
    }
  }

  const confirmationTitle = {
    delete: "Delete this service order?",
    reopen: "Reopen this completed order?",
    cancel: "Cancel this service order?",
  };

  const confirmationDescription = {
    delete: "This action cannot be undone.",
    reopen: "The order will be reopened so you can correct the service order.",
    cancel: "The service order will be marked as cancelled.",
  };

  const confirmationHandler = {
    delete: handleDelete,
    reopen: handleReopen,
    cancel: handleCancel,
  };

  const confirmationButtonLabel = {
    delete: "Yes, Delete",
    reopen: "Yes, Reopen",
    cancel: "Yes, Cancel",
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* HEADER AND ACTIONS */}
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">
            Order Actions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage the current service order.
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              {order.order_number}
            </span>

            <span
              className={[
                "rounded-lg px-2.5 py-1 text-xs font-medium",
                isPending
                  ? "bg-amber-100 text-amber-700"
                  : isConfirmed
                    ? "bg-blue-100 text-blue-700"
                    : isInProgress
                      ? "bg-indigo-100 text-indigo-700"
                      : isCompleted
                        ? "bg-green-100 text-green-700"
                        : isCancelled
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700",
              ].join(" ")}
            >
              {order.status?.replaceAll("_", " ")}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PRIMARY ACTION */}
          {config.primary && PrimaryIcon && (
            <button
              type="button"
              onClick={() => handleStatusAction(config.primary)}
              disabled={
                isLoading ||
                (config.primary.endpoint === "start" && !canStartService)
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingAction === config.primary.endpoint ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <PrimaryIcon size={17} />
              )}

              {config.primary.label}
            </button>
          )}

          {/* REOPEN ORDER */}
          {config.canReopen && (
            <button
              type="button"
              onClick={() => openConfirmation("reopen")}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingAction === "reopen" ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <RotateCcw size={17} />
              )}
              Reopen
            </button>
          )}

          {/* PAYMENT */}
          {config.canPay && (
            <button
              type="button"
              onClick={handlePayment}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paymentLoading ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <CreditCard size={17} />
              )}
              Bayar
            </button>
          )}

          {/* CANCEL */}
          {config.canCancel && (
            <button
              type="button"
              onClick={() => openConfirmation("cancel")}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CircleX size={17} />
              Cancel
            </button>
          )}

          {/* DELETE */}
          {config.canDelete && (
            <button
              type="button"
              onClick={() => openConfirmation("delete")}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={17} />
              Delete
            </button>
          )}

          {/* REFRESH */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      {/* PENDING INFO */}
      {isPending && (
        <div className="border-t border-amber-100 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
              <AlertTriangle size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                Order awaiting confirmation
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Confirm this service order before starting the service. The
                assigned technician is{" "}
                {order.technician?.username || "not available"}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMED WITHOUT TECHNICIAN */}
      {isConfirmed && !hasTechnician && (
        <div className="border-t border-amber-100 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
              <UserCog size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                PIC technician is required
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Assign a technician in the PIC Technician section before
                starting the service.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMED WITH TECHNICIAN */}
      {isConfirmed && hasTechnician && (
        <div className="border-t border-green-100 bg-green-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-green-600 shadow-sm">
              <UserCog size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-green-900">
                PIC technician assigned
              </p>

              <p className="mt-1 text-sm leading-6 text-green-800">
                Technician {order.technician?.username || "assigned"} is ready
                to start the service.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* IN PROGRESS INFO */}
      {isInProgress && (
        <div className="border-t border-indigo-100 bg-indigo-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
              <PlayCircle size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold text-indigo-900">
                Service in progress
              </p>

              <p className="mt-1 text-sm leading-6 text-indigo-800">
                Complete the service after all work has been finished.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED INFO */}
      {isCompleted && (
        <div className="border-t border-blue-100 bg-blue-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-900">
                Service order completed
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                {order.payment_status === "paid"
                  ? "Servis telah selesai dan pembayaran telah lunas. Order tidak dapat dibuka kembali."
                  : order.payment_status === "refunded"
                    ? "Pembayaran telah direfund. Order tidak dapat dibuka kembali."
                    : "Servis telah selesai. Order dapat dibuka kembali selama belum lunas."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLED INFO */}
      {isCancelled && (
        <div className="border-t border-red-100 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-red-600 shadow-sm">
              <CircleX size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold text-red-900">
                Service order cancelled
              </p>

              <p className="mt-1 text-sm leading-6 text-red-800">
                This order has been cancelled. No further service actions are
                available.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT STATUS INFO */}
      {isCompleted && (
        <div className="flex flex-col gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Payment status</p>

            <p className="mt-1 text-sm text-gray-500">
              {order.payment_status === "paid"
                ? "Payment completed"
                : order.payment_status === "refunded"
                  ? "Payment refunded"
                  : "Payment has not been completed"}
            </p>
          </div>

          <p className="text-base font-semibold text-gray-900">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(Number(order.grand_total || 0))}
          </p>
        </div>
      )}

      {/* CONFIRMATION */}
      {confirmation && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
                <AlertTriangle size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {confirmationTitle[confirmation]}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {confirmationDescription[confirmation]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:shrink-0">
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={isLoading}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                No
              </button>

              <button
                type="button"
                onClick={confirmationHandler[confirmation]}
                disabled={isLoading}
                className={[
                  "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-white",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  confirmation === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-orange-600 hover:bg-orange-700",
                ].join(" ")}
              >
                {isLoading && <RefreshCw size={15} className="animate-spin" />}

                {confirmationButtonLabel[confirmation]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {paymentModalOpen && (
        <ServiceOrderPaymentModal
          open={paymentModalOpen}
          order={order}
          onClose={() => {
            if (!paymentLoading) {
              setPaymentModalOpen(false);
            }
          }}
          onSubmit={handleSubmitPayment}
          loading={paymentLoading}
        />
      )}
    </section>
  );
}
