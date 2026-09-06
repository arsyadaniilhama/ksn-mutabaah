"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconCalendarCheck as CalendarCheck,
  IconChartBar as ChartBar,
  IconLayoutDashboard as LayoutDashboard,
  IconLogout as Logout,
  IconMenu2 as Menu2,
  IconUsers as Users,
  IconX as X,
} from "@tabler/icons-react";
import { signOut } from "@/app/login/actions";
import Avatar from "@/components/Avatar";
import ThemeToggle from "@/components/ThemeToggle";

const GROUPS: {
  label: string;
  items: { href: string; label: string; icon: React.ElementType }[];
}[] = [
  { label: "Ringkasan", items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Operasional",
    items: [{ href: "/input", label: "Input Harian", icon: CalendarCheck }],
  },
  {
    label: "Data",
    items: [
      { href: "/santri", label: "Santri", icon: Users },
      { href: "/laporan", label: "Laporan", icon: ChartBar },
    ],
  },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
        K
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-ink">Mutabaah KSN</span>
        <span className="block text-[11px] text-faint">PA IMSHUS</span>
      </span>
    </Link>
  );
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <div className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
            {g.label}
          </div>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={
                      "sidebar-link " +
                      (active
                        ? "bg-accent-soft text-accent"
                        : "text-muted hover:bg-surface2 hover:text-ink")
                    }
                  >
                    <Icon size={19} stroke={active ? 2.25 : 1.75} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserFooter({ email, institusi }: { email?: string | null; institusi?: string | null }) {
  return (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
        <Avatar name={email ?? "Admin"} size="sm" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-xs font-medium text-ink">
            {email ?? "Musyrif"}
          </div>
          <div className="text-[11px] text-faint">{institusi ?? "Musyrif / Admin"}</div>
        </div>
        <ThemeToggle />
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Keluar"
            className="btn-ghost size-9 p-0"
          >
            <Logout size={18} stroke={1.75} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Shell({
  children,
  email,
  institusi,
}: {
  children: React.ReactNode;
  email?: string | null;
  institusi?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isLogin = pathname.startsWith("/login");

  useEffect(() => setOpen(false), [pathname]);

  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-dvh">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Brand />
        </div>
        <Nav />
        <UserFooter email={email} institusi={institusi} />
      </aside>

      {/* Header mobile */}
      <header className="no-print sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            aria-label="Buka menu"
            onClick={() => setOpen(true)}
            className="btn-ghost size-9 p-0"
          >
            <Menu2 size={20} stroke={1.75} />
          </button>
        </div>
      </header>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal>
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line bg-surface shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Brand />
              <button
                aria-label="Tutup menu"
                onClick={() => setOpen(false)}
                className="btn-ghost size-8 p-0"
              >
                <X size={18} />
              </button>
            </div>
            <Nav onNavigate={() => setOpen(false)} />
            <UserFooter email={email} institusi={institusi} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <main
          className={
            "mx-auto w-full px-4 py-6 lg:px-8 lg:py-8 " +
            (pathname.startsWith("/input") ? "max-w-[1600px]" : "max-w-6xl")
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
