import Link from "next/link";
import { Bike } from "lucide-react";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-10">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
            <Bike size={22} />
          </div>

          <span className="text-xl font-bold tracking-tight text-gray-900">
            Bengkel<span className="text-red-600">App</span>
          </span>
        </Link>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Buat akun baru
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Daftar untuk mulai menggunakan layanan bengkel.
          </p>
        </div>

        <RegisterForm />

        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} BengkelApp
        </p>
      </div>
    </main>
  );
}
