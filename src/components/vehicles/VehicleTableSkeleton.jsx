"use client";

function SkeletonBox({ className = "" }) {
  return (
    <div
      className={["animate-pulse rounded-lg bg-gray-200", className].join(" ")}
    />
  );
}

export default function VehicleTableSkeleton() {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_0.7fr_1fr_0.8fr_1.2fr_1fr] items-center gap-4">
            <SkeletonBox className="h-4 w-20" />
            <SkeletonBox className="h-4 w-16" />
            <SkeletonBox className="h-4 w-16" />
            <SkeletonBox className="h-4 w-12" />
            <SkeletonBox className="h-4 w-12" />
            <SkeletonBox className="h-4 w-16" />
            <SkeletonBox className="h-4 w-16" />
            <SkeletonBox className="ml-auto h-4 w-16" />
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[2fr_1.5fr_1fr_0.7fr_1fr_0.8fr_1.2fr_1fr] items-center gap-4 px-5 py-4"
            >
              {/* Vehicle */}
              <div className="flex min-w-0 items-center gap-3">
                <SkeletonBox className="h-10 w-10 shrink-0 rounded-lg" />

                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBox className="h-4 w-28 max-w-full" />
                  <SkeletonBox className="h-3 w-36 max-w-full" />
                </div>
              </div>

              {/* Owner */}
              <div className="space-y-2">
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-3 w-32" />
              </div>

              {/* Type */}
              <SkeletonBox className="h-6 w-20 rounded-full" />

              {/* Year */}
              <SkeletonBox className="h-4 w-12" />

              {/* Color */}
              <SkeletonBox className="h-4 w-16" />

              {/* Services */}
              <SkeletonBox className="h-6 w-8 rounded-full" />

              {/* Created */}
              <SkeletonBox className="h-4 w-24" />

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <SkeletonBox className="h-8 w-14 rounded-lg" />
                <SkeletonBox className="h-8 w-14 rounded-lg" />
                <SkeletonBox className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <SkeletonBox className="h-9 w-9 shrink-0 rounded-lg" />

                <div className="min-w-0 space-y-2">
                  <SkeletonBox className="h-4 w-28" />
                  <SkeletonBox className="h-3 w-36" />
                </div>
              </div>

              <SkeletonBox className="h-6 w-20 shrink-0 rounded-full" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <SkeletonBox className="h-3 w-12" />
                <SkeletonBox className="mt-2 h-4 w-24" />
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <SkeletonBox className="h-3 w-14" />
                <SkeletonBox className="mt-2 h-4 w-8" />
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <SkeletonBox className="h-3 w-10" />
                <SkeletonBox className="mt-2 h-4 w-12" />
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <SkeletonBox className="h-3 w-10" />
                <SkeletonBox className="mt-2 h-4 w-16" />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
              <SkeletonBox className="h-9 w-16 rounded-lg" />
              <SkeletonBox className="h-9 w-16 rounded-lg" />
              <SkeletonBox className="h-9 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
