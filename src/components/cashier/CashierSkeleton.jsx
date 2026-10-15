export default function CashierSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white"
        >
          <div className="aspect-square animate-pulse bg-gray-200" />

          <div className="space-y-3 p-3">
            <div className="h-4 animate-pulse rounded bg-gray-200" />

            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />

            <div className="flex justify-between">
              <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />

              <div className="h-6 w-12 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
