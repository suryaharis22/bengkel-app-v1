import DashboardPage from "@/components/admin/dashboard/DashboardPage";
import { requireRole } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const user = await requireRole("admin");

  return <DashboardPage user={user} />;
}
