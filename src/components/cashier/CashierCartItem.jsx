"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CashierCartItem({ item, onUpdateQuantity, onRemove }) {
  const subtotal = item.price * item.quantity;

  return (
    <div className="py-4">
      <div className="flex gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-medium text-gray-900">
                {item.name}
              </p>

              <p className="mt-0.5 text-xs text-gray-500">{item.sku}</p>
            </div>

            <button
              type="button"
              onClick={() => onRemove(item.variant_id)}
              className="shrink-0 text-gray-400 transition hover:text-red-600"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() =>
                  onUpdateQuantity(item.variant_id, item.quantity - 1)
                }
                disabled={item.quantity <= 1}
                className="flex h-8 w-8 items-center justify-center text-gray-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={14} />
              </button>

              <span className="w-8 text-center text-sm font-medium text-gray-900">
                {item.quantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  onUpdateQuantity(item.variant_id, item.quantity + 1)
                }
                disabled={item.quantity >= item.stock}
                className="flex h-8 w-8 items-center justify-center text-gray-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(subtotal)}
              </p>

              <p className="text-xs text-gray-500">
                {formatCurrency(item.price)} / item
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
