# SPEC: Muscle-Detail Screen (Ossa V1)

Owner: Maya (PM) · Sprint feature · Last updated 2026-10-04

## Assumptions
1. The body map and workout log already exist, and logged sets are already mapped to muscle regions (that's what drives the heatmap). This screen reads that data and adds no new tracking.
2. A "muscle" means the same region the heatmap uses (e.g. "Chest", "Lats", "Quads"). No sub-heads like the three deltoid heads in V1.
3. Copy for each muscle is written once, stored as static data in `web/ossa.html`, and works offline. There is no backend or CMS.
4. Front and back views of the figure both exist. Tapping any visible region should open its detail.
5. The Ossa character can show up as a static illustration with a short scripted line. It is not generated.
6. iOS first, inside the Expo WebView. Native modules are not needed for this feature.

## Problem
Users can see on the heatmap *that* a muscle is lit up, but nothing tells them *what it is*, whether it's ready to train again, or how to hit it. Right now the body map is just a picture, not a tool. The detail screen is where Ossa starts to "teach you your body" and where the heatmap turns into a next action.

## Target user
Self-improvement people, roughly 18–35. They train 2–5x a week, care about looking and feeling better, are not anatomy nerds, and want a quick answer in a calm app.

## User stories & acceptance criteria

**S1. Open a muscle.** As a user, I want to tap a muscle on the body map and see its details, so I can learn about that specific part of me.
- [ ] Tapping any heatmap region (front or back) opens the detail view for that muscle within 300 ms on an iPhone 12 or newer.
- [ ] The view shows the muscle's common name plus a one-line plain-English label (e.g. "Lats: the wings of your back").
- [ ] The tapped region stays highlighted on the figure while the detail is open.
- [ ] Swipe-down or a close control dismisses it and returns to the body map in the same view and zoom state.
- [ ] Every tappable region has a hit area of at least 44×44 pt.

**S2. Understand it.** As a user, I want a short explanation of what the muscle does, so I learn something without reading an essay.
- [ ] A "What it does" section is 60 words or fewer and has no unexplained jargon. Andrej or Maya signs off the copy.
- [ ] An "In daily life" line ties the muscle to a real action (e.g. "pulling open a heavy door").
- [ ] Every muscle region on the map has complete copy. No region opens to an empty or placeholder screen.

**S3. Know its status.** As a user, I want to see how recently and how much I've trained this muscle, so I know whether to train it or rest it.
- [ ] The status uses the same colour/state as the heatmap (e.g. Fresh / Recovering / Ready). The label and the heatmap never disagree.
- [ ] It shows "Last trained: X days ago" (or "Today") and "Sets this week: N", calculated from the workout log.
- [ ] If the muscle has never been logged, it shows "Not trained yet" and a neutral state. It never shows an error or "0 days ago".
- [ ] Logging a workout and then reopening the muscle shows the updated values without restarting the app.

**S4. Know how to train it.** As a user, I want 3 go-to exercises for this muscle, so I have a next step.
- [ ] Each muscle lists exactly 3 exercises: name plus one cue line (e.g. "Lat pulldown: lead with your elbows").
- [ ] Exercises are text only. Tapping one does nothing in V1.

**S5. Ossa says something.** As a user, I want the Ossa character to add a short line, so the screen feels like Ossa and not a textbook.
- [ ] Each muscle has one scripted Ossa line of 20 words or fewer, chosen by status (one line per state, per muscle, is fine).
- [ ] The line uses the house voice: encouraging and "level up" in tone, never shaming.

**Global**
- [ ] The visual style matches the existing Train tab (Open-inspired type, spacing and palette). No new colour tokens.
- [ ] Works with no network.
- [ ] Respects iOS light and dark mode if the app already supports it. If it doesn't, nothing new is required.

## In scope
A detail view for every heatmap muscle region with: name and tagline, what it does, a daily-life line, training status (last trained, sets this week, recovery state), 3 text exercises, and one Ossa line. Plus open/close behaviour from the body map.

## Out of scope (V1)
- **Exercise video, GIFs or animated demos.** Production cost is huge, and text cues cover the need.
- **AI coaching / generated advice.** Ossa lines are scripted. No LLM calls.
- **Social**: sharing, friends, leaderboards.
- **Logging from this screen** ("add exercise to today"). Logging stays in the existing flow.
- **Per-muscle history charts and progress graphs.** These belong to the Progress milestone.
- **Sub-muscle anatomy** (individual heads, origin/insertion, Latin deep-dive) and 3D rotation or zoom of the muscle.
- **Other body systems** (nervous, heart/lungs), the protein tracker and dares.
- **Favourites, notes and bookmarks.**
- **Paywall gating.** Decided at the onboarding/paywall milestone, not here.

## Success signal (post-launch, not a release gate)
Over 40% of weekly active users open at least one muscle detail. After a muscle detail is opened, workout logs that same day go up.

---

**Theo, handoff from Maya:**
Theo, this one's yours next. Keep it to one calm, scrollable sheet over the body map, with the muscle still glowing behind it. Please don't make it a whole new page. I've cut video, charts and the "add to workout" button on purpose. If you find the screen feels empty without one of them, bring me the usability problem, not the feature, and we'll talk. The single hardest design job here is making the status (Fresh / Recovering / Ready) instantly readable *and* identical to the heatmap. Nail that and the rest is typography. The Ossa line should feel like a friend on the sidelines, not a mascot shouting. Raj will want to know early whether you need anything beyond the existing tokens, so flag it by Wednesday.
