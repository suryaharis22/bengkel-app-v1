"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
      toast.error("Username atau email wajib diisi.");
      return;
    }

    if (!password) {
      toast.error("Password wajib diisi.");
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
        toast.error(responseData?.message || "Login gagal. Silakan coba lagi.");
        return;
      }

      let destination;

      switch (user.role) {
        case "admin":
          destination = ROUTES.ADMIN.DASHBOARD;
          break;
        case "teknisi":
          destination = ROUTES.TEKNISI.DASHBOARD;
          break;
        case "customer":
          destination = ROUTES.CUSTOMER.DASHBOARD;
          break;
        default:
          toast.error("Role akun tidak dikenali.");
          return;
      }

      toast.success("Login berhasil.");
      router.replace(destination);
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
        toast.error("Username/email atau password salah.");
        return;
      }

      toast.error(apiError.message || "Gagal masuk. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-gray-50";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7"
    >
      <div>
        <label
          htmlFor="identifier"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Username atau email
        </label>

        <input
          id="identifier"
          name="identifier"
          type="text"
          value={form.identifier}
          onChange={handleChange}
          placeholder="Nama pengguna atau email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          disabled={loading}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Password
        </label>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            placeholder="Masukkan password"
            autoComplete="current-password"
            disabled={loading}
            required
            className={`${inputClass} pr-11`}
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            disabled={loading}
            aria-label={
              showPassword ? "Sembunyikan password" : "Tampilkan password"
            }
            className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 transition hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && <Loader2 size={17} className="animate-spin" />}
        {loading ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
