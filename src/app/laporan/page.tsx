import Link from "next/link";
import {
  IconDownload as Download,
  IconPdf as FilePdf,
} from "@tabler/icons-react";
import { listSantri, listEntries } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { computeSantriMetrics } from "@/lib/metrics";
import { BULAN_ID, monthLabel } from "@/lib/dates";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";
import ProgressBar from "@/components/ProgressBar";
import type { Kelas } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Laporan" };

const KELAS_ORDER: Kelas[] = ["Kelas 1", "Kelas 2", "Kelas 3"];

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const user = await getCurrentUser();
  const institusi = user?.institusi ?? "PA IMSHUS";

  const [allSantri, entries] = await Promise.all([
    listSantri(undefined, false, institusi),
    listEntries({ year: Number(sp.year) || now.getFullYear(), month: Number(sp.month) || now.getMonth() + 1, institusi }),
  ]);
  const adaKelas = KELAS_ORDER.filter((k) =>
    allSantri.some((s) => s.kelas === k),
  ) as Kelas[];
  const KELAS_LIST = adaKelas.length ? adaKelas : KELAS_ORDER;
  const kelas = (KELAS_LIST.includes(sp.kelas as Kelas) ? sp.kelas : KELAS_LIST[0]) as Kelas;
  const month = Number(sp.month) || now.getMonth() + 1;
  const year = Number(sp.year) || now.getFullYear();

  const santri = allSantri.filter((s) => s.kelas === kelas);
  const metrics = santri
    .map((s) => computeSantriMetrics(s, entries, year, month))
    .sort((a, b) => b.indeksRutinitas - a.indeksRutinitas);

  const href = (m: number, k: Kelas = kelas) =>
    `/laporan?${new URLSearchParams({ kelas: k, month: String(m), year: String(year) })}`;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Laporan Bulanan"
        description={`${kelas} · ${monthLabel(month, year)} · ${santri.length} santri`}
      />

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="flex rounded-lg border border-line bg-canvas p-0.5">
          {KELAS_LIST.map((k) => (
            <Link
              key={k}
              href={href(month, k)}
              className={
                "rounded-md px-3 py-1.5 text-xs font-medium transition " +
                (k === kelas
                  ? "bg-surface text-ink shadow-sm"
                  : "text-muted hover:text-ink")
              }
            >
              {k}
            </Link>
          ))}
        </div>
        <div className="h-5 w-px bg-line" />
        <div className="flex flex-wrap gap-1">
          {BULAN_ID.map((b, i) => (
            <Link
              key={b}
              href={href(i + 1)}
              className={
                "rounded-md px-2 py-1 text-xs font-medium transition " +
                (i + 1 === month
                  ? "bg-accent text-accent-fg"
                  : "text-muted hover:bg-surface2 hover:text-ink")
              }
            >
              {b.slice(0, 3)}
            </Link>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-faint">
              <th className="px-4 py-2.5 font-medium">Santri</th>
              <th className="px-4 py-2.5 font-medium">Indeks</th>
              <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">
                Poin
              </th>
              <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">
                Streak
              </th>
              <th className="px-4 py-2.5 text-right font-medium">Ekspor</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr
                key={m.santri_id}
                className="border-b border-line last:border-0 hover:bg-surface2/60"
              >
                <td className="px-4 py-2.5">
                  <Link href={`/santri/${m.santri_id}`} className="flex items-center gap-3 group">
                    <Avatar name={m.nama} size="sm" />
                    <span className="truncate font-medium text-ink group-hover:text-accent">
                      {m.nama}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={m.indeksRutinitas} className="w-20" />
                    <span className="tnum text-xs font-semibold text-ink">
                      {m.indeksRutinitas}%
                    </span>
                  </div>
                </td>
                <td className="tnum hidden px-4 py-2.5 text-right text-muted sm:table-cell">
                  {m.totalPoin}
                </td>
                <td className="hidden px-4 py-2.5 text-right sm:table-cell">
                  <Badge tone={m.streak >= 7 ? "accent" : "neutral"}>{m.streak} hr</Badge>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/santri/${m.santri_id}/raport?month=${month}&year=${year}`}
                      className="btn-ghost h-8 px-2 text-xs"
                      title="Raport PDF"
                    >
                      <FilePdf size={15} stroke={1.75} /> PDF
                    </Link>
                    <a
                      href={`/api/export/excel?santri_id=${m.santri_id}&month=${month}&year=${year}`}
                      className="btn-ghost h-8 px-2 text-xs"
                      title="Unduh Excel"
                    >
                      <Download size={15} stroke={1.75} /> XLSX
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {metrics.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-faint">
                  Belum ada data untuk periode ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
