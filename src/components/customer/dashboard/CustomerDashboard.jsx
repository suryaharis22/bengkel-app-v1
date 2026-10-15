"use client";

import { CalendarDays, Car, Wrench } from "lucide-react";

import CustomerStatCard from "./CustomerStatCard";
import RecentBooking from "./RecentBooking";
import QuickActions from "./QuickActions";

const MOCK_DATA = {
  customer: {
    username: "Customer",
  },

  statistics: {
    activeBookings: 1,
    activeServiceOrders: 1,
    vehicles: 2,
  },

  recentBookings: [
    {
      id: 1,
      booking_number: "B-20260929-001",
      vehicle: {
        plate_number: "F 2781 ABC",
        brand: "Honda",
        model: "Vario 160",
      },
      complaint: "Engine makes unusual noise when accelerating",
      scheduled_at: "2026-09-29T09:00:00",
      status: "confirmed",
    },
  ],
};

export default function CustomerDashboard() {
  const { customer, statistics, recentBookings } = MOCK_DATA;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Welcome back, {customer.username}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your bookings, vehicles, and service orders.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CustomerStatCard
          title="Active Bookings"
          value={statistics.activeBookings}
          description="Your current bookings"
          icon={CalendarDays}
          iconClassName="bg-blue-50 text-blue-600"
        />

        <CustomerStatCard
          title="Active Service"
          value={statistics.activeServiceOrders}
          description="Service orders in progress"
          icon={Wrench}
          iconClassName="bg-red-50 text-red-600"
        />

        <CustomerStatCard
          title="My Vehicles"
          value={statistics.vehicles}
          description="Registered vehicles"
          icon={Car}
          iconClassName="bg-green-50 text-green-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentBooking bookings={recentBookings} />
        </div>

        <QuickActions />
      </div>
    </div>
  );
}
