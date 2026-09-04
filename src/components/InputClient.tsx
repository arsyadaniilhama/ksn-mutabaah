"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconArrowLeft as ArrowLeft,
  IconCalendarDue as CalendarDue,
  IconChevronLeft as ChevronLeft,
  IconChevronRight as ChevronRight,
} from "@tabler/icons-react";
import { AMALAN, AMALAN_BY_ID } from "@/lib/amalan";
import { daysInMonth, parseISO, todayISO } from "@/lib/dates";
import AmalanRow from "@/components/AmalanRow";
import Avatar from "@/components/Avatar";
import MiniCalendar from "@/components/MiniCalendar";
import SantriList, { type SantriListItem } from "@/components/SantriList";
import Toast from "@/components/Toast";
import type { CellValue, Kelas, MutabaahEntry, Santri } from "@/types";

interface Props {
  santriList: Santri[];
  initialKelas: Kelas;
  initialDate: string;
  initialValues: Record<number, CellValue>;
  initialProgress: Record<string, number>;
  initialCoverage: string[];
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

const fmtTanggal = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseISO(iso));

export default function InputClient({
  santriList,
  initialKelas,
  initialDate,
  initialValues,
  initialProgress,
  initialCoverage,
}: Props) {
  const [kelas, setKelas] = useState<Kelas>(initialKelas);
  const [date, setDate] = useState<string>(initialDate);
  const santriInKelas = useMemo(
    () => santriList.filter((s) => s.kelas === kelas),
    [santriList, kelas],
  );
  const [santriId, setSantriId] = useState<string>(() => santriInKelas[0]?.id ?? "");
  const [values, setValues] = useState<Record<number, CellValue>>(initialValues);
  const [progress, setProgress] = useState<Record<string, number>>(initialProgress);
  const [coverage, setCoverage] = useState<Set<string>>(new Set(initialCoverage));
  const [calOpen, setCalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"ok" | "err">("ok");

  const firstVal = useRef(true);
  const firstProg = useRef(true);
  const dt = parseISO(date);
  const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  const firstMonth = useRef(ym);

  useEffect(() => {
    if (!santriInKelas.some((s) => s.id === santriId)) {
      setSantriId(santriInKelas[0]?.id ?? "");
    }
  }, [santriInKelas, santriId]);

  // Kunci scroll background saat slide-over terbuka (HP)
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const loadDay = useCallback(async (sid: string, d: string) => {
    if (!sid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/entries?santri_id=${sid}&date=${d}`);
      const json = await res.json();
      setValues(json.values ?? {});
    } catch {
      setToast("Gagal memuat data.");
      setToastTone("err");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (firstVal.current) {
      firstVal.current = false;
      return;
    }
    loadDay(santriId, date);
  }, [santriId, date, loadDay]);

  useEffect(() => {
    if (firstProg.current) {
      firstProg.current = false;
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/progress?date=${date}`);
        const json = await res.json();
        setProgress(json.progress ?? {});
      } catch {
        /* biarkan progress lama */
      }
    })();
  }, [date]);

  useEffect(() => {
    if (firstMonth.current === ym) return;
    firstMonth.current = ym;
    (async () => {
      try {
        const res = await fetch(`/api/coverage?year=${dt.getFullYear()}&month=${dt.getMonth() + 1}`);
        const json = await res.json();
        setCoverage(new Set(json.dates ?? []));
      } catch {
        /* noop */
      }
    })();
  }, [ym, dt]);

  const handleChange = useCallback(
    async (amalanId: number, next: CellValue) => {
      const prev = values[amalanId] ?? null;
      const newValues = { ...values, [amalanId]: next };
      setValues(newValues);
      setSavingId(amalanId);
      try {
        const entry = buildEntry(santriId, date, amalanId, next);
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: [entry] }),
        });
        if (!res.ok) throw new Error();
        const filled = AMALAN.filter((a) => {
          const v = newValues[a.id];
          return a.value_type === "rakaat" ? (v as number) > 0 : v != null;
        }).length;
        setProgress((p) => ({ ...p, [santriId]: filled }));
        setCoverage((c) => {
          if (filled === 0) return c;
          const n = new Set(c);
          n.add(date);
          return n;
        });
      } catch {
        setValues((v) => ({ ...v, [amalanId]: prev }));
        setToast("Gagal menyimpan. Coba lagi.");
        setToastTone("err");
      } finally {
        setSavingId(null);
      }
    },
    [santriId, date, values],
  );

  const currentIdx = santriInKelas.findIndex((s) => s.id === santriId);
  const current = santriInKelas[currentIdx];

  const rowsFor = (list: typeof AMALAN) =>
    list.map((a) => (
      <AmalanRow
        key={a.id}
        amalan={a}
        value={values[a.id] ?? null}
        onChange={(next) => handleChange(a.id, next)}
        saving={savingId === a.id}
      />
    ));
  const colLeft = AMALAN.slice(0, 10);
  const colRight = AMALAN.slice(10);

  const goNext = () => {
    const next = santriInKelas[currentIdx + 1];
    if (next) {
      setSantriId(next.id);
    } else {
      setMobileOpen(false);
      setToast("Semua santri di kelas ini sudah dibuka hari ini.");
      setToastTone("ok");
    }
  };

  const selectSantri = (id: string) => {
    setSantriId(id);
    setMobileOpen(true);
  };

  const items: SantriListItem[] = santriInKelas.map((s) => ({
    id: s.id,
    nama: s.nama,
    nis: s.nis,
    filled: progress[s.id] ?? 0,
  }));
  const terisi = santriInKelas.filter((s) => (progress[s.id] ?? 0) > 0).length;

  const shiftDate = (delta: number) => {
    const d = new Date(dt);
    d.setDate(d.getDate() + delta);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setDate(iso);
  };

  const panel = (
    <div className="card flex h-full min-h-0 flex-col p-3 lg:p-4">
      {current ? (
        <>
          <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-line pb-1.5 lg:mb-3 lg:border-line lg:pb-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={current.nama} />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-semibold text-ink">
                  {current.nama}
                </div>
                <div className="tnum text-xs text-faint">
                  NIS {current.nis} · {fmtTanggal(date)}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {loading && <span className="text-xs text-faint">memuat…</span>}
              <span className="tnum chip bg-surface2 text-muted">
                {items.find((i) => i.id === current.id)?.filled ?? 0}/19
              </span>
            </div>
          </div>
          {/* HP: 2 kolom compact, urutan per-kolom (1-10 | 11-19) */}
          <div className="flex flex-1 gap-1.5 overflow-y-auto pr-1 lg:hidden">
            <div className="flex-1 space-y-1">{rowsFor(colLeft)}</div>
            <div className="flex-1 space-y-1">{rowsFor(colRight)}</div>
          </div>
          {/* PC lg-xl: 1 kolom gaya penuh */}
          <div className="hidden flex-1 space-y-1.5 overflow-y-auto pr-1 lg:block xl:hidden">
            {rowsFor(AMALAN)}
          </div>
          {/* PC xl+: 2 kolom vertikal gaya penuh */}
          <div className="hidden flex-1 gap-1.5 overflow-y-auto pr-1 xl:flex">
            <div className="flex-1 space-y-1.5">{rowsFor(colLeft)}</div>
            <div className="flex-1 space-y-1.5">{rowsFor(colRight)}</div>
          </div>
          <div className="mt-3 hidden justify-end border-t border-line pt-3 lg:flex">
            <button onClick={goNext} className="btn-primary">
              Santri berikutnya
              <ChevronRight size={15} stroke={2} />
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted">Pilih santri dulu.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
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
        <div className="relative flex items-center gap-1.5">
          <button
            onClick={() => shiftDate(-1)}
            aria-label="Hari sebelumnya"
            className="btn-outline size-8 p-0"
          >
            <ChevronLeft size={14} stroke={2} />
          </button>
          <button
            onClick={() => setCalOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-line"
            aria-haspopup="dialog"
            aria-expanded={calOpen}
          >
            <CalendarDue size={14} stroke={1.75} className="text-accent" />
            {fmtTanggal(date)}
          </button>
          <button
            onClick={() => shiftDate(1)}
            aria-label="Hari berikutnya"
            className="btn-outline size-8 p-0"
          >
            <ChevronRight size={14} stroke={2} />
          </button>
          <button onClick={() => setDate(todayISO())} className="btn-ghost h-8 px-2 text-xs">
            Hari ini
          </button>
          {calOpen && (
            <MiniCalendar
              year={dt.getFullYear()}
              month={dt.getMonth() + 1}
              selected={date}
              today={todayISO()}
              marked={coverage}
              onSelect={setDate}
              onClose={() => setCalOpen(false)}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="tnum text-xs text-muted">
          Terisi hari ini: {terisi}/{santriInKelas.length} santri
        </span>
        <span className="text-xs text-faint lg:hidden">ketuk santri untuk mengisi</span>
      </div>

      {/* Desktop: master-detail dua kolom */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[320px_1fr]">
        <div className="card h-[calc(100dvh-230px)] min-h-[420px] p-3">
          <SantriList items={items} selectedId={santriId} onSelect={setSantriId} />
        </div>
        <div className="h-[calc(100dvh-230px)] min-h-[420px]">{panel}</div>
      </div>

      {/* Mobile: daftar penuh */}
      <div className="card p-3 lg:hidden">
        <SantriList items={items} selectedId={santriId} onSelect={selectSantri} />
      </div>

      {/* Mobile: slide-over panel */}
      {mobileOpen && current && (
        <div className="fixed inset-0 z-40 flex h-dvh flex-col bg-canvas lg:hidden">
          <div className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Kembali ke daftar"
              className="btn-ghost size-9 p-0"
            >
              <ArrowLeft size={18} />
            </button>
            <Avatar name={current.nama} size="sm" />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold text-ink">{current.nama}</div>
              <div className="tnum text-[11px] text-faint">
                {current.kelas} · {fmtTanggal(date)}
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">{panel}</div>
          <div className="border-t border-line bg-surface p-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            <button onClick={goNext} className="btn-primary w-full">
              Selesai & santri berikutnya
            </button>
          </div>
        </div>
      )}

      <Toast message={toast} tone={toastTone} onDone={() => setToast(null)} />
    </div>
  );
}
