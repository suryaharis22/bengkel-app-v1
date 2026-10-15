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
  if (loading && skeleton) {
    return skeleton;
  }

  if (!loading && data.length === 0) {
    const EmptyIcon = emptyIcon;

    const renderedEmptyIcon = isValidElement(EmptyIcon) ? (
      EmptyIcon
    ) : typeof EmptyIcon === "function" ||
      (typeof EmptyIcon === "object" &&
        EmptyIcon !== null &&
        "$$typeof" in EmptyIcon) ? (
      <EmptyIcon size={28} />
    ) : null;

    return (
      <div
        className={[
          "flex min-h-[280px] items-center justify-center",
          "rounded-2xl border border-dashed border-gray-200",
          "bg-white px-6 py-12",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="max-w-md text-center">
          {renderedEmptyIcon ? (
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              {renderedEmptyIcon}
            </div>
          ) : null}

          <h3 className="mt-4 text-base font-semibold text-gray-900">
            {emptyMessage}
          </h3>

          {emptyDescription ? (
            <p className="mx-auto mt-2 text-sm leading-6 text-gray-500">
              {emptyDescription}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const headerCells = columns.map((column) => (
    <th
      key={column.key}
      scope="col"
      className={[
        "whitespace-nowrap px-5 py-3.5",
        "text-left text-[11px] font-semibold",
        "uppercase tracking-wider text-gray-500",
        column.headerClassName || "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {column.label}
    </th>
  ));

  const actionHeader = renderActions ? (
    <th
      key="actions"
      scope="col"
      className={[
        "whitespace-nowrap px-5 py-3.5",
        "text-right text-[11px] font-semibold",
        "uppercase tracking-wider text-gray-500",
      ].join(" ")}
    >
      {actionsLabel}
    </th>
  ) : null;

  const headers = actionHeader ? [...headerCells, actionHeader] : headerCells;

  const bodyRows = data.map((item, index) => {
    const key = typeof rowKey === "function" ? rowKey(item) : item[rowKey];

    const cells = columns.map((column) => (
      <td
        key={column.key}
        className={[
          "px-5 py-4 align-middle text-sm text-gray-700",
          column.cellClassName || "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {column.render ? column.render(item, index) : (item[column.key] ?? "-")}
      </td>
    ));

    const actionCell = renderActions ? (
      <td key="actions" className="whitespace-nowrap px-5 py-4 align-middle">
        {renderActions(item, index)}
      </td>
    ) : null;

    const rowCells = actionCell ? [...cells, actionCell] : cells;

    return (
      <tr
        key={key}
        className="transition-colors duration-150 hover:bg-gray-50/70"
      >
        {rowCells}
      </tr>
    );
  });

  const mobileItems = renderMobile
    ? data.map((item, index) => {
        const key = typeof rowKey === "function" ? rowKey(item) : item[rowKey];

        return (
          <div key={key} className="min-w-0">
            {renderMobile(item, index)}
          </div>
        );
      })
    : null;

  return (
    <>
      <div
        className={[
          "hidden overflow-hidden rounded-2xl",
          "border border-gray-200 bg-white shadow-sm",
          "md:block",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="overflow-x-auto">
          <table
            className={["w-full min-w-[860px]", tableClassName]
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

      {mobileItems ? (
        <div className="space-y-3 md:hidden">{mobileItems}</div>
      ) : null}
    </>
  );
}
