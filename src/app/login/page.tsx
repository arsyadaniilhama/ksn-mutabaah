"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "./actions";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-canvas p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-accent-soft to-transparent"
      />
      <form
        action={formAction}
        className="card relative w-full max-w-sm space-y-5 p-7"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-accent text-lg font-bold text-accent-fg">
            K
          </span>
          <div>
            <h1 className="text-base font-semibold text-ink">Mutabaah KSN</h1>
            <p className="mt-0.5 text-sm text-muted">
              Masuk sebagai Musyrif / Admin
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="input"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
          />
        </div>

        {state.error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full"
        >
          {pending ? "Memproses..." : "Masuk"}
        </button>

        <p className="text-center text-[11px] text-faint">
          PA IMSHUS · Pencatatan mutabaah harian santri
        </p>
      </form>
    </main>
  );
}
