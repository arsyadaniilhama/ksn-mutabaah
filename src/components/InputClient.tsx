"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconCalendarEvent as CalendarDays,
  IconChevronLeft as ChevronLeft,
  IconChevronRight as ChevronRight,
} from "@tabler/icons-react";
import { AMALAN, AMALAN_BY_ID } from "@/lib/amalan";
import { daysInMonth, parseISO, todayISO } from "@/lib/dates";
import AmalanRow from "@/components/AmalanRow";
import Avatar from "@/components/Avatar";
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
    () => santriInKelas[0]?.id ?? "",
  );
  const [values, setValues] = useState<Record<number, CellValue>>(initialValues);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const first = useRef(true);

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
  const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  const dim = daysInMonth(dt.getFullYear(), dt.getMonth() + 1);
  const days = Array.from({ length: dim }, (_, i) => i + 1);
  const today = todayISO();

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
      {/* Kelas + Tanggal */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex rounded-lg border border-line bg-canvas p-0.5">
          {KELAS_LIST.map((k) => (
            <button
              key={k}
              onClick={() => setKelas(k)}
              className={
                "rounded-md px-3 py-1.5 text-xs font-medium transition " +
                (k === kelas
                  ? "bg-surface text-ink shadow-sm"
                  : "text-muted hover:text-ink")
              }
            >
              {k}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            aria-label="Hari sebelumnya"
            className="btn-outline size-8 p-0"
          >
            <ChevronLeft size={14} stroke={2} />
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface2 px-3 py-1.5 text-xs font-semibold text-ink">
            <CalendarDays size={14} stroke={1.75} className="text-accent" />
            {dt.getDate()} {new Intl.DateTimeFormat("id-ID", { month: "long" }).format(dt)}{" "}
            {dt.getFullYear()}
          </span>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            aria-label="Hari berikutnya"
            className="btn-outline size-8 p-0"
          >
            <ChevronRight size={14} stroke={2} />
          </button>
          <button
            onClick={() => setDate(today)}
            className="btn-ghost h-8 px-2 text-xs"
          >
            Hari ini
          </button>
        </div>
      </div>

      {/* Chip tanggal */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {days.map((d) => {
          const iso = `${ym}-${String(d).padStart(2, "0")}`;
          const active = iso === date;
          return (
            <button
              key={d}
              onClick={() => setDate(iso)}
              className={
                "tnum grid size-9 shrink-0 place-items-center rounded-lg text-sm font-medium transition " +
                (active
                  ? "bg-accent text-accent-fg"
                  : iso === today
                    ? "bg-accent-soft text-accent ring-1 ring-accent/40"
                    : "bg-surface text-muted ring-1 ring-line hover:bg-surface2")
              }
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Chip santri */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {santriInKelas.map((s) => (
          <button
            key={s.id}
            onClick={() => setSantriId(s.id)}
            className={
              "flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-sm font-medium transition " +
              (s.id === santriId
                ? "bg-ink text-canvas"
                : "bg-surface text-muted ring-1 ring-line hover:bg-surface2")
            }
          >
            <Avatar name={s.nama} size="sm" />
            {s.nama}
          </button>
        ))}
      </div>

      {err && (
        <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {err}
        </div>
      )}

      {/* Panel amalan */}
      {current ? (
        <div className="card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex items-center gap-3">
              <Avatar name={current.nama} />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-ink">{current.nama}</div>
                <div className="tnum text-xs text-faint">
                  NIS {current.nis} · {current.kelas}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {loading && <span className="text-xs text-faint">memuat…</span>}
              <span className="tnum chip bg-surface2 text-muted">
                {filledCount}/19 terisi
              </span>
            </div>
          </div>

          <div className="grid gap-1.5 md:grid-cols-2">
            {AMALAN.map((a) => (
              <AmalanRow
                key={a.id}
                amalan={a}
                value={values[a.id] ?? null}
                onChange={(next) => handleChange(a.id, next)}
                saving={savingId === a.id}
              />
            ))}
          </div>

          <div className="mt-4 flex justify-end border-t border-line pt-3">
            <button
              onClick={goNextSantri}
              disabled={isLastSantri}
              className="btn-primary"
            >
              Selesai, santri berikutnya
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Tidak ada santri di kelas ini.</p>
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
