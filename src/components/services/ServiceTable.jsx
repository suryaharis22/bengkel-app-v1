"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit, Plus, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";

import ServiceFilter from "./ServiceFilter";
import ServiceForm from "./ServiceForm";
import ServiceStatusModal from "./ServiceStatusModal";
import ServiceDeleteModal from "./ServiceDeleteModal";
import ServiceTableSkeleton from "./ServiceTableSkeleton";

const PER_PAGE = 10;

function formatPrice(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ServiceTable() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [statusService, setStatusService] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [deleteService, setDeleteService] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const params = {
      page,
      per_page: PER_PAGE,
    };

    const trimmedSearch = search.trim();

    if (trimmedSearch) {
      params.search = trimmedSearch;
    }

    if (status) {
      params.status = status;
    }

    let active = true;

    async function loadServices() {
      try {
        const response = await api.get("/admin/services", {
          params,
          signal: controller.signal,
        });

        if (!active || controller.signal.aborted) {
          return;
        }

        const responseData = response.data;

        setServices(responseData?.data || []);
        setTotal(responseData?.meta?.total || 0);
        setTotalPages(Math.max(1, responseData?.meta?.total_pages || 1));
      } catch (error) {
        if (
          error?.code === "ERR_CANCELED" ||
          controller.signal.aborted ||
          !active
        ) {
          return;
        }

        const axiosError = getAxiosError(error);

        toast.error(axiosError.message);
      } finally {
        if (active && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, search, status, refreshKey]);

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value) {
    setStatus(value);
    setPage(1);
  }

  function handleResetFilter() {
    setSearch("");
    setStatus("");
    setPage(1);
  }

  function handleCreate() {
    setSelectedService(null);
    setFormOpen(true);
  }

  function handleEdit(service) {
    setSelectedService(service);
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setSelectedService(null);
  }

  function handleFormSuccess() {
    handleCloseForm();
    setRefreshKey((current) => current + 1);
  }

  function handleToggleStatus(service) {
    setStatusService(service);
  }

  function handleCloseStatusModal() {
    if (statusLoading) {
      return;
    }

    setStatusService(null);
  }

  async function handleStatusConfirm() {
    if (!statusService || statusLoading) {
      return;
    }

    const serviceId = statusService.id;
    const nextStatus = !statusService.status;

    setStatusLoading(true);

    try {
      await api.put(`/admin/services/${serviceId}`, {
        status: nextStatus,
      });

      toast.success(
        nextStatus
          ? "Service activated successfully"
          : "Service deactivated successfully",
      );

      setStatusService(null);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      const axiosError = getAxiosError(error);

      toast.error(axiosError.message);
    } finally {
      setStatusLoading(false);
    }
  }

  function handleDelete(service) {
    setDeleteService(service);
    setDeleteModalOpen(true);
  }

  function handleCloseDeleteModal() {
    setDeleteModalOpen(false);
    setDeleteService(null);
  }

  function handleDeleteSuccess() {
    handleCloseDeleteModal();

    if (services.length === 1 && page > 1) {
      setPage((currentPage) => currentPage - 1);
      return;
    }

    setRefreshKey((current) => current + 1);
  }

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Service",
        render: (service) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Wrench size={18} strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">
                {service.name}
              </p>

              {service.description ? (
                <p className="mt-0.5 max-w-md truncate text-sm text-gray-500">
                  {service.description}
                </p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        key: "price",
        label: "Price",
        headerClassName: "text-right",
        cellClassName: "text-right font-medium text-gray-900",
        render: (service) => formatPrice(service.price),
      },
      {
        key: "used",
        label: "Used",
        headerClassName: "text-center",
        cellClassName: "text-center text-gray-700",
        render: (service) => service._count?.order_items || 0,
      },
      {
        key: "created_at",
        label: "Created",
        render: (service) => formatDate(service.created_at),
      },
    ],
    [],
  );

  function renderActions(service) {
    const isUsed = (service._count?.order_items || 0) > 0;

    return (
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => handleToggleStatus(service)}
          className={[
            "inline-flex h-9 items-center justify-center",
            "rounded-lg px-3 text-xs font-semibold",
            "transition-colors",
            service.status
              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "bg-green-50 text-green-700 hover:bg-green-100",
          ].join(" ")}
        >
          {service.status ? "Deactivate" : "Activate"}
        </button>

        <button
          type="button"
          onClick={() => handleEdit(service)}
          aria-label={`Edit ${service.name}`}
          className={[
            "inline-flex h-9 w-9 items-center justify-center",
            "rounded-lg text-gray-500",
            "transition-colors hover:bg-gray-100",
            "hover:text-gray-900",
          ].join(" ")}
        >
          <Edit size={17} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={() => handleDelete(service)}
          disabled={isUsed}
          aria-label={`Delete ${service.name}`}
          title={isUsed ? "This service is already used" : "Delete service"}
          className={[
            "inline-flex h-9 w-9 items-center justify-center",
            "rounded-lg text-gray-500",
            "transition-colors",
            "hover:bg-red-50 hover:text-red-600",
            "disabled:cursor-not-allowed disabled:opacity-30",
          ].join(" ")}
        >
          <Trash2 size={17} strokeWidth={2} />
        </button>
      </div>
    );
  }

  function renderMobile(service) {
    const isUsed = (service._count?.order_items || 0) > 0;

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Wrench size={18} strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-gray-900">
                  {service.name}
                </h3>

                {service.description ? (
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500">
                    {service.description}
                  </p>
                ) : null}
              </div>

              <span
                className={[
                  "shrink-0 rounded-full px-2.5 py-1",
                  "text-[11px] font-semibold",
                  service.status
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-600",
                ].join(" ")}
              >
                {service.status ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs font-medium text-gray-400">Price</p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatPrice(service.price)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400">Used</p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {service._count?.order_items || 0}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => handleToggleStatus(service)}
            className={[
              "inline-flex h-9 items-center justify-center",
              "rounded-lg px-3 text-sm font-medium",
              "transition-colors",
              service.status
                ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
            ].join(" ")}
          >
            {service.status ? "Deactivate" : "Activate"}
          </button>

          <button
            type="button"
            onClick={() => handleEdit(service)}
            className={[
              "inline-flex h-9 items-center justify-center gap-2",
              "rounded-lg border border-gray-200",
              "px-3 text-sm font-medium text-gray-700",
              "transition-colors hover:bg-gray-50",
            ].join(" ")}
          >
            <Edit size={16} strokeWidth={2} />
            Edit
          </button>

          <button
            type="button"
            onClick={() => handleDelete(service)}
            disabled={isUsed}
            title={isUsed ? "This service is already used" : "Delete service"}
            className={[
              "inline-flex h-9 items-center justify-center gap-2",
              "rounded-lg border border-red-200",
              "px-3 text-sm font-medium text-red-600",
              "transition-colors hover:bg-red-50",
              "disabled:cursor-not-allowed disabled:opacity-40",
            ].join(" ")}
          >
            <Trash2 size={16} strokeWidth={2} />
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Workshop Services
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage workshop services and service pricing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className={[
            "inline-flex items-center justify-center gap-2",
            "rounded-xl bg-red-600 px-4 py-2.5",
            "text-sm font-semibold text-white",
            "transition-colors hover:bg-red-700",
          ].join(" ")}
        >
          <Plus size={18} strokeWidth={2} />
          Add Service
        </button>
      </div>

      <ServiceFilter
        search={search}
        status={status}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onReset={handleResetFilter}
      />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">Service List</h2>

            <p className="mt-0.5 text-sm text-gray-500">
              {total} service{total === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={services}
          rowKey="id"
          loading={loading}
          skeleton={<ServiceTableSkeleton />}
          emptyMessage="No services found"
          emptyDescription="Try changing your search or filter, or create a new service."
          emptyIcon={<Wrench size={24} strokeWidth={2} />}
          renderActions={renderActions}
          actionsLabel="Actions"
          renderMobile={renderMobile}
          className="rounded-none border-0 shadow-none"
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={loading}
        />
      </div>

      {formOpen ? (
        <ServiceForm
          service={selectedService}
          open={formOpen}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      ) : null}

      <ServiceStatusModal
        open={Boolean(statusService)}
        service={statusService}
        loading={statusLoading}
        onClose={handleCloseStatusModal}
        onConfirm={handleStatusConfirm}
      />

      {deleteModalOpen && deleteService ? (
        <ServiceDeleteModal
          service={deleteService}
          open={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          onSuccess={handleDeleteSuccess}
        />
      ) : null}
    </div>
  );
}
