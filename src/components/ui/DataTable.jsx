"use client";

import { isValidElement } from "react";

export default function DataTable({
  columns = [],
  data = [],
  rowKey = "id",
  loading = false,
  emptyMessage = "No data found",
  emptyDescription = "",
  emptyIcon = null,
  skeleton = null,
  renderMobile = null,
  renderActions = null,
  actionsLabel = "Actions",
  className = "",
  tableClassName = "",
}) {
  const getRowKey = (item, index) => {
    const key = typeof rowKey === "function" ? rowKey(item) : item?.[rowKey];

    return key ?? index;
  };

  const wrapperClass = ["block w-full min-w-0", className]
    .filter(Boolean)
    .join(" ");

  // Loading
  if (loading && skeleton) {
    return <div className={wrapperClass}>{skeleton}</div>;
  }

  // Empty state
  if (!loading && data.length === 0) {
    let renderedEmptyIcon = null;

    if (isValidElement(emptyIcon)) {
      renderedEmptyIcon = emptyIcon;
    } else if (typeof emptyIcon === "function") {
      const EmptyIcon = emptyIcon;
      renderedEmptyIcon = <EmptyIcon size={28} aria-hidden="true" />;
    }

    return (
      <div
        className={[
          wrapperClass,
          "rounded-xl border border-dashed border-gray-200",
          "bg-white px-4 py-10 sm:px-6 sm:py-12",
        ].join(" ")}
      >
        <div className="mx-auto flex w-full min-w-0 max-w-md flex-col items-center text-center">
          {renderedEmptyIcon && (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              {renderedEmptyIcon}
            </div>
          )}

          <h3 className="mt-4 break-words text-base font-semibold text-gray-900">
            {emptyMessage}
          </h3>

          {emptyDescription && (
            <p className="mt-2 break-words text-sm leading-6 text-gray-500">
              {emptyDescription}
            </p>
          )}
        </div>
      </div>
    );
  }

  const headers = (
    <>
      {columns.map((column) => (
        <th
          key={column.key}
          scope="col"
          className={[
            "whitespace-nowrap px-4 py-3.5",
            "text-left text-[11px] font-semibold",
            "uppercase tracking-wider text-gray-500",
            "sm:px-5",
            column.headerClassName || "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {column.label}
        </th>
      ))}

      {renderActions && (
        <th
          scope="col"
          className="whitespace-nowrap px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 sm:px-5"
        >
          {actionsLabel}
        </th>
      )}
    </>
  );

  const bodyRows = data.map((item, index) => (
    <tr
      key={getRowKey(item, index)}
      className="transition-colors duration-150 hover:bg-gray-50/70"
    >
      {columns.map((column) => (
        <td
          key={column.key}
          className={[
            "px-4 py-4 align-middle text-sm text-gray-700 sm:px-5",
            column.cellClassName || "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {column.render
            ? column.render(item, index)
            : (item?.[column.key] ?? "-")}
        </td>
      ))}

      {renderActions && (
        <td className="whitespace-nowrap px-4 py-4 align-middle sm:px-5">
          {renderActions(item, index)}
        </td>
      )}
    </tr>
  ));

  // Mobile cards, if supplied by the caller
  if (renderMobile) {
    return (
      <div className={wrapperClass}>
        <div className="flex w-full min-w-0 flex-col gap-3 md:hidden">
          {data.map((item, index) => (
            <div key={getRowKey(item, index)} className="w-full min-w-0">
              {renderMobile(item, index)}
            </div>
          ))}
        </div>

        <div className="hidden w-full min-w-0 md:block">
          <div className="w-full overflow-x-auto overscroll-x-contain">
            <table
              className={[
                "w-full min-w-[860px] border-collapse",
                tableClassName,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  {headers}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">{bodyRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Single horizontal scroll container for all screen sizes
  return (
    <div className={wrapperClass}>
      <div
        className="block w-full min-w-0 overflow-x-auto overscroll-x-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table
          className={[
            "w-full min-w-[760px] border-collapse",
            "text-left",
            tableClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              {headers}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">{bodyRows}</tbody>
        </table>
      </div>
    </div>
  );
}
