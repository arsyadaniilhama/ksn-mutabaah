import Link from "next/link";
import { listSantri, listEntries } from "@/lib/data";
import { computeSantriMetrics } from "@/lib/metrics";
import { BULAN_ID, monthLabel } from "@/lib/dates";
import type { Kelas } from "@/types";

export const dynamic = "force-dynamic";

const KELAS_LIST: Kelas[] = ["Kelas 1", "Kelas 2", "Kelas 3"];

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const kelas = (KELAS_LIST.includes(sp.kelas as Kelas) ? sp.kelas : "Kelas 1") as Kelas;
  const month = Number(sp.month) || now.getMonth() + 1;
  const year = Number(sp.year) || now.getFullYear();

  const [santri, entries] = await Promise.all([
    listSantri(kelas),
    listEntries({ year, month, kelas }),
  ]);
  const metrics = santri
    .map((s) => computeSantriMetrics(s, entries, year, month))
    .sort((a, b) => b.indeksRutinitas - a.indeksRutinitas);

  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams({ kelas, month: String(month), year: String(year), ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])) });
    return `/laporan?${p.toString()}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">Laporan Bulanan</h1>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {KELAS_LIST.map((k) => (
          <Link
            key={k}
            href={qs({ kelas: k })}
            className={
              "rounded-lg px-3 py-1.5 font-medium " +
              (k === kelas ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200")
            }
          >
            {k}
          </Link>
        ))}
        <span className="mx-2 text-slate-300">|</span>
        <div className="flex flex-wrap gap-1">
          {BULAN_ID.map((b, i) => (
            <Link
              key={b}
              href={qs({ month: i + 1 })}
              className={
                "rounded px-2 py-1 text-xs " +
                (i + 1 === month
                  ? "bg-slate-900 font-semibold text-white"
                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50")
              }
            >
              {b.slice(0, 3)}
            </Link>
          ))}
        </div>
      </div>

      <p className="text-sm text-slate-500">
        {kelas} · {monthLabel(month, year)} · {santri.length} santri
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">Santri</th>
              <th className="px-3 py-2 text-right">Indeks</th>
              <th className="px-3 py-2 text-right">Poin</th>
              <th className="px-3 py-2 text-right">Streak</th>
              <th className="px-3 py-2 text-right">Ekspor</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.santri_id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <Link href={`/santri/${m.santri_id}`} className="font-medium text-slate-800 hover:underline">
                    {m.nama}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right font-semibold text-slate-700">{m.indeksRutinitas}%</td>
                <td className="px-3 py-2 text-right text-slate-500">{m.totalPoin}</td>
                <td className="px-3 py-2 text-right text-slate-500">{m.streak}</td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex gap-2">
                    <Link
                      href={`/santri/${m.santri_id}/raport?month=${month}&year=${year}`}
                      className="text-brand-600 hover:underline"
                    >
                      PDF
                    </Link>
                    <a
                      href={`/api/export/excel?santri_id=${m.santri_id}&month=${month}&year=${year}`}
                      className="text-slate-500 hover:underline"
                    >
                      XLSX
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {metrics.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Belum ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
