"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Check,
  CreditCard,
  Loader2,
  QrCode,
  Smartphone,
  Wallet,
  X,
} from "lucide-react";

const PAYMENT_METHODS = [
  {
    value: "cash",
    label: "Cash",
    description: "Bayar langsung dengan uang tunai.",
    icon: Banknote,
  },
  {
    value: "qris",
    label: "QRIS",
    description: "Pembayaran melalui QRIS.",
    icon: QrCode,
  },
  {
    value: "transfer",
    label: "Transfer",
    description: "Transfer melalui rekening bank.",
    icon: CreditCard,
  },
  {
    value: "debit",
    label: "Debit",
    description: "Pembayaran menggunakan kartu debit.",
    icon: CreditCard,
  },
  {
    value: "ewallet",
    label: "E-Wallet",
    description: "Pembayaran melalui dompet digital.",
    icon: Smartphone,
  },
];

const PAYMENT_FEES = {
  cash: {
    type: "fixed",
    value: 0,
  },
  qris: {
    type: "percentage",
    value: 0.7,
  },
  transfer: {
    type: "fixed",
    value: 4000,
  },
  debit: {
    type: "fixed",
    value: 0,
  },
  ewallet: {
    type: "percentage",
    value: 2,
  },
};

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getPaymentFee(amount, paymentMethod) {
  const feeConfig = PAYMENT_FEES[paymentMethod];

  if (!feeConfig || amount <= 0) {
    return 0;
  }

  if (feeConfig.type === "percentage") {
    return Math.round((amount * feeConfig.value) / 100);
  }

  return feeConfig.value;
}

function getResponseData(data) {
  if (!data) {
    return null;
  }

  if (data.summary || data.service_order || data.payments) {
    return data;
  }

  if (data.data) {
    return getResponseData(data.data);
  }

  return data;
}

export default function ServiceOrderPaymentModal({
  open,
  order = null,
  onClose,
  onSubmit,
  loading = false,
}) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");

  const serviceOrder = useMemo(() => {
    return getResponseData(order);
  }, [order]);

  const grandTotal = Number(
    serviceOrder?.grand_total ??
      serviceOrder?.summary?.grand_total ??
      serviceOrder?.total ??
      0,
  );

  const existingPaidAmount = Number(
    serviceOrder?.paid_amount ?? serviceOrder?.summary?.paid_amount ?? 0,
  );

  const remainingBeforeFee = Math.max(
    Number(
      serviceOrder?.remaining_amount ??
        serviceOrder?.summary?.remaining_amount ??
        grandTotal - existingPaidAmount,
    ) || 0,
    0,
  );

  const amountToPay = remainingBeforeFee;

  const isMidtransPayment = paymentMethod !== "cash";

  const paymentFee = useMemo(() => {
    return getPaymentFee(amountToPay, paymentMethod);
  }, [amountToPay, paymentMethod]);

  const totalPayment = amountToPay + paymentFee;

  const numericPaidAmount = useMemo(() => {
    if (isMidtransPayment) {
      return totalPayment;
    }

    const normalized = String(paidAmount || "").replace(/[^\d]/g, "");

    return Number(normalized) || 0;
  }, [isMidtransPayment, paidAmount, totalPayment]);

  const changeAmount = useMemo(() => {
    if (isMidtransPayment) {
      return 0;
    }

    return Math.max(numericPaidAmount - totalPayment, 0);
  }, [isMidtransPayment, numericPaidAmount, totalPayment]);

  const remainingPayment = useMemo(() => {
    if (isMidtransPayment) {
      return 0;
    }

    return Math.max(totalPayment - numericPaidAmount, 0);
  }, [isMidtransPayment, numericPaidAmount, totalPayment]);

  const canSubmit = useMemo(() => {
    if (!open || loading) {
      return false;
    }

    if (!paymentMethod) {
      return false;
    }

    if (amountToPay <= 0) {
      return false;
    }

    if (paymentMethod === "cash") {
      return numericPaidAmount >= totalPayment;
    }

    return true;
  }, [
    open,
    loading,
    paymentMethod,
    amountToPay,
    numericPaidAmount,
    totalPayment,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, loading, onClose]);

  const handlePaymentMethodChange = (method) => {
    if (loading) {
      return;
    }

    setPaymentMethod(method);

    if (method === "cash") {
      setPaidAmount("");
    } else {
      setPaidAmount("");
    }
  };

  const handlePaidAmountChange = (event) => {
    if (loading) {
      return;
    }

    const rawValue = event.target.value.replace(/[^\d]/g, "");

    setPaidAmount(rawValue);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const payload = {
      payment_method: paymentMethod,
      amount: totalPayment,
    };

    if (paymentMethod === "cash") {
      payload.paid_amount = numericPaidAmount;
    } else {
      payload.paid_amount = totalPayment;
    }

    await onSubmit?.(payload);
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    onClose?.();
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Wallet size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900">
                Service Order Payment
              </h2>

              <p className="mt-0.5 truncate text-sm text-gray-500">
                {serviceOrder?.order_number || "Process payment"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-5 p-5">
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Payment Summary
                </h3>

                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-200">
                  {serviceOrder?.order_number || "Service Order"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-3 ring-1 ring-gray-100">
                  <p className="text-xs font-medium text-gray-500">
                    Grand Total
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(grandTotal)}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-3 ring-1 ring-gray-100">
                  <p className="text-xs font-medium text-gray-500">
                    Previously Paid
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(existingPaidAmount)}
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-3 ring-1 ring-red-100">
                  <p className="text-xs font-medium text-red-600">
                    Remaining Balance
                  </p>

                  <p className="mt-1 text-sm font-bold text-red-700">
                    {formatCurrency(amountToPay)}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Payment Method
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Select how the customer will pay this service order.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const selected = paymentMethod === method.value;

                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => handlePaymentMethodChange(method.value)}
                      disabled={loading}
                      className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-red-500 bg-red-50 ring-1 ring-red-500"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          selected
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {method.label}
                          </p>

                          {selected ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {method.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Payment Details
                </h3>
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">
                    Remaining Balance
                  </span>

                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(amountToPay)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Payment Fee</span>

                    {paymentMethod === "qris" ? (
                      <span className="ml-2 text-xs text-gray-400">0.7%</span>
                    ) : null}

                    {paymentMethod === "ewallet" ? (
                      <span className="ml-2 text-xs text-gray-400">2%</span>
                    ) : null}

                    {paymentMethod === "transfer" ? (
                      <span className="ml-2 text-xs text-gray-400">Fixed</span>
                    ) : null}
                  </div>

                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(paymentFee)}
                  </span>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-gray-900">
                      Amount to Pay
                    </span>

                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(totalPayment)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {paymentMethod === "cash" ? (
              <section className="rounded-xl border border-gray-200 bg-white p-4">
                <label
                  htmlFor="paid_amount"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Cash Amount
                </label>

                <p className="mt-1 text-xs text-gray-500">
                  Enter the amount of cash received from the customer.
                </p>

                <div className="relative mt-3">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-gray-400">
                    Rp
                  </span>

                  <input
                    id="paid_amount"
                    type="text"
                    inputMode="numeric"
                    value={paidAmount ? formatNumber(paidAmount) : ""}
                    onChange={handlePaidAmountChange}
                    disabled={loading}
                    placeholder="0"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-right text-lg font-semibold text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Remaining</p>

                    <p
                      className={`mt-1 text-sm font-semibold ${
                        remainingPayment > 0
                          ? "text-amber-600"
                          : "text-gray-900"
                      }`}
                    >
                      {formatCurrency(remainingPayment)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-xs text-green-600">Change</p>

                    <p className="mt-1 text-sm font-semibold text-green-700">
                      {formatCurrency(changeAmount)}
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    {paymentMethod === "qris" ? (
                      <QrCode size={18} />
                    ) : paymentMethod === "ewallet" ? (
                      <Smartphone size={18} />
                    ) : (
                      <CreditCard size={18} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-blue-900">
                      Midtrans Payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      Payment will continue through Midtrans after you click the
                      payment button.
                    </p>

                    <div className="mt-3 flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                      <span className="text-xs text-blue-700">
                        Total via Midtrans
                      </span>

                      <span className="text-sm font-bold text-blue-900">
                        {formatCurrency(totalPayment)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-xl bg-gray-900 p-4 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400">Total Payment</p>

                  <p className="mt-1 text-xl font-bold">
                    {formatCurrency(totalPayment)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-400">Method</p>

                  <p className="mt-1 text-sm font-semibold capitalize">
                    {paymentMethod}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Processing...
                </>
              ) : isMidtransPayment ? (
                <>
                  <CreditCard size={17} />
                  Pay with Midtrans
                </>
              ) : (
                <>
                  <Check size={17} />
                  Complete Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
