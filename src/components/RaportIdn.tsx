"use client";

import { monthLabel } from "@/lib/dates";
import { buildIdnData, classDailyAvg, idnBand, IDN_BANDS, type IdnData, type IdnRow, type IdnWeek } from "@/lib/raport-idn";
import type { KategoriMetric, MutabaahEntry, Santri, SantriMonthlyMetrics } from "@/types";

export type RaportMode = "m1" | "m2";

/* ===== Raport Mode 2: Adab vs Ibadah, satu halaman panjang ===== */
export default function RaportIdn({
  santri,
  metrics,
  entries,
  year,
  month,
  kelasAvg,
}: {
  santri: Santri;
  metrics: SantriMonthlyMetrics;
  entries: MutabaahEntry[];
  year: number;
  month: number;
  kelasAvg?: { adab: number[]; ibadah: number[] };
}) {
  const data: IdnData = buildIdnData(santri, metrics, entries, year, month);
  const sebutan = santri.institusi === "PI IMSHUS" ? "Santriwati" : "Santri";
  const avgA = data.avgAdab == null ? null : Math.round(data.avgAdab * 100) / 100;
  const avgI = Math.round(data.avgIbadah * 100) / 100;

  return (
    <div className="print-area report-document report-idn mx-auto max-w-[210mm] overflow-hidden rounded-xl bg-white text-zinc-900 shadow-sm">
      <div className="report-idn-head report-idn-head-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-imshus.png" alt="Logo IMSHUS" className="report-logo" />
        <div className="report-idn-head-text">
          <h1>LAPORAN BULANAN ADAB &amp; IBADAH</h1>
          <p>Bagian Kesantrian IMSHUS</p>
        </div>
      </div>

      <div className="report-idn-body">
        <div className="idn-info">
          <Info k="Nama" v={santri.nama} />
          <Info k="Bulan" v={monthLabel(month, year)} />
          <Info k="Kelas" v={santri.kelas} />
          <Info k="NIS" v={String(santri.nis)} />
        </div>

        <div className={"idn-top" + (data.isPI ? "" : " idn-top-single")}>
          <div className="idn-bigcards">
            {data.isPI && <BigCard title="Rata-rata Adab" value={avgA} />}
            <BigCard title="Rata-rata Ibadah" value={avgI} />
          </div>
          <div className="idn-charts">
            {data.isPI && (
              <DailyChart
                title="Progres harian — Adab (hijau) vs rata-rata kelas (abu)"
                data={data.dailyAdab}
                avg={kelasAvg?.adab}
                max={Math.max(1, data.adabIds.length)}
              />
            )}
            <DailyChart
              title="Progres harian — Ibadah (hijau) vs rata-rata kelas (abu)"
              data={data.dailyIbadah}
              avg={kelasAvg?.ibadah}
              max={Math.max(1, data.ibadahIds.length)}
            />
          </div>
        </div>

        <div className="idn-scale">
          <b>Keterangan :</b>
          {IDN_BANDS.map((b) => (
            <span key={b.label} className="idn-pill" style={{ background: b.color }}>
              {b.min} – {b.max}% {b.label}
            </span>
          ))}
        </div>

        <div className="idn-weeks">
          {data.isPI && <WeekPanel title="Adab Berdasarkan Pekan" weeks={data.weeksAdab} />}
          <WeekPanel title="Ibadah Berdasarkan Pekan" weeks={data.weeksIbadah} />
        </div>
        <KetBox>
          <b>Jumlah</b> = total aktivitas yang berhasil dilakukan santri pada pekan tersebut.{" "}
          <b>% Capaian</b> = persentase keberhasilan santri dalam memenuhi target maksimal tiap pekan.
        </KetBox>

        <div className="idn-details">
          {data.isPI && <DetailPanel title={`% Capaian Adab (${data.adabRows.length})`} rows={data.adabRows} />}
          <DetailPanel title={`% Capaian Ibadah (${data.ibadahRows.length})`} rows={data.ibadahRows} />
        </div>
        <KetBox>
          <b>Aktivitas</b> = jenis kegiatan adab atau ibadah yang diamati. <b>Jumlah</b> = total frekuensi
          aktivitas berhasil dalam satu bulan. <b>% Capaian</b> = keberhasilan tiap aktivitas dibanding
          target maksimal.
        </KetBox>

        <footer className="report-footer">
          <span>Dokumen laporan mutabaah IMSHUS · Mode Adab &amp; Ibadah</span>
          <span>
            {santri.nama} · {monthLabel(month, year)}
          </span>
        </footer>
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="idn-info-row">
      <span className="idn-k">{k}</span>
      <span className="idn-v">: {v}</span>
    </div>
  );
}

function BigCard({ title, value }: { title: string; value: number | null }) {
  const txt = value == null ? "–" : `${String(value).replace(".", ",")}%`;
  return (
    <div className="idn-bigcard">
      <div className="idn-bigcard-t">{title}</div>
      <div className="idn-bigcard-n">{txt}</div>
    </div>
  );
}

function DailyChart({
  title,
  data,
  avg,
  max,
}: {
  title: string;
  data: number[];
  avg?: number[];
  max: number;
}) {
  return (
    <div className="idn-chartbox">
      <h4>{title}</h4>
      <div className="idn-daily">
        {data.map((v, i) => {
          const h1 = Math.max(2, Math.round((v / max) * 100));
          const a = avg?.[i] ?? 0;
          const h2 = Math.max(2, Math.min(100, Math.round((a / max) * 100)));
          return (
            <div key={i} className="idn-d">
              <i className="idn-a" style={{ height: `${h1}%` }} />
              <i className="idn-b" style={{ height: `${h2}%` }} />
            </div>
          );
        })}
      </div>
      <div className="idn-x">
        {data.map((_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
    </div>
  );
}

function PctBar({ pct, align = "right" }: { pct: number; align?: "left" | "right" }) {
  const { color } = idnBand(pct);
  const t = `${String(Math.round(pct * 100) / 100).replace(".", ",")}%`;
  const num = (
    <span className="idn-pctnum" style={{ textAlign: align }}>
      {t}
    </span>
  );
  const bar = (
    <span className="idn-track" aria-hidden>
      <i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </span>
  );
  return (
    <span className="idn-barcell" data-align={align}>
      {align === "right" ? (
        <>
          {num}
          {bar}
        </>
      ) : (
        <>
          {bar}
          {num}
        </>
      )}
    </span>
  );
}

function WeekPanel({ title, weeks }: { title: string; weeks: IdnWeek[] }) {
  return (
    <div className="idn-panel">
      <h3>{title}</h3>
      <table className="idn-mini">
        <thead>
          <tr>
            <th className="c">No.</th>
            <th className="c">Pekan</th>
            <th className="num">Jumlah</th>
            <th className="barcol">% Capaian</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w, i) => (
            <tr key={w.label}>
              <td className="c">{i + 1}.</td>
              <td className="c">{w.label}</td>
              <td className="num">{w.jumlah}</td>
              <td>
                <PctBar pct={w.pct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailPanel({ title, rows }: { title: string; rows: IdnRow[] }) {
  return (
    <div>
      <h3 className="idn-dtitle">{title}</h3>
      <table className="idn-det">
        <thead>
          <tr>
            <th>No.</th>
            <th>Aktivitas</th>
            <th className="num">Jml</th>
            <th className="barcol">% Capaian</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.no}>
              <td>{r.no}.</td>
              <td>{r.nama}</td>
              <td className="num">{r.jumlah}</td>
              <td>
                <PctBar pct={r.pct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KetBox({ children }: { children: React.ReactNode }) {
  return <div className="idn-ket">{children}</div>;
}

export type { KategoriMetric };
export { classDailyAvg };
