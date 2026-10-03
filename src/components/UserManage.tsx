"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  IconKey as Key,
  IconLoader2 as Loader,
  IconRefresh as Refresh,
  IconTrash as Trash,
  IconUserPlus as UserPlus,
} from "@tabler/icons-react";
import { createUser, deleteUser, resetUserPassword } from "@/app/pengguna/actions";
import { tapFeedback } from "@/lib/haptics";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";

interface UserRow {
  id: string;
  email: string;
  nama: string | null;
  role: string;
  institusi: string;
  createdAt: string;
  lastSignIn: string | null;
  passwordChangedAt: string | null;
  passwordChangedBy: string | null;
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function SubmitBtn({ label, busyLabel, disabled }: { label: string; busyLabel: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} className="btn-primary h-9">
      {pending ? <Loader size={15} className="animate-spin" /> : <Key size={15} stroke={1.75} />}
      {pending ? busyLabel : label}
    </button>
  );
}

function ResetForm({ userId, onDone }: { userId: string; onDone: (msg: string) => void }) {
  const [state, formAction] = useActionState(resetUserPassword, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      onDone(state.ok);
      ref.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="space-y-3 pb-1">
      <input type="hidden" name="userId" value={userId} />
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">Password baru</span>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          placeholder="min. 6 karakter"
          className="input"
          autoComplete="new-password"
        />
      </label>
      {state.error && (
        <div className="shake-x rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</div>
      )}
      <div className="flex items-center gap-2">
        <button type="submit" className="btn-primary h-9 flex-1">
          <Key size={15} stroke={1.75} />
          Simpan Password Baru
        </button>
      </div>
    </form>
  );
}

function DeleteForm({
  userId,
  email,
  onDone,
  onCancel,
}: {
  userId: string;
  email: string;
  onDone: (msg: string) => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState(deleteUser, {});
  useEffect(() => {
    if (state.ok) onDone(state.ok);
    else if (state.error) onDone("!" + state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={formAction} className="space-y-3 pb-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="email" value={email} />
      <p className="text-sm text-muted">
        Tindakan ini permanen. Akun <b className="text-ink">{email}</b> tidak akan bisa login lagi.
      </p>
      {state.error && <div className="shake-x rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</div>}
      <div className="flex items-center gap-2">
        <button type="submit" className="btn h-9 flex-1 bg-danger text-white hover:bg-danger/90">
          <Trash size={15} stroke={1.75} />
          Ya, hapus
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost h-9">
          Batal
        </button>
      </div>
    </form>
  );
}

export default function UserManage({ meEmail, meId }: { meEmail: string; meId: string }) {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addState, addFormAction] = useActionState(createUser, {});
  const addRef = useRef<HTMLFormElement>(null);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [confirmDeleteFor, setConfirmDeleteFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadErr(null);
    try {
      const res = await fetch("/api/users");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Gagal memuat pengguna.");
      setUsers(j.users);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Gagal memuat pengguna.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (addState.ok) {
      setToast({ msg: addState.ok, tone: "ok" });
      setShowAdd(false);
      addRef.current?.reset();
      load();
    } else if (addState.error) {
      setToast({ msg: addState.error, tone: "err" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addState]);

  return (
    <div className="space-y-4">
      <Toast message={toast?.msg ?? null} tone={toast?.tone} onDone={() => setToast(null)} />

      {/*Toolbar*/}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted">
          {users ? `${users.length} akun terdaftar` : "Memuat…"}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="btn-outline h-9">
            <Refresh size={15} stroke={1.75} />
            Muat ulang
          </button>
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              setShowAdd(true);
            }}
            className="btn-primary h-9"
          >
            <UserPlus size={15} stroke={1.75} />
            Tambah Pengguna
          </button>
        </div>
      </div>

      {/* Modal tambah pengguna */}
      <Modal
        open={showAdd}
        onClose={() => {
          tapFeedback();
          setShowAdd(false);
        }}
        title="Tambah Pengguna"
        subtitle="Akun baru langsung bisa login setelah dibuat"
        icon={<UserPlus size={18} stroke={1.9} />}
        maxWidth="max-w-lg"
      >
        <form ref={addRef} action={addFormAction} className="grid gap-3 pb-1 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Email</span>
            <input type="email" name="email" required placeholder="nama@imshus.com" className="input" autoComplete="off" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Password awal</span>
            <input type="text" name="password" required minLength={6} placeholder="min. 6 karakter" className="input" autoComplete="new-password" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Nama (opsional)</span>
            <input type="text" name="nama" placeholder="Ustadz / Ustadzah …" className="input" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Institusi</span>
            <select name="institusi" className="input" defaultValue="PA IMSHUS">
              <option value="PA IMSHUS">PA IMSHUS (Putra)</option>
              <option value="PI IMSHUS">PI IMSHUS (Putri)</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Role</span>
            <select name="role" className="input" defaultValue="admin">
              <option value="admin">Admin (terkunci 1 institusi)</option>
              <option value="superadmin">Superadmin (PA + PI)</option>
            </select>
          </label>
          <div className="flex items-end">
            <SubmitBtn label="Buat Akun" busyLabel="Membuat…" />
          </div>
        </form>
      </Modal>

      {/* Modal reset password pengguna lain */}
      <Modal
        open={!!resetTarget}
        onClose={() => {
          tapFeedback();
          setResetTarget(null);
        }}
        title="Reset Password"
        subtitle={resetTarget?.email}
        icon={<Key size={18} stroke={1.9} />}
      >
        {resetTarget && (
          <ResetForm
            key={resetTarget.id}
            userId={resetTarget.id}
            onDone={(msg) => {
              setToast({ msg, tone: "ok" });
              setResetTarget(null);
            }}
          />
        )}
      </Modal>

      {/* Modal hapus pengguna */}
      <Modal
        open={!!confirmDeleteFor}
        onClose={() => {
          tapFeedback();
          setConfirmDeleteFor(null);
        }}
        title="Hapus Pengguna"
        subtitle={users?.find((u) => u.id === confirmDeleteFor)?.email}
        icon={<Trash size={18} stroke={1.9} />}
      >
        {confirmDeleteFor && (
          <DeleteForm
            key={confirmDeleteFor}
            userId={confirmDeleteFor}
            email={users?.find((u) => u.id === confirmDeleteFor)?.email ?? ""}
            onDone={(msg) => {
              setConfirmDeleteFor(null);
              if (msg.startsWith("!")) setToast({ msg: msg.slice(1), tone: "err" });
              else {
                setToast({ msg, tone: "ok" });
                load();
              }
            }}
            onCancel={() => {
              tapFeedback();
              setConfirmDeleteFor(null);
            }}
          />
        )}
      </Modal>

      {loadErr && <div className="card border-danger/40 bg-danger-soft p-4 text-sm text-danger">{loadErr}</div>}

      {/*Tabel pengguna*/}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-faint">
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Institusi</th>
              <th className="px-4 py-3 font-semibold">Masuk terakhir</th>
              <th className="px-4 py-3 font-semibold">Password diganti</th>
              <th className="px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-line/70 last:border-0 align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">
                    {u.email}
                    {u.email === meEmail && <span className="ml-2 chip bg-accent-soft text-accent">Anda</span>}
                  </div>
                  {u.nama && <div className="text-xs text-faint">{u.nama}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className={"chip " + (u.role === "superadmin" ? "bg-warn-soft text-warn" : "bg-surface2 text-muted")}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">
                  {u.role === "superadmin" ? "PA + PI" : u.institusi}
                </td>
                <td className="px-4 py-3 text-muted tnum">{fmt(u.lastSignIn)}</td>
                <td className="px-4 py-3 text-muted">
                  <div className="tnum">{fmt(u.passwordChangedAt)}</div>
                  {u.passwordChangedBy && (
                    <div className="text-xs text-faint">oleh {u.passwordChangedBy}</div>
                  )}
                  <div className="mt-1 text-xs italic text-faint">isi password tidak dapat dilihat</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        tapFeedback();
                        setResetTarget(u);
                      }}
                      className="btn-outline h-8 px-2.5 text-xs"
                    >
                      <Key size={14} stroke={1.75} />
                      Ganti Password
                    </button>
                    {u.id !== meId && (
                      <button
                        type="button"
                        onClick={() => {
                          tapFeedback();
                          setConfirmDeleteFor(u.id);
                        }}
                        className="btn h-8 bg-danger-soft px-2 text-danger hover:bg-danger/15"
                        title={`Hapus ${u.email}`}
                      >
                        <Trash size={14} stroke={1.75} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Belum ada akun.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
