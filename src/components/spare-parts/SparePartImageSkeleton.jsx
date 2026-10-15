"use client";

export default function SparePartImageSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white"
        >
          <div className="aspect-square animate-pulse bg-gray-200" />

          <div className="space-y-2 p-3">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />

            <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
