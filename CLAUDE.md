# Ossa — notes for Claude

Ossa is Andrej's iPhone app: a 3D human body you level up by training, recovering and focusing. Bundle id `com.andrej.ossa`. Expo SDK 57, built and shipped with EAS.

**Current job: the Ossa 2.0 redesign ("The Body as a Character").** The brief is imported at the end of this file. The designs are in `design/redesign-v2/`: open `images/<screen>.png` to see a screen before building it.

## How the app is built
- `App.js` is a thin React Native shell: one `WebView` that loads `ossaHtml.js`. It also bridges to native modules in `native/`: reminders, widget, Apple Health, purchases (RevenueCat) and the posture scan (pose). It turns `navigator.vibrate` into real haptics.
- Almost all of the app is one web page:
  - `web/ossa.html` is the big original file: data, the WebGL 3D body, most screens and logic.
  - `web/ui/*.js|css` is the newer UI layer: tokens, shell (tabs), ranks, train, workout, onboarding, fx, body-fx, injury (Sore spots), exdata (movement tags, jobs, zones; checked by `node scripts/check-exdata.js`), discover (Exercises, Kinetic chain), density (Where your sets went), native (bridge v2: haptics, location, MET weather, keep-awake), widget, aura (Aura XP), halo (the aura on the body, Focus stills, seated poses), monk (Monk Mode), heartbeat, focus (the Focus home and its view dispatcher), calm and unwind (Calm visuals, the Unwind toys), recover (the Recover tab, Fuel, the 3-minute reset), evolve (Profile › Evolve hub and views), trophy, ideal, prestige, path, card, vault (Ossa Pro and Your look), look-fx (Phase 5 body looks), dares (the daily dare, weather dares), wxgate (the weather safety rules; checked by `node scripts/check-dares.js`), darepage and wxplace (the dare page, the Weather dares opt-in), gate (the hard paywall: no free tier), deck (the Train tab's home: the RPG layer and today's quest, no 3D, redefines `rdTrainHub`, wraps `drawPlanFloat`), lens (the Body page's lenses since 19 Oct: Rank/Recovery/Bones chips, the X-ray knob, the readout, pick card and tiles that came from the old 3D view, drag to turn the body (momentum, dial clicks), pinch to zoom, hold to flag sore, double-tap into a region; owns `rdxBuild`/`rdxDraw` as no-ops, redefines `drawBones` and `rkShow3D`), rock (the onboarding's stone body that breaks as you answer; a BODY_FX effect at the `ob` marker, only during the intro), stats (the life stats and the character sheet: Strength, Mind, Recovery, Discipline; the intro's "sheet" step and the level emblem's panel), rank (the Rank tab: your rank, aura, next unlock, level-up tools, the unlock road), guide (the walk-through after the intro: startTour, replay in Settings), taps (button sounds after the intro, twelve styles in three groups; Settings › Button sounds opens its picker; `S.tapStyle`, `S.tapSound`; also the Vibration setting, `S.haptics`, which gates every buzz), props (the equipment in every exercise demo, 149 exercises in six batches: benches, bars, dumbbells, cables, machines; poses built from where the hands and feet go; held things run through the fist the shader curls (GRIP_GLSL in ossa.html, uGrip from pose.grip; open hands are h.flat); `BODY_PROPS.draw` and `.span`, the new MOVES keys (never an old move's name: lessons play those), wraps `moveFor`), and `vessel.js`, the engine (see below).
- **Build after every web change:** `node scripts/build-html.js`.
  - It inlines `web/ossa.html` and every `/*@include ui/…*/` marker into `ossaHtml.js` (what the app loads) and `web/.preview.html` (open it in Chrome).
  - A `/*@include-preview ui/…*/` marker goes into `web/.preview.html` only (the desktop spikes, `?spike=monk|shape`). It never reaches `ossaHtml.js`.
  - It also runs automatically before `npm start`.
  - Never edit `ossaHtml.js` by hand.
- **Preview:** `npm run preview`, then http://localhost:5178, with Chrome's phone view at 390×844 (also check a small phone, 375×667).
- **Smoke test:** `node scripts/smoke.js` (add `--shots` for screenshots in scripts/smoke/out/). Runs the intro, every tab and a full workout at two phone sizes. Run it before every update or build.
- **Lint:** `node scripts/check-tokens.js`. Everything in `web/ui/` must take its colours and font sizes from `web/ui/tokens.css`.
- **Engine:** `web/ui/vessel.js` owns the body's rules: the save migration (`S.ver` 2), rank points (RP), the level (lifetime RP: `vxLevelInfo`, `vxHas` for unlocks), `finishWorkout` and `quickLog`, the workout record and tally, recovery and the one fading rule (`NEGLECT_DAYS` 10, `FADE_FULL_DAYS` 21), sore-spot flags (`S.spots`) and the hooks (`vxOn`/`vxEmit`/`vxRoute`/`vxRemind`). Change those there. Later phases subscribe to its hooks instead of wrapping. See docs/UI-SYSTEM.md, "Vessel engine".
- **Overrides:** the `web/ui` files are included after the legacy code and before boot, vessel.js first and injury.js last.
  - The last function declaration with a name wins. Prefer redefining or wrapping a legacy function in `web/ui/` over editing `ossa.html`.
  - Existing wrappers: `nativeOpen`, `remindPlan` and `nrecv` in vessel.js (the only ones; use its hooks); `closePanels` in ranks.js; `whyFor`, `planWhy`, `reliefSession` in train.js; `ossNotices` (adds the Inter credit), `renderSheet`/`setSheet` (peek height fits its content) and `openMind`/`closeMind` (Breathe opens without the head zoom) in shell.js; `drawDone` (rank-ups without 3D) in workout.js; `closePanels`, `goBack`, `rdHeroBox`, `drawBones`, `renderJoint`, `renderSheet`, `whyFor` and `reviewWeek` in injury.js. Full list in docs/UI-SYSTEM.md.
  - Moved, not wrapped: `finishWorkout`, `quickLog`, `mkItem`, `loadOf`, `lastSession`, `recoveredPct`, `hoursLeft`, `stateOf`, `readyText`, `wkInfo` and `fadeOf` now live only in vessel.js (ossa.html keeps a pointer comment). Edit them there.
  - A `const` or `let` in ossa.html (`sessionsN`, `RANKS`, `EXW`, `SEC`, `NEGLECT_DAYS`, `TR`, the shader strings…) can't be redeclared from web/ui: that's a SyntaxError that blanks the whole app. Edit those in place. (`fadeOf` is no longer a const: it's a function in vessel.js.)
  - Start-up rule: `vxMigrate()` runs right after the loader, and building `TR` calls `mkItem` and `stateOf`, all before any web/ui file's top-level code runs. So vessel.js and injury.js use only hoisted `function` declarations, with state on function properties. A top-level `const`/`let` there is a TDZ error that blanks the app.
  - Effects on the 3D body go through `window.BODY_FX` in `web/ui/body-fx.js` (see docs/UI-SYSTEM.md, "Body effects").
- **Globals worth knowing:**
  - `S`: saved user state, kept on the phone.
  - `TR`: Train screen state.
  - Data tables: `MUSCLES`, `MX`, `EXW` (each exercise's main muscle and helper weights; `SEC` is derived from it), `REGIONS`, `RELIEF`, `JOINTS`, `JOINT_RELIEF`.
  - `Body`: the 3D model's API.
  - `setMode`/`setTab`/`uiGo`: navigation.
- **Copy** is British English, short and plain. Ossa has no accounts and no ads. Health wording stays general, never diagnostic.
- **Expo changes every SDK.** Before touching any Expo, EAS or React Native API, check the SDK 57 docs (https://docs.expo.dev/versions/v57.0.0/, index at https://docs.expo.dev/llms.txt). Add packages with `npx expo install`, never `npm install <pkg>`. Native code changes need a new EAS build. Web-only changes can be tried on the phone in Expo Go without one, but still reach TestFlight only inside a new build (ossaHtml.js is bundled, and expo-updates is installed but switched off: `updates.enabled:false` in app.json since 23 Oct).
- `AGENTS.md` is the generic Expo template, and its Expo Router / `src/app` part doesn't apply here, because there is no router. Claude Code skips it anyway while this CLAUDE.md exists.

## Rules from Andrej
- Nothing goes to Apple (no submit, no remove-from-review) until he says.
- Never type or ask for his passwords, keys or 2FA codes. He signs in himself.
- Deleting anything in App Store Connect needs his OK.
- Log every product decision in `docs/DECISIONS.md`.

## App Review rules (since the 23 Oct 2026 rejections: 4.3 spam on Ossa, 5.6 "hidden features" on Unknot)
- **Nothing hidden.** No secret taps, gestures, codes, URL switches or settings rows that only reviewers or testers know about. If a feature exists, a user can find it; if it shouldn't be found, delete it. Reviewers get Pro through the sandbox free trial, never a shortcut.
- **No over-the-air updates.** `updates.enabled` stays false. Every change, even a typo, ships in a new build that App Review sees.
- **Test-only code** runs only on localhost (the desktop preview) or in Expo Go, and says so plainly in its comment. Never "hidden", never "for reviewers".
- **No feature overlap with Andrej's other apps** (Unknot, Onus, Last Tin) without asking first: Apple's 4.3 questions ask about exactly that. Break free (quitting habits, incl. nicotine) was removed for that reason; web/ui/clean.js is kept on disk but not included.
- **The listing, the review notes, the privacy label and the privacy policy must all match the build.** Change one, check the other three.
- He's a visual learner: show things (screenshots, diagrams) and keep text short.

## Shipping
- iPhone builds now go through **Codemagic** (`codemagic.yaml`, workflow "Ossa for iPhone", env group `ossa_appstore`). It runs `build-html.js` itself and numbers builds in epoch-minutes (e.g. 29878404 = 22 Oct 2026 21:24 GMT), uploading to TestFlight. It doesn't submit for review.
- `build-for-app-store.bat`: the older EAS route (Andrej, signed in himself). Builds 8–18 came from it.
- `npm run update` is disabled (it prints a message and stops): over-the-air updates are off, see the App Review rules above.
- Store copy and screenshots are in `store/`. Version 1.0 is on hold until the redesign ships. Status is in `docs/REDESIGN-BRIEF.md` §5.
- More docs: `docs/UI-SYSTEM.md` (UI system and file map), `docs/SPEC.md`, `docs/BUGS.md`, `HOW-TO-RUN.txt`.
