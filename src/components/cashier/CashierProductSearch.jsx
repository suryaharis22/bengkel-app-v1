"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X, ChevronDown, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";

function normalizeId(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value);
}

function getUniqueOptions(items = []) {
  const options = new Map();

  for (const item of items) {
    const id = normalizeId(item?.id);
    const name = typeof item?.name === "string" ? item.name.trim() : "";

    if (!id || !name || item?.status === false) continue;

    if (!options.has(id)) {
      options.set(id, { id, name });
    }
  }

  return [...options.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  emptyMessage,
}) {
  const [open, setOpen] = useState(false);

  const toggleOption = (id) => {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return;

    const normalizedSelected = selected.map(normalizeId);

    onChange(
      normalizedSelected.includes(normalizedId)
        ? normalizedSelected.filter((item) => item !== normalizedId)
        : [...normalizedSelected, normalizedId],
    );
  };

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm transition ${
          selected.length
            ? "border-red-300 bg-red-50 text-red-700"
            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{label}</span>

          {selected.length > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
              {selected.length}
            </span>
          )}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={`Close ${label} filter`}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 top-full z-20 mt-2 max-h-64 w-full min-w-52 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
            {options.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-500">{emptyMessage}</p>
            ) : (
              options.map((option) => {
                const id = normalizeId(option.id);
                const checked = selected.map(normalizeId).includes(id);

                return (
                  <label
                    key={id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOption(id)}
                      className="h-4 w-4 rounded border-gray-300 accent-red-600"
                    />

                    <span className="min-w-0 flex-1 truncate">
                      {option.name}
                    </span>
                  </label>
                );
              })
            )}

            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Clear {label.toLowerCase()}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function CashierProductSearch({
  value = "",
  onChange,
  selectedBrands = [],
  onBrandsChange,
  selectedCategories = [],
  onCategoriesChange,
}) {
  const [filterOpen, setFilterOpen] = useState(true);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const loadFilterOptions = useCallback(async (signal) => {
    setLoadingOptions(true);

    try {
      const [brandsResult, categoriesResult] = await Promise.allSettled([
        api.get("/admin/brands", {
          params: {
            page: 1,
            per_page: 100,
          },
          signal,
        }),

        api.get("/admin/spare-part-categories", {
          params: {
            page: 1,
            per_page: 100,
          },
          signal,
        }),
      ]);

      if (signal?.aborted) return;

      let hasError = false;

      if (brandsResult.status === "fulfilled") {
        const data = brandsResult.value?.data?.data;

        setBrands(getUniqueOptions(Array.isArray(data) ? data : []));
      } else if (
        brandsResult.reason?.code !== "ERR_CANCELED" &&
        brandsResult.reason?.name !== "CanceledError"
      ) {
        hasError = true;
        console.error("Load brands error:", brandsResult.reason);
      }

      if (categoriesResult.status === "fulfilled") {
        const data = categoriesResult.value?.data?.data;

        setCategories(getUniqueOptions(Array.isArray(data) ? data : []));
      } else if (
        categoriesResult.reason?.code !== "ERR_CANCELED" &&
        categoriesResult.reason?.name !== "CanceledError"
      ) {
        hasError = true;
        console.error(
          "Load spare part categories error:",
          categoriesResult.reason,
        );
      }

      if (hasError) {
        toast.error("Gagal memuat sebagian data filter brand atau kategori.");
      }
    } catch (error) {
      if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
        return;
      }

      console.error("Load cashier filter options error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Gagal memuat filter brand dan kategori.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoadingOptions(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadFilterOptions(controller.signal);

    return () => controller.abort();
  }, [loadFilterOptions]);

  const brandOptions = useMemo(() => brands, [brands]);
  const categoryOptions = useMemo(() => categories, [categories]);

  const clearAllFilters = () => {
    onChange?.("");
    onBrandsChange?.([]);
    onCategoriesChange?.([]);
  };

  const hasFilters =
    Boolean(value) ||
    selectedBrands.length > 0 ||
    selectedCategories.length > 0;

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search
          size={19}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder="Search product, SKU, brand, category..."
          aria-label="Search cashier products"
          className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />

        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onChange?.("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* Filter header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setFilterOpen((current) => !current)}
          aria-expanded={filterOpen}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <SlidersHorizontal size={16} />
          Filters
          <ChevronDown
            size={15}
            className={`transition-transform ${filterOpen ? "rotate-180" : ""}`}
          />
        </button>

        <div className="flex items-center gap-3">
          {loadingOptions && (
            <span className="text-xs text-gray-400">Loading filters...</span>
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              Reset all
            </button>
          )}
        </div>
      </div>

      {/* Multi-select filters */}
      {filterOpen && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MultiSelectFilter
            label="Brands"
            options={brandOptions}
            selected={selectedBrands}
            onChange={onBrandsChange || (() => {})}
            emptyMessage="No brands found."
          />

          <MultiSelectFilter
            label="Categories"
            options={categoryOptions}
            selected={selectedCategories}
            onChange={onCategoriesChange || (() => {})}
            emptyMessage="No categories found."
          />
        </div>
      )}

      {/* Selected filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedBrands.map((id) => {
            const option = brandOptions.find(
              (item) => item.id === normalizeId(id),
            );

            return (
              <span
                key={`brand-${normalizeId(id)}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-700"
              >
                {option?.name || `Brand #${id}`}

                <button
                  type="button"
                  aria-label={`Remove brand ${option?.name || id}`}
                  onClick={() =>
                    onBrandsChange?.(
                      selectedBrands.filter(
                        (item) => normalizeId(item) !== normalizeId(id),
                      ),
                    )
                  }
                  className="rounded-full hover:text-red-900"
                >
                  <X size={13} />
                </button>
              </span>
            );
          })}

          {selectedCategories.map((id) => {
            const option = categoryOptions.find(
              (item) => item.id === normalizeId(id),
            );

            return (
              <span
                key={`category-${normalizeId(id)}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700"
              >
                {option?.name || `Category #${id}`}

                <button
                  type="button"
                  aria-label={`Remove category ${option?.name || id}`}
                  onClick={() =>
                    onCategoriesChange?.(
                      selectedCategories.filter(
                        (item) => normalizeId(item) !== normalizeId(id),
                      ),
                    )
                  }
                  className="rounded-full hover:text-blue-900"
                >
                  <X size={13} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
