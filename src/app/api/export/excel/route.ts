import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getSantri, listEntries, getHaidDates } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { buildSantriSheet, santriFileName } from "@/lib/export/excel";

export const dynamic = "force-dynamic";

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

  const wb = new ExcelJS.Workbook();
  wb.creator = "Mutabaah KSN";
  buildSantriSheet(wb, santri, entries, haidSet, year, month);

  const buffer = await wb.xlsx.writeBuffer();
  const filename = santriFileName(santri, month, year);

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}