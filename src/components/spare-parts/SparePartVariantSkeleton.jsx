"use client";

export default function SparePartVariantSkeleton() {
  const rows = Array.from({ length: 4 }, (_, index) => index);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-4">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />

        <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1050px] w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-4 py-3 text-left">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-4 py-3 text-right">
                <div className="ml-auto h-3 w-16 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-4 py-3 text-right">
                <div className="ml-auto h-3 w-24 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-4 py-3 text-right">
                <div className="ml-auto h-3 w-16 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-4 py-3 text-center">
                <div className="mx-auto h-3 w-16 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-4 py-3 text-center">
                <div className="mx-auto h-3 w-16 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-4 py-3 text-right">
                <div className="ml-auto h-3 w-16 animate-pulse rounded bg-gray-200" />
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row}>
                <td className="px-4 py-4">
                  <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />

                  <div className="mt-2 h-3 w-28 animate-pulse rounded bg-gray-100" />
                </td>

                <td className="px-4 py-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                </td>

                <td className="px-4 py-4">
                  <div className="ml-auto h-4 w-28 animate-pulse rounded bg-gray-200" />
                </td>

                <td className="px-4 py-4">
                  <div className="ml-auto h-4 w-28 animate-pulse rounded bg-gray-100" />
                </td>

                <td className="px-4 py-4">
                  <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-100" />
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-4 w-10 animate-pulse rounded bg-gray-200" />

                    <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />

                    <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="mx-auto h-6 w-16 animate-pulse rounded-full bg-gray-100" />
                </td>

                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-100" />

                    <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-100" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
        <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}
