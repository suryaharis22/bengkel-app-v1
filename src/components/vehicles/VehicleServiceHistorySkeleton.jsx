"use client";

export default function VehicleServiceHistorySkeleton({ rows = 5 }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />

          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-36 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/70">
              <th className="px-5 py-3 text-left">
                <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-4 py-3 text-left">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-4 py-3 text-left">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-4 py-3 text-center">
                <div className="mx-auto h-3 w-12 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-4 py-3 text-right">
                <div className="ml-auto h-3 w-16 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-4 py-3 text-center">
                <div className="mx-auto h-3 w-14 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-5 py-3 text-right">
                <div className="ml-auto h-3 w-14 animate-pulse rounded bg-gray-200" />
              </th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: rows }).map((_, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 last:border-0"
              >
                {/* Service Order */}
                <td className="px-5 py-4">
                  <div className="space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                  </div>
                </td>

                {/* Date */}
                <td className="px-4 py-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                </td>

                {/* Complaint */}
                <td className="px-4 py-4">
                  <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                </td>

                {/* Items */}
                <td className="px-4 py-4">
                  <div className="flex justify-center gap-2">
                    <div className="h-6 w-20 animate-pulse rounded-md bg-gray-100" />
                    <div className="h-6 w-16 animate-pulse rounded-md bg-gray-100" />
                  </div>
                </td>

                {/* Total */}
                <td className="px-4 py-4">
                  <div className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <div className="mx-auto h-7 w-24 animate-pulse rounded-full bg-gray-100" />
                </td>

                {/* Action */}
                <td className="px-5 py-4">
                  <div className="ml-auto h-9 w-24 animate-pulse rounded-lg bg-gray-100" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 p-4 md:hidden">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-4">
            {/* Top */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
              </div>

              <div className="h-7 w-24 animate-pulse rounded-full bg-gray-100" />
            </div>

            {/* Complaint */}
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />

              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            </div>

            {/* Items */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-4 w-8 animate-pulse rounded bg-gray-200" />
              </div>

              <div>
                <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-4 w-8 animate-pulse rounded bg-gray-200" />
              </div>
            </div>

            {/* Bottom */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>

              <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
