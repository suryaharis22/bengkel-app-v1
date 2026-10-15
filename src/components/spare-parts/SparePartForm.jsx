"use client";

import SparePartFormAdd from "@/components/spare-parts/SparePartFormAdd";
import SparePartFormEdit from "@/components/spare-parts/SparePartFormEdit";

/**
 * Parent component: routes to the Add or Edit form based on `mode`.
 * mode="create" (default) renders SparePartFormAdd.
 * mode="edit" renders SparePartFormEdit.
 */
export default function SparePartForm({ mode = "create", ...props }) {
  if (mode === "edit") {
    return <SparePartFormEdit {...props} />;
  }

  return <SparePartFormAdd {...props} />;
}
