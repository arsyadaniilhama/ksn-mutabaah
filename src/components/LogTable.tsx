"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IconCheck as Check,
  IconChevronLeft as ChevronLeft,
  IconChevronRight as ChevronRight,
  IconFilter as Filter,
  IconInbox as Inbox,
  IconRotateClockwise2 as Reset,
} from "@tabler/icons-react";
import Avatar from "@/components/Avatar";
import { tapFeedback } from "@/lib/haptics";
import type { AuditLogRow } from "@/lib/data";

interface Props {
  rows: AuditLogRow[];
  total: number;
  page: number;
  totalPages: number;
  actors: string[];
  santriOptions: { id: string; nama: string; kelas: string }[];
  filter: {
    actor: string;
    action: string;
    santri: string;
    from: string;
    to: string;
    q: string;
  };
}

const ACTION_META: Record<
  string,
  { label: string; tone: string; dot: string }
> = {
  check: { label: "Centang", tone: "bg-accent-soft text-accent", dot: "bg-accent" },
  uncheck: { label: "Batal", tone: "bg-danger-soft text-danger", dot: "bg-danger" },
  set: { label: "Ubah", tone: "bg-warn-soft text-warn", dot: "bg-warn" },
  haid_on: { label: "Haid", tone: "bg-danger-soft text-danger", dot: "bg-danger" },
  haid_off: { label: "Batal Haid", tone: "bg-surface2 text-muted", dot: "bg-faint" },
};

/** Format waktu WIB: "Sabtu, 10 Okt 2026 · 14.32.05" (jam-penuh + bulan 3 huruf). */
function fmtWaktu(iso: string): { tgl: string; jam: string } {
  const d = new Date(iso);
  const tgl = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
  const jam = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(/:/g, ".");
  return { tgl, jam };
}

function fmtTanggal(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Apakah baris ini mengganti akun (baris di atasnya beda akun) → tampilkan header akun. */
function isNewActor(rows: AuditLogRow[], i: number): boolean {
  if (i === 0) return true;
  return rows[i].actor_email !== rows[i - 1].actor_email;
}

export default function LogTable({
  rows,
  total,
  page,
  totalPages,
  actors,
  santriOptions,
  filter,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [local, setLocal] = useState(filter);

  const apply = (next: Partial<typeof filter>, resetPage = true) => {
    const merged = { ...local, ...next };
    setLocal(merged);
    const params = new URLSearchParams();
    if (merged.actor) params.set("actor", merged.actor);
    if (merged.action) params.set("action", merged.action);
    if (merged.santri) params.set("santri", merged.santri);
    if (merged.from) params.set("from", merged.from);
    if (merged.to) params.set("to", merged.to);
    if (merged.q) params.set("q", merged.q);
    if (!resetPage) params.set("page", String(page));
    tapFeedback();
    start(() => router.push(`/log?${params.toString()}`));
  };

  const aktifFilter = useMemo(
    () =>
      [local.actor, local.action, local.santri, local.from, local.to, local.q].filter(
        Boolean,
      ).length,
    [local],
  );

  // Kelompokkan per tanggal (WIB) untuk pemisah hari.
  const rowsWithDay = useMemo(() => {
    let prevDay = "";
    return rows.map((r) => {
      const day = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(r.created_at));
      const show = day !== prevDay;
      prevDay = day;
      return { r, showDay: show, day };
    });
  }, [rows]);

  const goPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    const params = new URLSearchParams();
    if (local.actor) params.set("actor", local.actor);
    if (local.action) params.set("action", local.action);
    if (local.santri) params.set("santri", local.santri);
    if (local.from) params.set("from", local.from);
    if (local.to) params.set("to", local.to);
    if (local.q) params.set("q", local.q);
    if (p > 1) params.set("page", String(p));
    tapFeedback();
    start(() => router.push(`/log?${params.toString()}`));
  };

  return (
    <div className="space-y-4">
      {/* Panel filter */}
      <div className="card space-y-3 p-3 sm:p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-faint">
          <Filter size={14} stroke={1.9} /> Filter
          {aktifFilter > 0 && (
            <span className="chip bg-accent-soft text-accent">{aktifFilter}</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <label className="col-span-2 flex flex-col gap-1 sm:col-span-1 lg:col-span-2">
            <span className="px-0.5 text-[11px] font-medium text-faint">Cari</span>
            <input
              value={local.q}
              onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && apply({ q: local.q })}
              placeholder="nama santri / amalan"
              className="input h-9 text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="px-0.5 text-[11px] font-medium text-faint">Akun</span>
            <select
              value={local.actor}
              onChange={(e) => apply({ actor: e.target.value })}
              className="input h-9 text-xs"
            >
              <option value="">Semua akun</option>
              {actors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="px-0.5 text-[11px] font-medium text-faint">Aksi</span>
            <select
              value={local.action}
              onChange={(e) => apply({ action: e.target.value })}
              className="input h-9 text-xs"
            >
              <option value="">Semua aksi</option>
              <option value="check">Centang</option>
              <option value="uncheck">Batal centang</option>
              <option value="haid_on">Tandai haid</option>
              <option value="haid_off">Batal haid</option>
            </select>
          </label>
          <label className="col-span-2 flex flex-col gap-1">
            <span className="px-0.5 text-[11px] font-medium text-faint">Santri</span>
            <select
              value={local.santri}
              onChange={(e) => apply({ santri: e.target.value })}
              className="input h-9 text-xs"
            >
              <option value="">Semua santri</option>
              {santriOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} · {s.kelas}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="px-0.5 text-[11px] font-medium text-faint">Dari</span>
            <input
              type="date"
              value={local.from}
              onChange={(e) => apply({ from: e.target.value })}
              className="input h-9 text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="px-0.5 text-[11px] font-medium text-faint">Sampai</span>
            <input
              type="date"
              value={local.to}
              onChange={(e) => apply({ to: e.target.value })}
              className="input h-9 text-xs"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <span className="text-xs text-faint">
            {pending ? "Memuat…" : `${total} aktivitas tercatat`}
          </span>
          <div className="flex items-center gap-2">
            {aktifFilter > 0 && (
              <button
                type="button"
                onClick={() => {
                  setLocal({ actor: "", action: "", santri: "", from: "", to: "", q: "" });
                  tapFeedback();
                  start(() => router.push("/log"));
                }}
                className="btn-ghost h-8 px-2 text-xs"
              >
                <Reset size={14} stroke={1.9} /> Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => apply({ q: local.q })}
              className="btn-outline h-8 text-xs"
              disabled={pending}
            >
              <Check size={14} stroke={2} /> Terapkan
            </button>
          </div>
        </div>
      </div>

      {/* Daftar log */}
      <div className="card overflow-hidden">
        <div className="hidden border-b border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-faint sm:grid sm:grid-cols-[76px_1fr_1fr_120px] sm:gap-3">
          <span>Jam (WIB)</span>
          <span>Aksi &amp; amalan</span>
          <span>Santri</span>
          <span className="text-right">Akun</span>
        </div>
        <ul className="divide-y divide-line">
          {rowsWithDay.map(({ r, showDay }, i) => {
            const meta = ACTION_META[r.action] ?? {
              label: r.action,
              tone: "bg-surface2 text-muted",
              dot: "bg-faint",
            };
            const waktu = fmtWaktu(r.created_at);
            return (
              <li key={r.id}>
                {showDay && (
                  <div className="flex items-center gap-2 bg-surface2/60 px-4 py-1.5 text-[11px] font-semibold text-muted">
                    {waktu.tgl}
                  </div>
                )}
                <div className="flex flex-col gap-1.5 px-4 py-2.5 sm:grid sm:grid-cols-[76px_1fr_1fr_120px] sm:items-center sm:gap-3">
                  <span className="tnum text-[11px] font-semibold tabular-nums text-faint sm:text-muted">
                    {waktu.jam}
                  </span>
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={
                        "shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold " +
                        meta.tone
                      }
                    >
                      {meta.label}
                    </span>
                    <span className="min-w-0 truncate text-sm text-ink">
                      {r.amalan_nama ?? (r.entity === "haid" ? "Haid" : "—")}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 text-xs">
                    <span className="truncate font-medium text-ink">
                      {r.santri_nama ?? "—"}
                    </span>
                    {r.santri_kelas && (
                      <span className="shrink-0 text-faint">
                        {r.santri_kelas.replace("Kelas ", "K")}
                      </span>
                    )}
                    {r.entry_date && (
                      <span className="tnum hidden shrink-0 text-faint lg:inline">
                        · {fmtTanggal(r.entry_date)}
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5 sm:justify-end">
                    {isNewActor(rows, i) && <Avatar name={r.actor_email} size="sm" />}
                    <span className="truncate text-[11px] text-muted sm:text-right">
                      {r.actor_email}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
          {rows.length === 0 && (
            <li className="px-4 py-14 text-center">
              <Inbox size={22} stroke={1.6} className="mx-auto mb-2 text-faint" />
              <p className="text-sm text-muted">Belum ada aktivitas yang cocok.</p>
              <p className="mt-0.5 text-xs text-faint">
                Log mulai tercatat setelah tabel audit_log dibuat dan ada centang baru.
              </p>
            </li>
          )}
        </ul>
      </div>

      {/* Paginasi */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => goPage(page - 1)}
            disabled={page <= 1 || pending}
            className="btn-outline h-9 text-xs disabled:opacity-40"
          >
            <ChevronLeft size={15} stroke={2} /> Sebelumnya
          </button>
          <span className="tnum text-xs text-muted">
            Halaman {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goPage(page + 1)}
            disabled={page >= totalPages || pending}
            className="btn-outline h-9 text-xs disabled:opacity-40"
          >
            Berikutnya <ChevronRight size={15} stroke={2} />
          </button>
        </div>
      )}
    </div>
  );
}
