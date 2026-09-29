"use client";

import { useState } from "react";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import {
  IconFileTypePdf as FilePdf,
  IconFileTypeXls as FileXls,
  IconLoader2 as Loader,
  IconPrinter as Printer,
} from "@tabler/icons-react";
import { bulanName } from "@/lib/dates";

interface Props {
  month: number;
  year: number;
  count: number;
  kelas: string;
}

interface Manifest {
  namaFile: string;
  santri: { id: string; nama: string; nis: number }[];
}

function safeName(s: string) {
  return s.replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "");
}

function kelasQuery(kelas: string) {
  return kelas ? `&kelas=${encodeURIComponent(kelas)}` : "";
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Ekspor per kelas dalam 1 klik (< 5 detik).
 *
 * PDF:
 * 1. Server merender gabungan kelas (/laporan/cetak) menjadi 1 PDF dalam satu pass Chrome (~2.5s).
 * 2. Browser memotong (slice) PDF tersebut menjadi file PDF individual per nama santri via pdf-lib (~0.5s).
 * 3. Browser mengompresi menjadi 1 file ZIP (JSZip, ~0.2s) dan otomatis mengunduhnya.
 * Hasil: file PDF terpisah per nama santri, 100% identik dengan cetak per santri, selesai dalam ~3-4 detik.
 *
 * Excel:
 * Mengunduh ZIP berisi 1 file .xlsx per santri (identik dengan ekspor per santri, ~1-2s).
 */
export default function ExportAllButtons({ month, year, count, kelas }: Props) {
  const [busy, setBusy] = useState<"pdf" | "excel" | null>(null);
  const [statusText, setStatusText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function downloadPdf() {
    if (busy) return;
    setBusy("pdf");
    setError(null);
    setStatusText("Membuat PDF…");

    try {
      // 1. Ambil manifest santri & buat combined PDF secara paralel
      const [manifestRes, pdfRes] = await Promise.all([
        fetch(`/api/export/pdf-manifest?month=${month}&year=${year}${kelasQuery(kelas)}`),
        fetch(`/api/export/pdf-kelas?month=${month}&year=${year}${kelasQuery(kelas)}`),
      ]);

      if (!manifestRes.ok) {
        throw new Error("Gagal mengambil daftar santri.");
      }
      const manifest = (await manifestRes.json()) as Manifest;
      if (!manifest.santri || manifest.santri.length === 0) {
        throw new Error(`Tidak ada santri di ${kelas}.`);
      }

      if (!pdfRes.ok) {
        let msg = `Gagal membuat PDF (${pdfRes.status})`;
        try {
          const j = await pdfRes.json();
          msg = j.error ?? j.detail ?? msg;
        } catch {
          /* biarkan */
        }
        throw new Error(msg);
      }

      // 2. Ambil buffer PDF
      setStatusText("Memisahkan per santri…");
      const pdfBytes = await pdfRes.arrayBuffer();

      // 3. Potong (slice) PDF per santri menggunakan pdf-lib di memori browser
      const combinedDoc = await PDFDocument.load(pdfBytes);
      const totalPages = combinedDoc.getPageCount();
      const expectedPages = manifest.santri.length * 2;

      const zip = new JSZip();
      const usedNames = new Set<string>();

      for (let i = 0; i < manifest.santri.length; i++) {
        const s = manifest.santri[i];
        const page1Idx = i * 2;
        const page2Idx = i * 2 + 1;

        if (page2Idx >= totalPages) break;

        const subDoc = await PDFDocument.create();
        const pages = await subDoc.copyPages(combinedDoc, [page1Idx, page2Idx]);
        pages.forEach((p) => subDoc.addPage(p));
        const subBytes = await subDoc.save();

        let baseName = safeName(s.nama || `santri_${i + 1}`);
        if (usedNames.has(baseName.toLowerCase())) {
          baseName = `${baseName}_${s.nis}`;
        }
        usedNames.add(baseName.toLowerCase());

        const fileName = `Raport_${baseName}_${bulanName(month)}${year}.pdf`;
        zip.file(fileName, subBytes);
      }

      // 4. Kompresi ZIP & unduh
      setStatusText("Menyiapkan ZIP…");
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      saveBlob(zipBlob, manifest.namaFile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan saat ekspor PDF.");
    } finally {
      setBusy(null);
      setStatusText("");
    }
  }

  async function downloadExcel() {
    if (busy) return;
    setBusy("excel");
    setError(null);
    try {
      const url = `/api/export/excel-all?month=${month}&year=${year}${kelasQuery(kelas)}`;
      const res = await fetch(url);
      if (!res.ok) {
        let msg = `Gagal (${res.status})`;
        try {
          const j = await res.json();
          msg = j.error ?? j.detail ?? msg;
        } catch {
          /* biarkan */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const m = /filename="?([^"]+)"?/.exec(res.headers.get("Content-Disposition") ?? "");
      saveBlob(blob, m?.[1] ?? `Mutabaah_${kelas}_${month}${year}.zip`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan saat ekspor Excel.");
    } finally {
      setBusy(null);
    }
  }

  function openPrintPage() {
    const url = `/laporan/cetak?kelas=${encodeURIComponent(kelas)}&month=${month}&year=${year}`;
    window.open(url, "_blank");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={downloadPdf}
        disabled={!!busy}
        className="btn-outline h-9"
        title={`Unduh ZIP raport PDF per santri seluruh ${kelas} (${count} file) — cepat < 5 detik`}
      >
        {busy === "pdf" ? <Loader size={16} className="animate-spin" /> : <FilePdf size={16} stroke={1.75} />}
        {busy === "pdf" ? statusText || "Membuat PDF…" : `Export PDF (${kelas})`}
      </button>

      <button
        type="button"
        onClick={downloadExcel}
        disabled={!!busy}
        className="btn-outline h-9"
        title={`Ekspor Excel seluruh ${kelas} (${count} santri) — ZIP berisi 1 file .xlsx per santri`}
      >
        {busy === "excel" ? <Loader size={16} className="animate-spin" /> : <FileXls size={16} stroke={1.75} />}
        {busy === "excel" ? "Menyiapkan…" : `Export Excel (${kelas})`}
      </button>

      <button
        type="button"
        onClick={openPrintPage}
        className="btn-ghost h-9 px-2.5 text-xs text-muted hover:text-ink"
        title="Buka tampilan cetak semua santri di tab baru untuk dicetak langsung"
      >
        <Printer size={15} stroke={1.75} />
        Cetak
      </button>

      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
