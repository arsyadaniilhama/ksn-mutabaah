"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AMALAN, AMALAN_BY_ID } from "@/lib/amalan";
import { daysInMonth, parseISO, todayISO } from "@/lib/dates";
import AmalanRow from "@/components/AmalanRow";
import type { CellValue, Kelas, MutabaahEntry, Santri } from "@/types";

interface Props {
  santriList: Santri[];
  initialKelas: Kelas;
  initialDate: string;
  initialValues: Record<number, CellValue>;
}

const KELAS_LIST: Kelas[] = ["Kelas 1", "Kelas 2", "Kelas 3"];

function buildEntry(
  santriId: string,
  date: string,
  amalanId: number,
  next: CellValue,
): MutabaahEntry {
  const a = AMALAN_BY_ID[amalanId];
  if (a.value_type === "rakaat") {
    const r = (next as number | null) ?? 0;
    return {
      santri_id: santriId,
      amalan_id: amalanId,
      entry_date: date,
      rakaat: r,
      status: r > 0 ? "done" : null,
    };
  }
  return {
    santri_id: santriId,
    amalan_id: amalanId,
    entry_date: date,
    status: (next as MutabaahEntry["status"]) ?? null,
    rakaat: null,
  };
}

export default function InputClient({
  santriList,
  initialKelas,
  initialDate,
  initialValues,
}: Props) {
  const [kelas, setKelas] = useState<Kelas>(initialKelas);
  const [date, setDate] = useState<string>(initialDate);
  const santriInKelas = useMemo(
    () => santriList.filter((s) => s.kelas === kelas),
    [santriList, kelas],
  );
  const [santriId, setSantriId] = useState<string>(
    () =>
      santriInKelas.find((s) => s.kelas === initialKelas)?.id ??
      santriInKelas[0]?.id ??
      "",
  );
  const [values, setValues] = useState<Record<number, CellValue>>(initialValues);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const first = useRef(true);

  // Jaga santriId valid saat kelas berubah
  useEffect(() => {
    if (!santriInKelas.some((s) => s.id === santriId)) {
      setSantriId(santriInKelas[0]?.id ?? "");
    }
  }, [santriInKelas, santriId]);

  const loadDay = useCallback(async (sid: string, d: string) => {
    if (!sid) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/entries?santri_id=${sid}&date=${d}`);
      const json = await res.json();
      setValues(json.values ?? {});
    } catch {
      setErr("Gagal memuat data hari ini.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Muat ulang saat santri/tanggal berubah (skip render pertama)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    loadDay(santriId, date);
  }, [santriId, date, loadDay]);

  const handleChange = useCallback(
    async (amalanId: number, next: CellValue) => {
      const prev = values[amalanId] ?? null;
      setValues((v) => ({ ...v, [amalanId]: next }));
      setSavingId(amalanId);
      try {
        const entry = buildEntry(santriId, date, amalanId, next);
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: [entry] }),
        });
        if (!res.ok) throw new Error();
      } catch {
        setValues((v) => ({ ...v, [amalanId]: prev }));
        setErr("Gagal menyimpan. Coba lagi.");
      } finally {
        setSavingId(null);
      }
    },
    [santriId, date, values],
  );

  const dt = parseISO(date);
  const dim = daysInMonth(dt.getFullYear(), dt.getMonth() + 1);
  const days = Array.from({ length: dim }, (_, i) => i + 1);
  const isToday = date === todayISO();

  const currentIdx = santriInKelas.findIndex((s) => s.id === santriId);
  const isLastSantri = currentIdx >= santriInKelas.length - 1;

  const goNextSantri = () => {
    const next = santriInKelas[currentIdx + 1];
    if (next) setSantriId(next.id);
  };

  const filledCount = AMALAN.filter((a) => {
    const v = values[a.id];
    return a.value_type === "rakaat" ? (v as number) > 0 : v != null;
  }).length;

  const current = santriInKelas.find((s) => s.id === santriId);

  return (
    <div className="space-y-4">
      {/* Kelas */}
      <div className="flex gap-2">
        {KELAS_LIST.map((k) => (
          <button
            key={k}
            onClick={() => setKelas(k)}
            className={
              "rounded-lg px-4 py-2 text-sm font-semibold transition " +
              (k === kelas
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")
            }
          >
            {k}
          </button>
        ))}
      </div>

      {/* Tanggal */}
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">
            Tanggal {isToday && <span className="text-brand-600">• hari ini</span>}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setDate(shiftDate(date, -1))}
              className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              ◀
            </button>
            <button
              onClick={() => setDate(todayISO())}
              className="rounded-lg bg-slate-100 px-3 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Hari ini
            </button>
            <button
              onClick={() => setDate(shiftDate(date, 1))}
              className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              ▶
            </button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {days.map((d) => {
            const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            return (
              <button
                key={d}
                onClick={() => setDate(iso)}
                className={
                  "h-9 w-9 shrink-0 rounded-lg text-sm font-medium " +
                  (iso === date
                    ? "bg-brand-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100")
                }
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Santri tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {santriInKelas.map((s) => (
          <button
            key={s.id}
            onClick={() => setSantriId(s.id)}
            className={
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition " +
              (s.id === santriId
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")
            }
          >
            {s.nama}
          </button>
        ))}
      </div>

      {err && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
      )}

      {/* Panel amalan */}
      {current ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              {current.nama}{" "}
              <span className="font-normal text-slate-400">· NIS {current.nis}</span>
            </h2>
            {loading && <span className="text-xs text-slate-400">memuat…</span>}
          </div>
          {AMALAN.map((a) => (
            <AmalanRow
              key={a.id}
              amalan={a}
              value={values[a.id] ?? null}
              onChange={(next) => handleChange(a.id, next)}
              saving={savingId === a.id}
            />
          ))}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">Terisi {filledCount}/19</span>
            <button
              onClick={goNextSantri}
              disabled={isLastSantri}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
            >
              ✓ Selesai, santri berikutnya
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Tidak ada santri di kelas ini.</p>
      )}
    </div>
  );
}

function shiftDate(iso: string, delta: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
