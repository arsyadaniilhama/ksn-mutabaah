"use client";

import ToggleSlide from "@/components/ToggleSlide";
import RakaatStepper from "@/components/RakaatStepper";
import FardhuSegment from "@/components/FardhuSegment";
import type {
  AmalanKategori,
  BinaryStatus,
  CellValue,
  FardhuStatus,
} from "@/types";

interface Props {
  amalan: AmalanKategori;
  value: CellValue;
  onChange: (next: CellValue) => void;
  saving?: boolean;
}

export default function AmalanRow({ amalan, value, onChange, saving }: Props) {
  const isRakaat = amalan.value_type === "rakaat";
  const isFardhu = amalan.value_type === "fardhu";
  const filled = isRakaat
    ? (value as number) != null && (value as number) > 0
    : value != null;

  return (
    <div
      className={
        "flex flex-col gap-1 rounded-lg border px-2 py-1 transition-colors md:flex-row md:items-center md:justify-between md:gap-3 md:px-3 md:py-2 " +
        (filled
          ? "border-accent/30 bg-accent-soft/60"
          : "border-line bg-surface") +
        (saving ? " opacity-60" : "")
      }
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 md:gap-2">
          <span className="tnum w-4 shrink-0 text-right text-[10px] font-semibold text-faint md:w-5 md:text-xs">
            {amalan.urut}
          </span>
          <span className="truncate text-[11px] font-medium text-ink md:hidden">
            {amalan.short}
          </span>
          <span className="hidden truncate text-sm font-medium text-ink md:block">
            {amalan.nama}
          </span>
        </div>
        {amalan.keterangan && (
          <div className="hidden pl-6 text-xs text-faint md:block">
            {amalan.keterangan}
          </div>
        )}
      </div>

      <div className="shrink-0 self-end md:self-auto">
        {isRakaat ? (
          <RakaatStepper
            value={(value as number | null) ?? null}
            onChange={(v) => onChange(v)}
          />
        ) : isFardhu ? (
          <FardhuSegment
            value={(value as FardhuStatus | null) ?? null}
            onChange={(v) => onChange(v)}
          />
        ) : (
          <ToggleSlide
            value={(value as BinaryStatus | null) ?? null}
            onChange={(v) => onChange(v)}
          />
        )}
      </div>
    </div>
  );
}
