# Maligant Group website

The portfolio site at **maligantgroup.co.za**. This repo holds only the website. GitHub keeps the code and Netlify builds and hosts the site. Cloudflare Stream holds the 162 full-HD portfolio videos.

| What | Where | Size |
|---|---|---|
| Page, thumbnails, posters, hover previews, home-banner and grade-slider videos | `site/` (this repo, hosted by Netlify) | ~0.7 GB |
| 162 full-HD portfolio videos | Cloudflare Stream (originals backed up in the HD zip parts) | ~4 GB |

## How playback works

- **On load:** the page loads only what is on screen. That means posters, thumbnails and the home-banner video. No portfolio video and nothing from Cloudflare loads.
- **Hover/scroll previews:** these are short 720p loops served from `site/bts/`. They load lazily, only when a card is on screen or hovered, and they never touch Cloudflare, so they cost nothing there.
- **Home banner and grade slider:** these 11 videos (`"local": true` in `videos.json`) play from `site/bts/` as they do today, so they also never touch Cloudflare.
- **Clicking a project:** the full-HD video streams from Cloudflare in the same popup as before. The stream is adaptive, so it plays in full HD on good connections, steps down on slow ones, and never redirects. Closing the popup stops the stream and leaves the visitor where they were.
- **If a video has no Cloudflare ID yet:** the popup plays its preview loop, so the player is never broken. The deploy check below stops that from going live by accident.

The player library (`site/js/hls.min.js`, hls.js 1.5.20) is self-hosted and loads only the first time someone opens a video. Safari and iPhone play Cloudflare's stream natively and don't need it.

## The video list: `videos.json`

This is the only file you edit. Each of the 162 entries looks like this:

```json
"bts-love-clinic-couple": {
  "project": "The Love Clinic",
  "title": "The Love Clinic",
  "detail": "Behind the scenes · on set",
  "sections": ["Behind the scenes"],
  "onSite": true,
  "file": "bts-love-clinic-couple.mp4",
  "poster": "bts/bts-love-clinic-couple.jpg",
  "preview": "bts/bts-love-clinic-couple-loop.mp4",
  "local": false,
  "streamId": ""
}
```

Only `streamId` (and `customerCode` at the top) ever needs filling in. Cards, posters and layout read from the page itself, so nothing else changes. Four entries are `"onSite": false`: HD clips that are kept but not shown on the site right now.

## One-time setup

### 1. Cloudflare Stream

1. In the Cloudflare dashboard, go to **Stream** and subscribe. Billing is per minute stored and per minute watched.
2. Find your **customer code**: open any uploaded video, then **Settings**. The HLS URL looks like `https://customer-XXXXXXXX.cloudflarestream.com/...`, and the `XXXXXXXX` part is the code.
3. Recommended: in each video's settings, or for the whole account, set **Allowed origins** to `maligantgroup.co.za` so other sites can't embed your videos.
4. Leave **Require signed URLs** off.

### 2. Upload the 162 HD videos

Unzip all the `Maligant-site-HD-part*.zip` files into one folder. The HD videos are the files in `maligant-site/bts/` that do **not** end in `-loop.mp4`. Keep the file names exactly as they are, because that is how each video is matched to its project.

**Option A, dashboard (simplest):** drag those `.mp4` files into **Stream → Upload**, in batches. Cloudflare names each video after its file.

**Option B, script (hands-off):** create an API token with the *Stream: Edit* permission, then run:

```bash
CF_ACCOUNT_ID=your_account_id CF_API_TOKEN=your_token node scripts/upload-to-stream.mjs "/path/to/maligant-site/bts"
```

The script skips videos that are already uploaded, so it is safe to run again if it stops.

### 3. Connect each video to its project (automatic)

Once every video shows **Ready** in Stream, run:

```bash
CF_ACCOUNT_ID=your_account_id CF_API_TOKEN=your_token node scripts/import-stream-ids.mjs
```

It reads your Stream library, matches each video by file name (for example `bts-love-clinic-couple.mp4` → `bts-love-clinic-couple`), and writes the IDs and your customer code into `videos.json`. It lists anything still unmatched.

No API token? Fill `video-ids.csv` in by hand. Copy each video's ID (32 letters and numbers) from the dashboard into the `streamId` column, then run `node scripts/import-stream-ids.mjs video-ids.csv`.

### 4. GitHub, then Netlify

1. Put this folder in your GitHub repo (`MALIGANT-GROUP/maligant-site`). Use **GitHub Desktop**, because the browser uploader can't handle this many files.
2. In Netlify, open the existing **maligantgroup.co.za** site, go to **Site configuration → Build & deploy → Link repository**, and choose the repo. `netlify.toml` already sets the build:
   - Build command: `node scripts/build-config.mjs`
   - Publish directory: `site`
3. Under **Site configuration → Environment variables**, add `CF_STREAM_CUSTOMER_CODE` = your customer code. You can skip this if it's already in `videos.json`.
4. Push. Netlify builds and deploys automatically.

## The deploy safety check

Every Netlify build runs `scripts/build-config.mjs`, which writes `site/videos.config.js` from `videos.json`. **If any portfolio video is missing its Cloudflare ID, or the customer code is missing, the build fails and the current live site stays up untouched.** The build log names every video that still needs an ID.

You can still deploy before all 162 are uploaded (to launch with part of the library, say) by adding the Netlify environment variable `ALLOW_MISSING_STREAM_IDS` = `true`. Videos without an ID then play their preview loop in the popup until you add the ID.

## Day-to-day

- **Replace a video:** upload the new file to Stream, put its new ID in `videos.json` (or run `import-stream-ids.mjs`), and push.
- **Check locally:** run `node scripts/build-config.mjs` and read the summary line, for example `Cloudflare Stream: 147/147 popup videos linked; 11 banner/slider videos play from the site.`
- **Backup:** the HD zip parts hold every original HD file, plus a full-HD copy of each poster and preview.
