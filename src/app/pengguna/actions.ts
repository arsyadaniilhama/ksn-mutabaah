"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, INSTITUSI_VALUES } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface ManageState {
  ok?: string;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function nowIso() {
  return new Date().toISOString();
}

/** Hanya superadmin yang boleh mengelola akun orang lain. */
async function requireSuperadmin() {
  const cu = await getCurrentUser();
  if (!cu) return { error: "Sesi berakhir, silakan login lagi." as const, cu: null };
  if (!cu.isSuperadmin) return { error: "Hanya superadmin yang dapat mengelola pengguna." as const, cu: null };
  return { error: null, cu };
}

/** Tambah pengguna baru (email + password awal + institusi + role). */
export async function createUser(_prev: ManageState, formData: FormData): Promise<ManageState> {
  const gate = await requireSuperadmin();
  if (gate.error) return { error: gate.error };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nama = String(formData.get("nama") ?? "").trim();
  const institusi = String(formData.get("institusi") ?? "PA IMSHUS");
  const role = String(formData.get("role") ?? "admin");

  if (!EMAIL_RE.test(email)) return { error: "Format email tidak valid." };
  if (password.length < 6) return { error: "Password minimal 6 karakter." };
  if (!(INSTITUSI_VALUES as readonly string[]).includes(institusi))
    return { error: "Institusi tidak valid." };
  if (!["admin", "superadmin"].includes(role)) return { error: "Role tidak valid." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nama: nama || null,
      password_changed_at: nowIso(),
      password_changed_by: gate.cu!.email, // ditetapkan saat pembuatan oleh admin
    },
  });
  if (error || !data.user) {
    return { error: /already/i.test(error?.message ?? "") ? "Email sudah terdaftar." : `Gagal membuat pengguna: ${error?.message ?? "tidak diketahui"}` };
  }

  // Buat baris profil (role + institusi) agar aplikasi mengenalinya.
  const { error: pErr } = await admin.from("profiles").upsert(
    { id: data.user.id, role, institusi, nama: nama || null },
    { onConflict: "id" },
  );
  if (pErr) return { error: "Pengguna dibuat, tapi profil gagal disimpan: " + pErr.message };

  revalidatePath("/pengguna");
  return { ok: `Pengguna ${email} berhasil dibuat.` };
}

/** Reset password milik user tertentu (khusus superadmin). */
export async function resetUserPassword(_prev: ManageState, formData: FormData): Promise<ManageState> {
  const gate = await requireSuperadmin();
  if (gate.error) return { error: gate.error };

  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!userId) return { error: "ID pengguna tidak valid." };
  if (password.length < 6) return { error: "Password minimal 6 karakter." };

  const admin = createAdminClient();
  // user_metadata pada admin update REPLASE total -> gabung dulu dengan yang lama
  const { data: existing } = await admin.auth.admin.getUserById(userId);
  const meta = {
    ...((existing?.user?.user_metadata ?? {}) as Record<string, unknown>),
    password_changed_at: nowIso(),
    password_changed_by: gate.cu!.email,
  };
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
    user_metadata: meta,
  });
  if (error) return { error: `Gagal mengganti password: ${error.message}` };

  revalidatePath("/pengguna");
  return { ok: "Password berhasil direset. Sesi login pengguna itu otomatis keluar." };
}

/** Hapus pengguna (khusus superadmin). Tidak bisa menghapus diri sendiri atau superadmin terakhir. */
export async function deleteUser(_prev: ManageState, formData: FormData): Promise<ManageState> {
  const gate = await requireSuperadmin();
  if (gate.error) return { error: gate.error };

  const userId = String(formData.get("userId") ?? "");
  const emailLabel = String(formData.get("email") ?? "");
  if (!userId) return { error: "ID pengguna tidak valid." };
  if (userId === gate.cu!.id) return { error: "Tidak bisa menghapus akun Anda sendiri." };

  const admin = createAdminClient();

  // Jangan sampai tidak ada superadmin yang tersisa.
  const { data: target } = await admin.auth.admin.getUserById(userId);
  if (!target?.user) return { error: "Pengguna tidak ditemukan." };
  const { data: prof } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (prof?.role === "superadmin") {
    const { data: supers } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "superadmin");
    if ((supers?.length ?? 0) <= 1)
      return { error: "Tidak bisa menghapus satu-satunya superadmin." };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: `Gagal menghapus: ${error.message}` };

  // Bersihkan baris profil (bila cascade RLS tidak menanganinya).
  await admin.from("profiles").delete().eq("id", userId);

  revalidatePath("/pengguna");
  return { ok: `Pengguna ${emailLabel || userId} berhasil dihapus.` };
}

/** Ganti password sendiri — semua user punya hak ini. */
export async function changeOwnPassword(_prev: ManageState, formData: FormData): Promise<ManageState> {
  const cu = await getCurrentUser();
  if (!cu) return { error: "Sesi berakhir, silakan login lagi." };

  const oldPassword = String(formData.get("oldPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!oldPassword) return { error: "Isi password lama." };
  if (newPassword.length < 6) return { error: "Password baru minimal 6 karakter." };
  if (newPassword !== confirm) return { error: "Konfirmasi password baru tidak sama." };
  if (newPassword === oldPassword) return { error: "Password baru harus berbeda dari yang lama." };

  // Verifikasi password lama dengan sesi TERPISAH (tanpa mengganggu sesi aktif).
  const { createClient: createRaw } = await import("@supabase/supabase-js");
  const probe = createRaw(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error: verifyErr } = await probe.auth.signInWithPassword({
    email: cu.email,
    password: oldPassword,
  });
  if (verifyErr) return { error: "Password lama salah." };

  // Ganti lewat sesi aktif (server component client) + catat audit di metadata.
  // `data` pada updateUser mengganti user_metadata -> gabung dengan yang lama.
  const supabase = await createClient();
  const {
    data: { user: au },
  } = await supabase.auth.getUser();
  const mergedMeta = {
    ...((au?.user_metadata ?? {}) as Record<string, unknown>),
    password_changed_at: nowIso(),
    password_changed_by: cu.email,
  };
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
    data: mergedMeta,
  });
  if (error) return { error: `Gagal mengganti password: ${error.message}` };

  revalidatePath("/pengguna");
  return { ok: "Password berhasil diganti." };
}
