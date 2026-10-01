"use client";

import { useState } from "react";
import RaportSantri from "@/components/RaportSantri";
import RaportIdn, { type RaportMode } from "@/components/RaportIdn";
import ExportButtons from "@/components/ExportButtons";
import type { MutabaahEntry, Santri, SantriMonthlyMetrics } from "@/types";

export default function RaportView({
  santri,
  metrics,
  entries,
  year,
  month,
  haidDates,
  initialMode = "m1",
  kelasAvg,
}: {
  santri: Santri;
  metrics: SantriMonthlyMetrics;
  entries: MutabaahEntry[];
  year: number;
  month: number;
  haidDates?: Set<string>;
  initialMode?: RaportMode;
  kelasAvg?: { adab: number[]; ibadah: number[] };
}) {
  const [mode, setMode] = useState<RaportMode>(initialMode);
  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <a href={`/santri/${santri.id}`} className="text-sm text-muted hover:text-ink">
          ← Kembali ke detail
        </a>
        <ExportButtons santriId={santri.id} month={month} year={year} mode={mode} onModeChange={setMode} />
      </div>

      {mode === "m1" ? (
        <RaportSantri santri={santri} metrics={metrics} entries={entries} year={year} month={month} haidDates={haidDates} />
      ) : (
        <RaportIdn santri={santri} metrics={metrics} entries={entries} year={year} month={month} kelasAvg={kelasAvg} />
      )}
    </div>
  );
}
