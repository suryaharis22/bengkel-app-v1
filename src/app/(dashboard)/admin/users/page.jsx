"use client";

import { useEffect, useState } from "react";
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

const DEFAULT_META = {
  current_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total_items: 0,
  total_pages: 0,
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [meta, setMeta] = useState(DEFAULT_META);

  const [requestKey, setRequestKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch data whenever filters, pagination, or requestKey changes.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadUsers() {
      try {
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
          signal: controller.signal,
        });

        if (cancelled) return;

        setUsers(response.data?.data || []);

        if (response.data?.meta) {
          setMeta({
            ...DEFAULT_META,
            ...response.data.meta,
          });
        } else {
          setMeta(DEFAULT_META);
        }
      } catch (error) {
        if (cancelled || error?.code === "ERR_CANCELED") return;

        const apiError = getAxiosError(error);
        toast.error(apiError.message);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, perPage, search, role, requestKey]);

  function handleSearchChange(value) {
    setLoading(true);
    setSearch(value);
    setPage(1);
  }

  function handleRoleChange(value) {
    setLoading(true);
    setRole(value);
    setPage(1);
  }

  function handlePerPageChange(value) {
    setLoading(true);
    setPerPage(Number(value));
    setPage(1);
  }

  function handlePageChange(nextPage) {
    setLoading(true);
    setPage(nextPage);
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

  function handleRefresh() {
    setRefreshing(true);
    setRequestKey((current) => current + 1);
  }

  function handleFormSuccess() {
    setFormOpen(false);
    setSelectedUser(null);
    setRefreshing(true);
    setRequestKey((current) => current + 1);
  }

  function handleDeleteSuccess() {
    setDeleteOpen(false);
    setUserToDelete(null);

    if (users.length === 1 && page > 1) {
      setLoading(true);
      setPage((current) => current - 1);
      return;
    }

    setRefreshing(true);
    setRequestKey((current) => current + 1);
  }

  return (
    <>
      <main className="mx-auto w-full min-w-0 max-w-7xl">
        {/* Page header */}
        <header className="mb-5 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>

            <p className="mt-1 text-sm text-gray-600">
              Manage users and their roles.
            </p>
          </div>

          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 sm:flex-none sm:px-4"
            >
              <Plus size={18} />
              <span>Add User</span>
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="relative z-0 mb-5 block w-full min-w-0">
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
        <div className="relative z-0 block w-full min-w-0 clear-both">
          <div className="relative block w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
        </div>

        {/* Pagination */}
        {!loading && (
          <footer className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium text-gray-900">{users.length}</span>{" "}
              of{" "}
              <span className="font-medium text-gray-900">
                {meta.total_items}
              </span>{" "}
              users
            </p>

            {meta.total_pages > 1 && (
              <nav
                aria-label="User pagination"
                className="flex w-full min-w-0 items-center justify-between gap-2 sm:w-auto sm:justify-start"
              >
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 px-3 text-sm font-semibold text-white">
                  {meta.current_page}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(Math.min(meta.total_pages, page + 1))
                  }
                  disabled={page >= meta.total_pages}
                  className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            )}
          </footer>
        )}
      </main>

      {/* Create / Edit user */}
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

      {/* Delete user */}
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
