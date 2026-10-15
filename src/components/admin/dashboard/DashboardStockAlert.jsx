"use client";

import { AlertTriangle, CheckCircle2, Package } from "lucide-react";

export default function DashboardStockAlert({ spareParts = [] }) {
  const lowStockItems = [];

  spareParts.forEach((sparePart) => {
    const variants = Array.isArray(sparePart.variants)
      ? sparePart.variants
      : [];

    variants.forEach((variant) => {
      const stock = Number(variant.stock?.stock || 0);

      const reserved = Number(variant.stock?.reserved_stock || 0);

      const minimum = Number(variant.stock?.minimum_stock || 0);

      const available = stock - reserved;

      if (available <= minimum) {
        lowStockItems.push({
          id: variant.id,
          productName: sparePart.name,
          variantName: variant.name,
          sku: variant.sku,
          available,
          minimum,
        });
      }
    });
  });

  if (lowStockItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-green-200 bg-green-50/50 px-5 py-8 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 size={21} />
        </div>

        <p className="mt-3 text-sm font-semibold text-gray-900">
          Stock is healthy
        </p>

        <p className="mt-1 text-xs text-gray-500">
          No spare part variants are currently below the minimum stock level.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lowStockItems.slice(0, 5).map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Package size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {item.productName}
            </p>

            <p className="truncate text-xs text-gray-500">
              {item.variantName} · {item.sku}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle size={13} />

              <span className="text-sm font-bold">{item.available}</span>
            </div>

            <p className="text-[10px] text-gray-400">Min. {item.minimum}</p>
          </div>
        </div>
      ))}

      {lowStockItems.length > 5 && (
        <p className="pt-1 text-center text-xs text-gray-400">
          +{lowStockItems.length - 5} more low stock variants
        </p>
      )}
    </div>
  );
}
