"use client";

import { CircleUserRound, ShieldCheck, UserRound } from "lucide-react";

function StatCard({ icon: Icon, label, value, description, iconClassName }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gray-50 transition-transform duration-300 group-hover:scale-125" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClassName}`}
          >
            <Icon size={21} strokeWidth={2} />
          </div>

          <span className="text-xs font-medium text-gray-300">Overview</span>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-gray-500">{label}</p>

          <p className="mt-1.5 truncate text-2xl font-bold capitalize tracking-tight text-gray-900">
            {value || "-"}
          </p>

          <p className="mt-2 text-xs text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ user }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="relative px-6 py-6 sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-red-50" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                <ShieldCheck size={14} />
                Admin Dashboard
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Welcome back, {user?.username || "Admin"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Manage your workshop application and monitor your account
                information from this dashboard.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <CircleUserRound size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Account Overview */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Account Overview
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Information about your administrator account.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={ShieldCheck}
            label="Role"
            value={user?.role}
            description="Current account access level"
            iconClassName="bg-red-50 text-red-600"
          />

          <StatCard
            icon={UserRound}
            label="Username"
            value={user?.username}
            description="Your administrator username"
            iconClassName="bg-blue-50 text-blue-600"
          />

          <StatCard
            icon={CircleUserRound}
            label="User ID"
            value={user?.id ? `#${user.id}` : "-"}
            description="Unique administrator identifier"
            iconClassName="bg-amber-50 text-amber-600"
          />
        </div>
      </div>

      {/* Admin Information */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="relative p-6 sm:p-7">
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-red-50" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
              <ShieldCheck size={22} />
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Administrator Access
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                You are signed in as an administrator. You have access to manage
                workshop operations and application data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
