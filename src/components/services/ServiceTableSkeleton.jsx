export default function ServiceTableSkeleton() {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[850px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left">
              <th className="w-16 px-5 py-3">
                <div className="h-3 w-6 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-5 py-3">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-5 py-3">
                <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-5 py-3">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-5 py-3">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              </th>

              <th className="px-5 py-3">
                <div className="ml-auto h-3 w-16 animate-pulse rounded bg-gray-200" />
              </th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 6 }).map((_, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 last:border-b-0"
              >
                <td className="px-5 py-4">
                  <div className="h-4 w-6 animate-pulse rounded bg-gray-200" />
                </td>

                <td className="px-5 py-4">
                  <div className="space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-56 animate-pulse rounded bg-gray-100" />
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                </td>

                <td className="px-5 py-4">
                  <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                </td>

                <td className="px-5 py-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                </td>

                <td className="px-5 py-4">
                  <div className="ml-auto h-8 w-20 animate-pulse rounded-lg bg-gray-200" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-gray-100 lg:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-56 animate-pulse rounded bg-gray-100" />
              </div>

              <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
