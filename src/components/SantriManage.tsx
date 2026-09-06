"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconPencil as Pencil, IconPlus as Plus } from "@tabler/icons-react";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";
import SantriSheet from "@/components/SantriSheet";
import Toast from "@/components/Toast";
import type { Kelas, Santri } from "@/types";

const KELAS_ORDER: Kelas[] = ["Kelas 1", "Kelas 2", "Kelas 3"];

type SheetState =
  | { mode: "add"; kelas: Kelas }
  | { mode: "edit"; santri: Santri }
  | null;

export default function SantriManage({
  santri,
  institusi,
  label = "Santri",
}: {
  santri: Santri[];
  institusi: string;
  label?: string;
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState<SheetState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const kelasList = useMemo(() => {
    const ada = KELAS_ORDER.filter((k) => santri.some((s) => s.kelas === k));
    return ada.length ? ada : KELAS_ORDER;
  }, [santri]);

  return (
    <div className="space-y-8">
      {kelasList.map((k) => {
        const list = santri.filter((s) => s.kelas === k);
        const aktifCount = list.filter((s) => s.aktif).length;
        return (
          <section key={k}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                {k}
                <span className="tnum chip bg-surface2 text-muted">
                  {aktifCount} aktif
                </span>
              </h2>
              <button
                onClick={() => setSheet({ mode: "add", kelas: k })}
                className="btn-outline h-8 text-xs"
              >
                <Plus size={14} stroke={2} /> Tambah
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <div
                  key={s.id}
                  className={
                    "card group flex items-center gap-3 p-3 transition-colors " +
                    (s.aktif ? "hover:border-accent/40" : "opacity-60")
                  }
                >
                  <Avatar name={s.nama} />
                  <Link
                    href={`/santri/${s.id}`}
                    className="min-w-0 flex-1 leading-tight"
                  >
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink group-hover:text-accent">
                        {s.nama}
                      </span>
                    </span>
                    <span className="tnum block text-xs text-faint">NIS {s.nis}</span>
                  </Link>
                  {!s.aktif && <Badge tone="danger">Nonaktif</Badge>}
                  <button
                    onClick={() => setSheet({ mode: "edit", santri: s })}
                    aria-label={`Ubah ${s.nama}`}
                    className="btn-ghost size-8 shrink-0 p-0"
                  >
                    <Pencil size={15} stroke={1.75} />
                  </button>
                </div>
              ))}
              {list.length === 0 && (
                <p className="text-sm text-faint">
                  Belum ada {label.toLowerCase()} di kelas ini.
                </p>
              )}
            </div>
          </section>
        );
      })}

      <SantriSheet
        open={sheet !== null}
        mode={sheet?.mode ?? "add"}
        institusi={institusi}
        label={label}
        kelasList={kelasList}
        initial={
          sheet?.mode === "edit"
            ? sheet.santri
            : { kelas: sheet?.mode === "add" ? sheet.kelas : kelasList[0], aktif: true }
        }
        onClose={() => setSheet(null)}
        onSaved={(msg) => {
          setToast(msg);
          router.refresh();
        }}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
