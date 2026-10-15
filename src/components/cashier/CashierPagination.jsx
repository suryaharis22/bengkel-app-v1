"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

function getPageNumbers(currentPage, totalPages) {
  const pages = new Set([1, totalPages]);

  for (
    let page = Math.max(1, currentPage - 2);
    page <= Math.min(totalPages, currentPage + 2);
    page++
  ) {
    pages.add(page);
  }

  return [...pages].sort((a, b) => a - b);
}

export default function CashierPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  perPage = 20,
  onPageChange,
  onPerPageChange,
  disabled = false,
}) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeCurrentPage = Math.min(
    safeTotalPages,
    Math.max(1, Number(currentPage) || 1),
  );
  const safeTotalItems = Math.max(0, Number(totalItems) || 0);
  const safePerPage = Math.max(1, Number(perPage) || 20);

  const startItem =
    safeTotalItems === 0 ? 0 : (safeCurrentPage - 1) * safePerPage + 1;

  const endItem = Math.min(safeCurrentPage * safePerPage, safeTotalItems);

  const pages = getPageNumbers(safeCurrentPage, safeTotalPages);

  const goToPage = (page) => {
    if (
      disabled ||
      page < 1 ||
      page > safeTotalPages ||
      page === safeCurrentPage
    ) {
      return;
    }

    onPageChange?.(page);
  };

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Informasi data */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-500 sm:text-sm">
        <span>
          Showing{" "}
          <span className="font-medium text-gray-800">
            {startItem}-{endItem}
          </span>{" "}
          of <span className="font-medium text-gray-800">{safeTotalItems}</span>{" "}
          products
        </span>

        <label className="flex items-center gap-2">
          <span>Per page</span>

          <select
            value={safePerPage}
            disabled={disabled}
            onChange={(event) => onPerPageChange?.(Number(event.target.value))}
            className="h-8 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700 outline-none focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Navigasi halaman */}
      <nav
        aria-label="Product pagination"
        className="flex flex-wrap items-center gap-1"
      >
        <button
          type="button"
          onClick={() => goToPage(1)}
          disabled={disabled || safeCurrentPage === 1}
          aria-label="First page"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          type="button"
          onClick={() => goToPage(safeCurrentPage - 1)}
          disabled={disabled || safeCurrentPage === 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((pageNumber, index) => {
          const previousPage = pages[index - 1];
          const showEllipsis = previousPage && pageNumber - previousPage > 1;

          return (
            <span key={pageNumber} className="flex items-center gap-1">
              {showEllipsis && (
                <span aria-hidden="true" className="px-1 text-sm text-gray-400">
                  …
                </span>
              )}

              <button
                type="button"
                onClick={() => goToPage(pageNumber)}
                disabled={disabled}
                aria-label={`Page ${pageNumber}`}
                aria-current={
                  pageNumber === safeCurrentPage ? "page" : undefined
                }
                className={`flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  pageNumber === safeCurrentPage
                    ? "border-red-600 bg-red-600 font-semibold text-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {pageNumber}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={() => goToPage(safeCurrentPage + 1)}
          disabled={disabled || safeCurrentPage >= safeTotalPages}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>

        <button
          type="button"
          onClick={() => goToPage(safeTotalPages)}
          disabled={disabled || safeCurrentPage >= safeTotalPages}
          aria-label="Last page"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronsRight size={16} />
        </button>
      </nav>
    </div>
  );
}
