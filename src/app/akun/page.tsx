import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Akun" };

export default async function AkunPage() {
  const cu = await getCurrentUser();
  if (!cu) redirect("/login");

  return (
    <div>
      <PageHeader
        title="Akun Saya"
        description="Ganti password akun Anda. Setelah diganti, login berikutnya memakai password yang baru."
      />
      <ChangePasswordForm email={cu.email} role={cu.role} institusi={cu.institusi} />
    </div>
  );
}
