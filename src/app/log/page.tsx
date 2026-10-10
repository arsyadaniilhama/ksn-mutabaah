import { redirect } from "next/navigation";
import {
  IconCircleMinus as Minus,
  IconLogin2 as Login,
  IconUsers as Users,
} from "@tabler/icons-react";
import { getCurrentUser } from "@/lib/auth";
import {
  auditSummaryToday,
  auditTableExists,
  listAuditActors,
  listAuditLog,
  listSantri,
} from "@/lib/data";
import { todayISO } from "@/lib/dates";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import LogTable from "@/components/LogTable";
import SetupLogNotice from "@/components/SetupLogNotice";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log Aktivitas" };

const ACTION_VALUES = ["check", "uncheck", "set", "haid_on", "haid_off"];
const PAGE_SIZE = 40;

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{
    actor?: string;
    action?: string;
    santri?: string;
    from?: string;
    to?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const cu = await getCurrentUser();
  if (!cu) redirect("/login");
  if (!cu.isSuperadmin) redirect("/");

  // Bila migrasi 0007 belum dijalankan, tampilkan panduan singkat (bukan crash).
  if (!(await auditTableExists())) {
    return (
      <div>
        <PageHeader
          title="Log Aktivitas"
          description="Riwayat siapa mencentang / membatalkan mutabaah — khusus superadmin."
        />
        <SetupLogNotice />
      </div>
    );
  }

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(sp.from ?? "") ? sp.from : undefined;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(sp.to ?? "") ? sp.to : undefined;
  const actor = sp.actor?.trim() || undefined;
  const santriId = sp.santri?.trim() || undefined;
  const action = ACTION_VALUES.includes(sp.action ?? "") ? sp.action : undefined;
  const q = sp.q?.trim() || undefined;

  const [data, actors, santri, summary] = await Promise.all([
    listAuditLog(
      {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        actor,
        santriId,
        action,
        from,
        to,
        q,
      },
      undefined, // superadmin melihat seluruh institusi (PA & PI)
    ),
    listAuditActors(),
    listSantri(undefined, true, undefined),
    auditSummaryToday(todayISO()),
  ]);

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const santriOptions = santri.map((s) => ({
    id: s.id,
    nama: s.nama,
    kelas: s.kelas,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Aktivitas"
        description="Riwayat siapa mencentang / membatalkan mutabaah — hanya superadmin."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={Login}
          label="Centang Hari Ini"
          value={summary.check}
          sub="aksi menandai amalan terisi"
          tone="accent"
        />
        <KpiCard
          icon={Minus}
          label="Batal Centang Hari Ini"
          value={summary.uncheck}
          sub="aksi membatalkan centang"
          tone={summary.uncheck > 0 ? "danger" : "default"}
        />
        <KpiCard
          icon={Users}
          label="Akun Aktif Hari Ini"
          value={summary.akunAktif}
          sub="akun berbeda yang mengisi"
        />
      </div>

      <LogTable
        rows={data.rows}
        total={data.total}
        page={page}
        totalPages={totalPages}
        actors={actors}
        santriOptions={santriOptions}
        filter={{ actor: actor ?? "", action: action ?? "", santri: santriId ?? "", from: from ?? "", to: to ?? "", q: q ?? "" }}
      />
    </div>
  );
}
