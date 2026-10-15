"use client";

import { useEffect, useState } from "react";
import { PackagePlus, Plus } from "lucide-react";
import { toast } from "sonner";

import CashierProductDetailModal from "./CashierProductDetailModal";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getImageUrl(imageUrl) {
  if (!imageUrl) return "";

  // URL absolut tidak perlu diubah.
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

  // Contoh: /uploads/spare-parts/gambar.jpg
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;

  if (!baseUrl) return path;

  try {
    return new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).href;
  } catch {
    return path;
  }
}

function getPrimaryImage(images = []) {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  // Prioritaskan gambar utama, lalu urutan gambar.
  return (
    [...images].sort((a, b) => {
      if (a.is_primary !== b.is_primary) {
        return Number(b.is_primary) - Number(a.is_primary);
      }

      const sortOrderDifference =
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);

      if (sortOrderDifference !== 0) {
        return sortOrderDifference;
      }

      return Number(a.id ?? 0) - Number(b.id ?? 0);
    })[0] ?? null
  );
}

export default function CashierProductCard({ product, onAdd }) {
  const [imageError, setImageError] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const sparePart = product?.spare_part ?? {};
  const stock = Number(product?.stock?.stock ?? 0);
  const isOutOfStock = stock <= 0;

  // Nama katalog utama berada di spare_part.
  const productName = sparePart.name || product?.name || "Produk";

  const sparePartId = product?.spare_part_id ?? sparePart.id;

  // Gambar sudah tersedia dalam response API.
  const images = sparePart.images ?? [];
  const primaryImage = getPrimaryImage(images);
  const imageUrl = getImageUrl(primaryImage?.image_url);

  // Reset error saat gambar produk berubah.
  useEffect(() => {
    setImageError(false);
  }, [sparePartId, primaryImage?.id, primaryImage?.image_url]);

  // Jika gambar utama gagal, coba gambar lain.
  const fallbackImages = Array.isArray(images)
    ? [...images]
        .filter((image) => image.image_url !== primaryImage?.image_url)
        .sort((a, b) => {
          if (a.is_primary !== b.is_primary) {
            return Number(b.is_primary) - Number(a.is_primary);
          }

          return Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
        })
    : [];

  const [fallbackIndex, setFallbackIndex] = useState(0);

  useEffect(() => {
    setFallbackIndex(0);
  }, [sparePartId, primaryImage?.id, primaryImage?.image_url]);

  const currentImage = imageError
    ? fallbackImages[fallbackIndex]
    : primaryImage;

  const currentImageUrl = getImageUrl(currentImage?.image_url);
  const hasImage = Boolean(currentImageUrl);

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setFallbackIndex(0);
      return;
    }

    setFallbackIndex((current) => current + 1);
  };

  const handleAdd = (event) => {
    event.stopPropagation();

    if (isOutOfStock) {
      toast.error("Stok produk habis.");
      return;
    }

    // Tambahkan satu unit langsung ke keranjang.
    onAdd(product);
  };

  const handleConfirmAdd = (quantity) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > stock) {
      toast.error("Jumlah produk melebihi stok yang tersedia.");
      return;
    }

    onAdd({
      ...product,
      quantity,
    });

    setIsDetailOpen(false);
  };

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={() => setIsDetailOpen(true)}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsDetailOpen(true);
          }
        }}
        className="cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white text-left transition hover:border-red-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-red-200"
      >
        {/* Gambar spare part berdasarkan spare_part_id */}
        <div className="flex aspect-square items-center justify-center overflow-hidden bg-gray-100">
          {hasImage ? (
            <img
              key={currentImageUrl}
              src={currentImageUrl}
              alt={productName}
              loading="lazy"
              onError={handleImageError}
              className="h-full w-full object-cover transition duration-200 hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
              <PackagePlus size={32} />
              <span className="text-xs">
                {sparePartId ? "No image" : "Image unavailable"}
              </span>
            </div>
          )}
        </div>

        <div className="p-3">
          <p className="line-clamp-2 min-h-10 text-sm font-medium text-gray-900">
            {productName}
          </p>

          {/* Nama varian, misalnya 0,8 Liter atau 1 Liter */}
          <p className="mt-1 truncate text-xs text-gray-500">
            Varian: {product?.name || "-"}
          </p>

          <p className="mt-1 truncate text-xs text-gray-500">
            {sparePart.brand?.name || "Tanpa merek"}
          </p>

          <p className="mt-1 truncate text-xs text-gray-500">
            SKU: {product?.sku || sparePart.sku || "-"}
          </p>

          <div className="mt-3 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-600">
                {formatCurrency(product?.price)}
              </p>

              <p className="mt-1 text-xs text-gray-500">Stok: {stock}</p>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={isOutOfStock}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>
      </article>

      {isDetailOpen && (
        <CashierProductDetailModal
          product={product}
          images={product?.spare_part?.images ?? []}
          imageUrl={currentImageUrl}
          stock={stock}
          onClose={() => setIsDetailOpen(false)}
          onConfirmAdd={handleConfirmAdd}
        />
      )}
    </>
  );
}
