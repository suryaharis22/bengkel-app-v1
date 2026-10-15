"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";
import { ROUTES } from "@/constants/routes";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);

      await api.post("/auth/logout");

      toast.success("Logout successful");

      router.replace(ROUTES.LOGIN);
      router.refresh();
    } catch (error) {
      const apiError = getAxiosError(error);

      toast.error(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Loader2 size={17} className="animate-spin" />
      ) : (
        <LogOut size={17} />
      )}

      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
}
