"use client";

import { Search, RotateCcw } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  {
    value: "technician_confirmed",
    label: "Technician Confirmed",
  },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export default function CustomerBookingFilter({
  search = "",
  status = "",
  onSearchChange,
  onStatusChange,
  onReset,
}) {
  const hasFilter = Boolean(search.trim() || status);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search booking..."
            className={[
              "h-10 w-full rounded-lg border border-gray-300",
              "bg-white pl-10 pr-3 text-sm text-gray-900",
              "outline-none transition",
              "placeholder:text-gray-400",
              "focus:border-red-500 focus:ring-2 focus:ring-red-100",
            ].join(" ")}
          />
        </div>

        <select
          value={status}
          onChange={(event) => onStatusChange?.(event.target.value)}
          className={[
            "h-10 rounded-lg border border-gray-300",
            "bg-white px-3 text-sm text-gray-700",
            "outline-none transition",
            "focus:border-red-500 focus:ring-2 focus:ring-red-100",
          ].join(" ")}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasFilter ? (
          <button
            type="button"
            onClick={onReset}
            className={[
              "inline-flex h-10 items-center justify-center gap-2",
              "rounded-lg border border-gray-200 px-3",
              "text-sm font-medium text-gray-600",
              "transition-colors hover:bg-gray-50 hover:text-gray-900",
            ].join(" ")}
          >
            <RotateCcw size={16} />
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}
