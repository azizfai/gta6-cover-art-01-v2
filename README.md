# Vice City Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/azizfai/gta6-cover-art-01-v2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/azizfai/gta6-cover-art-01-v2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline, single-page web app that turns your photos and a caption into
GTA-style multi-panel cover art — a Vice City sunset, neon nights, bold
condensed lettering — and exports it as a PNG to share. Everything runs in
your browser from static files; your photos never leave your machine.

## What it does

- **3 cover layouts** — Hero (one large panel + two small), Grid (four equal
  panels), and Strip (one wide panel over three small ones).
- **4 colour grades** — Sunset (warm golden hour), Neon Night (cool pink/teal),
  Noir (high-contrast black & white), and Vintage (faded film).
- **Per-panel photo controls** — drag to reposition, zoom in/out, replace the
  photo, or fill every panel from one photo. Two built-in sample photos
  (a palm boulevard and a wooden pier) are included so you can try it with
  no upload at all.
- **Editable caption** — a big bold title (default `VICE CITY`) plus a smaller
  subtitle, both editable, drawn with a heavy condensed system font, black
  outline and drop shadow.
- **Canvas-drawn decoration** — gradient sunset sky, sun disc, palm-tree and
  skyline silhouettes, halftone dots and film grain, all drawn in code.
  No Rockstar artwork, logos or fonts are used anywhere.
- **Export** — real PNG downloads at 1080×1080 (square), 1080×1350
  (portrait) and 1920×1080 (landscape).

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080> in desktop Chrome. Pick a layout and a
grade, drop in your photos (or use the samples), edit the caption, and hit
an export button. No build step, no network — every file it loads lives
under `app/`.

## How it works

- `app/index.html` — the editor page.
- `app/src/main.js` — app bootstrap, state, and panel controls.
- `app/src/cover.js` — the layout engine (panel geometry for the 3 layouts)
  and the cover renderer.
- `app/src/grades.js` — the 4 colour grades (canvas filter + overlay).
- `app/src/art.js` — canvas decoration: sky, sun, palms, skyline, halftone, grain.
- `app/src/shots.js` — fixed scenes for screenshots and the PNG export helpers.
- `main.ts` — the make.fun entrypoint: copies `app/` and `screenshots/` to
  the output directory and writes `dossier.json`.

## Referral

Made for the [make.fun](https://make.fun) `gta6-cover-art-01` bounty.
Referral code: `p5tm223q`

## License

MIT — see [LICENSE](LICENSE).
