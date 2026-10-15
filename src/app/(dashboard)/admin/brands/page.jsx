"use client";

import { useState } from "react";

import BrandFilter from "@/components/brands/BrandFilter";
import BrandForm from "@/components/brands/BrandForm";
import BrandTable from "@/components/brands/BrandTable";

export default function BrandsPage() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const [formOpen, setFormOpen] = useState(false);

  const [formMode, setFormMode] = useState("create");

  const [selectedBrand, setSelectedBrand] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);

  function handleFilterChange(nextFilters) {
    setFilters(nextFilters);
  }

  function handleCreate() {
    setSelectedBrand(null);
    setFormMode("create");
    setFormOpen(true);
  }

  function handleEdit(brand) {
    setSelectedBrand(brand);
    setFormMode("edit");
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setSelectedBrand(null);
  }

  function handleSubmit() {
    handleCloseForm();

    setRefreshKey((current) => current + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Brands</h1>

        <p className="mt-1 text-sm text-gray-500">Manage spare part brands.</p>
      </div>

      <BrandFilter
        filters={filters}
        onChange={handleFilterChange}
        onCreate={handleCreate}
      />

      <BrandTable
        filters={filters}
        refreshKey={refreshKey}
        onEdit={handleEdit}
      />

      <BrandForm
        open={formOpen}
        mode={formMode}
        brand={selectedBrand}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
