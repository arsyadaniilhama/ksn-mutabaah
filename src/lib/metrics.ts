import { AMALAN } from "@/lib/amalan";
import { daysInMonth, hariBerjalan, parseISO } from "@/lib/dates";
import type {
  KategoriMetric,
  MutabaahEntry,
  Santri,
  SantriMonthlyMetrics,
} from "@/types";

function monthOf(iso: string): { y: number; m: number; d: number } {
  const dt = parseISO(iso);
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
}

/** Filter entri milik satu santri pada satu bulan/tahun */
export function entriesForMonth(
  entries: MutabaahEntry[],
  santriId: string,
  year: number,
  month: number,
): MutabaahEntry[] {
  return entries.filter((e) => {
    if (e.santri_id !== santriId) return false;
    const { y, m } = monthOf(e.entry_date);
    return y === year && m === month;
  });
}

/**
 * Hitung metrik bulanan satu santri.
 * `entries` boleh berisi banyak santri; akan difilter per santri.
 * `haid` = Set tanggal ISO hari haid -> dikeluarkan dari penyebut (D_eff);
 * streak tidak terputus oleh hari haid.
 */
export function computeSantriMetrics(
  santri: Santri,
  entries: MutabaahEntry[],
  year: number,
  month: number,
  haid?: Set<string>,
): SantriMonthlyMetrics {
  const D = hariBerjalan(year, month);
  const iso = (d: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const isHaid = (d: number) => !!haid?.has(iso(d));
  let haidCount = 0;
  for (let d = 1; d <= D; d++) if (isHaid(d)) haidCount++;
  const D_eff = Math.max(0, D - haidCount);
  const monthEntries = entriesForMonth(entries, santri.id, year, month);

  // indeks cepat: (amalan_id, day) -> entry
  const byDayAmal = new Map<string, MutabaahEntry>();
  for (const e of monthEntries) {
    const { d } = monthOf(e.entry_date);
    byDayAmal.set(`${e.amalan_id}:${d}`, e);
  }

  const kategori: KategoriMetric[] = AMALAN.map((a) => {
    let done = 0;
    let rakaatTotal = 0;
    let tepat = 0;
    let masbuq = 0;
    let sendiri = 0;
    for (let day = 1; day <= D; day++) {
      if (isHaid(day)) continue; // hari dibebaskan, tidak dinilai
      const e = byDayAmal.get(`${a.id}:${day}`);
      if (!e) continue;
      if (a.value_type === "rakaat") {
        const r = e.rakaat ?? 0;
        rakaatTotal += r;
        if (r > 0) done++;
      } else if (a.value_type === "fardhu") {
        // Semua mode (tepat/masbuq/sendiri) dihitung "sholat" (kepatuhan).
        if (e.status === "tepat" || e.status === "masbuq" || e.status === "sendiri") {
          done++;
          if (e.status === "tepat") tepat++;
          else if (e.status === "masbuq") masbuq++;
          else sendiri++;
        }
      } else if (e.status === "done") {
        done++;
      }
    }
    const pct = D_eff > 0 ? Math.round((done / D_eff) * 100) : 0;
    return {
      amalan_id: a.id,
      nama: a.nama,
      value_type: a.value_type,
      done,
      total: D_eff,
      pct,
      ...(a.value_type === "rakaat" ? { rakaatTotal } : {}),
      ...(a.value_type === "fardhu" ? { tepat, masbuq, sendiri } : {}),
    };
  });

  const totalPoin =
    kategori.reduce((s, k) => s + k.done, 0) +
    kategori.reduce((s, k) => s + (k.rakaatTotal ?? 0), 0);
  const totalRakaat = kategori.reduce((s, k) => s + (k.rakaatTotal ?? 0), 0);

  // streak: hari berturut-turut "lengkap"; hari haid dilewati tanpa memutus
  const wajibBinary = AMALAN.filter((a) => a.value_type === "binary").map((a) => a.id);
  const wajibRakaat = AMALAN.filter((a) => a.value_type === "rakaat").map((a) => a.id);
  const wajibFardhu = AMALAN.filter((a) => a.value_type === "fardhu").map((a) => a.id);
  const isDayComplete = (day: number): boolean => {
    for (const id of wajibBinary) {
      if (byDayAmal.get(`${id}:${day}`)?.status !== "done") return false;
    }
    for (const id of wajibRakaat) {
      if ((byDayAmal.get(`${id}:${day}`)?.rakaat ?? 0) <= 0) return false;
    }
    for (const id of wajibFardhu) {
      const st = byDayAmal.get(`${id}:${day}`)?.status;
      if (st !== "tepat" && st !== "masbuq" && st !== "sendiri") return false;
    }
    return true;
  };
  let streak = 0;
  let cur = 0;
  for (let day = 1; day <= D; day++) {
    if (isHaid(day)) continue;
    if (isDayComplete(day)) {
      cur++;
      streak = Math.max(streak, cur);
    } else {
      cur = 0;
    }
  }

  const terukur = D_eff > 0;
  const indeksRutinitas =
    terukur && kategori.length > 0
      ? Math.round(kategori.reduce((s, k) => s + k.pct, 0) / kategori.length)
      : 0;

  return {
    santri_id: santri.id,
    nama: santri.nama,
    kelas: santri.kelas,
    bulan: month,
    tahun: year,
    hariBerjalan: D,
    hariTerhitung: D_eff,
    haidCount,
    terukur,
    kategori,
    totalPoin,
    totalRakaat,
    streak,
    indeksRutinitas,
  };
}

/** Rata-rata % per kategori untuk sekumpulan santri (benchmark kelas). */
export function computeKategoriBenchmark(
  metricsList: SantriMonthlyMetrics[],
): Record<number, number> {
  const terukurList = metricsList.filter((m) => m.terukur);
  const out: Record<number, number> = {};
  for (const a of AMALAN) {
    const vals = terukurList.map(
      (m) => m.kategori.find((k) => k.amalan_id === a.id)?.pct ?? 0,
    );
    out[a.id] = vals.length
      ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
      : 0;
  }
  return out;
}

export function klasifikasi(pct: number): "tinggi" | "sedang" | "rendah" {
  if (pct >= 80) return "tinggi";
  if (pct >= 50) return "sedang";
  return "rendah";
}
