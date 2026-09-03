import { Suspense } from "react";
import { listSantri, getDayValues } from "@/lib/data";
import { todayISO } from "@/lib/dates";
import InputClient from "@/components/InputClient";
import type { Kelas } from "@/types";

export const dynamic = "force-dynamic";

export default async function InputPage() {
  const santriList = await listSantri();
  const kelas: Kelas = "Kelas 1";
  const date = todayISO();
  const first = santriList.find((s) => s.kelas === kelas) ?? santriList[0];
  const initialValues = first ? await getDayValues(first.id, date) : {};

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-slate-900">Input Harian Mutabaah</h1>
      <Suspense fallback={<p className="text-sm text-slate-500">Memuat…</p>}>
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
