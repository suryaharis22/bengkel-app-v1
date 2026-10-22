import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://bengkel-app-v1.vercel.app";

export const metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "MotoCare — Aplikasi Manajemen Bengkel Motor",
    template: "%s | MotoCare",
  },

  description:
    "MotoCare adalah aplikasi manajemen bengkel motor untuk mengelola booking servis, data pelanggan, kendaraan, teknisi, stok spare part, transaksi, dan pembayaran secara praktis.",

  applicationName: "MotoCare",

  keywords: [
    "aplikasi manajemen bengkel motor",
    "sistem informasi bengkel motor",
    "software bengkel motor",
    "booking servis motor online",
    "aplikasi servis motor",
    "manajemen spare part bengkel",
    "sistem kasir bengkel motor",
    "manajemen stok bengkel",
    "aplikasi bengkel online",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "MotoCare",
    title: "MotoCare — Aplikasi Manajemen Bengkel Motor",
    description:
      "Kelola booking servis, kendaraan, teknisi, stok spare part, dan transaksi bengkel dalam satu platform digital.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MotoCare — Aplikasi Manajemen Bengkel Motor",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "MotoCare — Aplikasi Manajemen Bengkel Motor",
    description:
      "Platform digital untuk mengelola servis motor, booking, spare part, dan transaksi bengkel.",
    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}

        <Toaster position="top-right" richColors closeButton />

        {process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY && (
          <Script
            src="https://app.sandbox.midtrans.com/snap/snap.js"
            data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
