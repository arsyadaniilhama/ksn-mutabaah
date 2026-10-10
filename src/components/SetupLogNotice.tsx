import { IconDatabaseCog as DatabaseCog } from "@tabler/icons-react";

/** Ditampilkan di /log bila tabel audit_log belum ada (migrasi 0007 belum jalan). */
export default function SetupLogNotice() {
  return (
    <div className="card space-y-3 border-warn/40 bg-warn-soft/40 p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warn/15 text-warn">
          <DatabaseCog size={22} stroke={1.75} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">
            Tabel log belum dibuat
          </h2>
          <p className="mt-1 text-sm text-muted">
            Fitur log butuh satu langkah sekali saja: jalankan migrasi{" "}
            <code className="rounded bg-surface2 px-1.5 py-0.5 text-xs text-ink">
              supabase/migrations/0007_audit_log.sql
            </code>{" "}
            di SQL Editor Supabase. Setelah itu log otomatis mulai tercatat —
            tidak perlu mengubah kode lagi.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-muted">
            <li>1. Buka Supabase → SQL Editor → New query.</li>
            <li>2. Tempel isi 0007_audit_log.sql → Run.</li>
            <li>3. Muat ulang halaman ini.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
