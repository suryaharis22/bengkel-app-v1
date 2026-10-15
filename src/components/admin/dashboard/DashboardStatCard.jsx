"use client";

export default function DashboardStatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClassName = "bg-gray-50 text-gray-600",
  compact = false,
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gray-50 transition-transform duration-300 group-hover:scale-125" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div
            className={`flex items-center justify-center rounded-xl ${iconClassName} ${
              compact ? "h-10 w-10" : "h-11 w-11"
            }`}
          >
            <Icon size={compact ? 18 : 21} strokeWidth={2} />
          </div>
        </div>

        <div className={compact ? "mt-4" : "mt-5"}>
          <p className="text-sm font-medium text-gray-500">{label}</p>

          <p
            className={`mt-1.5 font-bold tracking-tight text-gray-900 ${
              compact ? "text-xl" : "text-2xl"
            }`}
          >
            {value ?? 0}
          </p>

          {description && (
            <p className="mt-1.5 text-xs leading-5 text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
