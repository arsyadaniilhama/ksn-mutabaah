import { Suspense } from "react";
import { listSantri, getDayValues } from "@/lib/data";
import { todayISO, tanggalPanjang } from "@/lib/dates";
import InputClient from "@/components/InputClient";
import PageHeader from "@/components/PageHeader";
import type { Kelas } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Input Harian" };

export default async function InputPage() {
  const santriList = await listSantri();
  const kelas: Kelas = "Kelas 1";
  const date = todayISO();
  const first = santriList.find((s) => s.kelas === kelas) ?? santriList[0];
  const initialValues = first ? await getDayValues(first.id, date) : {};

  return (
    <div>
      <PageHeader
        title="Input Harian"
        description={`Catat amalan santri — ${tanggalPanjang(date)}`}
      />
      <Suspense fallback={<p className="text-sm text-muted">Memuat…</p>}>
        <InputClient
          santriList={santriList}
          initialKelas={first?.kelas ?? kelas}
          initialDate={date}
          initialValues={initialValues}
        />
      </Suspense>
    </div>
  );
}
