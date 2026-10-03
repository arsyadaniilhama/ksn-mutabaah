"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  IconChartBar as ChartBar,
  IconDots as Dots,
  IconId as IdIcon,
  IconLayoutDashboard as LayoutDashboard,
  IconLogout as Logout,
  IconMoon as Moon,
  IconPencil as Pencil,
  IconShieldLock as ShieldLock,
  IconSun as Sun,
  IconUsers as Users,
  IconX as X,
} from "@tabler/icons-react";
import { signOut, switchInstitusi } from "@/app/login/actions";
import Avatar from "@/components/Avatar";

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Tab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="group flex flex-col items-center gap-1 pb-1 pt-1.5 text-[10.5px] font-semibold outline-none motion-reduce:transition-none"
    >
      <span
        className={
          "grid h-8 w-16 place-items-center rounded-full transition-colors duration-300 motion-reduce:transition-none " +
          (active ? "bg-accent-soft text-accent" : "text-faint group-hover:text-muted")
        }
      >
        <Icon size={21} stroke={active ? 2.1 : 1.7} className="transition-transform duration-200 motion-reduce:transition-none group-active:scale-90" />
      </span>
      <span className={active ? "text-accent" : "text-faint"}>{label}</span>
    </Link>
  );
}

export default function BottomNav({
  email,
  institusi,
  isSuperadmin,
}: {
  email?: string | null;
  institusi?: string | null;
  isSuperadmin?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const santriLabel = institusi === "PI IMSHUS" ? "Santriwati" : "Santri";

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  // kunci scroll saat sheet terbuka
  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevBody;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const dark = mounted && resolvedTheme === "dark";

  // aksi server + tutup sheet agar tidak menggantung setelah pindah institusi
  const switchInst = (formData: FormData) => {
    setOpen(false);
    switchInstitusi(formData);
  };

  return (
    <>
      {/* ===== Bilah navigasi bawah (hanya layar < lg) ===== */}
      <nav
        aria-label="Navigasi utama"
        className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-end gap-0 border-t border-line/80 bg-surface/85 px-2 pb-[max(6px,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl saturate-150 motion-reduce:backdrop-blur-none lg:hidden"
        style={{ boxShadow: "0 -12px 30px -18px rgb(24 24 27 / 0.25)" }}
      >
        <Tab href="/" label="Dashboard" icon={LayoutDashboard} active={isActivePath(pathname, "/") && pathname === "/"} />
        <Tab href="/santri" label={santriLabel} icon={Users} active={isActivePath(pathname, "/santri")} />

        {/* FAB tengah — aksi utama */}
        <Link
          href="/input"
          aria-label="Input Harian"
          aria-current={isActivePath(pathname, "/input") ? "page" : undefined}
          className="flex flex-col items-center gap-1 outline-none"
        >
          <span
            className={
              "-mt-6 grid size-[52px] place-items-center rounded-[17px] border-4 border-canvas transition-transform duration-200 active:scale-90 motion-reduce:transition-none " +
              (isActivePath(pathname, "/input")
                ? "bg-accent-hover text-white shadow-[0_10px_22px_-8px_rgb(5_150_105_/_0.65)]"
                : "bg-accent text-white shadow-[0_10px_22px_-8px_rgb(5_150_105_/_0.65)]")
            }
          >
            <Pencil size={22} stroke={1.9} />
          </span>
          <span className={"text-[10.5px] font-semibold " + (isActivePath(pathname, "/input") ? "text-accent" : "text-muted")}>
            Input
          </span>
        </Link>

        <Tab href="/laporan" label="Laporan" icon={ChartBar} active={isActivePath(pathname, "/laporan")} />

        {/* Lainnya — membuka sheet */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="group flex flex-col items-center gap-1 pb-1 pt-1.5 text-[10.5px] font-semibold text-faint outline-none motion-reduce:transition-none"
        >
          <span className="relative grid h-8 w-16 place-items-center rounded-full transition-colors duration-300 group-hover:bg-surface2 motion-reduce:transition-none">
            <Dots size={21} stroke={1.7} className="transition-transform duration-200 group-active:scale-90 motion-reduce:transition-none" />
            {isSuperadmin && (
              <span className="absolute right-3 top-0 grid h-4 min-w-4 place-items-center rounded-full border-2 border-surface bg-danger px-1 text-[9px] font-bold leading-none text-white">
                S
              </span>
            )}
          </span>
          <span>Lainnya</span>
        </button>
      </nav>

      {/* ===== Sheet "Lainnya" ===== */}
      <div
        className={
          "no-print fixed inset-0 z-50 lg:hidden transition-[visibility] duration-[400ms] " +
          (open ? "visible" : "invisible pointer-events-none")
        }
        role="dialog"
        aria-modal="true"
        aria-label="Menu lainnya"
        aria-hidden={!open}
      >
        <div
          className={"absolute inset-0 touch-none bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none " + (open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <div
          className={
            "absolute inset-x-0 bottom-0 mx-auto max-w-lg rounded-t-2xl border border-line bg-surface px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 shadow-2xl transition-transform duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none " +
            (open ? "translate-y-0" : "translate-y-[110%]")
          }
        >
          <div className="mx-auto mb-3 mt-1 h-1 w-10 rounded-full bg-line-strong" />

          {/* identitas user */}
          <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-line bg-canvas px-3 py-2.5">
            <Avatar name={email ?? "Admin"} size="sm" />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium text-ink">{email ?? "Musyrif"}</div>
              <div className="text-[11px] text-faint">
                {institusi ?? "PA IMSHUS"}{isSuperadmin ? " · Superadmin" : ""}
              </div>
            </div>
            <button
              type="button"
              aria-label="Ganti tema"
              onClick={() => setTheme(dark ? "light" : "dark")}
              className="btn-ghost size-9 shrink-0 p-0"
            >
              {dark ? <Sun size={18} stroke={1.75} /> : <Moon size={18} stroke={1.75} />}
            </button>
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setOpen(false)}
              className="btn-ghost size-9 shrink-0 p-0"
            >
              <X size={18} stroke={1.75} />
            </button>
          </div>

          {isSuperadmin && (
            <div className="mb-2 rounded-xl border border-line bg-canvas p-1" role="group" aria-label="Pilih institusi">
              <div className="flex gap-1">
                {(["PA IMSHUS", "PI IMSHUS"] as const).map((opt) => {
                  const active = opt === institusi;
                  return (
                    <form key={opt} action={switchInst} className="flex-1">
                      <input type="hidden" name="institusi" value={opt} />
                      <button
                        type="submit"
                        aria-pressed={active}
                        className={
                          "w-full rounded-lg px-2 py-2 text-xs font-semibold transition motion-reduce:transition-none " +
                          (active ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface2 hover:text-ink")
                        }
                      >
                        {opt === "PA IMSHUS" ? "Putra (PA)" : "Putri (PI)"}
                      </button>
                    </form>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-1.5 mt-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
            Akun
          </div>
          <Link href="/akun" className="flex items-center gap-3 rounded-xl px-2.5 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface2 motion-reduce:transition-none">
            <IdIcon size={20} stroke={1.75} className="text-muted" />
            Akun Saya — Ganti Password
          </Link>
          {isSuperadmin && (
            <Link href="/pengguna" className="flex items-center gap-3 rounded-xl px-2.5 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface2 motion-reduce:transition-none">
              <ShieldLock size={20} stroke={1.75} className="text-muted" />
              Pengguna
              <span className="chip ml-auto bg-surface2 text-muted">superadmin</span>
            </Link>
          )}

          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft motion-reduce:transition-none"
            >
              <Logout size={20} stroke={1.75} />
              Keluar
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
