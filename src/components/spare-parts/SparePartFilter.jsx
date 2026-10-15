"use client";

import { useState } from "react";
import {
  Search,
  X,
  Filter,
  Tag,
  Layers3,
  ChevronDown,
  RotateCcw,
  Check,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
  { value: "draft", label: "Draft" },
];

function MultiSelectFilter({
  label,
  icon: Icon,
  options = [],
  selectedValues = [],
  onChange,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const selected = selectedValues.map(String);

  const toggleOption = (id) => {
    const value = String(id);

    onChange?.(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  return (
    <div className="relative min-w-0">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${
          selected.length
            ? "border-blue-300 bg-blue-50 text-blue-700"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon size={16} className="shrink-0 text-gray-400" />
          <span className="truncate">
            {selected.length
              ? `${selected.length} ${label} dipilih`
              : placeholder}
          </span>
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={`Tutup pilihan ${label}`}
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 top-full z-30 mt-2 max-h-72 w-full min-w-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-2 pb-2">
              <span className="text-xs font-semibold text-gray-500">
                Pilih {label}
              </span>

              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange?.([])}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Hapus pilihan
                </button>
              )}
            </div>

            {options.length === 0 ? (
              <p className="px-3 py-5 text-center text-sm text-gray-400">
                Tidak ada pilihan tersedia.
              </p>
            ) : (
              <div className="mt-1 space-y-0.5">
                {options.map((option) => {
                  const id = String(option.id);
                  const checked = selected.includes(id);

                  return (
                    <label
                      key={id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        checked
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOption(id)}
                        className="peer sr-only"
                      />

                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                          checked
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {checked && <Check size={11} strokeWidth={3} />}
                      </span>

                      <span className="min-w-0 flex-1 break-words">
                        {option.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({ children, onRemove, color = "gray", label }) {
  const colors = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${colors[color]}`}
    >
      <span className="min-w-0 break-words">{children}</span>

      <button
        type="button"
        onClick={onRemove}
        aria-label={label || "Hapus filter"}
        className="shrink-0 rounded-full p-0.5 transition hover:bg-black/5"
      >
        <X size={13} />
      </button>
    </span>
  );
}

export default function SparePartFilter({
  brands = [],
  categories = [],
  selectedBrands = [],
  selectedCategories = [],
  search = "",
  status = "",
  activeFilterCount = 0,
  onSearchChange,
  onBrandsChange,
  onCategoriesChange,
  onStatusChange,
  onClear,
}) {
  const [searchInput, setSearchInput] = useState(search);

  const hasFilters =
    selectedBrands.length > 0 ||
    selectedCategories.length > 0 ||
    Boolean(status) ||
    Boolean(search);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearchChange?.(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput("");
    onClear?.();
  };

  const handleRemoveSearch = () => {
    setSearchInput("");
    onSearchChange?.("");
  };

  const handleRemoveBrand = (id) => {
    onBrandsChange?.(
      selectedBrands.filter((value) => String(value) !== String(id)),
    );
  };

  const handleRemoveCategory = (id) => {
    onCategoriesChange?.(
      selectedCategories.filter((value) => String(value) !== String(id)),
    );
  };

  return (
    <section className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-red-600">
            <Filter size={19} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
              Filter Spare Part
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Cari dan saring data spare part.
            </p>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            {activeFilterCount} filter aktif
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-5">
        {/* Search */}
        <div>
          <label
            htmlFor="spare-part-search"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Pencarian
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="spare-part-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nama, SKU, atau spare part..."
                className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <button
              type="submit"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-[0.98]"
            >
              <Search size={16} />
              Cari
            </button>
          </div>
        </div>

        {/* Filter options */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MultiSelectFilter
            label="Merek"
            icon={Tag}
            options={brands}
            selectedValues={selectedBrands}
            onChange={onBrandsChange}
            placeholder="Semua merek"
          />

          <MultiSelectFilter
            label="Kategori"
            icon={Layers3}
            options={categories}
            selectedValues={selectedCategories}
            onChange={onCategoriesChange}
            placeholder="Semua kategori"
          />

          <div>
            <label
              htmlFor="spare-part-status"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Status
            </label>

            <select
              id="spare-part-status"
              value={status}
              onChange={(event) => onStatusChange?.(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">Semua status</option>

              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={handleClear}
              disabled={activeFilterCount === 0 && !searchInput}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={16} />
              Reset filter
            </button>
          </div>
        </div>

        {/* Active filters */}
        {hasFilters && (
          <div className="border-t border-gray-100 pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-500">
                Filter yang diterapkan
              </span>

              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-medium text-red-600 transition hover:text-red-700"
              >
                Hapus semua
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {search && (
                <FilterChip
                  color="gray"
                  label="Hapus pencarian"
                  onRemove={handleRemoveSearch}
                >
                  Pencarian: {search}
                </FilterChip>
              )}

              {selectedBrands.map((id) => {
                const brand = brands.find(
                  (item) => String(item.id) === String(id),
                );

                return (
                  <FilterChip
                    key={`brand-${id}`}
                    color="blue"
                    label={`Hapus filter merek ${brand?.name || id}`}
                    onRemove={() => handleRemoveBrand(id)}
                  >
                    {brand?.name || `Merek #${id}`}
                  </FilterChip>
                );
              })}

              {selectedCategories.map((id) => {
                const category = categories.find(
                  (item) => String(item.id) === String(id),
                );

                return (
                  <FilterChip
                    key={`category-${id}`}
                    color="purple"
                    label={`Hapus filter kategori ${category?.name || id}`}
                    onRemove={() => handleRemoveCategory(id)}
                  >
                    {category?.name || `Kategori #${id}`}
                  </FilterChip>
                );
              })}

              {status && (
                <FilterChip
                  color="amber"
                  label="Hapus filter status"
                  onRemove={() => onStatusChange?.("")}
                >
                  Status:{" "}
                  {STATUS_OPTIONS.find((option) => option.value === status)
                    ?.label || status}
                </FilterChip>
              )}
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
