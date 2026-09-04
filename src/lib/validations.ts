import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus format yyyy-mm-dd");

export const upsertEntrySchema = z.object({
  santri_id: z.string().uuid(),
  amalan_id: z.coerce.number().int().min(1).max(19),
  entry_date: isoDate,
  status: z
    .enum(["done", "miss", "tepat", "masbuq", "sendiri"])
    .nullable()
    .optional(),
  rakaat: z.coerce.number().int().min(0).max(100).nullable().optional(),
  catatan: z.string().max(500).nullable().optional(),
});

export const bulkUpsertSchema = z.object({
  entries: z.array(upsertEntrySchema).min(1).max(500),
});

export type UpsertEntryInput = z.infer<typeof upsertEntrySchema>;

const kelasEnum = z.enum(["Kelas 1", "Kelas 2", "Kelas 3"]);

export const santriCreateSchema = z.object({
  nis: z.coerce.number().int().min(1).max(9999),
  nama: z.string().trim().min(3, "Nama minimal 3 karakter").max(60),
  kelas: kelasEnum,
});

export const santriUpdateSchema = z
  .object({
    nis: z.coerce.number().int().min(1).max(9999),
    nama: z.string().trim().min(3, "Nama minimal 3 karakter").max(60),
    kelas: kelasEnum,
    aktif: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Tidak ada perubahan" });
