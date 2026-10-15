"use client";

import { useEffect, useState } from "react";
import { Edit, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import BrandTableSkeleton from "@/components/brands/BrandTableSkeleton";

const PER_PAGE = 10;

export default function BrandTable({ filters, refreshKey, onEdit }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: PER_PAGE,
    total_items: 0,
    total_pages: 0,
  });

  const [deleteBrand, setDeleteBrand] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.status]);

  useEffect(() => {
    fetchBrands();
  }, [page, filters.search, filters.status, refreshKey]);

  async function fetchBrands() {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("per_page", String(PER_PAGE));

      if (filters.search?.trim()) {
        params.set("search", filters.search.trim());
      }

      if (filters.status !== "") {
        params.set("status", filters.status);
      }

      const response = await api.get(`/admin/brands?${params.toString()}`);

      const data = response.data?.data || [];

      const meta = response.data?.meta || {};

      setBrands(data);

      setPagination({
        current_page: meta.current_page || page,
        per_page: meta.per_page || PER_PAGE,
        total_items: meta.total_items || 0,
        total_pages: meta.total_pages || 0,
      });
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);

      toast.error(axiosError.message || "Failed to load brands.");

      setBrands([]);
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteClick(brand) {
    setDeleteBrand(brand);
  }

  function handleCloseDeleteModal() {
    if (deleting) {
      return;
    }

    setDeleteBrand(null);
  }

  async function handleConfirmDelete() {
    if (!deleteBrand) {
      return;
    }

    try {
      setDeleting(true);

      await api.delete(`/admin/brands/${deleteBrand.id}`);

      toast.success("Brand deleted successfully.");

      setDeleteBrand(null);

      if (brands.length === 1 && page > 1) {
        setPage((current) => current - 1);

        return;
      }

      await fetchBrands();
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);

      toast.error(axiosError.message || "Failed to delete brand.");
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(date) {
    if (!date) {
      return "-";
    }

    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  function getStartItem() {
    if (!pagination.total_items) {
      return 0;
    }

    return (pagination.current_page - 1) * pagination.per_page + 1;
  }

  function getEndItem() {
    return Math.min(
      pagination.current_page * pagination.per_page,
      pagination.total_items,
    );
  }

  function handlePrevious() {
    if (page <= 1) {
      return;
    }

    setPage((current) => current - 1);
  }

  function handleNext() {
    if (pagination.total_pages && page >= pagination.total_pages) {
      return;
    }

    setPage((current) => current + 1);
  }

  if (loading) {
    return <BrandTableSkeleton />;
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Brand
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Slug
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Description
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Created
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {brands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-sm font-medium text-gray-900">
                      No brands found
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                      Try changing your search or filter.
                    </div>
                  </td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                          {brand.logo_url ? (
                            <img
                              src={brand.logo_url}
                              alt={brand.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-gray-400">
                              {brand.name?.charAt(0)?.toUpperCase() || "B"}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-gray-900">
                            {brand.name}
                          </div>

                          <div className="mt-0.5 text-xs text-gray-500">
                            ID: {brand.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {brand.slug || "-"}
                      </span>
                    </td>

                    <td className="max-w-[280px] px-6 py-4">
                      <p className="truncate text-sm text-gray-600">
                        {brand.description || "-"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      {brand.status ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(brand.created_at)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(brand)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          title="Edit brand"
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteClick(brand)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          title="Delete brand"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            {pagination.total_items > 0
              ? `Showing ${getStartItem()}-${getEndItem()} of ${pagination.total_items} brands`
              : "Showing 0 brands"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={page <= 1}
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-red-600 px-3 text-sm font-medium text-white">
              {pagination.current_page}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={
                pagination.total_pages === 0 || page >= pagination.total_pages
              }
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteBrand && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Delete Brand
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">"{deleteBrand.name}"</span>?
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Brand
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
