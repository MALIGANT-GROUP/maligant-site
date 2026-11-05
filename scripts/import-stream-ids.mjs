// Fills in streamId for every entry in videos.json, two ways:
//   node scripts/import-stream-ids.mjs                -> reads your Cloudflare Stream library (needs CF_ACCOUNT_ID + CF_API_TOKEN)
//                                                        and matches each video by its name, e.g. "bts-blulyt.mp4"
//   node scripts/import-stream-ids.mjs video-ids.csv  -> reads a CSV with columns: name,streamId
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, "videos.json");
const cfg = JSON.parse(readFileSync(file, "utf8"));
const okId = id => /^[0-9a-f]{32}$/i.test(String(id || ""));
const key = s => basename(String(s || "")).replace(/\.(mp4|mov|m4v)$/i, "").trim().toLowerCase();
const pairs = new Map();

if (process.argv[2]) {
  for (const line of readFileSync(process.argv[2], "utf8").split(/\r?\n/).slice(1)) {
    const [name, id] = line.split(",").map(s => (s || "").trim());
    if (name && okId(id)) pairs.set(key(name), id);
  }
} else {
  const { CF_ACCOUNT_ID: acc, CF_API_TOKEN: tok } = process.env;
  if (!acc || !tok) { console.error("Set CF_ACCOUNT_ID and CF_API_TOKEN, or pass a CSV file."); process.exit(1); }
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acc}/stream`, { headers: { Authorization: `Bearer ${tok}` } });
  const j = await r.json();
  if (!j.success) { console.error(JSON.stringify(j.errors)); process.exit(1); }
  for (const v of j.result) {
    if (!v.readyToStream) continue;
    pairs.set(key(v.meta && v.meta.name), v.uid);
    if (!cfg.customerCode && v.playback && v.playback.hls) {
      const m = /customer-([a-z0-9]+)\.cloudflarestream\.com/i.exec(v.playback.hls);
      if (m) cfg.customerCode = m[1];
    }
  }
}
let n = 0;
for (const [k, v] of Object.entries(cfg.videos)) {
  const id = pairs.get(k.toLowerCase()) || pairs.get(key(v.file));
  if (id && v.streamId !== id) { v.streamId = id; n++; }
}
writeFileSync(file, JSON.stringify(cfg, null, 1) + "\n");
const left = Object.entries(cfg.videos).filter(([, v]) => v.onSite && !okId(v.streamId)).map(([k]) => k);
console.log(`Updated ${n} IDs. Still without an ID: ${left.length ? left.join(", ") : "none"}`);
if (cfg.customerCode) console.log(`Customer code: ${cfg.customerCode}`);
