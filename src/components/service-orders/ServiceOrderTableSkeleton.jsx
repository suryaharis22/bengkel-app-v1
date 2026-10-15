"use client";

export default function ServiceOrderTableSkeleton() {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[1.2fr_1.2fr_1fr_1fr_1fr_100px] border-b border-gray-200 bg-gray-50/80 px-5 py-4">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              <div className="ml-auto h-3 w-16 animate-pulse rounded bg-gray-200" />
            </div>

            <div className="divide-y divide-gray-100">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1.2fr_1.2fr_1fr_1fr_1fr_100px] items-center gap-4 px-5 py-5"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                  </div>

                  <div className="space-y-2">
                    <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                  </div>

                  <div className="h-6 w-24 animate-pulse rounded-full bg-gray-100" />

                  <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />

                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />

                  <div className="ml-auto h-9 w-16 animate-pulse rounded-lg bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              </div>

              <div className="h-6 w-24 animate-pulse rounded-full bg-gray-100" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-3">
              <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
