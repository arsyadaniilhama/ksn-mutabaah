export const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Index 1-12 -> nama bulan Indonesia */
export function bulanName(month: number): string {
  return BULAN_ID[(month - 1 + 12) % 12] ?? "";
}

/** Cari nomor bulan dari nama (id/en), return 1-12 atau null */
export function bulanFromName(name: string): number | null {
  const n = String(name).trim().toLowerCase();
  const map: Record<string, number> = {
    januari: 1, januarii: 1, february: 2, februari: 2, maret: 3, march: 3,
    april: 4, mei: 5, may: 5, juni: 6, june: 6, juli: 7, july: 7,
    agustus: 8, august: 8, september: 9, october: 10, oktober: 10,
    november: 11, desember: 12, december: 12,
  };
  return map[n] ?? null;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Hari berjalan (D) untuk rentang metrik:
 * - bulan lampau  -> total hari bulan itu
 * - bulan berjalan-> tanggal hari ini
 * - bulan depan   -> 0
 */
export function hariBerjalan(year: number, month: number, now = new Date()): number {
  const dim = daysInMonth(year, month);
  const nowY = now.getFullYear();
  const nowM = now.getMonth() + 1;
  if (year < nowY || (year === nowY && month < nowM)) return dim;
  if (year === nowY && month === nowM) return now.getDate();
  return 0;
}

export function monthLabel(month: number, year: number): string {
  return `${bulanName(month)} ${year}`;
}

export function tanggalPanjang(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${bulanName(d.getMonth() + 1)} ${d.getFullYear()}`;
}
