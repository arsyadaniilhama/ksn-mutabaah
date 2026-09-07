import type { AmalanKategori, FardhuStatus, ValueType } from "@/types";

/**
 * Master 19 kategori amalan Mutabaah KSN.
 * Sumber: sheet "Mutabaah" kolom Amalan/Ibadah + Keterangan.
 * value_type: 'rakaat' -> stepper angka; 'fardhu' -> segmented Tepat Waktu/Masbuq/Sendiri;
 * 'binary' -> slide toggle Ya/Tidak.
 */
export const AMALAN: AmalanKategori[] = [
  { id: 1, nama: "Sholat Tahajjud", short: "Tahajjud", keterangan: "Tulis Rakaat", value_type: "rakaat", urut: 1 },
  { id: 2, nama: "Sholat Witir", short: "Witir", keterangan: "Tulis Rakaat", value_type: "rakaat", urut: 2 },
  { id: 3, nama: "Sholat Shubuh", short: "Shubuh", keterangan: "Tepat Waktu / Masbuq / Sendiri", value_type: "fardhu", urut: 3 },
  { id: 4, nama: "Dzikir Sholat Ba'da Shubuh", short: "Dzikir Subuh", keterangan: null, value_type: "binary", urut: 4 },
  { id: 5, nama: "Infaq Shubuh", short: "Infaq Subuh", keterangan: null, value_type: "binary", urut: 5 },
  { id: 6, nama: "Dzikir Pagi", short: "Dzikir Pagi", keterangan: null, value_type: "binary", urut: 6 },
  { id: 7, nama: "Sholat Dhuha", short: "Dhuha", keterangan: "Tulis Rakaat", value_type: "rakaat", urut: 7 },
  { id: 8, nama: "Sholat Zuhur", short: "Zuhur", keterangan: "Tepat Waktu / Masbuq / Sendiri", value_type: "fardhu", urut: 8 },
  { id: 9, nama: "Dzikir Sholat Ba'da Zuhur", short: "Dzikir Zuhur", keterangan: null, value_type: "binary", urut: 9 },
  { id: 10, nama: "Sholat 'Asar", short: "'Asar", keterangan: "Tepat Waktu / Masbuq / Sendiri", value_type: "fardhu", urut: 10 },
  { id: 11, nama: "Dzikir Sholat Ba'da 'Asar", short: "Dzikir 'Asar", keterangan: null, value_type: "binary", urut: 11 },
  { id: 12, nama: "Dzikir Petang", short: "Dzikir Petang", keterangan: null, value_type: "binary", urut: 12 },
  { id: 13, nama: "Sholat Maghrib", short: "Maghrib", keterangan: "Tepat Waktu / Masbuq / Sendiri", value_type: "fardhu", urut: 13 },
  { id: 14, nama: "Dzikir Sholat Ba'da Maghrib", short: "Dzikir Maghrib", keterangan: null, value_type: "binary", urut: 14 },
  { id: 15, nama: "Sholat Isya'", short: "Isya'", keterangan: "Tepat Waktu / Masbuq / Sendiri", value_type: "fardhu", urut: 15 },
  { id: 16, nama: "Dzikir Sholat Ba'da Isya'", short: "Dzikir Isya'", keterangan: null, value_type: "binary", urut: 16 },
  { id: 17, nama: "Sholat Rawatib", short: "Rawatib", keterangan: "Tulis Rakaat", value_type: "rakaat", urut: 17 },
  { id: 18, nama: "Puasa", short: "Puasa", keterangan: null, value_type: "binary", urut: 18 },
  { id: 19, nama: "Sunnah Sebelum Tidur", short: "Sunnah Tidur", keterangan: "3 Qul dan Doa Sebelum Tidur", value_type: "binary", urut: 19 },
  // --- Adab, khusus PI IMSHUS (santriwati) ---
  { id: 20, nama: "Makan/Minum Tidak Berdiri", short: "Makan berdiri", keterangan: null, value_type: "binary", urut: 20, institusi: "PI IMSHUS" },
  { id: 21, nama: "Menjaga Suara", short: "Menjaga suara", keterangan: null, value_type: "binary", urut: 21, institusi: "PI IMSHUS" },
  { id: 22, nama: "Membantu Ustadzah/Teman", short: "Membantu", keterangan: null, value_type: "binary", urut: 22, institusi: "PI IMSHUS" },
  { id: 23, nama: "Memaafkan Kesalahan Orang Lain", short: "Memaafkan", keterangan: null, value_type: "binary", urut: 23, institusi: "PI IMSHUS" },
  { id: 24, nama: "Menyapa Orang Lain", short: "Menyapa", keterangan: null, value_type: "binary", urut: 24, institusi: "PI IMSHUS" },
  { id: 25, nama: "Memanggil Teman Sesuai Nama", short: "Panggil nama", keterangan: null, value_type: "binary", urut: 25, institusi: "PI IMSHUS" },
  { id: 26, nama: "Tidak Mengejek/Menertawakan Teman", short: "Tidak mengejek", keterangan: null, value_type: "binary", urut: 26, institusi: "PI IMSHUS" },
  { id: 27, nama: "Tidak Mengghasab Barang Orang Lain", short: "Tidak ghasab", keterangan: null, value_type: "binary", urut: 27, institusi: "PI IMSHUS" },
  { id: 28, nama: "Tidak Berkata Kotor", short: "Kata kotor", keterangan: null, value_type: "binary", urut: 28, institusi: "PI IMSHUS" },
  { id: 29, nama: "Tidak Mencela Makanan", short: "Tidak mencela", keterangan: null, value_type: "binary", urut: 29, institusi: "PI IMSHUS" },
  { id: 30, nama: "Tidak Merusak Inventaris Asrama/Sekolah", short: "Tidak merusak", keterangan: null, value_type: "binary", urut: 30, institusi: "PI IMSHUS" },
];

/** Opsi nilai sholat fardhu (urutan tampil = urutan segmen). */
export const FARDHU_OPTIONS: { value: FardhuStatus; label: string; short: string }[] = [
  { value: "tepat", label: "Tepat Waktu", short: "T" },
  { value: "masbuq", label: "Masbuq", short: "M" },
  { value: "sendiri", label: "Sendiri", short: "S" },
];

/**
 * Amalan yang TETAP dinilai penuh saat santriwati haid
 * (bukan ibadah yang gugur karena haid): Infaq Shubuh, Dzikir Pagi,
 * Dzikir Petang, Sunnah Sebelum Tidur, dan seluruh Adab (20-30).
 */
export const HAID_TETAP_IDS = new Set([5, 6, 12, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);

export const AMALAN_BY_ID: Record<number, AmalanKategori> = Object.fromEntries(
  AMALAN.map((a) => [a.id, a]),
);

/** Daftar amalan yang berlaku untuk suatu institusi (PA = 19, PI = 30). */
export function AMALAN_FOR(institusi?: string | null): AmalanKategori[] {
  return AMALAN.filter((a) => !a.institusi || a.institusi === institusi);
}

/** ID kelompok Adab (khusus PI) — untuk pemisahan bagian di raport. */
export const ADAB_IDS = new Set([20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);

export const RAKAAT_IDS = new Set(
  AMALAN.filter((a) => a.value_type === "rakaat").map((a) => a.id),
);

export function valueTypeOf(amalanId: number): ValueType {
  return AMALAN_BY_ID[amalanId]?.value_type ?? "binary";
}
