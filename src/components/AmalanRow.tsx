"use client";

import ToggleSlide from "@/components/ToggleSlide";
import RakaatStepper from "@/components/RakaatStepper";
import type { AmalanKategori, CellValue, EntryStatus } from "@/types";

interface Props {
  amalan: AmalanKategori;
  value: CellValue;
  onChange: (next: CellValue) => void;
  saving?: boolean;
}

export default function AmalanRow({ amalan, value, onChange, saving }: Props) {
  const isRakaat = amalan.value_type === "rakaat";
  const filled = isRakaat ? (value as number) != null && (value as number) > 0 : value != null;

  return (
    <div
      className={
        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 transition " +
        (filled
          ? "border-brand-100 bg-brand-50/40"
          : "border-slate-200 bg-white") +
        (saving ? " opacity-70" : "")
      }
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-right text-xs font-bold text-slate-400">
            {amalan.urut}
          </span>
          <span className="truncate text-sm font-medium text-slate-800">
            {amalan.nama}
          </span>
        </div>
        {amalan.keterangan && (
          <div className="pl-7 text-xs text-slate-400">{amalan.keterangan}</div>
        )}
      </div>

      <div className="shrink-0">
        {isRakaat ? (
          <RakaatStepper
            value={(value as number | null) ?? null}
            onChange={(v) => onChange(v)}
          />
        ) : (
          <ToggleSlide
            value={(value as EntryStatus | null) ?? null}
            onChange={(v) => onChange(v)}
          />
        )}
      </div>
    </div>
  );
}
