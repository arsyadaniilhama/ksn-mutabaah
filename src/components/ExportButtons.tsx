"use client";

import type { RaportMode } from "@/components/RaportIdn";

interface Props {
  santriId: string;
  month: number;
  year: number;
  mode?: RaportMode;
  onModeChange?: (mode: RaportMode) => void;
}

const MODES: { value: RaportMode; label: string; title: string }[] = [
  { value: "m1", label: "Mode 1 · Hijau", title: "Raport hijau heatmap (2 halaman)" },
  { value: "m2", label: "Adab & Ibadah", title: "Raport Adab & Ibadah gaya IDN (1 halaman)" },
];

export default function ExportButtons({ santriId, month, year, mode = "m1", onModeChange }: Props) {
  const excelHref = `/api/export/excel?santri_id=${santriId}&month=${month}&year=${year}`;
  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      {onModeChange && (
        <div className="flex rounded-lg border border-line bg-canvas p-0.5" role="tablist" aria-label="Mode raport">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="tab"
              aria-selected={mode === m.value}
              title={m.title}
              onClick={() => onModeChange(m.value)}
              className={
                "rounded-md px-3 py-1.5 text-xs font-medium transition " +
                (mode === m.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => window.print()} className="btn-primary">
        Cetak / Simpan PDF
      </button>
      <a href={excelHref} className="btn-outline">
        Unduh Excel
      </a>
    </div>
  );
}
