"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";
import UserFilter from "@/components/users/UserFilter";
import UserTable from "@/components/users/UserTable";
import UserTableSkeleton from "@/components/users/UserTableSkeleton";
import UserForm from "@/components/users/UserForm";
import UserDeleteDialog from "@/components/users/UserDeleteDialog";

const DEFAULT_PER_PAGE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: DEFAULT_PER_PAGE,
    total_items: 0,
    total_pages: 0,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = useCallback(
    async ({ showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const params = {
          page,
          per_page: perPage,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (role) {
          params.role = role;
        }

        const response = await api.get("/admin/users", {
          params,
        });

        const data = response.data?.data || [];
        const responseMeta = response.data?.meta;

        setUsers(data);

        if (responseMeta) {
          setMeta(responseMeta);
        }
      } catch (error) {
        const apiError = getAxiosError(error);

        toast.error(apiError.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, perPage, search, role],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleRoleChange(value) {
    setRole(value);
    setPage(1);
  }

  function handlePerPageChange(value) {
    setPerPage(Number(value));
    setPage(1);
  }

  function handleCreate() {
    setSelectedUser(null);
    setFormOpen(true);
  }

  function handleEdit(user) {
    setSelectedUser(user);
    setFormOpen(true);
  }

  function handleDelete(user) {
    setUserToDelete(user);
    setDeleteOpen(true);
  }

  function handleFormSuccess() {
    setFormOpen(false);
    setSelectedUser(null);

    fetchUsers({ showLoading: false });
  }

  function handleDeleteSuccess() {
    setDeleteOpen(false);
    setUserToDelete(null);

    if (users.length === 1 && page > 1) {
      setPage((current) => current - 1);
      return;
    }

    fetchUsers({ showLoading: false });
  }

  function handleRefresh() {
    fetchUsers({ showLoading: false });
  }

  return (
    <>
      <div className="mx-auto w-full max-w-7xl">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>

            <p className="mt-1 text-sm text-gray-600">
              Manage users and their roles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <Plus size={18} />

              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <UserFilter
            search={search}
            role={role}
            perPage={perPage}
            onSearchChange={handleSearchChange}
            onRoleChange={handleRoleChange}
            onPerPageChange={handlePerPageChange}
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <UserTableSkeleton />
          ) : (
            <UserTable
              users={users}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>

        {/* Pagination */}
        {!loading && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium text-gray-900">{users.length}</span>{" "}
              of{" "}
              <span className="font-medium text-gray-900">
                {meta.total_items}
              </span>{" "}
              users
            </p>

            {meta.total_pages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-red-600 px-3 text-sm font-semibold text-white">
                  {meta.current_page}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(meta.total_pages, current + 1),
                    )
                  }
                  disabled={page >= meta.total_pages}
                  className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit */}
      {formOpen && (
        <UserForm
          user={selectedUser}
          onClose={() => {
            setFormOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete */}
      {deleteOpen && userToDelete && (
        <UserDeleteDialog
          user={userToDelete}
          onClose={() => {
            setDeleteOpen(false);
            setUserToDelete(null);
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </>
  );
}
