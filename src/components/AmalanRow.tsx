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
  /** Mode padat (PC, >19 kategori): tinggi sel tetap, tanpa keterangan. */
  compact?: boolean;
}

export default function AmalanRow({ amalan, value, onChange, saving, compact }: Props) {
  const isRakaat = amalan.value_type === "rakaat";
  const isFardhu = amalan.value_type === "fardhu";
  const filled = isRakaat
    ? (value as number) != null && (value as number) > 0
    : value != null;

  return (
    <div
      className={
        "amalan-cell flex h-[58px] flex-col justify-between rounded-lg border px-2 py-1 transition-colors md:h-[38px] md:flex-row md:items-center md:justify-between md:gap-3 md:px-3 " +
        (compact
          ? "lg:h-auto lg:min-h-[40px] lg:max-h-[58px] lg:flex-1 lg:py-0.5 xl:max-h-[96px] amalan-compact "
          : "lg:h-auto lg:min-h-0 lg:max-h-[58px] lg:flex-1 lg:py-0.5 xl:max-h-[96px] ") +
        (filled
          ? "border-accent/30 bg-accent-soft/60"
          : "border-line bg-surface") +
        (saving ? " opacity-60" : "")
      }
    >
      <div className="min-w-0 md:flex-[3_1_0%]">
        <div className="flex min-w-0 items-center gap-1.5 md:gap-2">
          <span className="tnum w-4 shrink-0 text-right text-[10px] font-semibold text-faint md:w-5 md:text-xs">
            {amalan.urut}
          </span>
          {/* <md & lg-xl: nama pendek; >=xl: nama penuh (kontrol fleksibel menyisakan ruang) */}
          <span className="truncate text-[11px] font-medium text-ink md:hidden lg:block xl:hidden">
            {amalan.short}
          </span>
          <span
            className={
              "hidden truncate text-sm font-medium text-ink md:block lg:hidden xl:block " +
              (compact
                ? "xl:text-[13px]"
                : "xl:whitespace-normal xl:line-clamp-2 xl:leading-tight")
            }
          >
            {amalan.nama}
          </span>
        </div>
        {amalan.keterangan && !compact && (
          <div className="amalan-ket hidden pl-6 text-xs text-faint">
            {amalan.keterangan}
          </div>
        )}
      </div>

      <div className="w-full self-stretch md:w-auto md:min-w-[124px] md:max-w-[210px] md:flex-[1_1_150px] lg:basis-[124px] xl:basis-[150px] 2xl:basis-[210px]">
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
