"use client";

import { Search, X, Filter } from "lucide-react";

export default function UserFilter({
  search = "",
  role = "",
  perPage = "10",
  onSearchChange,
  onRoleChange,
  onPerPageChange,
}) {
  function handleClear() {
    onSearchChange("");
    onRoleChange("");
  }

  const hasFilter = Boolean(search.trim() || role);

  const inputClass = [
    "block",
    "h-11",
    "w-full",
    "min-w-0",
    "max-w-full",
    "rounded-lg",
    "border",
    "border-gray-200",
    "bg-white",
    "px-3",
    "text-sm",
    "text-gray-700",
    "outline-none",
    "transition",
    "placeholder:text-gray-400",
    "focus:border-red-500",
    "focus:ring-2",
    "focus:ring-red-100",
  ].join(" ");

  return (
    <section className="block h-auto w-full min-w-0 max-w-full rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
      {/* Header */}
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <Filter size={18} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">
              Filter Users
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-gray-500">
              Search and filter user data
            </p>
          </div>
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-9 w-fit max-w-full shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:self-auto"
          >
            <X size={15} aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      {/* Filter fields */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_150px]">
        {/* Search */}
        <div className="w-full min-w-0 sm:col-span-2 xl:col-span-1">
          <label
            htmlFor="user-search"
            className="mb-1.5 block text-xs font-medium text-gray-700"
          >
            Search users
          </label>

          <div className="relative w-full min-w-0">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="user-search"
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Username, email, or phone..."
              autoComplete="off"
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        {/* Role */}
        <div className="w-full min-w-0">
          <label
            htmlFor="user-role"
            className="mb-1.5 block text-xs font-medium text-gray-700"
          >
            Role
          </label>

          <select
            id="user-role"
            value={role}
            onChange={(event) => onRoleChange(event.target.value)}
            className={inputClass}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teknisi">Teknisi</option>
            <option value="customer">Customer</option>
          </select>
        </div>

        {/* Rows per page */}
        <div className="w-full min-w-0">
          <label
            htmlFor="user-per-page"
            className="mb-1.5 block text-xs font-medium text-gray-700"
          >
            Rows per page
          </label>

          <select
            id="user-per-page"
            value={String(perPage)}
            onChange={(event) => onPerPageChange(event.target.value)}
            className={inputClass}
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      </div>

      {/* Active filters */}
      {hasFilter && (
        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          <span className="shrink-0 text-xs text-gray-500">
            Active filters:
          </span>

          {search.trim() && (
            <span className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-700">
              <Search size={12} aria-hidden="true" className="shrink-0" />
              <span className="min-w-0 break-all">Search: {search.trim()}</span>
            </span>
          )}

          {role && (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
              <span>Role:</span>
              <span className="capitalize">{role}</span>
            </span>
          )}
        </div>
      )}
    </section>
  );
}
