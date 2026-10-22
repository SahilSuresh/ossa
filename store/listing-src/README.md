# How the App Store screenshots and icon are made

These files rebuild `store/screenshots-6.9in-v3/`, `store/screenshots-6.3in-v3/`, the icon files and `store/listing-v3-overview.png`. Why it looks the way it does is in docs/DECISIONS.md, 19 Oct, "A new App Store listing". The copy is in `store/APP-STORE-LISTING.md`.

Needs: Chrome (`cdp.js` drives it with Node 24's built-in WebSocket; no npm packages), Python with Pillow, and the preview server (`npm run preview`, port 5178). Run everything from this folder, and use script files rather than `node -e` (a relative Chrome profile path fails).

## 1. Capture the app
```
node srv.js
```
- `srv.js` starts the capture server on port 9360: one headless iPhone 6.9" page (440 × 956 pt at 3×, Dynamic Island safe areas) with the page clock set to 9:41 (`clock.js`).
- It seeds the store state on every `/seed`: `seed.js` builds the demo, then `tweak.js` applies the store tweaks (Upper A today, the chest one session from Forged, the region scores aligned with the body, no sore spots, no plural rank-up chips).

```
node cap-all.js [body train progress run look focus intro]
```
- `cap-all.js` takes every capture in one run, into `cap/`. It also records the boxes of the lifted cards in `cap/clips.json`.
- `run` plays a real workout to the end so the rank-up screen is real.
- `hires.js` renders the 3D body at 2× for capture only.
- `q.sh` sends single commands to the server, for poking around: `./q.sh get '/seed'`, `./q.sh ev '<js>'`, `./q.sh get '/shot?name=x&sel=.css&pad=4'`.
- Capture-only fixes, none of them in the app:
  - the workout's doubled top gap (`.app.train.tactive .trainv{top:0}`)
  - the intro's sound toggle and footer line hidden

Remove these fixes once the app fixes the bugs listed in DECISIONS.

## 2. Frame and render
```
node frames.js
node render-frames.js
```
- `frames.js` writes one HTML page per slide into `frames/`: the black canvas, the uppercase italic headline (the sentence-case version is `frames-sentence.js`), the phone frame and status bar, and the lifted cards.
- `render-frames.js` shoots each page at 1320 × 2868 into `out/`. `render-dir.js <framesDir> <outDir>` does the same for any folder.

## 3. The icon
```
node icon/gen-reg.js
node render-icon.js icon/reg.svg icon/out
node render-alpha.js icon/reg-fg.svg alpha/reg-fg.png
node render-alpha.js icon/reg-mono.svg alpha/reg-mono.png
```
- `gen-reg.js` writes the icon (the regular-hex "Breakout Hex") and its Android foreground and mono SVGs. `gen-final.js` is the wider earlier version.
- `render-icon.js` makes the 1024 master and the small-size check sheet. `render-alpha.js` makes the transparent PNGs.

## 4. Publish into the repo
```
python publish.py
node overview.js
```
- `publish.py` writes both screenshot sizes as RGB with no alpha, and every icon slot: iOS, the Android foreground and mono, the splash, the notification icon, the favicon and the Play icon. It keeps the old icons in `store/icon/old/`.
- `overview.js` renders the one-page overview.

`notes/` holds the research, the fact-checked copy and the QA results.
