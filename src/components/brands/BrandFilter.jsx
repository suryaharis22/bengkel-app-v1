"use client";

import { Plus, Search, X } from "lucide-react";

export default function BrandFilter({ filters, onChange, onCreate }) {
  function handleSearchChange(event) {
    onChange({
      ...filters,
      search: event.target.value,
    });
  }

  function handleStatusChange(event) {
    onChange({
      ...filters,
      status: event.target.value,
    });
  }

  function handleReset() {
    onChange({
      search: "",
      status: "",
    });
  }

  const hasFilter = Boolean(filters.search) || filters.status !== "";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid w-full gap-4 md:grid-cols-2 lg:max-w-2xl">
          <div>
            <label
              htmlFor="brand-search"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Search
            </label>

            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="brand-search"
                type="text"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search brand..."
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="brand-status"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Status
            </label>

            <select
              id="brand-status"
              value={filters.status}
              onChange={handleStatusChange}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
            >
              <option value="">All Status</option>

              <option value="true">Active</option>

              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasFilter && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <X size={16} />
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <Plus size={17} />
            Add Brand
          </button>
        </div>
      </div>
    </div>
  );
}
