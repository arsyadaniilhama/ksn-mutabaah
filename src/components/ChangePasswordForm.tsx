"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { IconKey as Key, IconLoader2 as Loader } from "@tabler/icons-react";
import { changeOwnPassword } from "@/app/pengguna/actions";
import Toast from "@/components/Toast";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary h-9">
      {pending ? <Loader size={15} className="animate-spin" /> : <Key size={15} stroke={1.75} />}
      {pending ? "Menyimpan…" : "Ganti Password"}
    </button>
  );
}

export default function ChangePasswordForm({
  email,
  role,
  institusi,
}: {
  email: string;
  role: string;
  institusi: string;
}) {
  const [state, action] = useActionState(changeOwnPassword, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setToast(state.ok);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="max-w-lg space-y-4">
      <Toast message={toast} onDone={() => setToast(null)} />

      <div className="card p-4">
        <div className="text-sm">
          <div className="mb-1 flex justify-between">
            <span className="text-muted">Email</span>
            <span className="font-medium text-ink">{email}</span>
          </div>
          <div className="mb-1 flex justify-between">
            <span className="text-muted">Role</span>
            <span className="font-medium text-ink">{role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Institusi</span>
            <span className="font-medium text-ink">{role === "superadmin" ? "PA + PI" : institusi}</span>
          </div>
        </div>
      </div>

      <form ref={formRef} action={action} className="card space-y-3 p-4">
        {!show && (
          <button
            type="button"
            onClick={() => setShow(true)}
            className="btn-outline h-9 w-full"
          >
            <Key size={15} stroke={1.75} />
            Ganti Password Saya
          </button>
        )}
        {show && (
          <>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Password lama</span>
              <input
                type="password"
                name="oldPassword"
                required
                className="input"
                autoComplete="current-password"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Password baru</span>
              <input
                type="password"
                name="newPassword"
                required
                minLength={6}
                className="input"
                autoComplete="new-password"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Ulangi password baru</span>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                className="input"
                autoComplete="new-password"
              />
            </label>
            {state.error && (
              <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</div>
            )}
            <div className="flex items-center gap-2">
              <Submit />
              <button type="button" onClick={() => setShow(false)} className="btn-ghost h-9">
                Batal
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
