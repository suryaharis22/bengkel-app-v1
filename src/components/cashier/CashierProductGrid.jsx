"use client";

import CashierProductCard from "./CashierProductCard";
import CashierSkeleton from "./CashierSkeleton";

export default function CashierProductGrid({
  products = [],
  loading = false,
  onAdd,
}) {
  if (loading) {
    return (
      <div className="w-full min-w-0">
        <CashierSkeleton />
      </div>
    );
  }

  if (!products.length) {
    return (
      <div
        className="flex min-h-[280px] w-full min-w-0
        items-center justify-center rounded-2xl
        border border-dashed border-gray-300 bg-white px-4 py-10"
      >
        <div className="max-w-xs text-center">
          <p className="text-base font-semibold text-gray-700">
            No products found
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Try another product name or SKU.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        grid w-full min-w-0
        grid-cols-1
        gap-5
        sm:grid-cols-2
        lg:grid-cols-2
        xl:grid-cols-3
        2xl:grid-cols-3
      "
    >
      {products.map((product) => (
        <div key={product.id} className="min-w-0">
          <CashierProductCard product={product} onAdd={onAdd} />
        </div>
      ))}
    </div>
  );
}
