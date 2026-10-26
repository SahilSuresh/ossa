# Reply to App Review (Resolution Center), 26 Oct draft

Andrej's 23 Oct reply, updated for today's build. Changes from his version are marked **[new]** here only; delete the markers before sending. Fill in the build number once `build-for-app-store.bat` (or Codemagic) has uploaded it.

---

Hello. I am resubmitting with build **[NEW BUILD NUMBER]**, which makes the changes below. Detailed answers are in the attached PDF. Summary:

WHAT CHANGED. Because this account received 5.6 notices on two other apps this week, I went through Ossa's code and compiled bundle. Nothing could unlock Pro without a purchase and there is no remote configuration. Removed or changed since the reviewed build: a demo-data button revealed by 7 taps on a Settings heading (now a normal visible button that loads with one tap); a habit tracker that overlapped with Last Tin (removed); a switched-off developer test panel (deleted); a development-only Pro unlock for our preview and Expo Go (now never built into a store build); over-the-air code updates (disabled); an unused analytics switch (removed). **[new]** In this build also: the Offline focus session is now a plain timer (no motion sensor, no face-down rule), a "Coming soon" placeholder line was removed, and the app is renamed "Ossa: Train, Focus, Evolve". I inspected the uploaded IPA and searched its bundle for all of the removed items: zero matches. Pro unlocks only through In-App Purchase (Ossa Pro Yearly with a free trial, Ossa Pro Monthly) via RevenueCat. No free tier, codes, gestures, flags or device switches; no account. I am the account holder and responsible for every submission.

1. WHAT IT DOES. A real-time 3D body the user turns and zooms; each muscle coloured by recovery; workouts, recovery and focus sessions earn rank points and level it up; untrained muscles fade after 10 days. 190+ exercises (149 with 3D equipment demos), sore-spot relief, on-device posture scan, Focus/Study/Offline timed sessions, weather-aware dares, optional Apple Health score, widgets. It solves the reason people quit: logging feels like admin and progress is invisible. No account, no ads; data stays on the phone.

2. USER. Adults and older teens who train or want to start, 2-5 days a week, often with a sore spot or desk job, who like game-style progression but want real recovery guidance.

3. GAP. Trackers are lists and timers; gamified apps reward steps, not the body. Ossa models recovery per muscle and makes the 3D body the interface for training, recovery, posture and focus together, privately.

4. BETA. Several TestFlight builds on iPhone plus a Samsung, used daily by the two developers, every issue logged with a date and fixed: intro audio breaking up, sound lost after backgrounding, button sounds and vibration settings, equipment in exercise demos and a shoulder fix, small-phone layout, keyboard covering inputs, lag, a louder session-end chime, Android nav-bar overlap; and after the reviewed build, a keyboard freeze seen in crash reports, records lost when iOS cleared web storage, and a demo-data button that didn't respond on one iPhone. Details in the PDF.

5. SUITE. Standalone. Unknot: stretching routines, no 3D body, ranks or logging. Last Tin: quitting nicotine pouches; Ossa now has nothing about habits. Onus: a Screen Time app blocker with a face-down challenge; Ossa blocks nothing, **[new]** and its Offline session is now a plain countdown timer with no face-down sensing. No code shared.

6. IAP ELSEWHERE. No. The 3D body engine, rank and recovery model and exercise library are the whole product.

7. SHARED CODE ON ACCOUNT. None beyond standard tooling (Expo, React Native).

8. THIRD PARTY. No template or generator. Standard libraries only (Expo/React Native, webview, RevenueCat, Sentry for crash reports, react-native-health), MET Norway weather API, MediaPipe pose model on device, Inter font. Sounds generated in-app; 3D body, exercises and text our own.

9. CLIENT. No. Our own product, concept and branding, submitted by me under my own account.

I would welcome a call.
Andrej Gazi

---

Before sending:
- The PDF still names build 29879898: update its build number and add the three [new] changes, or say in the reply that the PDF describes the previous build.
- Check point 1's "190+ exercises (149 with 3D equipment demos)" against the new build if exercises changed.
- Sentry is declared on the privacy label (Crash Data, Performance Data), so point 8 matches.
