"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Boxes, Loader2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import SparePartVariantList from "@/components/spare-parts/SparePartVariantList";
import SparePartVariantSkeleton from "@/components/spare-parts/SparePartVariantSkeleton";
import SparePartVariantForm from "@/components/spare-parts/SparePartVariantForm";
import SparePartStockManager from "@/components/spare-parts/SparePartStockManager";

export default function SparePartVariantsPage() {
  const params = useParams();

  const sparePartId = params?.id;

  const [sparePart, setSparePart] = useState(null);
  const [variants, setVariants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  const [stockManagerOpen, setStockManagerOpen] = useState(false);
  const [selectedStockVariant, setSelectedStockVariant] = useState(null);

  const fetchSparePart = useCallback(async () => {
    if (!sparePartId) {
      return;
    }

    try {
      const response = await api.get(`/admin/spare-parts/${sparePartId}`);

      const data = response.data?.data;

      setSparePart(data?.sparePart || data || null);
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);

      toast.error(axiosError.message || "Failed to load spare part.");

      setSparePart(null);
    }
  }, [sparePartId]);

  const fetchVariants = useCallback(async () => {
    if (!sparePartId) {
      setVariants([]);
      return [];
    }

    try {
      setLoading(true);

      const response = await api.get(
        `/admin/spare-parts/${sparePartId}/variants`,
      );

      const data = response.data?.data;

      const nextVariants = Array.isArray(data?.variants)
        ? data.variants
        : Array.isArray(data)
          ? data
          : [];

      setVariants(nextVariants);

      return nextVariants;
    } catch (requestError) {
      const axiosError = getAxiosError(requestError);

      toast.error(axiosError.message || "Failed to load spare part variants.");

      setVariants([]);

      return [];
    } finally {
      setLoading(false);
    }
  }, [sparePartId]);

  useEffect(() => {
    if (!sparePartId) {
      return;
    }

    fetchSparePart();
    fetchVariants();
  }, [sparePartId, fetchSparePart, fetchVariants]);

  const handleRefreshVariants = useCallback(async () => {
    if (!sparePartId) {
      return [];
    }

    try {
      setRefreshing(true);

      const nextVariants = await fetchVariants();

      /*
       * Jika stock manager sedang terbuka,
       * cari kembali variant yang sedang dipilih
       * dari data terbaru.
       */
      if (selectedStockVariant?.id) {
        const updatedVariant = nextVariants.find(
          (item) => item.id === selectedStockVariant.id,
        );

        if (updatedVariant) {
          setSelectedStockVariant(updatedVariant);
        }
      }

      return nextVariants;
    } finally {
      setRefreshing(false);
    }
  }, [sparePartId, fetchVariants, selectedStockVariant?.id]);

  function handleAddVariant() {
    setEditingVariant(null);
    setFormOpen(true);
  }

  function handleEditVariant(variant) {
    setEditingVariant(variant);
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setEditingVariant(null);
  }

  async function handleVariantSaved() {
    handleCloseForm();
    await handleRefreshVariants();
  }

  const handleVariantChanged = useCallback(async () => {
    await handleRefreshVariants();
  }, [handleRefreshVariants]);

  function handleOpenStockManager(variant) {
    if (!variant?.id) {
      toast.error("Invalid variant.");
      return;
    }

    if (formOpen) {
      return;
    }

    setSelectedStockVariant(variant);
    setStockManagerOpen(true);
  }

  function handleCloseStockManager() {
    setStockManagerOpen(false);
    setSelectedStockVariant(null);
  }

  /*
   * Dipanggil oleh SparePartStockManager
   * setelah stock berhasil berubah.
   */
  const handleStockChanged = useCallback(
    async (latestStock) => {
      if (!latestStock || !selectedStockVariant?.id) {
        return;
      }

      const variantId = selectedStockVariant.id;

      /*
       * Update variant di list secara langsung
       * menggunakan data stock terbaru.
       *
       * Ini membuat UI langsung berubah tanpa
       * harus menunggu request GET variants.
       */
      setVariants((currentVariants) =>
        currentVariants.map((item) =>
          item.id === variantId
            ? {
                ...item,
                stock: latestStock.stock,
                reserved_stock: latestStock.reserved_stock,
                available_stock: latestStock.available_stock,
                minimum_stock: latestStock.minimum_stock,
                stock_status: latestStock.stock_status,
              }
            : item,
        ),
      );

      /*
       * Update variant yang sedang digunakan
       * oleh Stock Manager.
       */
      setSelectedStockVariant((currentVariant) => {
        if (!currentVariant) {
          return currentVariant;
        }

        return {
          ...currentVariant,
          stock: latestStock.stock,
          reserved_stock: latestStock.reserved_stock,
          available_stock: latestStock.available_stock,
          minimum_stock: latestStock.minimum_stock,
          stock_status: latestStock.stock_status,
        };
      });

      /*
       * Tetap ambil ulang variants dari server.
       *
       * Ini berguna apabila API variants juga
       * mengembalikan data lain yang ikut berubah.
       */
      try {
        const nextVariants = await fetchVariants();

        const updatedVariant = nextVariants.find(
          (item) => item.id === variantId,
        );

        if (updatedVariant) {
          /*
           * Jika endpoint variants tidak mengirim
           * field stock, jangan sampai data stock
           * terbaru yang sudah kita dapatkan hilang.
           */
          const mergedVariant = {
            ...updatedVariant,
            stock: latestStock.stock,
            reserved_stock: latestStock.reserved_stock,
            available_stock: latestStock.available_stock,
            minimum_stock: latestStock.minimum_stock,
            stock_status: latestStock.stock_status,
          };

          setVariants((currentVariants) =>
            currentVariants.map((item) =>
              item.id === variantId ? mergedVariant : item,
            ),
          );

          setSelectedStockVariant((currentVariant) =>
            currentVariant
              ? {
                  ...currentVariant,
                  ...mergedVariant,
                }
              : currentVariant,
          );
        }
      } catch (error) {
        console.error("Failed to refresh variants after stock change:", error);
      }
    },
    [selectedStockVariant?.id, fetchVariants],
  );

  if (loading && !sparePart) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/spare-parts"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
            aria-label="Back to spare parts"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-100" />
          </div>
        </div>

        <SparePartVariantSkeleton />
      </div>
    );
  }

  if (!sparePart) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/spare-parts"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
            aria-label="Back to spare parts"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Spare Part Variants
            </h1>

            <p className="mt-1 text-sm text-gray-500">Spare part not found.</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            The requested spare part could not be found.
          </p>

          <Link
            href="/admin/spare-parts"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Back to Spare Parts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/admin/spare-parts"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
            aria-label="Back to spare parts"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <Boxes size={19} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-gray-900">
                Manage Variants
              </h1>

              <p className="mt-1 truncate text-sm text-gray-500">
                {sparePart.name}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefreshVariants}
          disabled={loading || refreshing || formOpen || stockManagerOpen}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Refreshing...
            </>
          ) : (
            "Refresh"
          )}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Spare Part
            </p>

            <p className="mt-1 truncate text-sm font-medium text-gray-900">
              {sparePart.name}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              SKU
            </p>

            <p className="mt-1 font-mono text-sm text-gray-700">
              {sparePart.sku || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Total Variants
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {variants.length}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <SparePartVariantSkeleton />
      ) : (
        <SparePartVariantList
          sparePartId={sparePart.id}
          variants={variants}
          loading={loading}
          disabled={refreshing || formOpen || stockManagerOpen}
          onAdd={handleAddVariant}
          onEdit={handleEditVariant}
          onStock={handleOpenStockManager}
          onChanged={handleVariantChanged}
        />
      )}

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-xs text-gray-500">
          {refreshing ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={13} className="animate-spin" />
              Refreshing variants...
            </span>
          ) : (
            "Manage spare part variants, pricing, and stock."
          )}
        </p>

        <Link
          href="/admin/spare-parts"
          className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      <SparePartVariantForm
        open={formOpen}
        sparePartId={sparePart.id}
        variant={editingVariant}
        onClose={handleCloseForm}
        onSaved={handleVariantSaved}
      />

      <SparePartStockManager
        open={stockManagerOpen}
        variant={selectedStockVariant}
        onClose={handleCloseStockManager}
        onChanged={handleStockChanged}
      />
    </div>
  );
}
