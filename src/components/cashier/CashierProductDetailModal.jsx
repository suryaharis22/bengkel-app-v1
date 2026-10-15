"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Minus,
  Plus,
  X,
  PackagePlus,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Tag,
  Boxes,
  Barcode,
  ImageOff,
} from "lucide-react";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getImageUrl(imageUrl) {
  if (!imageUrl) return "";

  if (/^https?:\/\//i.test(imageUrl)) {
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

function sortImages(images = []) {
  if (!Array.isArray(images)) return [];

  return [...images]
    .filter((image) => image?.image_url)
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) {
        return Number(b.is_primary) - Number(a.is_primary);
      }

      const orderDifference =
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);

      if (orderDifference !== 0) return orderDifference;

      return Number(a.id ?? 0) - Number(b.id ?? 0);
    });
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm">
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-gray-800">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

export default function CashierProductDetailModal({
  product,
  images = [],
  imageUrl,
  stock,
  onClose,
  onConfirmAdd,
}) {
  const [quantity, setQuantity] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState([]);

  const sparePart = product?.spare_part ?? {};
  const brand = sparePart.brand ?? {};
  const category = sparePart.category ?? {};

  const productName = sparePart.name || product?.name || "Produk";
  const price = Number(product?.price) || 0;
  const comparePrice = Number(product?.compare_price) || 0;
  const availableStock = Math.max(0, Number(stock) || 0);
  const total = price * quantity;
  const isInactive = product?.status === false;
  const isUnavailable = availableStock <= 0 || isInactive;

  const slides = useMemo(() => {
    const sorted = sortImages(images)
      .map((image) => ({
        id: image.id ?? image.image_url,
        image_url: image.image_url,
        url: getImageUrl(image.image_url),
        is_primary: Boolean(image.is_primary),
        sort_order: image.sort_order ?? 0,
      }))
      .filter((image) => image.url);

    if (sorted.length === 0 && imageUrl) {
      return [
        {
          id: "fallback-image",
          image_url: imageUrl,
          url: getImageUrl(imageUrl),
          is_primary: true,
          sort_order: 0,
        },
      ];
    }

    return sorted;
  }, [images, imageUrl]);

  const currentSlide = slides[activeIndex] ?? null;
  const currentImageFailed = currentSlide
    ? failedImages.includes(currentSlide.id)
    : true;

  useEffect(() => {
    setActiveIndex(0);
    setQuantity(1);
    setFailedImages([]);
  }, [product?.id, product?.spare_part_id]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft" && slides.length > 1) {
        setActiveIndex((current) =>
          current <= 0 ? slides.length - 1 : current - 1,
        );
      }

      if (event.key === "ArrowRight" && slides.length > 1) {
        setActiveIndex((current) =>
          current >= slides.length - 1 ? 0 : current + 1,
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, slides.length]);

  const goToPrevious = () => {
    setActiveIndex((current) =>
      current <= 0 ? slides.length - 1 : current - 1,
    );
  };

  const goToNext = () => {
    setActiveIndex((current) =>
      current >= slides.length - 1 ? 0 : current + 1,
    );
  };

  const handleImageError = (imageId) => {
    setFailedImages((current) =>
      current.includes(imageId) ? current : [...current, imageId],
    );
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    setQuantity((current) => Math.min(availableStock, current + 1));
  };

  const handleQuantityInput = (event) => {
    const rawValue = event.target.value;

    if (rawValue === "") {
      setQuantity(1);
      return;
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value)) return;

    setQuantity(Math.max(1, Math.min(availableStock || 1, Math.floor(value))));
  };

  const handleConfirmAdd = () => {
    if (isUnavailable) return;
    if (quantity < 1 || quantity > availableStock) return;

    onConfirmAdd(quantity);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        className="my-auto flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
              Kasir / Detail Produk
            </p>
            <h2 className="mt-1 text-lg font-bold text-gray-900 sm:text-xl">
              Informasi Produk
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-2 lg:gap-8 lg:p-7">
            {/* Galeri gambar */}
            <div className="min-w-0">
              <div className="relative flex aspect-square max-h-[480px] items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 sm:aspect-[5/4] lg:aspect-square">
                {currentSlide && !currentImageFailed ? (
                  <img
                    key={currentSlide.id}
                    src={currentSlide.url}
                    alt={`${productName} - gambar ${activeIndex + 1}`}
                    onError={() => handleImageError(currentSlide.id)}
                    className="h-full w-full object-contain p-5 sm:p-8"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <ImageOff size={36} strokeWidth={1.5} />
                    </div>
                    <span className="text-sm">Gambar tidak tersedia</span>
                  </div>
                )}

                {currentSlide?.is_primary && (
                  <span className="absolute left-4 top-4 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                    Gambar Utama
                  </span>
                )}

                {slides.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goToPrevious}
                      aria-label="Gambar sebelumnya"
                      className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white/95 text-gray-800 shadow-md transition hover:scale-105 hover:bg-white"
                    >
                      <ChevronLeft size={24} />
                    </button>

                    <button
                      type="button"
                      onClick={goToNext}
                      aria-label="Gambar berikutnya"
                      className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white/95 text-gray-800 shadow-md transition hover:scale-105 hover:bg-white"
                    >
                      <ChevronRight size={24} />
                    </button>

                    <span className="absolute bottom-4 right-4 rounded-lg bg-gray-950/75 px-3 py-1.5 text-xs font-semibold text-white">
                      {activeIndex + 1} / {slides.length}
                    </span>
                  </>
                )}
              </div>

              {/* Thumbnail */}
              {slides.length > 1 && (
                <div className="mt-4">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {slides.map((image, index) => {
                      const hasFailed = failedImages.includes(image.id);
                      const isActive = activeIndex === index;

                      return (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => setActiveIndex(index)}
                          aria-label={`Lihat gambar ${index + 1}`}
                          aria-pressed={isActive}
                          className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-gray-50 transition sm:h-24 sm:w-24 ${
                            isActive
                              ? "border-red-600 ring-2 ring-red-100"
                              : "border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          {!hasFailed ? (
                            <img
                              src={image.url}
                              alt={`Thumbnail ${index + 1}`}
                              loading="lazy"
                              onError={() => handleImageError(image.id)}
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">
                              <PackagePlus size={24} />
                            </div>
                          )}

                          {image.is_primary && (
                            <span className="absolute inset-x-0 bottom-0 bg-red-600/90 py-1 text-center text-[9px] font-bold text-white">
                              UTAMA
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    {slides.length} gambar produk · Gunakan panah untuk melihat
                    gambar lainnya
                  </p>
                </div>
              )}
            </div>

            {/* Detail produk */}
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-2">
                {brand.name && (
                  <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                    {brand.name}
                  </span>
                )}

                {category.name && (
                  <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                    {category.name}
                  </span>
                )}

                <span
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    availableStock > 0 && !isInactive
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {isInactive
                    ? "Tidak aktif"
                    : availableStock > 0
                      ? "Tersedia"
                      : "Stok habis"}
                </span>
              </div>

              <h3
                id="product-detail-title"
                className="mt-4 text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl"
              >
                {productName}
              </h3>

              {product?.name && (
                <p className="mt-2 text-sm text-gray-500">
                  Varian:{" "}
                  <span className="font-medium text-gray-700">
                    {product.name}
                  </span>
                </p>
              )}

              {sparePart.short_description && (
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {sparePart.short_description}
                </p>
              )}

              {/* Informasi utama */}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoItem
                  icon={Barcode}
                  label="SKU Varian"
                  value={product?.sku}
                />

                <InfoItem icon={Tag} label="SKU Produk" value={sparePart.sku} />

                <InfoItem
                  icon={PackagePlus}
                  label="Nomor Part"
                  value={sparePart.part_number}
                />

                <InfoItem
                  icon={Boxes}
                  label="Stok Tersedia"
                  value={`${availableStock} unit`}
                />
              </div>

              {/* Deskripsi */}
              {sparePart.description && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-900">
                    Deskripsi Produk
                  </h4>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                    {sparePart.description}
                  </p>
                </div>
              )}

              {/* Harga */}
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/60 p-4 sm:p-5">
                <p className="text-sm font-medium text-gray-600">
                  Harga satuan
                </p>

                <div className="mt-1 flex flex-wrap items-baseline gap-3">
                  <p className="text-2xl font-extrabold tracking-tight text-red-600 sm:text-3xl">
                    {formatCurrency(price)}
                  </p>

                  {comparePrice > price && (
                    <p className="text-sm text-gray-400 line-through">
                      {formatCurrency(comparePrice)}
                    </p>
                  )}
                </div>
              </div>

              {/* Pilih jumlah */}
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="product-quantity"
                    className="text-sm font-bold text-gray-900"
                  >
                    Jumlah pembelian
                  </label>

                  <span className="text-xs text-gray-500">
                    Maks. {availableStock} unit
                  </span>
                </div>

                <div className="mt-3 flex max-w-sm items-center gap-3">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1 || isUnavailable}
                    aria-label="Kurangi jumlah"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={18} />
                  </button>

                  <input
                    id="product-quantity"
                    type="number"
                    min={1}
                    max={availableStock}
                    value={quantity}
                    disabled={isUnavailable}
                    onChange={handleQuantityInput}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white text-center text-base font-bold text-gray-900 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-gray-100"
                  />

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={quantity >= availableStock || isUnavailable}
                    aria-label="Tambah jumlah"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="shrink-0 border-t border-gray-100 bg-white px-4 py-4 sm:px-7 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-gray-500">
                Total harga · {quantity} unit
              </p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                {formatCurrency(total)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:flex-none"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmAdd}
                disabled={isUnavailable}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 sm:flex-none"
              >
                <ShoppingCart size={18} />
                Tambah ke Keranjang
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
