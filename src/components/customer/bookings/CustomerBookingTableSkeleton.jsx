"use client";

export default function CustomerBookingTableSkeleton() {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white md:block">
        <div className="border-b border-gray-200 bg-gray-50/80 px-5 py-4">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-5">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-64 animate-pulse rounded bg-gray-100" />
              </div>

              <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />

              <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />

              <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-gray-200" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
