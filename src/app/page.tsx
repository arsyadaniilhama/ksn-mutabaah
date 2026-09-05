import Link from "next/link";
import {
  IconCalendarCheck as CalendarCheck,
  IconGauge as Gauge,
  IconPencil as Pencil,
  IconSparkles as Sparkles,
  IconTrendingDown as TrendingDown,
  IconUsers as Users,
} from "@tabler/icons-react";
import { listSantri, listEntries, listRecentEntries, getDayProgress } from "@/lib/data";
import { computeSantriMetrics, computeKategoriBenchmark } from "@/lib/metrics";
import { AMALAN_BY_ID } from "@/lib/amalan";
import { monthLabel, todayISO, tanggalPanjang } from "@/lib/dates";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import RingGauge from "@/components/RingGauge";
import ProgressBar from "@/components/ProgressBar";
import RutinitasBars from "@/components/RutinitasBars";
import SantriTable from "@/components/SantriTable";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

const STATUS_DOT: Record<string, string> = {
  done: "bg-accent",
  tepat: "bg-accent",
  masbuq: "bg-warn",
  sendiri: "bg-danger",
  miss: "bg-danger",
};
const STATUS_LABEL: Record<string, string> = {
  done: "Ya",
  miss: "Tidak",
  tepat: "Tepat Waktu",
  masbuq: "Masbuq",
  sendiri: "Sendiri",
};

export default async function DashboardPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = todayISO();

  const [santri, entries, recent, progressToday] = await Promise.all([
    listSantri(),
    listEntries({ year, month }),
    listRecentEntries(8),
    getDayProgress(today),
  ]);

  const metrics = santri.map((s) => computeSantriMetrics(s, entries, year, month));
  const avg = metrics.length
    ? Math.round(metrics.reduce((a, m) => a + m.indeksRutinitas, 0) / metrics.length)
    : 0;
  const benchmark = computeKategoriBenchmark(metrics);
  const perKelas = santri.reduce<Record<string, number>>((acc, s) => {
    acc[s.kelas] = (acc[s.kelas] ?? 0) + 1;
    return acc;
  }, {});
  const terisiHariIni = Object.values(progressToday).filter((n) => n > 0).length;
  const sorted = [...metrics].sort((a, b) => b.indeksRutinitas - a.indeksRutinitas);
  const perlu = sorted.filter((m) => m.indeksRutinitas < 50).slice(0, 5);
  const kosong = entries.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Ringkasan mutabaah ${monthLabel(month, year)}`}
      >
        <Link href="/input" className="btn-primary">
          <Pencil size={16} stroke={1.75} /> Input Hari Ini
        </Link>
      </PageHeader>

      {kosong && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-accent/30 bg-accent-soft/50 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-fg">
              <Sparkles size={18} stroke={1.75} />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">
                Belum ada data mutabaah bulan ini
              </p>
              <p className="text-xs text-muted">
                Mulai isi amalan harian santri untuk melihat metrik dan grafik.
              </p>
            </div>
          </div>
          <Link href="/input" className="btn-primary h-8 text-xs">
            Mulai Input
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Total Santri"
          value={santri.length}
          sub={
            <span className="tnum">
              {Object.entries(perKelas)
                .map(([k, v]) => `${k.replace("Kelas ", "K")}: ${v}`)
                .join("  Â·  ")}
            </span>
          }
        />
        <KpiCard
          icon={Gauge}
          label="Indeks Rata-rata"
          value={`${avg}%`}
          sub="rata-rata 19 kategori amalan"
          tone="accent"
          right={<RingGauge value={avg} size={56} />}
        />
        <KpiCard
          icon={CalendarCheck}
          label="Pengisian Hari Ini"
          value={
            <span>
              {terisiHariIni}
              <span className="text-base font-medium text-faint">
                /{santri.length}
              </span>
            </span>
          }
          sub={<ProgressBar value={santri.length ? (terisiHariIni / santri.length) * 100 : 0} />}
          tone="accent"
        />
        <KpiCard
          icon={TrendingDown}
          label="Perlu Perhatian"
          value={perlu.length}
          sub="indeks rutinitas di bawah 50%"
          tone={perlu.length > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">
              Rutinitas per Amalan
            </h2>
            <span className="text-xs text-faint">rata-rata seluruh santri</span>
          </div>
          <RutinitasBars
            rows={Object.entries(benchmark).map(([id, pct]) => ({
              id: Number(id),
              nama: AMALAN_BY_ID[Number(id)]?.nama ?? "",
              pct,
            }))}
          />
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Perlu Perhatian</h2>
            {perlu.length === 0 ? (
              <p className="text-xs text-faint">
                Tidak ada santri di bawah 50%. Pertahankan!
              </p>
            ) : (
              <ul className="space-y-3">
                {perlu.map((m) => (
                  <li key={m.santri_id}>
                    <Link
                      href={`/santri/${m.santri_id}`}
                      className="group flex items-center gap-3"
                    >
                      <Avatar name={m.nama} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-ink group-hover:text-accent">
                          {m.nama}
                        </span>
                        <ProgressBar value={m.indeksRutinitas} className="mt-1" />
                      </span>
                      <span className="tnum text-xs font-semibold text-danger">
                        {m.indeksRutinitas}%
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">
              Aktivitas Terakhir
            </h2>
            {recent.length === 0 ? (
              <p className="text-xs text-faint">Belum ada aktivitas tercatat.</p>
            ) : (
              <ul className="space-y-2.5">
                {recent.map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs">
                    <span
                      className={
                        "mt-1 size-1.5 shrink-0 rounded-full " +
                        (a.status ? (STATUS_DOT[a.status] ?? "bg-faint") : "bg-faint")
                      }
                    />
                    <div className="min-w-0 flex-1 leading-snug">
                      <span className="font-medium text-ink">
                        {a.santri?.nama ?? "—"}
                      </span>{" "}
                      <span className="text-muted">
                        {AMALAN_BY_ID[a.amalan_id]?.nama}
                      </span>
                      <div className="text-faint">
                        {a.rakaat
                          ? `${a.rakaat} rakaat · `
                          : a.status
                            ? `${STATUS_LABEL[a.status] ?? ""} · `
                            : ""}
                        {tanggalPanjang(a.entry_date)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <SantriTable
        rows={metrics.map((m) => ({
          id: m.santri_id,
          nama: m.nama,
          nis: santri.find((s) => s.id === m.santri_id)?.nis ?? 0,
          kelas: m.kelas,
          indeks: m.indeksRutinitas,
          streak: m.streak,
        }))}
      />
    </div>
  );
}
