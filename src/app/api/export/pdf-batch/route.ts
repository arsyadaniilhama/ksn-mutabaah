import { NextResponse } from "next/server";
import JSZip from "jszip";
import { listSantri } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { bulanName } from "@/lib/dates";
import { renderPdfs } from "@/lib/pdf/render";
import { safeName } from "@/lib/export/excel";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Batch default aman untuk limit fungsi Hobby (respons < 4.5 MB, selesai < 60 dtk).
const BATCH = 10;
const CLAMP = 1;

/**
 * GET /api/export/pdf-batch?month=&year=&offset=&limit=
 * Render SEBAGIAN santri (default 12) menjadi ZIP kecil.
 *
 * Kenapa per batch: fungsi Hobby dibatasi 60 dtk & respons 4.5 MB, sedangkan 52 PDF
 * bisa ~18 MB. Klien memanggil endpoint ini beberapa kali (offset bergeser) lalu
 * menggabungkan hasilnya menjadi satu ZIP di browser. Tiap PDF tetap dirender dari
 * route /santri/[id]/raport yang sama → identik dengan ekspor per santri.
 */
export async function GET(request: Request) {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);
  const rawLimit = Number(searchParams.get("limit")) || BATCH;
  const limit = Math.min(30, Math.max(CLAMP, rawLimit));
  // Halaman dirender paralel di dalam satu panggilan (makin tinggi makin cepat,
  // tapi makan CPU/memori). Di-clamp agar aman.
  const concurrency = Math.min(
    8,
    Math.max(1, Number(searchParams.get("concurrency")) || 6),
  );
  if (!month || !year)
    return NextResponse.json({ error: "month, year wajib" }, { status: 400 });

  const all = await listSantri(undefined, false, cu.institusi);
  const santri = all.slice(offset, offset + limit);
  if (santri.length === 0)
    return NextResponse.json({ error: "tidak ada santri di rentang ini" }, { status: 404 });

  const fwdHost = request.headers.get("x-forwarded-host");
  const fwdProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = fwdHost ? `${fwdProto}://${fwdHost}` : new URL(request.url).origin;
  const cookie = request.headers.get("cookie");

  let pdfs: Buffer[];
  try {
    pdfs = await renderPdfs(
      santri.map((s) => ({
        url: `${origin}/santri/${s.id}/raport?month=${month}&year=${year}`,
      })),
      { cookie, concurrency },
    );
  } catch (e) {
    return NextResponse.json(
      { error: "gagal membuat PDF", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }

  const zip = new JSZip();
  const used = new Set<string>();
  santri.forEach((s, i) => {
    let base = safeName(s.nama || `santri-${offset + i + 1}`);
    if (used.has(base)) base = `${base}_${s.nis}`;
    used.add(base);
    zip.file(`Raport_${base}_${bulanName(month)}${year}.pdf`, pdfs[i]);
  });
  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="raport_batch_${offset}.zip"`,
    },
  });
}