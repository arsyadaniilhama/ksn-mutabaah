import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

/** Daftar seluruh akun + profil (khusus superadmin). */
export async function GET() {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!cu.isSuperadmin)
    return NextResponse.json({ error: "Hanya superadmin yang dapat melihat daftar pengguna." }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (data.users ?? []).map((u) => u.id);
  let profileMap = new Map<string, { role: string; institusi: string; nama: string | null }>();
  if (ids.length > 0) {
    const { data: profiles } = await admin.from("profiles").select("id, role, institusi, nama").in("id", ids);
    for (const p of profiles ?? []) {
      profileMap.set(p.id as string, {
        role: (p.role as string) ?? "admin",
        institusi: (p.institusi as string) ?? "PA IMSHUS",
        nama: (p.nama as string) ?? null,
      });
    }
  }

  const users = (data.users ?? [])
    .map((u) => {
      const md = (u.user_metadata ?? {}) as Record<string, unknown>;
      const p = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        nama: (md.nama as string) ?? p?.nama ?? null,
        role: p?.role ?? "admin",
        institusi: p?.institusi ?? "PA IMSHUS",
        createdAt: u.created_at ?? "",
        lastSignIn: u.last_sign_in_at ?? null,
        passwordChangedAt: (md.password_changed_at as string) ?? null,
        passwordChangedBy: (md.password_changed_by as string) ?? null,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email));

  return NextResponse.json({ users, me: { id: cu.id, email: cu.email } });
}
