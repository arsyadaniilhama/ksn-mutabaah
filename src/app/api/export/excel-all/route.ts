import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { listSantri, listEntries, listHaidForMonth } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { bulanName } from "@/lib/dates";
import { buildSantriSheet, uniqueSheetName } from "@/lib/export/excel";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/export/excel-all?month=&year=
 * Satu workbook berisi SATU sheet per santri aktif di institusi user.
 * Tiap sheet identik dengan hasil ekspor Excel per santri (memakai builder yang sama).
 */
export async function GET(request: Request) {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  if (!month || !year)
    return NextResponse.json({ error: "month, year wajib" }, { status: 400 });

  const santri = await listSantri(undefined, false, cu.institusi);
  if (santri.length === 0)
    return NextResponse.json({ error: "belum ada santri aktif" }, { status: 404 });

  const [entries, haidMap] = await Promise.all([
    listEntries({ year, month, institusi: cu.institusi }),
    listHaidForMonth(year, month, cu.institusi),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Mutabaah KSN";
  const used = new Set<string>();
  for (const s of santri) {
    buildSantriSheet(
      wb,
      s,
      entries,
      haidMap.get(s.id) ?? new Set<string>(),
      year,
      month,
      uniqueSheetName(s.nama, used),
    );
  }

  const buffer = await wb.xlsx.writeBuffer();
  const label = cu.institusi === "PI IMSHUS" ? "Santriwati" : "Santri";
  const filename = `Mutabaah_Semua_${label}_${bulanName(month)}${year}.xlsx`;

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}