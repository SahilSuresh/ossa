# The start-up tutorial for Ossa

Andrej (owner; a visual learner; likes bold, game-like, clean, Opal-like; takes recommended picks) asked:
"create the best start up tutorial for my app".

Ossa (iPhone; Expo WebView; one web page `web/ossa.html` + `web/ui/*.js|css`) is "The Body as a Character": a 3D human
body you level up by training, recovering and focusing. Hard paywall (no free tier). No accounts, no ads. British English,
short plain copy, general (never diagnostic) health wording. Pure black, lime #D4FF00 accent (--glow), bone #F5F2EB
buttons (--cta), cyan for the mind (--cyan), rank colours (--rk-1..5: Fragile grey, Stable tan, Strong white, Forged
gold, Unbreakable cyan), hex badges, Inter heavy display type. All colours and font sizes come from `web/ui/tokens.css`.

## Where the tutorial sits
1. The intro ("Out of the Stone", web/ui/onboarding.js, ~3 min): your body starts as a grey stone statue; each answer
   cracks the part it is about; story report; hold to seal; the paywall (free week); "Tap to free your body" -> FIRST FORM
   ("every muscle Unranked · Your first rank unlocks after one session"); reminders; the last screen "Day 1 · Each session
   breaks one open." with the week's training days and "Enter my body".
2. Then finishOnboarding -> the Body page, and 1.5-3.4 s later the old first-run tour (startTour in web/ui/shell.js,
   tourGo/tourEnd/TOUR/TOURS in web/ossa.html ~9300): a dimmed spotlight (#tour, #trHole, #trCard) with 2 cards:
   "01 Your body · Every muscle has a rank." (spotlight on .u-rkhero) and "02 Today · One thing to do. ... Check in now"
   whose target (#tdGo .u-next) NO LONGER EXISTS after the redesign, so the spotlight sits on an empty 80px circle and
   "Check in now" opens a daily check-in (no longer central). S.toured marks it done; S.hinted hides an old "#hint".
   Monk Mode wraps startTour (not over a Monk Mode screen).

## What a brand-new user sees (screens captured at 390x844, see the PNGs)
Contact sheet: C:\Users\andre\AppData\Local\Temp\claude\C--Ossa-ossa-expo\920f0a08-9b44-4cb2-8f0d-4f92fd3d3028\scratchpad\tut\cap\n-sheet.png
Singles in the same folder: n-body.png, n-train.png, n-breathe.png (Focus), n-recover.png, n-explore.png (Learn),
n-3d.png (the 3D view), n-you.png (Profile/Evolve), p1-ab.png (the old tour, both steps).
- Body page (tab "Body"): header "MON 19 OCT · Your body", streak flame 0, avatar; hex level emblem "0 · LEVEL · 13 RP to
  go" (top-left); Front|Back + 3D cube; the 3D body (all dark: every muscle Unranked); a quiet rank key bottom-left
  (Unbreakable/Forged/Strong/Stable/Fragile); a scene/wallpaper button; the weak link ringed in lime on the body + a card
  "WEAK LINK · Traps · Not trained yet. Start here. Toda...". NOTE: a new user lands on the BACK view (the weak link is
  on the back) and nothing is ranked yet. Tap a muscle -> a tag + lead line + sheet with its rank.
- Train tab: "HEY, ALEX · Welcome back" (wrong for day one) "Full body A is ready · 40 min"; TODAY'S QUEST card (a still of
  your body with the session's muscles lit, "Full body A", "+36 RP", "Abs ranks up", a play button); the week strip;
  "Quests this week" (Full body B/C with RP). Starting a workout -> a HUD (+RP counting up, sets), exercise card with a
  muscle meter, Log set, rest sheet; finishing -> "the run": steps you go through (Results, PBs, Rank points, Rank-ups
  with a big hex badge, Level up, Trophies, Streak, Next time).
- Focus tab: Aura level ring with four orbit nodes: Breathe (+8 XP), Heartbeat, Unwind, Monk Mode (+75 XP); Check in; More.
- Recover tab: "All fresh" ring (recovery), Fuel, Mobility, "Aching? Tap where it hurts", More (desk reset, posture, sleep).
- Learn tab: Learn level, streak, lessons played out on your figure (Unit 1 Posture, "Start").
- 3D view (cube button): Muscle|Bones, a speech bubble "Morning, Alex. I'm ready when you are.", Recovery|Rank switch,
  "Unranked overall · 1 RP to Fragile I", Posture scan (Never done · 2 min) and Body check (Never done · 10 min) tiles.
- Profile (avatar): Evolve hub (Overall Unranked, Trophy room 0 of 43, Ideal self, Prestige, Your path, Your card, Your look).
## Systems a tutorial can lean on
- RP (rank points) per muscle from training; level = lifetime RP (vxLevelInfo); ranks Fragile..Unbreakable, I-III.
- Aura XP from Focus (breathing, Monk Mode). Learn level from lessons. Streak (planned rest days never break it).
- Haptics Pulse.buzz(ms|pattern), Pulse.chime; fx helpers (fxConfetti, fxCount, fxReplay); toast(); track(event,props).
- Body API: Body.setSel, Body.pulse(keys), Body.reframe, front/back, the weak-link ring; BODY_FX shader hooks.
- Navigation: uiGo("today"|"train"|"breathe"|"recover"|"explore"), setTab, the tab bar #uNav [data-u].
- Reduced motion (`reduced`) must be honoured. Small phones 375x667 must fit.
## Constraints
- Must not block the app forever; skippable but designed so people want to finish. Never over the paywall/lock, Monk
  Mode, or a workout in progress. Runs once (S.toured or a new flag), resumable if the app closes mid-way.
- RP/levels are earned by training only (the engine's rule); don't hand out RP for tapping tutorial buttons.
- Copy: British English, short, plain, no medical claims. Andrej is a visual learner: show, don't tell.
