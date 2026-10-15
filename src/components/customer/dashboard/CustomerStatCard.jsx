"use client";

export default function CustomerStatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = "",
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>

        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center",
            "rounded-xl",
            iconClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {Icon ? <Icon size={21} strokeWidth={2} /> : null}
        </div>
      </div>
    </div>
  );
}
