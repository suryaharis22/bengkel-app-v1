"use client";

import {
  Check,
  ChevronDown,
  Loader2,
  Minus,
  Package,
  Plus,
  Save,
  Search,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toast } from "sonner";

import api from "@/lib/axios";

import { getAxiosError } from "@/lib/axios-error";

const PAGE_SIZE = 10;

const SEARCH_DELAY = 300;

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",

    currency: "IDR",

    minimumFractionDigits: 0,

    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getList(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.data)) return data.data;

  if (Array.isArray(data?.data?.data)) return data.data.data;

  if (Array.isArray(data?.data?.items)) return data.data.items;

  if (Array.isArray(data?.items)) return data.items;

  if (Array.isArray(data?.brands)) return data.brands;

  if (Array.isArray(data?.categories)) return data.categories;

  if (Array.isArray(data?.products)) return data.products;

  if (Array.isArray(data?.spare_parts)) return data.spare_parts;

  return [];
}

function getEntityId(entity) {
  return String(
    entity?.id ??
      entity?.brand_id ??
      entity?.category_id ??
      entity?.spare_part_category_id ??
      entity?.value ??
      "",
  );
}

function getEntityName(entity) {
  return (
    entity?.name ??
    entity?.brand_name ??
    entity?.category_name ??
    entity?.label ??
    "-"
  );
}

function getProductId(product) {
  return String(product?.spare_part_id ?? product?.id ?? "");
}

function getStock(variant) {
  const stock = variant?.stock;

  if (typeof stock === "number") {
    return stock;
  }

  return (
    Number(stock?.stock ?? variant?.stock_quantity ?? 0) -
    Number(stock?.reserved_stock ?? variant?.reserved_stock ?? 0)
  );
}

function getVariantId(variant) {
  return String(variant?.id ?? variant?.variant_id ?? "");
}

function getVariantName(variant) {
  return (
    variant?.name ??
    variant?.variant_name ??
    variant?.sku ??
    `Variant ${getVariantId(variant)}`
  );
}

export default function ServiceOrderSparePartForm({
  order,

  item,

  onClose,

  onSuccess,
}) {
  const [spareParts, setSpareParts] = useState([]);

  const [variants, setVariants] = useState([]);

  const [brands, setBrands] = useState([]);

  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedBrands, setSelectedBrands] = useState([]);

  const [selectedCategories, setSelectedCategories] = useState([]);

  const [sparePartId, setSparePartId] = useState(
    item?.spare_part_id != null ? String(item.spare_part_id) : "",
  );

  const [variantId, setVariantId] = useState(
    item?.variant_id != null ? String(item.variant_id) : "",
  );

  const [quantity, setQuantity] = useState(String(item?.quantity || 1));

  const [selectedPart, setSelectedPart] = useState(null);

  const [selectedVariant, setSelectedVariant] = useState(null);

  const [loading, setLoading] = useState(false);

  const [searchLoading, setSearchLoading] = useState(false);

  const [searchError, setSearchError] = useState(false);

  const [loadingVariants, setLoadingVariants] = useState(false);

  const [loadingBrands, setLoadingBrands] = useState(true);

  const [loadingCategories, setLoadingCategories] = useState(true);

  const [brandError, setBrandError] = useState("");

  const [categoryError, setCategoryError] = useState("");

  const [brandFilterOpen, setBrandFilterOpen] = useState(false);

  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);

  const searchRequestRef = useRef(0);

  const variantRequestRef = useRef(0);

  const variantIdRef = useRef(variantId);

  // Keep the latest selected variant ID without reloading variants.

  variantIdRef.current = variantId;

  const brandParams = selectedBrands.join(",");

  const categoryParams = selectedCategories.join(",");

  const activeFilterCount = selectedBrands.length + selectedCategories.length;

  /**

   * Load brands.

   * Endpoint: /api/admin/brands?page=1&per_page=100

   */

  useEffect(() => {
    let cancelled = false;

    async function loadBrands() {
      setLoadingBrands(true);

      setBrandError("");

      try {
        const response = await api.get("/admin/brands", {
          params: {
            page: 1,

            per_page: 100,
          },
        });

        if (cancelled) return;

        // API response: { success, code, message, data: [...] }
        const brandData = response?.data?.data;
        setBrands(
          Array.isArray(brandData)
            ? brandData.filter((brand) => brand?.status !== false)
            : getList(response),
        );
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load brands:", {
          status: error.response?.status,

          data: error.response?.data,

          message: error.message,
        });

        setBrands([]);

        setBrandError(getAxiosError(error).message);
      } finally {
        if (!cancelled) {
          setLoadingBrands(false);
        }
      }
    }

    loadBrands();

    return () => {
      cancelled = true;
    };
  }, []);

  /**

   * Load spare-part categories.

   * Correct endpoint:

   * /api/admin/spare-part-categories?page=1&per_page=100

   */

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoadingCategories(true);

      setCategoryError("");

      try {
        const response = await api.get("/admin/spare-part-categories", {
          params: {
            page: 1,

            per_page: 100,
          },
        });

        if (cancelled) return;

        // API response: { success, code, message, data: [...] }
        const categoryData = response?.data?.data;
        setCategories(
          Array.isArray(categoryData)
            ? categoryData.filter((category) => category?.status !== false)
            : getList(response),
        );
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load spare-part categories:", {
          status: error.response?.status,

          data: error.response?.data,

          message: error.message,
        });

        setCategories([]);

        setCategoryError(getAxiosError(error).message);
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  /**

   * Server-side product search with multi-brand and

   * multi-category filters.

   */

  const loadSpareParts = useCallback(
    async (keyword = "") => {
      const requestId = ++searchRequestRef.current;

      setSearchLoading(true);

      setSearchError(false);

      try {
        const params = {
          search: keyword.trim() || undefined,

          brands: brandParams || undefined,

          categories: categoryParams || undefined,

          page: 1,

          per_page: PAGE_SIZE,
        };

        // Use the spare-parts endpoint (not the cashier products endpoint).
        // Expected response shape: { success, data: [...], meta: {...} }
        const response = await api.get("/admin/spare-parts", { params });

        if (requestId !== searchRequestRef.current) return;

        // The API may return duplicate IDs; remove them before rendering so
        // every result button has a stable, unique React key.
        const products = getList(response);
        const uniqueProducts = Array.from(
          new Map(
            products
              .filter((product) => getProductId(product) !== "")
              .map((product) => [getProductId(product), product]),
          ).values(),
        );
        setSpareParts(uniqueProducts);
      } catch (error) {
        if (requestId !== searchRequestRef.current) return;

        console.error("Failed to load spare parts:", {
          status: error.response?.status,

          data: error.response?.data,

          message: error.message,
        });

        setSearchError(true);

        toast.error(getAxiosError(error).message);
      } finally {
        if (requestId === searchRequestRef.current) {
          setSearchLoading(false);
        }
      }
    },

    [brandParams, categoryParams],
  );

  // Debounce search.

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadSpareParts(search);
    }, SEARCH_DELAY);

    return () => clearTimeout(timeout);
  }, [search, loadSpareParts]);

  /**

   * Load the existing spare part when editing.

   * This keeps the current selection available even if it

   * does not appear in the current search results.

   */

  useEffect(() => {
    if (!item?.spare_part_id) return;

    let cancelled = false;

    async function loadCurrentPart() {
      try {
        const response = await api.get("/admin/spare-parts", {
          params: {
            search: String(item.spare_part_id),

            page: 1,

            per_page: 100,
          },
        });

        if (cancelled) return;

        const data = getList(response);

        const current = data.find(
          (part) => getProductId(part) === String(item.spare_part_id),
        );

        if (current) {
          setSelectedPart(current);
        }
      } catch (error) {
        console.error("Failed to load existing spare part:", {
          status: error.response?.status,

          data: error.response?.data,

          message: error.message,
        });
      }
    }

    loadCurrentPart();

    return () => {
      cancelled = true;
    };
  }, [item?.spare_part_id]);

  /**

   * Load variants when the selected spare part changes.

   * The effect does not depend on variantId, preventing

   * repeated requests when the user changes the variant.

   */

  useEffect(() => {
    const requestId = ++variantRequestRef.current;

    if (!sparePartId) {
      setVariants([]);

      setSelectedVariant(null);

      setLoadingVariants(false);

      return;
    }

    let cancelled = false;

    async function loadVariants() {
      setLoadingVariants(true);

      setVariants([]);

      setSelectedVariant(null);

      try {
        const response = await api.get(
          `/admin/spare-parts/${sparePartId}/variants`,
        );

        if (cancelled || requestId !== variantRequestRef.current) {
          return;
        }

        const data = getList(response);

        setVariants(data);

        const current = data.find(
          (variant) => getVariantId(variant) === String(variantIdRef.current),
        );

        setSelectedVariant(current || null);
      } catch (error) {
        if (cancelled || requestId !== variantRequestRef.current) {
          return;
        }

        console.error("Failed to load variants:", {
          status: error.response?.status,

          data: error.response?.data,

          message: error.message,
        });

        setVariants([]);

        setSelectedVariant(null);

        toast.error(getAxiosError(error).message);
      } finally {
        if (!cancelled && requestId === variantRequestRef.current) {
          setLoadingVariants(false);
        }
      }
    }

    loadVariants();

    return () => {
      cancelled = true;
    };
  }, [sparePartId]);

  // Sync selected part with current search results.

  useEffect(() => {
    if (!sparePartId) return;

    const found = spareParts.find(
      (part) => getProductId(part) === String(sparePartId),
    );

    if (found) {
      setSelectedPart(found);
    }
  }, [spareParts, sparePartId]);

  // Sync selected variant with the chosen variant ID.

  useEffect(() => {
    if (!variantId) {
      setSelectedVariant(null);

      return;
    }

    const found = variants.find(
      (variant) => getVariantId(variant) === String(variantId),
    );

    if (found) {
      setSelectedVariant(found);
    }
  }, [variants, variantId]);

  const availableStock = useMemo(
    () => getStock(selectedVariant),

    [selectedVariant],
  );

  const total = Number(selectedVariant?.price || 0) * Number(quantity || 0);

  function toggleFilter(setter, current, id) {
    setter(
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function handleSelectPart(part) {
    const id = getProductId(part);

    setSparePartId(id);

    setSelectedPart(part);

    setVariantId("");

    setSelectedVariant(null);

    setVariants([]);
  }

  function handleQuantityChange(value) {
    if (value === "" || /^\d+$/.test(value)) {
      setQuantity(value);
    }
  }

  function clearFilters() {
    setSelectedBrands([]);

    setSelectedCategories([]);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!order?.id) {
      toast.error("Service order was not found.");

      return;
    }

    if (!sparePartId) {
      toast.error("Please select a spare part.");

      return;
    }

    if (!variantId || !selectedVariant) {
      toast.error("Please select a variant.");

      return;
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isSafeInteger(parsedQuantity) || parsedQuantity <= 0) {
      toast.error("Quantity must be greater than zero.");

      return;
    }

    if (!item && parsedQuantity > availableStock) {
      toast.error("Quantity exceeds available stock.");

      return;
    }

    setLoading(true);

    try {
      const payload = {
        spare_part_id: Number(sparePartId),

        variant_id: Number(variantId),

        quantity: parsedQuantity,
      };

      const response = item
        ? await api.put(
            `/admin/service-orders/${order.id}/spare-parts/${item.id}`,

            payload,
          )
        : await api.post(
            `/admin/service-orders/${order.id}/spare-parts`,

            payload,
          );

      toast.success(response.data?.message || "Spare part saved successfully.");

      onSuccess?.();
    } catch (error) {
      console.error("Failed to save spare part:", {
        status: error.response?.status,

        data: error.response?.data,

        message: error.message,
      });

      toast.error(getAxiosError(error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div className="flex max-h-[95dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl">
        {/* Header */}

        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Package size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900">
                {item ? "Edit Spare Part" : "Add Spare Part"}
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Search, filter, and select a spare part
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
            {/* Search */}

            <section>
              <label
                htmlFor="spare_part_search"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Search spare parts
              </label>

              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="spare_part_search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, SKU, or product..."
                  disabled={loading}
                  autoComplete="off"
                  className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-10 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </section>

            {/* Filters */}

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Brand filter */}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setBrandFilterOpen((value) => !value);

                    setCategoryFilterOpen(false);
                  }}
                  className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="truncate">
                    Brand
                    {selectedBrands.length > 0 && ` (${selectedBrands.length})`}
                  </span>

                  <ChevronDown size={16} />
                </button>

                {brandFilterOpen && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                    {loadingBrands ? (
                      <p className="p-2 text-xs text-gray-500">
                        Loading brands...
                      </p>
                    ) : brandError ? (
                      <div className="p-2">
                        <p className="text-xs text-red-600">{brandError}</p>
                      </div>
                    ) : brands.length === 0 ? (
                      <p className="p-2 text-xs text-gray-500">
                        No brand options available.
                      </p>
                    ) : (
                      brands.map((brand) => {
                        const id = getEntityId(brand);

                        const checked = selectedBrands.includes(id);

                        return (
                          <label
                            key={id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleFilter(
                                  setSelectedBrands,

                                  selectedBrands,

                                  id,
                                )
                              }
                              className="h-4 w-4 accent-red-600"
                            />

                            <span className="truncate">
                              {getEntityName(brand)}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Category filter */}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilterOpen((value) => !value);

                    setBrandFilterOpen(false);
                  }}
                  className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="truncate">
                    Category
                    {selectedCategories.length > 0 &&
                      ` (${selectedCategories.length})`}
                  </span>

                  <ChevronDown size={16} />
                </button>

                {categoryFilterOpen && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                    {loadingCategories ? (
                      <p className="p-2 text-xs text-gray-500">
                        Loading categories...
                      </p>
                    ) : categoryError ? (
                      <div className="p-2">
                        <p className="text-xs text-red-600">{categoryError}</p>
                      </div>
                    ) : categories.length === 0 ? (
                      <p className="p-2 text-xs text-gray-500">
                        No category options available.
                      </p>
                    ) : (
                      categories.map((category) => {
                        const id = getEntityId(category);

                        const checked = selectedCategories.includes(id);

                        return (
                          <label
                            key={id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleFilter(
                                  setSelectedCategories,

                                  selectedCategories,

                                  id,
                                )
                              }
                              className="h-4 w-4 accent-red-600"
                            />

                            <span className="truncate">
                              {getEntityName(category)}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </section>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-gray-500">
                  {selectedBrands.length} brand · {selectedCategories.length}{" "}
                  categories selected
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Product search results */}

            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Spare part results
                </h3>

                <span className="text-xs text-gray-400">
                  Up to {PAGE_SIZE} results
                </span>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-gray-200">
                {searchLoading && (
                  <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1">
                    <Loader2 size={16} className="animate-spin text-red-600" />
                  </div>
                )}

                {searchError ? (
                  <div className="px-3 py-6 text-center">
                    <p className="text-sm text-red-600">
                      Failed to load spare parts.
                    </p>

                    <button
                      type="button"
                      onClick={() => loadSpareParts(search)}
                      className="mt-2 text-sm font-medium text-red-600 hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : spareParts.length === 0 && searchLoading ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    Searching products...
                  </div>
                ) : spareParts.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-gray-500">
                    No spare parts found.
                  </p>
                ) : (
                  <div
                    className={`max-h-64 divide-y divide-gray-100 overflow-y-auto transition-opacity ${
                      searchLoading ? "opacity-50" : "opacity-100"
                    }`}
                  >
                    {spareParts.map((part) => {
                      const id = getProductId(part);

                      const selected = id === String(sparePartId);

                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleSelectPart(part)}
                          disabled={loading}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-gray-50 ${
                            selected ? "bg-red-50/70" : "bg-white"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-gray-800">
                              {part.name ??
                                part.product_name ??
                                "Unnamed product"}
                            </span>

                            <span className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500">
                              {(part.brand?.name ?? part.brand_name) && (
                                <span>
                                  {part.brand?.name ?? part.brand_name}
                                </span>
                              )}

                              {(part.category?.name ?? part.category_name) && (
                                <span>
                                  · {part.category?.name ?? part.category_name}
                                </span>
                              )}

                              {part.sku && <span>· SKU: {part.sku}</span>}
                            </span>
                          </span>

                          <span className="flex shrink-0 items-center gap-2">
                            {part.price != null && (
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(part.price)}
                              </span>
                            )}

                            {selected && (
                              <Check size={16} className="text-red-600" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Selected product */}

            {selectedPart && (
              <section className="rounded-xl border border-red-100 bg-red-50/50 p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-red-600 shadow-sm">
                    <Package size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-red-600">
                      Selected spare part
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                      {selectedPart.name ??
                        selectedPart.product_name ??
                        "Selected product"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSparePartId("");

                      setSelectedPart(null);

                      setVariantId("");

                      setSelectedVariant(null);

                      setVariants([]);
                    }}
                    disabled={loading}
                    aria-label="Remove selected spare part"
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              </section>
            )}

            {/* Variant */}

            <section>
              <label
                htmlFor="spare_part_variant"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Variant
              </label>

              <div className="relative">
                <select
                  id="spare_part_variant"
                  value={variantId}
                  onChange={(event) => setVariantId(event.target.value)}
                  disabled={loading || !sparePartId || loadingVariants}
                  className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50"
                >
                  <option value="">
                    {!sparePartId
                      ? "Select a spare part first"
                      : loadingVariants
                        ? "Loading variants..."
                        : variants.length === 0
                          ? "No variants available"
                          : "Select variant"}
                  </option>

                  {variants.map((variant) => {
                    const id = getVariantId(variant);

                    const stock = getStock(variant);

                    return (
                      <option key={id} value={id}>
                        {getVariantName(variant)} —{" "}
                        {formatCurrency(variant.price)} — Stock: {stock}
                      </option>
                    );
                  })}
                </select>

                {loadingVariants && (
                  <Loader2
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
                  />
                )}
              </div>
            </section>

            {/* Variant summary */}

            {selectedVariant && (
              <section className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {getVariantName(selectedVariant)}
                    </p>

                    {selectedVariant.sku && (
                      <p className="mt-1 break-all text-xs text-gray-500">
                        SKU: {selectedVariant.sku}
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      availableStock > 0
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    Stock: {availableStock}
                  </span>
                </div>

                <div className="mt-3 border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500">Unit price</p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {formatCurrency(selectedVariant.price)}
                  </p>
                </div>
              </section>
            )}

            {/* Quantity */}

            <section>
              <label
                htmlFor="spare_part_quantity"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Quantity
              </label>

              <div className="flex h-11 w-full items-center overflow-hidden rounded-xl border border-gray-200 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100">
                <button
                  type="button"
                  disabled={loading || Number(quantity || 0) <= 1}
                  onClick={() =>
                    setQuantity(String(Math.max(1, Number(quantity || 1) - 1)))
                  }
                  aria-label="Decrease quantity"
                  className="flex h-full w-11 shrink-0 items-center justify-center text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
                >
                  <Minus size={15} />
                </button>

                <input
                  id="spare_part_quantity"
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => handleQuantityChange(event.target.value)}
                  onBlur={() => {
                    if (!quantity || Number(quantity) < 1) {
                      setQuantity("1");
                    }
                  }}
                  disabled={loading}
                  className="h-full min-w-0 flex-1 border-x border-gray-100 text-center text-sm font-semibold text-gray-900 outline-none"
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setQuantity(String(Number(quantity || 0) + 1))}
                  aria-label="Increase quantity"
                  className="flex h-full w-11 shrink-0 items-center justify-center text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
                >
                  <Plus size={15} />
                </button>
              </div>
            </section>

            {/* Subtotal */}

            <section className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Estimated subtotal</p>

                  <p className="mt-1 text-xs text-gray-400">
                    {formatCurrency(selectedVariant?.price)} ×{" "}
                    {Number(quantity || 0)}
                  </p>
                </div>

                <p className="break-all text-right text-base font-bold text-gray-900 sm:text-lg">
                  {formatCurrency(total)}
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-white p-4 sm:flex-row sm:justify-end sm:px-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 w-full rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                loadingVariants ||
                !sparePartId ||
                !variantId ||
                !selectedVariant ||
                !quantity ||
                Number(quantity) <= 0 ||
                (!item && Number(quantity) > availableStock)
              }
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}

              {loading ? "Saving..." : item ? "Save Changes" : "Add Spare Part"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
