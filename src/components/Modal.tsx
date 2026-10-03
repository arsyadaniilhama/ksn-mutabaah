"use client";

import { useEffect, useRef } from "react";
import { IconX as X } from "@tabler/icons-react";
import { tapFeedback } from "@/lib/haptics";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** kelas lebar maks saat desktop, mis. "max-w-md" | "max-w-lg" */
  maxWidth?: string;
}

/**
 * Dialog premium: menempel ATAS di HP (turun dari atas, tidak menutupi
 * tombol navigasi/gesture bar), melebar tengah di desktop. Backdrop blur,
 * panel + pegas (translate + scale .97 -> 1). Keluar dengan Esc/klik luar/X.
 * Motif terlihat-sama-tertutup memakai visibility seperti sheet BottomNav
 * (menghindari artefak hantu di belakang elemen fixed lain).
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = "max-w-md",
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]), select, textarea"
      );
      el?.focus();
    }, 340);
    return () => {
      document.body.style.overflow = prevBody;
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <div
      className={
        "no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto transition-[visibility] duration-[420ms] p-3 sm:items-center sm:p-6 " +
        (open ? "visible" : "invisible pointer-events-none")
      }
      role="dialog"
      aria-modal="true"
      aria-label={title}
      aria-hidden={!open}
    >
      {/* backdrop */}
      <div
        className={
          "absolute inset-0 touch-none bg-black/45 backdrop-blur-[3px] transition-opacity duration-300 motion-reduce:transition-none " +
          (open ? "opacity-100" : "opacity-0")
        }
        onClick={() => {
          tapFeedback();
          onClose();
        }}
      />
      {/* panel — HP: turun dari atas dengan sudut bawah membulat; desktop: tengah */}
      <div
        ref={panelRef}
        className={
          "relative my-2 w-full " + maxWidth + " rounded-b-2xl rounded-t-lg border border-line bg-surface shadow-2xl sm:rounded-2xl " +
          "pt-[max(8px,env(safe-area-inset-top))] pb-4 transition duration-[380ms] ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none " +
          (open
            ? "translate-y-0 scale-100 opacity-100"
            : "-translate-y-6 scale-[0.97] opacity-0")
        }
      >
        {/* header */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          {icon && (
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[15px] font-semibold text-ink">{title}</div>
            {subtitle && (
              <div className="truncate text-xs text-faint">{subtitle}</div>
            )}
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => {
              tapFeedback();
              onClose();
            }}
            className="btn-ghost size-9 shrink-0 rounded-full p-0"
          >
            <X size={18} stroke={1.75} />
          </button>
        </div>
        <div className="px-5 pt-4">{children}</div>
      </div>
    </div>
  );
}
