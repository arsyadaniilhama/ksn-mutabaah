"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  IconCalendarCheck as CalendarCheck,
  IconChartBar as ChartBar,
  IconHistory as History,
  IconId as IdIcon,
  IconLayoutDashboard as LayoutDashboard,
  IconLogout as Logout,
  IconShieldLock as ShieldLock,
  IconUsers as Users,
} from "@tabler/icons-react";
import { signOut, switchInstitusi } from "@/app/login/actions";
import Avatar from "@/components/Avatar";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import { SantriIcon, SantriwatiIcon } from "@/components/icons/InstitusiIcon";

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

function Brand({ institusi }: { institusi?: string | null }) {
  const pi = institusi === "PI IMSHUS";
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {pi ? (
        <SantriwatiIcon className="h-8 w-auto shrink-0 text-accent" />
      ) : (
        <SantriIcon className="size-8 shrink-0" />
      )}
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-ink">Mutabaah KSN</span>
        <span className="block text-[11px] text-faint">{institusi ?? "PA IMSHUS"}</span>
      </span>
    </Link>
  );
}

function Nav({
  onNavigate,
  santriLabel,
  isSuperadmin,
}: {
  onNavigate?: () => void;
  santriLabel: string;
  isSuperadmin: boolean;
}) {
  const groups = isSuperadmin
    ? [
        ...GROUPS,
        {
          label: "Sistem",
          items: [
            { href: "/pengguna", label: "Pengguna", icon: ShieldLock },
            { href: "/log", label: "Log Aktivitas", icon: History },
            { href: "/akun", label: "Akun Saya", icon: IdIcon },
          ],
        },
      ]
    : [
        ...GROUPS,
        {
          label: "Sistem",
          items: [{ href: "/akun", label: "Akun Saya", icon: IdIcon }],
        },
      ];
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-5">
      {groups.map((g) => (
        <div key={g.label}>
          <div className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
            {g.label}
          </div>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const itemLabel = item.href === "/santri" ? santriLabel : item.label;
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
                    {itemLabel}
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

function InstitusiSwitch({ institusi }: { institusi: string }) {
  return (
    <div className="mx-3 mb-1 rounded-lg border border-line bg-canvas p-1" role="group" aria-label="Pilih institusi">
      <div className="flex gap-1">
        {(["PA IMSHUS", "PI IMSHUS"] as const).map((opt) => {
          const active = opt === institusi;
          return (
            <form key={opt} action={switchInstitusi} className="flex-1">
              <input type="hidden" name="institusi" value={opt} />
              <button
                type="submit"
                aria-pressed={active}
                className={
                  "w-full rounded-md px-2 py-1.5 text-[11px] font-semibold transition " +
                  (active
                    ? "bg-accent text-accent-fg"
                    : "text-muted hover:bg-surface2 hover:text-ink")
                }
              >
                {opt === "PA IMSHUS" ? "Putra (PA)" : "Putri (PI)"}
              </button>
            </form>
          );
        })}
      </div>
    </div>
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
  isSuperadmin = false,
}: {
  children: React.ReactNode;
  email?: string | null;
  institusi?: string | null;
  isSuperadmin?: boolean;
}) {
  const pathname = usePathname();
  const isLogin = pathname.startsWith("/login");
  const santriLabel = institusi === "PI IMSHUS" ? "Santriwati" : "Santri";

  // ganti halaman: kembali ke atas agar transisi masuk terasa rapi
  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [pathname]);

  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-dvh">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Brand institusi={institusi} />
        </div>
        {isSuperadmin && <div className="pt-3"><InstitusiSwitch institusi={institusi ?? "PA IMSHUS"} /></div>}
        <Nav santriLabel={santriLabel} isSuperadmin={isSuperadmin} />
        <UserFooter email={email} institusi={institusi} />
      </aside>

      {/* Bottom nav mobile: menggantikan header hamburger + drawer */}
      <BottomNav email={email} institusi={institusi} isSuperadmin={isSuperadmin} />

      <div className="lg:pl-64">
        <main
          className={
            "mx-auto w-full px-4 pb-[calc(84px+env(safe-area-inset-bottom))] pt-6 lg:px-4 lg:pb-6 2xl:px-8 2xl:py-8 " +
            (pathname.startsWith("/input") ? "max-w-[1600px]" : "max-w-6xl")
          }
        >
          {/* key = pathname: konten masuk dengan fade-slide lembut tiap ganti halaman */}
          <div key={pathname} className="page-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
