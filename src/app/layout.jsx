import Script from "next/script";

import "./globals.css";

import { Toaster } from "sonner";

export const metadata = {
  title: "Bengkel App",
  description: "Workshop Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}

        <Toaster position="top-right" richColors closeButton />

        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
