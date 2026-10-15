"use client";

import { FileText, MessageSquareText } from "lucide-react";

export default function ServiceOrderComplaintCard({ order }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <MessageSquareText size={20} />
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Complaint & Diagnosis
          </h2>

          <p className="text-sm text-gray-500">
            Customer complaint and technician diagnosis
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-gray-400" />

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Complaint
            </p>
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {order?.complaint || "-"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-gray-400" />

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Diagnosis
            </p>
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {order?.diagnosis || "No diagnosis yet."}
          </p>
        </div>
      </div>

      {order?.notes && (
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Notes
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-900">
            {order.notes}
          </p>
        </div>
      )}
    </section>
  );
}
