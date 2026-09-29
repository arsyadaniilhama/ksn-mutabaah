"use client";

import { useState } from "react";
import {
  IconFileTypePdf as FilePdf,
  IconFileTypeXls as FileXls,
  IconLoader2 as Loader,
} from "@tabler/icons-react";

interface Props {
  month: number;
  year: number;
  count: number;
  kelas: string;
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
 * Ekspor per kelas dalam 1 klik.
 *
 * PDF: buka halaman cetak gabungan (/laporan/cetak) di tab baru → langsung Save as PDF
 * lewat dialog browser. Cepat (2-3 detik) karena tidak pakai server-side Chromium.
 *
 * Excel: unduh ZIP berisi 1 file .xlsx per santri (identik dengan ekspor per santri).
 */
export default function ExportAllButtons({ month, year, count, kelas }: Props) {
  const [busy, setBusy] = useState<"excel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openPrintPage() {
    const url = `/laporan/cetak?kelas=${encodeURIComponent(kelas)}&month=${month}&year=${year}`;
    window.open(url, "_blank");
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
      saveBlob(blob, m?.[1] ?? `mutabaah_${kelas}_${month}${year}.zip`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={openPrintPage}
        className="btn-outline h-9"
        title={`Cetak raport PDF seluruh ${kelas} (${count} santri) — buka halaman cetak, lalu Save as PDF`}
      >
        <FilePdf size={16} stroke={1.75} />
        Export PDF ({kelas})
      </button>
      <button
        type="button"
        onClick={downloadExcel}
        disabled={!!busy}
        className="btn-outline h-9"
        title={`Ekspor Excel seluruh ${kelas} (${count} santri) — ZIP, 1 file .xlsx per santri`}
      >
        {busy === "excel" ? <Loader size={16} className="animate-spin" /> : <FileXls size={16} stroke={1.75} />}
        {busy === "excel" ? "Menyiapkan…" : `Export Excel (${kelas})`}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}