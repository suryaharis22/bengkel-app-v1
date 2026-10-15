Getting Started

Ikuti langkah berikut untuk menjalankan project secara lokal.

1. Install Dependencies

npm install

2. Konfigurasi Environment

Buat file .env di root project dan sesuaikan konfigurasi database PostgreSQL kamu.

DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/bengkel_db?schema=public"

Ganti USER, PASSWORD, dan bengkel_db sesuai konfigurasi PostgreSQL yang digunakan.

3. Jalankan Migrasi Database

Jika konfigurasi Prisma sudah tersedia, jalankan:

npx prisma migrate dev

Untuk membuka Prisma Studio:

npx prisma studio

4. Jalankan Development Server

npm run dev

Buka http://localhost:3000 di browser.

Tech Stack

Next.js — React framework untuk aplikasi web.

Prisma ORM — ORM untuk mengelola database.

PostgreSQL — Sistem manajemen database relasional.

Node.js — Runtime JavaScript.

Project Structure

Struktur folder dapat berbeda sesuai implementasi project.

bengkel-app-v1/
├── app/
├── prisma/
├── public/
├── .env
├── package.json
├── prisma.config.ts
└── README.md

File prisma.config.ts hanya diperlukan jika digunakan oleh konfigurasi Prisma project kamu.

Learn More

Next.js Documentation

Prisma Documentation

PostgreSQL Documentation

Deployment

Aplikasi Next.js dapat di-deploy menggunakan Vercel.

Pelajari lebih lanjut di Next.js Deployment Documentation.

Repository

GitHub: https://github.com/suryaharis22/bengkel-app-v1
