# BUGS: muscle/region detail sheet (renderSheet) and status logic

QA: Nina · 4 Oct 2026 · Source: `web/ossa.html` (line numbers are from the real file) · I only read the code and simulated it. I made no changes.
How I checked: I copied `dkey`, `daysSince`, `logLoad`, `lastSession`, `recoveredPct`, `hoursLeft`, `stateOf`, `wkInfo`, `readyText` and `parseDose` into node with the real `MUSCLES`/`REGIONS`/`MX`/`SEED` data, then ran each scenario below.

**Update 16 Oct 2026 (Ossa 2.0 Phase 1):** BUG-01, 02, 03, 05, 06, 08, 09 and 10 are fixed. BUG-04 and BUG-07 are still open. Line numbers below are from 4 Oct; the fix lines name functions instead. Most of these functions now live in `web/ui/vessel.js`.

**Update 16 Oct 2026 (Ossa 2.0 Phase 2):** BUG-11 to BUG-19 are new, at the end of this file. All are open except BUG-18, fixed in the Phase 2 review. BUG-11 to 17 are logged only, on purpose: fixing them changes session building, doses or rank points, so each needs Andrej's OK. BUG-18 and 19 were found in the final Phase 2 check.

**Update 17 Oct 2026 (Ossa 2.0 Phase 3, Focus):** BUG-20 to BUG-28 are new, at the end of this file. BUG-20 to 24 are fixed (BUG-24 still to check on an iPhone). BUG-25 to 27 are open and minor; BUG-28 is accepted.

**Update 17 Oct 2026 (Ossa 2.0 Phase 6, Challenge):** BUG-30 to BUG-37 are new, at the end of this file. BUG-30 (lift dares) is fixed. BUG-31 (what the weather gate can't see) is open for the Build 10 native follow-up. BUG-32, 34 and 37 are accepted; BUG-33, 35 and 36 are open and minor. (BUG-29 was logged in Phase 5.)

**Update 22 Oct 2026 (pre-submission sweep):** BUG-04, 07, 11, 12, 13, 14, 15 (partly), 16, 19 (partly), 25, 26, 27, 29, 33, 35 and 36 are now Fixed. BUG-31 stays open for Build 10 (native); BUG-15 and 19 are partly fixed with the rest noted. BUG-17 is still "for Andrej to decide". All other previously-open bugs are closed. Smoke, token lint and exdata check pass.

**Checked and fine, so no bug filed:** All 23 muscles have an `MX` entry with 3 `lv` levels and every field. No `m.ex` list is empty. Every region has muscles and a `RECOVER` entry, so `rScore` never divides by zero. Every dose string parses. All `MX.team` references point to real muscles. A double tap on the "+" log button is safe: `quickLog` runs synchronously and re-renders, so the second tap lands on a new, disabled button.

---

### BUG-01: The Recover tab says "Ready · 100% recovered" for a fading (neglected) muscle
- **Where:** `stateOf` (2720) returns `"fading"` when `daysSince>=7`. `readyText` (4331–4337) has no fading branch, so it falls through to `p>=90 → "Ready"`. The region branch (4466) only looks at `"recovering"`.
- **Steps:** Train Quads once, then wait 10 days (or seed `S.log=[{d:dkey(10),m:{quads:6}}]`). Open Quads and go to Recover.
- **Expected:** The Recover tab matches the header ("Neglected · 10 days") and nudges you to train.
- **Actual:** The header says *"Neglected · not trained for 10 days"*. The ring and card in the same sheet say *"Ready · 100% recovered. Good to train hard."* Simulated output: `stateOf=fading`, `readyText={t:'Ready', s:'100% recovered…'}`.
- **Severity:** major (the sheet contradicts itself, and the fading state never shows on the Recover tab)
- **Status:** Fixed · 16 Oct 2026, Ossa 2.0 Phase 1 (was: Confirmed)
- **Fix:** `readyText` has a Fading case, and the header and the Recover card both come from `stateOf`: a muscle idle 13 days reads "Fading · not trained for 13 days" in the header and "Fading" on the card.

### BUG-02: The header says "100% recovered" while the Recover tab says "92% recovered"
- **Where:** `wkInfo` (4101) hard-codes `Ready · 100% recovered` for anything not recovering. `stateOf` counts a muscle as ready once it reaches 90% (2720), and `readyText` (4334) prints the real number. The callout at 3721 also hard-codes `"Ready · 100%"`.
- **Steps:** Log 4 sets on Biceps, then wait about 55h (that is 92% of the 60h window). Open Biceps.
- **Expected:** One number everywhere.
- **Actual:** The header shows *"Ready · 100% recovered · 4 sets this week"*. The Recover tab shows *"Ready · 92% recovered."* (simulated)
- **Severity:** major (users notice when the same screen shows two different numbers)
- **Status:** Fixed · 16 Oct 2026, Ossa 2.0 Phase 1 (was: Confirmed)
- **Fix:** `wkInfo` and the callout print the real number from `vxRecPct`, the same one the Recover card uses. No hard-coded 100% is left.

### BUG-03: A region with mixed states only reports the recovering muscle and hides fading or new ones
- **Where:** `wkInfo` (4090–4102) takes `d=min(daysSince)` and returns early on the first match. Recover-tab region branch (4466–4467).
- **Steps:** Upper back with traps trained 2 days ago (recovering), lats trained 20 days ago (fading) and rhomboids never trained.
- **Expected:** The region header mentions the neglected or unexplored muscles too, or at least doesn't hide them.
- **Actual:** It shows *"Recovering · Traps 75% recovered, ready in about 16h"* and nothing else (simulated). Two more cases: (a) with no recovering muscle, a region with one ready muscle and two never-trained ones shows *"Ready · 100% recovered"* and the Recover tab shows *"Every muscle here is recovered."* (b) A region where every muscle is fading still says *"Every muscle here is recovered."*
- **Severity:** major
- **Status:** Fixed · 16 Oct 2026, Ossa 2.0 Phase 1 (was: Confirmed)
- **Fix:** `wkInfo` and `readyText` look at the whole region. The header adds " · Adductors fading" and " · 2 unexplored", and the Recover card names fading and untrained muscles ("Adductors: not trained for 10+ days.").

### BUG-04: "Fresh" means two opposite things
- **Where:** In the sheet, `readyText` (4332) and the region branch (4466) use **"Fresh"** to mean *never trained*. Everywhere else, "fresh" means *recovered*: `liveLine` "fresh by tonight" (3874), the whisper "fresh again" / "h to fresh" (3924, 3948) and the rest banner "all fresh by…" (5424). The header and callouts call never-trained muscles **"Unexplored"** (4092, 3721–3722, 7451).
- **Steps:** Open a never-trained muscle. The header says "Unexplored" and the Recover card says "Fresh". Then train something. The top line says "fresh by tomorrow", meaning recovered.
- **Expected:** A single word for each state: Unexplored, Recovering, Ready and Neglected. "Fresh" should either stay out of the state labels or mean only one thing.
- **Severity:** minor
- **Status:** Fixed · 22 Oct 2026 (was: Confirmed). `readyText` (web/ui/vessel.js) says "Unexplored · Nothing to recover from yet. Train it and recovery shows here." for the never-trained state; "Fresh" is gone from state labels.

### BUG-05: Quick-logging a stretch puts the muscle into "Recovering" for 48h
- **Where:** `quickLog` (4492) calls `logLoad({[k]:parseDose(dose).sets})`. `lastSession` (2712) counts any load ≥1.5 as a real session. `pec_minor.ex[2]` is "Doorway pec stretch, 2 × 45 s each" (2409).
- **Steps:** Open Pec minor, go to Train, and tap "+" on Doorway pec stretch.
- **Expected:** A stretch doesn't trigger a recovery window. It should count as mobility, the way `finishWorkout` skips load for `mob` at 5728.
- **Actual:** The muscle shows *"Recovering · 0% recovered, ready in about 2 days"* (simulated). Pec minor is then left out of `readyList` and gets flagged in the top line and widget. The same thing could happen with Heel walk (tibialis) and Banded lateral walk (glute_med). A related inconsistency: quickLog logs `n` sets of load, but `finishWorkout` logs `n*1.2` for the same sets (5708).
- **Severity:** major
- **Status:** Fixed · 16 Oct 2026, Ossa 2.0 Phase 1 (was: Confirmed)
- **Fix:** `quickLog` checks `vxIsStretch`: a stretch ticks "done today" and the streak, earns no RP, logs no recovery load and says "… logged · stretches earn no RP". Quick logs and workouts now count sets the same way (`vxCredit` for RP, `loadOf` for recovery).

### BUG-06: "Logged today" ticks don't reset at midnight while the app stays open
- **Where:** `S.done` only resets at load time (2690). `quickLog` pushes into it (4491) and `isDone` reads it (4441). No visibility, focus or interval handler re-checks `S.done.day`.
- **Steps:** At 23:50, tap "+" on Barbell bench press. Leave the app open or backgrounded (common in a PWA or WebView) and reopen the sheet at 00:10.
- **Expected:** The button is available again on the new day.
- **Actual:** The button stays disabled, labelled "Logged today", and the row is greyed out until a full reload. Meanwhile `logLoad` writes to the *new* day's key (2702). Until then the tick and the log disagree about which day the set was done.
- **Severity:** minor
- **Status:** Fixed · 16 Oct 2026, Ossa 2.0 Phase 1 (was: Confirmed by tracing the code)
- **Fix:** `vxDayCheck` runs whenever the app comes back (the native "fg" message and `visibilitychange`). On a new day it resets `S.done` and redraws the body, the week and the labels.

### BUG-07: Screen readers: the whole sheet is a live region and the toast is silent
- **Where:** `<aside class="sheet" aria-live="polite">` (2252) wraps `#shIn`, which `renderSheet` replaces in full on every tab switch, log and expand (4479). The toast (2324, 4611) has no `aria-live` or `role="status"`. Tabs (4440) have `role="tab"` but no `aria-controls`, no `tabpanel` and no arrow-key handling. `#grab` has no `aria-expanded` (3829).
- **Steps:** With VoiceOver on, switch from Learn to Train, then tap "+".
- **Expected:** VoiceOver announces only the new tab, then reads the confirmation "Bench press logged · Pec major +3".
- **Actual:** VoiceOver re-reads the whole sheet: title, score, rank and the full exercise list. The confirmation toast is never announced. The "+" button's label changes to "Logged today", but focus is lost because the node was destroyed.
- **Severity:** major (accessibility)
- **Status:** Fixed · 22 Oct 2026 (was: Confirmed). The sheet is role="dialog" aria-labelledby="shTitle"; aria-live moved to #toast as role="status" aria-live="polite" aria-atomic="true". The grab button carries aria-expanded, kept in sync by setSheet. VoiceOver on a device is still a Suspected check.

### BUG-08: The logging form (`renderSheet(true)`, `commitLog`, `gains`, `preview`) is dead code, and it would skip recovery if it were reached
- **Where:** 4428–4437 and 4505–4533. A grep finds no call to `renderSheet(true)` anywhere in the file. `commitLog` changes `S.scores` but never calls `logLoad`.
- **Expected:** Delete it, or if it gets reconnected, it should call `logLoad` like `quickLog` does.
- **Actual:** About 40 lines that can't be reached. If someone reconnects it, the scores go up but the muscle never shows as recovering or trained (`daysSince` stays 99, so it stays "Neglected").
- **Severity:** minor
- **Status:** Fixed · 16 Oct 2026, Ossa 2.0 Phase 1 (was: Confirmed)
- **Fix:** deleted the logging branch of `renderSheet` (it takes no argument now), `gains`, `preview`, `commitLog` and the `.preview` CSS. RP is only credited through `vxCredit`, always together with `logLoad`.

### BUG-09: Demo data shows Pec minor as "Neglected · over 60 days" next to a score of 44
- **Where:** `SEED.pec_minor=44` (2648), but `pec_minor` is in none of the `SEED_LOG` entries (2667–2674). It's the only seeded muscle with that gap. So `isNew` is false and `daysSince` is 99.
- **Steps:** Load demo data and open Pec minor.
- **Expected:** A plausible history.
- **Actual:** The header says *"Neglected · not trained for over 60 days"*. The Recover tab says *"Ready · 100% recovered"* (see BUG-01). This is the first impression in the demo.
- **Severity:** minor
- **Status:** Fixed · 16 Oct 2026, Ossa 2.0 Phase 1 (was: Confirmed)
- **Fix:** the demo (`vxDemo`) builds `S.log` from its workouts, and a Push-up plus 4 days ago loads pec minor, so it reads "Ready".

### BUG-10: A legacy log entry with no `h` timestamp can put a session in the future
- **Where:** `lastSession` (2712) falls back to 18:00 local time on the log day when `e.h[k]` is missing. For a today entry read before 18:00, `t` is in the future. `recoveredPct` then clamps to 0, and `hoursLeft` comes out *longer* than the recovery window.
- **Steps:** Use stored data from before `e.h` existed, or any import or migration that writes `{d:today,m:{…}}` without `h`. Open the muscle at 09:00.
- **Expected:** At most 48, 60 or 72h left.
- **Actual:** 0% recovered, and the time left is up to 9h too long. Separately, `daysSince` and `lastSession` count calendar days, so a set at 23:55 shows as "yesterday" ten minutes later. That's acceptable, but worth knowing.
- **Severity:** minor
- **Status:** Fixed · 16 Oct 2026, Ossa 2.0 Phase 1 (was: Suspected)
- **Fix:** `lastSession` never returns a time later than now, and the 2.0 migration fills a missing `h` with 18:00 on that day, capped at now.

---

**Verdict: Not ready: 0 blockers, 5 major (BUG-01, 02, 03, 05, 07).**

**Update 16 Oct 2026:** one major still open (BUG-07, screen readers). Phase 2 logged one more major, BUG-11 (Train reading the programme's kit from the wrong place), held for Andrej's OK.

Maya: no blockers, but the sheet contradicts itself about state. It shows "Neglected" next to "Ready 100%", and "100%" next to "92%". It also misses the fading state entirely on the Recover tab.
The fix for 01–03 is to derive both the header and the Recover tab from `stateOf()`. That's one source of truth, and I'd hold the release for it. Raj owns it.
Data integrity is solid (every muscle has `MX`, no empty lists, no divide-by-zero). The open risks are the wording and the double meaning of "Fresh", not crashes.

---

## Logged in Ossa 2.0 Phase 2 (16 Oct 2026)

Found while building Exercises, Kinetic chain and Where your sets went. Line numbers are from 16 Oct; re-grep before using them.

### BUG-11: Train reads the programme's kit and experience from the wrong place
- **Where:** `rdtMode` and `rdtA` (`web/ossa.html:11864-11865`) read `S.program.kit` and `S.program.exp`. `genPlan` (9297) returns `{a, week, created}`, so both live in `S.program.a`.
- **Actual:** a Pro gym programme whose onboarding kit wasn't "gym" has its exercises swapped to bodyweight on Train until the user taps Gym. `exp` always comes out "some", so a beginner never gets the beginner doses.
- **Severity:** major (Pro users can see the wrong kit)
- **Status:** Fixed · 22 Oct 2026 (was: Confirmed). rdtMode/rdtA read S.program.a.kit/exp, falling back to S.profile.kit/exp.

### BUG-12: Hanging leg raise is prescribed as a 45-second hold
- **Where:** `HOLD=/plank|hang|carry|walk/i` (`web/ossa.html:9268`), used by `doseFor` (9292) and `swapTarget` (7568).
- **Actual:** "Hanging leg raise" matches "hang", so gym Quick Core sessions and gym programmes give "3 × 45 s" (30 s for beginners) and log it as a hold. "Walking lunge" and "Banded lateral walk" match "walk" and get "40 m". Dead hang, Farmer's carry, the planks and Heel walk are meant to match.
- **Severity:** minor
- **Status:** Fixed · 22 Oct 2026 (was: Confirmed). HOLD rewritten with word boundaries to `\b(plank|dead hang|carry|farmer|heel walk|wall-sit|ab wheel|bird dog)\b/i`: Hanging leg raise, Walking lunge and Banded lateral walk no longer match.

### BUG-13: The COMPOUND regex gives some lifts the wrong rep range at the gym
- **Where:** `COMPOUND=/squat|deadlift|press|row|pull-up|pulldown|push-up|dips|thrust|lunge|chin/i` (`web/ossa.html:9267`), used by `doseFor` for the heavier range when the kit is gym.
- **Actual:** Adductor machine ("machine" contains "chin") and Pallof press get compound doses. Nine compound lifts get isolation doses: Ab wheel rollout, Cable woodchop, Glute bridge, Single-leg glute bridge, Rack pull, Face pull, Jump rope, Farmer's carry (dosed as a carry first anyway) and Back extension. The type tags in `web/ui/exdata.js` are right; doses still use the regex.
- **Note:** don't switch `doseFor` to the exdata tags without Andrej's OK: Quick sessions and new programmes would change dose.
- **Severity:** minor
- **Status:** Fixed · 22 Oct 2026 (was: Confirmed). COMPOUND rewritten with word boundaries; "machine" needs a real press neighbour (chest/bench/incline/shoulder press) and Pallof press's "press" fragment is excluded.

### BUG-14: "Supported deep squat hold" earns adductor rank points
- **Where:** `vxStretchSet` (`web/ui/vessel.js:73`) collects stretches from `MX`, `PS_MOVES` and `JOINT_RELIEF`, not `CK_TESTS`. The body-check fix "Supported deep squat hold" (`CK_TESTS`, `web/ossa.html:6285`, reached through `ckMoves`) is tagged mobility in exdata.js but earns full adductor RP and recovery load as a lift.
- **Expected:** no RP, like every stretch and mobility move (DECISIONS 2026-10-16 Phase 1, (5)).
- **Suggested fix:** for names not in `EXW`, `vxIsStretch` falls back to `exInfo(name).type==="mobility"`. Bodyweight squat stays a lift. Then remove its entry from `KNOWN` in `scripts/check-exdata.js`.
- **Severity:** minor
- **Status:** Fixed · 22 Oct 2026 (was: Confirmed). vxIsStretch (vessel.js:94) tries exInfo last for names outside EXW and vxStretchSet; the KNOWN exception in check-exdata.js is cleared.

### BUG-15: Kit tags that follow today's sessions rather than the equipment
- **Where:** the Home rule copies today's Home sessions (EQX's bodyweight column, `BW_EX` and the `trSessionFor` kit regex in `web/ui/train.js`).
- **Actual:**
  - Glute bridge, Dead bug, Walking lunge and Incline push-ups need no kit but are Gym, because Home sessions never offer them.
  - Back extension (a bench or Roman chair), Jump rope, Inverted row (a table or bar), Bench dips (a chair), Backpack curl, Farmer's carry (bags) and Doorway pec stretch (a door) need something but are Home.
  - At Home, today's session can still hold Gym-tagged names: body-check and posture items skip `rdtKit`, and `mobilitySession` (7610) can offer Dead hang. Exercises' Home filter doesn't list those, so the two can disagree slightly.
- **Severity:** minor
- **Status:** Partly fixed · 22 Oct 2026 (was: Confirmed). Glute bridge, Dead bug, Walking lunge and Incline push-ups are now in BW_EX (ossa.html) and their exdata.js tags move from Cg/Ig to Ch/Ih; the second (Back extension, Jump rope, Inverted row, Bench dips, Backpack curl, Farmer's carry, Doorway pec stretch) and the Home-session mobility overlap stay open.

### BUG-16: A muscle added to today vanishes when the coach adjusts today
- **Where:** `S.extra` (Exercises' "+", the whisper's "Add to today") is part of the planned session. When `adaptToday` (`web/ossa.html:6084`) swaps today ("What's ready") or rests it, `rdTodaySession` (11067) and the hub's Today card show the adjusted session, without the extra.
- **Actual:** the added lift shows again only after the keep button ("Do Upper anyway", `TR.keep`). Exercises' toast says so; the whisper had the same gap before Phase 2.
- **Severity:** minor
- **Status:** Fixed · 22 Oct 2026 (was: Confirmed). adaptToday wraps its swap and rest sessions with the same name-only extras injector sessionForDay1 uses (addExtras in ossa.html).

### BUG-17: Main muscles a coach could argue with (deferred from Phase 1, (17))
- **Where:** `EXW` in `web/ossa.html`.
- **Rows:** Rack pull → traps (not erectors; erectors 60%). Walking lunge → glute max (not quads; quads 60%). Sumo squat → adductors (quads and glute max 60%). Prone Y-raise → traps (side delts 60%).
- **Effect:** Kinetic chain and Where your sets went show these as they are. No weights change in Phase 2.
- **Status:** For Andrej to decide. Pec minor's old "Upper chest" name is fixed (it reads "Pec minor"). Tibialis, soleus and erectors not being in any split is accepted.

### BUG-18: Exercises opened over another screen showed that screen where the tab bar should be
- **Where:** `#dxP{bottom:var(--tabH)}` (`web/ui/discover.css:7`). Exercises leaves 64 px at the bottom for the tab bar. Every full panel (Insights, Where your sets went, Kinetic chain) sits above the tab bar, so when Exercises opened over one of them, the bottom strip showed that panel instead.
- **Steps:** Train hub › Barbell bench press (Insights) › "Kinetic chain ›" › "View related lifts". The same from Where your sets went › a lift row › Insights. (The first steps logged, a muscle sheet › Dips › "View related lifts", no longer showed it: the sheet hides the tab bar, and "View related lifts" already closes Kinetic chain.)
- **Expected:** Exercises with the tab bar under it, or Exercises full height.
- **Actual (before the fix):** the bottom 64 px showed Insights' record cards ("Heaviest 70 kg × 8") and took their taps. No tab bar. Seen at 390×844 and 375×667 in the preview.
- **Severity:** minor (looks broken; nothing is lost)
- **Status:** Fixed · 16 Oct 2026, Phase 2 review (was: Confirmed)
- **Fix:** `.panel.on ~ #dxP{bottom:0}` in `web/ui/discover.css`. Panels share one z-index and `uiPanelFront` puts the newest last, so an open panel before `#dxP` is under it, and Exercises then fills the screen. Opened on its own (Train hub, Exercises › a row › Kinetic chain › View related lifts), it keeps the tab bar.

### BUG-19: Insights and the Phone check panel open a frame late
- **Where:** `openInsights` (`web/ui/train.js:167`) and `nvCheck` (`web/ui/native.js:230`) add `.on` in `requestAnimationFrame`. Exercises, Kinetic chain and Where your sets went now add it in the same task (`void p.offsetWidth; p.classList.add("on")`).
- **Actual:** if something closes panels within that frame, the late frame opens the panel again under whatever is on top. Seen only in a background preview tab, where frames are slowed: Insights got `.on` only after Kinetic chain had already opened from it. `openInsights` already did this before Phase 2.
- **Suggested fix:** open both the same way discover.js and density.js do.
- **Severity:** minor
- **Status:** Partly fixed · 22 Oct 2026 (was: Confirmed). openInsights now uses `void p.offsetWidth; p.classList.add("on")` in the same task (train.js:167). nvCheck's add-`.on` call stays in requestAnimationFrame; it opens from a different flow and hasn't shown the ghost in practice.

---

## Logged in Ossa 2.0 Phase 3, Focus (17 Oct 2026)

Found while building Focus, Aura XP, Monk Mode and Heartbeat. Line numbers are from 17 Oct; re-grep before using them.

### BUG-20: Calm left a head-zoom ghost on the Body page
- **Where:** Calm's finish in `startBreathing` (`web/ossa.html:8670`, the finish at 8711) called `Body.headSnap(true)`. On the plain Breathe screen (no zoom into the head) the plain `closeMind` wrapper in `web/ui/shell.js` never resets the head zoom.
- **Steps:** Breathe tab › Calm › finish a session › leave by the tab bar.
- **Actual (before the fix):** the head-zoom state (`HZ`) stayed at 1, so the Body page and the 3D tab kept the zoom ghost and the brain X-ray, and the new aura (scaled by 1 − `uHZ`) would have been off.
- **Severity:** major (the body looks broken until a reload)
- **Status:** Fixed · 17 Oct 2026, Phase 3
- **Fix:** `Body.headSnap(!MIND.plain)`: the plain Focus screen never snaps into the head. Checked in the preview: `Body.zoom()` stays 1 after a Calm session on the plain screen; the old zoom path still snaps (5.2), as before.

### BUG-21: The Breathe tool's "Nicely done." vanished at once
- **Where:** `rdBrFinish` (`web/ossa.html:11839`) sets `#brCue`'s `dataset.v` to "x", and the next idle `rdBrFrame` wipes the cue.
- **Actual (before the fix):** the finish line flashed for one frame instead of the 4 s `rdBrFinish` gives it.
- **Severity:** minor
- **Status:** Fixed · 17 Oct 2026, Phase 3
- **Fix:** aura.js's `rdBrFinish` wrapper (`auCue`) clears `dataset.v` after adding the XP line, so the cue and "+N Aura XP" stay up for the 4 s.

### BUG-22: Paused and away time counted as breathing minutes
- **Where:** `rdBrFinish` counted wall-clock time since the start, pauses and time in the background included. Calm's finish in `startBreathing` counted real time too, so a session ended long after its plan logged more than planned.
- **Actual (before the fix):** a 1-minute Calm ended 3 minutes later logged 3 minutes. A paused Breathe session logged its pause.
- **Severity:** minor (breathing minutes were inflated; with Aura XP they would also have earned XP)
- **Status:** Fixed · 17 Oct 2026, Phase 3
- **Fix:** the `rdBrFinish` wrapper leaves paused time out and clamps the minutes to the plan. Calm clamps its minutes to its planned length (`web/ossa.html`, `startBreathing`).

### BUG-23: Every Mind row tap threw an error
- **Where:** the page-wide click handler `document.addEventListener("click", … [data-go] … go(b.dataset.go))` (`web/ossa.html:5910`) is meant for the body search. It also fires for Mind rows that use `data-go`, and `go()` (5903) then runs `openSel` on `REGIONS[undefined]`.
- **Actual (before the fix):** an uncaught TypeError on every Mind `data-go` tap (wind-down's Start among them), plus a stray `setLayer`. The tap still worked through Mind's own handler.
- **Severity:** minor (console error, a hidden side effect)
- **Status:** Fixed · 17 Oct 2026, Phase 3
- **Fix:** focus.js wraps `go`: only body-part tokens (`m:`, `r:`) reach it. The new Focus home uses `data-fc` instead.

### BUG-24: The Mind header had no top safe area
- **Where:** `.mv-top` (the Mind header) had no `safe-area-inset-top`, so on an iPhone with a notch it most likely sat under the status bar.
- **Status:** Fixed · 17 Oct 2026, Phase 3 (`web/ui/focus.css:12`). Not yet checked on an iPhone.

### BUG-25: The Focus home's Monk Mode row can open the last finish instead of the setup
- **Where:** `web/ui/focus.js` (the "Grow your aura" rows, around line 151) sends the Monk Mode row to view `monk`, which shows the finish while a finished session hasn't been seen.
- **Steps:** finish a Monk session while away from Focus, open Focus, tap "Monk Mode" (not the "Monk Mode · done" card).
- **Expected:** the setup (the "done" card above it already opens the finish).
- **Actual:** the finish. Done then goes to the home, and a second tap opens the setup.
- **Suggested fix:** send the row to `focus` (the setup, or the timer while one runs), as monk.js asks.
- **Severity:** minor
- **Status:** Fixed · 22 Oct 2026 (was: Open). focus.js's Grow-your-aura Monk row now goes to "focus" unconditionally; the done card above still opens the finish.

### BUG-26: Calm's fallback leaves the 3D camera at chest framing
- **Where:** `startBreathing` (`web/ossa.html:8670`), the branch used only when Calm's own canvas fails: `Body.camTo` frames the chest and nothing puts it back after a session on the plain Focus screen.
- **Actual:** after such a session the 3D camera stays zoomed to the chest (zoom 2.05). The normal path doesn't move the camera. Found by reading the code while fixing BUG-20.
- **Severity:** minor (rare: only when the canvas fails)
- **Status:** Fixed · 22 Oct 2026 (was: Open). startBreathing's done handler calls `Body.camTo({zoom:1,px:0,py:0,yaw:0})` when the fallback path was used, so Focus returns to the opening framing.

### BUG-27: "Learn level 1" wraps in the Learn stat tile
- **Where:** the Learn tab's first stat tile, at 390 and 375 px wide.
- **Actual:** "Learn level 1" takes two lines. Nothing overflows (no sideways scroll).
- **Severity:** cosmetic
- **Status:** Fixed · 22 Oct 2026 (was: Open). polish.css gives `.rdp-stats .rdp-s.lv b` white-space:nowrap. (Current label is "Aura level"; it was still wrapping beside the 48 px ring.)

### BUG-28: The Monk time's-up notification can be lost in the last half minute
- **Where:** `web/ui/vessel.js` keeps the Monk item only while it is more than 35 s away (`lead`), and `native/reminders.js` cancels everything and skips items under 30 s on every sync. A return to the app forces a sync.
- **Steps:** start a session, then open and close Ossa within its last 35 s.
- **Actual:** no notification at the end. The session still finishes and credits on the next open, return or tap.
- **Severity:** minor
- **Status:** Accepted (Phase 3 decision). Lowering it further needs native code.

### BUG-29: A rank-up to "Unbreakable III" wraps on a small phone
- **Where:** `web/ui/ranks.js` `rkCelebrate` and `web/ui/ranks.css` (`.rk-up-tier`). Found by the Phase 5 verifier; it predates Phase 5, but prestige makes 94 a goal, so more people will reach it.
- **Steps:** on a 375×667 phone, rank a muscle up to Unbreakable III (93 → 94).
- **Actual:** the tier word wraps to two lines (91 px instead of 46) and "See all your ranks" is pushed below the screen (684/667 on its own, 711/667 as the second of three steps).
- **Severity:** minor
- **Status:** Fixed · 22 Oct 2026 (was: Open). `.rk-up-tier` is white-space:nowrap and drops to --fs-6 at max-height:700 px (ranks.css).

---

## Logged in Ossa 2.0 Phase 6, Challenge (17 Oct 2026)

Found while building weather dares. Line numbers are from 17 Oct; re-grep before using them. Copy and safety calls are in DECISIONS (2026-10-17 Phase 6 Challenge).

### BUG-30: Lift dares dared a carry or a hold as "3 × 10", and could pass 1.5× the logged reps
- **Where:** `dareToday` (`web/ui/ranks.js:345-348` at 68c046f, now `web/ui/dares.js`). It took `MUSCLES[k].ex[0]` whatever its dose, and the 5-rep floor came after the 1.5× cap.
- **Steps:** demo save, with forearms or adductors fading (the demo has adductors fading at 13 days), on a lift-dare day.
- **Actual (before the fix):** "3 × 10 Farmer's carry at 22.5 kg" for forearms and "3 × 10 Copenhagen plank" for adductors. With a logged best under 4 reps, the dare asked for 5, more than Andrej's 1.5× rule allows.
- **Severity:** major (a dose that can't be done as written, and it broke the 1.5× rule)
- **Status:** Fixed · 17 Oct 2026, Phase 6
- **Fix:** the lift is the muscle's first exercise counted in reps: an entry whose dose reads like a hold or a carry (`/\d\s*s\b|max hold|\d\s*m\b/i`) is skipped (Forearms → Wrist curl, Adductors → Sumo squat). A muscle with only holds or carries gets no lift dare that day (a life dare instead). Reps are `min(round(best × 1.5), max(5, …))`, so they never pass 1.5× the logged best. Checked on the demo in the preview. Dares picked before the fix keep their text until the next day's pick.

### BUG-31: The weather gate can't see some hazards later in the 3-hour window
- **Where:** the phone's summary, `native/weather.js` `summarise()`, which `web/ui/wxgate.js` reads. `soon` has no fog, temperatures or per-hour rain maximum, keeps only the single worst symbol, drops a thunder probability under 30 %, and reads a missing rain amount as 0 mm.
- **Steps:** the 5 KNOWN cases in `node scripts/check-dares.js`: light rain 9 °C now with fog in the next hours; cloudy 4 °C now with a fog fraction of 80 next hour; cloudy 4 °C now and −1 °C in 2 h; fair 15 °C with a 25 % thunder probability (Nordic); cloudy 4 °C with every rain amount missing. Also heavy rain in one later hour (4 mm or more, under 10 mm over 3 h) when MET's symbol for it isn't heavyrain.
- **Actual:** each gives an outdoor dare (rain, cold or bright). Accept still needs a fresh re-summary, the safety line names the risk, and "Not today" is free.
- **Expected:** no outdoor dare.
- **Severity:** major (a safety margin), partly covered: the wet-ice rule (5 °C or below with any rain) sends sleet or snow hidden behind rain indoors.
- **Status:** Open, accepted for Phase 6. Needs native code (Build 10): add `soon.fog`, `soon.snow`, `soon.sleet`, `soon.tmin`, `soon.tmax`, `soon.thp` (the maximum thunder probability) and a per-hour rain maximum to `summarise()`, keep a missing amount as `null`, then tighten the gate. The check prints "now handled" when a KNOWN case starts being refused.

### BUG-32: The place check looks at longitude only
- **Where:** `dwHere` in `web/ui/wxgate.js`: a place counts as yours when its solar noon falls within 12:00 ± 3.5 h on the phone's clock.
- **Steps:** a London phone with the typed town Accra, at 16:45 on 10 December.
- **Actual:** Accra's daylight passes, so an outdoor dare can be accepted in the user's own dark. A typed town up to about 3 time zones east or west can do the same.
- **Severity:** minor (it needs a typed town far from you; the town is named on the card and the page, and quiet hours, 06:00–21:00 on the phone, cap the worst of it)
- **Status:** Accepted. There's no fix on the web side without the phone's own position.

### BUG-33: A typed town that comes back by name only replaces a working place
- **Where:** `nvTown` in `web/ui/native.js` writes `S.wx` before `web/ui/wxplace.js` can refuse a name-only result (Android's needs-permission path).
- **Steps:** weather dares on with a place that has coordinates; on a phone that looks towns up only with location allowed, type a different town.
- **Actual:** the new name-only place replaces the working one, the page says "This phone looks towns up only with location allowed.", and weather dares show Off until a place with coordinates is set.
- **Expected:** the working place stays.
- **Severity:** minor (Android only, which isn't shipping)
- **Status:** Fixed · 22 Oct 2026 (was: Open). nvTown (native.js) keeps the current place when the geocode comes back name-only and returns `{ok:false, saved:"kept", why}`; wxplace.js surfaces the reason.

### BUG-34: Turning weather dares off can't reach the phone's own copies
- **Where:** `native/weather.js` keeps its forecast cache (`ossa-wx-v1` in AsyncStorage: rounded coordinates and 48 hourly steps). Separately, a location or town request already sent to the phone can't be withdrawn.
- **Steps:** "Turn weather dares off"; or tap "Not now" or ✕ while "Finding you…" runs.
- **Actual:** the phone's cache stays until the next place replaces it. A late reply is still saved to `S.wx` by native.js. Weather dares never switch on after a cut or a close, and after "Turn weather dares off" the late place is forgotten again.
- **Severity:** minor (privacy: the cache never leaves the phone)
- **Status:** Accepted for Phase 6. Clearing the phone's cache needs a bridge message (native work).

### BUG-35: A hand-ticked dare row can't be unticked
- **Where:** `drView` in `web/ui/dares.js` gives a done row `tap:null`, so `web/ui/darepage.js` draws it as plain text.
- **Steps:** accept a Headwind dare, tick "5 minutes into the wind" by mistake.
- **Actual:** the row stays ticked. (The brief had hand rows toggle.)
- **Severity:** minor (it only brings Done closer; the honour rule already lets Done tick the rest)
- **Status:** Fixed · 22 Oct 2026 (was: Open). drView gives a done row with no auto source (`!o.src`) tap:"tick" (dares.js), so hand-ticked rows toggle. Tracked rows (steps/water/breath/flow) stay led by their reading.

### BUG-36: A Daylight walk title is cut next to its step count at 375 px
- **Where:** the dare page's rows (`.dp-row`, `.dp-prog` in `web/ui/darepage.css`).
- **Steps:** a 375 px wide phone: accept with `?wx=bright&steps=0`, then reload with `?wx=bright&steps=1240`.
- **Actual:** "15-minute walk outs…" next to "1,240 of 1,500": the title needs 181 px and has 174. Rain and Cold (1,000 steps) can show it only for a moment, before the row ticks.
- **Severity:** cosmetic (the sub and the count stay whole)
- **Status:** Fixed · 22 Oct 2026 (was: Open, partly addressed). At max-width:380 px, `.dp-row.dp-pg .dp-rt b` spans columns 2/4 and `.dp-prog` moves to the sub row (darepage.css); the title keeps the full row and the count stays tabular and nowrap under it.

### BUG-37: The dare page doesn't move on by itself
- **Where:** `web/ui/darepage.js` redraws only on events (`dare`, `day`, Health, `fg`), because views may not poll.
- **Steps:** leave the dare page open past sunset, or over midnight.
- **Actual:** past sunset the page catches up on the next event (a tap, a return to the app, a Health read). Over midnight it shows "Today's dare isn't a weather dare." until Home picks the new day's dare.
- **Severity:** minor (Accept re-checks the forecast, and every action re-checks the day)
- **Status:** Accepted.

### BUG-38: The Body page shows the body closer up on its first visit than after a tab change
- **Where:** `web/ui/shell.js` `drawTabs` toggles the Body page layout class `rdx`, which moves the bottom bar up; `setTab("body")` reframed before that class was set, so the first frame used the old, lower floor (the body looked bigger), and the next visit used the real one (smaller).
- **Steps:** open the Body tab from Home, go to Train, come back.
- **Actual:** the body is noticeably bigger the first time, then shrinks.
- **Severity:** cosmetic
- **Status:** Fixed 2026-10-18. `drawTabs` reframes the body whenever `rdx` flips, so the first visit is framed for the real layout.

## Logged on the Train redesign (18 Oct 2026)

### BUG-39: A quick session's record carried its planned minutes in the title
- **Where:** `rdtQuick` titles a session "Lower · 20 min"; `finishWorkout` saved that as the record's title next to the real minutes, so Past sessions showed "Lower · 20 min" over "1 min".
- **Severity:** cosmetic
- **Status:** Fixed 2026-10-18. `vxTitle` (vessel.js) drops the " · N min" when the record is saved; `densTitle` (density.js) drops it from records saved before.

### BUG-40: "Trained today" over "Recovery day" with a play button
- **Where:** the old `rdTrainHub` set the cap from `done` and the title from `rec`, and on a rest day after a quick session both were true.
- **Status:** Fixed 2026-10-18 by the new Train hub (deck.js): a done day shows the Done card, a rest day the Recovery day card, never both.

### BUG-41: Sessions were counted against the default plan's days, not yours
- **Where:** the old hub counted planned days from `PLAN` (five without Pro) while the Your plan row read `S.program.a.days` (four).
- **Status:** Fixed 2026-10-18. The Week tile and the Your plan row in More both count days with a session (`sessionForDay`), so they agree.

### BUG-42: "7/23 ready" next to "3 shown + 12 more recovering"
- **Where:** `trRecoveryHTML` counted only trained, recovered muscles as ready and said "everything else is ready", leaving new and fading muscles out of the sentence.
- **Status:** Fixed 2026-10-18. The sentence says how many aren't trained yet; the Train hub's Ready tile counts every muscle that isn't recovering.

### BUG-43: The workout showed through the Body page after leaving it running
- **Where:** a minimised workout's rest running out called `tick` → `drawTrain` → `drawActive`, which toggles `.tactive` on the app whatever page you're on, so the workout view (`.app.tactive .trainv`) showed through the Body page's hero and the body was reframed for the workout. Seen on Andrej's Samsung, 19 Oct.
- **Status:** Fixed 2026-10-19 (workout.js): `drawActive` draws only in train mode; the Train tab draws the workout again when you come back. A toast says "Rest over. Tap Train to carry on."
