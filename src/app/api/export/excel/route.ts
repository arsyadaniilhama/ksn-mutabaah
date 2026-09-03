import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { getSantri, listEntries } from "@/lib/data";
import { AMALAN } from "@/lib/amalan";
import { bulanName, daysInMonth } from "@/lib/dates";
import type { MutabaahEntry } from "@/types";

export const dynamic = "force-dynamic";

function safeName(s: string) {
  return s.replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "");
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const santriId = searchParams.get("santri_id") ?? "";
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  if (!santriId || !month || !year)
    return NextResponse.json({ error: "santri_id, month, year wajib" }, { status: 400 });

  const santri = await getSantri(santriId);
  if (!santri) return NextResponse.json({ error: "santri tidak ditemukan" }, { status: 404 });

  const entries = await listEntries({ year, month, santriId });
  const dim = daysInMonth(year, month);

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
      if (a.value_type === "rakaat") {
        const r = e?.rakaat ?? null;
        if (r && r > 0) total += r;
        cells.push(r && r > 0 ? r : null);
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
