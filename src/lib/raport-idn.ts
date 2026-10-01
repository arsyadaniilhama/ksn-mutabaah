import type { KategoriMetric, MutabaahEntry, Santri, SantriMonthlyMetrics } from "@/types";

/* ===== Mode 2 (gaya IDN): Adab vs Ibadah =====
 * PA (19 amalan): semuanya Ibadah, tidak ada Adab.
 * PI (30 amalan): id 1–19 = Ibadah, id 20–30 = Adab (11 adab).
 */
export const ADAB_IDS = new Set([20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);

export type IdnBand = "Perlu Perbaikan" | "Kurang" | "Cukup" | "Baik" | "Sangat Baik";

export const IDN_BANDS: { min: number; max: number; label: IdnBand; color: string }[] = [
  { min: 0, max: 40, label: "Perlu Perbaikan", color: "#A9442F" },
  { min: 41, max: 60, label: "Kurang", color: "#C46A1B" },
  { min: 61, max: 79, label: "Cukup", color: "#9A7A26" },
  { min: 79, max: 90, label: "Baik", color: "#147A5B" },
  { min: 91, max: 100, label: "Sangat Baik", color: "#0E5440" },
];

export function idnBand(pct: number): { label: IdnBand; color: string } {
  for (const b of IDN_BANDS) {
    if (pct >= b.min && pct <= b.max) return { label: b.label, color: b.color };
  }
  return { label: "Sangat Baik", color: "#0E5440" };
}

export interface IdnRow {
  no: number;
  nama: string;
  jumlah: number;
  pct: number;
}

export interface IdnWeek {
  label: string;
  jumlah: number;
  pct: number;
  max: number;
}

function dayOf(iso: string): number {
  return Number(iso.slice(8, 10));
}

function isDone(valueType: string, e: MutabaahEntry | undefined): boolean {
  if (!e) return false;
  if (valueType === "rakaat") return (e.rakaat ?? 0) > 0;
  if (valueType === "fardhu")
    return e.status === "tepat" || e.status === "masbuq" || e.status === "sendiri";
  return e.status === "done";
}

/** Hitung per-hari: berapa amalan selesai dari daftar id tertentu. */
function dailyCounts(
  ids: number[],
  byDayAmal: Map<string, MutabaahEntry>,
  valueTypeOf: (id: number) => string,
  days: number,
): number[] {
  const out: number[] = [];
  for (let d = 1; d <= days; d++) {
    let c = 0;
    for (const id of ids) {
      if (isDone(valueTypeOf(id), byDayAmal.get(`${id}:${d}`))) c++;
    }
    out.push(c);
  }
  return out;
}

export interface IdnData {
  isPI: boolean;
  adabIds: number[];
  ibadahIds: number[];
  adabRows: IdnRow[];
  ibadahRows: IdnRow[];
  avgAdab: number | null;
  avgIbadah: number;
  dailyAdab: number[];
  dailyIbadah: number[];
  weeksAdab: IdnWeek[];
  weeksIbadah: IdnWeek[];
  daysInMonth: number;
}

/** Rakit seluruh data Mode 2 dari metrik + entries satu santri. */
export function buildIdnData(
  santri: Santri,
  metrics: SantriMonthlyMetrics,
  entries: MutabaahEntry[],
  year: number,
  month: number,
): IdnData {
  const isPI = santri.institusi === "PI IMSHUS";
  const byId = new Map(metrics.kategori.map((k) => [k.amalan_id, k]));
  const vtOf = (id: number) => byId.get(id)?.value_type ?? "binary";

  const adabIds = isPI ? metrics.kategori.filter((k) => ADAB_IDS.has(k.amalan_id)).map((k) => k.amalan_id) : [];
  const ibadahIds = metrics.kategori.filter((k) => !ADAB_IDS.has(k.amalan_id)).map((k) => k.amalan_id);

  const byDayAmal = new Map<string, MutabaahEntry>();
  for (const e of entries) {
    if (e.santri_id !== santri.id) continue;
    byDayAmal.set(`${e.amalan_id}:${dayOf(e.entry_date)}`, e);
  }

  const dim = new Date(year, month, 0).getDate();

  const toRow = (k: KategoriMetric): IdnRow => ({
    no: k.amalan_id,
    nama: k.nama,
    jumlah: k.done,
    pct: k.pct,
  });

  const adabRows = adabIds.map((id) => toRow(byId.get(id)!));
  const ibadahRows = ibadahIds.map((id) => toRow(byId.get(id)!));

  const avg = (rows: IdnRow[]): number | null =>
    rows.length === 0 ? null : Math.round((rows.reduce((s, r) => s + r.pct, 0) / rows.length) * 100) / 100;

  const dailyAdab = isPI ? dailyCounts(adabIds, byDayAmal, vtOf, dim) : [];
  const dailyIbadah = dailyCounts(ibadahIds, byDayAmal, vtOf, dim);

  const ranges: [number, number][] =
    dim === 28
      ? [[1, 7], [8, 14], [15, 21], [22, 28]]
      : dim === 29
        ? [[1, 7], [8, 14], [15, 21], [22, 29]]
        : dim === 30
          ? [[1, 7], [8, 14], [15, 21], [22, 30]]
          : [[1, 7], [8, 14], [15, 21], [22, 31]];

  const toWeeks = (daily: number[], perDay: number): IdnWeek[] =>
    ranges.map(([a, b], i) => {
      const jumlah = daily.slice(a - 1, b).reduce((s, v) => s + v, 0);
      const max = (b - a + 1) * perDay;
      return {
        label: `Pekan ${i + 1}`,
        jumlah,
        pct: max > 0 ? Math.round((jumlah / max) * 10000) / 100 : 0,
        max,
      };
    });

  return {
    isPI,
    adabIds,
    ibadahIds,
    adabRows,
    ibadahRows,
    avgAdab: avg(adabRows),
    avgIbadah: avg(ibadahRows) ?? 0,
    dailyAdab,
    dailyIbadah,
    weeksAdab: isPI ? toWeeks(dailyAdab, adabIds.length) : [],
    weeksIbadah: toWeeks(dailyIbadah, ibadahIds.length),
    daysInMonth: dim,
  };
}

/** Rata-rata kelas per hari (untuk bilah abu pembanding di grafik harian). */
export function classDailyAvg(
  allMetrics: { santri_id: string; kategori: KategoriMetric[] }[],
  allEntries: MutabaahEntry[],
  ids: number[],
  year: number,
  month: number,
): number[] {
  const dim = new Date(year, month, 0).getDate();
  const vt = new Map<number, string>();
  for (const m of allMetrics) for (const k of m.kategori) vt.set(k.amalan_id, k.value_type);
  const sum = new Array<number>(dim).fill(0);
  const perSantri = new Map<string, MutabaahEntry[]>();
  for (const e of allEntries) {
    if (!perSantri.has(e.santri_id)) perSantri.set(e.santri_id, []);
    perSantri.get(e.santri_id)!.push(e);
  }
  let n = 0;
  for (const [, list] of perSantri) {
    const idx = new Map<string, MutabaahEntry>();
    for (const e of list) idx.set(`${e.amalan_id}:${dayOf(e.entry_date)}`, e);
    for (let d = 1; d <= dim; d++) {
      let c = 0;
      for (const id of ids) {
        if (isDone(vt.get(id) ?? "binary", idx.get(`${id}:${d}`))) c++;
      }
      sum[d - 1] += c;
    }
    n++;
  }
  return sum.map((s) => (n > 0 ? s / n : 0));
}
