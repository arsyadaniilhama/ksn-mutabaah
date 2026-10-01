"use client";

import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import type { RaportMode } from "@/components/RaportIdn";
import { monthLabel } from "@/lib/dates";

const MODES: { value: RaportMode; label: string; title: string }[] = [
  { value: "m1", label: "Mode 1 · Hijau", title: "Raport hijau heatmap (2 halaman per santri)" },
  { value: "m2", label: "Adab & Ibadah", title: "Raport Adab & Ibadah (1 halaman per santri)" },
];

export default function CetakToolbar({
  kelas,
  month,
  year,
  count,
  label,
  mode,
}: {
  kelas: string;
  month: number;
  year: number;
  count: number;
  label: string;
  mode: RaportMode;
}) {
  const hrefFor = (m: RaportMode) =>
    `/laporan/cetak?kelas=${encodeURIComponent(kelas)}&month=${month}&year=${year}&mode=${m}`;
  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 px-2">
      <div>
        <a
          href={`/laporan?kelas=${encodeURIComponent(kelas)}&month=${month}&year=${year}`}
          className="text-sm text-muted hover:text-ink"
        >
          ← Kembali ke Laporan
        </a>
        <p className="mt-1 text-xs text-faint">
          {kelas} · {monthLabel(month, year)} · {count} {label} ·{" "}
          {mode === "m2" ? `${count} halaman` : `${count * 2} halaman`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-line bg-canvas p-0.5" role="tablist" aria-label="Mode raport">
          {MODES.map((m) => (
            <Link
              key={m.value}
              href={hrefFor(m.value)}
              role="tab"
              aria-selected={mode === m.value}
              title={m.title}
              className={
                "rounded-md px-3 py-1.5 text-xs font-medium transition " +
                (mode === m.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")
              }
            >
              {m.label}
            </Link>
          ))}
        </div>
        <PrintButton label={mode === "m2" ? `Cetak ${count} Raport` : `Cetak ${count} Raport`} />
      </div>
    </div>
  );
}
