"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconArrowLeft as ArrowLeft,
  IconCalendarDue as CalendarDue,
  IconChevronLeft as ChevronLeft,
  IconChevronRight as ChevronRight,
} from "@tabler/icons-react";
import { AMALAN, AMALAN_BY_ID } from "@/lib/amalan";
import type { AmalanKategori } from "@/types";
import { daysInMonth, parseISO, todayISO } from "@/lib/dates";
import AmalanRow from "@/components/AmalanRow";
import Avatar from "@/components/Avatar";
import { errorFeedback, successFeedback, tapFeedback } from "@/lib/haptics";
import MiniCalendar from "@/components/MiniCalendar";
import SantriList, { type SantriListItem } from "@/components/SantriList";
import Toast from "@/components/Toast";
import type { CellValue, Kelas, MutabaahEntry, Santri } from "@/types";

interface Props {
  santriList: Santri[];
  initialKelas: Kelas;
  initialDate: string;
  initialValues: Record<number, CellValue>;
  initialDayCache?: Record<string, Record<number, CellValue>>;
  initialProgress: Record<string, number>;
  initialCoverage: string[];
  label?: string;
  institusi?: string;
  amalanList?: AmalanKategori[];
}

const KELAS_ORDER: Kelas[] = ["Kelas 1", "Kelas 2", "Kelas 3"];

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
    month: "short", // 3 huruf (Sep, Agu, Jun) — nama bulan panjang merusak kerapian pill
    year: "numeric",
  }).format(parseISO(iso));

export default function InputClient({
  santriList,
  initialKelas,
  initialDate,
  initialValues,
  initialDayCache,
  initialProgress,
  initialCoverage,
  label = "Santri",
  institusi,
  amalanList = AMALAN,
}: Props) {
  const labelLc = label.toLowerCase();
  const totalAmalan = amalanList.length;
  const splitIdx = Math.ceil(totalAmalan / 2);
  const canHaid = institusi === "PI IMSHUS";
  const [haidDates, setHaidDates] = useState<Set<string>>(new Set());
  const [haidSaving, setHaidSaving] = useState(false);
  const [kelas, setKelas] = useState<Kelas>(initialKelas);
  const [date, setDate] = useState<string>(initialDate);
  const kelasList = useMemo(
    () =>
      KELAS_ORDER.filter((k) => santriList.some((s) => s.kelas === k)),
    [santriList],
  );
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
  // kilat status per sel: "ok" = centang pop, "err" = goyang (auto-hilang)
  const [flash, setFlash] = useState<{ id: number; kind: "ok" | "err"; n: number } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showFlash = (id: number, kind: "ok" | "err") => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ id, kind, n: Date.now() });
    flashTimer.current = setTimeout(() => setFlash(null), kind === "ok" ? 550 : 400);
  };
  // arah pergantian santri untuk efek luncur nama: 1 = maju, -1 = mundur
  const [navDir, setNavDir] = useState<1 | -1>(1);
  const nameSlideStyle = {
    ["--name-dir" as string]: navDir === 1 ? "12px" : "-12px",
  } as React.CSSProperties;

  const firstVal = useRef(true);
  const firstProg = useRef(true);
  const dt = parseISO(date);
  const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  const firstMonth = useRef(ym);

  // In-memory client cache untuk values amalan (santriId:date -> values).
  // Menjadikan klik nama santri & "santri berikutnya" 0 ms INSTAN tanpa loading spinner.
  const dayCache = useRef<Map<string, Record<number, CellValue>>>(new Map());
  const haidCache = useRef<Map<string, Set<string>>>(new Map());
  const progressCache = useRef<Map<string, Record<string, number>>>(new Map());
  const coverageCache = useRef<Map<string, Set<string>>>(new Map());

  // Inisialisasi cache awal dari SSR data
  const initialized = useRef(false);
  if (!initialized.current) {
    initialized.current = true;
    if (initialDayCache) {
      for (const [sid, val] of Object.entries(initialDayCache)) {
        dayCache.current.set(`${sid}:${initialDate}`, val);
      }
    } else if (santriInKelas[0]?.id) {
      dayCache.current.set(`${santriInKelas[0].id}:${initialDate}`, initialValues);
    }
    progressCache.current.set(initialDate, initialProgress);
    coverageCache.current.set(ym, new Set(initialCoverage));
  }

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
    const cacheKey = `${sid}:${d}`;
    const cached = dayCache.current.get(cacheKey);
    if (cached) {
      setValues(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/entries?santri_id=${sid}&date=${d}`);
      const json = await res.json();
      const val = json.values ?? {};
      dayCache.current.set(cacheKey, val);
      setValues(val);
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
    const cacheKey = `${santriId}:${date}`;
    if (dayCache.current.has(cacheKey)) {
      setValues(dayCache.current.get(cacheKey)!);
    } else {
      loadDay(santriId, date);
    }
  }, [santriId, date, loadDay]);

  // Prefetch nilai seluruh santri di kelas aktif saat tanggal atau kelas berganti (~80ms 1x)
  const prevDateKelas = useRef(`${initialDate}:${initialKelas}`);
  useEffect(() => {
    const cur = `${date}:${kelas}`;
    if (prevDateKelas.current === cur) return;
    prevDateKelas.current = cur;

    (async () => {
      try {
        const res = await fetch(`/api/entries?kelas=${encodeURIComponent(kelas)}&date=${date}`);
        const json = await res.json();
        if (json.dayValues) {
          for (const [sid, val] of Object.entries(json.dayValues)) {
            dayCache.current.set(`${sid}:${date}`, val as Record<number, CellValue>);
          }
          if (santriId && json.dayValues[santriId]) {
            setValues(json.dayValues[santriId] as Record<number, CellValue>);
          }
        }
      } catch {
        /* noop */
      }
    })();
  }, [date, kelas, santriId]);

  useEffect(() => {
    if (firstProg.current) {
      firstProg.current = false;
      return;
    }
    const cached = progressCache.current.get(date);
    if (cached) {
      setProgress(cached);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/progress?date=${date}`);
        const json = await res.json();
        const p = (json.progress ?? {}) as Record<string, number>;
        progressCache.current.set(date, p);
        setProgress(p);
      } catch {
        /* biarkan progress lama */
      }
    })();
  }, [date]);

  useEffect(() => {
    if (firstMonth.current === ym) return;
    firstMonth.current = ym;
    const cached = coverageCache.current.get(ym);
    if (cached) {
      setCoverage(cached);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/coverage?year=${dt.getFullYear()}&month=${dt.getMonth() + 1}`);
        const json = await res.json();
        const c = new Set<string>(json.dates ?? []);
        coverageCache.current.set(ym, c);
        setCoverage(c);
      } catch {
        /* noop */
      }
    })();
  }, [ym, dt]);

  // Ambil tanggal haid santriwati terpilih (dengan in-memory cache)
  useEffect(() => {
    if (!canHaid || !santriId) return;
    const [hy, hm] = ym.split("-");
    const hKey = `${santriId}:${ym}`;
    const cached = haidCache.current.get(hKey);
    if (cached) {
      setHaidDates(cached);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/haid?santri_id=${santriId}&year=${hy}&month=${hm}`);
        const json = await res.json();
        const set = new Set<string>(json.dates ?? []);
        haidCache.current.set(hKey, set);
        setHaidDates(set);
      } catch {
        /* noop */
      }
    })();
  }, [canHaid, santriId, ym]);

  const isHaidToday = haidDates.has(date);
  const toggleHaid = async () => {
    if (!canHaid || !santriId || haidSaving) return;
    tapFeedback();
    const on = !isHaidToday;
    setHaidSaving(true);
    setHaidDates((s) => {
      const n = new Set(s);
      if (on) n.add(date);
      else n.delete(date);
      haidCache.current.set(`${santriId}:${ym}`, n);
      return n;
    });
    try {
      const res = await fetch("/api/haid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ santri_id: santriId, date, on }),
      });
      if (!res.ok) throw new Error();
      successFeedback();
    } catch {
      errorFeedback();
      setHaidDates((s) => {
        const n = new Set(s);
        if (on) n.delete(date);
        else n.add(date);
        haidCache.current.set(`${santriId}:${ym}`, n);
        return n;
      });
      setToast("Gagal menyimpan status haid.");
      setToastTone("err");
    } finally {
      setHaidSaving(false);
    }
  };

  const handleChange = useCallback(
    async (amalanId: number, next: CellValue) => {
      const prev = values[amalanId] ?? null;
      const newValues = { ...values, [amalanId]: next };
      setValues(newValues);
      dayCache.current.set(`${santriId}:${date}`, newValues);
      setSavingId(amalanId);
      try {
        const entry = buildEntry(santriId, date, amalanId, next);
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: [entry] }),
        });
        if (!res.ok) throw new Error();
        const filled = amalanList.filter((a) => {
          const v = newValues[a.id];
          return a.value_type === "rakaat" ? (v as number) > 0 : v != null;
        }).length;
        setProgress((p) => {
          const np = { ...p, [santriId]: filled };
          progressCache.current.set(date, np);
          return np;
        });
        setCoverage((c) => {
          if (filled === 0) return c;
          const n = new Set(c);
          n.add(date);
          coverageCache.current.set(ym, n);
          return n;
        });
        successFeedback();
        showFlash(amalanId, "ok");
      } catch {
        errorFeedback();
        showFlash(amalanId, "err");
        setValues((v) => {
          const rolled = { ...v, [amalanId]: prev };
          dayCache.current.set(`${santriId}:${date}`, rolled);
          return rolled;
        });
        setToast("Gagal menyimpan. Coba lagi.");
        setToastTone("err");
      } finally {
        setSavingId(null);
      }
    },
    [santriId, date, values, amalanList, ym],
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
        flash={flash?.id === a.id ? { kind: flash.kind, n: flash.n } : null}
        compact={totalAmalan > 19}
      />
    ));
  const colLeft = amalanList.slice(0, splitIdx);
  const colRight = amalanList.slice(splitIdx);

  const goNext = () => {
    tapFeedback();
    const next = santriInKelas[currentIdx + 1];
    if (next) {
      setNavDir(1);
      setSantriId(next.id);
    } else {
      setMobileOpen(false);
      setToast(`Semua ${labelLc} di kelas ini sudah dibuka hari ini.`);
      setToastTone("ok");
    }
  };

  const goPrev = () => {
    tapFeedback();
    const prev = santriInKelas[currentIdx - 1];
    if (prev) {
      setNavDir(-1);
      setSantriId(prev.id);
    }
  };

  const selectSantri = (id: string) => {
    tapFeedback();
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
    <div className="card flex h-full min-h-0 min-w-0 flex-col p-3 lg:p-4">
      {current ? (
        <>
          <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-line pb-1.5 lg:mb-3 lg:border-line lg:pb-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={current.nama} />
              <div className="min-w-0 leading-tight">
                <div
                  key={current.id}
                  style={nameSlideStyle}
                  className="name-slide truncate text-sm font-semibold text-ink"
                >
                  {current.nama}
                </div>
                <div className="tnum truncate text-xs text-faint">NIS {current.nis}</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {loading && <span className="hidden whitespace-nowrap text-xs text-faint xl:inline">memuat…</span>}
              <span className="tnum chip bg-surface2 text-muted">
                {items.find((i) => i.id === current.id)?.filled ?? 0}/{totalAmalan}
              </span>
              {canHaid && (
                <button
                  type="button"
                  onClick={toggleHaid}
                  disabled={haidSaving}
                  aria-pressed={isHaidToday}
                  title="Tandai hari ini sebagai haid (amalan selain dzikir/infaq/sunnah tidur tidak dihitung)"
                  className={
                    "chip transition-colors " +
                    (haidSaving ? "opacity-60 " : "") +
                    (isHaidToday
                      ? "bg-danger text-white"
                      : "border border-line bg-surface text-muted hover:text-ink")
                  }
                >
                  Haid
                </button>
              )}
              <button
                onClick={goNext}
                title={`${label} berikutnya`}
                className="btn-primary hidden h-7 shrink-0 items-center gap-1 whitespace-nowrap px-2 text-xs lg:inline-flex"
              >
                <span className="hidden xl:inline">{label} berikutnya</span>
                <ChevronRight size={14} stroke={2} />
              </button>
            </div>
          </div>
          {canHaid && isHaidToday && (
            <p className="mb-2 rounded-lg bg-danger-soft px-3 py-1.5 text-xs text-danger">
              Hari ini ditandai <b>haid</b> — sholat &amp; dzikir sekitar sholat tidak dihitung.{" "}
              <span className="text-muted">
                Infaq shubuh, dzikir pagi/petang &amp; sunnah sebelum tidur tetap dinilai.
              </span>
            </p>
          )}
          {/* HP/tablet: 2 kolom compact, urutan per-kolom (1-10 | 11-19) */}
          <div className="flex flex-1 gap-1.5 overflow-y-auto pr-1 lg:hidden">
            <div className="flex-1 space-y-1">{rowsFor(colLeft)}</div>
            <div className="flex-1 space-y-1">{rowsFor(colRight)}</div>
          </div>
          {/* PC lg+: 2 kolom vertikal auto-fit (sel mengisi tinggi tersedia, bebas resolusi) */}
          <div className="hidden min-h-0 min-w-0 flex-1 gap-1.5 overflow-y-auto pr-1 lg:flex">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 xl:gap-1.5">{rowsFor(colLeft)}</div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 xl:gap-1.5">
              {rowsFor(colRight)}
              {colRight.length < colLeft.length && (
                <div aria-hidden className="hidden flex-1 lg:block" />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="m-auto flex max-w-xs flex-col items-center gap-1 px-6 text-center">
          <p className="text-sm font-medium text-muted">Pilih {labelLc} dulu.</p>
          <p className="text-xs text-faint">
            Klik salah satu {labelLc} di daftar sebelah kiri untuk mengisi amalan.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:space-y-3 lg:overflow-hidden">
      {/* Toolbar */}
      <div className="card flex shrink-0 flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex shrink-0 rounded-lg border border-line bg-canvas p-0.5">
          {kelasList.map((k) => (
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
        <div className="relative flex min-w-0 flex-wrap items-center justify-end gap-1.5">
          <button
            onClick={() => shiftDate(-1)}
            aria-label="Hari sebelumnya"
            className="btn-outline size-8 shrink-0 p-0"
          >
            <ChevronLeft size={14} stroke={2} />
          </button>
          <button
            onClick={() => setCalOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-surface2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-line"
            aria-haspopup="dialog"
            aria-expanded={calOpen}
          >
            <CalendarDue size={14} stroke={1.75} className="shrink-0 text-accent" />
            {fmtTanggal(date)}
          </button>
          <button
            onClick={() => shiftDate(1)}
            aria-label="Hari berikutnya"
            className="btn-outline size-8 shrink-0 p-0"
          >
            <ChevronRight size={14} stroke={2} />
          </button>
          <button
            onClick={() => setDate(todayISO())}
            className="btn-ghost h-8 whitespace-nowrap px-2 text-xs"
          >
            Hari ini
          </button>
          <span className="tnum chip ml-1 hidden whitespace-nowrap bg-accent-soft text-accent lg:inline-flex">
            Terisi {terisi}/{santriInKelas.length}
          </span>
          {calOpen && (
            <MiniCalendar
              year={dt.getFullYear()}
              month={dt.getMonth() + 1}
              selected={date}
              today={todayISO()}
              marked={coverage}
              haid={canHaid ? haidDates : undefined}
              onSelect={setDate}
              onClose={() => setCalOpen(false)}
            />
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end px-1 lg:hidden">
        <span className="text-xs text-faint lg:hidden">ketuk {labelLc} untuk mengisi</span>
      </div>

      {/* Desktop: master-detail dua kolom (tinggi terkunci viewport, halaman tak scroll) */}
      <div className="hidden min-h-0 flex-1 gap-4 lg:grid lg:grid-cols-[minmax(204px,248px)_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="card min-h-0 min-w-0 p-3">
          <SantriList
            items={items}
            selectedId={santriId}
            onSelect={setSantriId}
            total={totalAmalan}
            label={label}
            terisi={terisi}
          />
        </div>
        <div className="min-h-0 min-w-0">{panel}</div>
      </div>

      {/* Mobile: daftar penuh */}
      <div className="card p-3 lg:hidden">
        <SantriList
          items={items}
          selectedId={santriId}
          onSelect={selectSantri}
          total={totalAmalan}
          label={label}
          terisi={terisi}
        />
      </div>

      {/* Mobile: slide-over panel */}
      {mobileOpen && current && (
        <div className="fixed inset-0 z-40 !mt-0 flex h-dvh flex-col bg-canvas lg:hidden">
          <div className="flex items-center gap-1.5 border-b border-line bg-surface px-2 py-2">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Kembali ke daftar"
              className="btn-ghost size-9 shrink-0 p-0"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={goPrev}
              disabled={currentIdx <= 0}
              aria-label={`${label} sebelumnya`}
              title={`${label} sebelumnya`}
              className="btn-ghost size-9 shrink-0 p-0 disabled:opacity-30"
            >
              <ChevronLeft size={19} stroke={2} />
            </button>
            <div className="min-w-0 flex-1 text-center leading-tight">
              <div
                key={current.id}
                style={nameSlideStyle}
                className="name-slide truncate text-sm font-semibold text-ink"
              >
                {current.nama}
              </div>
              <div className="tnum truncate text-[11px] text-faint">
                {current.kelas} · NIS {current.nis}
              </div>
            </div>
            <button
              onClick={goNext}
              disabled={currentIdx >= santriInKelas.length - 1}
              aria-label={`${label} berikutnya`}
              title={`${label} berikutnya`}
              className="btn-ghost size-9 shrink-0 p-0 disabled:opacity-30"
            >
              <ChevronRight size={19} stroke={2} />
            </button>
            <span className="tnum chip shrink-0 bg-accent-soft text-accent">
              {currentIdx + 1}/{santriInKelas.length}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 border-b border-line bg-canvas px-3 py-1.5 text-[11.5px] font-medium text-muted">
            <CalendarDue size={13} stroke={1.9} className="shrink-0 text-accent" />
            {fmtTanggal(date)}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">{panel}</div>
          <div className="border-t border-line bg-surface p-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            <div className="flex items-stretch gap-2">
              <button
                onClick={goPrev}
                disabled={currentIdx <= 0}
                aria-label={`${label} sebelumnya`}
                className="btn-outline size-11 shrink-0 p-0 disabled:opacity-30"
              >
                <ChevronLeft size={20} stroke={2} />
              </button>
              <div className="flex min-w-0 flex-1 flex-col items-stretch gap-1">
                <button
                  onClick={goNext}
                  disabled={currentIdx >= santriInKelas.length - 1}
                  className="btn-primary flex-1"
                >
                  Simpan &amp; berikutnya
                  <ChevronRight size={16} stroke={2} />
                </button>
                <span className="tnum text-center text-[10.5px] text-faint">
                  {items.find((i) => i.id === current.id)?.filled ?? 0}/{totalAmalan} amalan terisi
                </span>
              </div>
              <button
                onClick={goNext}
                disabled={currentIdx >= santriInKelas.length - 1}
                aria-label={`Lewati ke ${labelLc} berikutnya`}
                className="btn-outline size-11 shrink-0 p-0 disabled:opacity-30"
              >
                <ChevronRight size={20} stroke={2} />
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} tone={toastTone} onDone={() => setToast(null)} />
    </div>
  );
}
