// Ingest finished transcripts from knowledge/sources into Supabase.
//
//   npm run ingest            upload / refresh everything
//   npm run ingest -- --dry   show what would be uploaded, upload nothing
//
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
// Skips drafts ("IN PROGRESS ..."), raw transcripts ("Raw ..." folders) and
// non-teaching files (Instructions, Overview). No npm dependencies.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename, relative } from "node:path";
import { inflateRawSync } from "node:zlib";

const ROOT = new URL("..", import.meta.url).pathname;
const SOURCES = join(ROOT, "knowledge/sources");
const MANIFEST = JSON.parse(readFileSync(join(ROOT, "knowledge/manifest.json"), "utf8"));
const DRY = process.argv.includes("--dry");
const TS_CONFIG = { en: "english", es: "spanish", pt: "portuguese" };

// ---------- .docx -> paragraphs (minimal zip reader) ----------
export function readZipEntry(buf, name) {
  // Find End Of Central Directory record.
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("not a zip file");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const entry = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (entry === name) {
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(start, start + compSize);
      return method === 0 ? data : inflateRawSync(data);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`${name} not found`);
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decode(s) {
  return s
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ENTITIES[e])
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

export function docxParagraphs(path) {
  const xml = readZipEntry(readFileSync(path), "word/document.xml").toString("utf8");
  const paras = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [];
  return paras
    .map((p) =>
      decode(
        (p.match(/<w:t[^>]*>[^<]*<\/w:t>|<w:tab\/>|<w:br\/>/g) ?? [])
          .map((t) => (t.startsWith("<w:t") ? t.replace(/<[^>]+>/g, "") : " "))
          .join(""),
      )
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

// ---------- clean-up ----------
// Teachers are never named on the site, so speaker labels become "Teacher:".
// Stage directions such as [Laughter] are dropped; ">>" (auto-caption speaker
// change) usually marks a student, so it becomes "Student:".
const TEACHER_NAMES = (process.env.TEACHER_NAMES ?? "Kalden")
  .split(",")
  .map((n) => n.trim())
  .filter(Boolean);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LABEL = new RegExp(
  `(?:^|(?<=[\\s.!?]))(?:(?:Ven(?:erable)?\\.?|Geshe|Lama)\\s+)?(?:${TEACHER_NAMES.map(esc).join("|")})\\s*:`,
  "gi",
);

export function cleanTranscript(text) {
  return text
    .replace(/\[(?:laughter|laughs|laughing|clears throat|music|applause|inaudible|crosstalk|silence|pause)[^\]]*\]/gi, "")
    .replace(LABEL, "Teacher:")
    .replace(/(^|\s)>>\s*/g, "$1Student: ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ---------- chunking ----------
const TARGET_WORDS = 280;
const words = (s) => s.split(/\s+/).filter(Boolean).length;

// Break very long paragraphs into sentence groups so no chunk balloons.
function splitLong(p) {
  if (words(p) <= TARGET_WORDS) return [p];
  const sentences = p.match(/[^.!?]+[.!?]+["'”’)\]]*\s*|[^.!?]+$/g) ?? [p];
  const out = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && words(cur) + words(s) > TARGET_WORDS / 2) {
      out.push(cur.trim());
      cur = "";
    }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function chunkParagraphs(input) {
  const paras = input.flatMap(splitLong);
  const chunks = [];
  let cur = [];
  let n = 0;
  for (const p of paras) {
    cur.push(p);
    n += words(p);
    if (n >= TARGET_WORDS) {
      chunks.push(cur.join("\n"));
      // Overlap: carry the last paragraph into the next chunk for context.
      const last = cur[cur.length - 1];
      cur = words(last) < 120 ? [last] : [];
      n = cur.length ? words(last) : 0;
    }
  }
  if (cur.length && (chunks.length === 0 || n > 40)) chunks.push(cur.join("\n"));
  return chunks;
}

// ---------- metadata ----------
const slug = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function describe(title) {
  const key = title.toLowerCase().replace(/\s+/g, " ").trim();
  const seriesKey = Object.keys(MANIFEST.series).find((s) =>
    key.replace(/\btips for happy\b/, "tips for a happy").startsWith(s),
  );
  const series = seriesKey ? MANIFEST.series[seriesKey] : null;
  const part = Number(key.match(/(\d+)\s*$/)?.[1]) || null;
  const videoKey = seriesKey && part ? `${seriesKey} ${part}` : key;
  const language = series?.language ?? "en";
  return {
    series: seriesKey ?? null,
    part,
    language,
    ts_config: TS_CONFIG[language] ?? "simple",
    video_url: MANIFEST.videos[videoKey] ?? series?.playlistUrl ?? null,
  };
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (/^raw\b/i.test(name)) continue;
      yield* walk(p);
    } else yield p;
  }
}

export function collect() {
  const docs = [];
  for (const path of walk(SOURCES)) {
    const name = basename(path);
    if (!name.toLowerCase().endsWith(".docx") || name.startsWith("~$")) continue;
    if (/^in progress/i.test(name) || /^(instructions|overview)/i.test(name)) continue;
    const paras = docxParagraphs(path);
    if (paras.length === 0) continue;
    let title = paras[0];
    if (title.length > 120) title = name.replace(/\.docx$/i, "");
    let body = paras
      .slice(1)
      .filter((p) => !/edited transcript$/i.test(p))
      .map(cleanTranscript)
      .filter(Boolean);
    const meta = describe(title);
    const prettyTitle =
      meta.series && meta.part
        ? meta.series.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bFor A\b/, "for a") + ` ${meta.part}`
        : title;
    const source_id = slug(prettyTitle);
    const chunks = chunkParagraphs(body).map((content, i) => ({
      id: `${source_id}#${i}`,
      source_id,
      title: prettyTitle,
      chunk_index: i,
      content,
      ...meta,
    }));
    docs.push({ path: relative(ROOT, path), source_id, title: prettyTitle, words: words(body.join(" ")), chunks });
  }
  return docs;
}

// ---------- upload ----------
async function rest(method, path, body) {
  const url = `${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(url, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
}

async function main() {
  const docs = collect();
  if (docs.length === 0) {
    console.log("No finished transcripts found in knowledge/sources.");
    return;
  }
  for (const d of docs) {
    console.log(`${d.title}  —  ${d.words} words, ${d.chunks.length} chunks  (${d.path})`);
    console.log(`   link: ${d.chunks[0].video_url ?? "(none)"}`);
  }
  if (DRY) return console.log("\nDry run: nothing uploaded.");

  for (const v of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!process.env[v]) throw new Error(`${v} is missing. Add it to .env.local.`);
  }
  for (const d of docs) {
    await rest("DELETE", `teaching_chunks?source_id=eq.${encodeURIComponent(d.source_id)}`);
    await rest("POST", "teaching_chunks", d.chunks);
  }
  const total = docs.reduce((s, d) => s + d.chunks.length, 0);
  console.log(`\nUploaded ${total} chunks from ${docs.length} transcripts.`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((e) => {
    console.error(`\nIngest failed: ${e.message}`);
    if (/relation .*teaching_chunks.* does not exist|PGRST205/.test(e.message)) {
      console.error("Run supabase/schema.sql in the Supabase SQL Editor first.");
    }
    process.exit(1);
  });
}
