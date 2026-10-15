"use client";

export default function DashboardSection({
  title,
  description,
  action,
  actionClassName = "bg-gray-100 text-gray-600",
  children,
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>

          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>

        {action && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${actionClassName}`}
          >
            {action}
          </span>
        )}
      </div>

      {children}
    </section>
  );
}
