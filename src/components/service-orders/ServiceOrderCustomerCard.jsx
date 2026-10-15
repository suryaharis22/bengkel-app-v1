"use client";

import { Mail, Phone, UserRound } from "lucide-react";

export default function ServiceOrderCustomerCard({ order }) {
  const customer = order?.booking?.customer || null;

  const customerName =
    order?.booking?.customer_name ||
    order?.booking?.customerName ||
    order?.customer_name ||
    customer?.username ||
    "-";

  const customerPhone =
    order?.booking?.customer_phone ||
    order?.booking?.customerPhone ||
    order?.customer_phone ||
    customer?.no_hp ||
    "-";

  const customerEmail = customer?.email || "-";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <UserRound size={20} />
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">Customer</h2>

          <p className="text-sm text-gray-500">Customer information</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Name
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {customerName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Phone size={16} className="shrink-0 text-gray-400" />

          <span className="text-sm text-gray-600">{customerPhone}</span>
        </div>

        {customerEmail !== "-" && (
          <div className="flex items-center gap-3">
            <Mail size={16} className="shrink-0 text-gray-400" />

            <span className="break-all text-sm text-gray-600">
              {customerEmail}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
