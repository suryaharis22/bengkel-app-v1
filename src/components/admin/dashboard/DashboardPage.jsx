"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  ClipboardList,
  Loader2,
  Package,
  RefreshCw,
  Settings2,
  ShoppingCart,
  ShieldCheck,
  Tags,
  Users,
  Wrench,
  Motorbike,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

import DashboardStatCard from "./DashboardStatCard";
import DashboardSection from "./DashboardSection";
import DashboardOrderStatus from "./DashboardOrderStatus";
import DashboardStockAlert from "./DashboardStockAlert";
import DashboardSalesSummary from "./DashboardSalesSummary";
import DashboardRecentOrders from "./DashboardRecentOrders";
import DashboardVehicles from "./DashboardVehicles";

function getData(response) {
  return response?.data?.data || [];
}

export default function DashboardPage({ user }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [users, setUsers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        usersResponse,
        brandsResponse,
        sparePartsResponse,
        servicesResponse,
        serviceOrdersResponse,
        salesResponse,
        vehiclesResponse,
      ] = await Promise.all([
        api.get("/admin/users?page=1&per_page=100"),
        api.get("/admin/brands?page=1&per_page=100"),
        api.get("/admin/spare-parts?page=1&per_page=100"),
        api.get("/admin/services?page=1&per_page=100"),
        api.get("/admin/service-orders?page=1&per_page=100"),
        api.get("/admin/cashier/sales?search=&page=1&per_page=100"),
        api.get("/admin/vehicles?page=1&per_page=100"),
      ]);

      setUsers(getData(usersResponse));
      setBrands(getData(brandsResponse));
      setSpareParts(getData(sparePartsResponse));
      setServices(getData(servicesResponse));
      setServiceOrders(getData(serviceOrdersResponse));
      setSales(getData(salesResponse));
      setVehicles(getData(vehiclesResponse));
    } catch (error) {
      const message = getAxiosError(error, "Failed to load dashboard data.");

      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const statistics = useMemo(() => {
    const customers = users.filter((item) => item.role === "customer");

    const technicians = users.filter((item) => item.role === "teknisi");

    const admins = users.filter((item) => item.role === "admin");

    const customerVehicles = vehicles.filter(
      (vehicle) => vehicle.type === "Customer",
    );

    const guestVehicles = vehicles.filter(
      (vehicle) => vehicle.type === "Guest",
    );

    const vehiclesWithBookings = vehicles.filter(
      (vehicle) => Number(vehicle.booking_count || 0) > 0,
    );

    let totalVariants = 0;
    let totalStock = 0;
    let lowStockVariants = 0;

    spareParts.forEach((sparePart) => {
      const variants = Array.isArray(sparePart.variants)
        ? sparePart.variants
        : [];

      totalVariants += variants.length;

      variants.forEach((variant) => {
        const stock = Number(variant.stock?.stock || 0);

        const reserved = Number(variant.stock?.reserved_stock || 0);

        const minimum = Number(variant.stock?.minimum_stock || 0);

        const available = stock - reserved;

        totalStock += available;

        if (available <= minimum) {
          lowStockVariants += 1;
        }
      });
    });

    const completedOrders = serviceOrders.filter(
      (order) => order.status === "completed",
    );

    const inProgressOrders = serviceOrders.filter(
      (order) => order.status === "in_progress",
    );

    const pendingOrders = serviceOrders.filter(
      (order) => order.status === "pending",
    );

    const cancelledOrders = serviceOrders.filter(
      (order) => order.status === "cancelled",
    );

    const paidSales = sales.filter((sale) => sale.payment_status === "paid");

    const unpaidSales = sales.filter(
      (sale) => sale.payment_status === "unpaid",
    );

    const salesRevenue = sales
      .filter((sale) => sale.status === "completed")
      .reduce((total, sale) => total + Number(sale.grand_total || 0), 0);

    const paidRevenue = paidSales
      .filter((sale) => sale.status === "completed")
      .reduce((total, sale) => total + Number(sale.amount_to_pay || 0), 0);

    const unpaidRevenue = unpaidSales
      .filter((sale) => sale.status === "completed")
      .reduce((total, sale) => total + Number(sale.amount_to_pay || 0), 0);

    return {
      totalUsers: users.length,

      customers: customers.length,
      technicians: technicians.length,
      admins: admins.length,

      brands: brands.length,

      spareParts: spareParts.length,
      variants: totalVariants,
      totalStock,
      lowStockVariants,

      services: services.length,

      serviceOrders: serviceOrders.length,
      completedOrders: completedOrders.length,
      inProgressOrders: inProgressOrders.length,
      pendingOrders: pendingOrders.length,
      cancelledOrders: cancelledOrders.length,

      sales: sales.length,
      paidSales: paidSales.length,
      unpaidSales: unpaidSales.length,

      salesRevenue,
      paidRevenue,
      unpaidRevenue,

      totalVehicles: vehicles.length,
      customerVehicles: customerVehicles.length,
      guestVehicles: guestVehicles.length,
      vehiclesWithBookings: vehiclesWithBookings.length,
    };
  }, [users, brands, spareParts, services, serviceOrders, sales, vehicles]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Loader2 size={24} className="animate-spin" />
          </div>

          <p className="mt-4 text-sm font-medium text-gray-700">
            Loading dashboard...
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Please wait while we load your workshop data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="relative px-6 py-6 sm:px-7">
          <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-red-50" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                <Settings2 size={14} />
                Workshop Overview
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Welcome back, {user?.username || "Admin"}
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Monitor your workshop operations, inventory, services, and sales
                from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Overview */}
      <DashboardSection
        title="Overview"
        description="Summary of your workshop data."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            icon={Users}
            label="Total Users"
            value={statistics.totalUsers}
            description={`${statistics.customers} customers · ${statistics.technicians} technicians`}
            iconClassName="bg-blue-50 text-blue-600"
          />

          <DashboardStatCard
            icon={ClipboardList}
            label="Service Orders"
            value={statistics.serviceOrders}
            description={`${statistics.completedOrders} completed`}
            iconClassName="bg-red-50 text-red-600"
          />

          <DashboardStatCard
            icon={ShoppingCart}
            label="Sales"
            value={statistics.sales}
            description={`${statistics.paidSales} paid · ${statistics.unpaidSales} unpaid`}
            iconClassName="bg-green-50 text-green-600"
          />

          <DashboardStatCard
            icon={Package}
            label="Spare Parts"
            value={statistics.spareParts}
            description={`${statistics.variants} variants available`}
            iconClassName="bg-amber-50 text-amber-600"
          />
        </div>
      </DashboardSection>

      {/* User Management & Inventory */}
      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection
          title="User Management"
          description="Registered users by role."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <DashboardStatCard
              compact
              icon={Users}
              label="Customers"
              value={statistics.customers}
              description="Registered customers"
              iconClassName="bg-blue-50 text-blue-600"
            />

            <DashboardStatCard
              compact
              icon={Wrench}
              label="Technicians"
              value={statistics.technicians}
              description="Workshop technicians"
              iconClassName="bg-purple-50 text-purple-600"
            />

            <DashboardStatCard
              compact
              icon={ShieldCheck}
              label="Admins"
              value={statistics.admins}
              description="Administrator accounts"
              iconClassName="bg-red-50 text-red-600"
            />
          </div>
        </DashboardSection>

        <DashboardSection
          title="Inventory"
          description="Current spare part inventory overview."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <DashboardStatCard
              compact
              icon={Package}
              label="Products"
              value={statistics.spareParts}
              description="Spare part products"
              iconClassName="bg-blue-50 text-blue-600"
            />

            <DashboardStatCard
              compact
              icon={Tags}
              label="Variants"
              value={statistics.variants}
              description="Active product variants"
              iconClassName="bg-indigo-50 text-indigo-600"
            />

            <DashboardStatCard
              compact
              icon={Boxes}
              label="Stock"
              value={statistics.totalStock}
              description="Available stock units"
              iconClassName="bg-green-50 text-green-600"
            />
          </div>
        </DashboardSection>
      </div>

      {/* Vehicles */}
      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection
          title="Vehicles"
          description="Registered customer and guest vehicles."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <DashboardStatCard
              compact
              icon={Motorbike}
              label="Total Vehicles"
              value={statistics.totalVehicles}
              description="All registered vehicles"
              iconClassName="bg-blue-50 text-blue-600"
            />

            <DashboardStatCard
              compact
              icon={Users}
              label="Customer"
              value={statistics.customerVehicles}
              description="Customer vehicles"
              iconClassName="bg-green-50 text-green-600"
            />

            <DashboardStatCard
              compact
              icon={Motorbike}
              label="Guest"
              value={statistics.guestVehicles}
              description="Guest vehicles"
              iconClassName="bg-amber-50 text-amber-600"
            />
          </div>

          <div className="mt-4">
            <DashboardVehicles vehicles={vehicles} />
          </div>
        </DashboardSection>

        <DashboardSection
          title="Vehicle Activity"
          description="Vehicle booking activity."
        >
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Motorbike size={21} />
              </div>

              <div>
                <p className="text-xs text-gray-500">Vehicles With Bookings</p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {statistics.vehiclesWithBookings}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
              <span className="text-sm text-gray-500">
                Vehicles without bookings
              </span>

              <span className="text-sm font-bold text-gray-900">
                {Math.max(
                  statistics.totalVehicles - statistics.vehiclesWithBookings,
                  0,
                )}
              </span>
            </div>
          </div>
        </DashboardSection>
      </div>

      {/* Service Orders & Sales */}
      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection
          title="Service Orders"
          description="Current service order status."
        >
          <DashboardOrderStatus
            pending={statistics.pendingOrders}
            inProgress={statistics.inProgressOrders}
            completed={statistics.completedOrders}
            cancelled={statistics.cancelledOrders}
            total={statistics.serviceOrders}
          />
        </DashboardSection>

        <DashboardSection
          title="Sales Summary"
          description="Cashier sales and payment overview."
        >
          <DashboardSalesSummary
            total={statistics.sales}
            paid={statistics.paidSales}
            unpaid={statistics.unpaidSales}
            revenue={statistics.salesRevenue}
            paidRevenue={statistics.paidRevenue}
            unpaidRevenue={statistics.unpaidRevenue}
          />
        </DashboardSection>
      </div>

      {/* Stock & Recent Orders */}
      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection
          title="Stock Alert"
          description="Spare part variants that need attention."
          action={
            statistics.lowStockVariants > 0
              ? `${statistics.lowStockVariants} low stock`
              : "Stock healthy"
          }
          actionClassName={
            statistics.lowStockVariants > 0
              ? "bg-amber-50 text-amber-700"
              : "bg-green-50 text-green-700"
          }
        >
          <DashboardStockAlert spareParts={spareParts} />
        </DashboardSection>

        <DashboardSection
          title="Recent Service Orders"
          description="Latest workshop service activity."
        >
          <DashboardRecentOrders orders={serviceOrders} />
        </DashboardSection>
      </div>
    </div>
  );
}
