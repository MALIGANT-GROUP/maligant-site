// Uploads every .mp4 in a folder to Cloudflare Stream, named after its file (bts-blulyt.mp4 -> "bts-blulyt.mp4"),
// skipping any already in your library. Then run import-stream-ids.mjs to link them.
//   CF_ACCOUNT_ID=... CF_API_TOKEN=... node scripts/upload-to-stream.mjs "/path/to/maligant-site/bts"
// Needs Node 20+. Files must be under 200 MB (all Maligant HD files are).
import { readdirSync, statSync, openAsBlob } from "node:fs";
import { join } from "node:path";

const { CF_ACCOUNT_ID: acc, CF_API_TOKEN: tok } = process.env;
const dir = process.argv[2];
if (!acc || !tok || !dir) { console.error('Usage: CF_ACCOUNT_ID=... CF_API_TOKEN=... node scripts/upload-to-stream.mjs "<folder with HD .mp4 files>"'); process.exit(1); }
const api = `https://api.cloudflare.com/client/v4/accounts/${acc}/stream`;
const H = { Authorization: `Bearer ${tok}` };

const have = new Set(((await (await fetch(api, { headers: H })).json()).result || []).map(v => v.meta && v.meta.name));
const files = readdirSync(dir).filter(f => /\.mp4$/i.test(f) && !/-loop\.mp4$/i.test(f)).sort();
let i = 0;
for (const f of files) {
  i++;
  if (have.has(f)) { console.log(`[${i}/${files.length}] ${f} already uploaded`); continue; }
  const p = join(dir, f), mb = statSync(p).size / 2 ** 20;
  if (mb >= 200) { console.log(`[${i}/${files.length}] ${f} is ${mb.toFixed(0)} MB: upload it in the dashboard instead`); continue; }
  const form = new FormData(); form.append("file", await openAsBlob(p), f);
  const r = await (await fetch(api, { method: "POST", headers: H, body: form })).json();
  if (!r.success) { console.log(`[${i}/${files.length}] ${f} FAILED ${JSON.stringify(r.errors)}`); continue; }
  await fetch(`${api}/${r.result.uid}`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ meta: { name: f } }) });
  console.log(`[${i}/${files.length}] ${f} -> ${r.result.uid}`);
}
console.log("Done. Wait until every video says Ready in the Stream dashboard, then run: node scripts/import-stream-ids.mjs");
