"use client";

import { Search, X } from "lucide-react";

export default function UserFilter({
  search,
  role,
  perPage,
  onSearchChange,
  onRoleChange,
  onPerPageChange,
}) {
  function handleClear() {
    onSearchChange("");
    onRoleChange("");
  }

  const hasFilter = search.trim() || role;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_120px_auto]">
        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search username, email, or phone..."
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100"
          />
        </div>

        {/* Role */}
        <select
          value={role}
          onChange={(event) => onRoleChange(event.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
        >
          <option value="">All Roles</option>

          <option value="admin">Admin</option>

          <option value="teknisi">Teknisi</option>

          <option value="customer">Customer</option>
        </select>

        {/* Per Page */}
        <select
          value={perPage}
          onChange={(event) => onPerPageChange(event.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
        >
          <option value="10">10 / page</option>

          <option value="25">25 / page</option>

          <option value="50">50 / page</option>

          <option value="100">100 / page</option>
        </select>

        {/* Clear */}
        {hasFilter && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
