"use client";

export default function SparePartTableSkeleton() {
  return (
    <div className="overflow-hidden">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {[
                "#",
                "Spare Part",
                "SKU",
                "Category",
                "Brand",
                "Price",
                "Status",
                "Featured",
                "Actions",
              ].map((label) => (
                <th
                  key={label}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 last:border-b-0"
              >
                <td className="px-5 py-4">
                  <div className="h-4 w-6 animate-pulse rounded bg-gray-200" />
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 animate-pulse rounded-lg bg-gray-200" />

                    <div className="space-y-2">
                      <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />

                      <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                </td>

                <td className="px-5 py-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                </td>

                <td className="px-5 py-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                </td>

                <td className="px-5 py-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                </td>

                <td className="px-5 py-4">
                  <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                </td>

                <td className="px-5 py-4">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
                </td>

                <td className="px-5 py-4">
                  <div className="ml-auto h-8 w-20 animate-pulse rounded bg-gray-200" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-gray-100 lg:hidden">
        {Array.from({
          length: 5,
        }).map((_, index) => (
          <div key={index} className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-gray-200" />

              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />

                <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
              </div>

              <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />

                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />

                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <div className="h-9 w-16 animate-pulse rounded-lg bg-gray-200" />

              <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
