"use client";

import { useEffect } from "react";
import { IconX as X } from "@tabler/icons-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Bottom sheet di HP, modal terpusat di PC (md+). Satu komponen, dua penempatan.
 */
export default function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 !mt-0" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={
          "absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-2xl border border-line bg-surface " +
          "pb-[env(safe-area-inset-bottom)] shadow-2xl " +
          "md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-md " +
          "md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
        }
      >
        {/* drag handle (mobile) */}
        <div className="flex justify-center pt-2.5 md:hidden">
          <span className="h-1 w-10 rounded-full bg-line-strong" />
        </div>
        <div className="flex items-center justify-between px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="btn-ghost size-8 p-0"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
