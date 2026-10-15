"use client";

function getStatusConfig(status) {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        className: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
      };

    case "confirmed":
      return {
        label: "Confirmed",
        className: "bg-blue-50 text-blue-700 ring-blue-600/20",
      };

    case "in_progress":
      return {
        label: "In Progress",
        className: "bg-purple-50 text-purple-700 ring-purple-600/20",
      };

    case "completed":
      return {
        label: "Completed",
        className: "bg-green-50 text-green-700 ring-green-600/20",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-red-50 text-red-700 ring-red-600/20",
      };

    default:
      return {
        label: status || "Unknown",
        className: "bg-gray-50 text-gray-700 ring-gray-600/20",
      };
  }
}

export default function ServiceOrderStatusBadge({ status }) {
  const config = getStatusConfig(status);

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1.5",
        "text-xs font-semibold ring-1 ring-inset",
        config.className,
      ].join(" ")}
    >
      {config.label}
    </span>
  );
}
