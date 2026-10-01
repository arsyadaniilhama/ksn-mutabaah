"use client";

import { useState } from "react";
import {
  IconFileTypeXls as FileXls,
  IconLoader2 as Loader,
  IconPrinter as Printer,
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
 * Ekspor per kelas: Excel (1 klik unduh ZIP berisi 1 file .xlsx per santri)
 * + tombol Cetak (buka halaman cetak gabungan untuk Save as PDF / cetak langsung).
 */
export default function ExportAllButtons({ month, year, count, kelas }: Props) {
  const [busy, setBusy] = useState<"excel" | null>(null);
  const [error, setError] = useState<string | null>(null);

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
