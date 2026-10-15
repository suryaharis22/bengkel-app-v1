"use client";

import { useState } from "react";
import { History, Monitor } from "lucide-react";

import Monitoring from "@/components/cashier/Monitoring";
import HistoryTransaction from "@/components/cashier/History";
import DetailDialog from "@/components/cashier/DetailDialog";
import MidtransScript from "@/components/cashier/MidtransScript";

export default function CashierTransactionPage() {
  const [activeTab, setActiveTab] = useState("monitoring");

  const [selectedSaleId, setSelectedSaleId] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);

  const handleOpenDetail = (saleId) => {
    setSelectedSaleId(saleId);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedSaleId(null);
  };

  return (
    <>
      <div className="min-h-full bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Transaksi Kasir
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Pantau transaksi berjalan dan lihat histori transaksi kasir.
            </p>
          </div>

          {/* Tabs */}
          <div className="rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <div className="flex w-full">
              <button
                type="button"
                onClick={() => setActiveTab("monitoring")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition sm:flex-none ${
                  activeTab === "monitoring"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Monitor size={18} />
                Monitoring
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition sm:flex-none ${
                  activeTab === "history"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <History size={18} />
                Histori
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === "monitoring" ? (
            <Monitoring onOpenDetail={handleOpenDetail} />
          ) : (
            <HistoryTransaction onOpenDetail={handleOpenDetail} />
          )}
        </div>

        {/* Detail */}
        <DetailDialog
          open={detailOpen}
          saleId={selectedSaleId}
          onClose={handleCloseDetail}
        />
      </div>
    </>
  );
}
