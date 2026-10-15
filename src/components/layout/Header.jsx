"use client";

import LogoutButton from "@/components/auth/LogoutButton";

const ROLE_CONFIG = {
  admin: {
    title: "Admin Dashboard",
    description: "Manage your application",
  },

  teknisi: {
    title: "Teknisi Dashboard",
    description: "Manage your technical tasks",
  },

  customer: {
    title: "Customer Dashboard",
    description: "Manage your services",
  },
};

export default function Header({ role, user }) {
  const config = ROLE_CONFIG[role];

  const displayName = user?.username || user?.name || "User";

  return (
    <header className="hidden h-16 shrink-0 border-b border-gray-200 bg-white lg:flex lg:items-center lg:justify-between lg:px-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {config?.title || "Dashboard"}
        </h2>

        <p className="text-xs text-gray-500">
          {config?.description || "Welcome to Bengkel App"}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-900">{displayName}</p>

          <p className="text-xs capitalize text-gray-500">{role}</p>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
