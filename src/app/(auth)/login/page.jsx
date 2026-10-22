import Link from "next/link";
import { Bike } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login",
  description:
    "Masuk ke MotoCare untuk mengakses akun dan layanan manajemen bengkel motor.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <Link
          href="/"
          className="mb-10 flex items-center justify-center gap-2.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
            <Bike size={22} />
          </div>

          <span className="text-xl font-bold tracking-tight text-gray-900">
            Bengkel<span className="text-red-600">App</span>
          </span>
        </Link>

        {/* Heading */}
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Selamat datang
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Masuk ke akun Anda untuk melanjutkan.
          </p>
        </div>

        {/* Form */}
        <LoginForm />

        {/* Register link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-medium text-red-600 transition hover:text-red-700"
          >
            Daftar
          </Link>
        </p>

        <p className="mt-10 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} BengkelApp
        </p>
      </div>
    </main>
  );
}
