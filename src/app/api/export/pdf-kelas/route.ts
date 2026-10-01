import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listSantri } from "@/lib/data";
import { launchBrowser } from "@/lib/pdf/render";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/export/pdf-kelas?kelas=&month=&year=&mode=
 * Render halaman cetak gabungan satu kelas (/laporan/cetak) menjadi SATU file PDF
 * dalam satu pass headless Chrome (m1 = 2 hlm/santri, m2 = 1 hlm/santri).
 *
 * Super cepat (~2-3 detik) karena hanya 1 halaman web yang dibuka di Chrome,
 * lalu di-slice menjadi file PDF terpisah per santri di browser pengguna (pdf-lib).
 */
export async function GET(request: Request) {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  const kelas = searchParams.get("kelas") ?? "Kelas 1";
  const mode = searchParams.get("mode") === "m2" ? "m2" : "m1";
  if (!month || !year)
    return NextResponse.json({ error: "month, year wajib" }, { status: 400 });

  const santri = await listSantri(kelas, false, cu.institusi);
  if (santri.length === 0)
    return NextResponse.json({ error: `tidak ada santri di ${kelas}` }, { status: 404 });

  const fwdHost = request.headers.get("x-forwarded-host");
  const fwdProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = fwdHost ? `${fwdProto}://${fwdHost}` : new URL(request.url).origin;
  const cookie = request.headers.get("cookie");

  const targetUrl = `${origin}/laporan/cetak?kelas=${encodeURIComponent(kelas)}&month=${month}&year=${year}&mode=${mode}`;

  let pdfBuffer: Buffer;
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    if (cookie) await page.setExtraHTTPHeaders({ cookie });

    // domcontentloaded + fonts.ready jauh lebih cepat daripada networkidle0
    // dan menghasilkan PDF yang identik
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page
      .evaluate(async () => {
        await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
      })
      .catch(() => {});
    await page.emulateMediaType("print");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    pdfBuffer = Buffer.from(pdf);
  } catch (e) {
    return NextResponse.json(
      { error: "gagal membuat PDF", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  } finally {
    await browser.close().catch(() => {});
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="raport_${kelas}_${mode}_${month}${year}.pdf"`,
      "x-santri-count": String(santri.length),
    },
  });
}
