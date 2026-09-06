import { NextResponse } from "next/server";
import { getDayValues, listSantri, upsertEntries } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { bulkUpsertSchema } from "@/lib/validations";

async function allowedSantriIds(institusi: string): Promise<Set<string>> {
  const santri = await listSantri(undefined, true, institusi);
  return new Set(santri.map((s) => s.id));
}

export async function GET(request: Request) {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const santriId = searchParams.get("santri_id");
  const date = searchParams.get("date");
  if (!santriId || !date)
    return NextResponse.json({ error: "santri_id & date wajib" }, { status: 400 });

  const ids = await allowedSantriIds(cu.institusi);
  if (!ids.has(santriId))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const values = await getDayValues(santriId, date);
  return NextResponse.json({ values });
}

export async function POST(request: Request) {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "body tidak valid" }, { status: 400 });
  }

  const parsed = bulkUpsertSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const ids = await allowedSantriIds(cu.institusi);
  if (parsed.data.entries.some((e) => !ids.has(e.santri_id)))
    return NextResponse.json(
      { error: "Akses ditolak: santri bukan dari institusi Anda." },
      { status: 403 },
    );

  try {
    await upsertEntries(parsed.data.entries);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "gagal menyimpan" },
      { status: 500 },
    );
  }
}
