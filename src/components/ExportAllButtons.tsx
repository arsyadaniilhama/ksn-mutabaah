"use client";

import { useState } from "react";
import JSZip from "jszip";
import {
  IconFileTypePdf as FilePdf,
  IconFileTypeXls as FileXls,
  IconLoader2 as Loader,
} from "@tabler/icons-react";

interface Props {
  month: number;
  year: number;
  count: number;
}

interface Manifest {
  namaFile: string;
  santri: { id: string; nama: string; nis: number }[];
}

/** Berapa santri dirender per panggilan server (aman untuk limit fungsi Hobby:
 *  ~10 × ±360 KB ≈ 3.6 MB < 4.5 MB respons, dan selesai < 60 dtk). */
const BATCH_SIZE = 10;

type Phase = { label: string; done: number; total: number } | null;

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
 * Ekspor SEMUA santri dalam 1 klik.
 *
 * PDF: fungsi serverless Vercel Hobby dibatasi 60 dtk & respons 4.5 MB, jadi raport
 * dirender PER BATCH lewat /api/export/pdf-batch, lalu digabung jadi satu ZIP di browser
 * (JSZip) — tanpa server perlu menahan seluruh arsip. Tiap PDF tetap identik dengan
 * ekspor per santri (dirender dari /santri/[id]/raport yang sama).
 */
export default function ExportAllButtons({ month, year, count }: Props) {
  const [busy, setBusy] = useState<"pdf" | "excel" | null>(null);
  const [phase, setPhase] = useState<Phase>(null);
  const [error, setError] = useState<string | null>(null);

  async function downloadExcel() {
    const url = `/api/export/excel-all?month=${month}&year=${year}`;
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
    saveBlob(blob, m?.[1] ?? `mutabaah_${month}${year}.xlsx`);
  }

  async function downloadPdf() {
    // 1) Ambil daftar santri
    const manRes = await fetch(`/api/export/pdf-manifest?month=${month}&year=${year}`);
    if (!manRes.ok) {
      throw new Error(manRes.status === 404 ? "Belum ada data santri aktif." : `Gagal memuat daftar (${manRes.status})`);
    }
    const manifest = (await manRes.json()) as Manifest;
    const total = manifest.santri.length;
    if (total === 0) throw new Error("Belum ada santri aktif.");

    // 2) Unduh tiap batch lalu gabung jadi 1 ZIP di browser
    const zip = new JSZip();
    let done = 0;
    let failedBatches = 0;
    const failedOffsets: number[] = [];

    for (let offset = 0; offset < total; offset += BATCH_SIZE) {
      setPhase({ label: "Membuat PDF", done, total });
      try {
        const res = await fetch(
          `/api/export/pdf-batch?month=${month}&year=${year}&offset=${offset}&limit=${BATCH_SIZE}`,
        );
        if (!res.ok) throw new Error(`batch ${offset} gagal (${res.status})`);
        const batchZip = await JSZip.loadAsync(await res.arrayBuffer());
        const entries = Object.values(batchZip.files).filter((f) => !f.dir);
        for (const entry of entries) {
          zip.file(entry.name, await entry.async("uint8array"));
        }
        done += entries.length;
      } catch (e) {
        failedBatches += 1;
        failedOffsets.push(offset);
        if (typeof console !== "undefined") console.error("PDF batch gagal", offset, e);
      }
      setPhase({ label: "Membuat PDF", done: Math.min(done, total), total });
    }

    if (failedBatches > 0 && done === 0) {
      throw new Error("Semua batch PDF gagal. Coba lagi.");
    }

    setPhase({ label: "Menyatukan ZIP", done: Math.min(done, total), total });
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    saveBlob(blob, manifest.namaFile);

    if (failedBatches > 0) {
      setError(
        `${done}/${total} raport berhasil. ${failedBatches} batch gagal — ulangi ekspor untuk melengkapi.`,
      );
    }
  }

  async function download(kind: "pdf" | "excel") {
    if (busy) return;
    setBusy(kind);
    setError(null);
    setPhase(kind === "pdf" ? { label: "Memulai", done: 0, total: count } : null);
    try {
      if (kind === "pdf") await downloadPdf();
      else await downloadExcel();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setBusy(null);
      setPhase(null);
    }
  }

  const pdfLabel = phase && busy === "pdf"
    ? phase.total > 0
      ? `PDF ${phase.done}/${phase.total}…`
      : "Menyiapkan…"
    : "Export PDF Semua";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => download("pdf")}
        disabled={!!busy}
        className="btn-outline h-9"
        title={`Ekspor raport PDF semua santri (${count}) dalam 1 file ZIP`}
      >
        {busy === "pdf" ? <Loader size={16} className="animate-spin" /> : <FilePdf size={16} stroke={1.75} />}
        {pdfLabel}
      </button>
      <button
        type="button"
        onClick={() => download("excel")}
        disabled={!!busy}
        className="btn-outline h-9"
        title={`Ekspor Excel semua santri (${count}) — 1 sheet per santri`}
      >
        {busy === "excel" ? <Loader size={16} className="animate-spin" /> : <FileXls size={16} stroke={1.75} />}
        {busy === "excel" ? "Menyiapkan…" : "Export Excel Semua"}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}