"use client";

export default function BrandTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Brand
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Slug
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Description
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Created
              </th>

              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />

                    <div className="space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />

                      <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                </td>

                <td className="px-6 py-4">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                </td>

                <td className="px-6 py-4">
                  <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                </td>

                <td className="px-6 py-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                </td>

                <td className="px-6 py-4">
                  <div className="ml-auto h-8 w-20 animate-pulse rounded bg-gray-200" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />

        <div className="flex gap-2">
          <div className="h-9 w-20 animate-pulse rounded bg-gray-200" />

          <div className="h-9 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
