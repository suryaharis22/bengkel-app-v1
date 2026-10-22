"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Menu,
  Package,
  ShieldCheck,
  Users,
  Wrench,
  X,
  Bike,
  Gauge,
} from "lucide-react";

const services = [
  {
    icon: Wrench,
    title: "Servis Motor",
    description:
      "Perawatan berkala dan perbaikan motor untuk menjaga performa kendaraan tetap optimal.",
    number: "01",
  },
  {
    icon: CalendarCheck,
    title: "Booking Online",
    description:
      "Rencanakan jadwal servis dengan mudah tanpa harus datang langsung untuk mendaftar.",
    number: "02",
  },
  {
    icon: Package,
    title: "Suku Cadang",
    description:
      "Dukungan pengelolaan suku cadang untuk kebutuhan servis dan perawatan kendaraan.",
    number: "03",
  },
];

const userRoles = [
  {
    icon: ShieldCheck,
    title: "Admin",
    description:
      "Kelola pengguna, stok suku cadang, layanan, transaksi, dan laporan operasional bengkel.",
    color: "bg-red-50 text-red-600",
  },
  {
    icon: Wrench,
    title: "Teknisi",
    description:
      "Lihat perintah kerja, periksa detail servis, dan perbarui progres pengerjaan kendaraan.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: Users,
    title: "Customer",
    description:
      "Daftarkan kendaraan, ajukan booking servis, dan pantau perkembangan servis motor.",
    color: "bg-blue-50 text-blue-600",
  },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-gray-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/20">
              <Wrench size={23} />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight">
                Moto<span className="text-red-600">Care</span>
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-gray-400">
                Workshop Management
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#home"
              className="text-sm font-medium text-gray-600 transition hover:text-red-600"
            >
              Beranda
            </a>
            <a
              href="#services"
              className="text-sm font-medium text-gray-600 transition hover:text-red-600"
            >
              Layanan
            </a>
            <a
              href="#roles"
              className="text-sm font-medium text-gray-600 transition hover:text-red-600"
            >
              Untuk Pengguna
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-gray-600 transition hover:text-red-600"
            >
              Tentang Kami
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
            >
              Daftar <ArrowUpRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 md:hidden"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-gray-100 bg-white px-5 py-4 md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {[
                ["Beranda", "#home"],
                ["Layanan", "#services"],
                ["Untuk Pengguna", "#roles"],
                ["Tentang Kami", "#about"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Daftar
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative scroll-mt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-white" />
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-red-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-28">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-semibold text-red-600 shadow-sm">
              <CheckCircle2 size={15} />
              LAYANAN BENGKEL TERINTEGRASI
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-[62px]">
              Rawat Motor Lebih Mudah,
              <span className="mt-2 block text-red-600">
                Perjalanan Lebih Nyaman.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-gray-500 sm:text-lg">
              Kelola kebutuhan servis motor melalui sistem bengkel digital.
              Mulai dari booking, pemantauan pekerjaan, hingga pengelolaan suku
              cadang dalam satu platform.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-red-600 px-7 text-sm font-bold text-white shadow-xl shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                Mulai Sekarang <ArrowRight size={18} />
              </Link>
              <a
                href="#services"
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-7 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Lihat Layanan
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
              {[
                "Booking Praktis",
                "Riwayat Servis",
                "Informasi Terorganisir",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500"
                >
                  <CheckCircle2 size={15} className="text-green-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Hero illustration */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-[36px] bg-red-100/70 blur-2xl" />

            <div className="relative overflow-hidden rounded-[30px] border border-gray-200 bg-gray-950 p-6 shadow-2xl sm:p-8">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/10" />
              <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full border border-white/10" />

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400">
                    MOTORCYCLE CARE
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-white">
                    Semua Kebutuhan dalam Satu Sistem
                  </h2>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
                  <Bike size={25} />
                </div>
              </div>

              <div className="relative my-8 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-red-950">
                <div className="absolute inset-0 opacity-20">
                  <div className="h-full w-full bg-[linear-gradient(135deg,transparent_48%,rgba(255,255,255,0.12)_49%,transparent_50%)] bg-[length:24px_24px]" />
                </div>
                <div className="relative flex flex-col items-center">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10 text-red-400 sm:h-40 sm:w-40">
                    <Wrench size={66} strokeWidth={1.1} />
                  </div>
                  <p className="mt-5 text-sm font-bold tracking-[0.16em] text-white">
                    SERVICE · CARE · TRUST
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    Satu sistem untuk semua kebutuhan bengkel
                  </p>
                </div>

                <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                    <span className="text-xs font-medium text-white">
                      Sistem layanan digital
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <CalendarCheck size={20} className="text-red-400" />
                  <p className="mt-3 text-sm font-bold text-white">
                    Booking Servis
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    Atur kebutuhan servis.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <ClipboardList size={20} className="text-red-400" />
                  <p className="mt-3 text-sm font-bold text-white">
                    Riwayat Servis
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    Pantau pekerjaan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section
        id="services"
        className="scroll-mt-24 border-t border-gray-100 bg-gray-50/70 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-600">
              Layanan Kami
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Solusi untuk Kebutuhan Bengkel
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-500 sm:text-base">
              Layanan yang membantu proses perawatan kendaraan dan operasional
              bengkel menjadi lebih terstruktur.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.number}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-xl hover:shadow-gray-200/50 sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white">
                      <Icon size={25} />
                    </div>
                    <span className="text-sm font-bold text-gray-300">
                      {service.number}
                    </span>
                  </div>

                  <h3 className="mt-7 text-xl font-bold">{service.title}</h3>
                  <p className="mt-3 min-h-[84px] text-sm leading-7 text-gray-500">
                    {service.description}
                  </p>

                  <Link
                    href="/login"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-gray-700 transition hover:text-red-600"
                  >
                    Akses Layanan <ArrowRight size={16} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role information */}
      <section id="roles" className="scroll-mt-24 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-600">
              Satu Platform, Banyak Kebutuhan
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Dirancang untuk Semua Pengguna
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-500 sm:text-base">
              Setiap pengguna memiliki fitur sesuai peran dan tanggung jawabnya
              di dalam sistem bengkel.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {userRoles.map((role) => {
              const Icon = role.icon;

              return (
                <article
                  key={role.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-gray-300 hover:shadow-lg sm:p-8"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${role.color}`}
                  >
                    <Icon size={26} />
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{role.title}</h3>
                  <p className="mt-3 min-h-[84px] text-sm leading-7 text-gray-500">
                    {role.description}
                  </p>
                  <Link
                    href="/login"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700"
                  >
                    Masuk sebagai pengguna <ArrowUpRight size={16} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="scroll-mt-24 bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-600">
              Tentang Platform
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Operasional Bengkel Lebih Terorganisir.
            </h2>
            <p className="mt-5 text-sm leading-7 text-gray-500 sm:text-base">
              Platform manajemen bengkel motor yang menyatukan data pelanggan,
              kendaraan, layanan, perintah kerja teknisi, stok suku cadang, dan
              transaksi dalam satu aplikasi.
            </p>

            <div className="mt-7 space-y-4">
              {[
                "Data kendaraan dan pelanggan terkelola.",
                "Progres pengerjaan servis lebih mudah dipantau.",
                "Transaksi dan inventaris tercatat dalam sistem.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-green-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-gray-950 p-7 text-white sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600">
              <Gauge size={28} />
            </div>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              Workshop Management
            </p>
            <h3 className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">
              Seluruh Aktivitas Bengkel dalam Satu Tempat.
            </h3>
            <p className="mt-4 text-sm leading-7 text-gray-400">
              Membantu tim bengkel bekerja lebih efisien dengan proses yang
              jelas, data yang terorganisir, dan informasi yang mudah diakses
              sesuai hak akses pengguna.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "Inventory",
                "Service Orders",
                "Booking",
                "Cashier",
                "Reports",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-red-600 px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-36 -left-20 h-72 w-72 rounded-full border border-white/10" />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">
              Mulai Sekarang
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Kelola Servis Motor dengan Lebih Mudah.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-red-100 sm:text-base">
              Masuk untuk mengakses fitur sesuai akunmu atau buat akun customer
              jika kamu baru menggunakan layanan kami.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
              >
                Masuk ke Akun <ArrowRight size={17} />
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Daftar Customer <Users size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white">
              <Wrench size={19} />
            </div>
            <span className="font-extrabold tracking-tight">
              Moto<span className="text-red-600">Care</span>
            </span>
          </Link>

          <p className="text-xs leading-6 text-gray-400">
            © {new Date().getFullYear()} MotoCare Workshop Management. All
            rights reserved.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-red-600"
          >
            Login <ArrowRight size={15} />
          </Link>
        </div>
      </footer>
    </main>
  );
}
