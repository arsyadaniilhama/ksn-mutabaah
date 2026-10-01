import { HAID_TETAP_IDS } from "@/lib/amalan";
import { daysInMonth } from "@/lib/dates";
import { pctColor } from "@/lib/metrics";
import type { KategoriMetric, MutabaahEntry } from "@/types";

type CellState = "done" | "empty" | "haid" | "future";

function dayOf(iso: string): number {
  return Number(iso.slice(8, 10));
}

export default function HeatmapMutabaah({
  rows,
  entries,
  year,
  month,
  hariBerjalan,
  haidDates,
}: {
  rows: KategoriMetric[];
  entries: MutabaahEntry[];
  year: number;
  month: number;
  hariBerjalan: number;
  haidDates?: Set<string>;
}) {
  const iso = (d: number) => `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const byDayAmal = new Map<string, MutabaahEntry>();
  for (const e of entries) {
    byDayAmal.set(`${e.amalan_id}:${dayOf(e.entry_date)}`, e);
  }

  // Tampilkan SELURUH kotak tanggal dalam bulan (dim), bukan hanya s/d hari ini (D),
  // agar grid langsung penuh sejak awal bulan dan tidak "tambah 1 tiap hari".
  // Persentase metrik tetap memakai hariBerjalan (D) — hanya tampilan yang penuh.
  const dim = daysInMonth(year, month);
  const days = Array.from({ length: dim }, (_, i) => i + 1);

  const stateOf = (amalanId: number, valueType: string, day: number): CellState => {
    if (day > hariBerjalan) return "future";
    if (haidDates?.has(iso(day)) && !HAID_TETAP_IDS.has(amalanId)) return "haid";
    const e = byDayAmal.get(`${amalanId}:${day}`);
    if (!e) return "empty";
    if (valueType === "rakaat") return (e.rakaat ?? 0) > 0 ? "done" : "empty";
    if (valueType === "fardhu")
      return e.status === "tepat" || e.status === "masbuq" || e.status === "sendiri" ? "done" : "empty";
    return e.status === "done" ? "done" : "empty";
  };

  return (
    <div className="report-heatmap">
      <div className="heatmap-days" aria-hidden="true">
        <span className="heatmap-name" />
        <div className="heatmap-cells">
          {days.map((d) => (
            <span key={d} className="heatmap-daynum">{d}</span>
          ))}
        </div>
        <span className="heatmap-pct">%</span>
      </div>

      <div className="heatmap-body">
        {rows.map((r) => (
          <div key={r.amalan_id} className="heatmap-row">
            <span className="heatmap-name" title={r.nama}>
              {r.amalan_id}. {r.nama}
            </span>
            <div className="heatmap-cells">
              {days.map((d) => {
                const s = stateOf(r.amalan_id, r.value_type, d);
                return <span key={d} className={`heatmap-cell heatmap-${s}`} />;
              })}
            </div>
            <span className="heatmap-pct tnum" style={{ color: pctColor(r.pct) }}>
              {r.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
