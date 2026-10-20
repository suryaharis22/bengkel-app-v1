"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  disabled = false,
  showPageInfo = true,
  previousLabel = "Previous",
  nextLabel = "Next",
}) {
  const pages = Math.max(1, Math.floor(Number(totalPages) || 1));
  const currentPage = Math.min(
    pages,
    Math.max(1, Math.floor(Number(page) || 1)),
  );

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === pages;

  function handlePrevious() {
    if (disabled || isFirstPage) return;
    onPageChange?.(currentPage - 1);
  }

  function handleNext() {
    if (disabled || isLastPage) return;
    onPageChange?.(currentPage + 1);
  }

  if (pages <= 1 && !showPageInfo) {
    return null;
  }

  const buttonClass = [
    "inline-flex h-9 shrink-0 items-center justify-center gap-1.5",
    "rounded-lg border border-gray-300 bg-white px-3",
    "text-sm font-medium text-gray-700",
    "transition-colors hover:bg-gray-50",
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-red-500 focus-visible:ring-offset-1",
    "disabled:cursor-not-allowed disabled:opacity-40",
  ].join(" ");

  return (
    <nav
      aria-label="Pagination"
      className="flex w-full min-w-0 flex-col gap-3 border-t border-gray-200 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      {showPageInfo && (
        <p className="min-w-0 text-sm text-gray-500">
          Page{" "}
          <span className="font-semibold text-gray-700">{currentPage}</span> of{" "}
          <span className="font-semibold text-gray-700">{pages}</span>
        </p>
      )}

      {pages > 1 && (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={disabled || isFirstPage}
            aria-label={previousLabel}
            className={`${buttonClass} flex-1 sm:flex-none`}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            <span>{previousLabel}</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={disabled || isLastPage}
            aria-label={nextLabel}
            className={`${buttonClass} flex-1 sm:flex-none`}
          >
            <span>{nextLabel}</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </nav>
  );
}
