"use client";

export default function CustomerVehicleTableSkeleton() {
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                {[
                  "Vehicle",
                  "Brand",
                  "Model",
                  "Year",
                  "Color",
                  "Added",
                  "Actions",
                ].map((label) => (
                  <th
                    key={label}
                    className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {Array.from({
                    length: 7,
                  }).map((_, cellIndex) => (
                    <td key={cellIndex} className="px-5 py-5">
                      <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-4"
          >
            <div className="flex gap-3">
              <div className="h-11 w-11 animate-pulse rounded-xl bg-gray-100" />

              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />

                <div className="h-3 w-44 animate-pulse rounded bg-gray-100" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
              <div className="space-y-2">
                <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />

                <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />

                <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
