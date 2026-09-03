const STEP =
  "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700";

export default function SetupNotice() {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-bold text-amber-900">
          ⚙️ Supabase belum dikonfigurasi
        </h1>
        <p className="mt-1 text-sm text-amber-800">
          Aplikasi butuh kredensial Supabase sebelum bisa dipakai. Isi file{" "}
          <code className="font-mono">.env.local</code> lalu restart server dev.
        </p>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>
            Buat project di supabase.com, buka{" "}
            <b>Project Settings → API</b>, salin <b>URL</b>, <b>anon key</b>, dan{" "}
            <b>service_role key</b>.
          </li>
          <li>
            Salin contoh env lalu isi nilainya:
            <div className={STEP + " mt-1"}>copy .env.local.example .env.local</div>
          </li>
          <li>
            Isi 3 variabel ini di <code className="font-mono">.env.local</code>:
            <div className="mt-1 space-y-1">
              <div className={STEP}>NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co</div>
              <div className={STEP}>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</div>
              <div className={STEP}>SUPABASE_SERVICE_ROLE_KEY=... (server-only)</div>
            </div>
          </li>
          <li>
            Jalankan migration di <b>SQL Editor</b>:{" "}
            <code className="font-mono">supabase/migrations/0001_init.sql</code>.
          </li>
          <li>
            Buat 1 user di <b>Authentication → Users</b> (email/password) sebagai admin.
          </li>
          <li>
            (Opsional) Seed data awal:
            <div className={STEP + " mt-1"}>
              node --env-file=.env.local scripts/import-excel.mjs
            </div>
          </li>
          <li>
            Restart:{" "}
            <code className="font-mono">npm run dev</code>, lalu buka{" "}
            <code className="font-mono">/login</code>.
          </li>
        </ol>

        <p className="mt-4 text-xs text-amber-700">
          Setelah env terisi, layar ini hilang otomatis.
        </p>
      </div>
    </div>
  );
}
