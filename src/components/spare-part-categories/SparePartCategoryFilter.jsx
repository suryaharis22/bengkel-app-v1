"use client";

import { Search, X } from "lucide-react";

export default function SparePartCategoryFilter({
  search = "",
  status = "",
  parentId = "",
  categories = [],
  onSearchChange,
  onStatusChange,
  onParentChange,
  onReset,
}) {
  const safeSearch = typeof search === "string" ? search : "";

  const safeStatus = typeof status === "string" ? status : "";

  const safeParentId = typeof parentId === "string" ? parentId : "";

  const safeCategories = Array.isArray(categories) ? categories : [];

  const hasFilter =
    safeSearch.trim() !== "" || safeStatus !== "" || safeParentId !== "";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label
            htmlFor="category-search"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Search
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="category-search"
              type="text"
              value={safeSearch}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search category name..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="category-status"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Status
          </label>

          <select
            id="category-status"
            value={safeStatus}
            onChange={(event) => onStatusChange?.(event.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
          >
            <option value="">All Status</option>

            <option value="true">Active</option>

            <option value="false">Inactive</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="category-parent"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Parent Category
          </label>

          <select
            id="category-parent"
            value={safeParentId}
            onChange={(event) => onParentChange?.(event.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
          >
            <option value="">All Categories</option>

            <option value="null">Root Category</option>

            {safeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasFilter && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <X size={16} />
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
}
