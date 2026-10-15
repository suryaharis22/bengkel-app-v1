"use client";

import { RotateCcw, Search } from "lucide-react";

export default function VehicleFilter({
  search = "",
  type = "",
  onSearchChange,
  onTypeChange,
  onReset,
}) {
  const hasFilter = Boolean(search || type);

  function handleSearchChange(event) {
    onSearchChange?.(event.target.value);
  }

  function handleTypeChange(event) {
    onTypeChange?.(event.target.value);
  }

  function handleReset() {
    onReset?.();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* SEARCH */}
        <div className="relative min-w-0 flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search plate number, brand, or model..."
            className={[
              "h-10 w-full rounded-lg border border-gray-300",
              "bg-white pl-10 pr-3 text-sm text-gray-900",
              "outline-none transition",
              "placeholder:text-gray-400",
              "focus:border-red-500 focus:ring-2 focus:ring-red-100",
            ].join(" ")}
          />
        </div>

        {/* VEHICLE TYPE */}
        <select
          value={type}
          onChange={handleTypeChange}
          className={[
            "h-10 rounded-lg border border-gray-300",
            "bg-white px-3 text-sm text-gray-700",
            "outline-none transition",
            "focus:border-red-500 focus:ring-2 focus:ring-red-100",
            "lg:w-44",
          ].join(" ")}
        >
          <option value="">All Vehicles</option>
          <option value="Customer">Customer</option>
          <option value="Guest">Guest</option>
        </select>

        {/* RESET */}
        {hasFilter ? (
          <button
            type="button"
            onClick={handleReset}
            className={[
              "inline-flex h-10 items-center justify-center gap-2",
              "rounded-lg border border-gray-300 px-4",
              "text-sm font-medium text-gray-700",
              "transition hover:bg-gray-50",
            ].join(" ")}
          >
            <RotateCcw size={15} />
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}
