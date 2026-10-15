import { requireRole } from "@/lib/auth";
import DashboardPage from "@/components/admin/dashboard/DashboardPage";

export default async function AdminDashboardPage() {
  const user = await requireRole("admin");

  return <DashboardPage user={user} />;
}
