"use client";

import { useEffect, useState } from "react";
import Sheet from "@/components/Sheet";
import type { Kelas, Santri } from "@/types";

interface Props {
  open: boolean;
  mode: "add" | "edit";
  initial: Partial<Santri> & { kelas?: Kelas };
  onClose: () => void;
  onSaved: (message: string) => void;
}

const KELAS_LIST: Kelas[] = ["Kelas 1", "Kelas 2", "Kelas 3"];

export default function SantriSheet({ open, mode, initial, onClose, onSaved }: Props) {
  const [nama, setNama] = useState("");
  const [nis, setNis] = useState("");
  const [kelas, setKelas] = useState<Kelas>("Kelas 1");
  const [aktif, setAktif] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNama(initial.nama ?? "");
    setNis(initial.nis != null ? String(initial.nis) : "");
    setKelas((initial.kelas as Kelas) ?? "Kelas 1");
    setAktif(initial.aktif ?? true);
    setErr(null);
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nama.trim().length < 3) {
      setErr("Nama minimal 3 karakter.");
      return;
    }
    if (!/^\d{1,4}$/.test(nis.trim())) {
      setErr("NIS harus 1-4 digit angka.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res =
        mode === "add"
          ? await fetch("/api/santri", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nis: Number(nis), nama: nama.trim(), kelas }),
            })
          : await fetch(`/api/santri/${initial.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nis: Number(nis),
                nama: nama.trim(),
                kelas,
                aktif,
              }),
            });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan.");
      onSaved(mode === "add" ? "Santri ditambahkan." : "Perubahan tersimpan.");
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === "add" ? `Tambah Santri — ${kelas}` : "Ubah Data Santri"}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="s-nama" className="text-sm font-medium text-ink">
            Nama
          </label>
          <input
            id="s-nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="input h-11"
            placeholder="Nama lengkap"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="s-nis" className="text-sm font-medium text-ink">
            NIS
          </label>
          <input
            id="s-nis"
            value={nis}
            onChange={(e) => setNis(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            className="input tnum h-11"
            placeholder="mis. 978"
          />
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Kelas</span>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-canvas p-1">
            {KELAS_LIST.map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setKelas(k)}
                className={
                  "rounded-md py-2 text-xs font-medium transition " +
                  (k === kelas
                    ? "bg-accent text-accent-fg"
                    : "text-muted hover:text-ink")
                }
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {mode === "edit" && (
          <div className="flex items-center justify-between rounded-lg border border-line bg-canvas px-3.5 py-3">
            <div className="leading-tight">
              <div className="text-sm font-medium text-ink">Aktif</div>
              <div className="text-xs text-faint">
                Nonaktifkan untuk santri keluar/pulang. Riwayat tetap tersimpan.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={aktif}
              onClick={() => setAktif((a) => !a)}
              className={
                "relative h-7 w-12 shrink-0 rounded-full transition-colors " +
                (aktif ? "bg-accent" : "bg-line-strong")
              }
            >
              <span
                className={
                  "absolute top-1 size-5 rounded-full bg-white shadow transition-all " +
                  (aktif ? "left-6" : "left-1")
                }
              />
            </button>
          </div>
        )}

        {err && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{err}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-outline flex-1 h-11">
            Batal
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 h-11">
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
