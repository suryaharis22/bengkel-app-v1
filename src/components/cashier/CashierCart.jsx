"use client";

import { ShoppingCart, Trash2, Minus, Plus } from "lucide-react";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function CashierCart({
  cart = [],
  onUpdateQuantity,
  onRemove,
  onClear,
  onCheckout,
}) {
  const subtotal = cart.reduce(
    (total, item) =>
      total + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );

  const totalItems = cart.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0,
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      {/* HEADER: tetap di atas */}
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <ShoppingCart size={19} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">Keranjang</h2>
            <p className="text-xs text-gray-500">{totalItems} item</p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
            Kosongkan
          </button>
        )}
      </header>

      {/* DAFTAR PRODUK: satu-satunya area scroll */}
      <main
        className="min-h-0 flex-1 overflow-y-scroll overflow-x-hidden overscroll-y-contain"
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
        }}
      >
        {cart.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center px-5 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <ShoppingCart size={25} />
            </div>
            <p className="mt-4 text-sm font-semibold text-gray-800">
              Keranjang masih kosong
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Pilih produk untuk menambahkannya ke keranjang.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 px-3 sm:px-4">
            {cart.map((item) => {
              const quantity = Number(item.quantity) || 0;
              const price = Number(item.price) || 0;
              const stock = Number(item.stock) || 0;

              return (
                <article key={item.variant_id} className="py-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name || "Produk"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-gray-400">
                          Tanpa gambar
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium leading-5 text-gray-900 [overflow-wrap:anywhere]">
                            {item.name}
                          </p>

                          {item.sku && (
                            <p className="mt-0.5 break-all text-xs text-gray-500">
                              SKU: {item.sku}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemove?.(item.variant_id)}
                          aria-label={`Hapus ${item.name}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="mt-3 flex min-w-0 flex-wrap items-end justify-between gap-3">
                        <div className="flex h-9 shrink-0 items-center rounded-lg border border-gray-200">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity?.(item.variant_id, quantity - 1)
                            }
                            disabled={quantity <= 1}
                            aria-label="Kurangi jumlah"
                            className="flex h-9 w-8 items-center justify-center rounded-l-lg text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="min-w-8 px-1 text-center text-sm font-semibold tabular-nums">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity?.(item.variant_id, quantity + 1)
                            }
                            disabled={quantity >= stock}
                            aria-label="Tambah jumlah"
                            className="flex h-9 w-8 items-center justify-center rounded-r-lg text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="min-w-0 flex-1 text-right">
                          <p className="break-words text-sm font-bold text-gray-900">
                            {formatCurrency(price * quantity)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-500">
                            {formatCurrency(price)} / item
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* FOOTER: tetap di bawah, tidak ikut scroll */}
      <footer className="relative z-10 shrink-0 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-800">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Diskon</span>
            <span className="font-medium text-gray-800">
              {formatCurrency(0)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Pajak</span>
            <span className="font-medium text-gray-800">
              {formatCurrency(0)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-dashed border-gray-200 pt-3">
            <span className="text-sm font-semibold text-gray-900">
              Total pembayaran
            </span>
            <span className="text-right text-lg font-bold text-red-600">
              {formatCurrency(subtotal)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (cart.length > 0) onCheckout?.();
          }}
          disabled={cart.length === 0}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          <ShoppingCart size={17} />
          Checkout
          {totalItems > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {totalItems}
            </span>
          )}
        </button>
      </footer>
    </div>
  );
}
