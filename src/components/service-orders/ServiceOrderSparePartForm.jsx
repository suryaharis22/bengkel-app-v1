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
  Boxes,
  SlidersHorizontal,
  Tag,
  Layers3,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

const PAGE_SIZE = 10;
const SEARCH_DELAY = 300;

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-gray-50";

const sectionTitleClass = "text-sm font-semibold text-gray-900";

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

function FilterDropdown({
  label,
  icon: Icon,
  options,
  selected,
  onToggle,
  open,
  onOpen,
  loading,
  error,
  emptyMessage,
  disabled,
}) {
  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        aria-expanded={open}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 transition ${
          open
            ? "border-red-300 bg-red-50/50 ring-4 ring-red-500/5"
            : "border-gray-200 bg-white hover:bg-gray-50"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon size={16} className="shrink-0 text-gray-400" />
          <span className="truncate text-sm font-medium text-gray-700">
            {label}
          </span>

          {selected.length > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-red-100 px-1.5 text-[11px] font-bold text-red-700">
              {selected.length}
            </span>
          )}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10">
          <div className="max-h-60 overflow-y-auto p-1.5">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-5 text-xs text-gray-500">
                <Loader2 size={15} className="animate-spin" />
                Loading {label.toLowerCase()}...
              </div>
            ) : error ? (
              <div className="flex gap-2 p-3 text-xs leading-5 text-red-600">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : options.length === 0 ? (
              <p className="px-3 py-5 text-center text-xs text-gray-400">
                {emptyMessage}
              </p>
            ) : (
              options.map((option) => {
                const id = getEntityId(option);
                const checked = selected.includes(id);

                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                      checked ? "bg-red-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(id)}
                      className="h-4 w-4 shrink-0 accent-red-600"
                    />

                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
                      {getEntityName(option)}
                    </span>

                    {checked && (
                      <Check size={15} className="shrink-0 text-red-600" />
                    )}
                  </label>
                );
              })
            )}
          </div>

          {selected.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/80 px-3 py-2">
              <p className="text-[11px] text-gray-500">
                {selected.length} selected
              </p>
            </div>
          )}
        </div>
      )}
    </div>
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

  variantIdRef.current = variantId;

  const brandParams = selectedBrands.join(",");
  const categoryParams = selectedCategories.join(",");
  const activeFilterCount = selectedBrands.length + selectedCategories.length;

  useEffect(() => {
    let cancelled = false;

    async function loadBrands() {
      setLoadingBrands(true);
      setBrandError("");

      try {
        const response = await api.get("/admin/brands", {
          params: { page: 1, per_page: 100 },
        });

        if (cancelled) return;

        const data = response?.data?.data;

        setBrands(
          Array.isArray(data)
            ? data.filter((brand) => brand?.status !== false)
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
        if (!cancelled) setLoadingBrands(false);
      }
    }

    loadBrands();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoadingCategories(true);
      setCategoryError("");

      try {
        const response = await api.get("/admin/spare-part-categories", {
          params: { page: 1, per_page: 100 },
        });

        if (cancelled) return;

        const data = response?.data?.data;

        setCategories(
          Array.isArray(data)
            ? data.filter((category) => category?.status !== false)
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
        if (!cancelled) setLoadingCategories(false);
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadSpareParts = useCallback(
    async (keyword = "") => {
      const requestId = ++searchRequestRef.current;

      setSearchLoading(true);
      setSearchError(false);

      try {
        const response = await api.get("/admin/spare-parts", {
          params: {
            search: keyword.trim() || undefined,
            brands: brandParams || undefined,
            categories: categoryParams || undefined,
            page: 1,
            per_page: PAGE_SIZE,
          },
        });

        if (requestId !== searchRequestRef.current) return;

        const uniqueProducts = Array.from(
          new Map(
            getList(response)
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

  useEffect(() => {
    const timeout = setTimeout(() => loadSpareParts(search), SEARCH_DELAY);
    return () => clearTimeout(timeout);
  }, [search, loadSpareParts]);

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

        const current = getList(response).find(
          (part) => getProductId(part) === String(item.spare_part_id),
        );

        if (current) setSelectedPart(current);
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

  useEffect(() => {
    if (!sparePartId) return;

    const found = spareParts.find(
      (part) => getProductId(part) === String(sparePartId),
    );

    if (found) setSelectedPart(found);
  }, [spareParts, sparePartId]);

  useEffect(() => {
    if (!variantId) {
      setSelectedVariant(null);
      return;
    }

    const found = variants.find(
      (variant) => getVariantId(variant) === String(variantId),
    );

    if (found) setSelectedVariant(found);
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
    setSparePartId(getProductId(part));
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-gray-200/80 bg-white shadow-2xl shadow-black/20 sm:max-h-[90dvh] sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <Package size={21} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-bold tracking-tight text-gray-900">
                {item ? "Edit Spare Part" : "Add Spare Part"}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Manage spare parts for this service order
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 sm:p-6">
            {/* Search */}
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="spare_part_search"
                  className={sectionTitleClass}
                >
                  Find spare parts
                </label>

                <span className="text-[11px] text-gray-400">
                  Search by name or SKU
                </span>
              </div>

              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="spare_part_search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Type a spare part name..."
                  disabled={loading}
                  autoComplete="off"
                  className={`${inputClass} pl-10 pr-10`}
                />

                {searchLoading && (
                  <Loader2
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-red-500"
                  />
                )}

                {!searchLoading && search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </section>

            {/* Filters */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-gray-400" />
                  <h3 className={sectionTitleClass}>Filters</h3>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-red-600 transition hover:text-red-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FilterDropdown
                  label="Brand"
                  icon={Tag}
                  options={brands}
                  selected={selectedBrands}
                  onToggle={(id) =>
                    toggleFilter(setSelectedBrands, selectedBrands, id)
                  }
                  open={brandFilterOpen}
                  onOpen={() => {
                    setBrandFilterOpen((value) => !value);
                    setCategoryFilterOpen(false);
                  }}
                  loading={loadingBrands}
                  error={brandError}
                  emptyMessage="No brands available."
                  disabled={loading}
                />

                <FilterDropdown
                  label="Category"
                  icon={Layers3}
                  options={categories}
                  selected={selectedCategories}
                  onToggle={(id) =>
                    toggleFilter(setSelectedCategories, selectedCategories, id)
                  }
                  open={categoryFilterOpen}
                  onOpen={() => {
                    setCategoryFilterOpen((value) => !value);
                    setBrandFilterOpen(false);
                  }}
                  loading={loadingCategories}
                  error={categoryError}
                  emptyMessage="No categories available."
                  disabled={loading}
                />
              </div>

              {activeFilterCount > 0 && (
                <p className="text-xs text-gray-500">
                  {selectedBrands.length} brand and {selectedCategories.length}{" "}
                  category filters applied.
                </p>
              )}
            </section>

            {/* Results */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className={sectionTitleClass}>Available spare parts</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Select a product to continue
                  </p>
                </div>

                <span className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                  {spareParts.length} results
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {searchError ? (
                  <div className="flex flex-col items-center px-4 py-8 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
                      <AlertCircle size={19} />
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      Unable to load spare parts
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Please check your connection and try again.
                    </p>
                    <button
                      type="button"
                      onClick={() => loadSpareParts(search)}
                      className="mt-3 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Try again
                    </button>
                  </div>
                ) : spareParts.length === 0 && searchLoading ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-10">
                    <Loader2 size={22} className="animate-spin text-red-500" />
                    <p className="text-sm text-gray-500">
                      Searching spare parts...
                    </p>
                  </div>
                ) : spareParts.length === 0 ? (
                  <div className="flex flex-col items-center px-4 py-10 text-center">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      <Search size={19} />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      No spare parts found
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Try another keyword or change the filters.
                    </p>
                  </div>
                ) : (
                  <div
                    className={`max-h-64 divide-y divide-gray-100 overflow-y-auto transition-opacity ${
                      searchLoading ? "opacity-50" : ""
                    }`}
                  >
                    {spareParts.map((part) => {
                      const id = getProductId(part);
                      const selected = id === String(sparePartId);
                      const name =
                        part.name ?? part.product_name ?? "Unnamed product";
                      const brandName = part.brand?.name ?? part.brand_name;
                      const categoryName =
                        part.category?.name ?? part.category_name;

                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleSelectPart(part)}
                          disabled={loading}
                          aria-pressed={selected}
                          className={`flex w-full items-center gap-3 px-3.5 py-3.5 text-left transition sm:px-4 ${
                            selected
                              ? "bg-red-50/70"
                              : "bg-white hover:bg-gray-50/80"
                          } disabled:cursor-not-allowed`}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                              selected
                                ? "border-red-200 bg-white text-red-600"
                                : "border-gray-100 bg-gray-50 text-gray-400"
                            }`}
                          >
                            <Package size={18} strokeWidth={1.8} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {name}
                            </p>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                              {brandName && (
                                <span className="max-w-full truncate">
                                  {brandName}
                                </span>
                              )}

                              {brandName && categoryName && (
                                <span className="text-gray-300">·</span>
                              )}

                              {categoryName && (
                                <span className="max-w-full truncate">
                                  {categoryName}
                                </span>
                              )}
                            </div>

                            {part.sku && (
                              <p className="mt-1 text-[11px] text-gray-400">
                                SKU: {part.sku}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            {part.price != null && (
                              <span className="text-xs font-bold text-gray-900 sm:text-sm">
                                {formatCurrency(part.price)}
                              </span>
                            )}

                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                selected
                                  ? "border-red-600 bg-red-600 text-white"
                                  : "border-gray-200 text-transparent"
                              }`}
                            >
                              <Check size={12} strokeWidth={3} />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Selected product */}
            {selectedPart && (
              <section className="rounded-xl border border-red-100 bg-red-50/60 p-3.5 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm ring-1 ring-red-100">
                    <Check size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-red-600">
                      Selected product
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-gray-900">
                      {selectedPart.name ??
                        selectedPart.product_name ??
                        "Selected product"}
                    </p>
                    {selectedPart.sku && (
                      <p className="mt-1 text-xs text-gray-500">
                        SKU: {selectedPart.sku}
                      </p>
                    )}
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
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              </section>
            )}

            {/* Variant */}
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="spare_part_variant"
                  className={sectionTitleClass}
                >
                  Product variant
                </label>

                {loadingVariants && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Loader2 size={13} className="animate-spin" />
                    Loading
                  </span>
                )}
              </div>

              <div className="relative">
                <select
                  id="spare_part_variant"
                  value={variantId}
                  onChange={(event) => setVariantId(event.target.value)}
                  disabled={loading || !sparePartId || loadingVariants}
                  className={`${inputClass} appearance-none px-3.5 pr-10`}
                >
                  <option value="">
                    {!sparePartId
                      ? "Select a spare part first"
                      : loadingVariants
                        ? "Loading variants..."
                        : variants.length === 0
                          ? "No variants available"
                          : "Choose a variant"}
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

                {!loadingVariants && (
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                )}
              </div>

              {!sparePartId && (
                <p className="text-xs text-gray-400">
                  Choose a spare part above to see its available variants.
                </p>
              )}
            </section>

            {/* Variant summary */}
            {selectedVariant && (
              <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50/70 p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 ring-1 ring-gray-200">
                      <Boxes size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                        Variant details
                      </p>
                      <p className="mt-1 break-words text-sm font-bold text-gray-900">
                        {getVariantName(selectedVariant)}
                      </p>
                      {selectedVariant.sku && (
                        <p className="mt-1 break-all text-xs text-gray-500">
                          SKU: {selectedVariant.sku}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      availableStock > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {availableStock} in stock
                  </span>
                </div>

                <div className="grid grid-cols-2 divide-x divide-gray-100 p-4">
                  <div className="pr-3">
                    <p className="text-xs text-gray-500">Unit price</p>
                    <p className="mt-1.5 break-words text-sm font-bold text-gray-900">
                      {formatCurrency(selectedVariant.price)}
                    </p>
                  </div>

                  <div className="pl-4">
                    <p className="text-xs text-gray-500">Available stock</p>
                    <p
                      className={`mt-1.5 text-sm font-bold ${
                        availableStock > 0 ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {availableStock} units
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Quantity */}
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="spare_part_quantity"
                  className={sectionTitleClass}
                >
                  Quantity
                </label>

                {selectedVariant && (
                  <span className="text-xs text-gray-400">
                    Maximum stock: {availableStock}
                  </span>
                )}
              </div>

              <div className="flex h-11 w-full items-center overflow-hidden rounded-xl border border-gray-200 bg-white transition focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10">
                <button
                  type="button"
                  disabled={loading || Number(quantity || 0) <= 1}
                  onClick={() =>
                    setQuantity(String(Math.max(1, Number(quantity || 1) - 1)))
                  }
                  aria-label="Decrease quantity"
                  className="flex h-full w-12 shrink-0 items-center justify-center text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus size={16} />
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
                  className="h-full min-w-0 flex-1 border-x border-gray-100 bg-transparent text-center text-sm font-bold text-gray-900 outline-none"
                />

                <button
                  type="button"
                  disabled={
                    loading ||
                    (selectedVariant && Number(quantity || 0) >= availableStock)
                  }
                  onClick={() => setQuantity(String(Number(quantity || 0) + 1))}
                  aria-label="Increase quantity"
                  className="flex h-full w-12 shrink-0 items-center justify-center text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
            </section>

            {/* Subtotal */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/80">
              <div className="flex items-center gap-3 border-b border-gray-200/70 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-500 ring-1 ring-gray-200">
                  <ShoppingCart size={17} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Order summary
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Estimated spare-part subtotal
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 p-4">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-gray-500">Unit price</span>
                  <span className="text-right font-medium text-gray-700">
                    {formatCurrency(selectedVariant?.price)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-gray-500">Quantity</span>
                  <span className="font-medium text-gray-700">
                    {Number(quantity || 0)} units
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-700">
                      Subtotal
                    </span>
                    <span className="break-words text-right text-lg font-bold tracking-tight text-gray-900">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="hidden text-xs text-gray-400 sm:block">
              Review the selected variant and quantity before saving.
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 sm:w-auto"
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
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm shadow-red-600/15 transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}

                {loading
                  ? "Saving..."
                  : item
                    ? "Save Changes"
                    : "Add Spare Part"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
