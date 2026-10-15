"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Loader2,
  Minus,
  Plus,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

const INITIAL_ADJUSTMENT_FORM = {
  type: "in",
  quantity: "",
  note: "",
};

function normalizeStock(data) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const stock = Number(data.stock ?? 0);
  const reservedStock = Number(data.reserved_stock ?? 0);
  const minimumStock = Number(data.minimum_stock ?? 0);

  return {
    ...data,
    stock,
    reserved_stock: reservedStock,
    available_stock: Number(
      data.available_stock ?? Math.max(0, stock - reservedStock),
    ),
    minimum_stock: minimumStock,
  };
}

function getStatusLabel(status) {
  if (status === "out_of_stock") {
    return "Out of Stock";
  }

  if (status === "low_stock") {
    return "Low Stock";
  }

  return "Normal";
}

function getStatusClass(status) {
  if (status === "out_of_stock") {
    return "bg-red-100 text-red-700";
  }

  if (status === "low_stock") {
    return "bg-yellow-100 text-yellow-700";
  }

  return "bg-green-100 text-green-700";
}

export default function SparePartStockManager({
  open,
  variant = null,
  onClose,
  onChanged,
}) {
  const [stock, setStock] = useState(null);
  const [minimumStock, setMinimumStock] = useState("");

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingMinimumStock, setSavingMinimumStock] = useState(false);
  const [adjustingStock, setAdjustingStock] = useState(false);

  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState(INITIAL_ADJUSTMENT_FORM);
  const [adjustmentError, setAdjustmentError] = useState("");

  const isBusy = loading || refreshing || savingMinimumStock || adjustingStock;

  const fetchStock = useCallback(
    async ({ silent = false } = {}) => {
      if (!variant?.id) {
        setStock(null);
        setMinimumStock("");
        return null;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get(
          `/admin/spare-part-variants/${variant.id}/stock`,
        );

        const latestStock = normalizeStock(response.data?.data);

        setStock(latestStock);
        setMinimumStock(
          latestStock?.minimum_stock !== undefined &&
            latestStock?.minimum_stock !== null
            ? String(latestStock.minimum_stock)
            : "0",
        );

        return latestStock;
      } catch (requestError) {
        const axiosError = getAxiosError(requestError);

        toast.error(axiosError.message || "Failed to load stock.");

        return null;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [variant?.id],
  );

  useEffect(() => {
    if (!open || !variant?.id) {
      return;
    }

    setStock(null);
    setMinimumStock("");
    setAdjustmentOpen(false);
    setAdjustmentForm(INITIAL_ADJUSTMENT_FORM);
    setAdjustmentError("");

    fetchStock();
  }, [open, variant?.id, fetchStock]);

  function handleMinimumStockChange(event) {
    const { value } = event.target;

    if (value === "" || /^\d+$/.test(value)) {
      setMinimumStock(value);
    }
  }

  async function handleSaveMinimumStock() {
    if (!variant?.id || savingMinimumStock) {
      return;
    }

    if (minimumStock === "") {
      toast.error("Minimum stock is required.");
      return;
    }

    const value = Number(minimumStock);

    if (!Number.isInteger(value) || value < 0) {
      toast.error("Minimum stock must be a non-negative integer.");
      return;
    }

    try {
      setSavingMinimumStock(true);

      await api.put(`/admin/spare-part-variants/${variant.id}/stock`, {
        minimum_stock: value,
      });

      const latestStock = await fetchStock({
        silent: true,
      });

      if (latestStock) {
        await onChanged?.(latestStock);
      }

      toast.success("Minimum stock updated successfully.");
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);

      toast.error(axiosError.message || "Failed to update minimum stock.");
    } finally {
      setSavingMinimumStock(false);
    }
  }

  function openAdjustment(type) {
    if (isBusy) {
      return;
    }

    setAdjustmentForm({
      type,
      quantity: "",
      note: "",
    });

    setAdjustmentError("");
    setAdjustmentOpen(true);
  }

  function closeAdjustment() {
    if (adjustingStock) {
      return;
    }

    setAdjustmentOpen(false);
    setAdjustmentForm(INITIAL_ADJUSTMENT_FORM);
    setAdjustmentError("");
  }

  function handleAdjustmentChange(event) {
    const { name, value } = event.target;

    if (name === "quantity" && value !== "" && !/^\d+$/.test(value)) {
      return;
    }

    setAdjustmentForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (adjustmentError) {
      setAdjustmentError("");
    }
  }

  async function handleAdjustStock(event) {
    event.preventDefault();

    if (!variant?.id || adjustingStock) {
      return;
    }

    const quantity = Number(adjustmentForm.quantity);

    if (
      adjustmentForm.quantity === "" ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setAdjustmentError("Quantity must be greater than 0.");
      return;
    }

    try {
      setAdjustingStock(true);
      setAdjustmentError("");

      await api.post(`/admin/spare-part-variants/${variant.id}/stock/adjust`, {
        type: adjustmentForm.type,
        quantity,
        note: adjustmentForm.note.trim(),
      });

      const latestStock = await fetchStock({
        silent: true,
      });

      if (!latestStock) {
        throw new Error("Stock was updated, but failed to refresh stock data.");
      }

      setStock(latestStock);

      setAdjustmentOpen(false);
      setAdjustmentForm(INITIAL_ADJUSTMENT_FORM);
      setAdjustmentError("");

      toast.success(
        adjustmentForm.type === "in"
          ? "Stock added successfully."
          : "Stock removed successfully.",
      );

      await onChanged?.(latestStock);
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);

      setAdjustmentError(axiosError.message || "Failed to adjust stock.");
    } finally {
      setAdjustingStock(false);
    }
  }

  async function handleRefresh() {
    if (isBusy) {
      return;
    }

    const latestStock = await fetchStock({
      silent: true,
    });

    if (latestStock) {
      await onChanged?.(latestStock);
    }
  }

  function handleClose() {
    if (isBusy || adjustmentOpen) {
      return;
    }

    onClose?.();
  }

  if (!open || !variant) {
    return null;
  }

  const currentStock = Number(stock?.stock ?? 0);
  const reservedStock = Number(stock?.reserved_stock ?? 0);
  const availableStock = Number(
    stock?.available_stock ?? Math.max(0, currentStock - reservedStock),
  );
  const currentMinimumStock = Number(stock?.minimum_stock ?? 0);
  const stockStatus = stock?.stock_status || "normal";

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
        <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Boxes size={19} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-gray-900">
                  Manage Stock
                </h2>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {variant.name || variant.variant_name || "-"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={isBusy || adjustmentOpen}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Variant
                </p>

                <p className="mt-1 truncate text-sm font-medium text-gray-900">
                  {variant.name || variant.variant_name || "-"}
                </p>

                <p className="mt-1 font-mono text-xs text-gray-500">
                  {variant.sku || "-"}
                </p>
              </div>

              {loading ? (
                <div className="flex min-h-[280px] items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 size={18} className="animate-spin" />
                    Loading stock...
                  </div>
                </div>
              ) : (
                <>
                  <section className="rounded-xl border border-gray-200 bg-white">
                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Stock Summary
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          Current stock information for this variant.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isBusy}
                        className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 transition hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Loader2
                          size={13}
                          className={refreshing ? "animate-spin" : ""}
                        />
                        Refresh
                      </button>
                    </div>

                    <div className="grid gap-4 p-5 sm:grid-cols-3">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs text-gray-400">Stock</p>

                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {currentStock}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs text-gray-400">Reserved</p>

                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {reservedStock}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs text-gray-400">Available</p>

                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {availableStock}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Stock Status
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                            stockStatus,
                          )}`}
                        >
                          {getStatusLabel(stockStatus)}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-5 py-4">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Minimum Stock
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        Set the minimum stock threshold for this variant.
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <label
                            htmlFor="minimum-stock"
                            className="mb-2 block text-sm font-medium text-gray-700"
                          >
                            Minimum Stock
                          </label>

                          <input
                            id="minimum-stock"
                            type="text"
                            inputMode="numeric"
                            value={minimumStock}
                            onChange={handleMinimumStockChange}
                            disabled={isBusy}
                            placeholder="0"
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveMinimumStock}
                          disabled={isBusy}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingMinimumStock ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              Save
                            </>
                          )}
                        </button>
                      </div>

                      <p className="mt-3 text-xs text-gray-500">
                        Current minimum stock:{" "}
                        <span className="font-medium text-gray-700">
                          {currentMinimumStock}
                        </span>
                      </p>
                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-5 py-4">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Stock Adjustment
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        Adjust the stock quantity manually.
                      </p>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => openAdjustment("in")}
                        disabled={isBusy}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 text-sm font-medium text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ArrowUpFromLine size={17} />
                        Stock In
                      </button>

                      <button
                        type="button"
                        onClick={() => openAdjustment("out")}
                        disabled={isBusy}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ArrowDownToLine size={17} />
                        Stock Out
                      </button>
                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500">
                        <Boxes size={16} />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Stock Rules
                        </h3>

                        <div className="mt-2 space-y-1.5 text-xs leading-5 text-gray-500">
                          <p>• Stock In increases the current stock.</p>

                          <p>• Stock Out decreases the current stock.</p>

                          <p>
                            • Reserved stock is excluded from available stock.
                          </p>

                          <p>
                            • Low Stock depends on the minimum stock threshold.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isBusy || adjustmentOpen}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </div>
      </div>

      {adjustmentOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    adjustmentForm.type === "in"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {adjustmentForm.type === "in" ? (
                    <Plus size={18} />
                  ) : (
                    <Minus size={18} />
                  )}
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {adjustmentForm.type === "in"
                      ? "Add Stock"
                      : "Remove Stock"}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Current stock: {currentStock}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAdjustment}
                disabled={adjustingStock}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleAdjustStock}>
              <div className="space-y-4 p-5">
                <div>
                  <label
                    htmlFor="adjustment-quantity"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Quantity
                  </label>

                  <input
                    id="adjustment-quantity"
                    name="quantity"
                    type="text"
                    inputMode="numeric"
                    value={adjustmentForm.quantity}
                    onChange={handleAdjustmentChange}
                    disabled={adjustingStock}
                    autoFocus
                    placeholder="Enter quantity"
                    className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
                      adjustmentError
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-red-500 focus:ring-red-100"
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="adjustment-note"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Note
                  </label>

                  <textarea
                    id="adjustment-note"
                    name="note"
                    rows={3}
                    value={adjustmentForm.note}
                    onChange={handleAdjustmentChange}
                    disabled={adjustingStock}
                    placeholder="Optional note"
                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>

                {adjustmentError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {adjustmentError}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4">
                <button
                  type="button"
                  onClick={closeAdjustment}
                  disabled={adjustingStock}
                  className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={adjustingStock || adjustmentForm.quantity === ""}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    adjustmentForm.type === "in"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {adjustingStock ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : adjustmentForm.type === "in" ? (
                    <>
                      <ArrowUpFromLine size={16} />
                      Add Stock
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine size={16} />
                      Remove Stock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
