import { Suspense } from "react";
import {
  listSantri,
  getDayValues,
  getDayProgress,
  getMonthCoverage,
} from "@/lib/data";
import { todayISO, tanggalPanjang } from "@/lib/dates";
import InputClient from "@/components/InputClient";
import PageHeader from "@/components/PageHeader";
import type { Kelas } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Input Harian" };

export default async function InputPage() {
  const date = todayISO();
  const now = new Date();
  const [santriList, progress, coverage] = await Promise.all([
    listSantri(),
    getDayProgress(date),
    getMonthCoverage(now.getFullYear(), now.getMonth() + 1),
  ]);
  const kelas: Kelas = "Kelas 1";
  const first = santriList.find((s) => s.kelas === kelas) ?? santriList[0];
  const initialValues = first ? await getDayValues(first.id, date) : {};

  return (
    <div className="lg:flex lg:h-[calc(100dvh-64px)] lg:flex-col lg:overflow-hidden">
      <div className="shrink-0 lg:[&>div]:mb-3">
        <PageHeader
          title="Input Harian"
          description={`Catat amalan santri — ${tanggalPanjang(date)}`}
        />
      </div>
      <div className="lg:min-h-0 lg:flex-1">
        <Suspense fallback={<p className="text-sm text-muted">Memuat…</p>}>
          <InputClient
            santriList={santriList}
            initialKelas={first?.kelas ?? kelas}
            initialDate={date}
            initialValues={initialValues}
            initialProgress={progress}
            initialCoverage={coverage}
          />
        </Suspense>
      </div>
    </div>
  );
}
