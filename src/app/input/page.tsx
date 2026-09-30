import { Suspense } from "react";
import {
  listSantri,
  getDayValuesForSantriList,
  getDayProgress,
  getMonthCoverage,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { AMALAN_FOR } from "@/lib/amalan";
import { todayISO, tanggalPanjang, bagianJakarta } from "@/lib/dates";
import InputClient from "@/components/InputClient";
import PageHeader from "@/components/PageHeader";
import type { Kelas } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Input Harian" };

export default async function InputPage() {
  const date = todayISO();
  const jkt = bagianJakarta();
  const user = await getCurrentUser();
  const institusi = user?.institusi ?? "PA IMSHUS";
  const label = institusi === "PI IMSHUS" ? "Santriwati" : "Santri";
  const [santriList, progress, coverage] = await Promise.all([
    listSantri(undefined, false, institusi),
    getDayProgress(date),
    getMonthCoverage(jkt.y, jkt.m),
  ]);
  const kelasList = Array.from(new Set(santriList.map((s) => s.kelas))) as Kelas[];
  const kelas: Kelas = kelasList[0] ?? "Kelas 1";
  const kelasSantri = santriList.filter((s) => s.kelas === kelas);
  const first = kelasSantri[0] ?? santriList[0];
  const initialDayCache = await getDayValuesForSantriList(
    kelasSantri.map((s) => s.id),
    date,
  );
  const initialValues = first ? (initialDayCache[first.id] ?? {}) : {};

  return (
    <div className="lg:flex lg:h-[calc(100dvh-64px)] lg:flex-col lg:overflow-hidden">
      <div className="shrink-0 lg:[&>div]:mb-3">
        <PageHeader
          title="Input Harian"
          description={`Catat amalan ${label.toLowerCase()} — ${tanggalPanjang(date)}`}
        />
      </div>
      <div className="lg:min-h-0 lg:flex-1">
        <Suspense fallback={<p className="text-sm text-muted">Memuat…</p>}>
          <InputClient
            santriList={santriList}
            label={label}
            institusi={institusi}
            amalanList={AMALAN_FOR(institusi)}
            initialKelas={first?.kelas ?? kelas}
            initialDate={date}
            initialValues={initialValues}
            initialDayCache={initialDayCache}
            initialProgress={progress}
            initialCoverage={coverage}
          />
        </Suspense>
      </div>
    </div>
  );
}
