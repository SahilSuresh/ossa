# Ossa 2.0: "The Body as a Character"

The redesign Andrej set out on 16 Oct 2026. Sections 1 and 2 are his brief, kept in his words. Sections 3 onward are the ground rules he decided, how each design maps onto today's code, and where things stand.

The designs are in `design/redesign-v2/`:
- `images/<screen>.png` is what each screen looks like.
- `screens/<screen>-html.html` is the mock-up (Tailwind, static images).
- `manifest.json` lists all 26.

They are references for look and layout. Build them into the existing app, in its own token system. Don't paste the Tailwind across.

---

## 1. The brief (Andrej)

**Project identity: Ossa**
- Concept: "The Body as a Character." A gamified self-improvement platform where the user's physical and mental actions physically evolve a 3D anatomical character.
- Core loop: Act (Train / Focus / Recover) → Evolve (visual morphing / rank up) → Challenge (dares / specialization).
- Keep the current 3D body and the way it looks. It *is* the character.

**Visual language (the "Ossa Aesthetic")**
- Palette:
  - Base: pure black `#000000`, deep charcoal `#121212`
  - Primary action: neon lime `#D4FF00`
  - Mental / neural: crystalline cyan `#00E5FF`
  - Achievement / prestige: gold `#FFD700`
  - Alert / injury: pulse red `#FF3B30`
- Rank colours in the designs:

  | Rank | Colour |
  |---|---|
  | Unbreakable | `#00E5FF` |
  | Forged | `#FFD700` |
  | Strong | `#FFFFFF` |
  | Stable | `#C5A059` |
  | Fragile | `#4A4A4A` |

- Typography: Inter, mostly weights 800 and 900. Tight tracking and italic for high-impact headlines (e.g. "YOUR BODY IS THE PRODUCT").
- UI patterns:
  - Glassmorphism: see-through panels with `backdrop-filter: blur(12px)` and a subtle 1px border.
  - Anatomical 3D: high-detail mesh with state-based textures (matte charcoal, chrome, marble).
  - Hexagons for badges, ranks and progress, to make it feel engineered.

**Core systems**
1. **Vessel Engine.** A state machine for muscle ranks (Fragile → Unbreakable). It handles rank points (RP) and a "neglect decay" timer that fades a muscle's glow if it isn't trained.
2. **Neural State.** Tracks focus sessions (Monk Mode) and grows the "crystalline aura" around the character's head.
3. **Specialization Engine.** Shifts the 3D model between archetypes (Tank vs Scout) based on 30-day training volume.
4. **Kinetic Chain Logic.** Works out secondary muscles for every exercise. For example, bench press gives 100% RP to chest and 35% to triceps.

**Features**
- **Monk Mode**
  - Setup: duration presets (25 / 50 / 90 min) and the rules, shown before you commit.
  - During: the character sits in a meditative pose.
  - Completion: focus time, what you logged, and the XP bonus.
- **Focus Aura.** A mental-clarity dashboard. A cyan crystalline field around the head grows more complex as you finish focus and breathing sessions.
- **Specialization Engine.** Training volume steers the physique toward the Tank (strength) or the Scout (endurance), shown with a radar chart.
- **Injury Mapping.** Flag muscles as "vulnerable". They pulse red on the 3D model, and their neglect countdown pauses so they don't fade while you recover.
- **Weather dares.** Local weather and location drive challenges, like "Storm Resistance" (a cold walk) when it's raining.
- **AR Goal Projection ("Ideal Self").** A see-through wireframe of the next big rank over your current character, showing the gap.
- **Fueling Meter.** Per-muscle fuel. Protein and carbs logged speed up recovery of the muscles you trained.
- **Vessel Trading Card.** A shareable card of your character with rank, streak and rarest achievement.
- **Prestige.** At Unbreakable, reset a muscle for a permanent material on that part of the body (e.g. black marble and silver).
- **Recovery nudge.** After a workout, a nudge to do a 3-minute mobility flow for the muscles you just trained.
- **Haptic bio-rhythm.** The phone pulses in a slow heartbeat that mirrors the character's recovery state.
- **Vessel Vault.** The subscription: exclusive materials (obsidian, chrome, carbon fibre) and expert recovery masterclasses.
- **Rep density.** In workout history, which zones of a muscle (upper vs lower chest, say) your exercise choice emphasised.
- **Exercise discovery.** Browse by muscle group, with lifts recommended for neglected muscles.
- **Trophy room.** Badges like "Iron Core" or "Leg Day Legend" for consistently training a body part.
- **Kinetic chain map.** On the muscle screen, the secondary muscles a lift works, with percentages.
- *Clan Vessel* and *Mirror Match* (social): dropped for now, see 2.

---

## 2. Ground rules, decided 16 Oct (these win when a design disagrees)

1. **Keep the current 3D body.** The designs' static renders are mood references. Every visual effect (rank colours, aura, red pulse, materials, wireframe) goes onto our own model.
2. **No social for now.** No Clan Vessel and no Mirror Match. Ossa stays account-free, with everything stored on the phone.
3. **Real data, game names.** Every number must be something the app actually logged or worked out from logs. Nothing reads as a medical measurement. Examples:

   | Design says | Build it as |
   |---|---|
   | "Meniscus stress detected", "L4/L5 overload flare" | "You flagged your left knee" (only what the user told us) |
   | "Protein synth 92%", "Glycogen 34%" | "92 g of 140 g protein today", "carbs logged: 2 of 3 meals" |
   | "Reduces injury risk by 15%" | Drop it. Perks are game perks (RP, caps, materials). |
   | "Inner chest bias 8.2", "ROM efficiency 92%" | Emphasis worked out from the exercises chosen: "incline work → upper chest" |
   | "0.8 Hz pulse frequency" | Resting heart rate from Apple Health or the pulse reading, labelled as an estimate |
   | "+15% RP efficiency", "1.5× RP" | Fine: these are game rules, not health claims |

4. **Simple iOS versions:**
   - Monk Mode suggests turning on iOS Focus. It can't silence other apps itself.
   - The recovery nudge is a local notification about 45 min after a workout ends. No geofencing.
   - Ideal Self is a wireframe over the 3D body. No camera AR.
   - Weather dares use rough location. The weather comes from MET Norway (free, no key; the app fetches it itself, about 1 km coordinates, credited in the licences screen). This replaced Open-Meteo in Phase 2 (DECISIONS 2026-10-16).
5. **Version 1.0 is held** until this redesign is ready (see 5).
6. **Standing rules:**
   - Nothing goes to Apple until Andrej says.
   - Never type his passwords or keys.
   - Deleting anything in App Store Connect needs his OK.
   - Log product decisions in `docs/DECISIONS.md`.

---

## 3. The 26 screens, mapped onto today's code

Today's tabs are Body, Train, Breathe, Recover and Learn. The `focus_aura` design calls the third tab "Focus". The rename isn't decided yet, so ask Andrej.

| Screen (design file) | Status | Builds on (today) |
|---|---|---|
| `body_dashboard` | Build: restyle | Body page (`rdHero` and the `rd*` functions in `web/ossa.html`, `web/ui/shell.js`). It already has "Your body", the rank legend, Front/Back, the weak-link callout and the Today card. |
| `muscle_ranks_detail` | Build: restyle | Ranks panel (`#ranksP`, `web/ui/ranks.js`). The design copies today's wording. |
| `rank_up_notification` | Build: restyle | Rank-up sequence after a workout (`web/ui/ranks.js`). |
| `workout_tracker` | Build: restyle | `web/ui/workout.js` (exercise strip, sets table, steppers, Log set, Up next). Already close. |
| `streak_summary` | Build: restyle | Existing streak screen and widget promo. |
| `recovery_dashboard` | Build: restyle | Recover tab (`web/ui/shell.js`). Already close. |
| `exercise_discovery` | **Built, Phase 2** ("Exercises") | `web/ui/exdata.js`, `web/ui/discover.js`. Recommended picks are muscles idle 7+ days. |
| `connectivity_map` (Kinetic Chain) | **Built, Phase 2** ("Kinetic chain") | `web/ui/discover.js`, on the Phase 1 weights (`EXW`, `vxW`). |
| `rep_density_history` | **Built, Phase 2** ("Where your sets went") | `web/ui/density.js`. Zones come from the lifts chosen (incline → upper chest), never "measured". |
| `injury_mapping` | Build | Aches already exist (`S.flagged`, `jointFlag`, `RELIEF`, `JOINT_RELIEF`). New: flag a muscle or joint as vulnerable, pulse it red on the model, pause its fade. "Find physio routine" opens `trJointRelief()` (train.js), plus a see-a-professional line. |
| `recovery_nudge` | Build: simple | Local notification (the app already schedules daily nudges and desk mode). The card is a 3-min flow for the muscles just trained, built like `trJointSession()`. |
| `fueling_meter` | Build: real data | The Fuel pillar and water logging exist (`rdMeWater`). Protein and carb logging would be new. |
| `focus_aura` | Build | Mind/Breathe (`MIND`, `openMind`, `mindGo('breath')`). New: Neural State XP and a cyan aura shader around the 3D head. |
| `monk_mode_setup` / `focus_timer_stance` / `monk_mode_completion` | Build: simple | New focus timer. **Check:** the seated pose needs the 3D model to change pose. There's no character pose system today (`assets/pose/` holds the posture-scan model), so look at the mesh/rig first. |
| `bio_rhythm_sync` | Build: simple | `App.js` turns `navigator.vibrate` into real haptics, and since Phase 2 (Build 9) has haptic styles and sequences (`hap`, `hapSeq` in `web/ui/native.js`), enough for a heartbeat. The pattern follows recovery state. Label the numbers honestly. |
| `ar_goal_projection` (Ideal Self) | Build: simple | A wireframe pass of the model at the next big rank. "82% match" means real progress toward that rank. |
| `specialization_engine` (Tank vs Scout) | Build | 30-day volume by movement type from `S.workouts`/`S.lifts` gives the radar values. **Check:** morphing the model (proportions, scaling) needs work on the mesh. Unlock at Overall Forged II, as designed. |
| `prestige_system` | Build | `FINISHES` (Ice, Bioluminescent, Ember, Gold…) and `UNLOCKS` already give "a new glow for your body". Prestige adds per-muscle materials (marble, chrome) once a muscle reaches Unbreakable. |
| `achievement_gallery` (Trophy room) | Build | `MILES` (session milestones) and `UNLOCKS` exist. Add body-part trophies. |
| `vessel_trading_cards` | Build | The share card exists ("Screenshot this card to share it"). Make it a card of the character with rank, streak and rarest trophy. |
| `dare_generator` (weather) | Build: simple | Dares exist (`dareToday`, `dareText` in ranks.js; Coach and Drill voices). New: weather plus rough location, with safe wording for cold exposure. The weather and location plumbing is built (Phase 2, Build 9: MET Norway, approximate location or a typed town; see UI-SYSTEM "Native bridge v2"). |
| `vessel_vault` | Build | Replaces the Ossa Pro paywall (RevenueCat; App Store products `ossa_pro_yearly` with a 7-day trial, and `ossa_pro_monthly`). **Ask:** the design's prices ($14.99 / $99.99) differ from today's products. Also, Ossa has no ads, so don't promise "ad-free". |
| `clan_vessel` | **Dropped** (16 Oct) | |
| `mirror_match` | **Dropped** (16 Oct) | |

Today's visual system is in `web/ui/tokens.css`:

| | Today | Brief |
|---|---|---|
| Background | `#0B0D0C` | `#000000` |
| Lime | `#B6F36A` / `#CFF59A` | `#D4FF00` |
| Rank colours | `--rk-0` … `--rk-5` | the table in 1 |
| Fonts | Archivo, Geist, Geist Mono (bundled by `scripts/fetch-fonts.js`) | Inter |

Moving to Inter means updating the fonts, the open-source licences screen and the App Store review notes.

---

## 4. A sensible order (suggestion; agree it with Andrej first)

0. **Look.**
   - New tokens: palette, Inter, glass panels, hexagons.
   - Apply them to the screens that already exist. No feature changes.
1. **Vessel Engine.**
   - Kinetic-chain RP weights.
   - Neglect fade with pause.
   - Injury Mapping.
   - Ranks and rank-up restyle.
2. **Train.** Exercise discovery, the kinetic-chain map, workout tracker polish, rep-density history.
3. **Focus.**
   - Neural State XP and Focus Aura.
   - Monk Mode setup, timer and completion.
   - Haptic bio-rhythm.
   - Decide on Breathe vs Focus.
4. **Recover.** Fueling Meter (protein and carb logging), the post-workout nudge.
5. **Evolve.** Specialization (Tank/Scout), Ideal Self, Prestige materials, Trophy room, Trading card, Vessel Vault.
6. **Challenge.** Weather dares.
7. **Ship.**
   - New store screenshots and listing.
   - Updated review notes and a new screen recording of the new build.
   - Build, then submit, but only when Andrej says.

Each step should end with the app working, and a check on a phone-sized preview.

---

## 5. Where things stand (16 Oct 2026, 01:35)

**App Store Connect**
- Ossa 1.0.0 is at "Prepare for Submission". Build 8 is attached: uploaded 15 Oct, with the Train redesign and "Train this muscle".
- Saved but **not submitted** (on hold, rule 5):
  - the listing: description, promo text, keywords, subtitle "Rank every muscle, fix aches", the six 6.3" screenshots
  - the new review notes
- History:
  - Rejected by Apple on 8 Oct. The reason isn't written down in the docs, so check the App Review messages in App Store Connect.
  - Resubmitted on 11 Oct with build 7.
  - Pulled on 16 Oct to swap in build 8.
- Before any future submission:
  - The review-notes **screen recording is from the old app**, so record it again.
  - The optional header image still shows the old "Your back, stronger" art.

**In this folder but not in any build yet**
- Bones › a joint › "Relief routine" opens a routine for that joint (`JOINT_RELIEF` in train.js).
- The ache picker's Start opens its routine.
- A closed sheet no longer shows old contents.
- Tapping a tab closes open panels.

**Update 16 Oct, evening: Phases 0 to 2 are built.** Phases 0 and 1 are committed on the branch `redesign-v2`; Phase 2 is in the folder, not committed yet. None of it is in a build.
- Phase 2 (Train): Exercises, Kinetic chain, Where your sets went, plus the Build 9 native batch (haptics, keep-awake, approximate location, MET Norway weather, launch screen, widgets in rank colours). See DECISIONS 2026-10-16 "Phase 2 Train".
- Build 9 needs a new EAS build (new native modules: expo-location, expo-keep-awake, expo-splash-screen). Andrej's go; nothing goes to Apple.
- Before Build 10: turn the Phone check panel off (`nvCheck.on=false`), declare Coarse Location in the privacy label, and add a location and MET Norway line to getossa.app/privacy (Andrej). See `store/APP-STORE-LISTING.md`.

**Update 17 Oct: Phase 5 is built, reviewed and not committed (Andrej decides).**
- Phases 2 to 4 are committed on `redesign-v2`: Phase 2 (0495481), Phase 3 Focus (5be024a) and the Focus redesign (9ddab48), Phase 4 Recover (3661ed8).
- Phase 5 (Evolve) is in the folder only: Profile › Evolve with the Trophy room, Ideal self, Prestige, Your path, Your card, Your look, and Ossa Pro with three paid materials. Web only, so no new build is needed to try it in Expo Go. See DECISIONS 2026-10-17 "Phase 5 Evolve" and its "Andrej to confirm" list.
- Before it ships: read the GL line in the Phone check panel and look at the body looks on a phone (Expo Go). What Pro sells has changed, so Andrej updates the subscription descriptions, the paywall review screenshot and the review video in App Store Connect himself. Nothing goes to Apple.

**Update 17 Oct, later: Phase 6 is built, reviewed and not committed (Andrej decides).**
- Phase 5 Evolve is committed on `redesign-v2` (68c046f).
- Phase 6 (Challenge) is in the folder only: weather dares. With the opt-in on, a rainy, cold, windy or bright day turns the life dare into a short walk, and a rough or dark day into "Stay in" (an indoor dare). Plus the dare page, the weather dares page with its Settings row, and the Weatherproof trophy (the 43rd). The dares moved from ranks.js to `web/ui/dares.js`. Web only, so no new build is needed to try it in Expo Go. See DECISIONS 2026-10-17 "Phase 6 Challenge" and its "Andrej to confirm" list.
- Safety: `node scripts/check-dares.js` runs 200 severe weather cases against the real gate and fails if any gives an outdoor dare. What it can't see is BUG-31 and BUG-32 (a native follow-up for Build 10).
- Before it ships: try it on the phone (the location prompt, a live MET forecast, a typed town, steps ticking a walk). Before Build 10: `nvCheck.on=false`, so the location prompt comes only from the weather dares page (App Store 5.1.1), plus the privacy label and privacy page lines above. Nothing goes to Apple.
- Next: Phase 7, Ship.

**Known gaps**
- The widgets are rebuilt in rank colours, but a phone sees them only from Build 9. Until then it shows the old layout.
- Open bugs from Phase 2 are in `docs/BUGS.md` (BUG-11 to BUG-19). Phase 6 added BUG-30 to BUG-37 (BUG-30 fixed).

**Store files**
- `store/APP-STORE-LISTING.md`
- `store/screenshots-6.9in-v2/` (1320 × 2868)
- `store/screenshots-6.3in-v2/` (1206 × 2622), the size App Store Connect requires.
