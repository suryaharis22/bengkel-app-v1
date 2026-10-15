"use client";

import { Edit, Mail, Phone, Trash2, UserRound } from "lucide-react";
import DataTable from "@/components/ui/DataTable";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getRoleClass(role) {
  const classes = {
    admin: "bg-red-100 text-red-700",
    teknisi: "bg-amber-100 text-amber-700",
    customer: "bg-gray-100 text-gray-700",
  };

  return classes[role] || "bg-gray-100 text-gray-700";
}

export default function UserTable({
  users = [],
  loading = false,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      key: "username",
      label: "User",
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <UserRound size={17} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {user.username}
            </p>

            <p className="text-xs text-gray-500">ID #{user.id}</p>
          </div>
        </div>
      ),
    },

    {
      key: "email",
      label: "Contact",
      render: (user) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Mail size={14} className="shrink-0 text-gray-400" />

            <span>{user.email}</span>
          </div>

          {user.no_hp ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone size={13} className="shrink-0 text-gray-400" />

              <span>{user.no_hp}</span>
            </div>
          ) : null}
        </div>
      ),
    },

    {
      key: "role",
      label: "Role",
      render: (user) => (
        <span
          className={[
            "inline-flex rounded-full px-2.5 py-1",
            "text-xs font-semibold capitalize",
            getRoleClass(user.role),
          ].join(" ")}
        >
          {user.role}
        </span>
      ),
    },

    {
      key: "created_at",
      label: "Created",
      cellClassName: "whitespace-nowrap text-sm text-gray-600",
      render: (user) => formatDate(user.created_at),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      rowKey="id"
      loading={loading}
      emptyMessage="No users found"
      emptyDescription="There are no users matching your filters."
      emptyIcon={<UserRound size={22} />}
      renderActions={(user) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit?.(user)}
            aria-label={`Edit ${user.username}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <Edit size={17} />
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(user)}
            aria-label={`Delete ${user.username}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={17} />
          </button>
        </div>
      )}
    />
  );
}
