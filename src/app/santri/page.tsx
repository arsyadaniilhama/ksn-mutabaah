import { listSantri } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import SantriManage from "@/components/SantriManage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Santri" };

export default async function SantriPage() {
  const user = await getCurrentUser();
  const institusi = user?.institusi ?? "PA IMSHUS";
  const label = institusi === "PI IMSHUS" ? "Santriwati" : "Santri";
  const santri = await listSantri(undefined, true, institusi);
  const aktif = santri.filter((s) => s.aktif).length;

  return (
    <div>
      <PageHeader
        title={`Daftar ${label}`}
        description={`${institusi} · ${aktif} aktif · ${santri.length - aktif} nonaktif`}
      />
      <SantriManage santri={santri} institusi={institusi} label={label} />
    </div>
  );
}
