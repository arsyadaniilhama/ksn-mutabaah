import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import UserManage from "@/components/UserManage";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pengguna" };

export default async function PenggunaPage() {
  const cu = await getCurrentUser();
  if (!cu) redirect("/login");
  if (!cu.isSuperadmin) redirect("/");

  return (
    <div>
      <PageHeader
        title="Manajemen Pengguna"
        description="Tambah akun, tetapkan/reset password, dan lihat kapan password terakhir diganti. Password tersimpan terenkripsi — yang tampil hanya catatan waktunya."
      />
      <UserManage meEmail={cu.email} />
    </div>
  );
}
