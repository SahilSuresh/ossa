# A new App Store listing for Ossa: screenshots, icon, copy

Andrej (the owner; a visual learner who likes bold, game-like, clean looks; takes recommended picks) asked:
"create new listing for this the images based on professional designs and also a new icon".

Ossa (iPhone, bundle com.andrej.ossa, Health & Fitness) is "The Body as a Character": a 3D human body you level up by
training, recovering and focusing. It is a hard-paywall subscription app (Ossa Pro, yearly with a 7-day trial, or
monthly). No accounts, no ads, everything on the phone. British English, short plain copy, health wording general
(never diagnostic, never medical claims).

## What the app is now (after the 2.0 redesign, committed 19 Oct)
- **Body page:** your own 3D body with every muscle coloured by rank (Fragile grey, Stable tan, Strong white, Forged
  gold, Unbreakable cyan), a hex level emblem with an XP ring (Level 13 · 89 RP to go), a quiet rank key, Front/Back,
  the weak link marked with a lime ring and a card ("WEAK LINK · Shins · Stable II · 5 sessions to Strong").
- **Train:** today's quest (a still of your body with the session's muscles lit, the region, minutes, moves, the RP
  reward), the week strip, the week's quests, then "Your progress" (status bar with the level, stats, attributes).
- **The workout:** a HUD: the time, "+3 RP · 4/19 sets" counting up as you log, a quest bar of one segment per set,
  the exercise card with a muscle meter (rank, today's gain, bar to the next rank), the set table, a thumb dock with
  steppers and a bone "Log set" button, a bone rest sheet with the effort question.
- **Workout complete ("the run"):** steps you go through: Results over your lit body (minutes, sets, kg, +RP), Personal
  bests in gold, Rank points per muscle with bars, the rank-up screens (a big hex badge in the tier colour, rays,
  "FORGED II · Triceps ranked up"), Level up on the hex emblem, Trophies ("FULL WEEK" gold hex), the streak flame.
- **The 3D view:** Muscle | Bones; muscle callouts ("Tibialis · Ready · 100%"); Recovery | Rank switch; Posture scan
  and Body check quest tiles.
- **Recover, Focus (breathing, Monk Mode), Learn (lessons played out on your figure), Evolve (Trophy room, Ideal self,
  Prestige, Your path, Your card, Your look with materials Obsidian/Chrome/Carbon fibre).**
- **Onboarding ("Out of the Stone"):** your body starts as a grey stone statue on pure black; each answer cracks the
  part it is about with lime light in the seams; a story report ("3,285 hours a year in a chair"); hold to seal; the
  paywall; then "Tap to free your body" → FIRST FORM.
- Look: pure black, lime #D4FF00 accent, bone #F5F2EB buttons, Inter (heavy display), rank colours, hex badges.

## The current listing
- `C:\Ossa\ossa-expo\store\APP-STORE-LISTING.md` (name "Ossa: Posture and Training", subtitle "Rank every muscle,
  fix aches", promo text, description, keywords, review notes). Read it.
- Screenshots: plain screen captures (1320×2868 and 1206×2622) with a fake status bar and no marketing frame, in
  `store/screenshots-6.9in-v2/`. The current icon `assets/icon.png`: a glowing white dot in a ring over an ellipse on
  black (abstract; reads as a lamp or a target, not a body).

## Constraints
- Screenshots: App Store Connect needs the 6.9" set (1320×2868; 6.3" 1206×2622 can be scaled); up to 10; the first
  three carry the listing. Real app screens only (Apple: screenshots must show the app in use); marketing frames,
  captions and backgrounds are fine. No fake ratings, awards, press, user counts (Ossa has none).
- Icon: 1024×1024, no transparency, no rounded corners baked in (iOS masks it), reads at 60×60 and 29×29, no text.
- Nothing is uploaded or submitted: assets go in `store/` and the repo only.
- Tokens for the brand: --bg #000, --glow #D4FF00, --cta #F5F2EB, --cyan #00E5FF, --gold rank #FFD000-ish, rank colours.
