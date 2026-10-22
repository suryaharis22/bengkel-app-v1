"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getAxiosError } from "@/lib/axios-error";

export default function RegisterForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    email: "",
    no_hp: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [loading, setLoading] = useState(false);

  function validateField(name, value, values = form) {
    switch (name) {
      case "username":
        if (!value.trim()) return "Username wajib diisi.";
        if (value.trim().length < 3) return "Username minimal 3 karakter.";
        return "";

      case "email":
        if (!value.trim()) return "Email wajib diisi.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          return "Format email tidak valid.";
        return "";

      case "no_hp":
        if (value && !/^\d+$/.test(value))
          return "Nomor HP hanya boleh berisi angka.";
        return "";

      case "password":
        if (!value) return "Password wajib diisi.";
        if (value.length < 8) return "Password minimal 8 karakter.";
        if (
          values.password_confirmation &&
          value !== values.password_confirmation
        ) {
          return "Password dan konfirmasi password tidak cocok.";
        }
        return "";

      case "password_confirmation":
        if (!value) return "Konfirmasi password wajib diisi.";
        if (value !== values.password)
          return "Konfirmasi password tidak cocok.";
        return "";

      default:
        return "";
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    // Tolak huruf dan simbol pada nomor HP.
    if (name === "no_hp" && value !== "" && !/^\d+$/.test(value)) {
      return;
    }

    const updatedForm = {
      ...form,
      [name]: value,
    };

    setForm(updatedForm);

    // Validasi langsung ketika input diubah.
    setErrors((current) => ({
      ...current,
      [name]: validateField(name, value, updatedForm),
      ...(name === "password" && updatedForm.password_confirmation
        ? {
            password_confirmation: validateField(
              "password_confirmation",
              updatedForm.password_confirmation,
              updatedForm,
            ),
          }
        : {}),
      ...(name === "password_confirmation"
        ? {
            password: validateField(
              "password",
              updatedForm.password,
              updatedForm,
            ),
          }
        : {}),
    }));
  }

  function validateForm() {
    const newErrors = {};

    Object.keys(form).forEach((name) => {
      const error = validateField(name, form[name], form);

      if (error) newErrors[name] = error;
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("Periksa kembali data yang Anda masukkan.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/register", {
        username: form.username.trim(),
        email: form.email.trim(),
        no_hp: form.no_hp || null,
        password: form.password,
        password_confirmation: form.password_confirmation,
        role: "customer",
      });

      toast.success("Registrasi berhasil. Silakan login.");
      router.replace("/login");
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

      toast.error(apiError.message || "Registrasi gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (name) =>
    `w-full rounded-lg border bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 ${
      errors[name]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
        : "border-gray-200 focus:border-red-500 focus:ring-red-500/10"
    }`;

  function renderError(name) {
    return errors[name] ? (
      <p className="mt-1.5 text-xs text-red-600" role="alert">
        {errors[name]}
      </p>
    ) : null;
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <label
            htmlFor="username"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Username <span className="text-red-600">*</span>
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Masukkan username"
            value={form.username}
            onChange={handleChange}
            onBlur={(e) =>
              setErrors((prev) => ({
                ...prev,
                username: validateField("username", e.target.value),
              }))
            }
            className={inputClass("username")}
            disabled={loading}
          />
          {renderError("username")}
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Email <span className="text-red-600">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={form.email}
            onChange={handleChange}
            onBlur={(e) =>
              setErrors((prev) => ({
                ...prev,
                email: validateField("email", e.target.value),
              }))
            }
            className={inputClass("email")}
            disabled={loading}
          />
          {renderError("email")}
        </div>

        <div>
          <label
            htmlFor="no_hp"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Nomor HP{" "}
            <span className="font-normal text-gray-400">(Opsional)</span>
          </label>
          <input
            id="no_hp"
            name="no_hp"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="08xxxxxxxxxx"
            value={form.no_hp}
            onChange={handleChange}
            onBlur={(e) =>
              setErrors((prev) => ({
                ...prev,
                no_hp: validateField("no_hp", e.target.value),
              }))
            }
            className={inputClass("no_hp")}
            disabled={loading}
          />
          {renderError("no_hp")}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Password <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              value={form.password}
              onChange={handleChange}
              className={`${inputClass("password")} pr-11`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={loading}
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
              className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {renderError("password")}
          <p className="mt-1 text-xs text-gray-400">
            Gunakan minimal 8 karakter.
          </p>
        </div>

        <div>
          <label
            htmlFor="password_confirmation"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Konfirmasi Password <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              id="password_confirmation"
              name="password_confirmation"
              type={showPasswordConfirmation ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Ulangi password"
              value={form.password_confirmation}
              onChange={handleChange}
              className={`${inputClass("password_confirmation")} pr-11`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirmation((prev) => !prev)}
              disabled={loading}
              aria-label={
                showPasswordConfirmation
                  ? "Sembunyikan konfirmasi password"
                  : "Tampilkan konfirmasi password"
              }
              className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-gray-700"
            >
              {showPasswordConfirmation ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
          {renderError("password_confirmation")}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Mendaftarkan akun..." : "Buat Akun"}
          {!loading && <ArrowRight size={17} />}
        </button>

        <p className="text-center text-xs leading-5 text-gray-400">
          Akun baru akan terdaftar sebagai customer.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-medium text-red-600 hover:text-red-700"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}
