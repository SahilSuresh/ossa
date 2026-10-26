# Ossa: App Store precheck, 26 Oct 2026

Resubmission of 1.0.0 after the 23 Oct rejection (4.3 Spam, 4.2.6). Code: branch `resubmit-fixes` (Sahil's main 755f616 + today's fixes). Guidelines read live (last updated 16 Oct 2026). App Store Connect read in Chrome today; nothing changed there.

## Verdict: Fix first
The code is clean. What still blocks a resubmission: the privacy policy on getossa.app describes the old app and doesn't match the privacy label, and App Store Connect still holds the old build, notes and name. 4.3 stays a judgment call Apple can make again.

## Risks, worst first

| # | Item | Guideline | Status | Evidence | Fix |
|---|---|---|---|---|---|
| 1 | Privacy policy is out of date | 5.1.1(i), 5.1.2 | **Fail** | getossa.app/privacy (effective 2 Oct) still talks about camera pulse readings, "aggregate" usage data with a Settings switch, and says "we do not collect your precise location"; it never names MET Norway (coarse location), Sentry (crash and performance data) or the posture scan. The label declares Coarse Location, Crash Data, Performance Data, Device ID. | Rewrite the page to match the label and today's app. I can draft it. |
| 2 | Old build attached | 2.1, 2.3.1 | **Fail** | Version 1.0.0 has build 29879898 (23 Oct), without today's fixes. | Run `build-for-app-store.bat`, then select the new build. |
| 3 | Review notes are the old app | 2.1, 2.3.1 | **Fail** | ASC Notes start "Ossa is a strength, posture and recovery app…" (pre-redesign). | Paste the v4 notes (store/APP-STORE-LISTING-v4.md) and keep them under 4,000 characters. |
| 4 | Account standing | 5.6, 2.1 | **High risk** | Unknot was rejected under 5.6 (you replied 24 Oct; Apple hasn't answered). Onus was rejected under 2.5.1 (Sahil replied 20 Oct; Apple hasn't answered for 6 days). Last Tin is Waiting for Review. Ossa's 4.3 reply went on 24 Oct and that submission was then removed. | No message is waiting on you. With a limited review history, consider letting Last Tin finish before submitting Ossa. |
| 5 | Too similar to other apps | 4.3(b) | **Risk** | Break free and face-down Offline are gone; the 3D ranked body is the first screen after the intro. But gym RPG apps (GymLevels, Arise, Liftoff) are a crowded field. | Keep the differentiators in screenshots 1–3 and in the reply. No code change. |
| 6 | Made with an app builder | 4.2.6 | **Risk (low)** | No template or generator; own 3D engine and content. Your reply's point 8 answers this. | Send the updated reply (store/review-reply-26oct.md). |
| 7 | Code not backed up on GitHub | (s4-07) | **Fail** | Today's 6 commits exist only on this PC. | `git push https://github.com/SahilSuresh/ossa.git resubmit-fixes` |
| 8 | Name in App Store Connect | 2.3.7 | Risk | ASC shows "Ossa: Level Up Your Body"; you picked "Ossa: Train, Focus, Evolve". | Change it under App Information. |
| 9 | Purpose strings that say "doesn't" | 5.1.1(ii) | Low | app.json: Motion "Ossa doesn't use motion activity.", Health write "Ossa doesn't write to Apple Health." Odd, but they're only shown if asked, and Ossa never asks. | Leave as is, or remove in a later build. |

## Passed
- **Hidden code (5.6):** nothing found in the iOS bundle: no access codes, tap counters, reviewer unlocks, debug menus, date or region switches. Dev Pro is preview-only (0 hits in ossaHtml.js). Platform branches in App.js only handle system bars, location accuracy and purchase keys.
- **Over-the-air updates:** off (`updates.enabled false`, `checkAutomatically NEVER`).
- **Placeholders (2.1):** no "Coming soon", lorem ipsum or TODO text in the bundle.
- **Payments (3.1):** Pro only through In-App Purchase via RevenueCat; the paywall shows price, period and trial ("… free, then £X a year"); Restore purchase is in Settings and on the paywall and lock screens; Terms and Privacy are linked in the app.
- **Privacy label:** matches what the code sends (Coarse Location, Crash/Performance Data via Sentry, Purchase History, Device ID).
- **Purpose strings:** camera, Health and location are specific.
- **Screenshots (v4):** match the current build (checked Lock in and Focus; nothing shows face down).
- **Health wording:** general wellbeing, see-a-GP lines, nothing diagnostic.

## Review notes / reply
- Review notes: store/APP-STORE-LISTING-v4.md, "App Review notes".
- Reply to the 4.3 questions: store/review-reply-26oct.md. The old submission was removed, so there is no thread to reply in. Put a one-line pointer at the top of the Notes ("Answers to your 23 Oct 4.3 / 4.2.6 questions: attached PDF") and attach the updated PDF.

## Account
| App | Status | Waiting on |
|---|---|---|
| Ossa | Prepare for Submission (23 Oct submission removed) | You |
| Unknot | Rejected 5.6; you replied 24 Oct | Apple |
| Onus | Rejected 2.5.1; Sahil replied 20 Oct | Apple (6 days) |
| Last Tin | Waiting for Review | Apple |
| Jilo | Rejected; submission removed | You (no open thread) |
| Till Morning, Whatling | Prepare for Submission | — |

## Couldn't verify
- TestFlight crashes and feedback: the Expo account has no App Store Connect API key, and EAS build history isn't readable from here.
- The new build itself: it doesn't exist yet. Run the smoke test again after building.
- Age rating answers (redo in App Store Connect).
