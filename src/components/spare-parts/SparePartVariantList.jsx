"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "-";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatWeight(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `${Number(value).toLocaleString("id-ID")} g`;
}

function getStockValue(variant) {
  if (variant?.stock === null || variant?.stock === undefined) {
    return null;
  }

  if (typeof variant.stock === "object") {
    return variant.stock.stock ?? null;
  }

  return variant.stock;
}

function getReservedStockValue(variant) {
  if (variant?.stock === null || variant?.stock === undefined) {
    return null;
  }

  if (typeof variant.stock === "object") {
    return variant.stock.reserved_stock ?? 0;
  }

  return 0;
}

function getAvailableStockValue(variant) {
  if (variant?.stock === null || variant?.stock === undefined) {
    return null;
  }

  if (typeof variant.stock === "object") {
    if (variant.stock.available_stock !== undefined) {
      return variant.stock.available_stock;
    }

    const stock = Number(variant.stock.stock ?? 0);

    const reservedStock = Number(variant.stock.reserved_stock ?? 0);

    return Math.max(0, stock - reservedStock);
  }

  return Number(variant.stock);
}

function getStockStatus(variant) {
  if (typeof variant?.stock === "object" && variant.stock?.stock_status) {
    return variant.stock.stock_status;
  }

  const availableStock = getAvailableStockValue(variant);

  if (availableStock === null) {
    return null;
  }

  const minimumStock = Number(variant?.stock?.minimum_stock ?? 0);

  if (availableStock <= 0) {
    return "out_of_stock";
  }

  if (availableStock <= minimumStock) {
    return "low_stock";
  }

  return "normal";
}

function getStockStatusLabel(status) {
  if (status === "out_of_stock") {
    return "Out of Stock";
  }

  if (status === "low_stock") {
    return "Low Stock";
  }

  if (status === "normal") {
    return "Normal";
  }

  return "-";
}

function getStockStatusClass(status) {
  if (status === "out_of_stock") {
    return "bg-red-100 text-red-700";
  }

  if (status === "low_stock") {
    return "bg-yellow-100 text-yellow-700";
  }

  if (status === "normal") {
    return "bg-green-100 text-green-700";
  }

  return "bg-gray-100 text-gray-500";
}

function getVariantStatusClass(status) {
  if (status === true) {
    return "bg-green-100 text-green-700";
  }

  return "bg-gray-100 text-gray-600";
}

export default function SparePartVariantList({
  sparePartId,
  variants = [],
  loading = false,
  disabled = false,
  onAdd,
  onEdit,
  onStock,
  onChanged,
}) {
  const [deletingVariant, setDeletingVariant] = useState(null);

  const [deleting, setDeleting] = useState(false);

  async function handleDeleteVariant() {
    if (!deletingVariant?.id) {
      return;
    }

    try {
      setDeleting(true);

      await api.delete(`/admin/spare-part-variants/${deletingVariant.id}`);

      toast.success("Variant deleted successfully.");

      setDeletingVariant(null);

      await onChanged?.();
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);

      toast.error(axiosError.message || "Failed to delete variant.");
    } finally {
      setDeleting(false);
    }
  }

  function handleOpenDeleteModal(variant) {
    if (disabled || deleting) {
      return;
    }

    setDeletingVariant(variant);
  }

  function handleCloseDeleteModal() {
    if (deleting) {
      return;
    }

    setDeletingVariant(null);
  }

  function handleOpenStock(variant) {
    if (disabled || deleting || !variant?.id) {
      return;
    }

    onStock?.(variant);
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <Boxes size={18} />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">Variants</h3>

              <p className="mt-1 text-xs text-gray-500">
                {variants.length}{" "}
                {variants.length === 1 ? "variant" : "variants"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAdd}
            disabled={disabled || loading || !sparePartId}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Add Variant
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-60 items-center justify-center px-6 py-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 size={24} className="animate-spin text-red-600" />

              <p className="text-sm text-gray-500">Loading variants...</p>
            </div>
          </div>
        ) : variants.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Boxes size={22} />
            </div>

            <h4 className="mt-4 text-sm font-semibold text-gray-900">
              No variants found
            </h4>

            <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
              This spare part does not have any variants yet. Add a variant to
              manage different options, pricing, and SKU.
            </p>

            <button
              type="button"
              onClick={onAdd}
              disabled={disabled || !sparePartId}
              className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Add Variant
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Variant
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    SKU
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Price
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Compare Price
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Weight
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Stock
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {variants.map((variant) => {
                  const stock = getStockValue(variant);

                  const reservedStock = getReservedStockValue(variant);

                  const availableStock = getAvailableStockValue(variant);

                  const stockStatus = getStockStatus(variant);

                  return (
                    <tr
                      key={variant.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <div className="min-w-[180px]">
                          <p className="text-sm font-medium text-gray-900">
                            {variant.name || "-"}
                          </p>

                          {variant.cost_price !== null &&
                            variant.cost_price !== undefined && (
                              <p className="mt-1 text-xs text-gray-400">
                                Cost: {formatCurrency(variant.cost_price)}
                              </p>
                            )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-mono text-xs text-gray-700">
                          {variant.sku || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(variant.price)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span className="text-sm text-gray-500">
                          {formatCurrency(variant.compare_price)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span className="text-sm text-gray-600">
                          {formatWeight(variant.weight)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        {availableStock === null ? (
                          <span className="text-xs text-gray-400">
                            Not initialized
                          </span>
                        ) : (
                          <div className="flex min-w-[110px] flex-col items-center">
                            <span className="text-sm font-semibold text-gray-900">
                              {Number(availableStock).toLocaleString("id-ID")}
                            </span>

                            <span
                              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${getStockStatusClass(
                                stockStatus,
                              )}`}
                            >
                              {getStockStatusLabel(stockStatus)}
                            </span>

                            <span className="mt-1 text-[10px] text-gray-400">
                              Stock:{" "}
                              {Number(stock ?? 0).toLocaleString("id-ID")}
                              {" · "}
                              Reserved:{" "}
                              {Number(reservedStock).toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getVariantStatusClass(
                            variant.status,
                          )}`}
                        >
                          {variant.status === true ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenStock(variant)}
                            disabled={disabled || deleting}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-green-200 hover:bg-green-50 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Manage stock for ${
                              variant.name || "variant"
                            }`}
                            title="Stock"
                          >
                            <Boxes size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEdit?.(variant)}
                            disabled={disabled || deleting}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Edit ${variant.name || "variant"}`}
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(variant)}
                            disabled={disabled || deleting}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Delete ${variant.name || "variant"}`}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deletingVariant && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle size={22} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">
                    Delete Variant
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Are you sure you want to delete this variant? This action
                    cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-900">
                  {deletingVariant.name || "-"}
                </p>

                <p className="mt-1 font-mono text-xs text-gray-500">
                  SKU: {deletingVariant.sku || "-"}
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  Price: {formatCurrency(deletingVariant.price)}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteVariant}
                disabled={deleting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Variant
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
