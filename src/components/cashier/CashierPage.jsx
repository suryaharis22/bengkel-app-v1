"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ReceiptText, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import api from "@/lib/axios";

import CashierProductSearch from "./CashierProductSearch";
import CashierProductGrid from "./CashierProductGrid";
import CashierCart from "./CashierCart";
import CashierCheckoutDialog from "./CashierCheckoutDialog";
import CashierPagination from "./CashierPagination";

const DEFAULT_PAGINATION = {
  current_page: 1,
  per_page: 20,
  total_items: 0,
  total_pages: 1,
};

export default function CashierPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  // Fetch products.
  const fetchProducts = useCallback(
    async (signal) => {
      setLoading(true);

      try {
        const response = await api.get("/admin/cashier/products", {
          params: {
            search: search.trim(),
            brands: selectedBrands.join(","),
            categories: selectedCategories.join(","),
            page,
            per_page: perPage,
          },
          signal,
        });

        if (signal.aborted) return;

        setProducts(response.data?.data ?? []);
        setPagination({
          ...DEFAULT_PAGINATION,
          ...(response.data?.meta ?? {}),
        });
      } catch (error) {
        if (
          signal.aborted ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }

        console.error("Fetch cashier products error:", error);

        toast.error(
          error?.response?.data?.message ||
            "Failed to retrieve cashier products.",
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [search, selectedBrands, selectedCategories, page, perPage, refreshKey],
  );

  useEffect(() => {
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      fetchProducts(controller.signal);
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fetchProducts]);

  // Lock background scrolling while the mobile cart is open.
  useEffect(() => {
    if (!cartOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setCartOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cartOpen]);

  // Search and filters.
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleBrandsChange = useCallback((brands) => {
    setSelectedBrands(brands);
    setPage(1);
  }, []);

  const handleCategoriesChange = useCallback((categories) => {
    setSelectedCategories(categories);
    setPage(1);
  }, []);

  const handlePerPageChange = useCallback((value) => {
    setPerPage(Number(value) || 20);
    setPage(1);
  }, []);

  // Add a product to the cart.
  const addToCart = useCallback((product) => {
    const stock = Number(product.stock?.stock ?? 0);
    const price = Number(product.price ?? 0);

    if (stock <= 0) {
      toast.error("Product is out of stock.");
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.variant_id === product.id,
      );

      if (existingItem) {
        if (existingItem.quantity >= existingItem.stock) {
          toast.error("Quantity exceeds available stock.");
          return currentCart;
        }

        return currentCart.map((item) =>
          item.variant_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          variant_id: product.id,
          name: product.name,
          sku: product.sku,
          price,
          stock,
          quantity: 1,
          image_url: product.image_url || null,
          spare_part: product.spare_part || null,
        },
      ];
    });
  }, []);

  // Update cart quantity.
  const updateCartQuantity = useCallback((variantId, quantity) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.variant_id !== variantId) return item;

        const nextQuantity = Math.max(
          1,
          Math.min(Number(quantity) || 1, item.stock),
        );

        return { ...item, quantity: nextQuantity };
      }),
    );
  }, []);

  const removeFromCart = useCallback((variantId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.variant_id !== variantId),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Cart totals.
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0,
      ),
    [cart],
  );

  const totalCartItems = useMemo(
    () => cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0),
    [cart],
  );

  // Checkout.
  const openCheckout = useCallback(() => {
    if (cart.length === 0) {
      toast.error("Cart is empty.");
      return;
    }

    setCartOpen(false);
    setCheckoutOpen(true);
  }, [cart.length]);

  const handleCheckoutSuccess = useCallback(() => {
    setCart([]);
    setCartOpen(false);
    setCheckoutOpen(false);
    setRefreshKey((current) => current + 1);
  }, []);

  const closeCart = useCallback(() => {
    setCartOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setCartOpen((current) => !current);
  }, []);

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 min-w-0 flex-col overflow-hidden bg-gray-50">
      {/* Page header */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 sm:h-10 sm:w-10">
            <ReceiptText size={20} />
          </div>

          <div className="min-w-0">
            <h1 className="text-base font-semibold text-gray-900 sm:text-lg">
              Cashier
            </h1>
            <p className="hidden text-sm text-gray-500 sm:block">
              Process spare part sales
            </p>
          </div>
        </div>

        <Link
          href="/admin/cashier/transaction"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:gap-2 sm:px-4 sm:text-sm"
        >
          <ShoppingCart size={16} />
          <span>Transactions</span>
        </Link>
      </header>

      {/* Main area must have a constrained height. */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Products panel */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-b border-gray-200 bg-gray-50 lg:border-b-0 lg:border-r">
          {/* Search and filters stay visible. */}
          <div className="shrink-0 border-b border-gray-200 bg-white p-3 sm:p-4">
            <CashierProductSearch
              value={search}
              onChange={handleSearchChange}
              selectedBrands={selectedBrands}
              onBrandsChange={handleBrandsChange}
              selectedCategories={selectedCategories}
              onCategoriesChange={handleCategoriesChange}
            />
          </div>

          {/* ONLY this area scrolls vertically. */}
          <div
            className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain p-3 sm:p-4"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <CashierProductGrid
              products={products}
              loading={loading}
              onAdd={addToCart}
            />

            {!loading && products.length === 0 && (
              <p className="mt-4 text-center text-sm text-gray-500">
                No products match your search or filters.
              </p>
            )}
          </div>

          {/* Pagination remains visible at the bottom of this panel. */}
          <div className="z-10 shrink-0 border-t border-gray-200 bg-white">
            <CashierPagination
              currentPage={page}
              totalPages={pagination.total_pages ?? 1}
              totalItems={pagination.total_items ?? 0}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={handlePerPageChange}
              disabled={loading}
            />
          </div>
        </section>

        {/* Desktop cart */}
        <aside className="hidden min-h-0 min-w-0 flex-col overflow-hidden bg-white lg:flex">
          <CashierCart
            cart={cart}
            onUpdateQuantity={updateCartQuantity}
            onRemove={removeFromCart}
            onClear={clearCart}
            onCheckout={openCheckout}
          />
        </aside>
      </main>

      {/* Mobile floating cart button */}
      {!cartOpen && (
        <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center lg:hidden">
          <button
            type="button"
            onClick={toggleCart}
            aria-label={`Open cart, ${totalCartItems} items`}
            aria-expanded={cartOpen}
            className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 active:scale-95"
          >
            <ShoppingCart size={23} strokeWidth={2} />

            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-white px-1 text-xs font-bold text-red-600 shadow-sm">
              {totalCartItems > 99 ? "99+" : totalCartItems}
            </span>
          </button>
        </div>
      )}

      {/* Mobile cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close cart by clicking outside"
            onClick={closeCart}
            className="absolute inset-0 h-full w-full bg-black/45"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="absolute inset-x-0 bottom-0 flex h-[85dvh] min-h-0 flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl"
          >
            {/* Drawer header */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <ShoppingCart size={17} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Shopping Cart
                  </h2>
                  <p className="text-xs text-gray-500">
                    {totalCartItems} item
                    {totalCartItems !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCart}
                aria-label="Close shopping cart"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:bg-gray-300"
              >
                <X size={21} />
              </button>
            </div>

            {/* Cart content */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CashierCart
                cart={cart}
                onUpdateQuantity={updateCartQuantity}
                onRemove={removeFromCart}
                onClear={clearCart}
                onCheckout={openCheckout}
              />
            </div>
          </section>
        </div>
      )}

      {/* Checkout dialog */}
      <CashierCheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        subtotal={subtotal}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}
