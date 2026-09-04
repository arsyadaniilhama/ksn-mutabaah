import type { AmalanKategori, FardhuStatus, ValueType } from "@/types";

/**
 * Master 19 kategori amalan Mutabaah KSN.
 * Sumber: sheet "Mutabaah" kolom Amalan/Ibadah + Keterangan.
 * value_type: 'rakaat' -> stepper angka; 'fardhu' -> segmented Tepat Waktu/Masbuq/Sendiri;
 * 'binary' -> slide toggle Ya/Tidak.
 */
export const AMALAN: AmalanKategori[] = [
  { id: 1, nama: "Sholat Tahajjud", keterangan: "Tulis Rakaat", value_type: "rakaat", urut: 1 },
  { id: 2, nama: "Sholat Witir", keterangan: "Tulis Rakaat", value_type: "rakaat", urut: 2 },
  { id: 3, nama: "Sholat Shubuh", keterangan: "Tepat Waktu / Masbuq / Sendiri", value_type: "fardhu", urut: 3 },
  { id: 4, nama: "Dzikir Sholat Ba'da Shubuh", keterangan: null, value_type: "binary", urut: 4 },
  { id: 5, nama: "Infaq Shubuh", keterangan: null, value_type: "binary", urut: 5 },
  { id: 6, nama: "Dzikir Pagi", keterangan: null, value_type: "binary", urut: 6 },
  { id: 7, nama: "Sholat Dhuha", keterangan: "Tulis Rakaat", value_type: "rakaat", urut: 7 },
  { id: 8, nama: "Sholat Zuhur", keterangan: "Tepat Waktu / Masbuq / Sendiri", value_type: "fardhu", urut: 8 },
  { id: 9, nama: "Dzikir Sholat Ba'da Zuhur", keterangan: null, value_type: "binary", urut: 9 },
  { id: 10, nama: "Sholat 'Asar", keterangan: "Tepat Waktu / Masbuq / Sendiri", value_type: "fardhu", urut: 10 },
  { id: 11, nama: "Dzikir Sholat Ba'da 'Asar", keterangan: null, value_type: "binary", urut: 11 },
  { id: 12, nama: "Dzikir Petang", keterangan: null, value_type: "binary", urut: 12 },
  { id: 13, nama: "Sholat Maghrib", keterangan: "Tepat Waktu / Masbuq / Sendiri", value_type: "fardhu", urut: 13 },
  { id: 14, nama: "Dzikir Sholat Ba'da Maghrib", keterangan: null, value_type: "binary", urut: 14 },
  { id: 15, nama: "Sholat Isya'", keterangan: "Tepat Waktu / Masbuq / Sendiri", value_type: "fardhu", urut: 15 },
  { id: 16, nama: "Dzikir Sholat Ba'da Isya'", keterangan: null, value_type: "binary", urut: 16 },
  { id: 17, nama: "Sholat Rawatib", keterangan: "Tulis Rakaat", value_type: "rakaat", urut: 17 },
  { id: 18, nama: "Puasa", keterangan: null, value_type: "binary", urut: 18 },
  { id: 19, nama: "Sunnah Sebelum Tidur", keterangan: "3 Qul dan Doa Sebelum Tidur", value_type: "binary", urut: 19 },
];

/** Opsi nilai sholat fardhu (urutan tampil = urutan segmen). */
export const FARDHU_OPTIONS: { value: FardhuStatus; label: string; short: string }[] = [
  { value: "tepat", label: "Tepat Waktu", short: "T" },
  { value: "masbuq", label: "Masbuq", short: "M" },
  { value: "sendiri", label: "Sendiri", short: "S" },
];

export const AMALAN_BY_ID: Record<number, AmalanKategori> = Object.fromEntries(
  AMALAN.map((a) => [a.id, a]),
);

export const RAKAAT_IDS = new Set(
  AMALAN.filter((a) => a.value_type === "rakaat").map((a) => a.id),
);

export function valueTypeOf(amalanId: number): ValueType {
  return AMALAN_BY_ID[amalanId]?.value_type ?? "binary";
}
