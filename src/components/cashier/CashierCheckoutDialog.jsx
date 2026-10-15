"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Check,
  ChevronDown,
  CreditCard,
  Loader2,
  QrCode,
  Receipt,
  Search,
  Smartphone,
  User,
  UserRoundPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

const CUSTOMER_API = "/admin/users";

const PAYMENT_METHODS = [
  {
    value: "cash",
    label: "Cash",
    icon: Banknote,
  },
  {
    value: "qris",
    label: "QRIS",
    icon: QrCode,
  },
  {
    value: "transfer",
    label: "Transfer",
    icon: Receipt,
  },
  {
    value: "debit",
    label: "Debit",
    icon: CreditCard,
  },
  {
    value: "ewallet",
    label: "E-Wallet",
    icon: Smartphone,
  },
];

function formatRupiah(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseAmount(value) {
  const normalized = String(value || "").replace(/[^\d]/g, "");

  return Number(normalized) || 0;
}

function getCustomerName(customer) {
  return (
    customer?.name ||
    customer?.nama ||
    customer?.username ||
    customer?.full_name ||
    "-"
  );
}

function getCustomerPhone(customer) {
  return customer?.no_hp || customer?.phone || customer?.phone_number || "-";
}

function getErrorMessage(error, fallbackMessage) {
  const result = getAxiosError(error, fallbackMessage);

  if (typeof result === "string") {
    return result;
  }

  if (result?.message) {
    return result.message;
  }

  return fallbackMessage;
}

function calculatePaymentFee(paymentMethod, grandTotal) {
  const amount = Number(grandTotal) || 0;

  switch (paymentMethod) {
    case "qris":
      return Math.round(amount * 0.007);

    case "ewallet":
      return Math.round(amount * 0.02);

    case "transfer":
      return 4000;

    case "cash":
    case "debit":
    default:
      return 0;
  }
}

function isMidtransPayment(paymentMethod) {
  return paymentMethod !== "cash";
}

function getPaymentMethodDescription(paymentMethod) {
  switch (paymentMethod) {
    case "qris":
      return {
        title: "QRIS Payment",
        description:
          "A 0.7% payment fee is applied. The Midtrans payment window will open automatically after checkout.",
        className: "border-amber-200 bg-amber-50",
        iconClassName: "text-amber-600",
        titleClassName: "text-amber-900",
        descriptionClassName: "text-amber-700",
        icon: QrCode,
      };

    case "ewallet":
      return {
        title: "E-Wallet Payment",
        description:
          "A 2% payment fee is applied. Complete the payment through the Midtrans payment window.",
        className: "border-blue-200 bg-blue-50",
        iconClassName: "text-blue-600",
        titleClassName: "text-blue-900",
        descriptionClassName: "text-blue-700",
        icon: Smartphone,
      };

    case "transfer":
      return {
        title: "Bank Transfer / VA",
        description:
          "A flat payment fee of Rp4.000 is applied. Complete the bank transfer through the Midtrans payment window.",
        className: "border-purple-200 bg-purple-50",
        iconClassName: "text-purple-600",
        titleClassName: "text-purple-900",
        descriptionClassName: "text-purple-700",
        icon: Receipt,
      };

    case "debit":
      return {
        title: "Debit / Card Payment",
        description:
          "The payment will be processed through the Midtrans payment window.",
        className: "border-emerald-200 bg-emerald-50",
        iconClassName: "text-emerald-600",
        titleClassName: "text-emerald-900",
        descriptionClassName: "text-emerald-700",
        icon: CreditCard,
      };

    default:
      return null;
  }
}

export default function CashierCheckoutDialog({
  open,
  onClose,
  cart = [],
  subtotal = 0,
  onSuccess,
}) {
  const [customerId, setCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);

  const [guestCustomer, setGuestCustomer] = useState(false);

  const [discount, setDiscount] = useState("");
  const [tax, setTax] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");

  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  const discountAmount = useMemo(() => {
    return parseAmount(discount);
  }, [discount]);

  const taxAmount = useMemo(() => {
    return parseAmount(tax);
  }, [tax]);

  const grandTotal = useMemo(() => {
    const result = Number(subtotal || 0) - discountAmount + taxAmount;

    return Math.max(result, 0);
  }, [subtotal, discountAmount, taxAmount]);

  const paymentFee = useMemo(() => {
    return calculatePaymentFee(paymentMethod, grandTotal);
  }, [paymentMethod, grandTotal]);

  const amountToPay = useMemo(() => {
    return grandTotal + paymentFee;
  }, [grandTotal, paymentFee]);

  const paidAmountNumber = useMemo(() => {
    return parseAmount(paidAmount);
  }, [paidAmount]);

  const changeAmount = useMemo(() => {
    return Math.max(paidAmountNumber - amountToPay, 0);
  }, [paidAmountNumber, amountToPay]);

  const remainingAmount = useMemo(() => {
    return Math.max(amountToPay - paidAmountNumber, 0);
  }, [amountToPay, paidAmountNumber]);

  const midtransPayment = useMemo(() => {
    return isMidtransPayment(paymentMethod);
  }, [paymentMethod]);

  const paymentMethodDescription = useMemo(() => {
    return getPaymentMethodDescription(paymentMethod);
  }, [paymentMethod]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCustomerId(null);
    setCustomerName("");
    setCustomerPhone("");

    setCustomerSearch("");
    setCustomers([]);
    setCustomerLoading(false);
    setCustomerDropdownOpen(false);

    setGuestCustomer(false);

    setDiscount("");
    setTax("");

    setPaymentMethod("cash");
    setPaidAmount("");

    setNotes("");

    setLoading(false);
  }, [open]);

  useEffect(() => {
    if (!open || guestCustomer) {
      return;
    }

    const keyword = customerSearch.trim();

    const timer = setTimeout(async () => {
      try {
        setCustomerLoading(true);

        const response = await api.get(CUSTOMER_API, {
          params: {
            search: keyword,
            role: "customer",
            page: 1,
            per_page: 10,
          },
        });

        const result = response?.data;
        const data = Array.isArray(result?.data) ? result.data : [];

        setCustomers(data);
      } catch (error) {
        console.error("Fetch cashier customers error:", error);
        setCustomers([]);
      } finally {
        setCustomerLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, customerSearch, guestCustomer]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (midtransPayment) {
      setPaidAmount(String(amountToPay));
      return;
    }

    setPaidAmount("");
  }, [open, midtransPayment, amountToPay]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (loading) {
      return;
    }

    onClose?.();
  };

  const handleSelectCustomer = (customer) => {
    const id = Number(customer?.id);

    if (!id) {
      return;
    }

    setCustomerId(id);
    setCustomerName(getCustomerName(customer));
    setCustomerPhone(getCustomerPhone(customer));

    setCustomerSearch(getCustomerName(customer));
    setCustomerDropdownOpen(false);
  };

  const handleGuestCustomer = () => {
    setGuestCustomer(true);

    setCustomerId(null);
    setCustomerName("");
    setCustomerPhone("");

    setCustomerSearch("");
    setCustomerDropdownOpen(false);
  };

  const handleRegisteredCustomer = () => {
    setGuestCustomer(false);

    setCustomerId(null);
    setCustomerName("");
    setCustomerPhone("");

    setCustomerSearch("");
    setCustomerDropdownOpen(true);
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);

    if (method === "cash") {
      setPaidAmount("");
      return;
    }

    const nextPaymentFee = calculatePaymentFee(method, grandTotal);
    const nextAmountToPay = grandTotal + nextPaymentFee;

    setPaidAmount(String(nextAmountToPay));
  };

  const handlePaidAmountChange = (event) => {
    const value = event.target.value;

    setPaidAmount(value.replace(/[^\d]/g, ""));
  };

  const handleDiscountChange = (event) => {
    const value = event.target.value;

    setDiscount(value.replace(/[^\d]/g, ""));
  };

  const handleTaxChange = (event) => {
    const value = event.target.value;

    setTax(value.replace(/[^\d]/g, ""));
  };

  const validateCheckout = () => {
    if (!cart.length) {
      toast.error("Cart is empty.");
      return false;
    }

    if (grandTotal <= 0) {
      toast.error("Grand total must be greater than zero.");
      return false;
    }

    if (!guestCustomer && customerId === null) {
      toast.error("Please select a customer or choose Walk-in Customer.");
      return false;
    }

    if (paymentMethod === "cash" && paidAmountNumber < amountToPay) {
      toast.error(
        `Payment is still insufficient. Remaining ${formatRupiah(
          remainingAmount,
        )}.`,
      );

      return false;
    }

    return true;
  };

  const openMidtransSnap = ({ snapToken, sale }) => {
    if (!snapToken) {
      toast.error("Midtrans payment token was not received.");
      return;
    }

    if (typeof window === "undefined" || typeof window.snap === "undefined") {
      toast.error(
        "Midtrans payment is not ready. Please refresh the page and try again.",
      );

      return;
    }

    window.snap.pay(snapToken, {
      onSuccess: (result) => {
        console.log("Midtrans payment success:", result);

        toast.success("Payment successful. Transaction is being confirmed.");

        onSuccess?.({
          ...sale,
          midtrans: result,
        });

        onClose?.();
      },

      onPending: (result) => {
        console.log("Midtrans payment pending:", result);

        toast.info("Payment is still pending. Please complete the payment.");
      },

      onError: (result) => {
        console.error("Midtrans payment error:", result);

        toast.error("Midtrans payment failed.");
      },

      onClose: () => {
        console.log("Midtrans payment popup closed.");
      },
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!validateCheckout()) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        customer_id: guestCustomer ? null : customerId,
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        discount: discountAmount,
        tax: taxAmount,
        notes: notes.trim() || null,
        items: cart.map((item) => ({
          variant_id: Number(item.variant_id ?? item.variant?.id ?? item.id),
          quantity: Number(item.quantity) || 0,
        })),
        payment: {
          payment_method: paymentMethod,
          amount: paymentMethod === "cash" ? paidAmountNumber : amountToPay,
        },
      };

      const response = await api.post("/admin/cashier/checkout", payload);

      const result = response?.data;

      if (!result?.success) {
        throw new Error(result?.message || "Failed to complete checkout.");
      }

      const sale = result?.data;

      if (midtransPayment) {
        if (!sale?.snap_token) {
          throw new Error("Midtrans payment token was not received.");
        }

        setLoading(false);

        openMidtransSnap({
          snapToken: sale.snap_token,
          sale,
        });

        return;
      }

      toast.success(result?.message || "Checkout completed successfully.");

      onSuccess?.(sale);
      onClose?.();
    } catch (error) {
      console.error("Cashier checkout error:", error);

      toast.error(getErrorMessage(error, "Failed to complete checkout."));
    } finally {
      setLoading(false);
    }
  };

  const DescriptionIcon = paymentMethodDescription?.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/55 p-3 backdrop-blur-[2px] sm:p-5">
      <div
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <Receipt className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-gray-900">
                Checkout
              </h2>

              <p className="mt-0.5 truncate text-xs text-gray-500 sm:text-sm">
                Complete the transaction and payment.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close checkout"
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6">
            <div className="space-y-5">
              {/* Customer */}
              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <User className="h-4 w-4" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Customer
                      </h3>

                      <p className="text-xs text-gray-500">
                        Select or enter customer information
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-500">
                    Optional
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleRegisteredCustomer}
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${
                      !guestCustomer
                        ? "border-red-500 bg-red-50 text-red-600 shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <User className="h-4 w-4" />
                    Registered Customer
                  </button>

                  <button
                    type="button"
                    onClick={handleGuestCustomer}
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${
                      guestCustomer
                        ? "border-red-500 bg-red-50 text-red-600 shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <UserRoundPlus className="h-4 w-4" />
                    Walk-in Customer
                  </button>
                </div>

                {!guestCustomer ? (
                  <div className="relative">
                    <label
                      htmlFor="customer_search"
                      className="mb-1.5 block text-xs font-semibold text-gray-700 sm:text-sm"
                    >
                      Select Customer
                    </label>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        id="customer_search"
                        type="text"
                        value={customerSearch}
                        onChange={(event) => {
                          setCustomerSearch(event.target.value);
                          setCustomerId(null);
                          setCustomerName("");
                          setCustomerPhone("");
                          setCustomerDropdownOpen(true);
                        }}
                        onFocus={() => setCustomerDropdownOpen(true)}
                        placeholder="Search customer by name or phone..."
                        disabled={loading}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-4 focus:ring-red-50 disabled:bg-gray-100"
                      />

                      <ChevronDown
                        className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition ${
                          customerDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {customerDropdownOpen && (
                      <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                        {customerLoading ? (
                          <div className="flex items-center justify-center gap-2 px-4 py-7 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                            Searching customers...
                          </div>
                        ) : customers.length > 0 ? (
                          <div className="p-1.5">
                            {customers.map((customer) => {
                              const id = Number(customer?.id);
                              const name = getCustomerName(customer);
                              const phone = getCustomerPhone(customer);
                              const selected = customerId === id;

                              return (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => handleSelectCustomer(customer)}
                                  className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition ${
                                    selected ? "bg-red-50" : "hover:bg-gray-50"
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div
                                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                        selected
                                          ? "bg-red-100 text-red-600"
                                          : "bg-gray-100 text-gray-500"
                                      }`}
                                    >
                                      <User className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-gray-900">
                                        {name}
                                      </p>

                                      <p className="mt-0.5 text-xs text-gray-500">
                                        {phone}
                                      </p>
                                    </div>
                                  </div>

                                  {selected && (
                                    <Check className="h-4 w-4 shrink-0 text-red-600" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="px-4 py-8 text-center">
                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>

                            <p className="mt-3 text-sm font-semibold text-gray-700">
                              Customer not found
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Try another name or phone number.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {customerId && (
                      <div className="mt-3 flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3.5 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <User className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-red-500">
                              Selected Customer
                            </p>

                            <p className="truncate text-sm font-semibold text-red-700">
                              {customerName}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setCustomerId(null);
                            setCustomerName("");
                            setCustomerPhone("");
                            setCustomerSearch("");
                          }}
                          disabled={loading}
                          className="ml-3 text-xs font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-50"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-200">
                        <UserRoundPlus className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Walk-in Customer
                        </p>

                        <p className="text-xs text-gray-500">
                          Customer is not registered.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="customer_name"
                          className="mb-1.5 block text-xs font-semibold text-gray-700 sm:text-sm"
                        >
                          Customer Name
                        </label>

                        <input
                          id="customer_name"
                          type="text"
                          value={customerName}
                          onChange={(event) =>
                            setCustomerName(event.target.value)
                          }
                          placeholder="Customer name"
                          disabled={loading}
                          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-4 focus:ring-red-50 disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="customer_phone"
                          className="mb-1.5 block text-xs font-semibold text-gray-700 sm:text-sm"
                        >
                          Phone Number
                        </label>

                        <input
                          id="customer_phone"
                          type="text"
                          inputMode="tel"
                          value={customerPhone}
                          onChange={(event) =>
                            setCustomerPhone(event.target.value)
                          }
                          placeholder="08xxxxxxxxxx"
                          disabled={loading}
                          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-4 focus:ring-red-50 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Order Summary */}
              <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-5">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Order Summary
                    </h3>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Review transaction amount
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                    {cart.length} product
                    {cart.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-3 p-4 sm:p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>

                    <span className="font-medium text-gray-900">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Discount</span>

                    <span className="font-medium text-gray-900">
                      - {formatRupiah(discountAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tax</span>

                    <span className="font-medium text-gray-900">
                      {formatRupiah(taxAmount)}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        Grand Total
                      </span>

                      <span className="text-lg font-bold text-gray-900 sm:text-xl">
                        {formatRupiah(grandTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Payment Fee</span>

                    <span
                      className={`font-medium ${
                        paymentFee > 0 ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {paymentFee > 0
                        ? `+ ${formatRupiah(paymentFee)}`
                        : formatRupiah(0)}
                    </span>
                  </div>

                  <div className="mt-1 rounded-xl bg-red-600 px-4 py-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-red-100">
                          Amount to Pay
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-white">
                          Total transaction
                        </p>
                      </div>

                      <span className="text-xl font-bold text-white sm:text-2xl">
                        {formatRupiah(amountToPay)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Discount & Tax */}
              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Adjustment
                  </h3>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Apply discount or tax if necessary
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="discount"
                      className="mb-1.5 block text-xs font-semibold text-gray-700 sm:text-sm"
                    >
                      Discount
                    </label>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                        Rp
                      </span>

                      <input
                        id="discount"
                        type="text"
                        inputMode="numeric"
                        value={discount}
                        onChange={handleDiscountChange}
                        placeholder="0"
                        disabled={loading}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-4 focus:ring-red-50 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="tax"
                      className="mb-1.5 block text-xs font-semibold text-gray-700 sm:text-sm"
                    >
                      Tax
                    </label>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                        Rp
                      </span>

                      <input
                        id="tax"
                        type="text"
                        inputMode="numeric"
                        value={tax}
                        onChange={handleTaxChange}
                        placeholder="0"
                        disabled={loading}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-4 focus:ring-red-50 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Payment Method
                  </h3>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Cash is processed directly. Other methods use Midtrans.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const active = paymentMethod === method.value;

                    const methodFee = calculatePaymentFee(
                      method.value,
                      grandTotal,
                    );

                    const usesMidtrans = isMidtransPayment(method.value);

                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => handlePaymentMethodChange(method.value)}
                        disabled={loading}
                        className={`group relative flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 transition ${
                          active
                            ? "border-red-500 bg-red-50 text-red-600 shadow-sm ring-1 ring-red-500"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {active && (
                          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}

                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            active
                              ? "bg-white text-red-600 shadow-sm"
                              : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                          }`}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </div>

                        <span className="text-xs font-semibold">
                          {method.label}
                        </span>

                        {methodFee > 0 && (
                          <span className="text-[10px] font-medium text-gray-500">
                            +{formatRupiah(methodFee)}
                          </span>
                        )}

                        {usesMidtrans && (
                          <span className="text-[9px] font-medium text-gray-400">
                            Midtrans
                          </span>
                        )}

                        {!usesMidtrans && (
                          <span className="text-[9px] font-medium text-gray-400">
                            Direct
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {paymentMethodDescription && DescriptionIcon && (
                  <div
                    className={`mt-4 rounded-xl border p-3.5 ${paymentMethodDescription.className}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70">
                        <DescriptionIcon
                          className={`h-4.5 w-4.5 ${paymentMethodDescription.iconClassName}`}
                        />
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${paymentMethodDescription.titleClassName}`}
                        >
                          {paymentMethodDescription.title}
                        </p>

                        <p
                          className={`mt-1 text-xs leading-5 ${paymentMethodDescription.descriptionClassName}`}
                        >
                          {paymentMethodDescription.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Payment */}
              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Payment
                  </h3>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {paymentMethod === "cash"
                      ? "Enter the amount received from the customer."
                      : "Review the amount that will be processed."}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="paid_amount"
                    className="mb-1.5 block text-xs font-semibold text-gray-700 sm:text-sm"
                  >
                    {paymentMethod === "cash" ? "Paid Amount" : "Amount to Pay"}
                  </label>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                      Rp
                    </span>

                    <input
                      id="paid_amount"
                      type="text"
                      inputMode="numeric"
                      value={paidAmount}
                      onChange={handlePaidAmountChange}
                      placeholder="0"
                      disabled={loading || paymentMethod !== "cash"}
                      className={`h-12 w-full rounded-xl border pl-10 pr-3 text-lg font-bold outline-none transition placeholder:text-gray-300 focus:ring-4 disabled:bg-gray-100 ${
                        paymentMethod === "cash"
                          ? "border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-50"
                          : "border-gray-200 bg-gray-50 text-gray-500"
                      }`}
                    />
                  </div>

                  {paymentMethod !== "cash" && (
                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      This payment will be processed through Midtrans. The
                      amount includes the payment fee.
                    </p>
                  )}
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Grand Total</span>

                      <span className="font-semibold text-gray-900">
                        {formatRupiah(grandTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Payment Fee</span>

                      <span className="font-medium text-gray-900">
                        {paymentFee > 0
                          ? `+ ${formatRupiah(paymentFee)}`
                          : formatRupiah(0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                      <span className="font-semibold text-gray-900">
                        Amount to Pay
                      </span>

                      <span className="text-lg font-bold text-red-600">
                        {formatRupiah(amountToPay)}
                      </span>
                    </div>
                  </div>

                  {paymentMethod === "cash" &&
                    paidAmountNumber >= amountToPay && (
                      <div className="flex items-center justify-between border-t border-green-200 bg-green-50 px-4 py-3.5">
                        <div>
                          <p className="text-xs font-medium text-green-700">
                            Change
                          </p>

                          <p className="mt-0.5 text-[10px] text-green-600">
                            Return to customer
                          </p>
                        </div>

                        <span className="text-lg font-bold text-green-600">
                          {formatRupiah(changeAmount)}
                        </span>
                      </div>
                    )}

                  {paymentMethod === "cash" &&
                    paidAmountNumber < amountToPay && (
                      <div className="flex items-center justify-between border-t border-red-200 bg-red-50 px-4 py-3.5">
                        <div>
                          <p className="text-xs font-medium text-red-700">
                            Remaining
                          </p>

                          <p className="mt-0.5 text-[10px] text-red-600">
                            Additional payment required
                          </p>
                        </div>

                        <span className="text-lg font-bold text-red-600">
                          {formatRupiah(remainingAmount)}
                        </span>
                      </div>
                    )}

                  {paymentMethod !== "cash" && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3.5">
                      <span className="text-xs font-medium text-gray-500">
                        Payment Gateway
                      </span>

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        Midtrans
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Notes */}
              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3">
                  <label
                    htmlFor="notes"
                    className="block text-sm font-semibold text-gray-900"
                  >
                    Notes
                  </label>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Add optional notes for this transaction.
                  </p>
                </div>

                <textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Transaction notes..."
                  rows={3}
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-4 focus:ring-red-50 disabled:bg-gray-100"
                />
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center justify-between sm:block">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 sm:text-xs">
                  Total Payment
                </p>

                <p className="text-lg font-bold text-gray-900 sm:text-xl">
                  {formatRupiah(amountToPay)}
                </p>
              </div>

              <p className="text-xs text-gray-500 sm:hidden">
                {cart.length} product
                {cart.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !cart.length}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 sm:flex-none sm:px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : paymentMethod === "cash" ? (
                  <>
                    <Banknote className="h-4 w-4" />
                    Complete Checkout
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay with Midtrans
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close checkout dialog"
        onClick={handleClose}
        disabled={loading}
        className="absolute inset-0 -z-10 cursor-default"
      />
    </div>
  );
}
