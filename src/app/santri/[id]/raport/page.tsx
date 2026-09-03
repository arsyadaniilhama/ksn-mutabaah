import { notFound } from "next/navigation";
import { getSantri, listEntries } from "@/lib/data";
import { computeSantriMetrics } from "@/lib/metrics";
import { monthLabel } from "@/lib/dates";
import PctBarChart from "@/components/PctBarChart";
import ExportButtons from "@/components/ExportButtons";

export const dynamic = "force-dynamic";

export default async function RaportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;

  const santri = await getSantri(id);
  if (!santri) notFound();

  const entries = await listEntries({ year, month, santriId: santri.id });
  const m = computeSantriMetrics(santri, entries, year, month);

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <a href={`/santri/${santri.id}`} className="text-sm text-slate-500 hover:underline">
          ← Kembali ke detail
        </a>
        <ExportButtons santriId={santri.id} month={month} year={year} />
      </div>

      <div className="print-area mx-auto max-w-[210mm] rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Kop */}
        <div className="border-b-2 border-slate-800 pb-3 text-center">
          <h1 className="text-lg font-bold uppercase tracking-wide">
            Laporan Mutabaah Santri
          </h1>
          <p className="text-sm">Pendidikan Islam IMSHUS — KSN</p>
        </div>

        {/* Identitas */}
        <div className="mt-4 grid grid-cols-2 gap-y-1 text-sm">
          <div><span className="text-slate-500">Nama</span>: <b>{m.nama}</b></div>
          <div><span className="text-slate-500">Kelas</span>: {m.kelas}</div>
          <div><span className="text-slate-500">NIS</span>: {santri.nis}</div>
          <div><span className="text-slate-500">Periode</span>: {monthLabel(m.bulan, m.tahun)}</div>
        </div>

        {/* Ringkasan */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { l: "Indeks", v: `${m.indeksRutinitas}%` },
            { l: "Total Poin", v: m.totalPoin },
            { l: "Streak", v: `${m.streak} hr` },
            { l: "Rakaat", v: m.totalRakaat },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border border-slate-200 py-2">
              <div className="text-xs text-slate-400">{s.l}</div>
              <div className="text-lg font-bold text-slate-800">{s.v}</div>
            </div>
          ))}
        </div>

        {/* Grafik */}
        <div className="mt-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">
            Persentase Rutinitas per Amalan
          </h2>
          <PctBarChart data={m.kategori.map((k) => ({ id: k.amalan_id, nama: k.nama, pct: k.pct }))} />
        </div>

        {/* Tabel */}
        <table className="mt-4 w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="border border-slate-200 px-2 py-1">No</th>
              <th className="border border-slate-200 px-2 py-1">Amalan</th>
              <th className="border border-slate-200 px-2 py-1 text-right">Tercapai</th>
              <th className="border border-slate-200 px-2 py-1 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {m.kategori.map((k) => (
              <tr key={k.amalan_id}>
                <td className="border border-slate-200 px-2 py-1">{k.amalan_id}</td>
                <td className="border border-slate-200 px-2 py-1">{k.nama}</td>
                <td className="border border-slate-200 px-2 py-1 text-right">
                  {k.done}/{k.total}
                  {k.rakaatTotal ? ` (${k.rakaatTotal} rk)` : ""}
                </td>
                <td className="border border-slate-200 px-2 py-1 text-right font-semibold">
                  {k.pct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Catatan + TTD */}
        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="mb-1 font-semibold text-slate-700">Catatan Musyrif</div>
            <div className="min-h-[64px] rounded-lg border border-slate-200 p-2 text-slate-400">
              &nbsp;
            </div>
          </div>
          <div className="text-center">
            <div className="mb-8">
              {monthLabel(m.bulan, m.tahun)}
              <br />
              Mengetahui, Musyrif
            </div>
            <div className="mt-10 border-t border-slate-400 pt-1 inline-block w-40">
              (....................)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
