export default function SparePartCategoryTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="animate-pulse">
        <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="col-span-1 h-4 rounded bg-gray-200" />
          <div className="col-span-3 h-4 rounded bg-gray-200" />
          <div className="col-span-2 h-4 rounded bg-gray-200" />
          <div className="col-span-2 h-4 rounded bg-gray-200" />
          <div className="col-span-2 h-4 rounded bg-gray-200" />
          <div className="col-span-2 h-4 rounded bg-gray-200" />
        </div>

        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-12 items-center gap-4 border-b border-gray-100 px-6 py-4 last:border-b-0"
          >
            <div className="col-span-1 h-4 w-8 rounded bg-gray-200" />

            <div className="col-span-3 space-y-2">
              <div className="h-4 w-36 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>

            <div className="col-span-2 h-4 w-24 rounded bg-gray-200" />

            <div className="col-span-2 h-6 w-16 rounded-full bg-gray-200" />

            <div className="col-span-2 h-4 w-12 rounded bg-gray-200" />

            <div className="col-span-2 flex justify-end gap-2">
              <div className="h-8 w-8 rounded-lg bg-gray-200" />
              <div className="h-8 w-8 rounded-lg bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
