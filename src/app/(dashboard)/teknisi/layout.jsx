import { requireRole } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function TeknisiLayout({ children }) {
  const user = await requireRole("teknisi");

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="teknisi" user={user} />

      <div className="min-h-screen lg:pl-64">
        <Header role="teknisi" user={user} />

        <main className="px-4 pb-8 pt-20 sm:px-6 lg:px-6 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
