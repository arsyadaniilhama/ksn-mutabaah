import { NextResponse } from "next/server";
import { getHaidDates, listSantri, setHaid } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

async function guardPi(santriId: string): Promise<{ error?: string; status?: number }> {
  const cu = await getCurrentUser();
  if (!cu) return { error: "unauthorized", status: 401 };
  if (cu.institusi !== "PI IMSHUS")
    return { error: "fitur haid hanya untuk PI IMSHUS", status: 403 };
  const ids = new Set((await listSantri(undefined, true, "PI IMSHUS")).map((s) => s.id));
  if (!ids.has(santriId)) return { error: "forbidden", status: 403 };
  return {};
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const santriId = searchParams.get("santri_id") ?? "";
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  if (!santriId || !year || !month)
    return NextResponse.json({ error: "santri_id, year, month wajib" }, { status: 400 });

  const g = await guardPi(santriId);
  if (g.error) return NextResponse.json({ error: g.error }, { status: g.status ?? 400 });

  const dates = await getHaidDates(santriId, year, month);
  return NextResponse.json({ dates });
}

const bodySchema = z.object({
  santri_id: z.string().uuid(),
  date: isoDate,
  on: z.boolean(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "body tidak valid" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "input tidak valid" }, { status: 400 });

  const g = await guardPi(parsed.data.santri_id);
  if (g.error) return NextResponse.json({ error: g.error }, { status: g.status ?? 400 });

  try {
    await setHaid(parsed.data.santri_id, parsed.data.date, parsed.data.on);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "gagal" },
      { status: 500 },
    );
  }
}
