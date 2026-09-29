import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { listSantri, listEntries, listHaidForMonth } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { bulanName } from "@/lib/dates";
import { buildSantriSheet, santriFileName, safeName } from "@/lib/export/excel";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/export/excel-all?month=&year=&kelas=
 * ZIP berisi SATU file .xlsx per santri (institusi user, opsional per kelas).
 * Tiap file identik dengan hasil ekspor Excel per santri (memakai builder yang sama).
 */
export async function GET(request: Request) {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  const kelas = searchParams.get("kelas") ?? undefined;
  if (!month || !year)
    return NextResponse.json({ error: "month, year wajib" }, { status: 400 });

  const santri = await listSantri(kelas, false, cu.institusi);
  if (santri.length === 0)
    return NextResponse.json({ error: "belum ada santri aktif" }, { status: 404 });

  const [entries, haidMap] = await Promise.all([
    listEntries({ year, month, kelas, institusi: cu.institusi }),
    listHaidForMonth(year, month, cu.institusi),
  ]);

  const zip = new JSZip();
  const used = new Set<string>();
  for (const s of santri) {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Mutabaah KSN";
    buildSantriSheet(wb, s, entries, haidMap.get(s.id) ?? new Set<string>(), year, month);
    const buf = await wb.xlsx.writeBuffer();
    let fname = santriFileName(s, month, year);
    if (used.has(fname.toLowerCase())) fname = `Mutabaah_${safeName(s.nama)}_${s.nis}_${bulanName(month)}${year}.xlsx`;
    used.add(fname.toLowerCase());
    zip.file(fname, new Uint8Array(buf as ArrayBuffer));
  }

  const zipBuf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const label = cu.institusi === "PI IMSHUS" ? "Santriwati" : "Santri";
  const scope = kelas ? kelas.replace(/\s+/g, "") : "Semua";
  const filename = `Mutabaah_${scope}_${label}_${bulanName(month)}${year}.zip`;

  return new NextResponse(new Uint8Array(zipBuf), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}