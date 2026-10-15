"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Edit,
  Image as ImageIcon,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";

import SparePartForm from "@/components/spare-parts/SparePartForm";
import SparePartFilter from "@/components/spare-parts/SparePartFilter";
import SparePartImageManager from "@/components/spare-parts/SparePartImageManager";
import SparePartTableSkeleton from "@/components/spare-parts/SparePartTableSkeleton";

function getErrorMessage(error, fallback = "Terjadi kesalahan.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function getItems(response) {
  const root = response?.data;
  const data = root?.data ?? root;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.spare_parts)) return data.spare_parts;
  if (Array.isArray(data?.spareParts)) return data.spareParts;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.brands)) return data.brands;
  if (Array.isArray(data?.categories)) return data.categories;

  return [];
}

function getMeta(response) {
  const root = response?.data;
  const data = root?.data;

  const meta = root?.meta ?? data?.meta ?? {};

  return {
    totalItems: Number(meta.total_items ?? meta.totalItems ?? 0),
    totalPages: Math.max(
      1,
      Number(meta.total_pages ?? meta.totalPages ?? 1) || 1,
    ),
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function isActiveStatus(status) {
  return (
    status === true || status === 1 || status === "1" || status === "active"
  );
}

function getStatus(sparePart) {
  return isActiveStatus(sparePart?.status);
}

function getStock(sparePart) {
  const variants = Array.isArray(sparePart?.variants) ? sparePart.variants : [];

  return variants.reduce((total, variant) => {
    const stockValue =
      typeof variant?.stock === "object"
        ? variant.stock?.stock
        : variant?.stock;

    const stock = Number(stockValue) || 0;
    const reserved = Number(variant?.stock?.reserved_stock) || 0;

    return total + Math.max(0, stock - reserved);
  }, 0);
}

function getPrice(sparePart) {
  const variants = Array.isArray(sparePart?.variants) ? sparePart.variants : [];

  const prices = variants
    .filter((variant) => {
      if (variant?.status === undefined || variant?.status === null) {
        return true;
      }

      return isActiveStatus(variant.status);
    })
    .map((variant) => Number(variant.price))
    .filter((price) => Number.isFinite(price) && price >= 0);

  if (prices.length > 0) {
    return Math.min(...prices);
  }

  return Number(sparePart?.price) || 0;
}

function getImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return "";

  if (/^(https?:)?\/\//i.test(imageUrl) || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;

  if (!baseUrl) return path;

  try {
    return new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).href;
  } catch {
    return path;
  }
}

function getPrimaryImage(sparePart) {
  const images = Array.isArray(sparePart?.images) ? sparePart.images : [];

  const sorted = [...images]
    .filter((image) => image?.image_url)
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) {
        return Number(b.is_primary) - Number(a.is_primary);
      }

      return Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
    });

  return getImageUrl(sorted[0]?.image_url);
}

function normalizeIds(ids) {
  return (Array.isArray(ids) ? ids : []).map(String);
}

export default function SparePartTable() {
  const [spareParts, setSpareParts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState(null);

  const [imageManagerOpen, setImageManagerOpen] = useState(false);
  const [selectedImageSparePart, setSelectedImageSparePart] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingSparePart, setDeletingSparePart] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  // Load brand and category options.
  const fetchFilters = useCallback(async () => {
    const [brandResult, categoryResult] = await Promise.allSettled([
      api.get("/admin/brands", {
        params: { page: 1, per_page: 100 },
      }),
      api.get("/admin/spare-part-categories", {
        params: { page: 1, per_page: 100 },
      }),
    ]);

    if (brandResult.status === "fulfilled") {
      setBrands(
        getItems(brandResult.value).filter((brand) =>
          isActiveStatus(brand.status),
        ),
      );
    } else {
      toast.error(
        getErrorMessage(brandResult.reason, "Failed to load brands."),
      );
    }

    if (categoryResult.status === "fulfilled") {
      setCategories(
        getItems(categoryResult.value).filter((category) =>
          isActiveStatus(category.status),
        ),
      );
    } else {
      toast.error(
        getErrorMessage(categoryResult.reason, "Failed to load categories."),
      );
    }
  }, []);

  // Fetch spare parts with filters and pagination.
  const fetchSpareParts = useCallback(
    async ({
      currentPage = page,
      currentPerPage = perPage,
      currentSearch = search,
      currentBrands = selectedBrands,
      currentCategories = selectedCategories,
      currentStatus = status,
      showLoading = true,
    } = {}) => {
      if (showLoading) setLoading(true);

      try {
        const params = {
          page: currentPage,
          per_page: currentPerPage,
        };

        if (currentSearch.trim()) {
          params.search = currentSearch.trim();
        }

        if (currentBrands.length > 0) {
          params.brands = currentBrands.join(",");
        }

        if (currentCategories.length > 0) {
          params.categories = currentCategories.join(",");
        }

        if (currentStatus) {
          params.status = currentStatus;
        }

        const response = await api.get("/admin/spare-parts", {
          params,
        });

        const responseItems = getItems(response);
        const meta = getMeta(response);

        setSpareParts(responseItems);
        setTotalItems(meta.totalItems);
        setTotalPages(meta.totalPages);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load spare parts."));
        setSpareParts([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [page, perPage, search, selectedBrands, selectedCategories, status],
  );

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchSpareParts();
  }, [fetchSpareParts]);

  // Close the mobile action menu when clicking outside.
  useEffect(() => {
    if (actionMenuOpen === null) return;

    const handleClickOutside = () => setActionMenuOpen(null);

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [actionMenuOpen]);

  function handleSearchChange(value) {
    setPage(1);
    setSearch(String(value ?? "").trim());
  }

  function handleBrandsChange(ids) {
    setPage(1);
    setSelectedBrands(normalizeIds(ids));
  }

  function handleCategoriesChange(ids) {
    setPage(1);
    setSelectedCategories(normalizeIds(ids));
  }

  function handleStatusChange(value) {
    setPage(1);
    setStatus(String(value ?? ""));
  }

  function handleClearFilters() {
    setSearch("");
    setSelectedBrands([]);
    setSelectedCategories([]);
    setStatus("");
    setPage(1);
  }

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await Promise.all([
        fetchSpareParts({ showLoading: false }),
        fetchFilters(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  function handleAdd() {
    setEditingSparePart(null);
    setFormOpen(true);
  }

  function handleEdit(sparePart) {
    if (!sparePart?.id) {
      toast.error("Invalid spare part.");
      return;
    }

    setEditingSparePart(sparePart);
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setEditingSparePart(null);
  }

  async function handleSubmitForm(payload) {
    try {
      if (editingSparePart?.id) {
        await api.put(`/admin/spare-parts/${editingSparePart.id}`, payload);

        toast.success("Spare part updated successfully.");
      } else {
        await api.post("/admin/spare-parts", payload);
        toast.success("Spare part created successfully.");
      }

      handleCloseForm();

      await fetchSpareParts({ showLoading: false });
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          editingSparePart?.id
            ? "Failed to update spare part."
            : "Failed to create spare part.",
        ),
      );

      throw error;
    }
  }

  function handleOpenImages(sparePart) {
    if (!sparePart?.id) {
      toast.error("Invalid spare part.");
      return;
    }

    setSelectedImageSparePart(sparePart);
    setImageManagerOpen(true);
  }

  function handleCloseImages() {
    setImageManagerOpen(false);
    setSelectedImageSparePart(null);
  }

  function handleDeleteClick(sparePart) {
    if (!sparePart?.id) {
      toast.error("Invalid spare part.");
      return;
    }

    setDeletingSparePart(sparePart);
    setDeleteOpen(true);
  }

  function handleCloseDelete() {
    if (deleting) return;

    setDeleteOpen(false);
    setDeletingSparePart(null);
  }

  async function handleDelete() {
    if (!deletingSparePart?.id) return;

    setDeleting(true);

    try {
      await api.delete(`/admin/spare-parts/${deletingSparePart.id}`);

      toast.success("Spare part deleted successfully.");

      const nextPage = spareParts.length === 1 && page > 1 ? page - 1 : page;

      setDeleteOpen(false);
      setDeletingSparePart(null);

      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await fetchSpareParts({
          currentPage: nextPage,
          showLoading: false,
        });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete spare part."));
    } finally {
      setDeleting(false);
    }
  }

  function toggleActionMenu(event, sparePartId) {
    event.stopPropagation();

    setActionMenuOpen((current) =>
      current === sparePartId ? null : sparePartId,
    );
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
      return;
    }

    setPage(nextPage);
  }

  function handlePerPageChange(event) {
    setPerPage(Number(event.target.value));
    setPage(1);
  }

  const activeFilterCount =
    (search ? 1 : 0) +
    selectedBrands.length +
    selectedCategories.length +
    (status ? 1 : 0);

  const startItem = totalItems === 0 ? 0 : (page - 1) * perPage + 1;

  const endItem = Math.min(page * perPage, totalItems);

  function renderEmptyState() {
    return (
      <div className="px-6 py-14 text-center">
        <Package size={38} className="mx-auto text-gray-300" />

        <p className="mt-3 text-sm font-semibold text-gray-900">
          No spare parts found
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {activeFilterCount > 0
            ? "Try changing your search or filters."
            : "Start by adding a spare part."}
        </p>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-4 text-sm font-semibold text-red-600 hover:text-red-700"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  function renderActions(sparePart) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <Link
          href={`/admin/spare-parts/${sparePart.id}/variants`}
          title="Manage Variants"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-green-200 hover:bg-green-50 hover:text-green-600"
        >
          <Boxes size={16} />
        </Link>

        <button
          type="button"
          onClick={() => handleOpenImages(sparePart)}
          title="Manage Images"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        >
          <ImageIcon size={16} />
        </button>

        <button
          type="button"
          onClick={() => handleEdit(sparePart)}
          title="Edit"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
        >
          <Edit size={16} />
        </button>

        <button
          type="button"
          onClick={() => handleDeleteClick(sparePart)}
          title="Delete"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  function renderStatus(sparePart) {
    const active = getStatus(sparePart);

    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
        }`}
      >
        {active ? "Active" : "Inactive"}
      </span>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Package size={22} className="text-red-600" />

              <h1 className="text-xl font-bold text-gray-900">Spare Parts</h1>

              {!loading && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  {totalItems}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Manage spare parts, brands, categories, images, variants, and
              stock.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              <Plus size={17} />
              Add Spare Part
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <SparePartFilter
          brands={brands}
          categories={categories}
          selectedBrands={selectedBrands}
          selectedCategories={selectedCategories}
          search={search}
          status={status}
          activeFilterCount={activeFilterCount}
          onSearchChange={handleSearchChange}
          onBrandsChange={handleBrandsChange}
          onCategoriesChange={handleCategoriesChange}
          onStatusChange={handleStatusChange}
          onClear={handleClearFilters}
        />

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <SparePartTableSkeleton />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full">
                  <thead className="border-b border-gray-200 bg-gray-50/80">
                    <tr>
                      {[
                        "Spare Part",
                        "SKU / Part Number",
                        "Brand",
                        "Category",
                        "Price From",
                        "Total Stock",
                        "Status",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className={`whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 ${
                            heading === "Actions" ? "text-right" : "text-left"
                          }`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {spareParts.length === 0 ? (
                      <tr>
                        <td colSpan={8}>{renderEmptyState()}</td>
                      </tr>
                    ) : (
                      spareParts.map((sparePart) => {
                        const image = getPrimaryImage(sparePart);
                        const stock = getStock(sparePart);
                        const price = getPrice(sparePart);

                        return (
                          <tr
                            key={sparePart.id}
                            className="transition hover:bg-gray-50/80"
                          >
                            <td className="px-5 py-4">
                              <div className="flex min-w-[240px] items-center gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                                  {image ? (
                                    <img
                                      src={image}
                                      alt={sparePart.name || "Spare part"}
                                      className="h-full w-full object-contain p-1"
                                    />
                                  ) : (
                                    <Package
                                      size={22}
                                      className="text-gray-300"
                                    />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-xs truncate text-sm font-semibold text-gray-900">
                                    {sparePart.name || "-"}
                                  </p>

                                  {sparePart.short_description && (
                                    <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                                      {sparePart.short_description}
                                    </p>
                                  )}

                                  <p className="mt-1 text-xs text-gray-400">
                                    ID: {sparePart.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="font-mono text-xs font-medium text-gray-800">
                                {sparePart.sku || "-"}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Part: {sparePart.part_number || "-"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-700">
                              {sparePart.brand?.name || "-"}
                            </td>

                            <td className="px-5 py-4">
                              <span className="inline-flex rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700">
                                {sparePart.category?.name || "-"}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(price)}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  stock > 0
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {stock} unit
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              {renderStatus(sparePart)}
                            </td>

                            <td className="px-5 py-4">
                              {renderActions(sparePart)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-gray-100 md:hidden">
                {spareParts.length === 0
                  ? renderEmptyState()
                  : spareParts.map((sparePart) => {
                      const image = getPrimaryImage(sparePart);
                      const stock = getStock(sparePart);
                      const price = getPrice(sparePart);

                      return (
                        <article key={sparePart.id} className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                              {image ? (
                                <img
                                  src={image}
                                  alt={sparePart.name || "Spare part"}
                                  className="h-full w-full object-contain p-1"
                                />
                              ) : (
                                <Package size={25} className="text-gray-300" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-semibold leading-5 text-gray-900">
                                {sparePart.name || "-"}
                              </h3>

                              <p className="mt-1 font-mono text-xs text-gray-500">
                                {sparePart.sku || "-"}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {renderStatus(sparePart)}

                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                                  {sparePart.brand?.name || "No brand"}
                                </span>

                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                                  {sparePart.category?.name || "No category"}
                                </span>
                              </div>

                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Price from
                                  </p>

                                  <p className="text-sm font-bold text-gray-900">
                                    {formatCurrency(price)}
                                  </p>
                                </div>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    stock > 0
                                      ? "bg-green-50 text-green-700"
                                      : "bg-red-50 text-red-700"
                                  }`}
                                >
                                  Stock: {stock}
                                </span>
                              </div>
                            </div>

                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={(event) =>
                                  toggleActionMenu(event, sparePart.id)
                                }
                                aria-label="Product actions"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                              >
                                <MoreHorizontal size={18} />
                              </button>

                              {actionMenuOpen === sparePart.id && (
                                <div
                                  className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <Link
                                    href={`/admin/spare-parts/${sparePart.id}/variants`}
                                    onClick={() => setActionMenuOpen(null)}
                                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                                  >
                                    <Boxes size={15} />
                                    Manage Variants
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionMenuOpen(null);
                                      handleOpenImages(sparePart);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                  >
                                    <ImageIcon size={15} />
                                    Manage Images
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionMenuOpen(null);
                                      handleEdit(sparePart);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                                  >
                                    <Edit size={15} />
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionMenuOpen(null);
                                      handleDeleteClick(sparePart);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
                                  >
                                    <Trash2 size={15} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-gray-500">
                    Showing{" "}
                    <span className="font-semibold text-gray-800">
                      {startItem}-{endItem}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-800">
                      {totalItems}
                    </span>
                  </p>

                  <select
                    value={perPage}
                    onChange={handlePerPageChange}
                    aria-label="Items per page"
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none focus:border-red-500"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    aria-label="Previous page"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={17} />
                  </button>

                  {Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, index) => {
                      let pageNumber;

                      if (totalPages <= 5) {
                        pageNumber = index + 1;
                      } else if (page <= 3) {
                        pageNumber = index + 1;
                      } else if (page >= totalPages - 2) {
                        pageNumber = totalPages - 4 + index;
                      } else {
                        pageNumber = page - 2 + index;
                      }

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => handlePageChange(pageNumber)}
                          aria-current={
                            pageNumber === page ? "page" : undefined
                          }
                          className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition ${
                            pageNumber === page
                              ? "bg-red-600 text-white shadow-sm"
                              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    },
                  )}

                  <button
                    type="button"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    aria-label="Next page"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <SparePartForm
        open={formOpen}
        mode={editingSparePart ? "edit" : "create"}
        sparePart={editingSparePart}
        categories={categories}
        brands={brands}
        loading={loading}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
      />

      <SparePartImageManager
        open={imageManagerOpen}
        sparePart={selectedImageSparePart}
        onClose={handleCloseImages}
      />

      {/* Delete confirmation */}
      {deleteOpen && deletingSparePart && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-spare-part-title"
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Trash2 size={20} />
                </div>

                <div>
                  <h2
                    id="delete-spare-part-title"
                    className="text-lg font-bold text-gray-900"
                  >
                    Delete Spare Part
                  </h2>

                  <p className="mt-0.5 text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-gray-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  {deletingSparePart.name}
                </span>
                ?
              </p>

              {deletingSparePart.sku && (
                <p className="mt-2 font-mono text-xs text-gray-500">
                  SKU: {deletingSparePart.sku}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseDelete}
                disabled={deleting}
                className="h-10 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting && <RefreshCw size={15} className="animate-spin" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
