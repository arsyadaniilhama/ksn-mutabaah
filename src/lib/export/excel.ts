import ExcelJS from "exceljs";
import { AMALAN_FOR } from "@/lib/amalan";
import { bulanName, daysInMonth } from "@/lib/dates";
import type { MutabaahEntry, Santri } from "@/types";

/** Nama file aman (buang karakter non-word). */
export function safeName(s: string) {
  return s.replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "");
}

/**
 * Nama tab sheet Excel yang valid & unik.
 * Excel membatasi 31 karakter dan melarang karakter [ ] : * ? / \ serta nama ganda.
 */
export function uniqueSheetName(raw: string, used: Set<string>): string {
  let base = raw
    .replace(/[[\]:*?/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31);
  if (!base) base = "Sheet";
  let name = base;
  let i = 2;
  while (used.has(name.toLowerCase())) {
    const suffix = ` (${i})`;
    name = base.slice(0, 31 - suffix.length) + suffix;
    i += 1;
  }
  used.add(name.toLowerCase());
  return name;
}

/**
 * Tulis SATU sheet grid Mutabaah (identitas, header 1..dim, 19/30 baris amalan,
 * baris Haid, format V/X, angka rakaat, T/M/S) ke workbook.
 *
 * Sumber tunggal untuk ekspor per-santri maupun ekspor semua-santri, sehingga
 * isi kedua jalur ekspor dijamin identik.
 */
export function buildSantriSheet(
  wb: ExcelJS.Workbook,
  santri: Santri,
  entries: MutabaahEntry[],
  haidSet: Set<string>,
  year: number,
  month: number,
  sheetName?: string,
): ExcelJS.Worksheet {
  const daftar = AMALAN_FOR(santri.institusi);
  const dim = daysInMonth(year, month);
  const isoOf = (d: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // indeks (amalan_id, day) -> entry milik santri ini saja
  const idx = new Map<string, MutabaahEntry>();
  for (const e of entries) {
    if (e.santri_id !== santri.id) continue;
    const day = Number(e.entry_date.slice(8, 10));
    idx.set(`${e.amalan_id}:${day}`, e);
  }

  const ws = wb.addWorksheet(sheetName ?? bulanName(month).slice(0, 28));

  // Header identitas
  ws.getRow(1).values = ["Tabel Muhasabah"];
  ws.getRow(2).values = ["Nama", santri.nama];
  ws.getRow(3).values = ["Kelas", santri.kelas];
  ws.getRow(4).values = ["Bulan", `${bulanName(month)} ${year}`];
  [1, 2, 3, 4].forEach((r) => (ws.getRow(r).font = { bold: r === 1 }));

  // Header kolom: No | Amalan | Keterangan | 1..dim | Total
  const headerRow = ws.getRow(6);
  headerRow.values = [
    "No",
    "Amalan/Ibadah",
    "Keterangan",
    ...Array.from({ length: dim }, (_, i) => i + 1),
    "Total",
  ];
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    c.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Baris amalan
  daftar.forEach((a, i) => {
    const rowNo = 7 + i;
    const cells: (string | number | null)[] = [];
    let total = 0;
    for (let day = 1; day <= dim; day++) {
      const e = idx.get(`${a.id}:${day}`);
      if (a.value_type === "rakaat") {
        const r = e?.rakaat ?? 0;
        if (r > 0) total += r;
        cells.push(r && r > 0 ? r : null);
      } else if (a.value_type === "fardhu") {
        const map: Record<string, string> = { tepat: "T", masbuq: "M", sendiri: "S" };
        const v = e?.status ? (map[e.status] ?? null) : null;
        if (v) total += 1;
        cells.push(v);
      } else {
        const v = e?.status === "done" ? "V" : e?.status === "miss" ? "X" : null;
        if (v === "V") total += 1;
        cells.push(v);
      }
    }
    const row = ws.getRow(rowNo);
    row.values = [a.urut, a.nama, a.keterangan ?? "", ...cells, total];
    row.eachCell((c) => {
      c.border = {
        top: { style: "hair" },
        bottom: { style: "hair" },
        left: { style: "hair" },
        right: { style: "hair" },
      };
    });
    row.getCell(2).alignment = { horizontal: "left" };
    row.getCell(3).alignment = { horizontal: "left" };
    const totalCell = row.getCell(3 + dim + 1);
    totalCell.font = { bold: true };
  });

  // Baris Haid (khusus PI, hanya bila ada)
  if (haidSet.size > 0) {
    const haidRow = ws.getRow(7 + daftar.length);
    const hcells: (string | number | null)[] = [];
    let hcount = 0;
    for (let day = 1; day <= dim; day++) {
      const on = haidSet.has(isoOf(day));
      if (on) hcount++;
      hcells.push(on ? "H" : null);
    }
    haidRow.values = ["—", "Haid (dibebaskan)", "", ...hcells, `${hcount} hr`];
    haidRow.eachCell((c) => {
      c.border = {
        top: { style: "hair" },
        bottom: { style: "hair" },
        left: { style: "hair" },
        right: { style: "hair" },
      };
    });
    haidRow.getCell(2).alignment = { horizontal: "left" };
    haidRow.font = { italic: true };
  }

  ws.getColumn(2).width = 26;
  ws.getColumn(3).width = 22;
  for (let c = 4; c <= 3 + dim; c++) ws.getColumn(c).width = 4;
  ws.getColumn(4 + dim).width = 7;

  return ws;
}