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
  const currentPage = Math.max(1, Number(page) || 1);
  const pages = Math.max(1, Number(totalPages) || 1);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= pages;
  function handlePrevious() {
    if (disabled || isFirstPage) {
      return;
    }
    onPageChange?.(currentPage - 1);
  }
  function handleNext() {
    if (disabled || isLastPage) {
      return;
    }
    onPageChange?.(currentPage + 1);
  }
  if (pages <= 1 && !showPageInfo) {
    return null;
  }
  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      {" "}
      {showPageInfo && (
        <p className="text-sm text-gray-500">
          {" "}
          Page{" "}
          <span className="font-medium text-gray-700">
            {" "}
            {currentPage}{" "}
          </span> of{" "}
          <span className="font-medium text-gray-700"> {pages} </span>{" "}
        </p>
      )}{" "}
      {pages > 1 && (
        <div className="flex items-center gap-2 sm:ml-auto">
          {" "}
          <button
            type="button"
            onClick={handlePrevious}
            disabled={disabled || isFirstPage}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {" "}
            <ChevronLeft size={16} /> {previousLabel}{" "}
          </button>{" "}
          <button
            type="button"
            onClick={handleNext}
            disabled={disabled || isLastPage}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {" "}
            {nextLabel} <ChevronRight size={16} />{" "}
          </button>{" "}
        </div>
      )}{" "}
    </div>
  );
}
