import { NextResponse } from "next/server";
import { updateSantri } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { santriUpdateSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "body tidak valid" }, { status: 400 });
  }
  const parsed = santriUpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  try {
    const santri = await updateSantri(id, parsed.data, cu.institusi);
    return NextResponse.json({ santri });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "gagal menyimpan";
    const status = msg.includes("Akses ditolak") ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
