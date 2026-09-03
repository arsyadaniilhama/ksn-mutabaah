// Importer seed -> Supabase.
// Default: HANYA master kategori (19) + roster santri.md (santri).
//   node --env-file=.env.local scripts/import-excel.mjs
// Opsional ikutkan entri dari Excel (sheet "Data Mutabaah"):
//   node --env-file=.env.local scripts/import-excel.mjs --with-entries
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YEAR = Number(process.env.SEED_DEFAULT_YEAR || 2026);
if (!URL_ || !KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY (via --env-file=.env.local)");
  process.exit(1);
}

const WITH_ENTRIES = process.argv.includes("--with-entries");
const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const SANTRI_MD = positional[0] || path.join(ROOT, "..", "santri.md");
const XLSX_PATH = positional[1] || path.join(ROOT, "..", "Mutabaah KSN.xlsx");

const AMALAN = [
  [1, "Sholat Tahajjud", "Tulis Rakaat", "rakaat"],
  [2, "Sholat Witir", "Tulis Rakaat", "rakaat"],
  [3, "Sholat Shubuh", "Datang sebelum adzan", "binary"],
  [4, "Dzikir Sholat Ba'da Shubuh", null, "binary"],
  [5, "Infaq Shubuh", null, "binary"],
  [6, "Dzikir Pagi", null, "binary"],
  [7, "Sholat Dhuha", "Tulis Rakaat", "rakaat"],
  [8, "Sholat Zuhur", "Datang sebelum adzan", "binary"],
  [9, "Dzikir Sholat Ba'da Zuhur", null, "binary"],
  [10, "Sholat 'Asar", "Datang sebelum adzan", "binary"],
  [11, "Dzikir Sholat Ba'da 'Asar", null, "binary"],
  [12, "Dzikir Petang", null, "binary"],
  [13, "Sholat Maghrib", "Datang sebelum adzan", "binary"],
  [14, "Dzikir Sholat Ba'da Maghrib", null, "binary"],
  [15, "Sholat Isya'", "Datang sebelum adzan", "binary"],
  [16, "Dzikir Sholat Ba'da Isya'", null, "binary"],
  [17, "Sholat Rawatib", "Tulis Rakaat", "rakaat"],
  [18, "Puasa", null, "binary"],
  [19, "Sunnah Sebelum Tidur", "3 Qul dan Doa Sebelum Tidur", "binary"],
];
const RAKAAT = new Set([1, 2, 7, 17]);

const BULAN = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6, juli: 7,
  agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
  january: 1, february: 2, march: 3, may: 5, june: 6, july: 7, august: 8,
  october: 10, december: 12,
};

const norm = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
const pad = (n) => String(n).padStart(2, "0");

/**
 * Alias nama: ejaan di Excel -> ejaan resmi di roster (santri.md).
 * Kunci & nilai sudah lower-case/ternormalisasi. Tambah bila ada beda ejaan baru.
 */
const NAME_ALIAS = {
  "majdan abqoriy": "majdan abqory",
};

function parseSantriMd(file) {
  const md = fs.readFileSync(file, "utf8");
  let kelas = null;
  const out = [];
  for (const line of md.split(/\r?\n/)) {
    const h = line.match(/^##\s+(Kelas\s+\d)/);
    if (h) { kelas = h[1]; continue; }
    const m = line.match(/^\|\s*\d+\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|/);
    if (m && kelas) out.push({ nis: Number(m[1]), nama: m[2].trim(), kelas });
  }
  return out;
}

async function main() {
  const supabase = createClient(URL_, KEY, { auth: { persistSession: false } });

  // 1. kategori
  const { error: e1 } = await supabase.from("amalan_kategori").upsert(
    AMALAN.map(([id, nama, ket, vt]) => ({ id, nama, keterangan: ket, value_type: vt, urut: id })),
    { onConflict: "id" },
  );
  if (e1) throw new Error("kategori: " + e1.message);
  console.log(`✓ ${AMALAN.length} kategori amalan`);

  // 2. santri
  const santri = parseSantriMd(SANTRI_MD);
  const { error: e2 } = await supabase.from("santri").upsert(
    santri.map((s) => ({ nis: s.nis, nama: s.nama, kelas: s.kelas })),
    { onConflict: "nis" },
  );
  if (e2) throw new Error("santri: " + e2.message);
  const { data: srows } = await supabase.from("santri").select("id,nama");
  const byName = new Map((srows ?? []).map((r) => [norm(r.nama), r.id]));
  console.log(`✓ ${santri.length} santri (roster: ${SANTRI_MD})`);

  // 3. entri dari Excel (opsional)
  if (!WITH_ENTRIES) {
    console.log("• Lewati entri Excel (default roster-only). Tambahkan --with-entries untuk mengimpor.");
    console.log("Selesai.");
    return;
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);
  const ws = wb.getWorksheet("Data Mutabaah");
  if (!ws) throw new Error("Sheet 'Data Mutabaah' tidak ditemukan");

  const entries = [];
  const mismatch = new Set();
  const flagged = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const nama = row.getCell(1).value;
    const bulan = row.getCell(2).value;
    const amal = Number(row.getCell(3).value);
    const tgl = Number(row.getCell(4).value);
    const nilaiRaw = row.getCell(5).value;
    if (!nama || !amal || !tgl) return;
    const key = norm(nama);
    const sid = byName.get(NAME_ALIAS[key] ?? key);
    if (!sid) { mismatch.add(String(nama)); return; }
    const month = BULAN[norm(bulan)];
    if (!month) { flagged.push(`bulan tak dikenal: ${bulan}`); return; }
    const entry_date = `${YEAR}-${pad(month)}-${pad(tgl)}`;
    const nilai = String(nilaiRaw ?? "").trim();
    let status = null, rakaat = null;
    const firstNum = (nilai.match(/\d+/) ?? [])[0];
    if (nilai.toUpperCase() === "V") status = "done";
    else if (nilai.toUpperCase() === "X") status = "miss";
    else if (firstNum != null) {
      const v = Number(firstNum);
      if (RAKAAT.has(amal)) { rakaat = v; status = v > 0 ? "done" : null; }
      else status = "done";
      if (!/^\d+$/.test(nilai))
        flagged.push(`dinormalisasi '${nilai}' -> ${v} (${nama}, amal ${amal}, tgl ${tgl})`);
    } else if (nilai) {
      flagged.push(`nilai tak wajar '${nilai}' (${nama}, amal ${amal}, tgl ${tgl})`);
      return;
    } else return;
    entries.push({ santri_id: sid, amalan_id: amal, entry_date, status, rakaat });
  });

  for (let i = 0; i < entries.length; i += 200) {
    const { error: e3 } = await supabase
      .from("mutabaah_entries")
      .upsert(entries.slice(i, i + 200), { onConflict: "santri_id,amalan_id,entry_date" });
    if (e3) throw new Error("entries: " + e3.message);
  }
  console.log(`✓ ${entries.length} entri mutabaah (sumber: ${path.basename(XLSX_PATH)})`);
  if (mismatch.size) console.log(`⚠ ${mismatch.size} nama tak cocok roster:`, [...mismatch].join(", "));
  if (flagged.length) console.log(`⚠ ${flagged.length} nilai di-flag:`, flagged.slice(0, 10).join(" | "));
  console.log("Selesai.");
}

main().catch((e) => { console.error("GAGAL:", e.message); process.exit(1); });
