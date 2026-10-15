"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  FolderTree,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";

import SparePartCategoryFilter from "@/components/spare-part-categories/SparePartCategoryFilter";
import SparePartCategoryForm from "@/components/spare-part-categories/SparePartCategoryForm";
import SparePartCategoryTableSkeleton from "@/components/spare-part-categories/SparePartCategoryTableSkeleton";

const INITIAL_META = {
  current_page: 1,
  per_page: 10,
  total_items: 0,
  total_pages: 1,
};

const SEARCH_DEBOUNCE_MS = 400;

function getErrorMessage(error, fallback) {
  const axiosError = getAxiosError(error);
  return axiosError?.message || fallback;
}

function getResponseData(response) {
  return response?.data?.data;
}

function getResponseMeta(response) {
  return response?.data?.meta || INITIAL_META;
}

function getStatusLabel(status) {
  return status ? "Active" : "Inactive";
}

function StatusBadge({ status }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-xs font-semibold",
        status ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          status ? "bg-emerald-500" : "bg-gray-400",
        ].join(" ")}
      />
      {getStatusLabel(status)}
    </span>
  );
}

function CategoryImage({ category }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!category.image_url || imageFailed) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
        <FolderTree size={20} />
      </div>
    );
  }

  return (
    <img
      src={category.image_url}
      alt={category.name || "Category"}
      onError={() => setImageFailed(true)}
      className="h-11 w-11 shrink-0 rounded-xl border border-gray-100 object-cover"
    />
  );
}

function ActionButton({
  label,
  onClick,
  children,
  danger = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-lg",
        "border transition disabled:cursor-not-allowed disabled:opacity-50",
        danger
          ? "border-red-100 text-red-600 hover:bg-red-50"
          : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function CategoryActions({ category, onView, onEdit, onDelete, deleting }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <ActionButton
        label={`View ${category.name}`}
        onClick={() => onView(category)}
      >
        <Eye size={16} />
      </ActionButton>

      <ActionButton
        label={`Edit ${category.name}`}
        onClick={() => onEdit(category)}
      >
        <Pencil size={16} />
      </ActionButton>

      <ActionButton
        label={`Delete ${category.name}`}
        onClick={() => onDelete(category)}
        danger
        disabled={deleting}
      >
        <Trash2 size={16} />
      </ActionButton>
    </div>
  );
}

function CategoryDetailModal({ category, onClose, onEdit }) {
  if (!category) {
    return null;
  }

  const details = [
    ["Category ID", category.id],
    ["Name", category.name || "-"],
    ["Slug", category.slug || "-"],
    ["Parent Category", category.parent?.name || "Root Category"],
    ["Description", category.description || "-"],
    ["Sort Order", category.sort_order ?? 0],
    ["Subcategories", category.counts?.children ?? 0],
    ["Products", category.counts?.products ?? 0],
    ["Status", getStatusLabel(category.status)],
    ["Image URL", category.image_url || "-"],
    [
      "Created At",
      category.created_at
        ? new Date(category.created_at).toLocaleString()
        : "-",
    ],
    [
      "Updated At",
      category.updated_at
        ? new Date(category.updated_at).toLocaleString()
        : "-",
    ],
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-detail-title"
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2
              id="category-detail-title"
              className="text-lg font-semibold text-gray-900"
            >
              Category Details
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Spare part category information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="mb-5 flex items-center gap-4">
            <CategoryImage category={category} />

            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-gray-900">
                {category.name}
              </h3>
              <p className="mt-1 truncate text-sm text-gray-500">
                {category.slug}
              </p>
            </div>

            <StatusBadge status={Boolean(category.status)} />
          </div>

          <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {details.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"
              >
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className="break-words text-sm font-medium text-gray-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => onEdit(category)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700"
          >
            <Pencil size={16} />
            Edit Category
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SparePartCategoryTable({
  initialPage = 1,
  perPage = 10,
  onView,
  onEdit,
  onDelete,
  refreshKey = 0,
}) {
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  // Halaman request dipisahkan dari metadata respons API.
  const [page, setPage] = useState(initialPage);

  const [meta, setMeta] = useState({
    ...INITIAL_META,
    current_page: initialPage,
    per_page: perPage,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState("");
  const [parentId, setParentId] = useState("");

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [detailCategory, setDetailCategory] = useState(null);

  // Hanya berubah ketika refresh manual, mutasi berhasil, atau retry.
  const [requestVersion, setRequestVersion] = useState(0);

  // Debounce search supaya satu rangkaian ketikan tidak menghasilkan
  // satu request untuk setiap karakter.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  // Ambil data tabel. Metadata hasil respons tidak menjadi dependency,
  // sehingga setMeta tidak memicu GET tambahan.
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoading(true);
      setError("");

      const params = {
        page,
        per_page: perPage,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (status !== "") {
        params.status = status;
      }

      if (parentId !== "") {
        params.parent_id = parentId;
      }

      try {
        const response = await api.get("/admin/spare-part-categories", {
          params,
        });

        if (cancelled) return;

        const result = getResponseData(response);
        const responseMeta = getResponseMeta(response);

        setCategories(Array.isArray(result) ? result : []);

        setMeta({
          current_page: Number(responseMeta.current_page) || page,
          per_page: Number(responseMeta.per_page) || perPage,
          total_items: Number(responseMeta.total_items) || 0,
          total_pages: Math.max(1, Number(responseMeta.total_pages) || 1),
        });
      } catch (requestError) {
        if (cancelled) return;

        setCategories([]);

        const message = getErrorMessage(
          requestError,
          "Failed to load spare part categories.",
        );

        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [
    page,
    perPage,
    debouncedSearch,
    status,
    parentId,
    requestVersion,
    refreshKey,
  ]);

  // Ambil seluruh kategori untuk dropdown parent dan form.
  // Hanya berjalan saat mount, refresh, atau mutasi berhasil.
  const fetchAllCategories = useCallback(async () => {
    try {
      const firstResponse = await api.get("/admin/spare-part-categories", {
        params: {
          page: 1,
          per_page: 100,
        },
      });

      const firstData = getResponseData(firstResponse);
      const firstMeta = getResponseMeta(firstResponse);

      let result = Array.isArray(firstData) ? firstData : [];
      const totalPages = Math.max(1, Number(firstMeta.total_pages) || 1);

      if (totalPages > 1) {
        const remainingResponses = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            api.get("/admin/spare-part-categories", {
              params: {
                page: index + 2,
                per_page: 100,
              },
            }),
          ),
        );

        for (const response of remainingResponses) {
          const pageData = getResponseData(response);

          if (Array.isArray(pageData)) {
            result = result.concat(pageData);
          }
        }
      }

      setAllCategories(result);
    } catch (requestError) {
      toast.error(
        getErrorMessage(requestError, "Failed to load parent categories."),
      );
    }
  }, []);

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories, refreshKey, requestVersion]);

  const availableParentCategories = useMemo(
    () =>
      allCategories.filter(
        (item) => item.parent_id == null && item.status === true,
      ),
    [allCategories],
  );

  const refresh = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value) => {
    setStatus(value);
    setPage(1);
  }, []);

  const handleParentChange = useCallback((value) => {
    setParentId(value);
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setStatus("");
    setParentId("");
    setPage(1);
  }, []);

  const handlePageChange = useCallback((nextPage) => {
    setPage(nextPage);
  }, []);

  function openCreateForm() {
    setFormMode("create");
    setSelectedCategory(null);
    setFormOpen(true);
    setDetailCategory(null);
  }

  function openEditForm(category) {
    setFormMode("edit");
    setSelectedCategory(category);
    setFormOpen(true);
    setDetailCategory(null);

    onEdit?.(category);
  }

  function openDetail(category) {
    if (onView) {
      onView(category);
      return;
    }

    setDetailCategory(category);
  }

  async function handleFormSubmit(payload) {
    setFormLoading(true);

    try {
      if (formMode === "edit" && selectedCategory) {
        await api.put(
          `/admin/spare-part-categories/${selectedCategory.id}`,
          payload,
        );

        toast.success("Spare part category updated successfully.");
      } else {
        await api.post("/admin/spare-part-categories", payload);

        toast.success("Spare part category created successfully.");
      }

      setFormOpen(false);
      setSelectedCategory(null);

      // Setelah create, tampilkan halaman pertama.
      if (formMode === "create") {
        setPage(1);
      }

      // Satu perubahan versi akan memperbarui tabel dan dropdown kategori.
      setRequestVersion((current) => current + 1);
    } catch (requestError) {
      toast.error(
        getErrorMessage(
          requestError,
          `Failed to ${formMode === "edit" ? "update" : "create"} category.`,
        ),
      );
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(category) {
    const productCount = Number(category.counts?.products) || 0;
    const childCount = Number(category.counts?.children) || 0;

    if (childCount > 0 || productCount > 0) {
      toast.error(
        childCount > 0
          ? "This category has subcategories and cannot be deleted yet."
          : "This category has products and cannot be deleted yet.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(category.id);

    try {
      await api.delete(`/admin/spare-part-categories/${category.id}`);

      toast.success("Spare part category deleted successfully.");

      onDelete?.(category);

      // Jika baris terakhir di halaman dihapus, mundur satu halaman.
      if (categories.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      }

      // Memuat ulang tabel dan opsi dropdown.
      setRequestVersion((current) => current + 1);
    } catch (requestError) {
      toast.error(
        getErrorMessage(requestError, "Failed to delete spare part category."),
      );
    } finally {
      setDeletingId(null);
    }
  }

  const columns = useMemo(
    () => [
      {
        key: "category",
        label: "Category",
        render: (category) => (
          <div className="flex min-w-[220px] items-center gap-3">
            <CategoryImage category={category} />

            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">
                {category.name || "-"}
              </p>
              <p className="mt-1 truncate text-xs text-gray-500">
                {category.slug || "-"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "parent",
        label: "Parent Category",
        render: (category) => (
          <span className="text-sm text-gray-600">
            {category.parent?.name || "Root Category"}
          </span>
        ),
      },
      {
        key: "counts",
        label: "Subcategories / Products",
        render: (category) => (
          <div className="flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-2 text-xs text-gray-600">
              <FolderTree size={14} className="text-gray-400" />
              {category.counts?.children ?? 0} subcategories
            </span>

            <span className="inline-flex items-center gap-2 text-xs text-gray-600">
              <Package size={14} className="text-gray-400" />
              {category.counts?.products ?? 0} products
            </span>
          </div>
        ),
      },
      {
        key: "sort_order",
        label: "Sort Order",
        cellClassName: "w-28",
        render: (category) => (
          <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
            {category.sort_order ?? 0}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (category) => <StatusBadge status={Boolean(category.status)} />,
      },
    ],
    [],
  );

  // Callback dibuat ulang saat render agar selalu menggunakan state terbaru.
  const renderActions = (category) => (
    <CategoryActions
      category={category}
      onView={openDetail}
      onEdit={openEditForm}
      onDelete={handleDelete}
      deleting={deletingId === category.id}
    />
  );

  const renderMobile = (category) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <CategoryImage category={category} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words font-semibold text-gray-900">
              {category.name || "-"}
            </h3>

            <StatusBadge status={Boolean(category.status)} />
          </div>

          <p className="mt-1 break-all text-xs text-gray-500">
            {category.slug || "-"}
          </p>

          <p className="mt-2 text-sm text-gray-600">
            Parent: {category.parent?.name || "Root Category"}
          </p>
        </div>
      </div>

      {category.description ? (
        <p className="mt-3 line-clamp-2 text-sm leading-5 text-gray-500">
          {category.description}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-gray-50 p-2.5">
          <p className="text-xs text-gray-500">Subcategories</p>
          <p className="mt-1 font-semibold text-gray-900">
            {category.counts?.children ?? 0}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-2.5">
          <p className="text-xs text-gray-500">Products</p>
          <p className="mt-1 font-semibold text-gray-900">
            {category.counts?.products ?? 0}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-2.5">
          <p className="text-xs text-gray-500">Sort Order</p>
          <p className="mt-1 font-semibold text-gray-900">
            {category.sort_order ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
        <ActionButton
          label={`View ${category.name}`}
          onClick={() => openDetail(category)}
        >
          <Eye size={16} />
        </ActionButton>

        <ActionButton
          label={`Edit ${category.name}`}
          onClick={() => openEditForm(category)}
        >
          <Pencil size={16} />
        </ActionButton>

        <ActionButton
          label={`Delete ${category.name}`}
          onClick={() => handleDelete(category)}
          danger
          disabled={deletingId === category.id}
        >
          <Trash2 size={16} />
        </ActionButton>
      </div>
    </div>
  );

  const hasActiveFilters =
    Boolean(search.trim()) || status !== "" || parentId !== "";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Spare Part Categories
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage category names, parent categories, products, and status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <Plus size={17} />
            Add Category
          </button>
        </div>
      </div>

      <SparePartCategoryFilter
        search={search}
        status={status}
        parentId={parentId}
        categories={availableParentCategories}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onParentChange={handleParentChange}
        onReset={handleResetFilters}
      />

      {error && !loading ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <RefreshCw size={15} />
            Try Again
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Category List</h2>

            <p className="mt-1 text-sm text-gray-500">
              {loading
                ? "Loading categories..."
                : `${meta.total_items} categories found`}
            </p>
          </div>

          <span className="text-xs text-gray-500">
            {loading ? "Please wait" : `Page ${page} of ${meta.total_pages}`}
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <DataTable
            columns={columns}
            data={categories}
            rowKey="id"
            loading={loading}
            skeleton={<SparePartCategoryTableSkeleton />}
            emptyIcon={FolderTree}
            emptyMessage={
              hasActiveFilters ? "No matching categories" : "No categories yet"
            }
            emptyDescription={
              hasActiveFilters
                ? "Try changing your search or resetting the filters."
                : "Create a spare part category to get started."
            }
            renderActions={renderActions}
            renderMobile={renderMobile}
          />
        </div>

        {!loading && categories.length > 0 ? (
          <Pagination
            page={page}
            totalPages={meta.total_pages}
            onPageChange={handlePageChange}
            disabled={loading}
            showPageInfo
          />
        ) : null}
      </div>

      <SparePartCategoryForm
        open={formOpen}
        mode={formMode}
        category={selectedCategory}
        categories={allCategories}
        loading={formLoading}
        onClose={() => {
          if (!formLoading) {
            setFormOpen(false);
            setSelectedCategory(null);
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <CategoryDetailModal
        category={detailCategory}
        onClose={() => setDetailCategory(null)}
        onEdit={openEditForm}
      />
    </div>
  );
}
