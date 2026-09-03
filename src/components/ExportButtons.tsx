"use client";

interface Props {
  santriId: string;
  month: number;
  year: number;
}

export default function ExportButtons({ santriId, month, year }: Props) {
  const excelHref = `/api/export/excel?santri_id=${santriId}&month=${month}&year=${year}`;
  return (
    <div className="no-print flex gap-2">
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
      >
        Cetak / Simpan PDF
      </button>
      <a
        href={excelHref}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Unduh Excel
      </a>
    </div>
  );
}
