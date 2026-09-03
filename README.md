# Mutabaah KSN Web

Aplikasi web pencatatan mutabaah harian santri PA IMSHUS (19 kategori amalan), metrik per
santri, dan ekspor laporan bulanan (PDF raport + Excel). Stack: **Next.js (App Router) +
TypeScript + Tailwind**, database **Supabase**, deploy **Vercel**.

Rancangan lengkap ada di [`../prd.md`](../prd.md).

## Menjalankan lokal

```bash
npm install
cp .env.local.example .env.local   # isi kredensial Supabase
npm run dev                         # http://localhost:3000
```

## Setup Supabase (sekali)

1. Buat project di supabase.com → ambil **URL**, **anon key**, **service_role key**.
2. Di **SQL Editor**, jalankan isi `supabase/migrations/0001_init.sql`.
3. Di **Authentication → Users**, tambah 1 user email/password (musyrif/admin).
   Trigger `on_auth_user_created` otomatis membuat baris `profiles` dengan `role='admin'`.
4. Isi `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `SEED_DEFAULT_YEAR` (mis. 2026)

## Seed data awal (default: roster saja)

Membaca `../santri.md` (52 santri) + 19 kategori amalan:

```bash
node --env-file=.env.local scripts/import-excel.mjs
```

Opsional — ikut mengimpor entri contoh dari `../Mutabaah KSN.xlsx` (sheet `Data Mutabaah`):

```bash
node --env-file=.env.local scripts/import-excel.mjs --with-entries
```

Skrip mencetak jumlah dan **mem-flag** nama/nilai tak cocok (tanpa menghentikan proses).

## Rute utama

| Rute | Fungsi |
| --- | --- |
| `/login` | Masuk musyrif/admin |
| `/input` | Input harian (tab santri + slide toggle Ya/Tidak, stepper rakaat) |
| `/` | Dashboard ringkasan bulan berjalan |
| `/santri` · `/santri/[id]` | Daftar & detail santri + grafik |
| `/santri/[id]/raport` | Raport bulanan (Cetak/Simpan PDF) |
| `/laporan` | Rekap per kelas + ekspor PDF/Excel |

## Build & Deploy Vercel

```bash
npm run build      # verifikasi produksi
```

Push ke GitHub → import ke Vercel → set 3 environment variable (sama seperti `.env.local`)
→ Deploy. Setelah live, jalankan migration + importer sekali (bisa dari lokal).

## Skrip

- `npm run dev` — development
- `npm run build` — production build
- `npm run typecheck` — cek tipe tanpa emit
- `npm run seed` — alias importer (perlu `--env-file`, lihat atas)
