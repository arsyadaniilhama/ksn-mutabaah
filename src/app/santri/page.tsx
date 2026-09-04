import { listSantri } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import SantriManage from "@/components/SantriManage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Santri" };

export default async function SantriPage() {
  const santri = await listSantri(undefined, true);
  const aktif = santri.filter((s) => s.aktif).length;

  return (
    <div>
      <PageHeader
        title="Daftar Santri"
        description={`${aktif} santri aktif · ${santri.length - aktif} nonaktif`}
      />
      <SantriManage santri={santri} />
    </div>
  );
}
