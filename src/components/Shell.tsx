"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/input", label: "Input Harian" },
  { href: "/santri", label: "Santri" },
  { href: "/laporan", label: "Laporan" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname.startsWith("/login");

  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-sm font-bold text-brand-700">
            Mutabaah KSN
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "rounded-lg px-3 py-1.5 font-medium transition " +
                    (active
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
            <form
              action={signOut}
              className="ml-2"
            >
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-100"
              >
                Keluar
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
