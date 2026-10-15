export default function UserTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px]">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-5 py-3 text-left">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
            </th>

            <th className="px-5 py-3 text-left">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            </th>

            <th className="px-5 py-3 text-left">
              <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
            </th>

            <th className="px-5 py-3 text-left">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
            </th>

            <th className="px-5 py-3 text-right">
              <div className="ml-auto h-3 w-16 animate-pulse rounded bg-gray-200" />
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, index) => (
            <tr key={index}>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />

                  <div className="space-y-2">
                    <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />

                    <div className="h-2.5 w-16 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              </td>

              <td className="px-5 py-4">
                <div className="space-y-2">
                  <div className="h-3 w-44 animate-pulse rounded bg-gray-200" />

                  <div className="h-2.5 w-28 animate-pulse rounded bg-gray-200" />
                </div>
              </td>

              <td className="px-5 py-4">
                <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
              </td>

              <td className="px-5 py-4">
                <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
              </td>

              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />

                  <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
