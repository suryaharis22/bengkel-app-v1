"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";
import { ROUTES } from "@/constants/routes";

export default function LoginForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const identifier = form.identifier.trim();
    const password = form.password;

    if (!identifier) {
      toast.error("Username or email is required");
      return;
    }

    if (!password) {
      toast.error("Password is required");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        identifier,
        password,
      });

      const responseData = response?.data;
      const user = responseData?.data?.user;

      if (!responseData?.success || !user) {
        toast.error(responseData?.message || "Login failed. Please try again.");
        return;
      }

      toast.success("Login successful");

      switch (user.role) {
        case "admin":
          router.replace(ROUTES.ADMIN.DASHBOARD);
          break;

        case "teknisi":
          router.replace(ROUTES.TEKNISI.DASHBOARD);
          break;

        case "customer":
          router.replace(ROUTES.CUSTOMER.DASHBOARD);
          break;

        default:
          toast.error("Invalid user role");
          break;
      }
    } catch (error) {
      const apiError = getAxiosError(error);

      if (apiError.code === 422 && apiError.errors) {
        const firstError = Object.values(apiError.errors)[0];

        toast.error(
          Array.isArray(firstError)
            ? firstError[0]
            : firstError || apiError.message,
        );

        return;
      }

      if (apiError.code === 401) {
        toast.error("Username/email atau password salah");
        return;
      }

      toast.error(apiError.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username / Email */}
        <div>
          <label
            htmlFor="identifier"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Username or Email
          </label>

          <div className="relative">
            <User
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="identifier"
              name="identifier"
              type="text"
              value={form.identifier}
              onChange={handleChange}
              placeholder="Enter username or email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={loading}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Password
          </label>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={loading}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              disabled={loading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 disabled:cursor-not-allowed"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}

          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
