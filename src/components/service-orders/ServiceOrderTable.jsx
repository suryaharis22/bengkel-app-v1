"use client";

import { useEffect, useState } from "react";
import { Eye, FileText, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";

import ServiceOrderFilter from "./ServiceOrderFilter";
import ServiceOrderTableSkeleton from "./ServiceOrderTableSkeleton";

function formatCurrency(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
}

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

function formatStatus(value) {
  if (!value) {
    return "-";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
  const classes = {
    pending: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    confirmed: "bg-blue-50 text-blue-700 ring-blue-600/20",
    in_progress: "bg-purple-50 text-purple-700 ring-purple-600/20",
    completed: "bg-green-50 text-green-700 ring-green-600/20",
    cancelled: "bg-red-50 text-red-700 ring-red-600/20",
  };

  return classes[status] || "bg-gray-50 text-gray-700 ring-gray-600/20";
}

function getPaymentStatusClass(status) {
  const classes = {
    unpaid: "bg-red-50 text-red-700 ring-red-600/20",
    partial: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    paid: "bg-green-50 text-green-700 ring-green-600/20",
  };

  return classes[status] || "bg-gray-50 text-gray-700 ring-gray-600/20";
}

function getCustomerName(order) {
  return (
    order?.booking?.customer?.username ||
    order?.booking?.customer?.name ||
    order?.customer?.username ||
    order?.customer?.name ||
    "-"
  );
}

function getVehicleName(order) {
  const vehicle = order?.booking?.vehicle || order?.vehicle;

  if (!vehicle) {
    return "-";
  }

  const name = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");

  if (name) {
    return name;
  }

  return vehicle.plat_nomor || vehicle.plate_number || "-";
}

function getOrdersFromResponse(response) {
  const payload = response?.data;

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  return [];
}

function getMetaFromResponse(response) {
  const payload = response?.data;

  if (payload?.meta) {
    return payload.meta;
  }

  if (payload?.data?.meta) {
    return payload.data.meta;
  }

  return {};
}

export default function ServiceOrderTable() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const perPage = 10;

  useEffect(() => {
    const controller = new AbortController();

    const params = {
      page,
      per_page: perPage,
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    if (status) {
      params.status = status;
    }

    if (paymentStatus) {
      params.payment_status = paymentStatus;
    }

    api
      .get("/admin/service-orders", {
        params,
        signal: controller.signal,
      })
      .then((response) => {
        const data = getOrdersFromResponse(response);

        const meta = getMetaFromResponse(response);

        setOrders(data);

        setTotalPages(
          Math.max(1, Number(meta.total_pages) || Number(meta.last_page) || 1),
        );
      })
      .catch((error) => {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
          return;
        }

        const axiosError = getAxiosError(error);

        toast.error(axiosError.message);

        setOrders([]);
        setTotalPages(1);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [page, search, status, paymentStatus, refreshKey]);

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
    setLoading(true);
  }

  function handleStatusChange(value) {
    setStatus(value);
    setPage(1);
    setLoading(true);
  }

  function handlePaymentStatusChange(value) {
    setPaymentStatus(value);
    setPage(1);
    setLoading(true);
  }

  function handleReset() {
    setSearch("");
    setStatus("");
    setPaymentStatus("");
    setPage(1);
    setLoading(true);
  }

  function handlePageChange(nextPage) {
    setPage(nextPage);
    setLoading(true);
  }

  function handleRefresh() {
    setLoading(true);
    setRefreshKey((value) => value + 1);
  }

  function renderStatus(statusValue) {
    return (
      <span
        className={[
          "inline-flex items-center rounded-full",
          "px-2.5 py-1 text-xs font-semibold",
          "ring-1 ring-inset",
          getStatusClass(statusValue),
        ].join(" ")}
      >
        {formatStatus(statusValue)}
      </span>
    );
  }

  function renderPaymentStatus(statusValue) {
    return (
      <span
        className={[
          "inline-flex items-center rounded-full",
          "px-2.5 py-1 text-xs font-semibold",
          "ring-1 ring-inset",
          getPaymentStatusClass(statusValue),
        ].join(" ")}
      >
        {formatStatus(statusValue)}
      </span>
    );
  }

  const columns = [
    {
      key: "order_number",
      label: "Order",
      cellClassName: "min-w-[180px]",
      render: (order) => (
        <div>
          <p className="font-semibold text-gray-900">
            {order.order_number || "-"}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {formatDate(order.created_at)}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      cellClassName: "min-w-[180px]",
      render: (order) => (
        <div>
          <p className="font-medium text-gray-900">{getCustomerName(order)}</p>

          <p className="mt-1 text-xs text-gray-500">{getVehicleName(order)}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (order) => renderStatus(order.status),
    },
    {
      key: "payment_status",
      label: "Payment",
      render: (order) => renderPaymentStatus(order.payment_status),
    },
    {
      key: "grand_total",
      label: "Grand Total",
      cellClassName: "whitespace-nowrap font-semibold text-gray-900",
      render: (order) => formatCurrency(order.grand_total),
    },
  ];

  function renderActions(order) {
    return (
      <button
        type="button"
        onClick={() => router.push(`/admin/service-orders/${order.id}`)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        <Eye size={16} />
        View
      </button>
    );
  }

  function renderMobile(order) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">
              {order.order_number || "-"}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {formatDate(order.created_at)}
            </p>
          </div>

          {renderStatus(order.status)}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Customer
            </p>

            <p className="mt-1 truncate text-sm font-medium text-gray-800">
              {getCustomerName(order)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Vehicle
            </p>

            <p className="mt-1 truncate text-sm font-medium text-gray-800">
              {getVehicleName(order)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Payment
            </p>

            <div className="mt-1">
              {renderPaymentStatus(order.payment_status)}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Total
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatCurrency(order.grand_total)}
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={() => router.push(`/admin/service-orders/${order.id}`)}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <Eye size={16} />
            View Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <FileText size={20} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Service Orders
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage workshop service orders
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <ServiceOrderFilter
        search={search}
        status={status}
        paymentStatus={paymentStatus}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onPaymentStatusChange={handlePaymentStatusChange}
        onReset={handleReset}
      />

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        skeleton={<ServiceOrderTableSkeleton />}
        emptyMessage="No service orders found"
        emptyDescription="Service orders matching your current filters will appear here."
        emptyIcon={<FileText size={24} />}
        renderMobile={renderMobile}
        renderActions={renderActions}
        actionsLabel="Actions"
      />

      {!loading && orders.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            disabled={loading}
          />
        </div>
      ) : null}
    </div>
  );
}
