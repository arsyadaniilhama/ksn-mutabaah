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

> **Catatan:** sejak ada fitur **Kelola Santri di web** (`/santri` → tambah/ubah/nonaktifkan),
> `santri.md` berfungsi sebagai *seed awal* saja. Menjalankan ulang importer dapat **menimpa
> nama** santri yang sudah diedit di web (pencocokan by NIS).

## Rute utama

| Rute | Fungsi |
| --- | --- |
| `/login` | Masuk musyrif/admin |
| `/input` | Input harian — master-detail (daftar santri + search + mini calendar; HP: slide-over) |
| `/` | Dashboard ringkasan bulan berjalan |
| `/santri` | Daftar + kelola santri (tambah, ubah, nonaktifkan) |
| `/santri/[id]` | Detail santri + grafik |
| `/santri/[id]/raport` | Raport bulanan (Cetak/Simpan PDF) |
| `/laporan` | Rekap per kelas + ekspor PDF/Excel (per santri & per kelas 1 klik) |

## Ekspor laporan

Dua jalur ekspor, keduanya memakai sumber yang sama sehingga hasilnya **identik**:

- **Per santri** — tombol di `/laporan` tiap baris.
  - PDF: `/santri/[id]/raport` → tombol *Cetak / Simpan PDF* (`window.print()`).
  - Excel: `GET /api/export/excel?santri_id=&month=&year=`.
- **Per kelas (1 klik)** — tombol **Export PDF Semua** / **Export Excel Semua** di header `/laporan`.
  Cakupannya = **kelas yang sedang aktif** di tab (mis. buka tab *Kelas 2* → ekspor semua Kelas 2).
  - **PDF** → `GET /api/export/pdf-manifest` (daftar santri) lalu `GET /api/export/pdf-batch`
    beberapa kali (offset bergeser). Server merender tiap santri dari route
    `/santri/[id]/raport` yang sama memakai headless Chrome (`src/lib/pdf/render.ts`) +
    CSS cetak yang sama, jadi **tampilannya sama persis** dengan ekspor per santri.
    Browser menggabungkan setiap batch menjadi **satu ZIP** (JSZip).
  - **Excel** → `GET /api/export/excel-all?month=&year=&kelas=` → **satu ZIP berisi 1 file .xlsx
    per santri** (tiap file identik dengan ekspor Excel per santri).
  - Semua endpoint menerima param `kelas` (Kelas 1/2/3); tanpa param = seluruh institusi.

### Catatan mesin PDF (headless Chrome) — patuh Vercel Hobby

Fungsi serverless Hobby dibatasi **60 dtk** dan **respons 4.5 MB**. Karena itu PDF dirender
**per batch 8 santri** (PDF PI terbesar ±476 KB → ±3.8 MB, selesai < 60 dtk) dan batch diunduh
**paralel** lalu digabung di browser — **tanpa perlu plan Pro**. Bila batch gagal sebagian,
tombol memberi tahu dan bisa diulang.

- Di **Vercel** memakai [`@sparticuz/chromium`](https://github.com/Sparticuz/chromium) (bundled).
  Disarankan set **Memory** fungsi `pdf-batch` (Settings → Functions) ke **≥1024 MB**.
- Di **lokal** pakai Chrome/Chromium sistem. Set bila tidak di lokasi standar:
  ```bash
  export CHROME_PATH="/usr/bin/google-chrome"   # atau path Chrome lokal
  ```

## Build & Deploy Vercel

```bash
npm run build      # verifikasi produksi
```

Push ke GitHub → import ke Vercel → set 3 environment variable (sama seperti `.env.local`)
→ Deploy. Setelah live, jalankan migration + importer sekali (bisa dari lokal).

> Ekspor PDF semua sudah dirancang untuk **plan Hobby** (render per batch ≤ 60 dtk & ≤ 4.5 MB).
> Disarankan tetap menaikkan **Memory** fungsi `pdf-batch` ke **≥1024 MB** agar Chromium lancar.

## Skrip

- `npm run dev` — development
- `npm run build` — production build
- `npm run typecheck` — cek tipe tanpa emit
- `npm run seed` — alias importer (perlu `--env-file`, lihat atas)
