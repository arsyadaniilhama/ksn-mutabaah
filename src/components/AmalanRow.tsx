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
        "amalan-cell flex h-[58px] flex-col justify-between rounded-lg border px-2 py-1 transition-colors md:h-[38px] md:flex-row md:items-center md:justify-between md:gap-3 md:px-3 lg:h-auto lg:min-h-0 lg:max-h-[58px] lg:flex-1 lg:py-0.5 " +
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
          <div className="amalan-ket hidden pl-6 text-xs text-faint">
            {amalan.keterangan}
          </div>
        )}
      </div>

      <div className="w-full shrink-0 self-stretch md:w-[200px] xl:w-[240px]">
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
