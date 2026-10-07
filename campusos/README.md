# CampusOS (frontend + backend)

```
campusos/
├─ frontend/   React 19 + Vite + Tailwind v4 — kini TERSAMBUNG ke API (login sebenar, semua halaman guna data pelayan)
├─ backend/    REST API Node, tanpa dependensi npm (SQLite terbina dalam Node 22.5+)
├─ scripts/    dev.mjs — jalankan kedua-duanya serentak
├─ .vscode/    tasks, debug, sambungan yang disyorkan
└─ requests.http   contoh request (ekstensi REST Client)
```

## Jalankan di VS Code

Syarat: **Node 22.5+** (`node -v`). Buka folder `campusos` (File → Open Folder), kemudian di terminal:

```bash
npm run dev
```

Kali pertama frontend memasang dependensi sendiri (perlu internet). Atau tekan **Ctrl+Shift+B**.

- Frontend: http://localhost:5174 · Backend: http://localhost:8788/health
- Data demo "Greenfield Academy" dibuat automatik. Kata laluan semua akaun demo: `password123`
  - `admin@campusos.io` — owner (semua kebenaran)
  - `grace.b@campusos.io` — coordinator
  - `sarah.m@campusos.io` — teacher (Form 4A & 4C)
- Atau tekan **Start onboarding** untuk mencipta organisasi baharu yang kosong.

| Perintah | Fungsi |
|---|---|
| `npm run dev` | frontend + backend |
| `npm run api` | backend sahaja |
| `npm test` | 23 ujian integrasi backend |
| `npm run seed` | cipta data demo (selamat diulang) |

## Apa yang berfungsi (diuji)

**Backend (96 endpoint, 23 ujian lulus)** — onboarding berbilang langkah dalam satu transaksi, login + refresh token berputar, lima peranan dengan matriks kebenaran, guru/kelas/pelajar/bilik, jadual waktu dengan semakan konflik, kelas live, kehadiran, cuti (baki, bertindih, lulus/undo), tugasan, peperiksaan, tugas, pengumuman bersasar, 8 laporan (JSON/CSV), analitik, tetapan, bil, **lupa/tetap semula kata laluan, 2FA TOTP (RFC 6238), e-mel melalui peti keluar + webhook, webhook pembayaran**.

**Frontend (diuji dalam pelayar sebenar dengan backend hidup)** — log masuk (ralat, 2FA, lupa kata laluan, pautan reset, terima jemputan), onboarding → organisasi baharu, sign out, sesi kekal selepas refresh. Konsol pengurusan: Overview (live ops, konflik, aktiviti), Timetable (tambah sesi + amaran konflik + "Schedule anyway"), Attendance, Workload, Teachers (tambah guru + jemputan), Classes, Rooms, Assignments, Exams, Leave (lulus/tolak/undo), Tasks, Announcements, Reports (pratonton + CSV), Analytics, Settings (organisasi, struktur, peranan, notifikasi, keselamatan + 2FA), Billing. Aplikasi guru: hari ini, jadual, kelas (+ beri tugasan), tugas, ambil kehadiran, mohon cuti, peperiksaan, pengumuman.

## Konfigurasi (backend/.env — salin daripada .env.example)

| Pemboleh ubah | Fungsi |
|---|---|
| `JWT_SECRET` | **wajib** di production |
| `APP_URL` | URL frontend dalam pautan e-mel |
| `MAIL_WEBHOOK_URL` / `MAIL_WEBHOOK_AUTH` | hantar e-mel sebenar: setiap e-mel di-POST sebagai JSON `{from,to,subject,text}` (cocok dengan Resend/Zapier/n8n). Kosong = hanya direkod; lihat `GET /v1/dev/outbox` |
| `BILLING_WEBHOOK_SECRET` | webhook pembayaran `POST /v1/billing/webhook` (`payment_succeeded` / `payment_failed` / `subscription_cancelled`) |
| `EXPOSE_INVITE_TOKENS`, `DEV_ENDPOINTS` | mati automatik bila `NODE_ENV=production` |

## Perkara yang belum ada (jujurnya)

- **Pembayaran sebenar**: tiada gateway. `POST /billing/plan` menukar pelan & mencipta invois "Due"; webhook sudah siap untuk disambungkan ke Stripe/Paddle/Billplz melalui perantara anda.
- **E-mel sebenar** bergantung pada anda menetapkan `MAIL_WEBHOOK_URL` (belum diuji terhadap penyedia sebenar; diuji dengan webhook palsu).
- **SSO / login Google**: toggle SSO di Settings hanya disimpan sebagai tetapan. 2FA TOTP per-pengguna berfungsi, tetapi "Require two-factor for all staff" belum dikuatkuasakan.
- **UI belum mendedahkan** sebahagian API yang sudah ada: ubah/batal/seret sesi jadual, pengurusan pelajar & penyerahan tugasan, ubah suai/arkib guru-kelas-bilik, urus pengguna & jemputan (API `/users`, `/invites`).
- Tiada muat naik fail, notifikasi push, kalendar cuti umum/semester (hanya tetapan), atau pelbagai bahasa.
- Zon waktu hanya difahami dalam format `GMT (UTC+N)` (tiada DST). SQLite sesuai untuk satu pelayan; untuk banyak instance, tukar ke Postgres.
- Semakan jenis penuh `tsc` belum dijalankan (sandbox tiada internet untuk memasang jenis React). Jalankan `npx tsc --noEmit` dalam `frontend/` untuk memeriksa; bundle & ujian pelayar sudah lulus.
