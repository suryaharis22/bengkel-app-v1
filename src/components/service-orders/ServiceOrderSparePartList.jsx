"use client";

import { Edit3, Package, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import ServiceOrderSparePartForm from "./ServiceOrderSparePartForm";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function canModify(order) {
  return order?.status === "confirmed" || order?.status === "in_progress";
}

export default function ServiceOrderSparePartList({ order, onRefresh }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const items = order?.spare_part_items || [];

  const editable = canModify(order);

  function handleAdd() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function handleEdit(item) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setEditingItem(null);
  }

  async function handleDelete(item) {
    if (deletingId) {
      return;
    }

    setDeletingId(item.id);

    try {
      const response = await api.delete(
        `/admin/service-orders/${order.id}/spare-parts/${item.id}`,
      );

      toast.success(
        response.data?.message || "Spare part removed successfully",
      );

      onRefresh?.();
    } catch (error) {
      const axiosError = getAxiosError(error);

      toast.error(axiosError.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Package size={20} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Spare Parts
              </h2>

              <p className="text-sm text-gray-500">
                Spare parts used in this order
              </p>
            </div>
          </div>

          {editable && (
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <Plus size={17} />
              Add Spare Part
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={28} className="mx-auto text-gray-300" />

            <p className="mt-3 text-sm font-medium text-gray-700">
              No spare parts added
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Add a spare part to this order.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-gray-900">
                      {item.name}
                    </h3>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span>SKU: {item.sku || "-"}</span>

                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 lg:justify-end">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Subtotal</p>

                      <p className="mt-1 text-sm font-bold text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>

                    {editable && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2
                            size={16}
                            className={
                              deletingId === item.id ? "animate-pulse" : ""
                            }
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <ServiceOrderSparePartForm
          order={order}
          item={editingItem}
          onClose={handleCloseForm}
          onSuccess={() => {
            handleCloseForm();
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}
