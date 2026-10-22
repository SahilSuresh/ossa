# Ossa onboarding, as built (19 Oct 2026)

22 screens, about 3 minutes. Code: `web/ui/onboarding.js` (`uiObSteps()`), the stone body in `web/ui/rock.js`.
Throughout, a **stone-covered 3D body** stands behind the questions and cracks a bit more with every answer (the "rock" amount per step below). The body "talks": every headline is its line, and one word is lime.
Chapters show as an eyebrow with a progress bar: **You** (3) · **Your body** (5) · **Your week** (4) · **Your plan** (3). Back works on every question step.
Answers go to `OBD` as you go, and are written to `S` at the purchase and at the end (`uiObCommit`): `S.name, S.goal/S.goals, S.flagged, S.focus, S.profile {age, activity, sleep, kit, days, sit, quit}, S.commit, S.program`.

| # | Step | Headline (the body's line) | Input | Saves |
|---|---|---|---|---|
| 1 | welcome | "Find your weak link." (rotating) · eyebrow WELCOME TO OSSA · "Your body is in there. Let's break it out." · foot "About three minutes. No account. Everything stays on this phone." | Get started | — |
| 2 | name | "What should I *call* you?" | text field, Continue / Skip | OBD.name |
| 3 | frame | "Nice to meet you, {name}. Which body is *closer* to yours?" | 2 cards: Male (broader frame) / Female | OBD.body |
| 4 | ranks | "Under the stone, every muscle has a *rank*." | explainer of the 5 ranks, Got it | — |
| 5 | goals | "What do you want to get *better* at?" | multi-select cards (muscle, posture, strength, feel better…), Continue | OBD.goals, OBD.goal |
| 6 | aches | "Where does your body *complain*?" (after a pain line) | multi-select ache chips + "Nothing hurts", Continue | OBD.acheIds, OBD.aches, OBD.noAche |
| 7 | quit | "Does this sound like *you*?" quote: "I've started workout plans before and dropped them after a few weeks." | No / Yes, then a reply line | OBD.quit |
| 8 | form | "Does this sound like *you*?" quote: "I'm not always sure an exercise is working the muscle it should." | No / Yes | OBD.form |
| 9 | voice | "How should your body *talk* to you?" | 2 cards: Coach (kind and steady) / Drill, each with a sample line | OBD.tone |
| 10 | days | "Which days could you *train*?" | weekday picker, Continue | OBD.days, OBD.activity |
| 11 | kit | "Where will you *train*?" | 3 cards: Gym (full equipment) / Home (dumbbells) / Anywhere (just my body) | OBD.kit |
| 12 | age | "How old are *you*?" | age bands, Continue | OBD.age |
| 13 | sit | "How many hours do you *sit*, most days?" | 4 cards: Under 4 h / 4–6 h / 6–8 h / 8 h or more | OBD.sit |
| 14 | read | "Reading your body… Mapping your weak links… Choosing your exercises… Calibrating your ranks…" | auto, no input (the "building your plan" moment) | — |
| 15 | report | 4 tap-through story cards: 1 "{name}, we've read your body. Some hard news, and some good news." 2 THE HARD NEWS: "Every year … you sit for **N hours**. That's N whole days in a chair." 3 YOUR WEAK LINK: {chain} and why. 4 THE GOOD NEWS: "Train N times a week and your {area} reaches **N weeks** to {rank}, by {date}. Ranks never drop." | tap to advance, Continue | — |
| 16 | **sheet** (new today) | "Here's your *character*. Every stat can level up." Character sheet: LV 0, Fragile, Life score, STR/MND/REC/DIS with 12-week ghost, weak link, lowest stat | Level me up | OBD.st0 |
| 17 | plan | "This week, based on your answers, Ossa can help you:" (3 lines: sessions, fixes, resets/rest days) | Continue · **Apple's review prompt fires here** (new today, real builds only) | — |
| 18 | seal | "Let's *seal* it." **Promise hold**: press and hold the stone hex until the ring closes (≈1.3 s), "Not now" link · then "Sealed. I'll hold you to it, {name}." | hold | OBD.commit {at, weeks:12, days} |
| 19 | pro | **Hard paywall**: "PLAN READY · {area}" "Unlock your whole body." Yearly (7 days free, then the yearly price; badge FREE WEEK) / Monthly, the free-week timeline, Start, Restore · Terms · Privacy. No "Not now". | buy or trial | S.pro, then S is written |
| 20 | free | "Your free week has started" · the stone breaks: "Tap to free your body" | tap | — |
| 21 | remind | "When should I *nudge* you?" | time, Remind me / Not now (the notification permission asks here) | OBD.remind |
| 22 | day1 | "DAY 1" with the week's session dots, "Each session breaks one open." | Enter my body | S.obIn cleared, S.body set |

Prices on the paywall come from the App Store; the preview shows placeholders (£49.99 a year, £9.99 a month).
