import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getSantri, listEntries, getHaidDates } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { AMALAN } from "@/lib/amalan";
import { bulanName, daysInMonth } from "@/lib/dates";
import type { MutabaahEntry } from "@/types";

export const dynamic = "force-dynamic";

function safeName(s: string) {
  return s.replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "");
}

export async function GET(request: Request) {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const santriId = searchParams.get("santri_id") ?? "";
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  if (!santriId || !month || !year)
    return NextResponse.json({ error: "santri_id, month, year wajib" }, { status: 400 });

  const santri = await getSantri(santriId);
  if (!santri) return NextResponse.json({ error: "santri tidak ditemukan" }, { status: 404 });
  if (santri.institusi !== cu.institusi)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const entries = await listEntries({ year, month, santriId });
  const haidSet =
    santri.institusi === "PI IMSHUS"
      ? new Set(await getHaidDates(santriId, year, month))
      : new Set<string>();
  const dim = daysInMonth(year, month);
  const isoOf = (d: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // indeks (amalan_id, day) -> entry
  const idx = new Map<string, MutabaahEntry>();
  for (const e of entries) {
    const day = Number(e.entry_date.slice(8, 10));
    idx.set(`${e.amalan_id}:${day}`, e);
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "Mutabaah KSN";
  const ws = wb.addWorksheet(bulanName(month).slice(0, 28));

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
  AMALAN.forEach((a, i) => {
    const rowNo = 7 + i;
    const cells: (string | number | null)[] = [];
    let total = 0;
    for (let day = 1; day <= dim; day++) {
      const e = idx.get(`${a.id}:${day}`);
      const haid = haidSet.has(isoOf(day));
      if (a.value_type === "rakaat") {
        const r = e?.rakaat ?? 0;
        if (r > 0 && !haid) total += r;
        cells.push(r && r > 0 ? r : null);
      } else if (a.value_type === "fardhu") {
        const map: Record<string, string> = { tepat: "T", masbuq: "M", sendiri: "S" };
        const v = e?.status ? (map[e.status] ?? null) : null;
        if (v && !haid) total += 1;
        cells.push(v);
      } else {
        const v = e?.status === "done" ? "V" : e?.status === "miss" ? "X" : null;
        if (v === "V" && !haid) total += 1;
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
    const haidRow = ws.getRow(7 + AMALAN.length);
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

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `Mutabaah_${safeName(santri.nama)}_${bulanName(month)}${year}.xlsx`;

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
