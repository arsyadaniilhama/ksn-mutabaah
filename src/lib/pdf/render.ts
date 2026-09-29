import "server-only";
import puppeteer, { type Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

/**
 * Render halaman web (route raport yang sama dengan ekspor per santri) menjadi PDF
 * memakai headless Chrome + CSS cetak yang sama → hasil identik dengan "Cetak / Simpan PDF".
 *
 * Di Vercel/Lambda pakai @sparticuz/chromium (bundled). Di lokal bisa dipakai Chrome
 * sistem lewat env CHROME_PATH / PUPPETEER_EXECUTABLE_PATH.
 */

const LOCAL_CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

/** Apakah berjalan di lingkungan serverless (Vercel/Lambda). */
function isServerless(): boolean {
  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV
  );
}

async function resolveExecutablePath(): Promise<string> {
  if (isServerless()) return chromium.executablePath();
  for (const p of LOCAL_CHROME_CANDIDATES) {
    if (!p) continue;
    try {
      const fs = await import("node:fs");
      if (fs.existsSync(p)) return p;
    } catch {
      /* lanjut */
    }
  }
  // Terakhir: coba path chromium bundled (mungkin ada di lokal).
  try {
    return await chromium.executablePath();
  } catch (e) {
    throw new Error(
      "Chrome tidak ditemukan. Set env CHROME_PATH ke binary Chrome/Chromium lokal. " +
        (e instanceof Error ? e.message : ""),
    );
  }
}

/** Luncurkan browser (satu instance untuk banyak halaman). */
export async function launchBrowser(): Promise<Browser> {
  const executablePath = await resolveExecutablePath();
  const args = isServerless()
    ? chromium.args
    : [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--font-render-hinting=none",
      ];
  return puppeteer.launch({
    args,
    executablePath,
    headless: isServerless() ? chromium.headless : true,
    defaultViewport: { width: 1240, height: 1754, deviceScaleFactor: 1 },
  });
}

export interface RenderTarget {
  /** URL absolut halaman raport, mis. https://host/santri/<id>/raport?month=9&year=2026 */
  url: string;
}

export interface RenderOptions {
  /** Cookie mentah dari header request agar sesi login ikut terbawa. */
  cookie?: string | null;
  /** Jumlah halaman yang dirender paralel (default 4). */
  concurrency?: number;
}

async function renderOne(
  browser: Browser,
  t: RenderTarget,
  cookie?: string | null,
): Promise<Buffer> {
  const page = await browser.newPage();
  try {
    if (cookie) await page.setExtraHTTPHeaders({ cookie });
    await page.goto(t.url, { waitUntil: "networkidle0", timeout: 45_000 });
    // Pastikan font & layout stabil sebelum dicetak (identik dengan tampilan layar).
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
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Render daftar URL menjadi PDF (A4, latar berwarna) memakai satu instance browser.
 * Dirender paralel terbatas (default 4) agar 50+ santri selesai dalam batas waktu serverless.
 * Urutan hasil = urutan `targets`. Menunggu font selesai agar identik tiap kali.
 */
export async function renderPdfs(
  targets: RenderTarget[],
  options: RenderOptions = {},
): Promise<Buffer[]> {
  if (targets.length === 0) return [];
  const browser = await launchBrowser();
  const out: Buffer[] = new Array(targets.length);
  const limit = Math.max(1, options.concurrency ?? 4);
  try {
    let cursor = 0;
    async function worker() {
      for (;;) {
        const i = cursor++;
        if (i >= targets.length) return;
        out[i] = await renderOne(browser, targets[i], options.cookie);
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(limit, targets.length) }, () => worker()),
    );
  } finally {
    await browser.close().catch(() => {});
  }
  return out;
}