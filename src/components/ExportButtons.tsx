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
      <button onClick={() => window.print()} className="btn-primary">
        Cetak / Simpan PDF
      </button>
      <a href={excelHref} className="btn-outline">
        Unduh Excel
      </a>
    </div>
  );
}
