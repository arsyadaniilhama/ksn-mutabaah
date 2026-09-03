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
  const filled = isRakaat
    ? (value as number) != null && (value as number) > 0
    : value != null;

  return (
    <div
      className={
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors " +
        (filled
          ? "border-accent/30 bg-accent-soft/60"
          : "border-line bg-surface") +
        (saving ? " opacity-60" : "")
      }
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="tnum w-5 shrink-0 text-right text-xs font-semibold text-faint">
            {amalan.urut}
          </span>
          <span className="truncate text-sm font-medium text-ink">
            {amalan.nama}
          </span>
        </div>
        {amalan.keterangan && (
          <div className="pl-7 text-xs text-faint">{amalan.keterangan}</div>
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
