"use client";

import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Wrench,
} from "lucide-react";

const cards = [
  {
    key: "totalBookings",
    label: "Total Booking",
    description: "Booking yang ditugaskan",
    icon: CalendarCheck,
    iconClass: "bg-blue-50 text-blue-600",
  },
  {
    key: "totalJobs",
    label: "Total Pekerjaan",
    description: "Pekerjaan servis",
    icon: Wrench,
    iconClass: "bg-amber-50 text-amber-600",
  },
  {
    key: "todaySchedules",
    label: "Jadwal Hari Ini",
    description: "Booking hari ini",
    icon: CalendarDays,
    iconClass: "bg-violet-50 text-violet-600",
  },
  {
    key: "completedJobs",
    label: "Servis Selesai",
    description: "Pekerjaan terselesaikan",
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-600",
  },
];

export default function TechnicianSummaryCards({
  summary = {},
  loading = false,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = Number(summary[card.key] ?? 0);

        return (
          <div
            key={card.key}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500">
                  {card.label}
                </p>

                <div className="mt-3">
                  {loading ? (
                    <div className="h-9 w-16 animate-pulse rounded-lg bg-gray-100" />
                  ) : (
                    <p className="text-3xl font-bold tracking-tight text-gray-900">
                      {value.toLocaleString("id-ID")}
                    </p>
                  )}
                </div>

                <p className="mt-2 text-xs text-gray-500">{card.description}</p>
              </div>

              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}
              >
                <Icon size={23} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
