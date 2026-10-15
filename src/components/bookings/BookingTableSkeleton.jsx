"use client";

export default function BookingTableSkeleton() {
  const rows = Array.from({ length: 8 });

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="px-5 py-3.5 text-left">
                  <div className="h-3 w-5 animate-pulse rounded bg-gray-200" />
                </th>
                <th className="px-5 py-3.5 text-left">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                </th>
                <th className="px-5 py-3.5 text-left">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                </th>
                <th className="px-5 py-3.5 text-left">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                </th>
                <th className="px-5 py-3.5 text-left">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                </th>
                <th className="px-5 py-3.5 text-left">
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                </th>
                <th className="px-5 py-3.5 text-right">
                  <div className="ml-auto h-3 w-16 animate-pulse rounded bg-gray-200" />
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {rows.map((_, index) => (
                <tr key={index}>
                  <td className="px-5 py-4">
                    <div className="h-4 w-5 animate-pulse rounded bg-gray-100" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
                    <div className="mt-2 h-3 w-20 animate-pulse rounded bg-gray-100" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                    <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-100" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="ml-auto h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.slice(0, 5).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-100" />
              </div>

              <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              <div>
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-4 w-28 animate-pulse rounded bg-gray-100" />
              </div>

              <div>
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-4 w-24 animate-pulse rounded bg-gray-100" />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
