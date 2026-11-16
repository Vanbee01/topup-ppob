# TopUpKita — Top Up Game & PPOB

Starter full-stack: storefront responsif, API Express, SQLite, akun pelanggan, riwayat order, API admin, dan adapter pembayaran/supplier.

## Status integrasi
QRIS dan pengiriman produk **belum aktif** sampai merchant memiliki akun gateway dan supplier resmi, persetujuan kategori usaha, serta kredensial API. Aplikasi tidak akan menandai pembayaran berhasil atau mengirim produk secara palsu.

## Jalankan lokal
1. Node.js 20+
2. `cp .env.example .env`, lalu ganti `SESSION_SECRET`, `ADMIN_EMAIL`, dan `ADMIN_PASSWORD`.
3. `npm install && npm start`
4. Buka http://localhost:3000

Admin pertama dibuat saat startup dari `ADMIN_EMAIL` / `ADMIN_PASSWORD` bila belum ada admin.

## Railway
Deploy dari repository ini, port 3000. Pasang persistent volume pada `/app/data` (satu replica saat memakai SQLite). Atur `NODE_ENV=production`, `SESSION_SECRET` acak minimal 32 karakter, `ADMIN_EMAIL`, dan `ADMIN_PASSWORD` kuat sebelum deploy pertama. Jangan memasukkan rahasia ke GitHub.

## API
- `GET /api/products`
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/me`, `GET /api/orders`, `POST /api/orders`
- `GET /api/admin/summary`, `GET /api/admin/orders`
- `GET /health`

## Sebelum menerima transaksi nyata
Pilih payment gateway yang secara tertulis mengizinkan top-up game dan seluruh kategori PPOB yang dijual. Implementasikan pembuatan invoice, QRIS dinamis, validasi signature webhook, pengecekan status server-to-server, idempotensi, refund, dan rekonsiliasi. Pilih supplier resmi yang memberi izin reseller/API; implementasikan cek saldo, inquiry bila diperlukan, submit, status, retry aman, dan rekonsiliasi. Tambahkan kebijakan privasi, syarat layanan, refund, dan dukungan pelanggan.

Untuk skala multi-replica, migrasikan SQLite ke PostgreSQL dan gunakan session store bersama.
