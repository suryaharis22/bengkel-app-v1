"use client";

import { Edit, Mail, Phone, Trash2, UserRound } from "lucide-react";
import DataTable from "@/components/ui/DataTable";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

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
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <UserRound size={17} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p
              className="max-w-[180px] truncate text-sm font-semibold text-gray-900"
              title={user.username || ""}
            >
              {user.username || "-"}
            </p>

            <p className="mt-0.5 text-xs text-gray-500">ID #{user.id ?? "-"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Contact",
      render: (user) => (
        <div className="min-w-0 space-y-1.5">
          <div className="flex min-w-0 items-center gap-2 text-sm text-gray-700">
            <Mail
              size={14}
              aria-hidden="true"
              className="shrink-0 text-gray-400"
            />

            <span
              className="block max-w-[220px] truncate"
              title={user.email || ""}
            >
              {user.email || "-"}
            </span>
          </div>

          {user.no_hp ? (
            <div className="flex min-w-0 items-center gap-2 text-xs text-gray-500">
              <Phone
                size={13}
                aria-hidden="true"
                className="shrink-0 text-gray-400"
              />

              <span className="block max-w-[180px] truncate" title={user.no_hp}>
                {user.no_hp}
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400">No phone number</p>
          )}
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (user) => (
        <span
          className={[
            "inline-flex whitespace-nowrap rounded-full px-2.5 py-1",
            "text-xs font-semibold capitalize",
            getRoleClass(user.role),
          ].join(" ")}
        >
          {user.role || "-"}
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
    <section className="block w-full min-w-0 max-w-full">
      <div className="w-full min-w-0 max-w-full rounded-xl border border-gray-200 bg-white shadow-sm">
        <DataTable
          columns={columns}
          data={users}
          rowKey="id"
          loading={loading}
          emptyMessage="No users found"
          emptyDescription="There are no users matching your filters."
          emptyIcon={<UserRound size={22} aria-hidden="true" />}
          renderActions={(user) => (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => onEdit?.(user)}
                aria-label={`Edit ${user.username || "user"}`}
                title="Edit user"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <Edit size={17} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onDelete?.(user)}
                aria-label={`Delete ${user.username || "user"}`}
                title="Delete user"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </div>
          )}
        />
      </div>

      <p className="px-3 pb-3 pt-2 text-xs text-gray-400 sm:hidden">
        Geser tabel ke samping untuk melihat semua kolom.
      </p>
    </section>
  );
}
