# Decisions Log

Format: date · decision · who disagreed · why

---

**2026-10-04 · New UI layer inside the WebView, not a native rewrite**
- Who disagreed: `AGENTS.md` asks for Expo Router and native screens.
- Why: the 3D body, scoring, plans and workouts are web code that already works. Rebuilding the layout, design tokens and onboarding as clean files in `web/ui/` gets the new experience shipped in days rather than weeks, and keeps one codebase. See `docs/UI-SYSTEM.md`.

**2026-10-04 · Onboarding cut from ~26 steps to 9, with a reveal**
- Who disagreed: none yet. The longer quiz fed body age and a richer report.
- Why: time to first value. Questions that don't change the first plan (sleep, stress, food) moved to Today as one quick question a day. The fitness tests and posture scan moved to the Body tab. The reveal only states findings from answers we actually have.

**2026-10-04 · Four tabs (Today · Body · Train · Learn), Profile behind the avatar**
- Who disagreed: none.
- Why: "You" and "Profile" sat side by side and meant different things. Settings and progress are visited rarely. The body, training and learning are visited daily.

**2026-10-04 · Muscle detail uses heatmap regions, no sub-muscles**
- Who disagreed: none yet. Andrej's "teach users about their body" direction could argue for deeper anatomy.
- Why: one data model for map, heatmap and detail means the status can never be inconsistent. Depth can be added later per region.

**2026-10-04 · No exercise video, GIFs or animations in V1**
- Who disagreed: anticipated from Theo/Andrej (premium, "cleanest visuals" positioning).
- Why: producing and licensing demos for every muscle would blow the sprint. Three text exercises with one cue each deliver the "what do I do next" value.

**2026-10-04 · Ossa character lines are scripted, not AI-generated**
- Who disagreed: none yet. AI coaching is a likely future ask.
- Why: no backend, no latency, offline-safe, and the voice stays controlled. The character gets personality now without the cost or risk of an LLM.

**2026-10-04 · Social, sharing, favourites and notes are out**
- Who disagreed: none.
- Why: none of these serve the core loop (log, heatmap, Today) for a solo self-improvement user in V1.

**2026-10-04 · No logging or "add to workout" from the detail screen**
- Who disagreed: anticipated from Theo (it would make the screen more actionable).
- Why: a second logging entry point doubles the QA surface and risks conflicting with the existing log flow. We'll revisit once the plan generator ships.

**2026-10-04 · Per-muscle history charts deferred to the Progress milestone**
- Who disagreed: none.
- Why: Andrej's build order puts progress after muscle screens. V1 shows only "last trained" and "sets this week".

**2026-10-04 · Paywall gating of muscle detail not decided here**
- Who disagreed: none.
- Why: belongs to the onboarding/paywall milestone. Build it ungated so it can be gated later without a rework.

**2026-10-04 · Status labels stay "Fresh / Recovering / Ready"** (decided by Andrej)
- Who disagreed: Theo, who proposed "Just trained / Recovering / Ready".
- Decision: Andrej sided with Maya. To limit confusion, the meter and hint line ("Ready in about N days") carry the meaning, and no copy uses "fresh" to mean rested.
- Theo's original reasoning: in gym language "fresh" means rested and ready, so putting it on a just-trained muscle tells users the opposite of the truth and could push them into training a recovering muscle. The heatmap legend has to use the same words so the labels never disagree.

**2026-10-04 · Status is shown as word + 3-segment meter + colour, never colour alone**
- Who disagreed: none.
- Why: the status has to be readable for colour-blind users, in greyscale and to VoiceOver. The colour still comes from the heatmap tokens (no new colour tokens). The meter pill is the only new non-colour component.

**2026-10-04 · The sheet and the heatmap share one status function**
- Who disagreed: none yet (it may cost Raj a refactor if the heatmap logic is inlined).
- Why: two separate calculations will drift apart eventually. Sharing one function is the only real guarantee of S3's "never disagree".

**2026-10-04 · Four Ossa lines per muscle, not three**
- Who disagreed: none. It's a gap in the spec, flagged to Maya.
- Why: the "Not trained yet" neutral state needs its own encouraging line. Reusing "Ready" would be confusing for a muscle the user has never trained.

**2026-10-04 · "Add to workout" stays cut (Theo agrees)**
- Who disagreed: none. Theo had been expected to object but agrees.
- Why: swiping down returns the user to the heatmap, which already is the next action. We'll revisit if testing shows users stalling at the bottom of the sheet. Exercises are styled as plain text so they don't look tappable.

---

**2026-10-15 · Redesign: the Symmetry-inspired look Andrej approved in the mockups**
- Who disagreed: none. Andrej: "make it like that with your recommendations, everything."
- What: near-black green-grey surfaces, bone-white for the one main action, lime for progress and "ready", Archivo 800 wide headlines, Geist and Geist Mono. Applied through `tokens.css`, the components, and a one-off remap of the legacy CSS so the older screens match.
- Why: one confident look across the whole app instead of the new layer on top of older screens.

**2026-10-15 · Five tabs: Body · Train · Breathe · Recover · Learn**
- Who disagreed: the 2026-10-04 decision (four tabs: Today · Body · Train · Learn).
- Why: Andrej's own plan was Train, Breathe, Recover, Learn; the mockups added Body as home. Home now starts with your body (ranked) and today's one thing, so "Today" and "Body" became one tab. The 3D body opens from Home and stays under the Body tab. Breathe is the existing breathing tool; Recover gathers what already existed (recovery status, mobility, aches, desk reset, posture, wind-down).

**2026-10-15 · Muscle ranks on the existing muscle score, five tiers with three levels**
- Who disagreed: none. Replaces Dormant / Awake / Trained / Strong / Elite.
- Why: one data model, nothing new to track, and a level-up every couple of sessions for a muscle you train. Ranks never drop; neglect shows as fading on the body, not as a lost rank (no punishment).

**2026-10-15 · The streak counts days you kept your plan; planned rest days never break it**
- Who disagreed: none. The old `S.streak` counted training days and never reset, but was labelled "day streak".
- Why: honest and kind. Missing a training day breaks it; resting when the plan says rest doesn't. Today can't break it until it's over.

**2026-10-15 · Dares follow Andrej's rules exactly** (see UI-SYSTEM.md)
- Who disagreed: none.
- Why: the rules were already decided; this is the first version. No XP yet (Ossa has no XP system), so a done dare is just marked done.

**2026-10-15 · Onboarding: aches get their own step, two "sounds like you?" statements, a building-your-plan moment, a signed promise**
- Who disagreed: the 2026-10-04 decision dropped the commitment hold.
- Why: the mockups Andrej approved bring it back as a promise you sign, after the reveal, skippable, and it feeds the 12-week line the body already says. The relatability answers only change wording and one finding; they never invent facts.

**2026-10-15 · Paywall: the free week as a timeline, the billed price most prominent**
- Who disagreed: none.
- Why: clearer than the old three-column strip, and Apple wants the billed amount to be the most prominent price. Prices still come only from the App Store.

**2026-10-15 · Native widgets unchanged for now**
- Why: the widget layouts are native code that can't be checked without a device build. The streak screen previews the rank-body widget; building it is the next native task.


**2026-10-15 · The Body page shows your own 3D body, standing still**
- Who disagreed: the morning's version used a flat 2D drawing; Andrej asked for his 3D body instead, then for it to stay still.
- Why: the 3D body is what Ossa is. On the Body page it doesn't sway, breathe or turn; Front and Back turn it. Tapping a muscle picks it (it lights up, the rest steps back, its name points at it and the card shows its rank); tapping it again or an empty spot lets go. The falling-stars background is off there so the figure is easy to see. The full 3D view still has everything (cube button, or the card under the body). Phones that can't draw 3D get the flat figure.

**2026-10-15 · "‹ Body" on Workout complete goes to your body, after the rank-ups**
- Who disagreed: none. It used to do nothing (a bug Andrej hit).
- Why: leaving shouldn't skip the moment you earned. Continue still goes back to Train.

**2026-10-15 · Motion, from what the top earners do** (researched on ScreensDesign: Liftoff, Symmetry, GymStreak, Gravl, Luvu, Yazio, BetterMe)
- Rank-up: light rays turning behind the badge, embers, the tier name in its colour, the points bar filling, story segments when there's more than one, confetti for a new tier.
- Streak: after your first workout of the day you light the flame yourself (it lights itself after six seconds), the number rolls over and today's dot fills.
- Workout complete: a short confetti burst in lime and bone (gold with a personal best). A logged set flashes. The paywall button has a slow sheen; its timeline arrives one step at a time.
- Why: these are the moments people screenshot and come back for. Everything respects reduced motion and only moves transform and opacity.

**2026-10-15 · Onboarding reworked from what the top earners do** (ScreensDesign: MyFitnessPal, Flo, Runna, Yazio, BetterMe, LazyFit, Liftoff, Gravl, Symmetry, GymStreak, Luvu)
- Added: the rank ladder early (step 5), a line back after the aches, a Coach / Drill voice choice that sets the dares' tone, a 12-week projection of the weak link (an estimate from the app's own rank points, against "if nothing changes"), the plan summed up on the paywall, and a welcome-to-Pro moment after subscribing. Chapters on the progress bar.
- Kept: the hold-to-bring-it-online and hold-to-sign moments (the research's highest-rated pattern), the building-your-plan ring, the reveal, the trial timeline.
- Left out on purpose: testimonials, star ratings, user counts and "X% of users" claims (Ossa has none to show), discount wheels and countdown timers (pricing is Andrej's call), an in-onboarding rating prompt (needs a native module and a first build).
- Who disagreed: none. 14 steps became 17, about 30 seconds longer.
- The paywall's "Today" line and the Pro welcome name only what Pro unlocks in the code: the 12-week plan, weights that progress, and posture and body-check fixes worked into every week. Ranks, the streak and dares stay free. (The morning's paywall line said "every muscle rank, every dare", which wasn't true.)

**2026-10-15 · The daily check-in is one tap**
- Who disagreed: none. Andrej: the check-in was "wayyyyyy too long"; make it seamless or delete it.
- Before: ten questions, one at a time, on a page of their own (sleep, energy, mood, stress, focus, activity, food, water, soreness, caffeine).
- Now: one question on the Body page itself, "How do you feel today?", five answers from Drained to Charged. Tap one and you're checked in. Last night's sleep sits under it, filled in from Apple Health or your last answer (Change if it's wrong). The card then shrinks to one line that says what it changed: a short night or low energy makes today's session one set lighter.
- Why keep it rather than delete it: it's what makes the plan lighter on bad days, and it fills the Body Score and the Mind screen. One tap keeps that and loses the chore.
- What's no longer asked: focus, stress, caffeine, food, activity and soreness. Activity still fills in from steps, water has its own tile, aches have "Something aching?". The answer stands in for energy and mood; the Mind score averages only what was answered; insights about caffeine and focus only use days that answered them.

**2026-10-15 · Train redesigned from what the top training apps do** (ScreensDesign: Ladder, Hevy, Liftoff, Fitbod, Gymverse, Strong, Gravl, Lyfta, MacroFactor Workouts, Symmetry)
- Who disagreed: none. Andrej asked for the research and for the redesign.
- Session screen: the old orange Start button and loose layout became the new look: the numbers up top, the muscles it works in their rank colours, Insights on every exercise, a bone Start. It fits the phone so Start always shows.
- Exercise insights: every lift gets its own chart (estimated 1-rep max), records and recent sessions. Free, like ranks. Strong puts charts behind Pro; Ossa doesn't.
- In the workout: an exercise strip so a busy machine doesn't stall you (it reorders rather than jumping, so "everything before the current exercise is done" stays true); plates per side for barbell lifts; an effort check after each exercise that sets next time's weight. The check is optional and one tap.
- Hub: Recovery (which muscles are ready) and Your lifts (trend and estimated 1-rep max).
- Left out on purpose: social feeds, leaderboards against other people and share cards (Ossa has no accounts), video demos (Ossa shows each move on your own 3D body instead), calorie estimates (not measured, so not shown).
- The demo now has six weeks of history on five main lifts so the charts have something to show. Real users start empty.

**2026-10-15 · "Train this muscle" opens that muscle's session**
- Who disagreed: none. A bug Andrej hit: the button built the session but Train showed its overview (the hub), so it looked like nothing happened.
- Now it goes straight to the session screen for that muscle or region, ready to start. At the gym it's the muscle's own exercises; at home it's bodyweight only: the muscle's home move, its other no-kit exercises, and for a single muscle its stretch to finish (`trSessionFor` in train.js).


**2026-10-16 · Bones › a joint › "Relief routine" opens that joint's routine**
- Who disagreed: none. Andrej asked for it, and reported a bug: after a relief routine, going back to Body and tapping the 3D body showed the relief routine again.
- Before, the button opened the ache picker, which mapped elbows to wrists and ankles to knees, and its Start showed the Train overview (the hub) instead of the routine.
- Now each of the eight joints (neck, shoulder, elbow, wrist, lower back, hip, knee, ankle) has its own four-move routine (`JOINT_RELIEF` in train.js), opened straight in Train, ready to start. Each move says why it's there, and the routine's cause sits where the recovery line usually goes.
- The ache picker's Start now opens its routine too.
- The bug: a closed sheet kept its old contents, and a tab tap didn't close panels open over the same tab. Now a closed sheet empties itself, a sheet with nothing selected closes rather than showing old contents, and any tab tap closes open panels and sheets.

**2026-10-16 · The "Body as a Character" redesign: four ground rules (Andrej)**
- Social (Clan Vessel, Mirror Match): dropped for now. Ossa stays account-free, with everything on the phone.
- Health-sounding numbers on the designs (meniscus stress, protein synthesis %, injury-risk %): shown as real logged data with game names, e.g. "92 g of 140 g protein" or "You flagged your left knee". Never as measurements the app can't make.
- iOS limits: simple versions. Monk Mode points to iOS Focus. The recovery nudge is a reminder about 45 min after a workout, not geofenced. Ideal Self is a wireframe over the 3D body, with no camera. Weather dares use rough location.
- Version 1.0: held until the redesign is ready. Build 8 stays attached in App Store Connect, with the new listing saved but not submitted.
- The current 3D body stays as the character.

**2026-10-16 · Ossa 2.0 Phase 0: the new look** (Andrej: "go, do phase 0", with Claude's ticked picks from the plan)
- What: pure black and charcoal surfaces, bone for the one main button, neon lime #D4FF00 for progress, ready and finish moments, cyan for the mind, gold for prestige, pulse red #FF3B30 for sore spots, and the brief's rank colours (Unbreakable #00E5FF, Forged #FFD700, Strong #FFFFFF, Stable #C5A059, Fragile #4A4A4A). Inter replaces Archivo, Geist and Geist Mono. Glass panels, hexagon badges, italic 900 impact headlines.
- Main button: bone for the one main action on a screen; lime for finish, accept and reward moments; cyan for Focus; gold only for prestige. No pure-white buttons, so text and buttons stay distinct.
- Strong stays pure white, on the 3D body too. A picked muscle now gets a lime edge so it can't be read as a Strong one.
- Fragile stays #4A4A4A. Its 2D marks get a thin #6B6B6B outline so they reach 3:1 on black; the 3D body uses the colour as it is.
- Recovering keeps its own amber (#FFB547). The design's tan is the Stable rank colour and would read as a rank.
- The smallest text stays 12px. The designs' 10px and 8px labels fail contrast; capitals, tracking and weight give their look.
- Scope: the colour, Inter and black pass reaches every screen. The six designed screens (Body, Muscle ranks, Rank-up, Workout, Streak, Recover) and the tab bar were hand-tuned. Onboarding and the paywall were checked at 390×844 and 375×667. Copy is unchanged; the design's shorter aches line was not taken.
- Body Score pillar colours (Claude's call, not one of the plan's questions, easy to change): Move lime, Recover blue #7FA6FF, Fuel orange #FF6B00 (the fueling design's), Mind cyan.
- The 3D body reads its rank colours from tokens.css, so the shader and the UI can't drift apart.
- A body-effects foundation in the 3D engine: hook points for later effects (sore spots, aura, materials), a fallback so a broken effect leaves the normal 3D body rather than the flat 2D one, and an in-place rebuild when iOS drops the 3D context. Nothing visible changes.
- The neon-edge body (rank colour on the muscle lines, darker fill, closer to the renders) was shown as a preview. Andrej chose the plain rank colours, so the neon preview code was removed.
- The workout steppers now show the value they change (before: only − label +).
- Safety: folder backup `C:\Ossa\backup-before-redesign-v2-2026-10-16`, a git baseline commit on `master`, Phase 0 on the branch `redesign-v2`.
- Who disagreed: none.
- Correction to the 2026-10-15 dares entry ("Ossa has no XP system"): Learn already has XP and levels (`S.learn`). Phase 3 decides how aura XP sits next to it.

## 2026-10-16 · Fixes from Andrej's Android recording
- Breathe tab: opens straight onto the breathing page, with no zoom into the head (Andrej's call). Other ways into the mind (the Mind pillar, focus) keep the zoom for now.
- Workout screen: one column from top to bottom (bar, exercises, the exercise, the sets) instead of a header pinned to the top and a panel pinned to the bottom. They overlapped on his Samsung. The name is one size smaller, the muscle chips stay on one row and the "first time" note is a slim line. A very short screen scrolls instead of overlapping.
- Muscle and region sheet: its peek height now fits what it shows, so "Train this region" is never cut off at the bottom.
- The round cog in the recording is Expo Go's own dev-tools button. It isn't in the real app.

## 2026-10-16 · A plain workout page
- Andrej asked for a workout screen that is "simple, fully functional and practical", with the 3D body removed if needed. The workout is now a plain black page: the bar, the exercise list, a card with the exercise, the set table and steppers, and the Log button at the bottom.
- The 3D body is hidden during the workout. Watch still works: it shows the move on the body full screen, then returns by itself or with "Back to sets".
- Workout complete now scrolls. It was a fixed full-screen box, so a long summary (personal best, rank points, sets) cut off the Continue button.

## 2026-10-16 · Phase 1 Vessel Engine
- What: the engine under the body. One file, `web/ui/vessel.js`, now owns rank points (RP), the workout history, fading, recovery, sore-spot flags and the hooks later phases use. Sore spots is a screen of its own (`web/ui/injury.js`).
- Who disagreed: none. The calls come from the Phase 1 plan; "Andrej to confirm" marks the ones he hasn't seen yet.

**Rank points**
- (1) Each exercise's helper muscles and their weights come from the weights file (`docs/redesign-plan/phase1-exercise-weights.json`, 83 exercises, the `EXW` table). Bench gives front delts 20% (the file), not the 50% in the plan summary. Andrej to confirm.
- (2) Slot credit: an exercise picked for a muscle gives that muscle 100%. If that isn't the exercise's usual main muscle, the usual one becomes a 60% helper. Push-up plus picked for pec minor: pec minor 100%, serratus 60%.
- (3) Helper cap: as a helper, a muscle gets at most 1.8 load a session (half of a 3-set main lift). Close-grip bench plus dips give the chest 1.8, not 5.8.
- (4) Scores stay whole numbers. The leftover part of a point is kept per muscle (`S.rpCarry`, −0.5 to +0.5) and counts next time. The muscle you trained always gets at least +1, even at high scores where the maths says less (a small gift, accepted).
- (5) Stretches, mobility moves, posture drills and joint-routine moves earn no RP and put no load into recovery. They still tick "done today" and count for the streak. Quick-logging one says "Doorway pec stretch logged · stretches earn no RP". A name that is also a training exercise stays a lift (Dead hang) unless it says "stretch". In the posture programme and Pro's body-check fixes, the drills (chin tucks, cat-cow, stretches) earn no RP, but real lifts in them (inverted row, glute bridge, band pull-apart) do (Claude's call after the Phase 1 review).
  - Light helpers (under 30%) start no recovery window, but they get a tiny marker in the log so they count as trained. Without it, a muscle that just earned RP as a light helper showed as "Fading · over 60 days" (found in review).
- (6) Recovery: the main muscle gets the sets, helpers weighted 30% or more get 0.4 × the sets, lighter helpers nothing. Four sets of bench start a recovery window for triceps, not for front delts or serratus.

**Overall and rank-ups**
- (7) The overall number is now "RP average" ("43 RP average"), not "Muscle score". When the overall rank goes up, it's the last segment of the rank-up ("Your body ranked up"), and Workout complete leads with an Overall row.
- (12) Rank-up order: the muscles you trained, in the order you trained them, then helpers by gain, then overall. At most three muscle segments; the third says "And N more muscles ranked up".
  - The Workout complete header stays "+N RP · n rank-ups". The Overall row says it already, and a suffix would wrap at 375 px.
  - Rank-ups now also show on phones without 3D (the older Workout complete page).
  - "Sessions to the next rank" and the 12-week line in onboarding use the exact expected gain now (no rounding). Some move by one: Stable I at 22 is now 7 sessions to Strong, not 6.

**Fading**
- (8) One rule: a muscle starts to fade 10 days after you last trained it and is fully faded at 21 (`NEGLECT_DAYS`, `FADE_FULL_DAYS`). Before, the sheet said "Neglected" at 7 days, the body faded from 10 and dares waited 21. Ranks still never drop.
  - The word is "Fading" everywhere. "Neglected" is gone.
  - On the body, a fading muscle's rank colour turns greyer (60%) and darker (30%) at full fade. A fully faded Strong (white) still reads about 1.8× brighter than Fragile.
  - A flagged muscle doesn't fade, on the body or in the counts. Days spent flagged don't count as idle.
  - Lift dares now pick a fading muscle (10 days, not flagged, not recovering) instead of waiting 21 days.
  - "Ready" on Recover and the Train hub counts only trained, recovered, non-fading muscles. Fading muscles get one line: "Adductors fading: not trained for 13 days."

**Sore spots**
- (9) Names: "Sore spots" and "Flagged". A flag pauses fading for that muscle (or for every muscle around a flagged joint) and keeps it out of dares, nudges, the weak link and the week review's "Wake up" focus. Plans never change: plan rows only get a "Flagged" tag.
  - Side is your own side. Your left knee shows on the viewer's right from the front (proved on screen for both figures). Neck, lower back and abs are always both sides. Flagging left, then right, becomes both.
  - "Not sore now" clears a flag; a cleared flag is forgotten after 60 days.
  - Which rows get the tag: the exercise's main muscle is flagged, or a joint around it, or the joint it loads (a shoulder flag tags bench, a lower back flag tags crunches). Relief, mobility and stretch moves are never tagged. The row's why line reads "You flagged your left knee. Go easy, or swap it."
  - "Relief routine · Left knee" opens that joint's routine. A muscle flag opens the routine for the joint it works around. The physio/GP line stays.
  - Copy never says injury, risk, alert, compromised or vulnerable.
  - Entry row on Body and Recover: "Sore spots · 2 flagged · Left knee, Lower back", or "Something aching? Flag it, or find the likely cause." when nothing is flagged. Muscle sheets get "Flag as sore", joint sheets "Flag it".
  - The screen opens over the 3D body (the 3D tab), see-through, with the rest of the body muted grey. Back returns to where you came from. Open item: the 3D tab's starry background shows behind it, where the design has plain black.
- (10) The Body page stays still: flags show as steady red. Red pulses only on the Sore spots screen, and not with reduced motion. A flagged joint's ring in the Bones layer is red, with no animation.

**Muscle ranks**
- (11) The FRONT and BACK cards are stills of your own 3D body in rank colours, with no red (red isn't a rank). Tap one to open the 3D body on that side. Phones without 3D get the flat figure, with fading parts drawn lighter. Rows get "Weak link", "Fading" and "Flagged" tags. The weak link skips flagged muscles.
  - The cards keep the Phase 0 size (figure 240 px tall), not the design's smaller one: a smaller 3D figure loses the muscle detail. The hero badge matches the design (64 wide).

**Saved data**
- (13) Every workout keeps a record: title, minutes, sets, volume, start and end, kind, each exercise (sets, reps, kg × reps, top weight, hold), RP per muscle and load. Records are kept 400 days; past the newest 120 they keep only the summary. Lifetime totals live in `S.tally`, so the session count no longer stops at 90.
- (14) Save safety: the save is stamped version 2. Your pre-2.0 save is copied once to `corpus-v4-pre2`. A save the app can't read goes to `corpus-v4-bad` instead of being lost. If the phone runs out of space, old records are slimmed first (past the newest 30), then the two backup copies go. The demo save is about 21 KB.

**Demo and reset**
- (15) Reset clears everything, including sore spots and the two backup copies. Andrej to confirm the backups part.
  - Load demo data and Reset both keep Pro, reminders and your programme.
  - No copy is made before demo data replaces yours; the only copy is the one-time pre-2.0 one. Andrej to confirm.
  - The demo keeps its scores (43 RP average, Strong I, 4 to Strong II; tibialis Stable I is the weak link; glutes 51), with 15 workouts, 49 sessions, a left-knee flag (2 days ago) and a lower-back flag (yesterday). Adductors fade at 13 days rather than 15: the demo's workout dates have no day 15. Push-up plus was added on day 4 so pec minor has a history (BUG-09). Open item: the demo's streak shows 1 day, because its workout dates have gaps.

**Fixes**
- (16) "Logged today" ticks now reset when the app comes back after midnight (BUG-06). Also fixed: BUG-01, 02, 03, 05, 08, 09 and 10 (see `BUGS.md`).
  - The Recover card keeps "Fresh" for a muscle you haven't trained, per the 2026-10-04 "Fresh / Recovering / Ready" labels. BUG-04 ("Fresh" meaning two things) stays open; it wasn't part of Phase 1.

**Deferred to Phase 2 (logged only)**
- (17) Pec minor shown as "Upper chest"; tibialis, soleus and erectors aren't in any split; the kit and movement-pattern tag rules; exercises whose main muscle looks wrong.

**Spikes**
- (18) The seated Monk poses and the Tank/Scout body shape are desktop experiments only (`?spike=monk`, `?spike=shape` on localhost). The build leaves them out of the app (`ossaHtml.js` has no trace of them).

**Smaller calls made while building**
- Train's session chips show "+N RP" per muscle (what finishing every set earns), biggest share first. A helper under 1 RP shows its name only. Mobility sessions show the muscles with no RP. Short phones still hide the chips (the existing rule).
- The Body page card reads "Fading · 13 days", "Flagged · fade paused", "Recovering · 37%" or "Ready to train". A flagged muscle reads "Flagged · fade paused" even while it's recovering.

**Check on a phone (Expo Go) before these ship:** the 3D body still draws with the sore-spot effect on, the rank card stills, and the cards' blend over glass.

## 2026-10-16 · Breathe switches like any other tab
- Andrej: tapping Breathe should feel like the other tabs. It now opens and closes instantly, with no fade and no slide (the head zoom was already gone).

## 2026-10-16 · Phase 2 Train
- What: three new Train screens (Exercises, Kinetic chain, Where your sets went with Past sessions), the exercise data behind them, and the native batch for Build 9: bridge v2 (haptics, keep-awake, approximate location, MET Norway weather), app config (launch screen, permission strings, notification colour) and widgets in rank colours. File map: `UI-SYSTEM.md`.
- Who disagreed: none. Andrej: "do all of your picks and the recommended ones". "Andrej to confirm" marks wording and calls he hasn't seen yet. Every job line and zone sentence below is Andrej to confirm.

**The screens**
- (1) Names: "Exercises", "Kinetic chain", "Where your sets went". No share buttons.
- (2) **Exercises** opens from a Train hub row ("Exercises · 124 movements · 2 muscles to wake up"). Search, type chips All / Compound / Isolation / Mobility (the chosen chip is lime), Home/Gym (the same app-wide switch as the hub), Recommended, the 7 muscle groups, then every movement. The tab bar stays visible. A row opens Kinetic chain.
  - Search ignores hyphens, case and apostrophes ("push up" finds Push-ups) and knows a few other names (see Wording).
  - Recommended: up to three muscles idle 7+ days, then never-trained muscles this week's plan doesn't reach, else the weak link. Never a flagged muscle, a muscle whose lift loads a flagged joint, or anything today's session already trains. Each card shows the lift "+" adds, as today's session would then hold it (after a "Lighter today" trim or a time limit), the RP that exact dose gives (`vxPreview`: what Workout complete then credits, so 4 sets for bench, RDL and squat) and the next level ("Strong II in 3 sessions", counted with the same rank-point maths as Workout complete).
  - "+" is only on Recommended. It adds the lift to today only, never twice, toasts the real lift name, turns into a lime tick, uses the soft haptic (a short buzz on older builds) and is hidden during a workout. The whisper's "Add to today" goes through the same path.
  - Group counts use the union rule: a movement counts in the group of its main muscle and of every muscle that lists it, so a card's number is exactly the rows it shows (Gym: Chest 16, Back 22, Shoulders 21, Arms 20, Legs 31, Glutes 12, Core 15; Home: 9, 11, 8, 9, 20, 7, 9). "All movements" lists each name once, under its main group. In a group or muscle filter a row is labelled with the muscle that lists it there: Dips under Chest reads "Pec minor" and opens the chain for pec minor (slot credit).
  - The 21 moves that live only inside routines (posture scan, joint relief, body check) aren't listed, and search skips them.
- (3) **Kinetic chain**: front and back stills of your own 3D body with the main muscle lit and the helpers dimmer (`Body.shot` with a mask; the flat figure without 3D), a "Main" pill in the rank colour, the helpers with their share (the Phase 1 weights, `vxW`) and a plain job line, and "+N RP to {muscle} for 3 sets" (`vxPreview`). It opens from the workout's muscle chips, Insights, the muscle sheet's exercise rows and Exercises. The muscle a lift was picked for travels with it (slot credit). "View related lifts" opens Exercises filtered to the main muscle.
  - Stretches: "A stretch: no rank points. It still counts for your streak.", then a "Stretches" list of the muscles it stretches, with no %, no RP and no job line (the job lines say what a muscle does when it works; a stretch does the opposite), all lit at 0.6.
- (4) **Where your sets went**: one session, or "Your last 4 weeks" (the 28 days ending on that session's day, local dates).
  - A set counts fully for a muscle when it does at least 60% of the work there (`vxW` ≥ 0.6, slot credit included). Every number is a whole set and a muscle's zones add up exactly to its sets. Mobility moves and stretches count no sets.
  - Zones: chest upper / middle / lower, triceps long / other, biceps long / other (long = Incline dumbbell curl), hamstrings hip / knee. No quads zones. Incline push-ups count as middle chest, so lower chest is dips only. Other muscles get their region's split.
  - Past sessions on the Train hub (newest 4 and "All N", which opens the full list by month), right after Your lifts. A row on Workout complete opens the session you just finished.
  - Footnote: "A set counts for a muscle when it does at least 60% of the work. One set can count for two muscles. Zones come from the lifts you chose, not from measuring the muscle."
- (6) The workout page stays plain (Andrej's 16 Oct request) and the exercise name isn't enlarged. Its muscle chips are now buttons with a 44 px hit area (still 32 px to look at) that open Kinetic chain.
- Back closes only the top screen when several are stacked (Exercises, Kinetic chain, Where your sets went, Insights). A learn demo, the weekly review and the timeline keep their own back.

**Exercise data** (`web/ui/exdata.js`, checked by `scripts/check-exdata.js`)
- (5) Pec minor's friendly name is "Pec minor" ("Upper chest" is gone). Tibialis, soleus and erectors stay out of the splits: accepted, as Recommended picks cover them. No EXW weight changes in Phase 2.
- Kit (Andrej to confirm): two values. A lift is Home exactly when today's Home sessions can give it (EQX's bodyweight column, or BW_EX minus the train.js kit regex). Every stretch and mobility move is Home. Gym lists everything. 67 Home, 57 Gym only. This replaces the Phase 1 JSON's gym / db / bw kit column.
  - Kept as today's sessions have them, logged in BUG-15: Glute bridge, Dead bug, Walking lunge and Incline push-ups need no kit but are Gym; Back extension, Jump rope, Inverted row, Bench dips, Backpack curl, Farmer's carry and Doorway pec stretch need something but are Home. The band, anchor and wheel moves are Gym.
- Type (Andrej to confirm): mobility means it earns no RP (`vxIsStretch`); lifts are compound or isolation. 40 compound, 42 isolation, 42 mobility.
  - Compound includes Hip thrust and both glute bridges, Back extension, Rack pull, Face pull, Wide-grip upright row, Farmer's carry, Jump rope, Ab wheel rollout, Cable woodchop, Push-up plus and Bench dips.
  - Isolation includes Pallof press, Hanging leg raise, Dead hang, Wall slide, the Y and T raises, Band pull-apart and the holds (Plank, Side plank, Copenhagen plank, Dead bug, Bird dog).
  - Doorway pec stretch is mobility; Dead hang is a lift. Bodyweight squat (routine only) is a compound lift. "Supported deep squat hold" is tagged mobility but still earns RP (BUG-14).
- Pattern, one rule (Andrej to confirm; settles the Phase 1 JSON's pattern question): knee-dominant is squat, or lunge in a split stance. Hip-dominant is hinge, leg curls and moving the leg in or out at the hip included. The ankle doing the work is calf. Upper-body pushing and raising the arm in front or to the side is push. Pulling, upper-back raises, shrugs, curls and grip work are pull. A loaded walk is carry. Trunk holds and bends are core. No-RP moves are none.
  - The pattern follows the movement, not the main muscle: Walking lunge is lunge, Sumo squat squat, Rack pull hinge, Copenhagen plank and Bird dog core.
- Groups: erectors sit in Back and Core, so RDL, Back extension, Bird dog, Child's pose and Cat-cow show in both (as "Train something else" does). Only MUSCLES.ex, MX and EQX decide groups, not the routine tables (POSTURE_DAYS would move Thoracic extension into Back and Core).
- A movement's muscles (`exMuscles`) are its main muscle plus the muscles that list it, not the EXW helpers; helper shares stay with `vxW`. That list is what the stretch variant of Kinetic chain shows.
- List order: the main muscle's group, then compound, isolation, mobility, then name.
- Kit tags are written out, not worked out at run time (the Home regex is a local inside `trSessionFor`); the checker fails when they drift from EQX, BW_EX or that regex.

**Native batch (Build 9)**
- (7) Bridge v2 (App.js, `native/location.js`, `native/weather.js`, `web/ui/native.js`):
  - Haptics: nine styles (select, light, medium, heavy, soft, rigid, success, warning, error) and sequences of up to 8 steps. Only Exercises' "+" uses one (soft) in Phase 2; existing taps are unchanged.
  - Keep-awake on its own tag `ossa-awake`: 2 h by default, 4 h at most, released on a page reload and when the app closes.
  - Location is approximate only: iOS reduced accuracy, Android coarse with fine blocked, rounded to 2 decimals (about 1 km) before anything else sees it. The phone's own geocoder (Apple's on iPhone) names the place. It tries the last known position (up to 3 h old, within 20 km) first, then the current one at the lowest accuracy. It asks permission only when you ask for it. You can type a town instead.
  - Weather from MET Norway Locationforecast 2.0 `/complete`, fetched by the app itself, never by the page. User-Agent `Ossa/1.0.0 https://getossa.app` (the version from app.json), no other identifying header, cookies off, coordinates to 2 decimals. Kept for max(1 h, Expires) with Expires capped at 6 h, then refreshed with If-Modified-Since. A forecast under 6 h old is used, marked stale, when MET can't be reached. It only fetches while the app is open and the page asks. About 400 bytes reach the page. Sunrise and sunset are worked out on the phone.
  - New events: `bg` when the app goes to the background, and `fg` now says where it came from and how long you were away. `NATIVE.caps.v` is 2.
  - Browser preview and older builds: a typed town is saved by name only, and there's no live weather.
  - Credit in Settings › Open-source licences: "Weather data from MET Norway (CC BY 4.0)…" (wording below).
  - A hidden "Phone check" test panel (a Settings row and `ossa://phonecheck`) is on for Build 9. Turn it off before Build 10 (`nvCheck.on=false`): under Apple's rule 5.1.1 Build 10 must not ask for location until a visible feature (Phase 6 weather dares) explains it.
- (8) app.json (Andrej to confirm both strings):
  - Camera: "Ossa uses the camera for your posture scan. It's read on your phone and never uploaded." (the old string promised a fingertip pulse reading that nothing uses).
  - Location, when in use only: "Ossa uses your approximate location to show the weather where you are. You can type a town instead." `NSLocationDefaultAccuracyReduced` is true. No background location and no background modes.
  - Launch screen: black with the current mark (120 pt), held until the page says hello, a 250 ms fade (iPhone), a 4 s fallback.
  - Android notification accent: lime #D4FF00 (was mint).
  - Widget descriptions: "Your streak, your body in rank colours and today's session." and, for the small Android one, "Your streak and your body in rank colours."
  - Packages: one `npx expo install expo-location expo-keep-awake expo-splash-screen`. New native modules load through try/require, so Expo Go (iPhone and Android) and older dev clients never crash. Version stays 1.0.0. These need a new EAS build: Andrej's go.
- (9) Widgets in rank colours (iPhone and Android): the streak screen's promo (the streak, the weak link, your body in rank colours, your overall rank, today's session). Body Score leaves the widgets and stays in the app. Colours mirror tokens.css (rank colours, lime, black). Widgets use the system font (Inter can't reach a widget). Taps: the widget opens the streak (`ossa://streak`), the body Muscle ranks (`ossa://ranks`), the session pill today's session (`ossa://train`). This replaces the 2026-10-15 entry "Native widgets unchanged for now".
- (11) Privacy: declare Location › Coarse Location (App Functionality, not linked to the user, no tracking), because MET keeps the IP address and the coordinates of each request in its logs. Andrej sets this in App Store Connect and adds a location and MET line to getossa.app/privacy. The saved town (`S.wx`) is not kept through Load demo or Reset (revisit in Phase 6). No town or coordinates ever go to `track()`.

**Demo**
- (12) One Incline dumbbell press (3 sets) on the demo's Push day, so the chest split has something to show. The Phase 1 numbers in (15) still hold (43 RP average, Strong I, tibialis the weak link, 15 workouts, 49 sessions; checked in the preview). Only chest recovery and the set and volume tallies move a little.

**Logged only, no behaviour change** (10): session building reading `S.program.kit` / `.exp`, the HOLD and COMPOUND regex misfires (Hanging leg raise as a 45 s hold), "Supported deep squat hold" earning adductor RP, the kit oddities, and the Phase 1 (17) primaries a coach could argue with (Rack pull → traps, Walking lunge → glute max, Sumo squat → adductors, Prone Y-raise → traps). See `BUGS.md`, BUG-11 to BUG-17.

**Wording, all Andrej to confirm** (13)
- Job lines in Kinetic chain, one per muscle (`exJob`, 23):
  - Pec major "Pushes the arms forward" · Pec minor "Pulls the shoulder blade forward" · Serratus "Holds the shoulder blade to the ribs" (matches its sheet text) · Front delts "Raises the arm in front" · Side delts "Lifts the arm out to the side" · Rear delts "Pulls the arm back".
  - Biceps "Bends the elbow" · Triceps "Straightens the elbow" · Forearms "Holds the grip" · Abs "Braces the trunk" · Obliques "Stops the trunk twisting".
  - Traps "Steadies the shoulder blades" · Lats "Pulls the arms down and back" · Rhomboids "Squeezes the shoulder blades" · Erectors "Keeps the back straight".
  - Glute max "Drives the hips forward" (so it doesn't repeat the hamstrings' line) · Glute med "Keeps the hips level" · Quads "Straightens the knee" · Hamstrings "Straightens the hip" · Adductors "Pulls the legs together" · Calves (gastrocnemius) "Points the foot" · Soleus "Points the foot, knee bent" · Tibialis "Lifts the toes".
- Job lines for one movement, where the muscle does something else there (24 movements):
  - Lying leg curl and Nordic curl: hamstrings "Bends the knee", calves "Helps bend the knee".
  - Back squat, Goblet squat, Bulgarian split squat, Walking lunge: adductors "Helps straighten the hip". Sumo squat: adductors "Drives up from a wide stance".
  - Side-lying hip abduction, Banded lateral walk: glute med "Moves the leg out to the side".
  - Barbell shrug, Dumbbell shrug: traps "Shrugs the shoulders up". Hammer curl: forearms "Helps bend the elbow".
  - Hip thrust, Glute bridge: quads "Steadies the knees". Wall-sit calf raise: quads "Holds the wall sit". Dead hang: lats "Steadies the shoulders".
  - Added by Claude beyond the spec: Cable woodchop: obliques "Turns the trunk". Side plank: obliques "Stops the trunk bending sideways". Hanging leg raise: abs "Curls the hips up". Cable kickback: glute max "Drives the leg back". Back extension: erectors "Straightens the back". Standing calf raise, Single-leg calf raise, Jump rope: soleus "Helps point the foot".
  - When a lift was picked for another muscle, its usual main muscle's row starts "Its usual main muscle · ".
  - Lines are kept to 36 characters (the serratus line is 36).
- Zone labels (label · the work that trains it):
  - Chest: "Upper chest · incline work" (Incline dumbbell press, Landmine press, Front raise, Pike push-up); "Middle chest · flat pressing" (Barbell and Dumbbell bench press, Push-ups, Incline push-ups, Close-grip bench press, Push-up plus); "Lower chest · dips" (Dips, Weighted dips, Bench dips).
  - Triceps: "Long head · overhead work" (the overhead extensions); "Other two heads · pushdowns, dips and presses".
  - Biceps: "Long head · incline curls" (Incline dumbbell curl); "Whole biceps · regular curls" (Barbell curl, Hammer curl, Backpack curl). Not "Short head": regular curls train both heads.
  - Hamstrings: "Hip work · hinges and bridges" (the RDLs, Back extension, Rack pull, Hip thrust, the glute bridges, Walking lunge, Cable kickback); "Knee work · leg curls" (Lying leg curl, Nordic curl).
  - Lifts that help a zoned muscle at under 60% also have a zone, so the lookup always answers.
- Where your sets went, the screen:
  - Eyebrow "{Thu 15 Oct} · {session}". Title "Where your sets went". Summary "{19} sets · {52} min · {6,078} kg lifted"; mobility or posture "{Mobility} · {4} moves · {12} min"; 4 weeks "{12} sessions · {148} sets · {19 Sept} to {16 Oct}" (the sets that counted, so no stretch or mobility rounds).
  - Chip "Most work: {Chest} · {11} sets" / "Most work in 4 weeks: {Glutes} · {35} sets". Switch "This session" | "Your last 4 weeks".
- Where your sets went, the split:
  - Header "{Chest} · {11} sets" with "Zones" on the right, or for a region "{Thighs} · {32} {thigh} sets".
  - Zone line "{Upper chest} · {3} of {11} sets · {incline work}" ("1 of 1 set" for one). None: "{Lower chest} · none this session · {dips} train it" ("trains it" when the work words aren't plural; "none in 4 weeks" in the 4-week view). Flagged: "· flagged" instead of the hint.
  - Region line "{Quads} · {a} of {t} {thigh} sets". None: "· none this session · {lift} trains it" (the muscle's first lift, or its home move at Home). Region words: chest, shoulder, arm, core, upper-back, lower-back, glute, thigh, lower-leg; names Chest, Shoulders, Arms, Core, Upper back, Lower back, Glutes, Thighs, Lower legs. Fallback zone "Other work · other lifts" (should never show).
  - Marker key: "The rest of your last 4 weeks".
- Where your sets went, comparisons:
  - "{More|Less} {incline work} than usual: {3} of {11} sets this session, {0} of {23} in the rest of your last 4 weeks." when the share differs by 15 points or more over 3 or more other sets.
  - "About your usual split." · "Nothing to compare yet: no other counted {chest} sets in your last 4 weeks." · "Nothing to compare yet: only {2} other counted {chest} sets in your last 4 weeks." ("set" for one). "Counted", because a muscle can have done helper work under 60% in those weeks.
- Where your sets went, muscles and lifts:
  - Muscle row: "{7} as the main muscle · {4} helping", "All as the main muscle" or "All helping", then " · usually {6}" (2 or more other sessions), " · last time {4}" (one) or " · first counted set in 4 weeks" ("sets" when this session has more than one; it may have helped under 60% before). Right "{11} sets". 4-week view: "{3} a week · {5} sessions" or "Under 1 a week · {k} sessions". Headers "Every muscle" / "Every muscle · 4 weeks", "Sets".
  - Lifts: headers "The lifts" / "The moves". "{4} sets · {29} reps · {2,030} kg", or "{3} sets · longest {45} s". Moves "{2} rounds · longest {30} s"; a stretch in a training session adds " · mobility, no sets counted". "How it felt: {just right} on {3} lifts, {all-out} on {1}."
- Where your sets went, notes and empty states:
  - "Rebuilt from your lift history." (+ " Two sessions on this day are shown together.") · "Only the totals were kept for this session." · "This is your only session in the last 4 weeks." · "One session in these 4 weeks kept only its totals, so it isn't counted here." / "{n} sessions in these 4 weeks kept only their totals, so they aren't counted here."
  - "A mobility session" / "A posture session" + "Mobility moves don't count as sets." / "Posture drills don't count as sets." + " It still counts for your streak." + " It moved your {a}, {b} and {c}." ("…, {e} and more." past 5). Only when nothing in the session counted as a set.
  - "No sets counted" + "Nothing in this session counted as a set." · "No sets counted in these 4 weeks" + "Lifts you log show here, muscle by muscle." · Toast "That session isn't saved any more."
- Past sessions and Workout complete:
  - Row: the date over the weekday, the title, "{19} sets · {52} min · {6,078} kg" or "{Mobility} · {12} min". Spoken: "{Push}, {Thursday 15 October}: {19} sets, {52} minutes. Where your sets went".
  - Hub header "Past sessions", link "All {16} ›". List: eyebrow "{16} sessions", title "Past sessions", month header "{October 2026}" with "{n} sessions", "Show older sessions", foot "Sessions are kept for 400 days. Past your newest 120, only the totals are kept.", empty "No sessions yet" / "Finish a workout and it shows here."
  - Workout complete row: "Where your sets went" / "Most work: {Lats} · {6} sets". Picture labels: "Your body, lit where the sets went: {up to 4 muscles}" and "Your body, lit where this session moved: …".
- Exercises:
  - Hub line "{124} movements · {2} muscles to wake up" (" at home" at Home; "Every movement, with what it works" before the data loads).
  - Pick reasons: "Not trained in a week", "Not trained for {13} days", "Not trained yet", "Your weak link". Next step "{Strong II} in {3} sessions", or "Top rank".
  - Toasts: "Added {Face pull} to today". When the coach has swapped or rested today: "Added {Face pull} to today's plan. Tap “{Do Upper anyway}” on today's session to see it." (or "It shows when you use the full plan.").
  - A muscle filter's header uses the anatomy name ("Pec major · 7"), so it isn't confused with the Chest group (16).
  - Search aliases: "press ups", "incline press ups", "press up plus", "pike press up"; "rdl", "single leg rdl"; "ohp", "military press", "shoulder press"; "bss"; "hamstring curl"; "triceps pushdown"; "farmers walk"; "skipping"; "chin up". Latin muscle names match only in full ("biceps" doesn't bring up Biceps femoris). Names rank above muscles, so "chest" shows Chest-supported row first, then the chest lifts.
- Kinetic chain:
  - Meta "Compound · Push · Gym only" / "… · Home or gym" / "Stretch · Home or gym" / "Mobility · Home or gym" ("Gym only" for a gym-tagged one). Not "No kit needed": some need a band, a foam roller or a bench.
  - "+{2} RP to {Pec major} for 3 sets" · "{Pec major} is at the top rank." · "No helpers: it works your {quads} on its own."
  - Mobility drills that aren't stretches: "A mobility move: no rank points. It still counts for your streak." with "Muscles it moves".
  - Helper rows show "+1 RP" or "<1 RP". Footnote (hidden with no helpers): "Shares are how Ossa splits rank points, not a lab measurement. RP is for 3 sets of this on its own. In a longer workout a helper's points are capped, and part-points carry over."
- Weak link phrasing (`rkNeeds`): "Chest needs you", "Calves need you", "Biceps need you". Names ending in "us" are singular ("Serratus needs you", "Soleus needs you").
- Widgets: "Kept today", "Train today to keep it", "Train today to start one", "Rest day: it won't break", "Rest day", "{6}-day streak" / "Start a streak", "OVERALL {STRONG I}", the pill "TODAY" or "DONE" with "{Upper} · {40m}", "Open Ossa to update", "Open Ossa to wake your body up".
- MET credit (Settings › Open-source licences, heading "Weather"): "Weather data from MET Norway (CC BY 4.0), the Norwegian Meteorological Institute's api.met.no. Ossa shows a short summary of it." and "The licence is at creativecommons.org/licenses/by/4.0." Plain text, no link: a link would navigate the app's page away.
- iPhone motion string (never shown; Ossa never asks): "Ossa doesn't use motion activity.", in the style of the Health "doesn't write" string.
- Phone check row: "Phone check" · "Test haptics, keep-awake, location and weather".

**Smaller calls made while building**
- Foundation (shell.js, workout.js, ossa.html):
  - The Exercises hub row shows only once Exercises exists. Without Kinetic chain the workout chips open Insights, so they're never dead.
  - One generic Back rule instead of one per screen: with two or more panels open and the top one one of the new screens, Back closes only that one. Every opener brings its panel to the front (`uiPanelFront`).
  - `uiSafe` wraps the hooks from other files, so a failing one can't blank the Train hub or Workout complete.
  - `Body.shot` crop: top clamped to 0–0.95, bottom at least top + 0.05. A crop keeps native resolution, so the image is shorter rather than stretched.
- Exercises:
  - Its title sits left, next to back: centred, it collides with the Home/Gym switch at 375 px. Kinetic chain's title is centred.
  - A muscle filter or a search hides Recommended and the groups so the list comes first. A group filter keeps the groups and scrolls to the list.
  - "View related lifts" resets the type chip to All, so a Mobility chip left on doesn't hide the lifts.
  - The coach's swap and rest days hide an added lift until you keep the plan (BUG-16); the toast names the keep button rather than the spec's "Today is adjusted for recovery…".
  - The empty search shows chips (back, row, chest, squat), each a 44 px target. The search has its own clear button, and the tab bar hides while it has focus so the Android keyboard can't lift it into the list. Every close drops the keyboard.
  - Group cards show the group's average rank colour as a small square; list rows a square in the row muscle's rank colour, not pictures. The pick card's edge is the rank colour, never red.
  - A pick with no next level shows "Top rank" and drops "+N RP" when the preview is 0.
- Kinetic chain:
  - Stretch lists put the main muscle first. Helper RP is shown per row.
  - The chain's Insights row passes the Insights item's muscle, so slot credit carries through. Insights opened without an item now also lists helpers. Without an item (Your lifts, Where your sets went), the main muscle is the one your newest log of that lift was credited to, else the lift's own main muscle (exdata.js), so Single-leg RDL reads Hamstrings, not Glute med.
- Where your sets went:
  - Two panels: the list and a session. Back from a session opened from the list returns to the list.
  - Tapping a muscle row switches the split to that muscle and scrolls to it (lime edge, pressed state), instead of zone lines in every row.
  - "Main" sets are the ones where the muscle is the row's slot or the lift's own main muscle; every other set at 60%+ is "helping".
  - A region's total counts each set once, so the parts can add up to more (a seated row is a lats and a rhomboids set). Region cards sort by sets; zone cards keep their order.
  - Comparisons name the zone by its work ("More incline work than usual") and compare with the rest of the 4 weeks. "usually N" needs 2 or more other sessions; with one it says "last time N".
  - The picture shows front and back unless one side holds 75% of the sets, crops to the upper or lower body at 75%, and lights each muscle at 0.25 + 0.75 × its share.
  - Mobility and posture moves are "rounds", not sets, so the page never says "2 sets" next to "don't count as sets". A mobility session lights the muscles it moved.
  - Posture days with real lifts (Day 8 on: Wall slide, Prone Y-raise, Glute bridge, Dead bug…) earn RP, so their sets count and show like any session's, with the Workout complete row and no "don't count as sets" card. Only a session where nothing counted (mobility, the all-stretch posture days) gets that card and no row (Claude's call in the Phase 2 review).
  - Lift rows open Insights. The 4-week view has no marker or comparison. The list draws 100 rows at a time.
  - Dates use British short months: Chrome prints "Sept", iOS may print "Sep" (as elsewhere in the app).
- Native:
  - iPhone's "Always" location strings are set to the same when-in-use sentence instead of being removed: expo-location's code mentions Always, and a missing string risks an upload error. Ossa never asks for Always and has no background mode.
  - The launch screen fade is skipped in Expo Go, where it only warns.
  - After a failed weather fetch the app waits 2 min (offline or timeout) or 15 min (MET refused) before asking MET again for that place. One request at a time per place.
  - The last known position may be up to 20 km off, so iPhone's reduced-accuracy fixes aren't thrown away.
  - Haptic sequence gaps are the wait after the previous step. Away time is counted from the last `bg`, even through iOS's "inactive".
  - A town that isn't found, or a timeout, saves nothing. Replies are matched by id and type, so a late reply from before a reload can't answer a new request. The phone's keep-awake timer tells the page when it lets go.
  - The Phone check row sits before the widget preview in Settings › On your phone. Times there are in the phone's local time.
- Widgets:
  - The small widget shows one side of the body, the weak link's side, as the streak promo does: a front-and-back pair would leave about 37 pt for text. The body is 112 pt tall on iPhone so it fits the smallest one (SE).
  - The streak note: "Kept today" only on the snapshot's own day once trained; a planned rest day "Rest day: it won't break"; otherwise "Train today to keep it" or "… to start one".
  - The pill shows the short session text with TODAY or DONE; its dot is lime on a training or done day, grey on a rest day.
  - The overall rank's text colour is grey below Stable (the two dark rank greys can't be read on black); the body keeps the real colours.
  - An old snapshot, none, or a date past its week shows "Open Ossa to update" or "Open Ossa to wake your body up", never Body Score.
  - Lock Screen: rectangular shows the streak, weak link and today's session; circular the flame and number; inline "{6}-day streak · {Upper} · {40m}".
  - Android: a short 4×2 drops the rank line so the pill fits; the body follows the widget's height.
  - The Android picker images come from the Settings preview with the demo body and a 6-day streak.
  - When the page is hidden it sends the widget straight away; if no new body picture arrives, iPhone keeps the last one.

**Check on a phone before these ship** (Expo Go, then TestFlight Build 9): the masked body stills in WKWebView (Kinetic chain, Where your sets went), search focus and the keyboard on Exercises, haptic feel, the location prompt and a live MET response (the User-Agent accepted), keep-awake, the launch screen, and every widget (the small one's crop, the tinted Home Screen, taps, the note changing after midnight).

## 2026-10-16 · Bottom buttons on Android, and the Log button stays put
- From Andrej's Samsung test: bottom buttons sat under Android's navigation bar. Android draws edge to edge and its web view isn't told the bars' size, so App.js now keeps the page between the status and navigation bars on Android (react-native-safe-area-context's SafeAreaView, loaded with try/require; iOS unchanged). This needs Build 9 for TestFlight; Expo Go already has the module.
- In a workout, the Log button (and the rest card) stays at the bottom of the screen while the set list grows above it. You never scroll to log a set.

## 2026-10-16 · Over-the-air updates from Build 9 (Andrej: "do it")
- expo-updates goes into Build 9. From then on, web-only changes (almost all of Ossa) reach phones with `npm run update` instead of a new build. Native changes still need a build.
- Runtime version policy "fingerprint": an update only reaches builds whose native code matches, so it can't land on a build it would break.
- Channels: development, preview and production, one per EAS build profile. The TestFlight builds (`build-for-app-store.bat`, production profile) are on "production". Until 1.0 is in the App Store only TestFlight testers are on it; before Build 10 decide whether store users get a separate channel.
- Phones check on launch and apply a downloaded update on the next launch. Expo Go ignores it.
- EAS Update has a free tier, then it's paid per monthly user: check the limits on expo.dev before launch.

## 2026-10-17 · Phase 3 Focus
- What: the third tab is now Focus. Its home shows your Aura level and your own head with its aura, then the ways to grow it: Monk Mode (a timed focus session), the breathing techniques, Calm and Heartbeat (your resting rate played back as a buzz), then the old Mind page. Aura XP is a new currency for breathing and focus. The Body page gets a still cyan halo from Aura level 2. Web only: no native change, so it reaches Build 9 phones as an update. Files: `aura.js`, `halo.js`, `monk.js`/`.css`, `heartbeat.js`/`.css`, `focus.js`/`.css` (map in `UI-SYSTEM.md`). Screens next to the designs: `docs/redesign-plan/phase-3/`.
- Who disagreed: none. Andrej: "go Phase 3", with all of Claude's picks and the recommended defaults. "Andrej to confirm" marks copy and calls he hasn't seen yet.

**Focus tab**
- (1) The third tab reads "Focus". Its key stays `breathe`, so saved state and the `tab` analytics don't change.
  - It opens the Focus home at once: no head zoom, no fade. Tapping it on a sub-view goes back to the home; on the home it scrolls to the top.
  - It always lands on the home, also while a Monk session runs. The home's first card is then "Monk Mode · N min left", and the tab carries a steady cyan dot (no blink).
  - Every sub-view has "‹ Focus" back to the home. Swipe down and pinch no longer close the Focus screen; the tab bar is the way out.
  - Recover's Wind-down row opens Focus › Wind-down the same instant way.
  - The head tap on the 3D tab still opens the old Mind zoom with the brain X-ray, for now.
- Colours: cyan for Focus. Lime only for the Heartbeat (the heart belongs to the body) and for RP rows.

**Currencies**
- (2) RP for muscles only. Aura XP for breathing and focus only. Learn's points read "Learn level". No Grit.
- Learn relabel: "Learn level N" with "a/b to level N+1" ("Top level" at 14), "N lessons done" ("1 lesson done"), "Daily goal n/10" with no unit, "Practice" and "Bonus if you get every answer" in the lesson pop-up, the toast "Nice. Another one tomorrow.". The "+N XP" counter tile is gone (its tile shows lessons done). The saved Learn fields and `learn_xp` stay.

**Aura XP**
- (3) Breathing: 2 XP a whole minute, +2 for finishing, at most 30 a day from breathing. The Breathe tool, Calm and Heartbeat's "Breathe with it" share the 30. Minutes stop at the planned length; paused time and time away don't count.
- Monk Mode: 1 XP a whole minute, plus 2 × the planned minutes for finishing, at most 400 a day. 25 min gives 75, 50 gives 150, 90 gives 270. A session counts on the day it ended. Ending early keeps the whole minutes, without the bonus. Under a minute logs nothing.
- Curve: XP to reach level n = (n−1)(11n+50). Level 2 at 72, 3 at 166, 5 at 420, 10 at 1,440, 14 at 2,652, 15 at 3,010. Levels never drop.
- Past minutes count once (2 a minute breathing, 1 a minute focus, no finish bonus, each day's caps applied), with no celebration. The Focus home says it once: "Your past breathing and focus counted."
- Only level 15 has a name: "Crystalline aura", a look only. Pill "Crystalline aura at level 15", then "Crystalline aura". No other stage names ("Halo" would clash with the Body page halo).
- Level-ups: the award never celebrates by itself. The screen that shows the new level does, once: the Monk finish (a line and confetti), the Breathe tool and Calm (a toast and a haptic), or the Focus home ("New level").
- Demo: 30 days of sessions with today empty, exactly 2,690 XP: "Aura level 14 · 320 XP to level 15".

**The aura on the body**
- (4, 5) Drawn by the body's own renderer, never a second canvas. A glow pass grows the head outward and adds cyan, with a cyan rim and outline.
- Body page: a thin, still halo from Aura level 2, growing a little up to 14, never crystals. No motion and no extra frames: it redraws only when the body does anyway, or once when the level changes. Off on Train, Focus, the 3D tab, onboarding and the check views.
- Focus stills (the head, the Monk figures, the Heartbeat chest) are framed `Body.shot` stills of the dark glass body (`mask:{}`), not rank colours. In stills the aura is a faint rim at level 1, grows from 2 to 14, and has crystals from 15 (sides, top and back of the head; never the face or the shoulders).
- The crystals are a first pass: 10 to 15 faceted shards, sparser than the design's and with no electric arcs. Andrej to judge.
- Monk chest: a cyan glow on the heart and a ring centred on the sternum. Heartbeat: the same in lime.
- Seated figure (Monk timer and finish): lotus at knee 140 / cross 5 from the front (the spike's 150 / 6 tore the female knee), a block sit when turned more than 0.3 or if the lotus fails, lifted so it sits on the floor. The live body never sits. Andrej to compare both figures.

**Focus home**
- (4) Top to bottom: the care card (only when your mood has been low), the date and "Focus", the level bar, your head with its aura and the Crystalline pill, the Monk card (running, or finished and not seen), "Grow your aura" with "How XP works", then the old Mind page in its old order (Your mind today, One thing, What's affecting, Tools cut to Wind-down and Reflection, Mindset, Learn, This week, the support footer word for word).
- Level bar: "Aura level 14" and "320 XP to level 15", or "Breathe or focus to start". Spoken: "Aura level 14: 38 of 358 XP".
- Rows show the real XP from the rules, "Max today" (muted) once capped: Monk Mode (your last length, "25 min · one task", "+75 XP"), Box breath, Even breath, Longer exhale, 4-7-8, Calm, Heartbeat (lime icon; only when Heartbeat is there).
- "How XP works" folds out under its link (no sheet) and folds away when Focus closes.
- The old violet Mind look is gone: every Mind screen uses the tokens now.
- The centred "Focus" title in the header is hidden: "‹ Focus" and each screen's own heading say it.
- On the home, the old "One thing" button is a quiet cyan tint so the Grow rows lead; it stays full cyan on sub-views.
- While a Monk session runs, the brain on the home shows "focusing".

**Monk Mode**
- (6) 25 / 50 / 90 minutes, the last pick remembered. A "2 min · test" chip only in the computer preview or while the Phone check is on (it goes with `nvCheck.on=false` before Build 10).
- No pause. An optional task (one line, 80 characters). The task is never sent to analytics or a notification.
- The session is saved as timestamps in `S.monk`, so it survives leaving Ossa, a reload or a closed app. A running session reopens its timer after a reload. One that ended while you were away finishes on the next open, return or tap, and counts once.
- End early takes two taps. The first shows "Tap again to end · you keep N min" and resets after 3 s.
- Time's-up notification 3 s after the planned end, no task text and no sound (a sound needs native code). Its tap opens the finish. It may be planned down to 35 s ahead, where other reminders need 60 s, so a sync in the last minute doesn't lose it.
- Quiet: while a session runs, every other Ossa nudge in that window is dropped. The trial-ending notice moves to the end + 60 s instead, so it isn't lost.
- A session that ends while you're elsewhere in Ossa doesn't pull you away: a toast says it's waiting in Focus. The finish opens by itself only on a Monk screen, the Focus home, at launch or from the notification. During a live workout the notification tap only shows a toast.
- No tab bar on the Monk screens (as designed). The setup has X, the timer ‹ (the session keeps running), the finish neither.
- The design's "Silent Notifications" switch and the timer's settings icon aren't built: quiet is always on, so the timer shows a plain line.
- Finish: the XP pill is cyan (Aura XP's colour; lime stays for RP). Ended early, the ring shows the real time (12:57) while 12 whole minutes count. "Today so far" lists this session, each workout with "+N RP" in lime (no RP for mobility), breathing and earlier Monk sessions, with the day's Aura XP. Quick logs and water aren't listed.
- Starting a new session marks an unseen finish as seen. Load demo, Start fresh and Reset drop `S.monk`, as they drop `S.mind`. The tour never starts over a Monk screen.

**Heartbeat**
- (7) Your resting heart rate played back as a lub-dub. Not measured, never live, no camera.
- The rate, first found: Apple Health / Health Connect (7-day average), the body check, the last Health read, else Ossa asks for a 30-second count or a typed number (30 to 200). Every label says "an estimate".
- A counted or typed rate is saved as a body-check result, so Body age stays in step (the last body check then reads today).
- Tempo is the resting rate, kept within 40 to 110. No recovery tempo (the REDESIGN-BRIEF's 64/123): it would read as a measurement.
- One beat is a medium then a light haptic 210 ms later, timed on the phone (bridge v2).
- Tap the heart or the waveform to start. Ossa remembers, and starts it when the screen opens next time. Nothing restarts it on coming back to the app.
- It stops on leaving, closing Focus, the app going to the background, or after 5 minutes (the pill: "Stopped at 5 min"). The screen stays awake only while it beats.
- The lime chest still pulses with each beat and the waveform moves only while it beats. Under reduced motion nothing moves; the haptics still play.
- "Breathe with it · 2 min" opens the Breathe tool on Even breath and starts it. A finished session earns 6 breathing XP inside the day's 30. It leaves the Breathe tool set to 2 minutes. The Heartbeat itself earns nothing and logs nothing.
- The tab bar stays. The pill and the heart button sit in the header row next to "‹ Focus" (saves about 56 px on a small phone).

**Fixes and smaller changes**
- (8) "Monk Mode Lite" is gone from Programmes' "Coming soon". "Start focus" is "Start Monk Mode", the score card's "Mind ›" is "Focus ›", Calm's "Back to Mind" is "Back to Focus".
- Calm's finish card shows its Aura XP, and Calm counts at most its planned minutes.
- Fixed (see `BUGS.md`): Calm's head-zoom ghost after leaving by the tab bar (BUG-20), the Breathe cue wiped at once (BUG-21), paused and away time counted as breathing (BUG-22), an error on every Mind row tap (BUG-23), the Mind header under the status bar (BUG-24).
- The 3D body draws no idle frames behind the Focus screen.

**Accessibility and analytics**
- (9) The countdown is announced at start, end and finish, not every second. The level bar and the finish ring have spoken labels. Every target is at least 44 px. Reduced motion: no confetti, no row press, no waveform scroll, no heart flash (reload after switching it on).
- Analytics: `aura_xp {xp, src, lv}`, `monk_start {dur}`, `monk_end {dur, min, full}`, `beat_on {src}`. `breath_start`, `calm_start` and `tab {k:"breathe"}` are unchanged. Never the task text, never the bpm.

**Wording, all Andrej to confirm** (10)
- Focus home: "Grow your aura", "How XP works", "Breathe or focus to start", "New level", "Your past breathing and focus counted.", "Monk Mode · 18 min left" with the task or "Tap to go back to it", "Monk Mode · done" with "+6 Aura XP · See your session".
  - Rows: Monk Mode "25 min · one task"; Box breath "4-4-4-4 · 3 min"; Even breath "5.5 in, 5.5 out · 3 min"; Longer exhale "4 in, 6 out · 3 min"; 4-7-8 "4 in, 7 hold, 8 out · 3 min"; Calm "Float, Deep calm, Sleep drift · 3 min"; Heartbeat "58 bpm resting · an estimate" or "A beat at your resting heart rate". The Calm and Heartbeat lines wrap at 390 px.
- How XP works: "Breathing 2 XP a minute, +2 for finishing. Up to 30 XP a day." "Monk Mode 1 XP a minute. Finish and you get 2 XP for every minute you planned. Up to 400 XP a day." "Levels never drop. Crystalline aura at level 15." "Aura XP comes only from breathing and Monk Mode. Training earns RP for your muscles." "Today: 4 of 30 breathing XP · 6 of 400 Monk Mode XP".
- XP lines: "+12 Aura XP", "+6 Aura XP, today's max", "You've had today's 30 breathing XP", "You've had today's 400 Monk Mode XP", the quiet toast "Breathing logged · +4 Aura XP", the level-up toast "Aura level 15 · Crystalline aura".
- Monk setup: eyebrow "Deep work"; "One task. Phone face down. Leave Ossa and the timer keeps going."; rules "Turn on a Focus. Ossa's own nudges stay quiet." (Android "Turn on Do Not Disturb.") and "No pause. End early and you keep the minutes, not the finish bonus."; "Ossa will tell you when time's up." or "Allow notifications and Ossa tells you when time's up. The timer runs either way."; "What are you working on?" with "Optional. One task."; "Start Monk Mode".
- Monk timer: "Monk Mode · on", "Left of 25 min", "Focus today", "Aura level", "Ossa's own nudges are quiet till you're done.", "End session", "Tap again to end · you keep 12 min" / "Tap again to end · under a minute, nothing logged".
- Monk finish: "Session complete" / "Done. 50 minutes."; "Ended early" / "12 minutes in."; "Focus time"; "+75 Aura XP" or "No Aura XP"; "25 for the minutes, 50 for finishing.", "1 XP a minute. Ending early skips the finish bonus.", "That takes you to today's Monk Mode max of 400 XP."; "New level · Aura level 15 · Crystalline aura"; "Today so far" (another day: "That day"), "Monk Mode, earlier"; "You worked on"; "One thing, start to finish. That's how your aura grows." / "Some focus beats none. The minutes still count."; "Done".
- Monk toasts and notification: "Ended. Under a minute, so nothing logged.", "Monk Mode done · +75 Aura XP. It's waiting in Focus.", "Monk Mode · 18 min left. It's in Focus.", "We'll tell you when time's up.", "Notifications are off for Ossa. The timer still runs.", and the notification "Time's up" / "25 minutes of Monk Mode done. Tap for your Aura XP."
- Heartbeat: "Heartbeat on" / "Heartbeat off" / "Stopped at 5 min"; "Resting heart rate"; "Apple Health, 7-day average · an estimate", "Counted by you on 17 October · an estimate", "From your body check (Apple Health) on 17 October · an estimate", "Last read from Apple Health on 14 October · an estimate", "No resting heart rate yet"; "Sit still for a minute. Then count your pulse at your wrist or neck for 30 seconds and double it."; "Count for 30 seconds", "29 s left · tap to stop", "Time. Double your count and enter it below."; "Beats a minute"; "Save", "Saved with your body check.", "That doesn't look right. Count again?"; "Count it again" / "Not now"; "Connect Apple Health"; "The rhythm you'll feel", "71 a minute", "Tap to feel it"; "Breathe with it · 2 min" with "+6 Aura XP when you finish" or "Today's breathing XP is full".
- Heartbeat footer: "Your resting rate, played back as a gentle buzz. Not a live reading or medical advice." (in the browser preview it adds "You'll feel it on your phone.").
- Calm: "+6 Aura XP" on the finish card, "Back to Focus".

**Smaller calls made while building**
- Engine (`ossa.html`, `aura.js`):
  - Calm reads its technique when the session starts. A broken XP hook can't lose the breathing log.
  - The XP for a session is stored on its log entry, so it can never be awarded twice.
  - The demo's Aura is ready at launch, so the Body page halo is right from the first frame in demo screenshots.
  - A partly capped award says "…, today's max". A level-up on the quiet path is one toast ("Breathing logged · Aura level N"), not two.
  - Analytics `src` is a plain word (tool, calm, beat, monk), never text you typed.
- The aura (`halo.js`, `body-fx.js`):
  - The halo grows along a smooth line out from the head and neck, and only on the half facing away from the camera. Growing every vertex along its own normal tore fins at the ears and hairline.
  - The crystals grow out from the head's centre in 64 fixed directions; a shard pointing at the camera doesn't grow.
  - The outline turns cyan only where the head turns away from you, so the face's outline specks stay grey.
  - The chest ring sits on the sternum; the glow and its hot core on the heart.
  - Each effect draws in its own `try`, so one broken effect can't leave another's settings stale.
  - Stills are PNG data URLs, cached 4 at a time; a failed still is never cached.
- Monk Mode (`monk.js`, `vessel.js`):
  - The Monk screens hide the Focus header and draw their own top row, as designed.
  - The quiet rule drops every Ossa nudge in the window, a wider list than the plan's six.
  - The task loses tags and control characters, is escaped everywhere and stays on the phone.
- Heartbeat (`heartbeat.js`):
  - "Stopped after 5 minutes" became "Stopped at 5 min": the longer one broke the header at 375 px.
  - It starts by itself only on a fresh open of the screen. Starting on every redraw cancelled a running count (found and fixed).
  - The waveform card is a toggle too, a big target next to the 44 px heart.
  - Keep-awake is taken only if nothing else holds it, and only what it took is released.
- Focus (`focus.js`, `shell.js`):
  - The home's buttons use `data-fc`. The body search's page-wide `[data-go]` handler now ignores anything that isn't a body part (BUG-23).
  - A view's leave step runs only when the view changes or Focus closes, never on a redraw.
  - The level labels are capitals by CSS, as designed.
  - The tab bar hides and shows instantly with the full-screen Monk views.
  - During Calm's full-screen overlay, Back doesn't close Focus underneath; Calm's own End is the way out.

**Check on a phone before these ship** (Expo Go, then a Build 9 update): the aura and chest effects compile on iPhone (a failure drops every body effect, sore red too), the uniform limits, the glow pass and crystal cost, `Body.shot`'s resize and PNG time in WKWebView, the stills at 3× (capped at 2.5), the notification ask at the first Start, the time's-up notification on a locked phone and its tap reaching the finish, the haptics (Monk, level-up, the lub-dub against Phone check's heartbeat), keep-awake for 5 minutes, the beat stopping within a beat on lock, the safe area above the Focus header, and reduced motion after a reload.
- Phase 3 review fixes (2026-10-17): a trial-ending notice held back by a Monk session is now saved and still sent after the session (it was lost); the End early confirm says "Tap again to end" with the detail on a line below (it overflowed); the Learn stats row fits at 375 px ("Learn level" with the number in the ring, "a/b to next"); a short breathing session keeps its finish cue (BUG-21).
- Monk Mode's seated body (2026-10-17, from Andrej's comparison): the lotus is now an easy cross-legged sit like his reference. Thighs wide and flat (spread 55°, turned out 90°), knees bent 150° so the shins cross in front, hands resting on the knees. Seat heights re-measured so both figures sit on the floor.
  - Follow-up from Andrej's Samsung (female figure): the hips pinched into strands at the crotch. The thigh turn-out is unchanged, and a 15° pelvis tilt (with the spine leaning back to keep the torso upright) brings the crossed shins up in front of the hips, which removes the gap. Seat heights re-measured (lift: male 0.055, female 0.040).
- Monk Mode's body, final (Andrej, 17 Oct): after the cross-legged legs still looked unnatural (this rig's hinge knees and hip skinning can't fold that far cleanly), the timer shows the seated body from the waist up. The arms hang relaxed with a slight bend at the elbow, the bottom of the picture fades to black, and no legs are shown. Kneeling and a low stool were tried and looked worse; standing was the other option.
- Monk Mode visual, final (Andrej, 17 Oct): no human body. A cyan lotus opens one petal per twelfth of the session (in a balanced order, so it stays symmetric), with a breathing orb at its centre (in 5.5 s, out 5.5 s; breathe with it if you like). Setup shows the closed bud. The orb is a CSS transform and the petals change at most 12 times, so a 90-minute timer stays cheap; reduced motion makes it still. The seated-pose work stays in halo.js but Monk Mode no longer uses it.
- Calm visuals (Andrej, 17 Oct): the ray-marched "creature" (blotchy, rainbow-edged, boxed in a teal panel) is replaced by three flat, full-bleed visuals in Ossa's colours, one per session, all following the breathing level: Float (a cyan orb that rises on the in-breath and sinks on the out-breath, with a halo), Deep calm (a ripple goes out at the start of each out-breath), Sleep drift (a dim moon-blue orb under twinkling stars; the screen darkens over the session). Drawn on a plain 2D canvas (web/ui/calm.js redefines rdAlienMake with the same API). Reduced motion keeps the breathing and drops the twinkle, drift and ripples. The tab bar now hides while a breathing or Calm session plays.
- Unwind (Andrej, 17 Oct): the Breathe screen's second tab is now "Unwind", a relaxing interactive page with no guidance, timer or XP. Three toys, swiped between: Still water (tap for a ripple, drag for a wake), Fireflies (hold to gather them, let go and they scatter) and Zen sand (drag to rake; the lines smooth away over about 25 s). Soft haptics on touch; optional Tidal sound that gives your music back when you leave. The loop draws only while something moves (fireflies rest 20 s after your last touch). Reduced motion: ripples fade without spreading and fireflies don't wander. web/ui/unwind.js + unwind.css.
- The Calm sessions (Float, Deep calm, Sleep drift) moved into the Breathe list after the four techniques; each still plays with its own visual and earns breathing XP. The Focus home has a "Calm sessions" row (opens Float) and an "Unwind" row (no XP).
- **Breathe | Unwind laid out so every option shows** (Andrej: "make it more organized and better structured"). The two tabs are a segmented pill. Breathe shows every option as labelled chips, Techniques (2×2) and Calm sessions (3 across), in place of the ‹ › arrows and the Technique card. Swipe still works. Unwind names its toys in three buttons instead of dots. Longer exhale's tag went from "Calm" to "Settle" so it can't be confused with the Calm sessions. On a 375×667 phone the Start button is one short scroll down. Picture: docs/redesign-plan/phase-3/breathe-unwind-organised.jpg.
- **Focus home: the orb dial** (Andrej, 17 Oct). First he said "way too much information and clutter". A tile grid was tried, then he picked concept A from four sketches, and the body picture was dropped. Under the aura level bar sits one breathing cyan orb showing your aura level. Four tools orbit it: Breathe (top), Unwind (right), Monk Mode (bottom) and Heartbeat (left), and Breathe and Monk Mode show the XP they'd earn. Check in and More are two pills underneath. Tapping the orb or More opens More: How XP works, the mind map, insights, tools, challenges, lessons, the week and support. The low-mood care card and a running Monk session still show first. It fits 390×844 and 375×667 with no scrolling, and reduced motion stills the orb. Picture: docs/redesign-plan/phase-3/focus-orb-dial.jpg.
- **Breathe on its own, more focused** (Andrej, 17 Oct: "purely on breathe"). Each orb on the Focus home opens its own screen with a plain title (Breathe or Unwind), and the Breathe | Unwind switch is gone. Breathe now shows, top to bottom:
  - the shape, with a small Sound pill
  - the name and its rhythm in one line ("In 4 · Hold 4 · Out 4 · Hold 4")
  - icon tiles for the four techniques and the three Calm sessions
  - one 1/2/3/5/10 min row
  - a big Start button with the length, and the Aura XP you'll earn under it

  The long description, the arrows and the Technique/Duration/Sound cards are gone. While a session runs, only the shape, the cue and an End button (with the time left) stay. Longer exhale's tag is no longer shown. Picture: docs/redesign-plan/phase-3/breathe-focused.jpg.
- **Unwind, Monk Mode and Heartbeat, each focused** (Andrej, 17 Oct, after Breathe):
  - **Unwind:** titled Unwind. The toy fills the screen, with a Sound pill and a one-line hint on it and three icon tiles under it (Still water, Fireflies, Zen sand).
  - **Monk Mode setup:** fits one screen. It shows the lotus, "One task. Phone face down.", the 25/50/90 tiles, the task as one field, Start, and the rules as one small line under Start.
  - **Monk Mode timer:** shows the clock, the lotus, your task and End. The Focus today and Aura level tiles went.
  - **Focus home:** a running or unseen Monk session shows on its own orb ("70 min left" or "Done · see it") instead of a card above the dial.
  - **Heartbeat:** no body picture. A big lime heart you tap, the number, one "Feel it" button with the trace, Breathe with it under it, and one line of small print ("An estimate played back as a gentle buzz. Not medical advice."). The header reads Heartbeat (· on). With no rate saved yet, only the count/type card shows.

  Picture: docs/redesign-plan/phase-3/focus-sections.jpg.

## 2026-10-17 · Phase 4 Recover (Andrej: "go phase 4", the plan's recommended picks)
- **Protein target:** grams at 1.6 g per kg (rounded to 5 g, 60–220 g), but only for an adult who adds their weight. The weight is asked the first time you log protein ("Only used for your protein target. It stays on this phone."), and you can skip it, change it or switch to grams later. Skip it, or be under 18, and protein counts as meals with protein, of 4. Weight is never shown big, never trended and never sent to analytics.
- **Carbs:** meals with carbs, of 3. Water stays the existing log.
- **Fuel game rule:** logged fuel makes muscles ready sooner. A day's fuel takes up to 6 h for protein (in proportion) plus 2 h for carbs at 3 of 3 meals, so 8 h at most. It counts on the day you trained and the day after, and the cut is never more than a quarter of the wait. It's a `recWindow` provider in the engine, so every "ready in" in the app agrees. It's labelled "Game rule". Ready times:

| Window | Fuel each day | Ready after (fuel on the day) | Ready after (day + next day) |
|---|---|---|---|
| 48 h | half protein | 45 h | 42 h |
| 48 h | protein hit | 42 h | 36 h |
| 60 h | protein hit | 54 h | 48 h |
| 60 h | protein + 3 carb meals | 52 h | 45 h |
| 72 h | protein + 3 carb meals | 64 h | 56 h |

- **Fuel in the Body score:** once you log fuel that day, the Fuel pillar blends water (half) with protein and carbs (half). The "Protein at every meal" standard ticks itself when you hit protein.
- **Fuel is free.**
- **The 3-minute reset:** after a workout (not a mobility, posture or reset session), Ossa remembers the 1–3 muscles you worked most. Workout complete asks once with a row, "In 45 min: a 3-minute reset" (on/off). On asks for notification permission. After that it follows your answer, and Recover › More has a "Reset reminder" switch. The reminder fires 45 min after the workout (1 min while the phone check is on, for testing). Its text is "3 minutes for your pec major and triceps · You trained 45 minutes ago. A few easy stretches, then you're done." Tapping it opens the reset: one stretch per muscle at 40 s, trimmed to fit 3 minutes, tagged "Reset". The Recover home shows the reset card for 6 h with Start, In 15 min (two snoozes at most) and Not today. Finishing the reset clears it. It earns no extra boost (the plan's open question), to keep one rule.
- **Recover tab, like Focus: one job per screen, no scrolling.** The home has a readiness ring ("18 ready · 4 recovering · Triceps ready in about 2 days"), the reset card when due, and four tiles: Fuel, Mobility, Aching?, More. Each opens its own view with "‹ Recover". Recovering is the full list with "−N h fuel" tags, Fading, and the physio/GP line. Fuel has the recovering muscles lit on our body, Protein, Carbs, the game rule line, Undo and the weight line. More has the desk reset, posture scan, wind-down and the reminder switch.
- **Design changes:** "Fueling Meter" becomes "Fuel" (British "fuelling"). There's no leg render with energy lines: it's our own body still with the recovering muscles lit. "Protein synth 92% · Glycogen 34% low" becomes "Protein 80 g of 115 g · Carbs 2 of 3 meals". "Welcome home / Smart trigger / Post-Home Reset" becomes "After Push · 2 min ago · 3-minute reset". There's no video and no strength move in a cool-down.
- **Andrej to confirm:** the copy above, and the food hints on the protein chips ("about a yoghurt" +15 g, "a palm of chicken" +25 g, "a shake and eggs" +40 g).
- **Before Build 10:** the 1-minute test delay follows `nvCheck.on`, which must be off for release (already on the list).
- **Not yet checked on a phone:** the real notification at +45 min (or +1 min) and its tap, the permission ask from the Workout complete row, and `Body.shot` for the Fuel still in WKWebView.

## 2026-10-17 · Phase 5 Evolve (Andrej: "phase 5 do it", the plan's recommended picks)
- What: Profile's first segment is now **Evolve**, a one-screen hub whose six tiles each open one view: Trophy room, Ideal self, Prestige, Your path (Tank or Scout), Your card and Your look. Ossa Pro is re-skinned and adds three paid materials. The new body looks are drawn by our own 3D renderer. Web only, no native change. Files: `evolve`, `trophy`, `ideal`, `prestige`, `path`, `card`, `vault` (`.js` and `.css`) and `look-fx.js` (map in `UI-SYSTEM.md`). Built and reviewed, not committed: Andrej decides.
- Who disagreed: none. "Andrej to confirm" marks open calls; "deviation" marks where the build departs from his picks.

**Evolve hub (Profile › Evolve)**
- The segment reads "Evolve" (its id stays `progress`). One screen with no scrolling at 390×844 or 375×667, with or without the iPhone insets: an overall rank strip (opens Muscle ranks), the six tiles sharing the height that's left, and a 44 px "Your history" row.
- Each tile opens one full panel: a 48 px bar ("‹ Evolve", "‹ {previous view}" or ✕), a body that never scrolls, and sometimes a bottom sheet (Back closes the sheet first).
- **The avatar always opens the hub**, whatever Profile showed last. Changing tab leaves History. The `pro` route still lands on Settings.
- **History** is the old Progress page without the Milestones and Unlocks cards (their jobs moved to the Trophy room and Your look): week review, a small "Your ranks" card, body check, posture, patterns. It reuses Profile's back bar, titled "History".
- The rank strip: "Overall", the rank, "43 RP average · 4 to Strong II". When that line would be cut (the Unbreakable targets at 375–390 px) it drops "average"; the spoken label keeps it.
- Ways in: the avatar; Muscle ranks' "Ideal self ›" link and prestige tags; Workout complete's lines and moments; the muscle sheet's Prestige row; the Body focus card at 94+; Settings › "Share your card" (was "Share your score").

**Workout complete and the Evolve moments**
- A trophy line: "New trophy" / "New trophies", one name, then "+N more" (the moments carry the rest; changed from the brief's "two names at most" because two names wrapped to four lines in the 3D column). The old Milestone line stays; session-count trophies are left off the trophy line while it shows, but still get a moment.
- Up to two rows: the path bonus and a prestige lap ("Chest lap done · Black marble earned"; lap 4+: "Another prestige star").
- **The Evolve moments come after the rank-ups and before Ranks**, Back and the streak screen: laps done, then prestige ready, then trophies. Three segments at most; the third says "And N more". "See all your ranks" during the rank-ups opens Ranks after the moments, in today's order.
- "Train …" in a view opened from Workout complete leaves it the usual way first (rank-ups, moments, streak), then opens that muscle's session.
- Fix: the legacy rank-up's current segment (class `now`) sat 16 px low on every multi-muscle rank-up because of the global `.now` rule. Now `.rk-segs i.now{margin-top:0}` in ranks.css. The moments use `.ev-cur`.

**Trophy room**
- 42 trophies with 90 grades in four groups (Body 12, Training 10, Lifts 11, Mind 9). The room and its tile count trophies with at least one grade ("13 of 42"). Points are internal: they only pick the card's top trophy.
- Grade words **Bronze · Silver · Gold**, never I/II/III (those read as rank levels), in sentence case ("Silver · 2 of 3"), drawn as 1–3 pips. One-grade trophies have no grade word and are drawn gold, because they're complete.
- **Lift trophies count compound lifts only** (Titan Squat, Iron Hinge, Big Press, Big Pull), sets with weight and reps. "Your first" is the best estimated max of that lift's oldest kept loaded session, stored once. (The first set alone would make +25% too easy after a warm-up.)
- Awards only go up, and save only on change. The first check on a save backfills silently (no toast, no news); a brand-new user's first session still reports First Session.
- **Backfill limits** (older history is under-awarded): leg days from the newest 120 records; carry sets from records or 20 lift entries per exercise; streaks count only the current run; personal bests from now on; fuel 30 days, body checks 40, scans 30.
- Quick log: one toast 1.8 s after the log's own ("New trophy · Iron Core", "Trophy upgraded · Iron Core · Silver", "2 new trophies · see Evolve"). Trophies from breathing, the day check or Evolve itself show only as the tile's dot and "New" tags.
- Badges are flat hexes in the token colours with line glyphs, not the design's metal art (tokens only, no images).

The 42 (three values = Bronze · Silver · Gold; one value = one grade, drawn gold):

| Group | Trophy | Rule |
|---|---|---|
| Body | Iron Core | Abs and obliques at Strong · Forged · Unbreakable |
| Body | Apex Back | Traps, lats and rhomboids at Strong · Forged · Unbreakable |
| Body | Armour Plate | All three chest muscles at Strong · Forged · Unbreakable |
| Body | Boulder Shoulders | All three delts at Strong · Forged · Unbreakable |
| Body | Steel Arms | Biceps, triceps and forearms at Strong · Forged · Unbreakable |
| Body | Solid Spine | Lower back at Strong · Forged · Unbreakable |
| Body | Powerhouse | Both glute muscles at Strong · Forged · Unbreakable |
| Body | Pillars | Quads, hamstrings and adductors at Strong · Forged · Unbreakable |
| Body | Ground Up | Calves and shins at Strong · Forged · Unbreakable |
| Body | Every Muscle | Every muscle ranked |
| Body | Whole Body | Every muscle at Strong · Forged · Unbreakable |
| Body | Prestige | Finish 1 · 3 · 10 prestige laps |
| Training | First Session | Train once |
| Training | Regular | 10 · 25 · 50 sessions |
| Training | Centurion | 100 · 250 · 500 sessions |
| Training | On Fire | A 7 · 30 · 100-day streak |
| Training | Leg Day Legend | 50 leg days (3+ sets on glutes, thighs or lower legs) |
| Training | Grit Master | 5 · 15 · 25 dares done |
| Training | Standard Bearer | Keep your standards 7 · 30 · 100 days running |
| Training | Comeback | Train a muscle again after 10+ days away |
| Training | Full Week | All 23 muscles worked in one week |
| Training | Path Chosen | Choose Tank or Scout |
| Lifts | Record Breaker | 1 · 10 · 50 personal bests |
| Lifts | Titan Squat | A squat's estimated max 25% over your first |
| Lifts | Iron Hinge | A hinge lift's estimated max 25% over your first |
| Lifts | Big Press | A pressing lift's estimated max 25% over your first |
| Lifts | Big Pull | A pulling lift's estimated max 25% over your first |
| Lifts | Steel Bicep | Biceps at Forged |
| Lifts | Ton Up | 1,000 · 5,000 · 10,000 kg in one session |
| Lifts | Heavy Hauler | 10 · 100 · 1,000 tonnes lifted in all |
| Lifts | Rep Machine | 20 reps in one bodyweight set |
| Lifts | Iron Hold | Hold for 60 seconds in one set |
| Lifts | Loaded Carry | 10 carry sets |
| Mind | Monk Adept | 10 Monk Mode sessions |
| Mind | Deep Focus | Finish a 90-minute Monk session |
| Mind | Crystalline | Reach Aura level 15 |
| Mind | Steady Breath | 10 · 50 · 100 breathing sessions |
| Mind | Scholar | 1 · 6 · 12 lessons done |
| Mind | Checked In | 7 · 30 · 100 check-ins |
| Mind | Body Check | 1 · 3 · 6 body checks |
| Mind | Stand Tall | 1 · 3 · 6 posture scans |
| Mind | Fuelled | Log fuel on 7 days |

**Ideal self**
- Target: the floor of your next overall tier (Unranked → Fragile 1 … Forged → Unbreakable 80). Once you're Unbreakable: 94 (Unbreakable III).
- **The % uses the overall rank's own region weighting** (the mean over regions of the mean of min(score, target) ÷ target), so the two never disagree. Demo: Strong I, about 71% to Forged.
- Muscles under the target show "your next rank" on a still (a ghost, stills only). "Close the gap" lists the biggest gaps with "about N sessions", simulated with the real RP maths at 3 sets a session ("a long way" past 80). Sore spots are skipped.
- Top state (every muscle 94+): 100%, "Every muscle at Unbreakable III.", a gold Prestige button.

**Prestige: the lap model**
- A muscle is ready at 94 (Unbreakable III). A lap never touches the rank or the score: it counts that muscle's sets **1.5× on its own 0 → 80 curve**, with the same rounding and carry. About 24 sessions of 3 direct sets.
- Game rule, labelled as one: the lap starts from 0, so lap points come about 2–6× faster than the same sets add at 94+. Copy: "Your chest sets count 1.5× on the lap" ("Sets for your glutes count 1.5× on the lap" for plural names). Never "1.5× rank points".
- **Quick logs and the path bonus feed laps too.**
- Each finished lap puts a star next to the muscle's rank. Laps 1–3 also earn a material on that muscle, in this order: **Black marble, Silver, Gold**. **Laps 4+ earn a star only: a deviation from "each lap earns a material", pending Andrej.** With two or more earned, tapping the pill wears the next.
- **Materials draw in rank mode only**: off in exercise demos, check views and recovery colours. The rank colour stays in the seams.
- Gold stars (or "Prestige ready") on Muscle ranks rows, a 44 px Prestige row on the muscle sheet, and the Body focus card at 94+ ("Top rank · Prestige ready", "Prestige lap · 34 of 80", "★2 · Black marble").
- Nearly everyone is months away (94 needs about 48 direct sessions), so the screen will mostly show its locked state.

**Your path: Tank or Scout**
- The radar shows from day one and reads the last 30 days. **Choosing opens at Overall Strong I** (40 RP average); a switch waits 7 days.
- **Radar maths:** Tank = mean of Strength, Load and Volume; Scout = mean of the non-empty Stamina, Steps and Pace. A lean needs a 10-point gap. Under 6 sessions: "Train N more times this month to read your path." Steps come from Health only (3+ days before today); no new HealthKit reads.
- Heavy set: 6 reps or fewer, or 80%+ of that exercise's best estimated max. Endurance set: 15+ reps, a 30 s+ hold, or a carry. Stretches never count; posture sessions do (they earn RP).
- Perk 1 (game rule): **+10% RP on matching sets**, through the engine, never more than 10% of a muscle's load. Rank-ups, the tally and laps include it; Train's "+N RP" chips don't (they can't know which sets will be heavy). Quick logs read the dose: the upper bound counts, "max hold" counts as 30 s, AMRAP earns nothing.
- **Bonus display rule:** rounding hides most of it (5 heavy sets added 0 RP; 25 added 4). Workout complete leads with the sets ("Tank bonus · 9 heavy sets") and adds "+N RP" only when it's 1 or more.
- Perk 2: dares. Tank 65% lift dares; Scout 35%, with life dares leaning to steps and mobility. Worded "More lift dares when a muscle is fading", because a lift dare still needs a fading muscle.
- Perk 3: the body's shape (below). Copy: "a look for your body", never a body-composition claim.

**Body looks (our own renderer)**
- Pro finishes, prestige materials, the Ideal-self ghost (stills only) and the Tank/Scout shape are BODY_FX effects in `look-fx.js`, fed by two new fragment hooks (`FX:base`, `FX:fill`). Rank colours, sore red and the aura still draw over a Pro finish, so on a trained body it reads mostly through rim, gloss and the unranked parts.
- **Shape gain: default 2, pending Andrej (1, 2 or 3).** At the Path still on a 390×844 phone, Tank and Scout differ by about 3 / 6 / 10 px at the shoulders at gain 1 / 2 / 3. Render's side-by-side pairs: `arch_pairs_390x844_tank_scout_gain1-2-3.jpg` and the 375×667 set (build screenshots, not in the repo yet).
- **Deviation (shape):** each vertex moves along a direction from its position (away from the nearest bone axis, towards the side the surface faces), not along its normal. Along the normal, Scout tore the shorts' hem at gain 1 and thin slivers stuck out at the waist from gain 2. Normals aren't recomputed (slightly soft shading on the delts at gain 3).
- The Path stills frame from above the knee to the head (`at [0,1.2,0]`, span 1.26): the planned 1.15 clipped the head.
- If a look doesn't compile on a phone, every look is dropped and the body rebuilt, so sore red, the aura and the chest still show. Screens then use their plain fallbacks and Pro stops offering the materials.
- Cost: 21 fragment + 8 vertex uniform vectors (measured in Chrome).
- **The Phone check panel gets one GL line** (`bxGlLine()`, in its Bridge card): "GL fragment F · vertex V · active A · body looks on|off", or "body effects didn't build" with the limits read straight from GL. Expo Go has no console, so this is how we read the phone's limits.

**Your card**
- **Defaults (Andrej):** overall rank (Inter Display Italic), RP average, the rank hex, a still of your body in its live look, day streak, sessions, your three best muscles and your top trophy. **Body Score and your name are off by default** (Edit: two switches). A 1080×1350 PNG made only from your own log: no check-in, mood, Health or body-check data, never a made-up stat.
- **This reverses 2026-10-15's "no share cards"** (Train redesign, "Left out on purpose"), per Andrej's card defaults. Still no feeds, leaderboards or accounts.
- Sharing: the system share sheet with the PNG, else the app's share bridge, else the picture with "Press and hold the image to save it." The old score card is retired (the posture card keeps the old share sheet).
- A trophy pinned from the room that isn't the top one says "Trophy", not "Top trophy". Text shrinks to fit; long names show two muscle chips instead of three. Without WebGL: the 2D rank body.

**Ossa Pro and Your look**
- Pro lists three things, from one source (`proPerks`): **Your training plan** (four build weeks, then a lighter one) · **Fixes in every week** · **Three new materials** (Obsidian, Chrome and Carbon fibre for your whole body). Products and prices unchanged; prices are only ever the App Store's own.
- **Perks copy has no "12-week"** (the plan is an endless 4 + 1 cycle): Train's plan row now says "Your plan", the body-check Pro card "builds your plan around it". No "weights that progress" (that's free), ads, experts or masterclasses. Onboarding's "your weak link in 12 weeks" projection stays (it isn't Pro copy).
- **The three materials are the one exception to "earned by showing up, never bought".** Earned finishes (Ice, Bioluminescent, Ember, Gold) and every prestige material stay free.
- **Withheld on phones that can't draw them** (no WebGL body, or the looks fell back): Pro then lists two things, the paywall has no materials row or wording, and Your look greys the row: "Not available on this phone". The store text sells them to everyone; the store doc says so.
- **"Vault" is only a label**: the eyebrow over the three swatches (paywall and Your look). Never a product name in a sentence, title, toast or store line.
- **No Vault row on the onboarding paywall** (in-app reasons only). Onboarding and the Pro welcome list the first two perks.
- While prices load or fail, the paywall hides both prices and says "Prices are loading from the App Store" ("Try again" after a failure); never the fallback prices as real ones. Yearly badge: "Free week", else "Save N%" (real prices, same currency), else "Best value". The in-app paywall never scrolls (fit steps on short phones). The onboarding paywall still scrolls a little, as before, but 23 px shorter.
- Deviation: the paywall's material circles show the head and neck, not the chest, because rank colours draw over a material on a trained chest.
- **Your look:** taps apply (no bottom button). The four earned finishes (2×2), the Vault row (not Pro: a tap previews the material on a still, with "Get Ossa Pro"), "Prestige materials" On/Off. **No Bones row** (a layer, not a look). Lapsed Pro keeps the saved material but shows Ice ("Needs Ossa Pro · showing Ice"). Deviation: the still fills the height the rows leave.
- Store listing (local text only, nothing submitted): the Pro paragraph and review note 3 name the three perks, and "Evolve, Profile and Settings: tap the avatar". To do for Andrej: the subscription descriptions in App Store Connect, the paywall review screenshot and the review video.

**Names and copy**
- **"Vessel" stays an internal name** (code and docs), never in copy.
- Never "match", "AR", "projection", "density", "rare", "mythic", "elite" or "ad-free". The ghost is "your next rank".
- Analytics, plain words and counts only: `ev_open {view, from}`, `tro_earn {id, g}`, `pz_start`, `pz_lap {lv}`, `path_choose {arch}`, `card_share {via}`, `vault_swatch {id}`.

**Andrej to confirm**
- Lap 4+: a star only (default), a "polished" re-pick of an earned material (render work), or a fourth material.
- Shape gain 1, 2 or 3 (default 2), from the side-by-side pairs.
- Tank's dare: as built, a lift dare still needs a fading muscle. Option, not built: fall back to the weak link when nothing is fading.
- Trophy grade words Bronze · Silver · Gold, or back to I/II/III.
- Copy shortened to fit one line: the hub tile subs ("Gold at 50 sessions", "Bioluminescent at 10", "Chest · ready", "Front delts · 34 of 80", "At Unbreakable III"). The "Prestige ready" tag may wrap to two lines on Muscle ranks.
- New copy: "Three new materials for your body.", "Wear Obsidian.", "Earned finishes and prestige materials stay free.", "Made from your own training log.", "Your history · Week review, scores, body check".
- "At Unbreakable III" on a fresh save's Prestige tile can read like a status. Options: "Opens at the top rank" or "Opens at 94 RP".
- The paywall's Obsidian circle has a lime rim (the material's own colour), which can look already selected next to the selection ring.
- The Pro finishes show mainly where a muscle has no rank colour yet (head, neck, hands); on a trained body the rank colours draw on top. Change it only if you want the material over the muscles too (render work).
- "Train chest" now opens a session called "Chest focus" (it was "Pec major focus"), so the button and the session use the same name. The muscle sheet's own "Train this muscle" still uses the full name.
- Small calls: no toast for trophies from breathing, the day check or Evolve itself (the dot shows them); the card's "Show your name" needs the name from onboarding (it can't be added on the card); two or three muscle chips on the card; bigger hub icons on tall phones.

**Not yet checked on a phone** (Expo Go first, no build needed):
- Shader uniform headroom: the fragment shader already declares about 271 vectors by an unpacked count, against WebGL2's guaranteed 224, and the looks add 29. Read the Phone check GL line first.
- `Body.shot` cost in WKWebView on older iPhones: the stills on Path, Ideal self, Prestige, Your look, the card and the three paywall circles.
- `navigator.share` with a file in WKWebView. The native share bridge gives no reply, so a failed share is silent.
- How the materials and finishes look on the phone (Obsidian, Chrome, Carbon fibre, Black marble, Silver, Gold).
- Real safe areas and touch (every check used the `?sa=` simulation), and the Steps label ("Connect Apple Health") on an iPhone.

## 2026-10-17 · Phase 6 Challenge (Andrej: "do phase 6", the plan's recommended picks)
- What: **weather dares.** On a day with notable weather, and only when the forecast allows, today's life dare becomes a short weather dare: Rain walk, Cold walk, Headwind, Daylight, or "Stay in" (an indoor dare) on a rough or dark day. Opt-in, with approximate location or a typed town. A new trophy, Weatherproof, counts them. The dares moved out of ranks.js. Web only, no native change. Files: `dares`, `darepage`, `wxplace` (`.js` and `.css`), `wxgate.js`, `scripts/check-dares.js`, and agreed parts of `native.js` and `trophy.js` (map in `UI-SYSTEM.md`). Built and reviewed, not committed: Andrej decides.
- Who disagreed: none. "Andrej to confirm" marks open calls; "deviation" marks where the build departs from the brief.

**The pick**
- Still one dare a day. A weather dare replaces only the **life** dare: a lift dare keeps the half the mix gives it (`rkDareMix`, Tank 65%, Scout 35%). "Not today" still costs nothing.
- The swap happens at most once a day, and only while the dare is untouched (before Accept, Not today or Done). Never indoor to outdoor, never a lift.
- Which dare, first match:
  - No usable reading under 3 h old, or a place that isn't yours → the normal life dare.
  - Nothing notable (calm) → the life dare.
  - Severe weather, late or dark → **Stay in**.
  - Otherwise the kind: **rain** (a rain or showers symbol, or 0.2 mm or more this hour), **cold** (dry, 6 °C or below), **wind** (dry, gusts of 30 km/h or more), **bright** (clear or fair, 8–25 °C, in daylight).
- Before sunrise still counts: the dare waits ("The walk starts from 07:12.").
- If the forecast turns before you touch the dare, an outdoor dare becomes Stay in; if the place stops being yours, it goes back to its life dare. After Accept the dare keeps its kind and warns instead (below).
- **Cold weather: walks dressed for the weather only** ("Hat, gloves and a warm layer."). Never in severe weather or the dark, and no "fewer layers" dares. The cold-shower life dare stays as it is (Q5).

**Opt-in, place and forecast**
- The opt-in is its own switch, `S.dares.wxOpt` (on, off or never answered), separate from native.js's `S.wx {place, last}`. So Build 9 testers who set a place in the Phone check aren't opted in.
- Weather dares count as on only with a place that has coordinates. A town saved by name only (Android without location permission, the browser) shows Off.
- Two ways in:
  - the Home teaser "Let the weather pick some dares ›" (a new life card, never answered, a phone with bridge v2)
  - Settings › On your phone › **Weather dares** (always there; the Phone check row still goes in Build 10).
- The weather dares page: "Use my location" (approximate, about 1 km) or a typed town. **The location prompt only ever comes from that tap.** "Not now" records a first answer as off, so the teaser stops asking.
- The user's last answer wins: "Not now", "Turn weather dares off", Done or ✕ during "Finding you…" never switch weather dares on afterwards. "Use my location" and Save wait up to 8 s for the phone's hello, so an early tap isn't refused as "Needs a newer build of Ossa".
- **Turning off** (Q9): "Turn weather dares off" also forgets the place and the reading (`S.wx`); "Not now" doesn't. A new weather dare goes back to its life dare. An accepted outdoor dare is left for today at no cost ("Left for today. Tomorrow's stays the same size."), because nothing could warn about the dark or the weather any more. An accepted indoor dare stays. A forecast check already running stops before it reaches the phone again, so a forgotten place is never sent to MET afterwards.
- **The forecast** comes only from the phone: MET Norway, credited "Weather data from MET Norway" (CC BY 4.0) on the dare page, the weather dares page and in the licences. The phone keeps MET's forecast for an hour (to Expires, 6 h at most), so about one MET request an hour per place.
  - The page never fetches, never polls, and nothing waits on the network while drawing.
  - A forced check (opening the dare page, Accept, "Check the forecast", turning on) makes the phone re-summarise its cache for the current hour.
- A dare stores the reading it was picked on (`cur.seen`: temperature, symbol, wind, gust, time), never a town or coordinates.
- Analytics: `dare {st, kind}` (kind may now be "wx"), `dare_wx {on, src}`, `ev_open {view:"dare"|"wxplace", from}`. Never a town, coordinates, temperature, steps or the weather.

**The safety gate (`web/ui/wxgate.js`, as built)**
Andrej's list: never an outdoor dare in thunder, ice, freezing rain or sleet, heavy rain or snow, fog, gusts of 50 km/h or more, below 0 °C, above 30 °C, or after dark. The gate is stricter (Q3). Its numbers are one frozen table, `dwRules()`; change one only on purpose, never to make the check pass.

| Rule | No outdoor dare when (now, or in the next 3 h where the summary has it) |
|---|---|
| Thunder | a thunder flag, or thunder in either symbol |
| Gust | an effective gust of 13.9 m/s (50 km/h) or more; where MET gives no gust (the UK), wind × 1.6 |
| Wind | a mean wind of 10.8 m/s (about 39 km/h) or more |
| Heavy rain | a heavy-rain symbol, 4 mm in the hour, or 10 mm over 3 h |
| Snow | any snow symbol |
| Freezing | 0 °C or below |
| Ice | any sleet symbol; 2 °C or below; or 5 °C or below with any rain, or a rain or showers symbol (sleet can hide behind rain in the summary) |
| Fog | a fog flag or a fog symbol |
| Heat | 30 °C or above |
| Dark | the walk must start after sunrise, end 45 min before sunset, and fall between 06:00 and 21:00 on the phone |
| Place | the place's solar noon within 12:00 ± 3.5 h on the phone's clock; a GPS place at most 12 h old |
| Age | under 3 h old to pick; over 6 h, not used; **Accept** needs a fetch under 1 h old and a re-summary on the phone under 30 min old |

- **Daylight is judged on the phone's own calendar day** (the sun at local noon), never simply the nearest solar noon, so places east or west of their zone's meridian get the right day near midnight. The reading's own sun times count only when they describe that day. With no coordinates or sun times the light counts as night. After 21:00 the light is never "before sunrise".
- **It fails closed.** None of these gives an outdoor dare:
  - a stale, future or malformed reading (a number that isn't finite, a negative wind, gust or rain amount, a missing `soon`)
  - an unknown MET symbol (the allow-list holds MET's 41 codes, its own two misspellings included)
  - a key that won't parse, invalid coordinates, an unknown phone time zone, a GPS place with no time, a polar value other than day or night.
- A stale reading that's also unsafe is reported as stale; no weather dare is picked either way.
- **Severe or dark days get Stay in.** Calm days, no fresh reading, or a place that isn't yours get the normal life dare.
- **Accept happens only on the dare page**, after a forced check ("Checking the forecast…", which lasts exactly as long as that check). If the check changed the dare, nothing is auto-accepted. Refusals: "It's not light yet. From 07:12.", "It's getting dark. This one waits for tomorrow.", "Couldn't get a fresh forecast. Try again in a minute.", "This forecast isn't for where you are."
- **After Accept:** when it gets dark or the forecast turns (dark is worked out from the place's coordinates, whatever the reading's state), the page shows only the amber reason ("Thunder in the forecast.", "It's getting dark." …) and "Skip the walk today. It costs nothing.", with "Leave it for today" (free) and "I already did it". With no fresh forecast it shows a caution, "No fresh forecast. Check the sky before you go.", and keeps Done. A place that loses its coordinates fails closed ("This forecast isn't for where you are.").
- **Before the phone answers at start-up** (deviation: the brief only warned on accepted dares): a new outdoor dare whose saved forecast shows a hazard, darkness or another place is never shown as a walk. The card and the page say "Picked on the 09:10 forecast. Needs a fresh one to start.", the page shows the reason in amber, and "Check the forecast" replaces Accept (it waits up to 8 s for the phone).
- **The check:** `node scripts/check-dares.js` loads the real gate and engine code and fails if any severe case gives an outdoor dare. Run it after `node scripts/build-html.js`. Last run (384 passes, 0 failures):
  - 200 severe cases, none outdoor; 42 controls, so it can't pass by refusing everything; 5 known limits, printed, not failures
  - a light sweep of 155,520 points (15 places on their own phone zone, a year of days, every 10 minutes): never a walk in the dark or outside 06:00–21:00
  - 110 engine checks, the review round's fixes included ("Checking the forecast…" always clears, the start-up copy, midnight); `dwSun` equal to the phone's `sun()` at 980 times; purity; the bundle holds the tested files; no other file redeclares their names.
- **Known limits** (BUG-31, a Build 10 native follow-up): the phone's summary hides fog or sleet behind another symbol later in the window, a fog fraction later in the window, a temperature drop later in the window, a thunder probability under 30 %, a missing rain amount (read as 0 mm) and heavy rain in one later hour. In the UK thunder comes only from the symbol and gusts are estimated. Ice comes from air temperature (MET has no ground temperature).
- **The place check looks at longitude only** (replaces the wording of the brief's risk 4; BUG-32). A typed town far north or south, or up to about 3 time zones away, can show daylight you don't have (Accra with a London phone at 16:45 on a December evening). The town is named on the card and the page, and quiet hours cap the worst of it.

**Objectives and Done**
- Three rows per dare:
  - Rain, Cold, Daylight: an N-minute walk outside (10, 10 and 15 minutes × the dare's scale, at least 5), 1 minute of slow breathing, water when you're back.
  - Headwind: N minutes into the wind, N back (5 each way × the scale, at least 3; ticked by hand), water.
  - Stay in: a short mobility flow, 1 minute of slow breathing, two glasses of water.
- **Rows tick themselves where the app knows:**
  - steps from Apple Health (100 a minute of walk, so 1,000 for 10 minutes; the base is taken at Accept)
  - water: glasses logged since Accept
  - breathing: minutes logged on the dare's day, at or after Accept, or with no time
  - the flow: a mobility session that ends after Accept.
- A ticked row stays ticked (a water undo doesn't untick it). The last tick finishes the dare. Rows without data tick by hand.
- **Done ticks whatever is left** (today's honour rule; Q8). It raises dares done (Grit Master) and weather dares done (Weatherproof) by one each, exactly once, and grows the next dare a little (scale +0.05), as before. "Not today" shrinks the next dare, as before; "Leave it for today" doesn't.
- The dare's minute of breathing borrows Breathe's shared length and gives the old length back afterwards, unless you picked another length meanwhile.
- **A weather dare belongs to its day.** After midnight, Accept, ticks, Done and Not today on yesterday's weather dare do nothing, and the screens move on to today's dare. Life and lift dares keep today's Done past midnight.

**Weatherproof, the 43rd trophy**
- Training group (now 11): 3 · 10 · 25 weather dares done (Bronze · Silver · Gold), points 10 · 25 · 45 as Grit Master, a rain-cloud glyph. **Indoor weather dares count** (Q1), so bad weather never pushes anyone out. Grit Master keeps counting every dare.
- The Trophy room is now 43 trophies with 93 grades. The All › Training grid (11 of 12 slots) fits at every size.
- After a done dare: "Dare done. Weatherproof · 3 of 10.", then trophy.js's "New trophy · Weatherproof" or "Trophy upgraded · Weatherproof · Silver" 1.8 s later.
- No new currency, no Grit and no XP: rank points stay for muscles, Aura XP for breathing and focus.

The Phase 5 trophy table gains one row:

| Group | Trophy | Rule |
|---|---|---|
| Training | Weatherproof | 3 · 10 · 25 weather dares done (Stay in counts) |

**Screens**
- **The Home dare card** (every kind) now matches Recover's reset card: a solid lime-tinted border, an fs-4 800 title, the lime button first and left-aligned (44 px, never small), "Not today" as a 44 px link, and the Coach/Drill pill 32 px to look at with a 44 px tap area. Life and lift dares keep their copy and flow.
- **The weather card:**
  - a lime eyebrow ("Weather dare · 8 °C", "Weather dare · indoors", "Dare accepted · 1 of 3 done", "Dare done"), the name, and a two-line line ("Light rain in London. 10 minutes out in it, then back in the warm.")
  - "See the dare": Accept happens only on the page, so the safety line is seen first
  - the temperature and sky come from the live reading when it's fresh; otherwise "Picked on the 09:10 forecast. Needs a fresh one to start."
  - it shows MET's numbers without the credit line (Q6)
  - deviation: the tone pill shows only while the dare is new, because at 390 px the accepted eyebrow was cut to "DO…" next to it.
- **The dare page** (Evolve's panel, view "dare", ✕ from Home), top to bottom: the glyph, the eyebrow, the name (italic capitals), the conditions ("Light rain · 8 °C · light till 16:42") or the amber warning, the lead, "Three things", the reward line ("Counts towards Weatherproof · 2 of 3"), the safety line, one row of actions and the MET credit. A skipped dare shows the card's line instead of the pitch, and no reward line; a done one "Every box ticked. A new dare tomorrow."
- **The weather dares page** (view "wxplace"): one job, on with a place or off. Keyboard mode leaves only the eyebrow, the town field (its own 44 px field, 16 px text so iOS doesn't zoom), the status and the privacy line ("Only your rounded spot goes to MET Norway, for the forecast.").
- Nothing scrolls on either page at 390×844 or 375×667, with or without the iPhone insets. The glyph gives way first; the safety line, the credit and the row subs are never dropped.
- **Colours:** lime for the eyebrow, Accept and Done; a gold hex for the reward; amber for warnings; bone for Close and "Leave it for today". No cyan (cyan is the mind).
- **Glyphs** are our own line drawings: no photo, no lightning hero. Stay in is a house with an amber mark for the reason (a bolt for thunder, a moon for the dark…). Motion is transform only and stops under reduced motion.
- **Units:** wind in km/h, rounded to the nearest 5 (Q2). Temperatures read "8 °C" with a no-break space and a real minus ("−2 °C").

**Copy changes from the design** (`dare_generator`)
- No "storm" dare at all: severe weather gets Stay in. "Weather-triggered event / Storm resistance" becomes the eyebrow "Weather dare" and the kind's name ("Rain walk").
- "+50 Grit" becomes the Weatherproof line. "Level up your grit by exposing your character to the elements" becomes a plain lead ("10 minutes out in it, then back in the warm.").
- "No heavy outer layers. Let the skin sense the storm." becomes "Dress for the weather. Brisk pace."; "Stoic Stance" becomes "1 minute of slow breathing"; "Locate Storm Center" becomes "Water when you're back".
- The design's cyan eyebrow is lime, and its page scrolled; ours fits one screen.
- Never in new copy: Grit, XP, "storm", "storm resistance", "severe", "elements", "exposure", "toughen", "layers", "Vessel". Weather copy never promises "never" or "safe" (the gate reads a forecast, not the sky): "Weather dares stay in when the forecast shows thunder, ice, strong wind or heat, and after dark." Labels hedge: "Could be icy", "Thunder about", "Foggy", "Dark out".

**The dares move, and the lift-dare fix**
- The dares moved out of ranks.js into `web/ui/dares.js` and `dares.css`, unchanged, except that the `DARE_LIFE` table (a top-level const) is now the function `dareLife()`, with the same five ids. `rkDareMix()` and path.js's `dareMix` provider work as before.
- **Lift-dare fix (BUG-30, fixed; Q7):** a lift dare uses the muscle's first exercise counted in reps, never a carry or a hold (Forearms → Wrist curl, Adductors → Sumo squat). A muscle with only holds or carries gets no lift dare that day. Reps never pass 1.5× the logged best, even under 4 reps. Dares picked before the fix keep their text until the next day's pick.
- **Load demo, Start fresh and Reset** keep the place (not the reading), the opt-in and the dare tone, like reminders and Pro (Q4); the dare scale goes back to 1, and the dare counts reset with the rest. This reverses 2026-10-16 (11)'s "revisit in Phase 6".

**Andrej to confirm**
- Q1 Weatherproof at 3 · 10 · 25, with Stay in counting. It can be earned without going outside. Options: outdoor only, or 5 · 15 · 25.
- Q2 Wind in km/h. Option: mph, as UK forecasts show.
- Q3 The margins stricter than your list (the table above): 2 °C dry and 5 °C with rain, any snow or sleet, mean wind 39 km/h, gusts estimated at wind × 1.6, walks ending 45 min before sunset and only 06:00–21:00, the 3 h / 1 h / 30 min ages, and the place checks.
- Q4 Load demo, Start fresh and Reset keep the place, the opt-in and the tone. Option: drop them, as before.
- Q5 The cold-shower life dare stays. Options: retire it, or put it behind the weather switch.
- Q6 The Home card shows the temperature and sky without the MET credit. Option: no numbers on the card.
- Q7 The lift-dare fix as above.
- Q8 The honour Done ticks what's left. Option: Done only once every row is ticked.
- Q9 Turning weather dares off mid-dare leaves an accepted outdoor dare for today at no cost. Option: keep the place until midnight so it can finish.
- The dark rule turns most winter-evening first opens into Stay in. This is by design.
- Before sunrise, the page still shows the dare's pitch ("It's only rain. 10 minutes. Go.") above a greyed "From 07:12" button, while the card says "The walk starts from 07:12.". Option: drop the pitch there too.
- In the warning state the rows stay the dare's own, and the walk row can still be ticked by hand. Option: no tap on it there.
- After a change on the On page, "Found Leeds. Weather dares are on." repeats the headline "Weather dares are on". It could be shorter.
- At 375 px a Daylight walk title shortens to "15-minute walk outs…" next to a count like "1,240 of 1,500" (7 px short; BUG-36).

**Not yet checked on a phone** (Expo Go or Build 9; web only, so no build is needed):
- The real location prompt: its wording (the shipped string "Ossa uses your approximate location to show the weather where you are. You can type a town instead."), and that it comes only from "Use my location".
- A live MET forecast fetched by the phone (the User-Agent accepted), the start-up timing (the phone's hello can take seconds; the 8 s wait) and "Checking the forecast…" over the real bridge.
- Typed-town lookup on iOS (first hit only, with and without location permission).
- Health steps ticking the walk row.
- The two-line clamps, the italic headline, the glyph motion, VoiceOver focus across a redraw, and the iOS keyboard over the town field (WKWebView may pan the page). Real safe areas: every check used `?sa=`.
- Notifications: none. Nothing tells you about the weather while the app is closed.
- Before Build 10 (already listed): `nvCheck.on=false`, so the location prompt comes only from this page (App Store 5.1.1); Coarse Location in the privacy label; a location and MET line on getossa.app/privacy. "Turn weather dares off" can't clear the phone's own forecast cache (`ossa-wx-v1`) without native work (BUG-34).
- Rolling back over the air: an older bundle shows today's weather dare as the cold-shower dare until midnight. Harmless.

## 2026-10-18 · Onboarding: Back everywhere, several goals, and screens that fit (Andrej, after testing Build 11)
- **Back on every step after the name.** The arrow in the top row (or a swipe right) returns to the last answer. It used to exist only from the goal step to the quick check. It now also works from the body step and from the "every muscle gets a rank" step, and from the reveal, "in 12 weeks", the promise and the reminder step. Back skips the two animations (the body coming online, the analysis). The paywall has its own Back button in its top-left corner, which returns to the reminder step. Answers are kept when you go back.
- **"What do you want to get better at?" takes more than one answer.** "Pick all that apply", square ticks, and Continue (it needs at least one). The first one you tap is the main goal (what the plan's focus reads, as before). All of them count towards your focus area and the line on the report ("Build muscle and fix posture start with your upper body"). Saved as S.goals; S.goal stays the first.
- **One screen, no scrolling, Continue always visible:** the goals, "Where does your body complain?", "Your area in 12 weeks", "Make a promise with yourself" and the paywall. The answer area takes nearly the whole screen, the headline is smaller, and on short phones the small print comes off first (the "pick all that apply" line, the chart's second line). The paywall drops its optional parts one step at a time, only while it would scroll: the plan chips, the week preview, the free-week timeline and, last, a smaller headline and tighter cards. It always keeps the billed price, the free-week terms in the fine print, the Start button, and Restore, Terms and Privacy.
- Checked at 390×844, 375×667 and 360×640 (a small Samsung). Not yet checked on a phone.

## 2026-10-18 · A hard paywall: Ossa has no free tier (Andrej: "get rid of them and lets introduce a hard paywall")
- The intro ends on the subscription screen with no "Not now". The old second-look screen ("Continue with free") is gone. The free week (or a subscription) is the only way in. Back on that screen returns to the reminder step.
- After the intro, whenever Pro is off, a lock screen (`web/ui/gate.js`) covers the whole app with the same subscription sheet: "Your plan is waiting." on first use, "Your subscription has ended." after a lapse. It keeps the billed price, the free-week terms, Start, Restore, Terms and Privacy, and lifts the moment Pro is on (a purchase, a restore, or the phone reporting an active subscription). While locked, nothing underneath takes a tap.
- On launch the phone reports the subscription a moment after the page draws. The lock waits 1.6 s for that, so a subscriber sees it for a blink at most. In the desktop preview the app stays open unless `?lock=1`, so the checks keep working.
- What changed in copy: "Free keeps…" lines, "Get Pro any time in Settings", "Yours is ready · Pro" in Settings, and the App Store listing's Pro paragraph and reviewer notes (section 3, Access) now say there's no free tier.
- Kept as they were: the in-app paywall sheet (from Settings, the plan or a material) still has a close button, since those open over an app that's already unlocked; the Pro features list (`proPerks`) stays the same.
- In Expo Go there is no App Store, so with a hard paywall there would be no way in. On a phone that reports Expo Go and no store, "Start my free week" turns Pro on locally with the toast "Expo Go has no App Store: Pro is on for testing and nothing was charged." The App Store build never takes that path.
- **Andrej to confirm:** the two lock headlines; and the review note that a lapsed subscription locks the app (Apple allows this when the price, trial and Restore are clear, which they are).
- **Before the next build goes to Apple:** update the App Store Connect subscription description and the review screenshot/video so they show the subscription screen as the only way in; the free-tier screenshots in `store/` are out of date.
- **Not yet checked on a phone:** the lock lifting on a real sandbox purchase, a restore on a fresh install, and the blink on launch.

## 2026-10-18 · Train: the readiness stack (Andrej: a big swipeable card per body part, "I like B") — superseded the same evening by "Train: the card", below. The deck's order, the tiles' numbers, the More panel and the four bug fixes carried over.
- **The Train tab is a deck of cards**, one per session in your week (Legs, Push, Core…), and the body sorts it: today's plan on top ("Up next · your plan"), then whatever's recovered ("Ready"), then what's still recovering, amber, with the day it comes back ("Ready Wednesday"). Swipe sideways to see the next card (or tap a name on the "Then:" line under the deck). Each card: the muscles' readiness ("4 of 6 · chest recovering"), moves and minutes, the top three muscles with the rank points they earn if you finish (the same numbers as Workout complete), your own body with those muscles lit (a Body.shot still, cached), and one bone button: "Start · done by 17:02". A recovering card still lets you "Start anyway". "Moves" opens the session screen (the list, swaps, insights); "Edit" opens it in edit mode. Tapping the card does the same as Moves.
- **Done today:** the card you trained flips to what you earned ("+10 RP earned", sets, minutes, kg lifted), the muscles that got the points, "Rest up · Tomorrow: Push" (opens Recover) and "Sets" (Where your sets went). The other cards stay behind it ("Still today: Core · Pull…"), so you can still train again.
- **Rest day:** "Recovery day" with how many muscles are recovering (or "Everything's recovered"), the mobility session as the bone button, and the week's sessions behind it, sorted the same way.
- **Above the deck:** the date, Train, the Home/Gym switch (app-wide, as before) and one rank line: the overall rank in its tier colour, the weak link and the points to the next level, with a bar. Tap opens Muscle ranks.
- **Under the deck, four tiles:** ready muscles (opens Recover), your top lift with its trend (opens its Insights), sessions this week against the days you actually have planned (opens More at the week), and More.
- **More** is a panel with everything the old hub had: this week's day cards (tap a day to open it) with "Change days", the Quick session card (goal, minutes, play), Train something else, Your plan / Build my plan, Past sessions, Exercises, and the day streak.
- **Nothing scrolls.** The screen fits 390×844, 375×667 and 360×640 (measured: the card keeps 150 px spare on the small phones). Under 600 px tall the chips come off first.
- Gone from the hub: the Recovery card (Recover has it), the stats row (the Week tile and the streak row in More), Your lifts (the Lifts tile), Past sessions (More), the Muscle ranks row (the rank line). The Body page's Today card is unchanged.
- The 3D stills cost one Body.shot per distinct session (five or six), drawn one per tick after the first paint and cached by body, finish, look and muscles (eight at most), so a swipe never waits on the 3D. Without WebGL the flat figure stands in.
- Bugs closed on the way (BUGS.md 39–42): quick sessions were recorded with their planned minutes in the title ("Lower · 20 min" over "1 min"); the hub said "Trained today" over "Recovery day"; sessions were counted against the default five-day plan while Your plan said four; the Recovery card's "ready" and "recovering" counts didn't add up (new and fading muscles were left out of the sentence).
- **Andrej to confirm:** the card for a day you've already trained hides that day's plan (it's done); whether "Start anyway" on a recovering card should warn first; the tiles' wording ("ready", "this week").
- Not yet checked on a phone: swipe feel against the tab bar's own gestures, Body.shot cost on a real GPU (six stills on first open), the tap-vs-drag threshold.

## 2026-10-18 · Train: the card (Andrej sent a Tesla car-control concept: "implement this design tailored to the training screen… brainstorm creative ways to make the training screen like this and proper") — superseded an hour later by "Train: home", below, after two new references. The held pose, the reel, the readout, the ignition sweep, the stills, the More panel and the bug fixes carried over.
- **Where it came from.** A 17-second recording of a Tesla app concept: a dark card with big rounded right corners on a coloured band, the car seen from above half off the left edge, four stat tiles down the right with one lit, a pill row along the bottom, and a slide into a "Wheels" screen with an icon rail and per-wheel sliders. Before the mapping, a ScreensDesign sweep of 113 recorded screens from 13 angles (saved as a research brief) found that almost every training tab is a scrolling list with a trainer-photo hero, so the card is a real difference. Four designers mapped the reference onto Ossa, three judges scored them; the winner ("Shift": the Tesla choreography performed by the character) was grafted with the others' best parts.
- **The screen** (`web/ui/deck.js`, `deck.css`): one black card on a coloured edge. Top-left the overall rank hex (opens Muscle ranks), top-right the round Home/Gym button (the app-wide kit switch). The title is the session ("Legs") with an eyebrow ("Today · your plan", "Ready Wednesday", "Done today", "Today · rest day") and a subtitle ("4 moves · 35 min ›", tap for the moves). The user's own live 3D body stands on the left, a third off the edge, **held mid-way through the session's first move** (a squat for Legs, a press for Push) with its muscles lit, primaries full and helpers dim. Four tiles down the right: readiness ("4/4 ready", lit lime; "1/5 · pec major · Wed", lit amber), rank points if you finish ("+26 RP · Hamstrings ranks up", with a lime dot when a muscle would cross a level), minutes ("35 min · done by 18:02"), this week ("2/4"). Along the bottom the one bone Start pill and the other sessions of the week as round buttons showing stills of your own body with that session's muscles lit, then More.
- **The edge is the day's state:** lime when every muscle in the session is ready (it breathes slowly), amber when one is recovering (it fills from the bottom as the slowest muscle recovers, like a tide), lime again and still when today's session is done (the tokens say lime is ready, selected and done; gold stays for prestige), grey on a rest day. The eyebrow says "Today · adapted" when the plan was eased for recovery, and the minutes tile carries a red dot when Sore spots has a flag on one of the session's muscles.
- **Moving between sessions:** tap a round button or swipe the card. The title, tiles and bottom row fly out the way you swiped (220 ms), the edge changes colour, the body turns to face the new session and re-poses, the new parts fly in with a 45 ms stagger. Order: the day's own card first, then recovered sessions, then recovering ones by how soon they're back (the body sorts the deck).
- **The tiles answer on the body, not with a screen:** tapping Ready or RP lights the muscles in question and puts the answer in the subtitle for 2.5 s ("Quads, Hamstrings, Glute max, Calves: all ready"; "+6 Hamstrings · +5 Quads · +4 Glute max"); a second tap opens Recover or Muscle ranks. Minutes opens the moves. Week opens More at the week.
- **Tap the body and it rehearses the session:** one move after another, 2.6 s each, the subtitle naming each ("Romanian deadlift · 2 of 4 · 4 × 8"); tap again to stop, and it returns to the held pose.
- **Start is an ignition:** the edge's colour sweeps the screen from the right (260 ms), the workout appears behind it, the sweep fades. A recovering card says "Start anyway" in the quiet style. Rest day: "Start mobility". Done today: "Rest up · Tomorrow: Push" (opens Recover) and the tiles show what you earned.
- **More** (a panel): this week's days with "Change days", the quick session (goal, minutes, play), Train something else, Edit today's session, Your plan, Past sessions, Exercises, the streak.
- **Rules kept:** nothing scrolls (measured at 390×844, 375×667 and 360×640), one bone action, lime only for ready/selected/done, tokens only, British copy, VoiceOver labels on every control. Reduced motion: no breath, no sweep, no fly-in; the card changes in one step.
- **Under the hood:** the live body is framed into the card's left box by a `thub` branch in `frameTo` (ossa.html) and lit by `planGlow`'s mask; the held pose uses the demo rig's move for the first exercise (`moveFor`, `MOVES`) frozen with the renderer's `__demoPh` hook, which deck.js clears whenever the hub is left (it wraps `drawTrain` and `trainGlowOff`), so the Watch demos never stick. `rdLookSync` gives the card no aura, so the backdrop is flat black like the reference. The stills on the session buttons are `Body.shot` at 160 px, cached (eight at most), drawn one per tick after the first paint.
- **The panel's spec** (four concepts, three judges; "Shift" won 69 to 59/59/53) is saved with the research brief; what's built follows it except that the rehearsal reel is on a body tap (the spec put it on the minutes tile) and the edge shows 22 px (the spec asked for 44).
- **Left out, on purpose:** the reference's second screen (an icon rail with sliders on the object). The panel's best version of it is "Quick one": a goal rail down the left, the body as an outline, one minutes slider across the waist, Start running the quick session. Not built: the quick session lives in More for now. Also left out: the tiles' numbers interpolating during a swipe, week dots inside the edge, region framing (zooming to the legs for Legs).
- **Andrej to confirm:** the held pose (a frozen mid-rep character) against a standing one; the stills on the session buttons against initials ("Le", "Co", "PL", "PH"); "Start anyway" on a recovering card without a warning; whether the Week tile should open More or the plan.
- **Not yet checked on a phone:** the held pose on iOS WebGL, the sweep's feel, the swipe against the tab bar's gestures, the cost of three stills on first open, VoiceOver through the subtitle readout.

## 2026-10-18 · Train: home (Andrej sent two more references: a health "snapshot" home and an anime gym app, "make it like this instead and like this but tailored for my app")
- **What the references are.** One: a soft-gradient home with "Welcome, Alex! here's your health snapshot for today", the date, a search bar, "Today's stats" as small cards with rings (steps, calories), and a "Today's workout" card with a photo, chips and a play button. Two: a gym app whose home is a hero image of the character in a gym with "Hey, Riyad · WELCOME BACK", a week strip with today ringed, Workout/Nutrition tabs, three stat cards with mini charts (bars, a line, a ring), and "Active Workout · View All" rows with a character thumbnail, a label, the title, minutes and a play button; its workout screen is a huge upper-case title over the character, "Exercise" rows with thumbnails and a "Best for chest" label, and one big Start button.
- **Tailored for Ossa** (`web/ui/deck.js`, `deck.css`; dark, the user's own 3D body as the character): the Train tab is a **home page that scrolls**, the body fixed behind a black sheet that slides over it.
  - **Hero:** the avatar (opens Profile) top-left, the overall rank hex (opens Muscle ranks) and the round Home/Gym switch top-right; the live body on the right, **held mid-way through today's first move** with its muscles lit (a squat for Legs); bottom-left "HEY, ANDREJ" (or "Hey there"), "Welcome back", and a state line: "Legs is ready · 35 min", "Push · chest ready Wednesday", "Rest day · 4 muscles recovering", "Legs done · +10 RP". Tap the body and it rehearses the session move by move, the line naming each.
  - **Week strip:** the seven days with the date and weekday, today ringed in lime, done days a lime tick, a lime dot for a ready day and amber for a recovering one; tap a day to open its session.
  - **Today / This week tabs** over three stat cards. Today: rank points if you finish (+26 RP, a bar per muscle in its rank colour, a lime dot when a muscle ranks up), readiness (4/4 ready, lit lime, or 1/5 · pec major · Wed, lit amber, with a segment per muscle), minutes with a ring and "done by 18:23". This week: sets per day (bars, today lime), sessions 2/4 (segments), the day streak (ring). Done today: RP earned, sets and kg, minutes. Rest day: muscles recovering (amber bars by %), the next session, mobility minutes. A first tap on a card answers in the hero's line and lights the muscles on the body; a second tap opens the screen behind it (Muscle ranks, Recover, the moves, Where your sets went, the streak).
  - **Today's workout · View all:** the day's card, then "This week" with the other sessions in the body's order (recovered first, then by how soon they're back): each a still of your own body with that session's muscles lit, the region ("Legs & glutes", "Chest & shoulders"), the title, "35 min · 4 moves · Ready" (or "Ready Wednesday" in amber), and a round bone play button (quiet when recovering: start anyway). The row opens the moves; View all opens More (the week with Change days, the quick session, Train something else, Edit today's session, Your plan, Past sessions, Exercises, the streak).
  - **The session screen, dressed:** the title upper-case and bigger ("LEGS"), a still of the muscle on every exercise row, the plan screen's own week strip hidden (the home has one). The rest of that screen (plan pill, minutes chips, swap/watch/insights, Start) is unchanged.
  - Start is still the ignition: lime sweeps the screen, the workout appears behind it.
- **Scrolling is back on this tab, on purpose:** both references are lists. At 390×844 the greeting, the week, the stats and today's workout with its play button are above the fold; smaller phones scroll to the card. Nothing else in the app changed its no-scroll rule.
- **Left out:** the search bar (Ossa's Exercises has its own), the date line (the week strip carries the dates), a Nutrition tab (Recover › Fuel owns food), the "Best for chest" label on the session rows (the rows already name the muscle).
- **Andrej to confirm:** the wording of the greeting ("Welcome back" every time), whether the Today's workout card should sit above the stats, whether the week strip should open the day's session or More, the uppercase title on the session screen.
- **Not yet checked on a phone:** scroll feel with the body fixed behind the hero, the held pose and the stills' cost on iOS WebGL, VoiceOver through the hero's changing line.

## 2026-10-18 · Train: home, the RPG layer, and a body that stands still (Andrej: "don't make the character do any moves or anything on the screen and add the RPG style layout on there")
- **The body never moves on the Train home.** The held mid-move pose, the rehearsal reel on a body tap and the muscle pulse on a stat tap are gone; the body stands in the hero with today's muscles lit (the plan screen's own glow). The renderer's `__demoPh` hook is no longer used anywhere, and deck.js no longer wraps `drawTrain` or `trainGlowOff` (only `drawPlanFloat`, for the session screen's thumbnails).
- **The RPG layer**, on top of the home from the two references:
  - A **status bar** at the top of the sheet, like a game HUD: the overall rank in its hex ("Strong I"), your path when you have one ("· Leaning Tank" / "· Tank"), a lime XP bar with "4 RP to Strong II", and the streak with its flame (amber when today is done). Tap opens Muscle ranks.
  - **Today's quest** straight after the week strip (so it sits above the fold at 390×844), with its reward: "+22 RP" and "Hamstrings ranks up" when a muscle would cross a level. The week's other sessions are "Quests this week", each with its reward.
  - **Attributes:** every region (Chest, Shoulders, Arms, Midsection, Upper back, Lower back, Glutes, Thighs, Lower legs) as a bar in its rank's colour with the rank name, the weak link marked. Tap opens Muscle ranks.
  - The Today / This week stat cards stay, between the quest and the attributes.
- Page order now: hero → status bar → week → today's quest → stats → attributes → quests this week → (More, via View all).
- **Andrej to confirm:** the words "quest" and "Attributes" (Ossa's copy is otherwise plain), whether the stat cards earn their place under the quest, and whether the status bar should show the path at all before one is chosen.

## 2026-10-18 · Train home: the body in its rank colours (Andrej: "make the ranks visible on the actual body and make it look nice on the train tab of the body on the top")
- The hero's body now shows its **rank colours**, exactly as the Body tab does (Fragile grey, Stable tan, Strong white, Forged gold, Unbreakable cyan; fading muscles dim). No legend on the Train hero (Andrej, a few minutes later: "get rid of this on the train page"); the Body tab keeps its legend. It faces the side most of today's muscles are on and stands still. The session's muscles are no longer lit on the hero (the quest card and the stat cards say what today works); the thumbnails on the quest rows still light them.
- The rank colours belong to the hub: deck.js wraps `drawTrain` again, only to turn them off on the way to the moves, a workout or the done screen; the Body tab sets its own (`rkSync`).

## 2026-10-18 · Train home: no 3D body on top, today's quest is the hero (Andrej: "the body is taking up too much space on the top… if it's not necessary then we can get rid of it")
- Of five options (a half-height hero, a body side card, a head-and-shoulders crop, the body inside the quest card, a hero that shrinks on scroll) and then five without the body (the quest as the hero, an RPG character card, the week first, snapshot stats, a swipeable row of body-part cards), Andrej took **the quest as the hero**. The Body tab owns the 3D body; Train no longer draws it.
- **The top now:** a one-row header (the avatar, "HEY, ANDREJ · Welcome back" with the state line under it, the rank hex, the Home/Gym switch), the status bar (rank, XP bar, path, streak), and **today's quest as one big card**: a still of your body with the session's muscles lit filling the card's right half, "TODAY'S QUEST", the title, "Legs & glutes · 35 min · 4 moves", the reward chips ("+20 RP", "Glutes ranks up"; "Ready Wednesday" in amber when recovering), and the one bone play button. The card's border is lime when ready, amber when recovering. Then the week strip, the Today / This week stat cards, the attributes, the week's other quests.
- At 390×844 the header, status bar, quest, week and the Today stats are all above the fold; at 360×640 the quest and the week are.
- Gone with the hero: the `frameTo` thub branch and the hub's aura rule in ossa.html are now unused on this screen (left in place, harmless); deck.js wraps only `drawPlanFloat`.

## 2026-10-18 · Train home: training first, ranks second (Andrej: "make the train tab practical first… ranks more like secondary useful information")
- Order now: header → today's quest → the week strip → the week's other quests → a "Your progress" divider → the status bar (rank, XP, path, streak) → the Today / This week stat cards → the attributes. Everything you need to train is the first screen; the rank layer is the second.
- With no other sessions in the week, the quests section becomes "More ways to train · View all" (the More panel).
- From the code review of the earlier version (two confirmed findings, both in `frameTo`, ossa.html): the hub's body-box branch now runs only on Train with a real box (it has no box since the 3D hero went, so it is inert), and the session screen's framing no longer reads the hidden week strip (deck.js hides it) but the top bar, so the body sits under the title again, not behind it.

## 2026-10-18 · The level: one number that only goes up (Andrej: "a level feature where the character starts at level 0 overall and as he levels up over time… he can unlock certain things")
- **What it is.** Lifetime rank points (every RP a session or a quick log ever gave, `S.tally.rp`, counted by the engine since Phase 1) make a level on the curve xp(n) = 12.7 · n^1.71 (`vxLevelXp`): level 1 after the first session, 5 in about two weeks of training, 10 in about six, 30 in about ten months, 50 the long game, 99 the cap. Ranks say where the body is now and can fade; the level never drops. The engine owns it (`vxXp`, `vxLevelInfo`, `vxHas` in web/ui/vessel.js) and emits `levelup {from, to}` after a workout.
- **Unlocks are by level now**, on one ladder: Bones layer at 3, the Bioluminescent finish at 8, Ember at 15, Gold at 30. Each keeps its old sessions rule as well (`UNLOCKS[].at`), so anyone who earned a finish by sessions keeps it. Prestige, the path and the Vault's materials keep their own gates for now; a later ladder can add them.
- **Where you see it:** the Body tab shows it in the background: "LEVEL", a thin line to the next level, and the number as a huge outline behind the body in the overall rank's colour, fading out towards the floor, a slow light sweeping through the outline and a soft halo in the same colour; the first time the Body tab shows a new level it reads "LEVEL UP" and the number lands with a lime flash (`S.lvSeen`) (Andrej: "make it visible on the home page", "more visible", "something in the background", "better and nicer", "even better"); decoration only, the full status bar is on Train; the Train home's status bar leads with the level in the rank's hex ("Level 12 · Strong I · Leaning Tank", the XP bar, "38 RP to level 13 · Ember at 15"); Workout complete shows "Level up · Level 13" above the unlocks; the Vault lists finishes "At level 15 · 120 RP to go"; the Bones lock says "Bones unlocks at level 3 · N RP to go".
- **Migration:** a save from before the tally counted points gets the best estimate once (the points in its workout records, or at least what its muscles hold now) and is never lowered.
- **Andrej to confirm:** the ladder (3 / 8 / 15 / 30) and the curve's pace; whether the level should also show on the Body tab; what level 50 unlocks (a material from the Vault without Pro is the obvious candidate).

## 2026-10-18 · The Body page is just the body (Andrej: "I want the home body page to be just this, and everything below just get rid of it")
- The Body tab now ends at the weak-link card: the header, the hero (the level mark, the legend, Front/Back, the body in rank colours, the weak link callout, the layers button) and "Shins · Stable I · 7 sessions to Strong". Nothing scrolls.
- What was under it moved rather than vanished: the check-in, the Body Score, the quick tiles (water, overall rank, posture, body age), For you, Standards and the rows (week in review, Apple Health, sore spots) are **"Your day" at the top of the Profile** (the avatar), drawn by `uiDayHTML` and wired by `uiDayWire` in shell.js. Today's session and the week were already on Train; the **daily dare is Train's "Side quest"**, between the week's quests and Your progress.
- Of the three ways offered (each piece to the tab that owns it; a Today sheet on the Body tab; the Profile as the day's dashboard), this is the third with the dare on Train, because Andrej asked for the Body page to be only the body; the first can still follow later by moving the check-in and score to Recover.
- **Andrej to confirm:** whether the check-in and Body Score should live on Recover instead of the Profile, and whether the Profile needs a "Your day" entry point on the Body page beyond the avatar.

## 2026-10-18 · The Body page fills the screen (Andrej: "make the design of the body screen home page better with spacing and stuff")
- The page is now one column that fills the tab: the header, then the hero takes everything between it and the weak-link card, which sits a card's margin above the tab bar. No fixed hero height any more (it was `clamp(420px, 56vh, 500px)`), so the body is as big as the phone allows and nothing is left dead at the bottom. No scrolling at 390x844, 375x667 or 360x640.
- The body frames itself a little lower (`data-pad` 56, was 30) so its shoulders clear the rank legend; the legend now sits beside the head only. The legend and the Front/Back toggle share one top line; the layers button lines up with the card's right edge.
- The weak-link card has more presence: a 40px rank square, more padding, the larger card radius, the name a step bigger.
- Short phones (under 700px tall) keep a 300px hero minimum and a slightly tighter card.

## 2026-10-18 · Body page: the body alone (Andrej: "make it even better and nicer and cleaner design")
- A design panel (four concepts: subtract, Apple polish, character screen, editorial; three judges: taste, Andrej's advocate, the engineer) picked "nothing on the body but the body" unanimously. Built from its synthesis:
  - **The rank legend leaves the hero.** The five colours now sit as a small ladder on the weak-link card (yours marked, Fragile outlined); the named key is one tap away on Muscle ranks (the card opens it). The flat fallback hero (no WebGL) keeps its legend.
  - **The "WEAK LINK" label and its lead line go.** The lime pulsing ring on the muscle stays and the card says "WEAK LINK · Shins · Stable I". A tapped muscle turns the ring bone and the card's eyebrow "YOUR PICK" in bone.
  - **One glass bar top right:** Front | Back | the 3D view, 44px tall like the streak pill and the avatar. The corner cube button is gone.
  - **The card:** a lime eyebrow row with the ladder, the name and rank at the card-title size, the next step on one line, a 40px rank square, a 1px line all round, no coloured stripe.
  - **One rhythm:** 12px between the header, the hero's top row, the floor, the card and the tab bar; 20px from the screen edge; the streak number at a token size.
- **Kept against the panel's advice:** the level stays as the big outlined number behind the body. The panel wanted a 48px corner stat; Andrej asked today for the level to be "something in the background" and approved the watermark through five rounds, and with the legend gone nothing sits on it any more. It shrinks a step on phones under 700px tall. The corner stat (LEVEL, a 48px number in the rank colour, a 48x3 XP line, top left under the title) is the fallback if the watermark ever feels loud.
- **Andrej to confirm:** the legend off the Body page (colours on the card, names on Muscle ranks), and the label-less weak link.

## 2026-10-18 · "Your day" is on the Profile sub-tab, not above the Evolve hub (Andrej: "if I click on the profile page, it is messed up")
- Bug: the pieces that left the Body page were inserted at the top of the whole Profile tab, above the Evolve | Profile | Settings switch. The Evolve hub is a fill-the-height, no-scroll layout (evolve.css), so "Your day" took the height and the hub collapsed to nothing, with the day content running under the tab bar.
- Fix: "Your day" (the check-in, Body Score, quick tiles, For you, Standards, the rows) now draws only on the **Profile** sub-tab, at the top of its scrolling content, under the switch. The Evolve hub is untouched. The avatar still opens the Profile tab on its last sub-tab.
- **Andrej to confirm:** whether the check-in and Body Score should move to Recover instead, and whether the avatar should open the Profile sub-tab directly so "Your day" is one tap from the body.

## 2026-10-18 · The level and the rank key on the side (Andrej: "place the level mark on the side somewhere so it's easily readable but not in the way and also add the rankings so users can see clearly on the side too but subtle design")
- **The level is a stat at the top left of the hero:** LEVEL in grey caps, the number at 48px in the overall rank's colour, a 48px line to the next level. The outlined watermark behind the body is gone (it was half hidden by the body). A new level still lands with a lime flash and "LEVEL UP".
- **The rank key is back, bottom left, quiet:** five 7px dots with the tier names at the smallest size in the dim text colour, no box; the row of your overall rank is bright with a soft ring on its dot. It sits beside the shins, clear of the body on all three phone sizes.
- The card's five-step ladder went again: the key names the colours now, and the card's rank square carries the muscle's.
- Layout: top left the level, top right Front | Back | 3D, bottom left the key, the ring on the weak muscle, the card below. The body still frames from the bar's bottom edge.

## 2026-10-18 · The level as an RPG emblem (Andrej: "make the level look nicer and cleaner and more RPG style")
- Top left of the Body hero: a 60px hex plate (dark glass, a thin edge) with the level number inside at the screen-title size in the overall rank's colour; the way to the next level is a glowing ring round the plate in the same colour, drawn from the top clockwise. Beside it, two quiet lines: LEVEL and "N RP to go" ("Top level" at 99). Same hex language as the Train tab's status bar.
- A new level: the plate lands from 1.22x with the number, ring and label in lime, "LEVEL UP" beside it, once (`S.lvSeen`).

## 2026-10-18 · The scene switch on the Body page (Andrej: "add the actual wallpaper option there too but subtle so users can switch to different wallpapers")
- Bottom right of the hero, opposite the rank key: a 36px round glass button with a picture icon, in the quiet text colour. Tap it and a glass strip pops up above it with the five scenes (Void, Starfall, Aurora, Embers, Grid) as the same small swatches Settings uses; tap one and the body's backdrop changes at once (the existing `setScene`: saved, the body refreshed). The strip closes after the pick, on a second tap of the button, or on a tap on the body.
- Settings › Scene stays as it was; the two show the same choice.

## 2026-10-18 · A tapped muscle gets its name back on the body (Andrej: "when I click on the body part then nothing shows up like before")
- Tapping a muscle now shows a bone tag with its name beside the body, on the muscle's own side, with a short line to the ring, as well as the ring and the "YOUR PICK" card. The ring stays lime (a bone ring vanished on a bone-lit muscle). The tag keeps clear of the level emblem, the Front/Back bar, the rank key and the scene button.
- The weak link still has no tag on the body: the ring marks it and the card names it.

## 2026-10-18 · The scene shows on the Body page (Andrej: "switching between the different wallpapers on the home body screen doesn't work")
- The body renderer forced the scene to Void whenever the home figure was showing, and skipped the frames that keep a moving scene moving; the switch changed the setting but the Body page stayed black. Now the Body page draws the chosen scene (Starfall, Aurora, Embers, Grid) behind the still figure, and keeps it moving at ~30fps while the page is on screen; Void draws nothing and costs nothing. The figure itself stays still (no breathing, no sway) as before.

## 2026-10-18 · The 3D view's layers are Muscle and Bones (Andrej: "get rid of the systems thing entirely and also the organs, it's no longer needed and just keep the muscle tab and the bones there")
- The switch at the top of the 3D body now has two tabs, Muscle and Bones. Systems (the overview with its glowing points) and Organs (the x-ray with heart, lungs and gut) are gone from the view; the 3D view opens on Muscle.
- The code for both layers stays but is unreachable: any old path that asks for them lands on Muscle, and the old "heart", "lungs" and "fuel" doors (the For-you Fuel card, the old home's highlight buttons) go to the Recover tab instead (Fuel opens the Fuel view).
- **Andrej to confirm:** the organ facts (heart, lungs, gut) are no longer shown anywhere; if they should live on, Recover is the place.

## 2026-10-18 · The band under the 3D body (Andrej: the "Muscles" text is redundant; make Posture scan and Body check a call to action; rethink Recovery / Rank)
- A design panel (game HUD, subtract, Apple Fitness, editorial; three judges) picked the HUD "quest bar" unanimously. Built as `web/ui/band.js` + `band.css`:
  - The layer title (Muscles / Bones) and the week-and-streak subline go: the Muscle | Bones switch at the top names the layer. The band is three fixed rows, 140px on both layers (was about 198), so the body is bigger and never reframes when the layer flips.
  - **Recovery | Rank** is a compact glass switch with a lime dot and a gold hexagon. The readout line under it follows the colouring: the ready / recovering / fading counts and "N/23 this week" in Recovery; your overall rank and the RP to the next step in Rank (tap → Muscle ranks); on Bones the sore-spot count (tap → Sore spots). The streak leaves the band (it lives on Train).
  - **Posture scan and Body check** are two quest tiles with their last result or the reason to do them now. One tile is bone, the next quest: never done first, then due, posture before the check. Anything else due is lime. Both fresh: calm glass, the band reads as your record. A due or never-done tile starts the scan or check; a fresh one opens the results. Posture is due after 14 days (the existing rule), the check after 21.
  - The turn-around button is 44px, level with the switch.
- Alternatives the panel kept on the table: a two-row band (112px, the counts inside the switch, one split button for the due measurement); the Rank readout as a colour key ("4 Forged · 9 Strong · 10 Stable"); the due tile filled lime instead of bone.

## 2026-10-18 · The Body page always comes back in rank colours (Andrej: "when clicking on a body part and train and going back it makes the body parts on the body page greyed out")
- Could not be reproduced in the preview (four paths tried), so the fix is a belt and braces: whenever the Body page's figure comes on, it now re-applies its own selection (the picked muscle, or none, so no isolation from the 3D screen lingers) and re-syncs the rank colouring (`rkSync`), whatever the 3D screen or Train left behind. Before, a sync that ran while the app still wore the Train class could leave the recovery colouring (grey for untrained muscles) on the Body page.

## 2026-10-18 · The workout screen and the run (Andrej: "make the training tab when users are going through their workout a lot better and also after they finish … something the user goes through … so they can't just click away by accident and actually see the progress and what they done")
- A design panel (RPG, coach, subtract, Apple Fitness; three judges) picked the RPG "run and loot screen" for both. Built in `web/ui/workout.js` + `workout.css`:
  - **The workout** keeps the approved plain column but reads like a HUD: under the time, `+N RP · N/N sets` counts up as you log (the engine's own dry run of today's rank points, nothing saved); the 2px hairline is a quest bar with one segment per set, grouped per exercise; the exercise card's chips go quiet with the working muscle lime, the target, Watch and Insights sit on one line, and a muscle meter shows the muscle's rank, today's gain and the bar to the next rank; the bar is sticky and Finish is a small lime pill whose arm underline drains for 3 s; the steppers, plates, the bone Log button and Up next share one sticky dock at the thumb; the bone rest sheet slides into the dock's slot with the effort question inside it, what the set earned, and a line on why you wait; the set table reads done / now / later; the steppers tick; typing hides the steppers so Log stays above the keyboard.
  - **The run.** Workout complete is now steps you go through with Next: Results over the lit body (the numbers counting, a milestone, tease pills for what follows), Personal best, Rank points (per muscle with bars filling, Evolve's rows, muscles hit this week), the rank-up screens, Level up on the hex emblem (the ring runs to full, resets and fills; unlocks listed), Trophies, the Streak, then Next time with Done. One progress strip over everything; the tab bar, the back button and the edge swipe are off; a route or a tab tap buzzes and does nothing. The only shortcut is Skip → "Skip the rest?" → Skip to the end (never out of the run). Done lands on the Train home.
  - The streak screen no longer pops after the summary on its own: it is a step of the run. The "‹ Body" exit from Workout complete is gone.
- Alternatives the panel kept on the table: end the run on the streak (Done on the flame screen) with Next time before it; results as four glass tiles over the body; a four-step compact run with the rank-up hex inline.

## 2026-10-19 · Onboarding: "Out of the Stone", paced like Opal (Andrej: "make it like OPAL and the idea that the body is covered in rock … after answering it is slowly breaking apart that rock forming the body")
- Research (ScreensDesign: Opal's 27-step onboarding, its personal Focus Report, the commitment, the gem reveal after subscribing), a map of the old flow, a shader plan, then a panel (Opal-faithful, character birth, lean; two judges) picked "Out of the Stone" with named strikes and tap-the-statue grafted on.
- **The look:** pure black (no tissue background, no HUD), one question per screen, the headline at the top in heavy Inter with one lime keyword, the sub-line under it, the statue in the middle, full-width cards that turn bone when picked, one bone pill at the thumb, a chapter bar of a few segments ("YOUR BODY · 2 OF 5"). Words fade up together (no more typing).
- **The stone** (`web/ui/rock.js`, a BODY_FX effect compiled only during the intro, at a new `/*FX:ob*/` marker in the onboarding branch of the body shader): the body starts as a grey-brown stone statue in chips, and each answer cracks the part it is about: your name frees the head, the frame the shoulders, goals the chest / upper back / thighs / core, aches crack red where they hurt (a red hairline while picked, tap the statue to pick), the "sounds like you" answers the arms and chest, the voice the jaw, your week the legs, the core and the hips. A tide breaks it slowly from the heart outwards. Chips fall, a tag floats up ("CHEST"), a stone knock plays. Through the holes the old onboarding glass body shows, with its systems lit (brain, nerves, heart, gut).
- **The flow:** Welcome → You (name, frame, ranks) → Your body (goals, aches, two "sounds like you?", the voice) → Your week (days, where, age, sitting) → Reading your body (the cracks spread by themselves) → the report as four story cards (the hard news: hours a year sitting; your weak link; the good news: weeks to the next rank) → Your plan (what Ossa can do this week, your week) → Seal it (hold the stone hexagon: the upper body bursts free) → the hard paywall (only stone boots left) → after Pro, "Tap to free your body": the last stone shatters, FIRST FORM → the reminder (now after the paywall, so only subscribers get the iOS prompt) → Day 1 → your body.
- **Data:** the same OBD fields as before; S is written at purchase (so a quit during the reveal still opens onboarded) and again at the finish. `S.obIn` is saved at the start, so a half-done intro comes back at the next launch.
- **Kept against the panel:** none. **Dropped:** the old HUD, "hold to bring your body online", the analysing ring, the score-ring reveal, the 12-week chart, the Pro welcome confetti (the reveal says it).
- Tuned in the preview: strikes open windows rather than whole regions and the tide is slow, so plenty of stone is left for the seal (the big break) and the paywall.
- **Andrej to confirm:** the hard-news card (hours a year sitting) is the right "shocking number" for Ossa; the order (reminder after the paywall); the stone colour and how much breaks per answer, on his phone.

## 2026-10-19 · The intro's sound no longer breaks up (Andrej: "fix the sound on the onboarding, sometimes it sounds like the sound is breaking")
- **Cause, measured in the preview and checked by an adversarial audit:** the music is scheduled a quarter of a second ahead by a timer. When the page is busy for longer (the stone shader compiling, a heavy screen, the finish), the timer misses its turn and then starts every note it missed at once, late; WebKit then jumps each late note straight to full volume. With the page forced to freeze for 1.2 s every 9 s (a slow iPhone), 56 notes started late, up to 0.83 s, in bursts. That pile-up is the "breaking". On top of that the intro ran three separate audio engines (the music, the stone knocks, the chimes) with nothing limiting their sum, and the knock jumped to full volume in one sample.
- **Ruled out by the audit:** clipping (the loudest moment peaks at about -5.7 dBFS), the bass and the iPhone speaker's protection, the echo, notes ending abruptly, the microphone and gesture rules of iOS, and the sample rate.
- **Fix (web/ossa.html, web/ui/rock.js):**
  - One audio engine for the whole app (`ossAudio()`): the music, chimes, stone knocks and the dial tick share it, and it ends in a limiter (its automatic make-up gain is taken back off, so nothing is louder). It sleeps after a few quiet seconds, fades out over 40 ms before sleeping when the app is hidden, and wakes on the next sound.
  - The music looks 0.6 s ahead instead of 0.25 s, and after a long freeze it drops the notes it missed instead of firing them together (a chord that began in the gap still plays, from now). Sounds that answer a tap (the answer shimmer, the chime, the knock) are scheduled 20 to 50 ms ahead, so a slow phone still starts them on time.
  - Less work on the audio thread: the music's slow wobble is computed once per block instead of per sample on every voice, and every voice lets go of its oscillators, filter and gains when it ends (they were processed until the end of the intro).
  - Fades hold the volume the music really has before ramping (no jump). The knock gets a 2 ms attack, is a little quieter, and plays at most once every 70 ms.
- **Measured, whole intro, desktop Chrome:**

  | | Before | After |
  |---|---|---|
  | Audio engines | 3 | 1 |
  | Late notes, page frozen 1.2 s every 9 s | 56 (up to 0.83 s) | 0 |
  | Audio-thread load, mean / peak | 14% / 21% | 7% / 10% |
  | Loudest moment at the speaker | 0.64 | 0.38 to 0.44 |
  | The music alone for a minute, loudness | −18.43 dB | −18.40 dB (the same) |

  With the processor slowed 4×, a handful of tap sounds still started a few milliseconds late; their lead was raised to cover it. No clipping and no growth in live sound nodes in any run.
- Not done: "playback" latency is requested but iOS ignores it (WebKit always uses small buffers), so the fix doesn't rely on it.
- **Andrej to confirm:** on his iPhone (web only: `npm run update` or Expo Go is enough) that the intro sounds clean all the way through, including the finale. If it still breaks, listen once through headphones: breaking only on the speaker would point to the level or the bass; on both, to timing.

## 2026-10-19 · A new App Store listing: eight framed screenshots, a new icon, new copy (Andrej: "create new listing for this the images based on professional designs and also a new icon")
- **Research** (ScreensDesign, 11 professional sets: Gravl, Symmetry, MacroFactor, Strava, Fitbod, Liftoff, GymStreak, Flighty, Gentler Streak, Finch, Opal; 26 icons). The rules we followed:
  - Slide 1 is a poster.
  - Headlines are 2 to 4 words, with one keyword in the accent.
  - One background system for the whole set.
  - The phone is big and runs off the bottom.
  - One card is lifted out of the screen.
  - The first three slides tell the story.
  - Proof is honest: no ratings, laurels or user counts, because Ossa has none.
  - A separate design panel (three set concepts and a creative director) reached the same set on its own.
- **The set:**
  - Black canvas. Headlines are uppercase heavy italic: the app's own "FORGED I" type, so the store reads like the game.
    - Sentence case was tried and kept as an alternative.
  - The keyword is lime, except on two slides where it takes the screen's own colour: gold on the rank-up and cyan on Focus. Stone grey on "as stone".
  - The phone is 1,000 px wide in a graphite frame, with a soft glow behind it and the same position on every slide.
  - Each lifted card is the app's own element, zoomed over its own spot, so nothing shows twice.
- **One story:**
  - Slide 1: your body, with the chest at Strong III.
  - Slide 2: today's quest, Upper A, "Chest ranks up".
  - Slide 3: the bench press, with the chest one point from Forged.
  - Slide 4: "Chest is Forged".
  - Every number agrees across the slides (Level 13, 22 RP to go; 9:41, done by 10:21; the chest Strong III and the lower legs Stable I on every slide that shows them).
- **The eight slides, in order:**
  1. YOUR BODY. **RANKED.** No phone frame, plus the real level emblem, rank key and weak-link card, and a lime lead to the shin.
  2. TRAIN TODAY'S **QUEST.**
  3. EVERY SET **COUNTS.** It was "Every set earns RP", changed because mobility sets earn none.
  4. RANK UP **EVERY MUSCLE.** The real rank-up screen, full-bleed.
  5. LEVEL UP **FOR LIFE.**
  6. IT STARTS **AS STONE.** The intro's welcome statue.
  7. TRAIN YOUR **MIND TOO.**
  8. MAKE IT **YOURS.** Your look in Chrome, with "No account · No ads · Stays on your phone".
  - Files: `store/screenshots-6.9in-v3/` (masters) and `store/screenshots-6.3in-v3/` (the required set). The overview is `store/listing-v3-overview.png`. The v2 folders stay for now.
- **How the screens were made:** real captures of the current build in headless Chrome.
  - Settings: 440 × 956 pt, 3× scale, Dynamic Island safe areas, the page clock set to 9:41, and the 3D body rendered at 2× for capture only.
  - The frame draws the status bar and the phone.
  - Store-only demo tweaks:
    - shoulders at Unbreakable, so all five rank colours show
    - region scores aligned with the body
    - no sore spots
    - Upper A ready today
    - real lift history on the upper-body moves
    - scores nudged so every rank-up chip names a singular muscle
  - Capture-only fixes, none of them in the app:
    - the workout's doubled top gap (bug 1 below)
    - the intro's sound toggle and footer line hidden
  - Everything needed to redo it is in `store/listing-src/`: `cap-all.js` takes every capture in one run, then `frames.js`, `render-frames.js` and `publish.py`. See its README.
- **QA:** two adversarial checkers (visual, App Store rules) went over the first render.
  - Nothing would get it rejected: sizes, RGB with no alpha, the icon, no prices or fake proof, and every claim matches the description.
  - The polish points they found were fixed in the frames or the capture state: half-hidden lines, the status-bar zone on slide 5, the stray sound glyph, the low-res statue, the see-through pill, numbers that disagreed between slides, and the leg-day/chest mismatch.
- **The icon: "Breakout Hex".** The rank hex in grey stone, split top to bottom, with lime light breaking out: the stone intro and the rank emblem in one mark. It is the only lime-on-black glyph in Health & Fitness, where Ladder and Gravl use a lime background.
  - How it was chosen: four concepts were drawn and tested at 180 to 29 px on dark, light and tinted wallpapers, then a judge and a polish pass.
  - The polish removed the lightning-bolt kink, added cut faces so the halves read as pulled apart, warmed the stone and tightened the glow.
  - The hex was then made regular (narrower), to match the level and rank emblems in the app and to stop it reading as a hex nut.
  - Runner-up, kept in `store/icon/alternates/`: "Level Ring" (the level emblem's XP ring). It is the cleanest when small, but it reads as a loading spinner and drops the stone and the body. Also kept there: the wider Breakout Hex, the first version, First Form (it looks like a pictogram) and Stone Torso (it reads as a wound).
  - Updated together:
    - `assets/icon.png` (1024, opaque)
    - the Android adaptive foreground and monochrome
    - the splash image
    - the notification icon
    - the favicon
    - `store/google-play/icon-512.png`
  - The old files are in `store/icon/old/`. The icon ships only in a new EAS build.
- **Copy** (fact-checked against the code at b833e50 by two adversarial checkers):
  - Name: `Ossa: Level Up Your Body`. It replaces `Ossa: Posture and Training`, which described the old app; "posture" moved to the keywords.
  - Subtitle: `Workout log & 3D muscle ranks`. Keywords: 99 bytes, with `back,pain` for "back pain".
  - The description gains the hard-paywall line as its second paragraph, plus sections for the level, the run, Focus and Evolve. Claims that weren't true were fixed:
    - Only training sets earn rank points.
    - Today's quest doesn't start at the weak link.
    - "Aching?" opens Sore spots.
    - The aura grows from breathing and Monk Mode only.
  - Review notes 1 to 3 are rewritten, so the whole Notes field fits Apple's 4,000 bytes. All of this is in `store/APP-STORE-LISTING.md`.
- **App bugs seen while capturing.** I didn't fix them: web code was off-limits for this task.
  1. The workout screen adds the top safe area twice (`.app.train.tactive .trainv{top:calc(10px + env(safe-area-inset-top))}` in ossa.html, plus the `.wk-bar` padding in workout.css). That leaves about 62 px of dead space above the HUD on Dynamic Island iPhones.
  2. A first timed personal best reads "was undefined s" (Hanging leg raise).
  3. Plural muscle names take a singular verb: "Glutes is Forged" on the rank-up, and "Glutes ranks up" (hard-coded in deck.js, `${rkSay(up.k)} ranks up`).
  4. The Train header can show a raw key: "Upper A · pec major ready wednesday".
  5. The intro footer says "Everything stays on this phone" (onboarding.js). That claims more than the privacy label, so it should say "What you log stays on this phone".
  6. Smaller copy points:
     - "EST. 1-REP MAX" wraps.
     - "30×10" has no units.
     - "1 to Forged I" and "5 TO FORGED II" don't say RP.
     - "3150 RP" has no thousands separator.
     - The Train header hex shows the rank ("II"), which can read as a level.
  7. The intro's mid-way body shows organs and pink tissue through the cracks. That doesn't suit a store shot, so slide 6 uses the welcome statue.
- **Andrej to confirm:**
  - The name change.
  - The icon, or the Level Ring instead.
  - Uppercase italic headlines (sentence case is the alternative).
  - Whether `pain` stays in the keywords.
  - Once bugs 1 and 3 are fixed, retake slides 2, 3 and 5 with `cap-all.js`.
  - Nothing has been uploaded to App Store Connect.

## 2026-10-19 · The 3D view page folds into the Body page: lens chips, an X-ray knob, hold to flag, pinch into a region (Andrej: "remove the Muscle/Bones page without losing anything, and the home screen gains only two small controls: the lens chips and the X-ray knob. Then add 7 and 6 … make it great")
- **The target:** Andrej's recorded mockup. Lens chips Rank / Recovery / Bones sit left of the body. An X-ray knob drags a line down the body to show the skeleton above it. The legend, readout and pick card follow the lens, and Posture scan and Body check sit under the card. From the ideas list: 7, long-press to flag sore; 6, pinch into a region.
- **What the Body page gained (`web/ui/lens.js` + `lens.css`):**
  - **Lens chips** under the level emblem: Rank (a gold hex dot), Recovery (lime), Bones (a ring). Bones keeps the old layer's lock (level 3, or the session rule).
  - **The X-ray knob**, a small "X-RAY" pill on a dotted track at the right edge.
    - Drag it down: muscles above its lime line turn to glass (a new `lx-split` BODY_FX chunk at the `final` mark) and the skeleton shows through (the old Bones SVG, clipped to the same line).
    - All the way down is the Bones lens.
    - A tap sweeps it down or back up. The arrow keys move it for VoiceOver users.
  - **The lens decides three things:**
    - **The legend:** the five ranks; or Ready / Recovering / Fading / Not trained; or OK / Watch / Sore.
    - **A readout line under the body:**
      - Rank: "Strong II overall · 6 RP to Strong III · 1 flagged".
      - Recovery: "22 ready · 0 recovering · 1 fading".
      - Bones: "13 OK · 1 watch · 0 sore · Tap a joint".
    - **The pick card:**
      - Rank: Your pick / Weak link, as before.
      - Recovery: the least recovered muscle, a fading one, or "All ready".
      - Bones: "Joint watch". Sore comes from your joint flags. Watch comes from a flagged muscle round the joint, an old ache, the posture scan or the body check. The card adds "Posture scan suggested" or "Body check suggested" when one is due.
  - **The ring follows the card** in every lens.
  - **The Posture scan and Body check tiles** come from the old page. They show the same states: one bone "next quest" tile, a lime due tile, or the last result.
- **The two gestures:**
  - **Hold** a muscle or a joint for half a second.
    - A bone ring grows under the finger.
    - It's flagged sore (`vxFlagAdd`, with the side you pressed), and its fade pauses.
    - A red ring and a short red pulse on the body confirm it, through a one-off flash in the sore effect: `vxSoreS().flash`.
    - Toast: "Left quads flagged · fade paused". Holding again unflags it.
    - **Decision change:** the Body page used to stay still, with red pulsing only on the Sore spots screen (DECISIONS rule 10, 16 Oct). Now there's a single 1.3 s pulse to confirm a hold.
  - **Pinch out** on the body (a ctrl+wheel trackpad pinch on a desktop).
    - The camera flies into the region under your fingers (`Body.focusAt`, zoom 1.85), and the region lights up.
    - Its sheet opens with "Train this region".
    - Pinch in, or close the sheet, to fly back.
    - The chips, knob, legend and level step aside while you're in.
  - **One-time tips:** the first tap on a muscle teaches the hold; the first flag teaches the pinch.
- **Nothing lost: where everything on the old 3D page went**

  | Old 3D page | Now |
  |---|---|
  | Muscle / Bones dial | The lens chips (Bones = the X-ray all the way down) |
  | Recovery / Rank switch | The lens chips |
  | Readout row (counts, overall rank, sore spots) | The readout line, with the same taps (Muscle ranks, Sore spots, the Recover list) |
  | Posture scan and Body check tiles | Under the card |
  | Joint taps and joint sheets | Tap a joint where the skeleton shows: the card names it, and the card opens its sheet |
  | Muscle and region sheets ("Train this muscle/region") | Open over the Body page, from the card, search links, a pinch, Muscle ranks, the Recover list |
  | Water pill (show the water in your body) | A switch in the scene pop-up. Your day's water tile shows it on the Body page for a few seconds |
  | Scene button | Beside Front / Back |
  | Music button | Settings › Music, as before |
  | Turn-around button | Front / Back |
  | Callouts ("Triceps · 28% recovered") | The Recovery card and readout |

- **Every way into the old page lands on the Body page:**
  - `rkShow3D(o)` is redefined in lens.js, with `o.lens` and `o.view`.
  - `go("m:…" | "r:…")`: a region flies in.
  - `setLayer("frame")` opens the Bones lens.
  - Recover's muscle rows open the Recovery lens.
  - Muscle ranks' Front/Back cards keep that side. "See your ranks in 3D" is now "See your ranks on your body".
  - A safety net: a bare 3D stage, with nothing over it, sends you back after about 1.3 s.
  - Focus, Sore spots, Train, lessons, the body-check and posture views and demos keep the stage as before (tested).
- **Retired:** `band.js` and `band.css` (the 3D page's band) and the cube button.
- **Fixed on the way** (from today's health check):
  - **Ghost joints:** a hidden skeleton's joints caught taps after a visit to Bones (`.bones:not(.on) .bn-j{pointer-events:none}`).
  - **Scene picker:** closing it by tapping the body also picked a muscle.
- **Tested** with real taps and touches in headless Chrome at 440×956 and 375×667:
  - all three lenses and the split
  - hold to flag and unflag (a muscle, and a joint)
  - pinch into the chest and back
  - every redirect
  - no console errors
- **Not yet:** felt on a real iPhone (the hold timing, the pinch threshold, and the 30 fps cost of the skeleton redraw on older phones).
- **Andrej to confirm:**
  - whether the lens should be remembered between launches (now each launch starts in Rank)
  - the red confirm pulse
  - the "X-RAY" pill wording

## 2026-10-19 · Market review, life stats, review prompt, smoke test
- **Review:** Ossa vs DAWG and QUITTR, ten proposals, mind map and an eight-part work split: https://claude.ai/artifact/YLPaKE2WgCw6uSX1353MMv. Andrej: "do your choice", so picks 1 (a score that names the weak link), 4 (Apple's review prompt), 5 (iCloud backup) and 9 (smoke test, feature freeze) were taken.
- **Direction (Andrej):** "an RPG level up, get better and improve your life". The body stays the character; its stats are your life.
- **Life stats** (`web/ui/stats.js`, `stats.css`): Strength (Train), Mind (Focus), Recovery (Recover), Discipline (streak). Each 0–100 = a starting point from the intro's answers + what you've logged. Game scores, labelled "Not a health measure". Names, colours and copy sit in `stDefs()`/`stCopy()` so another tone (the "System" draft) can drop in.
  - The intro gets a **character sheet** step after the report, before the plan ("Level me up"): four stats, radar, a dashed 12-week plan ghost, weak link, lowest stat. The character's rank is the body's (a new body is Fragile).
  - In the app, **tapping the level emblem** on the Body page opens the same sheet (`#stP`). The emblem now takes taps.
  - `S.profile.quit` is saved so Discipline keeps its starting point.
- **Review prompt** (`expo-store-review`, needs a new build): asked once at the intro's plan reveal (before the paywall) and once after the first workout run (`vxAskReview` in vessel.js, `S.rev`). No question first, nothing gated on it (App Review 5.6.1). Apple decides if it shows; never in TestFlight.
- **Phone check off** (`nvCheck.on=false`) for the App Store.
- **Smoke test** `node scripts/smoke.js [--shots]`: builds, then runs the whole intro (paywall included), every tab, and a full workout plus the run, at 390×844 and 375×667. Run it before every `npm run update` and build.
- **Waits for 1.1:** iCloud backup of the save (native). Submission: Andrej later ("lets just focus on building the app").
- **Hex Constellation tab bar** (`web/ui/hexnav.js`, `hexnav.css`; Andrej: "yes"): the design thread's HexTabBar.tsx ported to the web layer (Ossa's tabs are the page's `#uNav`, not React Navigation, so no new native packages). Order Train · Focus · Body · Recover · Learn, Body highest in the middle; the tab you're on fills lime, lifts and shows its stat (STR/MND/REC from the life stats, LV on Body) with the stat as a ring; a shooting star runs between tabs. The bar is 76 px (was 64) so the risen hexes don't cover content.
- **Body page starts facing you** (Andrej, 19 Oct): Front is the default on start, even when the weak link is on the back. A picked muscle still turns the body to its side.
- **Train: Daily Quest, The Forge, cold-muscle swap** (Train tab design lab; Andrej: "yes I like your idea, implement it"; mockup https://claude.ai/artifact/FxKHBaUx66eHLinSt1zB1Y). deck.js: the quest card gets a one-line reason (fading or grey muscles it heats, else the weak link, else the split), chips +RP · region ↑ · minutes, "Swap for my cold muscles", a "Quest cleared" state with "Train something else", and a "Rest day" state with a Recover link. New `web/ui/forge.js`/`forge.css`: the side quest ticks in place (+15 RP bonus), the cold-muscle sheet (every muscle by stateOf, fading and grey picked, one move each for your kit, opens the Session screen), the workout ghost line (last time's best set; beat it once per exercise for +5 RP), a +RP pop from Log set, heat on the muscle meter, and the rest countdown in a draining amber ring with a heavier buzz at zero. Bonus RP (`vxBonusXp` in vessel.js) goes on the lifetime tally only (level), never on a muscle; counted in `S.tally.bonus`.
- **Focus: Eyes and the lock-in** (Focus tab design lab; Andrej: "yes I like it, implement it"; mockup https://claude.ai/artifact/GU9o66gjhkPxReVV3LMJ8F). New `web/ui/eyes.js`/`eyes.css`: an Eyes score 0–100 on the Body tiers (`S.eyes`), started from the intro's new "phone" step (hours a day → "N years of the next 64 on a screen", `S.onb.phoneHours`; start clamp(50 − h×4, 10, 45), 30 if skipped). Focus home: the Eyes strip replaces the aura level bar, a lime "Lock in · N min" under the dial, the report streak on Check in. The Eyes screen (eye, 7-day bars, three daily directives worth +8–12 aura and +1 eyes, untick reverses) and "Report in" (a slider, ±8 eyes against yesterday, +5 aura, the streak, "hours taken back"); a 21:30 reminder. Monk Mode is now "Lock in": a stake (None/20/50, won 2× at a full finish, lost on a break clamped to the level floor), a ghost line (+15 aura past your longest), "If you leave" note, rotating status, Eyes +3/+5/+10, a 9:16 share card, and the broken screen. Breaking: back from the background after more than 10 s, before the end (iOS "inactive" never counts). App.js shows "Your lock-in is breaking" at once on leaving and drops it on return (`native/reminders.js` nowNote/dropNote: needs the next build). Not today: Screen Time auto-fill, app blocking.
- **Aura on the character** (Focus lab; Andrej: "yes"; mockup https://claude.ai/artifact/UjQnbcUGDrL6bFP2n27fp2). "Aura XP" reads "aura" everywhere on the Focus side. New `web/ui/aurabody.js`/`.css`: tiers Faint 1–4 · Steady 5–9 · Bright 10–14 · Radiant 15–19 · Ascended 20+; on the Body page the body's own renderer glow (Body.setAura, kept low since it also tints the backdrop) in the tier colour with a 5.6 s breath, rising sparks, a floor glow, a halo (Radiant) and orbiting hexes (Ascended) on a 2D canvas, the tier name under the figure, and "LV · N aura · bar" under "Your body". The gain plays once on return (S.aura.unseen/unseenSrc/seenLv): "+N aura" with its source, sparks fly into the chest, the glow flares, the number counts up, a level-up or new-tier banner. Losses flicker red ("−N aura · Level is safe"). aura.js gains `auGrant` (outside the caps) and `auraLose` (floor for a stake; a relapse can drop the level: levels now follow xp both ways). The intro's character sheet starts everyone at Faint · LV 1.
- **Clean streak (Willpower)** (Focus lab; Andrej: "yes and make it so the actual goes down and they can also go down in level also"; mockup https://claude.ai/artifact/SnqSEKg2frtX1paWKLwtCm). New `web/ui/clean.js`/`.css`, opt-in from a Focus home chip and a row on Eyes, never in the intro: the opt-in (up to 3 reasons, Discreet mode renames it "Willpower" everywhere), the streak (live timer, milestone hexes 1·3·7·14·30·60·90, aura orb, Best / Clean days / Aura earned), "I feel an urge" (60 s long-exhale breath, your reasons, +15 aura up to 3 a day, or lock in for 25), "I relapsed" (what changes, trigger chips +5 for honesty, then −min(400, 20×days) aura through auraLose, which can drop the level; glow dimmed 24 h), the result (count down, LEVEL DOWN), milestones with a share card that never names it. +10 aura a clean day, paid on open for every full day; milestones +25/50/100/200/300/500. The Body page shows a relapse as a red flicker and "LEVEL DOWN · Aura LV N", and the glow stays grey until S.clean.dimUntil. App Store age rating answers may need a look before submission.
- **Break free: every addiction, not just porn** (Andrej: "instead of quitting porn, make it like an addiction overview in general"). The clean streak is now one streak per habit under a "Break free" overview (clean.js): porn (Discreet "Willpower" on by default), nicotine & vaping, alcohol, weed, doomscrolling, gaming, junk food & sugar, gambling, or your own named one. Each has its own timer, milestones, urge help (reasons default to that habit), relapse and aura; the overview lists them with days and the next milestone, plus "Quit something else". S.clean is now {v:2, habits, cur}; an existing single streak migrates as the first habit. Any dimmed habit greys the Body glow. The Focus chip reads "Break free", "Nicotine · 12d" or "Quitting · 3".
- **Train by area** (Andrej, 19 Oct: "a list of collections of what part to train for easy access"): a swipeable row on the Train home under the week strip: Chest, Back, Shoulders, Arms, Legs, Glutes, Core, Upper body, Lower body, Full body, Mobility. Each card shows a still of its muscles lit and how many are ready; a tap builds a session from your kit (one move per muscle, recovering muscles last) and opens the Session screen. In forge.js.
- **Clean-up pass, part 1** (Andrej, 19 Oct, from his Samsung screenshots): the workout is dark all the way and fits one screen (icon-only Watch/Insights, compact set rows, the plan tip hidden when the ghost line shows, a dark rest panel with lime Skip); the workout and the run start at the top of the screen (they sat 85 px down under an empty band); the run is solid black except on the results, the level step is centred with a full hex outline, Next is lime, "N of M · Next: …"; nothing rubber-bands (`overscroll-behavior:none`, WebView `bounces`/`overScrollMode`); Android stops padding the system bars twice (App.js keeps SafeAreaView edges only where the page reports env() = 0, via a "insets" message); the intro keeps its main button pinned on screen, selected answers are dark with a lime edge, the name field has an even lime focus edge, the stone body fades when the keyboard is up, the phone-hours card and character sheet fit 360×740 and 375×667, the sheet starts at LV 1, the paywall hides the line behind it; Train drops the "Hey, welcome back" greeting for a compact "Train" header, with the week strip, today's quest, then Train by area. The floating gear on Andrej's screenshots is Expo Go's developer button, not Ossa.
- **The tab bar tucks away** (Andrej, 19 Oct: "hidden kinda … scroll left and right to switch … an arrow to bring up the navigation"). hexnav.js: the hex bar sits below the screen; a 40 px strip shows five hex pips, the tab name and an up arrow (--navH 40, so every screen gains 36 px). The arrow raises the full bar; it tucks away after a pick or 4 s. A horizontal swipe moves one tab left or right, except from the screen edges (the phone's back gesture), on the 3D body, scrolling rows, canvases and inputs, and never on full-screen flows (workout, run, intro, Focus tools, open panels).
- **Unwind full screen** (Andrej: "entirely dedicated to just seeing the main part"): the toy fills the screen, with no header or tab strip; a small close button top left, the sound as an icon top right, the three toys as a slim pill near the bottom that fades after 3 s idle, and the hint fades after the first drag (unwind.js, `.app.uwfull`).
- **Focus home: "Aura core"** (Focus page redesign, option 3; mockup https://claude.ai/artifact/HGbhmPa5B9DGWx14U42iRK). New `web/ui/focushome.js`/`.css` replace the orb dial home: the aura core (4 breathing tier glows, the level ring, rising sparks, a halo at Radiant, orbiting hexes at Ascended, grey while a relapse dims it; the gain since Focus last showed it counts up and floats "+N aura"; a running lock-in shows its time left), two pills (to next level, today's aura), a card row (Eyes, Break free, Quests, Reset → Breathe/Unwind/Heartbeat sheet, Check in), Lock in · N min · +aura (the last length, default 50) and I feel an urge. The core opens More; nothing was removed from More.
- **Navigation: the pill** (Andrej, 19 Oct: "make the navigation cleaner and better and easier to use"). Replaces the tucked strip and the arrow: every tab is one tap away on a slim floating glass pill (48 px) of five icons, Train · Focus · Body · Recover · Learn (Body in the middle, the swipe order). The tab you're on shows its name in lime on a lime-tinted capsule that slides from the old tab to the new one; each icon is a 54×44 target. The mid-screen swipe stays; the pill hides on full-screen flows (shell.css's own rules). --navH 56. Body and Focus fit 360×740 and 375×667 without scrolling (the Aura core is a little smaller: min(300px, 34dvh)).
- **Workout complete, first slide** (Andrej: "Fix this"): the body has its own box under the top row (rdHeroBox returns it while the results show, so the 3D framing centres the figure there, clear of the progress bars, Skip and the status bar); title centred; the four stats in one row of cards; no second "+N RP" pill; the other pills in one centred row; black above the body. Fits above Next at 360×740 and 375×667.
- **Completion screens and the level sheet** (Andrej, 19 Oct, from his Samsung): Workout complete now shows the gains on the body as an animation: after the camera settles, the worked muscles pulse one by one (biggest gain first, up to six) with a "+N Name" tag rising off each (fgGainsAnim, Body.pulse + Body.project of MCEN). The last slide ("Logged. Recovery starts now.") gets the same treatment as the first: title centred, the body in its own box (rdHeroBox), black above and below it (no glow behind the status bar), then "Where your sets went", the reset reminder and "Your sets" stacked above Done. The stats sheet (tap the level) is now a bottom sheet over the dimmed Body page instead of a full-screen panel, and closing it kicks a redraw: on Andrej's phone the 3D body vanished for a moment after the full-screen panel closed.
- **Whole-app audit** (Andrej, 19 Oct: "go through the whole app … find inconvenient features or layouts and also inconsistencies … and fix it"). New `scripts/audit.js` captures 51 screens at 360×740 and 375×667 and checks each for things cut off, covered buttons, targets under 40 px, text under 11 px, faint text and unwanted scroll. Fixed (new `web/ui/polish.css`/`polish.js` plus small edits): Lock in setup and timer, Break free's habit screen, Breathe, Body check and Posture scan keep their main action on screen; the Body page says "Aura level" so it never reads as a second level; Monk Mode is "Lock in" everywhere (rules, toasts, notification, finish) and the aura rules are current (tiers, all sources, relapse can cost a level); the Eyes screen is titled Eyes; Learn has the tabs' header; Focus says "Directives" (Train owns "quests"); the You page no longer has a Profile tab inside a Profile page; small controls get 44×44 touch areas; Learn and Body check text is 12 px; the cold-muscle sheet closes with a round X and Lock in setup goes back with an arrow; the session's chip row fades at its edge. For Andrej's call: fewer progress numbers (fold Learn level into aura), one colour rule for main buttons, one back-button style, an easier way to Settings, a lighter Body page. Report: the Ossa App Audit artifact.
- **The Focus tab becomes Rank** (Andrej, 19 Oct: "the focus screen is quite confusing and doesn't really vibe well with the aura thing … make it a page showing the rankings and what the user can unlock after time"). New `web/ui/rank.js`/`.css`: the second tab is named Rank (hex-with-chevron icon) and opens on one page: your rank card (body level hex, overall rank, the five-rank ladder with "You" inside your rung, RP to the next rank, and your aura level as its own bar), the next unlock (soonest first, "about N days at your pace" from the last 21 days of training or 14 days of aura; body unlocks count level or workouts, whichever comes first, as vxHas does) with one button (Train or Lock in), Level up (Train, Lock in, Break free, Eyes, Reset, Check in, Learn, How it works: the old Focus tools, one tap each; a running lock-in shows as a banner with its countdown), your three strongest and weakest muscles (a tap shows the muscle on the body), and the unlock road (unlocked as chips; the rest with progress and when). Reads existing data only. "How aura works" stays the long page behind it. The Aura core home (focushome.js) stays in the code as the fallback.
- **Audit point 1: one level less.** Learn's lessons earn aura (rank.js wraps rdAward; first lesson 10–15, practice 5); the Learn page and the lesson finish show the aura level instead of a separate Learn level. The rules page lists lessons as an aura source.
- **Audit point 3: one back control.** Every page-level back is a "‹ Place" pill that names where it goes (40 px, glass): the Rank tab's screens and Lock in ("‹ Rank"), Unwind, Fuel ("‹ Recover"), You ("‹ Body"), Evolve, Exercises, Kinetic chain, Train's More, Where your sets went (panels over a tab name that tab; uiPlaceName/uiBackSet in shell.js). Closing a sheet stays a round X; the workout's minimise stays an icon (it isn't a back). Not doing point 2 (one button colour rule), as Andrej chose.
- **Spin, click and zoom the body** (Andrej, 19 Oct: "turn the character by spinning him and like a slight subtle clicking sound and also pinch to zoom around"). The Body page's tap layer now drives the engine's own camera (new `Body.turnStart/turnTo/pinchStart/pinchTo/gestureEnd/wheelZoom/yaw` in ossa.html): drag to turn with momentum, and the existing dial clicks every 10° with a deeper notch and a light buzz every 90° (Settings › "Dial clicks when you turn the body" turns them off); pinch zooms 1–3.2× around your fingers and pans, one finger pans up and down when zoomed; Front | Back follows the side you land on. Double-tap backs out to the whole body when zoomed, otherwise flies into the region under your finger with its sheet (this is what the pinch did before; the pinch is now a free zoom). Zoomed in, the body fades out under the header and the colour key steps aside. The tips say so.
- **Bug: the workout showed through the Body page** (Andrej's Samsung, 19 Oct: "whilst training … after going back to home page"). Cause: with a workout minimised, the rest running out called `drawTrain` → `drawActive`, which turned `.tactive` back on over whatever page you were on (the workout view showed through the hero and the body was reframed away). Fix (workout.js): `drawActive` does nothing unless the app is in train mode; coming back through the Train tab draws the workout as usual. When the rest runs out while you're elsewhere you still get the buzz, plus a toast: "Rest over. Tap Train to carry on."
- **The guide: how Ossa works, right after the intro** (Andrej, 19 Oct: "make a very very good tutorial page when the user after goes through onboarding so he knows how it works"). New `web/ui/guide.js`/`.css` (prefix gd) replace the old tour (startTour is redefined there; shell.js's copy is gone; the legacy TOUR/#tour stay unused). A spotlight walks the real screens, one thing at a time, with one card each (Back, Next, Skip): your body (you spin it; the step moves on by itself once you do), tap a muscle (same), your level and how ranks climb and fade, today's quest on Train, Rank and aura on the Rank tab, Recover, Learn, and the tabs and swipe. It ends on a lit hex, "Your first quest is waiting", with "Start my first quest" (to Train) or "Look around first". It starts on its own after the intro for anyone not yet toured, waits out the paywall, a workout or the intro, and never blocks a real screen behind it except the spotlight on the hands-on steps. Settings › "How Ossa works" (was "Show the tour again") replays it; Android back steps back. The plain app voice, not the "System" voice (still not adopted). The earlier "First steps" design (a multi-day starter quest with the body's speech bubble) is still unbuilt; this guide doesn't rule it out.
- **Focus tab = session levels + difficulty; bone ranks on Body; aura is discipline only** (Andrej, 20 Oct, from the Focus redesign thread: LEVELS-SPEC.md and BONES-SPEC.md; the Boss fight spec was dropped before any code). New `web/ui/skills.js`/`.css` (prefix lu): Study, Focus and Offline are skills with levels and ranks E–S (titles per skill), sessions run on the lock-in timer (run.lu): +3 XP a minute live, +50% on a full finish, ×1.2 on a 3-day streak; Offline counts only face-down minutes (new `native/face.js`, expo-sensors accelerometer, z < −0.8; App.js `face` message; Expo Go has it, TestFlight needs a build). Difficulty Easy/Normal/Hard/Nightmare (need ×0.5/1/2.5/5, durations, leave and missed-day rules; Nightmare puts NIGHTMARE before titles), picked in the intro after the questions (a System window, 2×2 cards) and in Settings › Difficulty. The Focus home: skill tabs, the hex level hero, durations with XP previews, Start; ⋯ holds Break free (+ urge), Eyes, Breathe, Check in, Learn, How it works. The session screen, the finish (LEVEL UP / RANK UP with its unlock), a broken session and a LEVEL DOWN banner. Rank roads per skill (Body's RANK hex opens them); the old Rank page is a view from there. `web/ui/bones.js`/`.css` (prefix bo): the overall rank tints the 3D figure's base (a BODY_FX base chunk: Bone, Stone, Iron, Obsidian, Gold with a sweep, Starforged with stars), Study marks the head, Focus lights the eyes, Offline grows the shadow (a canvas over the hero), the reforge (cracks, flash, banner) and skill rank-up banners play once on Body; Body header "BONES · IRON" and three skill cards (the hero gives a little height so it still fits without scrolling). Aura now comes only from Break free, urges, milestones, the report, directives and the daily streak (+10 a day; +50/+200/+500 at 7/30/100); sessions, Breathe, stakes and lessons give none. Existing users: past lock-in minutes seed Focus XP, difficulty Normal, aura kept.
- **A lighter Body page** (Andrej, 20 Oct: "it makes the body page overloaded … adjust and improve"). The RANK hex and the three skill cards became one tappable line under the title (a rank gem in the material colour, the material name, S/F/O with each skill's letter; it opens the rank road). The rank colour list no longer sits over the body (the readout still says your rank; tapping a muscle names its own), and Posture scan / Body check are a slim row. The 3D hero gets its height back (347 px at 360×740, was 248).
- **Body page: back to the "Before" design, tidied** (Andrej, 20 Oct, a comment on the before/after: "use this design it looks nice but improve it"). The RANK hex (now with a glow in the material colour) beside the streak, "BONES · IRON" under the title, the three skill cards under the body (a hint of each skill colour), and the colour key (tighter). To keep one screen: the title and buttons on one line, the aura line on one line, a tighter weak-link card, Posture scan / Body check as a slim row; on short phones the colour key hides.
- **Posture scan and Body check move to Recover** (Andrej, 20 Oct). A "Checks" pair under Recover's tiles, with when each is due; the Body page no longer shows them, so the body gets that room back.
- **Subtler body** (Andrej, 20 Oct: "too bright … make it more subtle and cool"). The bone material is about half as strong and darker, with gentler shine, sweep, stars and edge glow; the muscle colours are a touch calmer (slightly darker and less saturated, everywhere the 3D body shows); eyes, head marks and the Offline shadows are fainter.
- **Your look = the body plus one swatch rail** (Andrej, 20 Oct: "I love the idea of B (Body + swatch rail), implement it"). New web/ui/looks.js|css redefines vtLookDraw: one screen with no scroll, the body big, its name over it, Glow / Skin / Prestige chips, one row of swatches and one Wear button. Tapping a swatch only previews it; Wear saves it; locked swatches say what opens them, and a Vault skin without Pro opens the paywall. Skin holds the session Bones (up to your overall rank, S.bones.wear) and, after a thin rule, the Vault materials. Each glow now tints the body's edge in its own colour, and a Vault skin turns the bone tint off.
- **Android: buttons stay above the system bar** (Andrej, 20 Oct: "on the onboarding, the menu is blocked", a Samsung with 3-button navigation). App.js no longer pads the web view on Android; it sends the real status and navigation bar sizes, and every web/ui and legacy style now uses `--sat`/`--sab` (the larger of those and env()) instead of env(). The intro's lower part may shrink and scroll so its button stays on screen.
- **Narrow phones show the 375-wide design, scaled** (Andrej, 21 Oct: "in my phone it looks squish in every tab", TestFlight on an iPhone). Under 360 CSS px wide (Display Zoom, an SE or a small Android), the page sets its viewport to width=375 so every screen is the tested 375 layout, scaled to fit, instead of squashed. Set in scripts/build-html.js at the top of the page.
- **Button sounds after the intro, with their own switch** (Sahil, 21 Oct: "there is no sound on the button just music playing, and also an option to turn off the music/button sound"). New web/ui/taps.js: a soft tick on every real tap of a button, tab or row once the intro is done (a deeper tock for the main buttons), through the shared audio context and limiter like the dial clicks; the intro keeps its own knocks and flourishes. On by default. Same day (Sahil: "you have option to pick music, how about the option to pick the buttons sound as well?"): styles to pick from, like the music, in three groups (Sahil, later the same day: "add more sound … that matches the app vibes"): Soft (Tick, the default; Wood, Pop, Key), From Ossa (Dial, the body dial's click; Stone; Pulse, a heartbeat; Forge, an anvil ring for the bones) and Glow (Glass; Aura, a shimmer; Neon, a synth blip; Melody, a new note each tap in the intro's key of D), or Off. Settings › App › Button sounds opens the picker (#tapP, laid out like the Music panel; tap one to hear it); S.tapStyle and S.tapSound === false. The Music row now shows On/Off.
- **Speed pass** (Sahil, 21 Oct: "it lagged a bit and delays input"). Nothing that's off screen keeps animating: the Focus glow, the Body page's head overlay (now 30 fps) and the old HUD's endless CSS animations pause when they can't be seen; the 3D loop's readouts touch the page only when they change; Train's thumbnails are canvases, not PNGs. No visual change.
- **Intro fixes on iPhone** (Sahil, 21 Oct). The name step sits above the keyboard (App.js tells the page the keyboard's height); swipe-back only from the left edge, so dragging the phone-hours slider no longer goes back a step; after the app comes back from the background the sound is rebuilt (iOS left it "interrupted": music, knocks and chimes went quiet).
- **Vibration: Normal, Light or Off** (Sahil, 21 Oct: "have an option to vibrate as well"). Settings › App › Vibration, a three-way switch under Button sounds (S.haptics). Every buzz passes one gate in web/ui/taps.js (navigator.vibrate and {t:"haptic"} messages): Light makes each the phone's lightest tick, Off drops them. Normal is the default, so nothing changes for anyone who doesn't touch it.
- **A full chest library: 20 more chest exercises** (Sahil, 21 Oct: "add more workouts in the chest section … flat bench press, incline press, flat dumbbell press, cable fly, machine flys … all the popular machine workouts"; picked from the ACE chest EMG study, Jeff Nippard's ranking and common gym machines). Barbell and Smith: Incline barbell bench press, Decline barbell bench press, Smith machine bench press, Smith machine incline press. Dumbbell: Decline dumbbell press, Dumbbell floor press, Dumbbell fly, Incline dumbbell fly, Dumbbell pullover. Machines: Machine chest press, Plate-loaded chest press, Incline machine press, Decline machine press, Pec deck, Machine-assisted dips. Cables: Cable fly, Low-to-high cable fly, High-to-low cable fly, Cable chest press. Bodyweight: Decline push-ups. Each is in EXW (main muscle and helpers), MUSCLES.pec_major.ex (after the first three, which still set default weeks), exdata.js (tags, chest zone, search names like 'pec fly', 'cable crossover', 'flat bench') and BW_EX for the two bodyweight ones. Reach them from Edit › Add an exercise › Chest, swaps and Learn › Exercises (Chest: 16 → 36). 'Pec major focus' keeps its first three; Edit's add list shows up to 40 (it stopped at 12) without repeats. Presses use the chest-press demo; flies have no animation yet (the muscles light up). check-exdata totals: 144 listed, 165 in all.
- **The rest of the library: 46 more exercises for back, shoulders, arms, legs and glutes** (Sahil, 21 Oct, "yes" to the same treatment as the chest; picked from popular free-weight, cable and machine lists: Bodybuilding.com and Lift Vault back machines, Fitbod shoulder machines, Garage Gym Reviews arm and leg lists). Back: Barbell row, T-bar row, Machine row, Close-grip lat pulldown, Straight-arm pulldown, Machine-assisted pull-up, Chin-up, Deadlift, Good morning. Shoulders: Machine shoulder press, Smith machine shoulder press, Push press, Cable front raise, Machine lateral raise, Cable Y-raise, Reverse pec deck, Cable rear-delt fly. Arms: Dumbbell curl, EZ-bar curl, Preacher curl, Machine preacher curl, Cable curl, Bayesian cable curl, Concentration curl, Cable hammer curl, Skull crusher, Rope pushdown, Machine triceps extension, Triceps kickback, Diamond push-ups, Reverse curl, Reverse wrist curl. Legs: Leg press, Hack squat, Smith machine squat, Front squat, Step-up, Reverse lunge, Seated leg curl, Standing leg curl, Glute-ham raise, Leg press calf raise. Glutes: Hip thrust machine, Glute kickback machine, Cable pull-through, Hip abduction machine. Same wiring as the chest (EXW, MUSCLES.ex after each muscle's first three, exdata.js tags, zones, search names and job lines). Chin-up, Machine-assisted pull-up, Diamond push-ups, Reverse lunge and Glute-ham raise log reps (BW_EX; Chin-up takes added kg like Pull-up); chin-up and glute-ham join train.js's 'needs kit' regex, so they're never home moves. The old search alias 'chin up' → Pull-up went (Chin-up exists now). Demo moves by name; skull crushers, the triceps machine and kickbacks have no move yet. Gym totals: Back 31, Shoulders 29, Arms 36, Legs 43, Glutes 16; check-exdata: 190 listed, 211 in all.
- **Edit workout keeps your place, and you can add your own exercises** (Sahil, 21 Oct: "when I click on any … like back or chest it takes me to the top … an option where the user can add exercises which are not in the list"). Every tap in Edit (an area, +, sets, reorder, remove) redraws without jumping: the scroll is put back, and the Add an exercise area stays where it was on screen; the exercise list is now part of the panel's scroll (it was a 260 px box scrolling inside it). '+ Add your own exercise' opens a form: name (cleaned, up to 40 characters), the muscle it works (any of the 23), sets and reps. It goes into the workout and into S.myEx, so it shows first in that area's list next time, marked Yours, with a delete button (its history stays). A name that matches a built-in lift uses the built-in one. Own exercises earn rank points for the muscle you pick, log kg × reps and get a demo move by name when one fits; they aren't listed in Learn › Exercises.
- **Your own exercises stay on your phone** (Sahil, 21 Oct: "make sure whatever they add is saved in their environment, on their phone … someone might add something weird"). Checked: Ossa has no accounts and no server; S (own exercises included, S.myEx) is only in the phone's localStorage. The one way a typed name could have left the phone was the anonymous usage data (Mixpanel, off today: MP_TOKEN is empty): Exercise insights sent the exercise name. Now it sends the name only for built-in lifts ('custom' otherwise), and track() itself swaps any own-exercise name for 'custom' whatever event carries it. The share card shows muscles, ranks and trophies, never exercise names. Names are cleaned when saved (no < > " & ` \, up to 40 characters). The form says so: "Only you see it. It's saved on this phone and never shared."
- **Watch shows the equipment: the chest first** (Sahil, 21 Oct: "with the dumbbell workout I want the model to hold the dumbbell, and bench press to lie on the bench and do the workout … find the best way to do it. All at once or one at a time?"). Built in Ossa's own 3D (web/ui/props.js), not videos or bought animations, so it keeps the body's look and stays light: the body is posed from where its hands and feet go, and the kit is simple shapes lit like the body, with the same outline (bench, barbell, dumbbells, dip bars, the chest press machine). One batch at a time, the chest first: 23 exercises on 21 moves (flat, incline and decline bench with a barbell or dumbbells, the Smith machine, the floor press, five push-ups, dips, assisted dips, bench dips, three machine presses). Cable chest press and pike push-ups wait for their batches; every other exercise plays as before. Each kit move has its own camera angle (the bench from the head end and above, push-ups from the side); the camera measures the posed body and its kit and zooms and centres it to fit the frame, on any phone. The barbell is drawn 1.7 m end to end (short sleeves) so the bench fits a phone. The workout's Watch now frames the body full screen above its name and Back to sets (it used the workout screen's frame: off to the right and partly behind the name). Next batches, once Sahil approves the look: standing dumbbell and barbell moves, rows and pulldowns, legs and hinges, cables and flies, then core and the rest.
- **Watch shows the equipment for every exercise** (Sahil, 21 Oct: "do one after another now, without waiting for my OK between each"). After the chest, five more batches in web/ui/props.js: free weights standing and seated (28: curls, shoulder presses, raises, shrugs, the farmer's carry), rows and pulldowns (22: bent-over and machine rows, the lat pulldown, pull-ups, chin-ups, rear delts, prone raises), legs and hinges (46: squats, the leg press, hack squat, lunges, deadlifts, hip thrusts, bridges, leg curls and the extension, calf and tibialis work, hip machines, kickbacks), cables, flies and triceps (21), core and the rest (9). All 149 library exercises now play with their kit (bars, dumbbells, benches, cable towers with pulleys and handles, a pull-up frame, a rack, machines, a mat), each with its own camera. Unilateral moves show the right side. The overhead dumbbell extension is shown one-armed: two hands on one dumbbell hide it behind the forearms. Your own exercises get a move when their name has the words ("incline dumbbell curl", "cable row"…). Exact library names are matched first; no new move reuses an old move's name, because lessons and stories play those.
- **Demos are never covered by the sheet** (Sahil, 21 Oct: the Smith machine bench press "was not in the middle and it was covered up by" the sheet). On the Body tab the camera framed the body in the page's hero box, which runs on behind the sheet; a long name like "Smith machine bench press" wraps to two lines and makes the sheet taller. Now a demo with kit is framed between the header and the sheet's actual top, centred, after the sheet has its text. The Body tab's lens controls (level, Front/Back, Rank/Recovery/Bones, X-ray, the rank legend, the aura label) step aside while a demo plays, as they do when you fly into a region, and come back when it ends. Checked for every exercise on the Body tab and the workout's Watch, on a 375 × 667 phone.
- **The pose solver keeps joints set by hand** (21 Oct). It used to drop them, so the dips' bent knees never showed; dips now hang with the knees bent behind, as designed.

## 2026-10-22 · The demos hold their kit, and nothing passes through it
- **Arms overhead no longer tear at the shoulder** (Sahil, 22 Oct: with the hands straight up "the animation is messed up a bit"). The body is skinned to bones by distance, and past about 150° from hanging the shoulder's skin stretched into flaps that showed the grey outline through them. An arm now rises at most 150° against the torso (ppMaxRaise, props.js); presses lock out with the hands above the shoulders, a little wide and forward, as people really press; hangs (pull-ups, the dead hang, the hanging leg raise) keep their hands on the bar and lean and arch the body instead. During a demo the body is drawn a second time from behind (ossa.html draw): only triangles a pose has folded over pass the depth test, so a crease shows as body, not as a bright flap.
- **The hands close round what they hold** (Sahil, 22 Oct: "is there any way the model can actually hold … the bar? If it is then do it"). The mesh's hand has separate fingers, so the vertex shader curls them (GRIP_GLSL, ossa.html): three knuckles per finger, measured from the mesh (each finger's centre, knuckle and length), the thumb swung over them, on the rest shape before skinning. uGrip says how closed each hand is; it eases in with the kit. A held bar, handle or dumbbell runs across the fist (ppGripPt is now that point; the poses aim it and the kit draws through it, along the fist's own line, ppFistAxis). Open hands stay open: push-ups, planks, bridges, hands on hips or knees, the door frame (h.flat or sp.flat use ppFlatPt). Muscles are still found from the rest shape, so the lit muscles don't move. A bar held in both hands (sp.bar) turns each forearm, palm up or down the nearer way, until the fist lines up with the bar (within 97°): most bars now cross the fist within 25°; curls and the chin-up, already turned palm up, stop at the limit (about 45°); the back squat's forearms run along the bar, which only a wrist could fix, and the model has none.
- **The limb solver keeps knees and elbows facing their pole when straight** (22 Oct). It used to turn a limb round its line by the middle joint's own offset, which says nothing when the limb is straight (and this mesh's knees are slightly hyperextended at rest): a near-straight knee could roll a quarter turn and tip the foot, so planted feet moved during a rep. Now the hinge axis is turned to lie across the pole (ppTwoBone).
- **Checked every exercise for the body passing through its kit** (Sahil, 22 Oct: "check every exercise model"). A script poses the real mesh (the app's skinning and the grip) at five points of every rep and counts body points more than 1.5 cm inside metal or frames, or 4 cm inside pads. Fixed: walls placed at the body's back (tibialis raise, wall-sit calf raise), floor plates made thin where feet stand on them, the chest press machine's uprights moved clear of the arms, foot plates built from the posed soles (hack squat, seated cable row), the T-bar's pivot nearer and its plate smaller, shoulder pads on the shoulders (standing calf raise), the glute-ham pad under the thighs, the step-up's back foot lifting before it comes forward, the door stretch's forearms on the frame's face, shorter ranges where a dumbbell met the head or back (pullover, overhead extension), the concentration curl swinging up in front of the body. What remains are brief touches of a few centimetres mid-rep (a dumbbell brushing a thigh).
- **The end screen when nothing was logged** (Sahil, 22 Oct: it "looks dead"). It was the old fallback page: the title, a line and two buttons on black. Now (drawDoneEmpty, workout.js) the body stays behind it, turned to and softly lit on the muscles the plan aims at; the plan sits under it ("Your plan · 0 of N sets", the exercises and their sets × reps); and "Back to workout" picks the workout up where it was, the timer running on (nothing was saved, so ending again works as usual). "See it on your body" went: with nothing logged it opened a body with nothing new on it. Copy kept: "Workout complete", the title, "No sets were logged, so nothing changed on your body."
- **Recovery day: no more squashed names** (Sahil, 22 Oct, with a screenshot: "it is overlapping"). The Train tab wraps the plan in .dk-tp, which hides .no and gives .tp-r a 52 px thumbnail column — meant for the normal rows' preview, not the rest list. The muscle names (Side..., Fron..., Rear...) were squashed into the first column and "X days" sprawled across the rest. Fixed in polish.css: the rest rows go back to the plan's own three-column layout (28 px dot + 1fr name + auto days), the dot comes back as a small amber pip, the list sits in the left 62% so the 3D figure on the right doesn't sit over the text. The redundant "X% recovered" text was dropped: the bar under each name says it, and "3 days" says what matters.
- **A Posture plan the free scan builds** (Sahil, 22 Oct: "after the posture check is done ... give them appropriate exercise ... save it in the exercise section ... posture correct plan"). Up to now, Pro built a 5-minute routine and worked the moves into training days; free users saw the per-finding move suggestions but had nowhere to keep them. Now the result page offers "Save my posture plan" (psSavePlan, ossa.html). That saves the session psFixSession already builds (3-4 moves picked for the worst findings) to S.plans. The Exercises panel's top (dxRenderTop in discover.js) grows a "Your plans" row with the saved Posture plan: name, exercise count, minutes, a short line like "fixes forward head and rounded shoulders", and a green Start that opens it as a workout (startSavedPlan, TR.hub false so the plan view shows, not the hub). One posture plan at a time; a new scan replaces it. Pro-only features (Start now, five minutes a day, into training days) stay Pro; the Start now button sits next to Save for Pro users.

## 2026-10-22 · Pre-submission bug sweep: BUG-04, 07, 11-16, 19, 25-27, 29, 33, 35, 36
- **"Unexplored", not "Fresh"** (BUG-04). The recover text for a never-trained muscle now reads "Unexplored · Nothing to recover from yet. Train it and recovery shows here." (vessel.js readyText). One word for one state, so the Recover tab stops using the two synonyms side by side.
- **Toast is the live region, not the sheet** (BUG-07). The ossa.html sheet is role="dialog" aria-labelledby="shTitle"; aria-live moved to #toast with role="status" aria-atomic="true". setSheet toggles the grab button's aria-expanded. VoiceOver now reads toasts and takes a sheet open/close announcement from the dialog role, instead of reading every sheet redraw aloud.
- **Train reads the program's kit/exp from S.program.a** (BUG-11). rdtMode/rdtA fall back through S.program.a.kit/exp before S.profile.kit/exp (ossa.html). A user with a saved program whose kit later changed in Profile no longer sees the wrong at-home/at-gym state in Train.
- **COMPOUND and HOLD regexes grew word boundaries** (BUG-12, BUG-13). Hanging leg raise is no longer tagged a hold (the hang/anchor pattern was moved out), Pallof press is no longer tagged a compound (the "press" fragment now needs its real neighbours), and machine names (Smith machine, machine press) match only when they're real presses. HOLD now matches planks, dead hang, carries, heel walk, wall-sit, bird dog and the ab wheel.
- **vxIsStretch falls back to exInfo** (BUG-14). vessel.js's vxIsStretch, for a name not in EXW or vxStretchSet, now trusts exInfo(name).type==="mobility". Routine-only mobility names (Supported deep squat hold from Body check) stop earning adductor RP. scripts/check-exdata.js's KNOWN exception list is cleared.
- **BW_EX grew by four** (BUG-15). Glute bridge, Dead bug, Walking lunge and Incline push-ups are bodyweight. web/ui/exdata.js moves them from Cg/Ig into Ch/Ih rows so tags, lists and today's sessions all agree. exdata check passes.
- **S.extra survives adaptToday** (BUG-16). A muscle a user added to today (Exercises' "+" or the whisper) now rides through the coach's swap or rest adjustment: adaptToday wraps the adjusted session with the same name-only extras injector sessionForDay1 uses, so a swapped title keeps the user's choice attached instead of hiding it until keep.
- **Insights panel animates in on open** (BUG-19). train.js's openInsights replaces requestAnimationFrame with `void p.offsetWidth; p.classList.add("on")`, the same pattern discover.js and density.js already use, so the fade starts in the same task that laid out the panel.
- **Focus Monk row sends you to the setup** (BUG-25). focus.js's Grow-your-aura row goes to `focus` unconditionally. The "Monk Mode · done" card above already opens the finish; the row below never does.
- **Calm fallback resets the body framing** (BUG-26). startBreathing's done handler, when Calm's own canvas failed and the 3D body was the live scene, now calls Body.camTo({zoom:1,px:0,py:0,yaw:0}) so Focus is left as it opened, not zoomed on the chest.
- **"Aura level" stays on one line** (BUG-27). polish.css gives `.rdp-stats .rdp-s.lv b` white-space:nowrap. The lv tile beside the 48 px ring stops wrapping at 390 and 375 px.
- **Rank-up tier stays on one line** (BUG-29). ranks.css gives `.rk-up-tier` white-space:nowrap, and at max-height:700 px drops to --fs-6 so "Unbreakable III" fits a 375 × 667 phone without pushing "See all your ranks" below the fold.
- **nvTown won't trade a working place for a name** (BUG-33). native.js keeps the current place (lat+lon) when a geocode comes back name-only (Android's needs-permission path, or an older build): the caller sees {ok:false, why, saved:"kept"} and wxplace surfaces the reason, instead of the working place being quietly replaced.
- **Hand-ticked dare rows toggle off** (BUG-35). dares.js's drView gives a done row with no auto source (`!o.src`) tap:"tick"; steps/water/breath/flow stay led by their readings. The underlying toggle in drRow already supported it; the row was simply drawn as plain text when done.
- **The dare page's title fits beside its count at 375 px** (BUG-36). darepage.css at max-width:380 px lets `.dp-row.dp-pg .dp-rt b` span columns 2/4 and moves `.dp-prog` onto the sub line. The count stays tabular and nowrap; the title no longer loses "15-minute walk outsid…".
- **BUG-31 (what the weather gate can't see) stays open for Build 10** — a native change, not web. Build 9 ships without it; all other open bugs filed in Phase 1-6 are now Fixed.

## 2026-10-22 · Focus session: custom minutes, and the task input above the keyboard
- **A fourth tile on each skill: Custom minutes** (Sahil, 22 Oct, with a screenshot: "add a custom option for study, focus and offline … I am talking about time here"). The three preset tiles (25/50/90 at Normal and Hard; 10/25/50 at Easy; 50/90/120 at Nightmare) now sit beside a Custom tile, same height, dashed border when unset, solid when selected. Tapping it opens a bottom sheet with a −/+ stepper (5-minute steps, 5-240 min range), the live XP preview and a Set button. Each skill (study, focus, off) remembers its own custom value in `luUi().custom`; `luMins()` keeps whatever was picked instead of snapping to a preset. Grid widened from `repeat(3,1fr)` to `repeat(4,1fr)` in skills.css; tested at 375 px (`.lu-durs small` ellipses rather than wrap).
- **The task input stays above the keyboard** (Sahil, 22 Oct, same screenshot: "the name for this section is over by the keyboard and it same for each tab study, focus, and offline"). `.lu` is a fixed-height flex column, so a plain `scrollIntoView` on `#luTask` could not move it clear of the iOS keyboard. New `luKbScroll(el)` measures the keyboard from `visualViewport.resize` and sets `--lu-kb:<px>` on the enclosing `.lu`; the screen's height shrinks by that amount (`height:calc(var(--lu-h) - var(--lu-kb,0px))`) so the hero compresses and the input and End button lift above the keyboard. The custom-minutes sheet uses the same hook (`.lu-sh { bottom:var(--lu-kb,0px) }`), so the Set button is never covered either. Variables clear on blur; two re-apply passes catch iOS's mid-animation resize.
- **A loud session-end chime** (Sahil, 22 Oct: "when the session finished for focus, offline, study. I want a big sound making sure they know its ended"). `mmCheer` (monk.js) now plays a C-E-G-C arpeggio over ~0.9 s and a brighter peal 1.2 s later (through the existing `Pulse.chime` bell), paired with a longer haptic pattern (`[40,90,40,90,40,90,80]`). Still honours `S.mind.ui.sound===false` (sound off) and the device haptic setting. Early-end (`luEndTap`) stays quiet by design — only a full, planned finish triggers the big sound.
- **Focus mode's phone-wide notification blocker needs a native build** (Sahil, 22 Oct: "the notification blocker doesn't work. maybe its was because I am running it in the expo"). Confirmed: iOS Focus Filters and the "silence other apps' notifications" paths need the native entitlement that only a signed Codemagic build carries. In Expo Go there is nothing to call, so the hooks fall through to no-ops. Nothing to fix in web code; it will light up on Build 11 when the signed binary is on the phone. Ossa's own notifications are already withheld during a lock-in by vessel.js's reminders logic, independent of this.
- **Posture plan: severity-aware moves, varied by scan** (Sahil, 22 Oct: "do your research and make sure you have right recommendation for posture improvement exercise/plan base on their posture level. I don't want same exercise"). Each finding (fhp, round, apt, sh, hip, head, shift) now has a pool of 3-6 evidence-backed moves (chin tucks, prone Y- and T-raises, wall angels, upper-trap stretch, foam-roller thoracic extension for FHP; doorway pec stretch, band pull-apart, wall slide for rounded shoulders; kneeling hip flexor stretch, glute bridge, dead bug, bird dog, single-leg glute bridge for APT; side-lying leg raise, clamshell, banded lateral walk, single-leg balance, side plank for lateral tilt and shift; neck side stretch for head tilt). Backed by Oct 2026 web research summarised in a block comment above PS_MOVES (systematic reviews on FHP, upper-cross RCT protocols NCT06534736 / NCT07841639, APT narrative review, ACE / Sports Injury Physio for glute medius). `psFixSession` is rewritten: a noticeable finding (lv 2) earns 2 moves, a mild one (lv 1) earns 1, cap 6 total, trim from the mildest first on overflow. The pool is rotated by a seed derived from the scan id, so the same scan rebuilds the same plan (save/share stays stable) but a new scan with the same findings serves different moves. Duplicates across findings are skipped (chin tucks is only picked once if both fhp and head want it). Items stay mob:true, so the posture plan earns no RP.
- **Posture plan surfaces on the Train page** (Sahil, 22 Oct: "add the posture plan to the train page after they have got the plan"). Two places:
  - the main Train screen (drawTrain, ossa.html) gets a slim lime-tinted row under the week strip when `savedPlans()` has a posture plan; shows the plan name, move count, estimated minutes, and the two findings it fixes, with a Start action that routes to `startSavedPlan("posture")`. Hidden during an active workout and the done screen; also when the current custom session is already the saved plan being offered. CSS `.tr-plan` added beside `.gn-bar` to match the existing banner style.
  - the Train deck hub (deck.js `dkCards`) also picks saved plans up as their own cards; `dkAct` routes a `plan`-kind card's Start through `startSavedPlan`. So whichever Train surface the user lands on, the posture plan is a tap away without opening Exercises first.

## 2026-10-22 · Global keyboard-aware inputs, posture plan v2 (research + animated demos + daily reminder)
- **Keyboard inset is now a one-liner for every input in the app** (Sahil, 22 Oct, screenshot of the "Your own exercise" form hidden under the iOS keyboard: "you said you fix this but here we have it … make sure it run everything page layout which required an input"). The previous Focus-only `luKbScroll` is replaced by `web/ui/kb.js`, a global shim loaded right after shell.js. It listens to `focusin` across the whole document, measures the keyboard from `window.visualViewport.resize`, sets `--kb` (px) on `<html>` and toggles a `kb-on` class, then scrolls the focused control into view with two passes to catch iOS's mid-animation resize. CSS in polish.css: every scrolling tab container (`.trainv`, `.mindv`, `.tabv`, `.psx`, `#stage`) gets `padding-bottom:calc(var(--kb) + 12px)`; `.sheet` and `.toast` lift by `--kb`; sticky action rows (`.rdt-oacts` for own-exercise, `.mv-foot`, `.u-foot`, `.dp-acts`, `.wp-acts`, `.fuel-acts`, `.ck-foot`, `.ps-foot`, `.mm-setup .mm-foot`) also pad by `--kb`. Focus's `.lu` and `.lu-sh` now consume the same `--kb` instead of a local `--lu-kb`, so there is one source of truth. `window.uiKbFocus(el)` is exposed for callers that know an input is about to open.
- **Posture plan v2 — proper per-finding research, bigger pools, animated demos** (Sahil, 22 Oct, second screenshot of Upper trap stretch idle on the model: "do the research properly … make sure you actually research to fix posture … I don't think 2 exercise is enough and also the model is not doing the exercise"). Four changes:
  1. **Bigger pools, backed by this round's research** (ClinicalTrials NCT04557904 / NCT06711497 / NCT04796051 craniocervical flexion protocols; Dovepress 2026 FHP meta; Korean 2018 upper-cross RCT; Dimitrijevic 2022 corrective-exercise pooled review; ANZCTR 375793 6-week APT trial; Sports Injury Physio / ACE on glute medius; Trendelenburg / lumbar compensation warnings). Each finding's pool grew to 6-8 moves. Highlights: FHP adds doorway pec stretch and band pull-apart; round adds Cat-cow and prone Y-raise; APT adds pelvic tilt and Cat-cow; sh (shoulder tilt) adds Y-raise and chin tucks; shift adds Banded lateral walk and pelvic tilt. Doses align with the research where it was explicit (chin tucks 3 × 10 or 10-20 s; pec stretch 30 s; glute bridge 3 × 12; side plank 3 × 25 s each).
  2. **Bigger per-finding budget**: `psFixSession` now gives the worst finding 4 moves, the second lv-2 finding 3, every other lv-2 finding 2, and each mild finding 2. Cap raised from 6 to 8 total; trim from the mildest first on overflow. User's "2 isn't enough" directly addressed.
  3. **The model actually does every posture move**: `web/ui/props.js` gains a new `ppNamesPS` alias table checked before the lift batches. It maps every PS_MOVES name without a demo to a working one — Chin tucks → `rd_tuck`, Wall angels → `wall_slide`, Single-leg balance → `rd_oneleg`, Side-lying leg raise → `ps_sidelying_abd` (new), Side-lying clamshell → `ps_clamshell` (new), Thoracic extension over a foam roller → `ps_tfoamroll` (new), Kneeling / Half-kneeling hip flexor stretch → `ps_hipflex_kneel` (new), Upper trap stretch / Neck side stretch → `ps_sideneck` (new), Cat-cow → `rd_flex`, Pelvic tilt → `rd_tilt`. Four new MOVES animations sit next to `rd_*` in ossa.html, each a small animated pose (sinusoidal easing against time) so the Watch body actually performs the stretch instead of standing idle.
  4. **Daily reminder when a plan is saved** (Sahil: "increase the frequency of the posture plan exercise with reminder as well notification"). A new `vxRemind` hook schedules a reminder at 09:00 local for each of the next 14 days whenever a Posture plan sits in `S.plans`, with title "Posture plan · N min" and `go:"plan:posture"`; `vxRoute("plan", …)` tap-opens Train and starts the plan. `psSavePlan` calls `nativeSoon(true)` after saving so the phone picks the reminders up immediately. Reminders rebuild from `S.plans` on every sync, so if the plan is replaced or removed the schedule follows. iOS Focus Filters still need the Build 11 entitlement (BUG-31); Expo Go will log them but not fire — that's the native layer, not the schedule.
- **Pelvic tilt (routine-only)**: added to `Mhx none` in exdata.js so the exdata check agrees; EXPECT total raised from 211 to 212 in `scripts/check-exdata.js`.
- **Saved posture plan auto-refreshes to the latest pool** (Sahil, 22 Oct, screenshot of Train showing "Posture plan · 5 min · 2 moves"): the previous `psSavePlan` froze the item list into `S.plans`, so a plan saved before the pool / budget expansion kept serving its original 2 moves. `savedPlans()` now rebuilds the posture plan lazily from `psFixSession(psLast())`; the write is idempotent — it only fires when the move list differs — so save/share stays stable but the content follows the current pools, doses and budget. A scan from last week with "Posture plan 2 moves" now rebuilds to the full 4-8 move plan on next open.
- **Start-now routes through Train deck** (Sahil, 22 Oct: "when I click on the start now I want the screen to open in quests this week where posture plan will always be at the top"): `psStartFix` now closes the posture modal and lands on Train with `TR.hub=true`, saving the plan first if it isn't already. The deck already pins saved plans just under today's hero quest (deck.js `dkCards`), so Posture plan is the first row of "Quests this week"; the user taps the play button there to start. Removes the double-start risk of the old straight-to-workout path.
- **Open-my-posture-plan button removed** (Sahil, 22 Oct, "remove the open my posture plan button"): once a plan is saved the posture results card shows only the explainer line ("Saved to your exercises. Open it from Train › Exercises any time.") plus the Pro "Start now · N min" button when it applies.

## 2026-10-22 · Sentry wired across native + WebView
- **Added `@sentry/react-native` 8.32.0** (Sahil, 22 Oct: "have you used sentry.io on this?" → "yes build"). npm installed with `--legacy-peer-deps`: expo-router pins `expo-constants ^58.0.13` while this SDK 57 project is on 57.x, which the resolver treats as a conflict even though we don't use expo-router. `@sentry/react-native/expo` plugin added to app.json. The native module is loaded through `require()` in native/sentry.js so Expo Go — which can't bundle Sentry's native bits — stays silent instead of crashing.
- **native/sentry.js** — a thin wrapper exporting `init()`, `recv()`, `wrap()`, `captureMessage()`. `init()` reads a DSN from `EXPO_PUBLIC_SENTRY_DSN` first, then `Constants.expoConfig.extra.sentryDsn`. Without a DSN it no-ops. Sampling is 5% traces, auto-session tracking on, environment set from `__DEV__`, release stamped as `ossa@<app version>`. Ignores known noise (Expo push warnings, non-serialisable Navigation values, "possible unhandled rejection").
- **App.js**: calls `Sentry.init()` at the top-level before `Main` renders, and exports `Sentry.wrap(App)` so React render errors surface. `Sentry.wrap` falls through unchanged without a DSN, so dev and Expo Go are unaffected. The WebView `onMessage` handler now short-circuits `{t:"err"}` to `Sentry.recv(m)` so WebView-side JS errors reach the same inbox.
- **ossa.html**: adds global `window.addEventListener("error", …)` and `"unhandledrejection"` hooks that post `{t:"err", msg, stack, where, url, line, col}` through `nsend()`. Throttled to 25 reports per session so a tight loop can't flood. Each event is tagged `source:"webview"` on the Sentry side so native and web errors can be told apart.
- **DSN handover (Andrej)**: create the Sentry project at sentry.io (team `ossa`, project `ossa-ios`). Copy the Client Key / DSN. In Codemagic environment variables for the iOS build, set `EXPO_PUBLIC_SENTRY_DSN` to that DSN, and `SENTRY_AUTH_TOKEN` to a user auth token with `project:releases` scope so source maps upload during build. The plugin picks both up automatically; no code change needed. On the Sentry side, keep Debug ID source maps on and verify the release stamp `ossa@<version>` lines up with each Codemagic build.

## 2026-10-23 · App Review clean-up: nothing hidden, no over-the-air updates, Break free out (Sahil)
Why: Ossa 1.0 (build 29878404, Codemagic, 22 Oct 21:24 GMT) was rejected under 4.3 spam + 4.2.6, and Unknot on the same account was then rejected under 5.6 ("features that appear to have been intentionally hidden during the review process") for its secret access code. A full scan of Ossa found no free-Pro path and no remote config, but found these, which are now fixed in the source (backup of the old files: `Documents/Ossa-app/backup-before-5.6-cleanup-2026-10-23`):
- **The 7-tap demo gesture is gone.** "Load demo data" is now a normal visible button in Settings › Your data (same wording, same two-tap confirm). The tap counter, its toasts ("Demo mode unlocked"), the `user-select:none` heading and the comment telling reviewers the sequence are removed. `S.demoUnlock` is no longer read.
- **Break free is out of 1.0.** It overlapped Last Tin (nicotine) on the same account, contradicted Last Tin's reply to Apple ("only Last Tin is about nicotine"), and pushed the age rating up (porn, weed, alcohol, gambling). `web/ui/clean.js` and `clean.css` stay on disk but are no longer `@include`d. Entry points removed: the Focus home card and "I feel an urge" button (focushome.js), the More sheet row and urge button (skills.js), the Rank page's tool tile (now **Breathe**, with its own icon) and its "next unlock" button for aura (now goes to **Eyes**, where directives earn aura) (rank.js), and the How it works text (focus.js: aura comes from the nightly report, directives and the daily streak). Dead CSS (`.fh-urge`, `.lu-urge`, polish.css §4) removed. Saved `S.clean` data on phones is left alone and unused.
- **Phone check test panel deleted** (native.js), with its `ossa://phonecheck` route, its Settings row, and the hooks in monk.js (the 2-min test chip is now localhost only) and recover.js (the 1-min reset delay only via `rstDelay.test`). look-fx.js comments no longer say "hidden".
- **Test-bed Pro narrowed.** `proBuy`'s local Pro (no App Store) now runs only on the desktop preview at localhost, or in Expo Go. It used to run in any browser. The installed app (ossa.app inside the native shell, not Expo Go) can never reach it.
- **Mixpanel removed.** `track()` is a no-op (its ~44 callers stay), the token, the fetch and the "Share anonymous usage data" switch are gone. The privacy label must not declare Analytics and the policy shouldn't name Mixpanel.
- **Over-the-air updates off.** app.json `updates.enabled:false`, `checkAutomatically:"NEVER"` (checked against the SDK 57 docs: the app then always runs the bundle built into it). `npm run update` now prints a message and stops. Every change ships in a build App Review sees. CLAUDE.md was wrong ("there's no expo-updates") and is corrected, with a new "App Review rules" section.
- Checks: build-html, check-tokens, check-exdata, check-dares, and the smoke test at 390×844 and 375×667 all pass with no errors. Screenshots of Focus, its More sheet, Rank and Settings › Your data checked at 375×667.
- **Still for Andrej**: a new Codemagic build from this source; then the review notes, privacy label (Coarse Location; no Analytics; Diagnostics only if `EXPO_PUBLIC_SENTRY_DSN` is set in the `ossa_appstore` group), privacy policy (approximate location + MET Norway) and age rating questionnaire, before the 4.3 reply goes to Apple.

## 2026-10-23 · Splash: the stone hex (Sahil: "I like the one with the stone one, keep that one")
- `assets/splash-icon.png` is now the app icon's Breakout Hex (grey stone, lime crack) at 56%, on pure black, with the OSSA wordmark and lime underline below, as on the 22 Oct splash. Source: `store/listing-src/splash-icon.svg` (built from `store/icon/ossa-icon.svg`); render with `node store/listing-src/render-icon.js store/listing-src/splash-icon.svg <outDir>`.
- The lime hex splash it replaces is kept in `store/icon/old/splash-icon-lime-hex-2026-10-22.*`. Native asset: it shows from the next build.

## 2026-10-23 · Records kept safe, no more hang/crash after time away, rest-day card (Sahil: "after a few days it forgets the record and takes so long to load"; "the first time in a while the app crashes")
- **Records survive iOS clearing the web view.** Every save lived only in the WKWebView's localStorage, which iOS treats as website data: it can be cleared when the phone is short of space, and WebKit's tracking prevention can delete script-written storage after days unused. Now every save is also kept in the app's Documents folder (`native/state.js`, written via a temp file and a move), which iOS never clears and which iCloud / device backups include. App.js reads it before the web view loads and hands it in as `window.OSSA_SAVED`; the page keeps whichever copy is newer (`S._at`, stamped in `save()`) and writes it back to localStorage. Saves are batched to native (700 ms, flushed on pagehide/visibilitychange). Checked in the preview: records come back after localStorage is wiped, the intro isn't shown again, a newer local save beats an older kept copy, a broken kept copy is ignored.
- **The broken page after time away.** When iOS killed the web view's process in the background, App.js called `reload()`, which for a page loaded from an HTML string reloads the base URL (https://ossa.app/) instead of Ossa, so the app sat broken until it was closed and reopened. Now the web view is rebuilt from the bundled page (with a fresh read of the kept save). And after more than 30 s away the app pings the page; no answer in 6 s rebuilds it too (`ping`/`pong`, nrecv).
- **The 4–5 s freeze when the keyboard opens** (Sentry OSSA-2: App Review's iPhone SE, iOS 27, build 29878404, 66 MB free, thermal "serious"; the stack is UIKit's keyboard animation). The 3D body now stops drawing while a text field is focused (`kb-typing` on <html>, set in web/ui/kb.js, checked in frame()'s onScreen) and resumes on blur.
- **Load time.** Measured in the preview with 6 months of workouts and the CPU slowed 4×: the page is usable in ~0.9 s, so the page itself isn't the slow part; the slow opens were the cold restart after iOS killed the web view (above).
- **Rest-day card "stick man".** On a rest day with everything recovered, the card's mask was empty, the 3D still was skipped and the old flat outline (figSvg) showed. dkMask now lights the muscles today's mobility moves work, or the whole body softly (deck.js).
- Native changes (App.js, native/state.js): need a new build. Smoke test passes at both sizes; `expo export --platform ios` compiles.

## 2026-10-23 · Nothing test-only in the store bundle (after Last Tin's 5.6 reply: "compiled into the iOS binary" is itself the problem)
- The free-Pro path for the desktop preview and Expo Go used to sit inside `proBuy` in ossa.html, unreachable in the installed app but compiled into every build. It's now `web/ui/devpro.js`, a `@include-preview` file: always in web/.preview.html, in ossaHtml.js only with `OSSA_DEV=1 node scripts/build-html.js` (for Expo Go testing). Codemagic runs the plain command, so the IPA never contains it. CLAUDE.md's App Review rules say so.
- Checked by exporting the iOS bundle (`expo export`) from this commit and searching it in both UTF-8 and UTF-16 (Hermes stores the page as UTF-16, so a plain grep finds nothing and proves nothing): 0 hits for the test-Pro strings, the 7-tap gesture, the demo-unlock, the habit tracker, the Phone check panel, Mixpanel, the preview spikes, and for "reviewer"; the records fix, keyboard fix, ping, "Load demo data", Restore purchase, Terms and Privacy all present. Comments no longer name the removed things either.
- Needs a new Codemagic build (#8 was built before this change).
- **IPA inspected (23 Oct, 23:26):** Codemagic build #9 from `8a07f30` = build 29879898. Info.plist: com.andrej.ossa 1.0, ITSAppUsesNonExemptEncryption false. Expo.plist: EXUpdatesEnabled false, EXUpdatesCheckOnLaunch NEVER. main.jsbundle (17 MB) searched in UTF-8 and UTF-16: 0 hits for the test-Pro strings, 7-tap gesture, demo-unlock, habit tracker, Phone check, analytics, spikes, "reviewer"; all the new fixes present. This is the build to attach to 1.0.

## 2026-10-26 · "Load demo data" is one tap (Sahil: "the load demo data doesn't work"; "just give a button that can add demo data")
- On Sahil's iPhone (build 29879898) the two-tap confirm never loaded the demo. It couldn't be reproduced in the desktop preview, even with phone touch events and the native bridge simulated, so the cause is something on the device (likely the second tap being lost or the card redrawn between taps).
- Now one tap loads it. Nothing is lost: if you had workouts or check-ins, they're kept inside the save (`S._preDemo`, so the Documents copy has them too), and "Start fresh" puts them back ("Demo cleared. Your own data is back."); with nothing of your own it goes to zero as before. Same button wording.
- Every redraw after loading is guarded on its own, so one view failing can't stop the rest or the toast. `.td-acts .btn` gets `touch-action:manipulation` (no double-tap delay).
- Checked: one tap loads 15 workouts, Start fresh restores a real workout, no errors (simulated iPhone taps + native bridge); smoke test passes at 390×844 and 375×667. Needs a new Codemagic build; the review notes' "Tap twice to confirm" must change to one tap if that build is attached.

## 2026-10-24: App Store listing v4 (draft, after the 4.3 rejection)
- New name `Ossa: 3D Body Workout RPG`, subtitle `Muscle ranks & study timer`. GymLevels and Arise already sell "level up" and "muscle rank"; Ossa's own angle is the 3D body plus Study/Focus sessions that change it.
- 8 new screenshots and a 25 s app preview from real captures of the App Store build (no Break free). Higgsfield not used: Apple allows only real app footage in previews (2.3.4).
- Break free, Offline and Heartbeat kept out of the listing. Details: store/APP-STORE-LISTING-v4.md. (The 388 MB `store/listing-v4/` source folder stays on Andrej's PC, not in git.)

## 2026-10-26 · Resubmission fixes (Andrej's PC moves to Sahil's main)
- **This PC now builds from Sahil's `main`** (github.com/SahilSuresh/ossa, 26 Oct demo-data fix included) on the branch `resubmit-fixes`. The old `redesign-v2` branch is kept, with the v4 listing files committed as a backup.
- **Programmes: no "Coming soon" line.** Explore › Programmes lists only the programmes you can start; the "Coming soon: Sleep Reset, First Pull-up" line is gone (App Review 2.1: no placeholder content).
- **Offline is a plain timer.** No face-down sensing: the accelerometer bridge (native/face.js) is removed from App.js and every minute counts, like Study and Focus, including the finish top-up. Copy says "Phone away" instead of "face down". `expo-sensors` stays in package.json, unused.
- **Rating prompt unchanged** (Andrej, 26 Oct: "don't change it if not needed").
- **Review notes updated:** Posture scan and Body check are on Recover (Checks), not Body › 3D; "Load demo data" is a normal visible button, one tap.
