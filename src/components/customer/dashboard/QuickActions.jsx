"use client";

import Link from "next/link";
import { CalendarPlus, ChevronRight, FileText, UserRound } from "lucide-react";

import { ROUTES } from "@/constants/routes";

const actions = [
  {
    label: "Create Booking",
    description: "Schedule a new workshop service",
    href: ROUTES.CUSTOMER.WORKSHOP.BOOKINGS,
    icon: CalendarPlus,
  },
  {
    label: "Service Orders",
    description: "View your service orders",
    href: ROUTES.CUSTOMER.WORKSHOP.SERVICE_ORDERS,
    icon: FileText,
  },
  {
    label: "My Profile",
    description: "Manage your account profile",
    href: ROUTES.CUSTOMER.ACCOUNT.PROFILE,
    icon: UserRound,
  },
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="font-semibold text-gray-900">Quick Actions</h2>

        <p className="mt-0.5 text-sm text-gray-500">Frequently used features</p>
      </div>

      <div className="mt-5 space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className={[
                "group flex items-center gap-3 rounded-xl",
                "border border-gray-100 bg-gray-50",
                "p-3.5 transition-colors",
                "hover:border-red-100 hover:bg-red-50",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center",
                  "rounded-xl bg-white text-gray-600",
                  "shadow-sm transition-colors",
                  "group-hover:text-red-600",
                ].join(" ")}
              >
                <Icon size={19} strokeWidth={2} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {action.label}
                </p>

                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {action.description}
                </p>
              </div>

              <ChevronRight
                size={17}
                className="shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-red-600"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
