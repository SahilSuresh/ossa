# Ossa: App Store listing v4 (24 Oct 2026, draft)

Made after the 23 Oct 4.3 rejection, from real captures of the App Store build (ossaHtml.js, no preview-only code). Nothing is uploaded. Review page: https://claude.ai/artifact/FtJ7RuFRqprCJo9hFaeJPd

- **Name** (26/30): `Ossa: Train, Focus, Evolve` (Andrej, 26 Oct; replaces `Ossa: Level Up Your Body` and the draft `Ossa: 3D Body Workout RPG`)
- **Subtitle** (26/30): `Muscle ranks & study timer`
- **Keywords** (94/100): `gym,tracker,log,strength,lifting,focus,pomodoro,habit,level,gamified,recovery,mobility,posture`
- **Promotional text** (142/170): Your body is the character. Rank every muscle from Fragile to Unbreakable, lock in to study and focus, and watch both show up on your 3D body.

## Description (3137/4000)
```
Your body is the character. Ossa shows you in 3D, with every muscle ranked from Fragile to Unbreakable. Train it, study with it, rest it, and watch it change.

Ossa needs a subscription (Ossa Pro). There is no free version. The yearly plan starts with a 7-day free trial.

IT STARTS AS STONE
Your body begins as a stone statue. Answer a few questions about your training, kit and week, and it cracks open. Your weakest muscle is marked as your weak link, with the sessions it needs.

EVERY MUSCLE HAS A RANK
Each muscle climbs five ranks: Fragile, Stable, Strong, Forged and Unbreakable, with three steps in each and its own colour on your body. Ranks never drop. Leave a muscle alone for ten days and its colour starts to fade until you train it again. Turn your body, switch to the Recovery or Bones view, and tap any muscle to see where it stands.

ONE SESSION, BUILT FOR TODAY
Train opens on today's session, built around your training days, your kit (a gym, dumbbells at home or just your body) and what has recovered. You see the muscles it works, how long it takes and the rank points it pays.

EVERY SET COUNTS
Log your sets and watch the points land on the muscles you work. Last time's numbers sit beside each set, with a rest timer and plates per side for barbell lifts. Tap how hard a lift felt and Ossa sets next time's target. Afterwards, step through your results: personal bests, rank-ups, level-ups, trophies and your streak.

STUDY. LOCK IN.
Start a timed Study or Focus session of 25, 50 or 90 minutes, with an optional task. Every minute earns XP, and each skill climbs its own ranks. Your mind shows on your body: Study ranks carve runes on your head, Focus ranks light your eyes. Pick a difficulty from Easy to Nightmare.

RECOVER ON PURPOSE
See which muscles are ready and when the rest will be back. Log protein and carbs in Fuel. Tap where it aches and get a short routine for that area. Plus a mobility flow, a desk reset, a posture scan, breathing and an evening wind-down.

LEARN
Short lessons played out on your own figure: what stress does, why muscles get sore, where fat goes when you lose it.

PRIVATE BY DESIGN
No account and no ads. What you log stays on your phone. If you connect Apple Health, Ossa reads your steps, sleep and resting heart rate and never writes to Health. The posture scan runs on your phone and nothing is uploaded.

OSSA PRO
Ossa Pro is the whole app: your ranked 3D body and your level, every workout, Study and Focus sessions, Recover, Learn and your trophies. It also adds your training plan, built from your answers, and three materials for your whole body (Obsidian, Chrome and Carbon fibre) on iPhones that can draw them.
Choose yearly, with a 7-day free trial, or monthly. Payment is charged to your Apple ID when you buy, or when the free trial ends. Ossa Pro renews automatically unless you cancel at least 24 hours before the end of the period. Manage or cancel any time in your App Store account settings.

Terms of Use (EULA): https://getossa.app/terms/
Privacy Policy: https://getossa.app/privacy/

Ossa is for general fitness and wellbeing. It is not medical advice.
```

## Screenshots and preview
- `store/screenshots-6.3in-v4/` (1206 × 2622, the required slot) and `store/screenshots-6.9in-v4/` (1320 × 2868).
- 8 slides: character, stone, quest, workout, rank-up, lock-in, mind (Study runes), recover.
- App preview: `store/listing-v4/preview/ossa-preview-886x1920.mp4` (25 s, 30 fps, H.264, silent AAC). Real footage only (guideline 2.3.4).
- Rebuild: `store/listing-v4`: `node appsrv.js`, `node srv.js`, `node cap-all.js body train run intro` and `node cap2.js` for the extra shots, `node frames.js && node render-frames.js`; video: `node rec.js`, `node vcards.js`, `W=886 H=1920 node render-dir.js vcards vcards-out`, `python buildvid.py`. Copy counts: `node copy.js`.

## Left out on purpose
Break free (out of the build), Offline and Heartbeat (overlap with Onus, reads like pulse measuring), "Monk Mode" (the app says Lock in).

## App Review notes (draft, replaces notes 1 to 3; notes 4 to 6 stay as in APP-STORE-LISTING.md)
Checked against the code on 24 Oct. Re-record the screen recording on a real iPhone with this build before sending.

> 1. SCREEN RECORDING: attached. Recorded on a physical iPhone from launch: the stone intro, the subscription screen, a sandbox purchase of the yearly free trial, then the five tabs (Body, Train, Focus, Recover, Learn).
>
> 2. PURPOSE AND AUDIENCE: Ossa is for adults who train and study. It shows the user's own body in 3D as a character: every muscle has a rank (Fragile to Unbreakable) that rises with logged workouts, and timed Study and Focus sessions ("Lock in") add marks to the body's head and eyes. It also has recovery tools (food log, routines for sore areas, mobility, posture scan, breathing) and short lessons. General fitness and wellbeing only: ranks, levels and XP are game scores, not health measures.
>
> 3. ACCESS: No account, sign-in or sample files. All data stays on the device. Answer the intro questions (about three minutes), then start the free trial on the subscription screen (sandbox). There is no free tier: if the subscription lapses, a lock screen covers the app. Restore, Terms and Privacy are on the subscription and lock screens.
> - Body: the ranked 3D body; drag to turn it; Rank, Recovery and Bones views.
> - Train: today's session; Start, log sets, Finish, then the result screens (they hide the tab bar on purpose).
> - Focus: Study, Focus and Offline sessions with a 25, 50 or 90-minute Lock in timer. Offline is a plain timer: it uses no motion sensor, and the phone can lie any way up.
> - Recover: Fuel, Mobility, sore-spot routines, and Posture scan and Body check under "Checks" (not on the Body page).
> - Demo data: avatar > Settings > Your data > "Load demo data", a normal visible button, one tap. "Start fresh" clears it.
> - Some body looks unlock as the user's level rises. Nothing is unlocked by a code, a date or a server switch.
