import { requireRole } from "@/lib/auth";

import { getVehicleServiceHistoryController } from "@/controllers/vehicle.controller";

export async function GET(request, { params }) {
  try {
    const auth = await requireRole("admin");

    const { id } = await params;

    const searchParams = new URL(request.url).searchParams;

    return await getVehicleServiceHistoryController(id, auth, searchParams);
  } catch (error) {
    console.error("GET /api/admin/vehicles/[id]/service-history error:", error);

    throw error;
  }
}
