export type Kelas = "Kelas 1" | "Kelas 2" | "Kelas 3";

export type Institusi = "PA IMSHUS" | "PI IMSHUS";

export type ValueType = "binary" | "rakaat" | "fardhu";

export type BinaryStatus = "done" | "miss";

export type FardhuStatus = "tepat" | "masbuq" | "sendiri";

export type EntryStatus = BinaryStatus | FardhuStatus;

export interface Santri {
  id: string;
  nis: number;
  nama: string;
  kelas: Kelas;
  institusi: string;
  aktif: boolean;
}

export interface AmalanKategori {
  id: number;
  nama: string;
  short: string;
  keterangan: string | null;
  value_type: ValueType;
  urut: number;
}

export interface MutabaahEntry {
  id?: string;
  santri_id: string;
  amalan_id: number;
  entry_date: string; // ISO yyyy-mm-dd
  status: EntryStatus | null;
  rakaat: number | null;
  catatan?: string | null;
}

/** Nilai satu sel untuk UI: status binary atau angka rakaat */
export type CellValue = EntryStatus | number | null;

export interface KategoriMetric {
  amalan_id: number;
  nama: string;
  value_type: ValueType;
  done: number;
  total: number; // hari berjalan yang dinilai
  pct: number; // 0..100
  rakaatTotal?: number;
  tepat?: number; // breakdown fardhu
  masbuq?: number;
  sendiri?: number;
}

export interface SantriMonthlyMetrics {
  santri_id: string;
  nama: string;
  kelas: Kelas;
  bulan: number; // 1..12
  tahun: number;
  hariBerjalan: number; // D
  kategori: KategoriMetric[];
  totalPoin: number;
  totalRakaat: number;
  streak: number;
  indeksRutinitas: number; // rata-rata % 19 kategori
}
