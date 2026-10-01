import { pctColor } from "@/lib/metrics";
import { monthLabel } from "@/lib/dates";
import HeatmapMutabaah from "@/components/HeatmapMutabaah";
import type { KategoriMetric, MutabaahEntry, Santri, SantriMonthlyMetrics } from "@/types";

const GREEN = "#0F6B4A";
const GREEN_DARK = "#0A382A";
const GREEN_MID = "#0E5440";
const GOLD = "#B9973F";

/** Satu raport santri (2 halaman A4): ringkasan + rincian.
 *  Komponen murni (tanpa fetch) — dipakai oleh /santri/[id]/raport dan /laporan/cetak. */
export default function RaportSantri({
  santri,
  metrics: m,
  entries,
  year,
  month,
  haidDates,
}: {
  santri: Santri;
  metrics: SantriMonthlyMetrics;
  entries: MutabaahEntry[];
  year: number;
  month: number;
  haidDates?: Set<string>;
}) {
  const sebutan = santri.institusi === "PI IMSHUS" ? "Santriwati" : "Santri";
  const hariLabel =
    m.haidCount > 0
      ? `${m.hariTerhitung} hari dinilai · ${m.haidCount} hari haid`
      : `${m.hariBerjalan} hari dinilai`;

  return (
    <div className="print-area report-document mx-auto max-w-[210mm] overflow-hidden rounded-xl bg-white text-zinc-900 shadow-sm">
      {/* ================= HALAMAN 1 · RINGKASAN ================= */}
      <section className="report-page report-page-summary">
        {/* Pita hijau + logo IMSHUS */}
        <div
          className="report-band flex items-center gap-4 px-8 py-6"
          style={{ background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_MID} 70%, ${GREEN} 100%)`, borderBottom: `3px solid ${GOLD}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-imshus.png"
            alt="Logo IMSHUS"
            className="report-logo size-14 shrink-0 rounded-full bg-white p-1"
          />
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold tracking-wide text-white">
              Laporan Mutabaah {sebutan}
            </h1>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-100/80">
              Bagian Kesantrian IMSHUS
            </p>
          </div>
          <div className="ml-auto shrink-0 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">
              Periode
            </p>
            <p className="report-band-period font-display mt-1 text-base font-semibold text-white">
              {monthLabel(m.bulan, m.tahun)}
            </p>
          </div>
        </div>

        <div className="report-body px-8 pb-6 lg:px-10">
          {/* Nama + chips */}
          <h2 className="report-name font-display mt-6 text-3xl font-semibold tracking-tight text-zinc-950">
            {m.nama}
          </h2>
          <div className="report-chips mt-2 flex flex-wrap gap-1.5">
            <Chip solid>{m.kelas}</Chip>
            <Chip>NIS {santri.nis}</Chip>
            <Chip>{santri.institusi}</Chip>
            <Chip>{hariLabel}</Chip>
          </div>

          {/* 4 kartu statistik */}
          <div className="report-stats mt-5 grid grid-cols-4 gap-2.5">
            <StatCard hero label="Indeks Rutinitas" value={m.terukur ? `${m.indeksRutinitas}%` : "—"} />
            <StatCard label="Total Poin" value={String(m.totalPoin)} />
            <StatCard label="Total Rakaat" value={String(m.totalRakaat)} />
            <StatCard label="Hari Dinilai" value={`${m.hariTerhitung}/${m.hariBerjalan}`} />
          </div>

          {/* Heatmap harian */}
          <section className="report-section mt-6">
            <div className="mb-2 flex items-end justify-between gap-4">
              <h3 className="font-display text-lg font-semibold text-zinc-900">
                Peta harian {m.kategori.length} amalan
              </h3>
            </div>
            <div className="report-hmpanel rounded-xl border border-zinc-200 bg-white p-3">
              <HeatmapMutabaah
                rows={m.kategori}
                entries={entries}
                year={year}
                month={month}
                hariBerjalan={m.hariBerjalan}
                haidDates={haidDates}
              />
              <div className="report-hmlegend mt-2 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-2 text-[10px] text-zinc-500">
                <span className="inline-flex items-center gap-1.5">
                  <i className="inline-block size-2.5 rounded-[3px]" style={{ background: GREEN }} />Terisi
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="inline-block size-2.5 rounded-[3px] bg-zinc-200" />Kosong
                </span>
                {haidDates && haidDates.size > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <i className="inline-block size-2.5 rounded-[3px] bg-rose-200" />Haid
                  </span>
                )}
                <span className="ml-auto">Skala persen: 0–50 merah · 51–74 emas · 75–100 hijau</span>
              </div>
            </div>
          </section>

          <footer className="report-footer mt-6 flex items-center justify-between border-t border-zinc-200 pt-3 text-[9px] text-zinc-500">
            <span>Dokumen laporan mutabaah IMSHUS</span>
            <span>Halaman 1 · Ringkasan</span>
          </footer>
        </div>
      </section>

      {/* ================= HALAMAN 2 · RINCIAN ================= */}
      <section className="report-page report-page-detail">
        <div
          className="report-band flex items-center gap-4 px-8 py-5"
          style={{ background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_MID} 70%, ${GREEN} 100%)`, borderBottom: `3px solid ${GOLD}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-imshus.png"
            alt="Logo IMSHUS"
            className="report-logo size-12 shrink-0 rounded-full bg-white p-1"
          />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-wide text-white">
              Rincian Pencapaian
            </h2>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-100/80">
              {m.nama} · {m.kelas} · {monthLabel(m.bulan, m.tahun)}
            </p>
          </div>
          <div className="ml-auto shrink-0 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">
              Periode
            </p>
            <p className="report-band-period font-display mt-1 text-base font-semibold text-white">
              {monthLabel(m.bulan, m.tahun)}
            </p>
          </div>
        </div>

        <div className="report-body px-8 pb-6 pt-5 lg:px-10">
          <h3 className="font-display text-lg font-semibold text-zinc-900">
            Amalan 1–{m.kategori.length}
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Nomor urut sesuai daftar amalan. Keterangan ditulis di kolomnya sendiri.
          </p>
          <div className="mt-3">
            <Tabel rows={m.kategori} terukur={m.terukur} haidCount={m.haidCount} />
          </div>
          {m.haidCount > 0 && (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[10.5px] text-rose-800">
              {m.haidCount} hari haid — tidak dihitung dalam persentase sholat dan dzikir ba&rsquo;da sholat.
            </p>
          )}
          <footer className="report-footer mt-6 flex items-center justify-between border-t border-zinc-200 pt-3 text-[9px] text-zinc-500">
            <span>Dokumen laporan mutabaah IMSHUS</span>
            <span>Halaman 2 · Rincian</span>
          </footer>
        </div>
      </section>
    </div>
  );
}

function Chip({ children, solid = false }: { children: React.ReactNode; solid?: boolean }) {
  return (
    <span
      className={
        "report-chip rounded-full border px-3 py-1 text-[10.5px] font-semibold tracking-wide " +
        (solid
          ? "border-emerald-800 bg-emerald-800 text-white"
          : "border-zinc-200 bg-zinc-50 text-zinc-700")
      }
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  hero = false,
}: {
  label: string;
  value: string;
  hero?: boolean;
}) {
  return (
    <div
      className={
        "report-stat rounded-xl border px-2 py-2.5 text-center " +
        (hero ? "border-emerald-800 bg-emerald-800 text-white" : "border-zinc-200 bg-white")
      }
    >
      <div
        className={
          "text-[8px] font-bold uppercase tracking-[0.16em] " +
          (hero ? "text-emerald-100/80" : "text-zinc-500")
        }
      >
        {label}
      </div>
      <div className="report-stat-value tnum font-display mt-1 text-2xl font-semibold tracking-tight">
        {value}
      </div>
    </div>
  );
}

function Tabel({
  rows,
  terukur,
  haidCount,
}: {
  rows: KategoriMetric[];
  terukur: boolean;
  haidCount?: number;
}) {
  return (
    <table className="report-table w-full border-collapse text-[11px]">
      <thead>
        <tr className="bg-emerald-800 text-center text-white">
          <th className="w-[6%] px-1.5 py-1.5 font-semibold">No</th>
          <th className="w-[38%] px-1.5 py-1.5 text-left font-semibold">Amalan</th>
          <th className="w-[13%] px-1.5 py-1.5 font-semibold">Tercapai</th>
          <th className="w-[25%] px-1.5 py-1.5 text-left font-semibold">Keterangan</th>
          <th className="w-[18%] px-1.5 py-1.5 font-semibold">%</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((k, index) => {
          const col = pctColor(k.pct);
          return (
            <tr key={k.amalan_id} className={index % 2 ? "bg-zinc-50" : "bg-white"}>
              <td className="tnum border-b border-zinc-200 px-1.5 py-1 text-center text-zinc-500">
                {k.amalan_id}
              </td>
              <td className="border-b border-zinc-200 px-1.5 py-1 text-left font-medium text-zinc-900">
                {k.nama}
              </td>
              <td className="tnum border-b border-zinc-200 px-1.5 py-1 text-center text-zinc-700">
                {k.done}/{k.total}
              </td>
              <td className="border-b border-zinc-200 px-1.5 py-1 text-left text-zinc-500">
                {k.rakaatTotal ? `${k.rakaatTotal} rakaat` : ""}
                {k.tepat != null ? `Tepat ${k.tepat} · Masbuq ${k.masbuq} · Sendiri ${k.sendiri}` : ""}
              </td>
              <td className="tnum border-b border-zinc-200 px-1.5 py-1 text-right font-bold">
                <span
                  className="mr-1.5 inline-block h-1.5 w-8 overflow-hidden rounded-full bg-zinc-200 align-middle"
                  aria-hidden
                >
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${terukur ? k.pct : 0}%`, background: col }}
                  />
                </span>
                <span className="mr-1 inline-block size-2 rounded-full align-middle" style={{ background: col }} aria-hidden />
                <span style={{ color: col }}>{terukur ? `${k.pct}%` : "—"}</span>
              </td>
            </tr>
          );
        })}
        {haidCount != null && haidCount > 0 && (
          <tr className="bg-rose-50">
            <td className="px-1.5 py-1 text-center text-rose-700">—</td>
            <td className="px-1.5 py-1 text-left font-medium text-rose-900">Haid (dibebaskan)</td>
            <td className="tnum px-1.5 py-1 text-center text-rose-800">{haidCount} hari</td>
            <td className="px-1.5 py-1 text-left text-rose-700">
              tidak dihitung dalam persentase sholat/dzikir
            </td>
            <td className="px-1.5 py-1 text-center text-rose-700">—</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
