# Splash screen — brief for Andrej's designer

Current: a 120 px icon on pure black. Lost on anything bigger than a 5.4" phone, and reads as unfinished next to peers in the same category.

Research pattern (fitness/health apps that land well — ZOZOFIT, BetterMen, BodyWave, MuscleMaxme, Buddyfit, from a 2026 ScreensDesign sweep): dark background with a subtle gradient or glow, a confident centred mark, and the brand name directly under it. A short tagline is common on paid apps.

## Deliverable Andrej's designer should produce

**File:** `assets/splash-icon.png`

- **Canvas:** 1024 × 1024 (Expo scales it)
- **Format:** PNG with transparency outside the artwork
- **Artwork:** Ossa's hex-rank mark + the word **OSSA** below it, in the Ossa display font (SF-Pro Display Black or the Inter Display Black already shipped with the app)
- **Mark size:** ~45% of canvas height; wordmark ~15% of canvas height; combined block centred vertically with slight optical weight above middle
- **Colours:** mark in `#D4FF00` (the Ossa glow lime); wordmark in `#F6FDD7` (soft off-white, lifts off black cleanly)
- **No tagline** on the splash — keep it brand-mark only. Taglines go in the onboarding carousel.

## Supporting asset (new, optional)

A radial glow backdrop baked into the PNG would lift the whole frame — a very faint `#D4FF00` → `#000000` radial gradient at ~5% opacity under the mark. Expo's splash plugin doesn't support gradient backgrounds separately, so this has to be part of the PNG itself.

## Expo config to pair with the new asset

Already updated in `app.json`:

```json
["expo-splash-screen",
  {
    "backgroundColor": "#000000",
    "image": "./assets/splash-icon.png",
    "imageWidth": 180,
    "resizeMode": "contain"
  }]
```

Bump `imageWidth` to `220` once the new asset lands (it has room because the artwork already includes padding).

## Reference links (from the research round)

- [ZOZOFIT splash](https://screensdesign.com/apps/zozofit-3d-body-scanner/?vs=222990) — dark purple radial, centred logo + wordmark. Closest to what Ossa should feel like.
- [BodyWave splash](https://screensdesign.com/apps/bodywave-health-tracker/?vs=266563) — soft gradient, mark + brand + tagline. Good tagline treatment reference if we ever add one.
- [BetterMen splash](https://screensdesign.com/apps/workouts-for-men-gym-home/?vs=169008) — dark navy, centred mark with a loading spinner.
- [Buddyfit splash](https://screensdesign.com/apps/buddyfit-fitness-yoga/?vs=79517) — minimal: solid black, centred `b` mark only. Closest to Ossa's current direction.
- [MuscleMaxme splash](https://screensdesign.com/apps/musclemaxme/?vs=188885) — dark grey, big "MAX MUSCLE / MIN TIME" tagline, mark at the bottom. More assertive brand voice.

Written for Andrej's designer; swap the file in `assets/`, bump `imageWidth` to `220` in `app.json`, run `npx expo prebuild --platform ios --clean`, and the new splash ships on the next Codemagic build.
