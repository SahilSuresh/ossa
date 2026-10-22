# MAP: body
Note first: the user's latest request is to fix the onboarding sound, which sometimes sounds like it is breaking. This task asked for a map of the "First steps" Body page area, and the map does not cover the sound. I made no edits.

# ENGINEERING MAP: the Body page (shell.js, ossa.html, band.js)

## A. Five problems to fix before building

1. **Include order is wrong in the spec.** injury.js is not last. In `web/ossa.html`, injury.js is included at 11991 and monk.js at 11997. After monk.js come heartbeat, focus, calm, unwind, recover, evolve, trophy, ideal, prestige, path, card, vault, darepage, wxplace, gate and deck (12013). Several of these reassign functions that first.js wraps:
   - `finishOnboarding` (gate.js:51)
   - `uiFocusCardWire` (prestige.js:384)
   - `setTab` (recover.js:369, evolve.js:477, workout.js:394)
   - `uiGo` (workout.js:395)
   - `drawPlanFloat` (deck.js:357)
   - `renderYou` (evolve.js:471)

   **Put `/*@include ui/first.js*/` after deck.js (12013) and first.css after deck.css (3375).** Then the first.js wrappers sit outermost and wrap the final versions.
2. **#rdBub does not exist.** Nothing renders `id="rdBub"`, so `rdBubShow` (11219) and `rdDraw` (11230) return straight away and `rdLines` is dead code. `lineTick` (7610) belongs to `#bline`, the 3D view's once-a-day line (setInterval 1200, ossa.html:7629), and is gated by `whOK`.
   - The 3D view first-visit line must use #fsBub or #bline.
   - The "mute #rdBub" plumbing is already a no-op.
3. **#uRkLead already rings the weak link.** `uiHeroDraw` draws at `UIH.sel||UIH.weak`, so with nothing picked a lime ring and dot already sit on the weak link. The spec's "never #uRkLead, which follows UIH.sel" is only half true, and #fsRing would double it.
   - Hide it during s1 when nothing is picked: `#app.fs-s1 #uRkLead:not(.pick){opacity:0!important}`.
   - `!important` is needed because `uiHeroDraw` writes `lead.style.opacity` inline.
4. **Fix 11 is already true in the code.** On landing: `rdHomeOn(true)` → `camTo(yaw 0)` → 60 ms later `rdTabFigure(RDH.tab)` → `uiHomeFigure()`. That calls `camTo` with `UIH.view||rkWeakView(UIH.sel||UIH.weak||rkWeak())` (shell.js:455-456), which already gives the front view for front weak links. Leave it alone.
5. **S.toured side effects.** The ossa.html `finishOnboarding` reads `S.toured` itself: `if(!S.toured) setTimeout(startTour,3400); else setTimeout(showHint,2400);` (8417).
   - If first.js sets `S.toured=true` before calling `_f`, `showHint` runs and unhides `#hint` ("Tap a glowing point…") on the 3D view. That collides with the 3D first-visit line. **Also set `S.hinted=true`**, as the old `startTour` did (shell.js:804).
   - `S.toured=true` also turns on `whOK` (whispers and #bline) on the 3D view, as the old tourEnd did.

## B. The rendering and coordinate model

- **`Body.project(p)`** (ossa.html:4991, GL only; the SVG body has no `project`) returns `{x,y,yaw}` or `null` when the point is behind the camera. The coordinates are **#app-local** canvas pixels. rock.js confirms this: it adds `ar.left-hr.left`.
- **Scrolling is not included.** #stage is `position:absolute;inset:0`. When #tv-today scrolls, `rdScroll` (11134) moves #stage with `translate3d(0,-y)`, where `y=min(scrollTop, heroBottom+60)`, and project() ignores that.
  - Inside the hero it cancels out. `uiHeroDraw` uses `x=best.x-(tv.offsetLeft+h.offsetLeft)` and `y=best.y-(tv.offsetTop+h.offsetTop)`.
  - For an #app-level layer, use `appY = pr.y-(tv.offsetTop+h.offsetTop) + (h.getBoundingClientRect().top - app.getBoundingClientRect().top)`, and the same for x.
- **#fsLayer must be `position:absolute;inset:0` inside #app, not `position:fixed`.** `.app` is `position:relative;max-width:520px;margin:0 auto;overflow:hidden` (ossa.html:27), so a fixed layer is misaligned in the desktop preview.
  - Stacking: `.tabv` z 4, `.u-nav` z 6, `.toast` z 9. Use z 5 for the layer.
- **report() does not run every frame.** It is called once per drawn GL frame (ossa.html:4828: `if(typeof uiHeroDraw==="function") uiHeroDraw();`). The global name is looked up each time, so reassigning `uiHeroDraw` works.
  - On the Body page the loop draws at about 30 fps only when `!reduced && S.scene!==0`. Otherwise it stops when idle, and it never runs while `document.hidden`.
  - Scrolling #tv-today does not draw a frame.
  - **So also place the ring and bubble from fsTick, from a #tv-today `scroll` listener, and once by force when a step starts.**

## C. Function by function

**UIH**: shell.js:47 `const UIH={view:null};`
- A top-level const. It can't be redeclared, but its properties can be read and written from first.js.
- `.weak` is set only in `renderToday` (238: `UIH.weak=weak` from `rkWeak()`).
- `.sel` is a muscle key or null, set by `uiHeroSelect`. The rdHomeOn wrapper clears it (shell.js:466 `if(!on&&was){ UIH.sel=null;…`). That happens on any `setMode("train")` (ossa.html:6052 calls `rdHomeOn(false)`) and on leaving the Body page. **So s2's "the weak muscle stays selected" lasts only until Train is tapped.**
- `.view` is "front", "back" or null, set by the Front/Back control.
- **UIHD** (shell.js:519 `const UIHD={k:""}`) is a redraw cache. Set `UIHD.k=""` and call `uiHeroDraw(true)` to force a redraw.

**renderToday()**: shell.js:227, a function declaration and the only one.
- Can be wrapped by reassignment.
- Rewrites all of `#tv-today.innerHTML`:
  - `header.u-top`
  - In 3D, `section#rdHero.u-rkhero.u-rk3dh[data-pad=56]` with:
    - `.u-lvl` (uiLevelMarkHTML 185)
    - `.u-rkrail` (uiRankRailHTML 218)
    - `.u-rkbar`, holding the side control (`.u-seg.u-rkview` with `[data-fv]` buttons) and `#uRk3d`
    - `#uScnBtn` and `#uScnPop` (uiSceneHTML 199)
    - `button#uRkTap.u-rk-tap`
    - `svg#uRkLead.u-rk-lead` (polyline, `circle.r`, `circle.d`)
    - `span#uRkCall`
    - `i.rh-low`
  - Then `.u-below > #uWeak`.
- It then wires `uiWireTodayHead`, `uiFocusCardWire`, `uiHeroWire` and `uiSceneWire`, calls `rdHomeOn(true)` if `!RDH.on`, and runs `uiHeroDraw(true)` in a rAF.
- **Callers:**
  - `setTab("today")` (ossa.html:9559)
  - `refreshWhole` (9343), which runs often: after workouts, `closeMind`, the standards celebration and more
  - 9877, 10121, 10458
  - `uiBoot`
  - the uAsk handlers (612, 613)
- **Gotchas:**
  - Classes on #rdHero (fs-dim), the #uRkTap aria-label and any node inside the hero are wiped on every call. Key the CSS off #app classes (`#app.fs-s1 #rdHero .u-scn-btn, #app.fs-s1 .u-rkrail{opacity:.45}`), and re-apply the aria-label in a renderToday wrapper.
  - The rail renders tiers `[5,4,3,2,1]` top to bottom, and the spans have no `data-t`. Fragile is `:last-child` and Unbreakable is `:first-child`. Each dot is an `i` with `--c:var(--rk-t)`.
  - `uiLevelMarkHTML` itself writes `S.lvSeen` and shows `.u-lvl.up` on the first render after a level change. That flash may fire before s6 is on screen.
  - SVG fallback (`uiHome3D()` false, shell.js:443): there is no #rdHero, #uRkTap, `.u-rkrail`, `.u-lvl` or `.u-rkbar`. You get the flat `#uRkFig`, `#uRkCall` ("Weak link") and `#uRk3d`.

**uiHeroDraw(force)**: shell.js:520, a function declaration. Wrap it by reassignment.
```js
if(typeof RDH==="undefined"||!RDH.on||TAB!=="today") return;
if(app.classList.contains("train")||app.classList.contains("homeoff")) return;
const k=UIH.sel||UIH.weak, m=k&&typeof MCEN!=="undefined"&&MCEN[k];
if(m) [1,-1].forEach(sg=>{ const pr=Body.project([m[0]*sg,m[1],m[2]]); if(!pr) return; const f=Math.cos(pr.yaw-sg*((MUSCLES[k]&&MUSCLES[k].face)||0)); if(!best||f>best.f) best={x:pr.x,y:pr.y,f}; });
if(!best||best.f<0.12){ … return; }
```
- The tag (picked muscles only):
  - right side: `ly=clamp(144, H-64)`
  - left side: `ly=clamp(164, H-116)`
  - `lx = 8` or `W-bw-8`
- Opacity is `min(1,(f-0.12)/0.3)`.
- **Callers:** report(), uiHeroSelect, and renderToday's rAF.
- **Wrapper:** call the original first, then do your own maths for `MCEN[UIH.weak]`, because the original returns early or uses the key cache.

**MCEN**: ossa.html:3776 `let MCEN={}`. `computeMCEN` replaces the whole object (boot at 12017, `useFigure` at 7939, onboarding.js:155). Read `MCEN[k]` fresh every time and never cache it. Each value is one side's `[x,y,z]`; mirror it with `x*sg`.

**figP**: ossa.html:9280 `const figP=p=>…`, an arrow function you call but can't redefine. The head point is `figP([0,1.86,0.02])`, the same one `drawLine` and `rdDraw` use.

**uiHeroSelect(k)**: shell.js:484, a function declaration.
```js
if(k===UIH.sel) k=null;   // a second tap lets go
UIH.sel=k||null; Body.setSel(...); if(k&&Body.pulse) Body.pulse([k]);
Pulse.buzz(k?[6,30,10]:5); if(k) track("home_muscle",{k});
const c=$("uWeak"); if(c){ c.outerHTML=k?uiFocusCardHTML(k):uiWeakCardHTML(); uiFocusCardWire(); }
UIHD.k=""; uiHeroDraw(true);
```
- **Callers:**
  - the #uRkTap click listener (uiHeroWire 512: `if(k||UIH.sel) uiHeroSelect(k)`, which looks up the global name)
  - the Front/Back handler (268), which calls `uiHeroSelect(UIH.sel)` to drop a pick that is out of sight
- **Wrapper:** decide by the state after the call (`prev!==UIH.weak && UIH.sel===UIH.weak`), never by the argument, because calling it with the weak link when it's already selected deselects it. A wrong pick shows as `UIH.sel && UIH.sel!==UIH.weak` after the call.

**uiHeroPick(cx,cy)**: shell.js:476. It returns a muscle key or null, from `Body.pickAt` on the #stage canvas, searching 9 points around the tap. It needs no wrapper.

**uiWeakCardHTML()** (500) and **uiFocusCardHTML(k)** (493): both render `button#uWeak.u-card.u-weak`.
- The weak card has no `data-k` and the eyebrow "Weak link".
- The focus card has `data-k`, the class `.u-focus` and the eyebrow "Your pick".
- `uiFocusCardHTML` is wrapped at prestige.js:382.

**uiFocusCardWire()**: shell.js:505.
```js
c.onclick=()=>{ Pulse.buzz(8); const k=c.dataset.k; if(!k){ openRanks(); return; } rkShow3D(); … }
```
- It is wrapped by prestige.js:384, which only acts when `data-k` is set.
- **Callers:** renderToday, uiHeroSelect, and prestige's `pzRedrawSeen`.
- **A sturdier option:** one capture-phase click listener on #tv-today. While s1 runs, for `#uWeak:not([data-k])`, call `stopPropagation()` and then `uiHeroSelect(UIH.weak)`. It survives every re-render and doesn't depend on wrapper order.

**rkWeak()**: ranks.js:48, a function declaration. It never returns a flagged muscle, and it prefers trained muscles in the focus regions.

**rkWeakView(k)**: ranks.js:56. It returns "back" for a fixed list (rear_delt, triceps, traps, lats, rhomboids, erectors, glute_max, glute_med, hamstrings, gastrocnemius, soleus) and "front" otherwise.

**rkSay**: ranks.js:17 `const rkSay=k=>RK_SAY[k]||MUSCLES[k].name`. Call it but don't redefine it. Names are capitalised ("Lower back", "Glutes"), so lowercase them for the body's lines. For plurals, use rkNeeds' rule: ends in s, not "us".

**rdHomeOn(on)**: ossa.html:11118, wrapped at shell.js:463 by reassignment.
- It requires `Body.kind==="gl"`.
- Turning on with `!was` runs `camTo(yaw 0, 0.9s)`, then 60 ms later `rdTabFigure(RDH.tab)` → `uiHomeFigure()` (shell.js:446).
- `uiHomeFigure` does `clearInterval(TR.planSpin)`, `setSel(UIH.sel)`, `camTo` to the weak side over 0.7 s, and `setAura(null,null,0)`.
- **Gotcha:** `uiHomeFigure`, `rdScroll` going off (11142) and `rdHomeOn(false)` all call `setAura(…,0)`, so any of them cancels the climb's aura wash.

**Body API** (GL object, ossa.html:4955-5016):

| Call | Line | What it does | SVG body |
|---|---|---|---|
| `camTo(to,dur,done)` | 4964 | `to={zoom,px,py,yaw}`, `dur` in seconds, yaw goes to `nearestYaw` (a half-turn of +π is ambiguous). Replaces any running tween and chains the old `done`. | calls `done` |
| `setView(v)` | 4995 | "front" or "back": eases `T.yaw` | redraws |
| `setAura(a,b,k)` | 5001 | `a`,`b` RGB arrays 0–1, `k` 0–1; eases with a time constant of about 0.35 s, instant under `reduced`. `setAura(null,null,0)` keeps the colours and fades out. **It exists, with exactly the spec's signature.** | **missing**: guard with `Body.setAura&&` |
| `pulse(keys)` | 5016 | `pulse.fill(0); keys.forEach(…)`: one global pulse lasting 1.5 s. No argument throws. A new call cancels any other muscle's pulse. | `pulse(){}` no-op |
| `kind` | — | "gl" or "svg" | — |

**#rdBub, rdLines, lineTick, whOK, #hint**:
- `whOK()` (ossa.html:5319):
  ```js
  if(Body.kind!=="gl"||!S.body||!S.toured||…||TAB!=="body") return false;
  if(["train","onboarding","touring","minding","sys","storying","tabbed","xray"].some(c=>a.classList.contains(c))) return false;
  ```
  It is the gate for the 3D view's whispers (#wh), the daily `#bline` line (lineTick 7610, drawLine 7626) and nothing on the Body page, which always has `TAB==="today"` and `tabbed`.
- `showHint()` (5225) unhides `#hint` (3D HUD, 3417) if `!S.hinted`. `hideHint()` is at 5226.

**The "touring" class users:**
- ossa.html:1777 `.app.touring .hint{display:none!important}`
- whOK (5321)
- monk.js:156 `mmCanOpen()`. It blocks Monk Mode's done or timer screen from opening at boot or open (monk.js:139, 179), so only add "touring" while a bubble is actually showing.
- the old startTour adds it (shell.js:806) and tourEnd removes it (9389, only if `TOURS.on`).

**drawTabs()**: shell.js:118, a function declaration with no wrappers.
- At 134: `t.classList.toggle("due",!!S.body&&!todayCheck())`. It runs on most navigations.
- **CSS gotcha** (shell.css:26): `.u-nav-ic::after` is shared by `.on`, `.due`, `.live` (Train) and `.mlive` (Focus). Hide only the not-selected due ring: `#app.fs-quiet .u-nav button[data-u="today"].due:not(.on) .u-nav-ic::after{display:none}`.
- **The seal:** make it a real `span.fs-seal` child of `.u-nav-ic` (`position:relative`, shell.css:14). `rdNavBuild` (61) builds the nav once and drawTabs only toggles classes, so the seal survives.
- `.u-nav button:active .u-nav-ic{transform:scale(.9)}` will fight a transform spring on `.u-nav-ic`. Animate a child, or use `animation`.

**startTour**: shell.js:800, a function declaration that sets `TOURS.on` and the "touring" class.
- monk.js:473 wraps it at include time (`if(mmHere()) return;`). Because it captures the hoisted last declaration, it wraps first.js's version. Safe, as the spec says.
- **Callers:**
  - the boot line, ossa.html:12023: `if(!S.body||S.obIn) startOnboarding(); else if(!S.toured) setTimeout(startTour,1500); else setTimeout(showHint,1200);`
  - finishOnboarding at 8417 (3400 ms)
  - `#yuTour` at 9987: `setTab("body"); setTimeout(startTour,reduced?50:700);`. Note that `setTab("body")` opens the 3D view. The row is rendered in renderYou (9954), which shell.js:680 and evolve.js:471 wrap.

**finishOnboarding(skipped)**: ossa.html:8392. The wrapper chain, from innermost:
1. the original
2. shell.js:811: calls `_f(skipped)` (doesn't return its value), then `setTab("today")` and `rdHomeOn(true)`
3. onboarding.js:586: `delete S.obIn; obRockStop()`, then `return _f.apply`
4. gate.js:51: `setTimeout(gtCheck,0)`, so the lock can cover the app straight away; fsGo must check `gtLocked()`

- **Callers:**
  - onboarding.js:87, after "Enter my body" (`#o2Ok`, 581) resolves the last step
  - `uiObPaid` fallback (519)
  - `#o2Skip` (8167, `skipped=true`)
- **Fix 3:** delete the toast at 8418-8419 (`if(!skipped&&S.focus){ … toast(\`Your focus: ${c.name}. Check in on the Body page: one tap.\`); },2200); }`).

**uiBoot()**: shell.js:817, wrapped at monk.js:471. It is called at ossa.html:12026, after the boot line.

**gtLocked()**: gate.js:17. It returns true when `S.body`, Pro is off, it isn't the desktop preview, and the intro isn't showing. In the preview (localhost) it is false unless `?lock=1`.

**mmHere()**: monk.js:161: `MIND.open && /^(monk|focus)/.test(MIND.view) && #mind .mm-v`.

**sheetState and panels:**
- `sheetState`: ossa.html:3946, a `let` ("closed", "peek" or "full").
- `setSheet(st)`: 5238, wrapped near the end of shell.js (peek fit).
- `closePanels()`: 5925, wrapped by ranks.js:147 (calls `_c()`), band.js:86, injury.js:334 and discover.js:421.

**reduced**: ossa.html:3942, `const` from matchMedia, read once at load.

**Pulse**: ossa.html:8040, a const IIFE object.
- `buzz(p)` takes a number or an array. It needs `userActivation.hasBeenActive`.
- **`chime(i)` is silent unless `Pulse.audio()` ran first** (`if(!ac) return;`). Call `Pulse.audio&&Pulse.audio()` first, as rdBubShow and monk.js do.
- chime ignores `S.music`. `rkKnock` (rock.js:186) is silent when `S.music===false` and plays at most once every 70 ms.

**toast(t)**: ossa.html:5947 `let tt; function toast(t){…3000…}`. It is a single `#toast` element (top 64px, z 9) with **no queue**. It is a function declaration, so to hold toasts, reassign it with a pending list.

**fx.js:**
- `fxConfetti(host,o)` (17): `o={x,y` as fractions 0–1 of the host`, count, colors:[token]}`. It appends `canvas.fx-cf` (absolute, inset 0, z 40), so the host must be positioned and have a size. It does nothing under `reduced` and returns nothing.
- `fxReplay(el,cls)` (75): `if(!el||reduced) return; remove; reflow; add`. **Under reduced it never adds the class.** Don't rely on it to make the bubble visible.

**band.js**: this is the 3D view's `#hudBottom` band (`rdxBuild`, `bdDraw`, `bdReadout`), plus wrappers on `rkSync`, `drawWeek`, `psClose` and `closePanels`. The Body page does not use it. `.u-rkbar`, `.u-lvl` and `.u-rkrail` all come from shell.js `renderToday`. For bubble limits, use `getBoundingClientRect()` of `#rdHero .u-rkbar` (top right) and `#rdHero .u-lvl` (top left).

## D. Smaller corrections to the spec

- **Focus:** call `#uRkTap.focus({preventScroll:true})`, or #tv-today scrolls. Re-apply the target's aria-label after each renderToday.
- **Leaving the Body page:** tapping Train goes through `uiGo` (shell.js:76; workout.js:395 blocks it during wkrun), then `setMode("train")` and `rdHomeOn(false)`, which clears UIH.sel.
- **"Every 3.2 s Body.pulse([UIH.weak])":** after a wrong pick it cancels that muscle's 1.5 s pulse. Accept it, or skip the pulse while `UIH.sel` is set.
- **The climb's `setAura`:** if the user scrolls the hero away during the climb, `rdScroll` sets `homeoff` and clears the aura. Re-check before calling `setAura(null,null,0)`.
- **Toast after paying:** ossa.html:8383 (a paywall `done`) still toasts "Your free week has started…" 700 ms after `finishOnboarding`. Check whether this path is still live. It is above the bubble's area, but the spec says to hold toasts.

# MAP: train
# Engineering map: Train tab (deck.js, train.js, ossa.html train code, vessel.js)

Nothing was edited. Line numbers are from the current tree.

## 0. Spec mismatches (fix these first)

1. **Include order.** The spec says first.js goes "after monk.js and before injury.js". That order cannot exist: injury.js comes at ossa.html:11991, before monk.js at :11997. deck.js is the last include (:12013), not injury.js, so CLAUDE.md is out of date here. Put `/*@include ui/first.js*/` after deck.js. Reassigning a function works from any position, but a function *declaration* in first.js that shares a name with something in deck.js loses if first.js comes earlier.
2. **`dkAct(c,'moves')` cannot open a custom session.** It forces `TR.custom=false; TR.day=c.d` (deck.js:318). The wrapper must handle `kind==='first'` for both `go` and `moves` on its own, and never pass that card to the original. The original `go` path (:315-316) treats any non-'rest' kind as a plan day (`TR.custom=false`), which is wrong for the starter.
3. **`dkQuestHTML` needs a wrapper, but the spec doesn't list it.** It hard-codes the eyebrow "Today's quest", the meta eyebrow `dkRegion(c)` (it should say "Weak link"), and the class `is-${dkState(c)}` (no `is-first`). It also has no "Level 1" chip (:213-230). Wrap it by reassignment, and add it to the UI-SYSTEM.md wrapper list.
4. **The card still lights every move, not just the weak link.** The still comes from `dkMask(c)` (:94). For any non-done, non-rest kind it lights every item's primary at 1 and its helpers at 0.3. To light only the weak muscle, wrap `dkMask` (called by name inside dkDraw's dkFill callback, :301) and return `{[weak]:1}` for `kind==='first'`.
5. **`S.flagged` is not muscles.** It holds onboarding ache **region ids** (`OBD.aches`, e.g. "lowerback" or "upperback"; onboarding.js:527, ossa.html:7973). "Unflagged muscles" should use `rkFlagged(k)` (ranks.js:30, which is `vxFlagged`, i.e. S.spots), as `rkWeak` does.
6. **Kit and experience.** `S.profile.kit` is `gym|db|bw`. `rdtMode()` (ossa.html:11953) collapses it to `gym|home`, and `rdtA()` (:11954) gives `{kit:'gym'|'bw', exp}`. `rdtA().exp` reads `S.program.exp`, which never exists (`genPlan` returns `{a,week,created}`, so the real field is `S.program.a.exp`). So `exp` is always "some". For the starter, use `{kit:rdtA().kit, exp:(S.program&&S.program.a&&S.program.a.exp)||"some"}`. For bodyweight, `pickEx`'s "new" swap does nothing: `EQX.adductors[1]` is "Copenhagen plank" either way. Filter `/Copenhagen|Nordic/` out of the starter.
7. **The '15 min' copy holds unless the cap is hit.** `estMin` = `max(5, round(sets*2.1/5)*5)`: 6 to 8 sets give 15 min, 9 sets give 20. I ran the RP rules for bodyweight starters and a new user (scores 0, carry 0):

   | Weak link | Moves × sets | Sets | RP | Min |
   |---|---|---|---|---|
   | traps | Prone Y-raise×3, Inverted row×2, Push-ups×2 | 7 | 15 | 15 |
   | erectors | | 7 | 14 | 15 |
   | glute_med | | 7 | 13 | 15 |
   | abs | | 8 | 13 | 15 |
   | tibialis | | 9 (the cap) | 13 | 20 |

   Level 1 needs 13 RP (`vxLevelXp(1)=round(12.7)`). So the 9-set cap holds, and the minutes copy must stay live.
8. **The button text has no "·".** It is `Start workout<span class="tp-end">done by HH:MM</span>` (train.js:242).
9. **"Back without starting returns to the hub" is only half true.** `#trainBack` and tapping the Train tab do go to the hub (shell.js:71 and :87). The custom screen's own pill `#backToday` ("‹ This week's plan", train.js:231) sets `TR.custom=false; TR.day=todayIdx` and opens **today's plan session screen**, not the hub.
10. **No-WebGL.** `drawTrain` only calls `drawPlanFloat` when `Body.kind==="gl"` (ossa.html:6191). Otherwise the legacy markup renders: `#startW` inside `.cta` (no `.tp`, no `.tp-cta`, no dkPlanDress), with `onclick=startWorkout` captured by reference at render time. The s4 docking needs a fallback selector, `#train .cta`.
11. **Day-1 header trigger.** If it keys on `sessionsN()===0`, it will disagree with the starter card. A mobility session raises `sessionsN` (the record is created whenever sets>0, vessel.js:270), but it earns no RP, so `day1` stays unset and the starter stays. Key the header on `c.kind==='first'` instead.

## 1. deck.js: the hub

All of these are top-level `function` declarations. Each can be wrapped by reassignment from a later file, because callers resolve the name when they run. None of them is called from outside deck.js.

**`dkS()` :23.** A per-session object `{i,key,cards,tab,sayT,said,saidAt}`. `st.cards` is the array that the click handlers index.

**`dkOn()` :24.** True when `#app.train.thub` and `#dkHome` exist. Use it for s2's "arrived".

**`dkReady(items)` :29.** Returns `{ks, rec, h, ok}`:
- `ks`: the unique primaries
- `rec`: the ones still recovering, slowest first
- `h`: the maximum `hoursLeft`
- `ok`: `h<=2`

**`dkSession(d)` :46.** Today: `rdTodaySession()`, which runs adaptToday (it can return an empty "rest" adapt), then applyOrder, applySwaps and rdtKit. Other days: `rdtApplyOrder(applySwaps(sessionForDay(d)))` plus `rdtKit`.

**`dkNextDay()` :50.** The next day index with items (wraps past Sunday), or -1.

**`dkTodayRec()` :51.** Today's last non-posture record: `{rec,i}`.

**`dkCards()` :52-75.** It looks at the 7 days starting today:
- **n=0, `doneToday()`:** pushes `{id:"done", kind:"done", d, w:rec, wi, title, ks, ld, rp:[[k,rp]…], earned, ok:true, h:0, rec:[]}` and marks today's title as seen.
- **n=0, no items** (a planned rest day, or adaptToday returned rest): pushes the rest card `{id:"rest", kind:"rest", d, s:mobilitySession(), title:"Recovery day", ks:[], rec:R.rec, h:0, ok:true, mob:true}`, where `R=dkReady(GLORDER…)`.
- **n=0 with items:** pushes `{id:"today", kind:"today", d, s, title, ks, rec, h, ok, targets: trTargets(items, s.kind==="mobility")}`.
- **n>0:** `{id:"d"+d, kind:"day", d, n, s, title, …R, targets}`, de-duplicated by title.
- **Output:** the head cards (non-day) unchanged, then the day cards sorted by `ok` desc, `h` asc, `n` asc, then `.slice(0,6)`.

**Wrapper plan.**
1. Call the original.
2. If the starter is active (`!S.fs.end && !S.fs.done.day1 && !doneToday()`), turn the `kind:"today"` card into `{...c, id:"d"+todayIdx, kind:"day", n:0}`. A rest card can stay as a row: `dkRowHTML` and `dkAct('go')` handle kind rest.
3. `unshift` the first card and re-slice to 6.

The first card must carry everything the shared renderers read: `{id:"first", kind:"first", d:todayIdx, s:starter, title, ks, rec, h, ok, targets}`. Use `dkReady(starter.items)` and `trTargets(starter.items)`.

**`sessionsN()===0` today.** dkCards has no special case. A new user sees a normal today or rest card, `dkTopHTML` says "Welcome back", and the HUD says "Level 0 · 13 RP to level 1".

**`dkState(c)` :76.** Returns done, rest, ready (`c.ok`) or rec. Kind 'first' maps to ready or rec, giving `.dk-quest.is-ready` (lime border via `deck.css:26`).

**`dkShotFor(mask,h)` :109.** Returns a data URL from `Body.shot({yaw,mask,crop,h})`. It is null unless `Body.kind==='gl'` and the mask has keys. Results are cached (12 entries) by body, finish, look, yaw, crop, h and mask. `dkShot(c)` is `dkShotFor(dkMask(c),200)`; `dkThumb(k)` is one muscle at 160.

**`dkFill(sel,get)` :121.** Sets `background-image` and the class `pic` on one element per 40 ms, starting after 80 ms.

**`dkFig(c)` :269.** A flat SVG placeholder, `figSvg(118,{k:["rec",1]})` for every `c.ks`.

**`dkTopHTML(c)` :195-210.** Renders:
- `header.dk-top`, containing `button.dk-ava[data-dk=profile]` and `.dk-htx`, which holds `span.u-eyebrow.dk-hey` ("Hey, {name}" or "Hey there"), **`h1.dk-hh` hard-coded "Welcome back"** (:206) and `p.dk-hsub` (the state line)
- `.dk-hbtns`, containing `button.dk-rank[data-dk=ranks]` and `button.dk-kit[data-dk=kit]`

The line logic (:199-203): done, rest, `c.ok`, which gives "`{title} is ready · {estMin} min`", or the recovering case, which needs `c.rec[0]`. Fix 1: wrap it and string-replace the h1 and `.dk-hsub` when `c.kind==='first'`, or edit deck.js directly. `dkSay` (:131) temporarily rewrites `.dk-hsub` and restores it from `data-base`.

**`dkQuestHTML(c)` :213-230.** Renders `section.dk-quest.is-{state}`, containing:
- `span.dk-qth.dk-th[data-row=0]` with the dkFig
- `button.dk-qtap[data-open=0]`, containing `.u-eyebrow.dk-qeye`, `h2.dk-qh`, `.dk-qmeta`, and `.dk-rews > span.dk-rew` (plus `.up` and `.amb` variants)
- `button.dk-qplay[data-go=0]`, with `.soft` added when `!ok`

The rank-up chip uses the **first** target where `toNext(score).pts <= x.rp`. For a new user `toNext(0).pts=1`, so the first target with any RP qualifies, ordered by load, which is the weak link if it carries the most sets. The replacement HTML must keep `data-row="0"`, `data-open="0"` and `data-go="0"`.

**`dkRowHTML(c,j)` :256.** Renders `article.dk-row[data-row=j]`, `button.dk-rowtap[data-open=j]` and `button.dk-play[data-go=j]`. j is the index into `st.cards` (rows start at 1).

**`dkDraw()` :273-302.** Sets `#dkHome.innerHTML` to: the top, then `.dk-sheet` containing the quest, `.dk-week` (`button.dk-day[data-dd]`), "Quests this week" with rows (or "More ways to train"), the side quest, the HUD (`button.dk-hud`), `.dk-tabs`, `.dk-stats` (`button.dk-stat[data-ds]`) and `.dk-attrs`. It then wires the handlers:

| Element | Action |
|---|---|
| `[data-dk]` | `dkAct(c, k)` |
| `[data-dd]` | `dkAct({kind:"day", d, s}, "moves")` |
| `[data-tab]` | redraws (`dkDraw()`) |
| `[data-ds]` | stat card. Shows its line first; a second tap within 2.6 s routes: `k:"moves"` to `dkAct(c,"moves")`, `"recover"` to `setTab`, `"ranks"` to `openRanks` |
| `[data-open]` | `dkAct(x, done ? "sets" : "moves")` |
| `[data-go]` | `dkAct(x, "go")` |

`dkStats(c)` (:155) has no 'first' branch. It falls through to the default (:180-186), which needs `c.s.items`, `targets`, `ks`, `ok`, `rec` and `h`. Its "min" stat routes to `dkAct(c,"moves")`.

**`dkIgnite(start)` :304.** Appends `div.dk-sweep` to #app, calls `start()` at 270 ms, and removes the sweep 260 ms later. With `reduced` it calls `start()` straight away.

**`dkAct(c,k)` :312.** Calls `track("train_hub",{k:k+":"+c.kind})` first. Then:

| k | What it does |
|---|---|
| `go` | `Pulse.buzz([10,40,14])`, then `dkIgnite(start)` |
| `moves` | non-custom only (see §0.2) |
| `edit` | `sessionForDay(c.d)` into `TR.ed` |
| `sets` | `openDensity` |
| `ranks` | `openRanks` |
| `profile` | `setTab("you")` |
| `kit` | `uiSetKit(…)`, which calls `rdTrainHub()` again, so the starter must rebuild for the new kit and must not be cached across `rdtMode()` |
| `more` | `dkMore` |

The rest-card pattern for a custom session (:315): `TR.custom=true; TR.session=c.s; TR.hub=false; startWorkout();`

**Starter wrapper.** For `kind==='first'`:
- `go`: `track(...)`, then `Pulse.buzz([10,40,14])` (don't buzz twice), then `dkIgnite(()=>{ TR.custom=true; TR.session=clone(c.s); TR.hub=false; startWorkout(); })`
- `moves`: `TR.custom=true; TR.session=clone(c.s); TR.pick=TR.ed=null; TR.planSel=null; TR.planEnter=true; TR.hub=false; drawTrain(); $("train").scrollTop=0;`

**Clone the session.** `swapEx` writes into `TR.session.items[i]` in place when custom (ossa.html:7708), and that would change the cached card.

**`rdTrainHub()` :329.** This is deck's redefinition; shell.js:698 is the dead original. It:
1. clears `TR.planSpin`
2. sets the classes on `#app`: removes tplan, tactive and tdone, adds thub
3. sets `st.cards=dkCards()`
4. sets `#train.innerHTML='<div class="dk" id="dkHome">'`
5. calls `dkDraw()`, falling back to `dkFallback` if it throws
6. adds `.dk-enter` for 900 ms
7. sets `scrollTop=0`

It is called from `drawTrain` when `window.RDLOOK && rdTrainHubOn()`, where `rdTrainHubOn` (a const, :11973) is `TR.view==="plan" && TR.hub!==false && !TR.pick && !TR.ed`. `uiSetKit` also calls it.

**`dkPlanDress()` :349.** Adds `.dk-tp` to `#train .tp`. For each `.tp-list:not(.rest) .tp-r`, it inserts `span.dk-th.dk-th-row[data-k=primary]` as the first child, skipping rows that already have one, then runs dkFill with `dkThumb`. The item is `TR.session.items[+li.dataset.i]`. It is called by deck's IIFE wrapper on `drawPlanFloat` (:356-358, a reassignment at load). The fs chip wrapper should reuse the same pattern: no duplicates, a chip inside `.tx small`, only when `TR.session.fs`.

**`dkMore` quick session (:387).** `TR.custom=true; TR.session=rdtQuick(RDT.g,RDT.m); TR.hub=false; startWorkout()`.

## 2. The session screen: train.js `drawPlanFloat()` :217-280

This is a function declaration, already reassigned once by deck.js. It reads `TR.session`, `TR.custom`, `TR.day`, `TR.planSel`, `TR.pick`, `TR.ed`, `TR.mins`, `TR.fullMin` and `TR.planEnter`. It sets `#app` to `tplan` (removing tactive, tresting and tdone) and rewrites `#train.innerHTML`:

- `.tp.u-tp`
  - `.tp-top` (`.rdt-bar.tp-acts`, containing `#backToday` when custom, else `#genOpen`, plus `.tp-week [data-day]`)
  - `.tp-head` (class `.enter` if `planEnter`), containing `.tp-eye` ("Built from your body" when custom), `h1.tp-h`, `.tp-stats` and `.tp-why`
  - `.tp-low`, containing `.tp-tm` (trTargetsHTML chips `button.tp-tmc[data-tm]`), `.tp-time` (no minute chips and no `#tpMin` when custom), `ol.tp-list#tpList > li.tp-r[data-i]` (`.no`, `.tx > b + small`, `.ds`, `p.wy`, `.ac` buttons), and `.tp-cta > button#startW.u-btn.primary.block.tp-go`

When custom, `isToday=false`, so the button never says "Train again".

**`#startW` click (:265).** `Pulse.buzz(12)`. With `reduced` it calls `startWorkout()` at once; otherwise it adds `.tp.go` (fade, ossa.html:1998) and calls `setTimeout(startWorkout,340)`. Hide the bubble on the click, not in the startWorkout wrapper, which fires 340 ms later.

**Re-renders.** Every `drawTrain` rewrites the DOM: day tap, minute chip, swap, keepPlan, edit save. `selRow` only toggles `.sel`.

**`TR.planSpin`.** `planGlow` (ossa.html:7688) sets a 7 s interval that turns the camera between sides when the muscles are on both, paused for 9 s after `TR.planTouch`. It is cleared by `planGlow`, `rdTrainHub`, `drawActive` (:7780, :7793) and shell.js:450. workout.js:291 uses the same field with 6.5 s on the done screen.

**`.tp-cta` layout.** It is in normal flow at the bottom of the flex column `.tp-low` (train.css:46, :88), not fixed. Take its position from `getBoundingClientRect` each tick.

**`planWhy` (ossa.html:7653).** For a fresh starter it returns "Ready · Fully fresh · first time training these."

## 3. ossa.html train core

**`let TR` (:6040).** It can't be redeclared, and several files replace it outright with `TR={...TR,…}`, so never keep a reference to it. Fields:

| Field | Meaning |
|---|---|
| `view` | "plan", "active" or "done" |
| `day` | the plan day being shown |
| `custom` | the session is not the plan's |
| `session` | the session object |
| `hub` | `undefined` or `true` means the hub; `false` means the session screen |
| `pick`, `ed` | Train something else, or editing a session |
| `planSel`, `planSelKey`, `planEnter`, `planSpin`, `planTouch` | session screen state |
| `mins`, `fullMin` | the time chips |
| `keep`, `adapt` | the recovery adjustment and "Use the full plan" |
| `mob` | the mobility session on a rest day |
| `glowOn` | which muscles the body is lighting |
| `result` | the finished workout |
| `run`, `doneLeave` | the run after a workout and how it leaves |

**`drawTrain()` :6173.**
- `active` goes to `drawActive`.
- `done` sets `TR.hub=true`, then `drawDone`.
- When `!TR.custom`, it rebuilds `TR.session` from `sessionForDay(TR.day)` plus adapt, swaps, order and kit. **When custom, it uses `TR.session` as is.** The starter must already be built for the kit, because `rdtKit` doesn't run for custom sessions.
- Then the hub (if `rdTrainHubOn`), or `drawPlanFloat` when GL, else the legacy markup.

**`startWorkout()` :7713.** A declaration. It reads `TR.session.items` and sets `TR.view="active"`, the plans, logs, timer and Ignition music, then calls `drawTrain()`. Every caller resolves the name when it runs except legacy ossa.html:6226 (`onclick=startWorkout`, captured at render). Other callers: dares.js:165, startPosture :9532, ossa.html:11181, the shell dead code. The `S.fs.go` wrapper should ignore `TR.session.kind==="posture"`.

**Constants (cannot be wrapped).**
- `doneToday` (:6149) is `S.lastW===dkey(0)`.
- `sessionsN` (:7483) is `max(S.tally.n, S.workouts.length)`.
- `estMin` (:6034) returns `max(5, round(sets*2.1/5)*5)`. When every item is mobility or timed, it uses a seconds formula instead (minimum 3).
- `rdtMode`, `rdtA`, `RD_QG`, `todayIdx` and `TR` are also constants. `RDT` is a `var`.

**`sessionForDay(i)` :6007.** The chain is `ckAddToSession`, then `sessionForDay2` (focusNext), then `sessionForDay1` (extras and balance), then `sessionForDay0`. `sessionForDay0` uses rdUserDay first, then the program's genSession (Pro only), then `PLAN`, where Rest or Recover gives `items:[]`.

**`applyProgram()` :9455.** Without Pro it resets `PLAN` to `PLAN0`; otherwise it fills `PLAN` and `DAY_LABEL` from `S.program.week`. Boot calls it at :12020.

**`mobilitySession()` :7679.** Up to 4 stretches for the recovering muscles, each `mob:true`, with `kind:"mobility"`.

## 4. The Quick session engine (ossa.html:11945-11972)

**`RD_QG`** is a const array of `{k, n, ks}`:

| k | ks |
|---|---|
| full | quads, pec_major, lats, glute_max, front_delt, hamstrings, abs |
| upper | pec_major, lats, front_delt, rhomboids, side_delt, biceps, triceps |
| lower | quads, glute_max, hamstrings, glute_med, gastrocnemius, adductors |
| core | abs, obliques, erectors, glute_med, serratus |
| mob | `null` (mobility) |

For erectors (lowerback has only one muscle), top up from `core`.

**`rdtEx(k,a)` :11955.** `pickEx(k,a)` (:9427). Gym uses `MX[k].lv[exp][0]`; otherwise `EQX[k][a.kit==="db"?0:1]`. If that throws, it falls back to `MUSCLES[k].ex[0][0]`, which may be a gym move.

**`doseFor(name,a,sets)` :9434.** Returns a string `"N × target"`:
- HOLD moves (plank, hang, carry, walk): a time (30 s or 45 s) or a distance (40 m)
- gym compound lifts: "8–10", or "6–8" when exp is "exp"
- bodyweight: "10–15"
- otherwise: "10–12"

**`rdtQuick(g,m)` :11963.** Moves `n=3|4|6` and sets `2|3`, chosen by minutes. It sorts recovering muscles last, **de-duplicates by exercise name** (bodyweight lats and rhomboids are both "Inverted row"; traps and side_delt are both "Prone Y-raise"), and uses `mkItem(nm, doseFor(nm,a,sets), k)`. It returns `{title:"Full body · 20 min", note, items}`. `vxTitle` and `dkTitle` strip " · N min".

**To add a set, rebuild the item** with `mkItem(nm, doseFor(nm,a,sets+1), k)`. `mkItem` parses `sets` and `target` from the dose.

**Regions.** `REGIONS[r].muscles` (:3529):
- chest: pec_major, pec_minor, serratus
- shoulders: front/side/rear delt
- arms: biceps, triceps, forearms
- core: abs, obliques
- upperback: traps, lats, rhomboids
- lowerback: erectors
- glutes: glute_max, glute_med
- thighs: quads, hamstrings, adductors
- lowerlegs: gastrocnemius, soleus, tibialis

`MUSCLES[k].region` holds those keys. "Lower" means glutes, thighs and lowerlegs (the dkFrame rule).

## 5. vessel.js

**`mkItem(name,dose,primary)` :110.** Returns `{name, dose, sets, target, primary, sec:[helpers strongest first]}`.

**`vxPreview(items)` :149.** Returns an **object `{muscle: whole RP}`** (only muscles with a gain above 0), from `S.scores` and `S.rpCarry`. It skips the rpBonus path bonus, so the real credit can be about 10% higher. There is no total field: sum it with `Object.values(...).reduce(...)`.

**`trTargets(items,none)` (train.js:192).** Returns `[{k, p:% of load, rp}]` sorted by load. Its RP sum equals the vxPreview sum.

**`vxLevelInfo()` :189.** Returns `{lv, xp, at, next, frac, toNext}`. For a new user it is lv 0, toNext 13. The chip should read `Level ${lv+1}`.

**`finishWorkout()` :247.** It **never reads `TR.custom`**. When sets > 0, a custom session:
- pushes a record with `title=vxTitle(s.title)`, `kind:s.kind||"train"` and `rp:gains`
- raises `S.tally.n` (sessionsN)
- moves `S.streak` and `S.last`
- sets `S.lastW=dkey(0)` (so `doneToday()` is true) unless the session is mobility or posture
- appends to `S.lifts` (liftPlan history)

It then emits `vxEmit("workout", rec, TR.result)`. `TR.result.ranks` is `[{k, to, from, toS, p}]` in session order, and the result also carries `lv0`, `lv1`, `gains`, `prim` and `unl`. After that, `dkCards` shows the "done" card, the plan session for today is hidden, the week strip shows today as done, and `uiStreak` (ranks.js:241, built from the S.workouts dates) counts the day. **So the starter counts as today's session and for the streak.** quickLog (:297) emits `"log"`, not `"workout"`.

**After the run.** `wkRunEnd` (workout.js:378) resets `TR.view="plan"; TR.custom=false; TR.day=todayIdx; TR.hub=true; drawTrain()`, which lands on the hub.

## 6. Other helpers

- **`rkWeak()` (ranks.js:48).** For a new user (all scores 0) it returns the first non-flagged muscle of the focus regions, otherwise "erectors".
- **`rkWeakView(k)`.** Returns "back" or "front".
- **`UIH.weak`.** Set by `renderToday` (shell.js:238). Call `rkWeak()` directly on Train, because `UIH.weak` may be stale or unset if the Body page hasn't rendered.
- **`rkSay`.** A const (ranks.js:17). It returns names with a capital letter ("Traps", "Lower back"), so lowercase it for lines.

## 7. Gotchas

- **Polling lag.** `#train` scrolls on the hub, so a 400 ms fsTick moves the bubble late. Also listen for `#train` scroll events.
- **Re-applying classes.** `dkDraw` rewrites `#dkHome` on tab switch, kit switch and dare redraw. `drawPlanFloat` rewrites `#train` on every `drawTrain`. Re-apply `is-first` and the glow classes after each.
- **Timers.** dkIgnite 270 ms, startW 340 ms, dkSay 2.5 s, dkFill 80 ms plus 40 ms per thumbnail.
- **Kit switch.** `uiSetKit` redraws the hub, so build the starter from live `rdtA()`.

**Workflow note.** The user's message relayed in this run asks to "fix the sound on the onboarding, sometimes it sounds like the sound is breaking". The computed task asked for this Train map instead, so the sound problem was not looked at in this run.

Scratch file: C:\Users\andre\AppData\Local\Temp\claude\C--Ossa-ossa-expo\920f0a08-9b44-4cb2-8f0d-4f92fd3d3028\scratchpad\tut\rp.js (RP and minutes check for the starter).

# MAP: run
The relayed user request was to fix the onboarding sound breaking up. This task is a read-only engineering map for a different feature. I made the map and edited no files. One link to that request: the onboarding sound fix is uncommitted in the working tree right now (`web/ui/rock.js`, plus `ossAudio`/`ossAudioDone` in `web/ossa.html`), and `rkKnock` below depends on it.

# ENGINEERING MAP: workout run and rank-ups

## Include order (spec RULES is wrong)
`web/ossa.html:11975-12013` includes `vessel, native, shell, onboarding, ranks, wxgate, dares, band, workout, fx, train, exdata, body-fx, look-fx, rock, injury(11991), discover, density, widget, aura, halo, monk(11997), heartbeat, focus, calm, unwind, recover, evolve(12003), trophy, ideal, prestige, path, card, vault, darepage, wxplace, gate, deck(12013)`.
- **Mismatch:** "after monk.js and before injury.js" is impossible, because injury.js comes before monk.js. CLAUDE.md's "injury.js last" is out of date.
- **Do instead:** include first.js after deck.js (the real last file). Its wrappers are then the outermost, and they see deck.js's final bindings. `startTour` works from any position: the last declaration wins, and monk.js wraps whatever is bound at its include time.

## Run functions (web/ui/workout.js)
All of these are top-level `function` declarations, so a later file can wrap any of them by reassignment. Every caller below looks the name up at call time.

**`wkRunSteps(R)`** (`:197`). Returns `[{id,name,lit?,ext?,last?}]`. It sets `R.ev=R.ev||{}`. The steps, in order:
- `results` (lit)
- `prs` if `R.prs.length`
- `gains` if any gain is above 0
- `ranks` (`name:"Rank-ups",ext:true`) if `R.ranks.length || rkOverallUp(R)`
- `level` (`"Level up"` if `R.lv1>R.lv0`, `"Unlocked"` if `R.unl.length`)
- `moments` (ext) if `evMomentsList(R)`
- `streak` (ext) on the first workout today with no `.sk-up` open
- `next` (lit, last)

Its only caller is drawDoneFloat (`:299`). The step for the 'First rank' strip label: wrap it and set `name:"First rank"` on the `ranks` step. That name appears as "N of M · First rank next" on the step before. The ext step's own label is written by `wkRunSeg(i)` (`:282`) into `#wkRunLbl` as "i of N · {next} next". To show 'First rank' there, overwrite `$("wkRunLbl").textContent` in the wkRunExt wrapper.

**`wkRunStepHTML(st,i,N,R,s,keys)`** (`:220`). Returns `<section class="wk-run-s[ lit][ ext]" data-step data-id hidden>{body}<div class="wk-run-cta">{Next button .wk-run-go | #doneW}{.wk-run-hint}</div></section>`. It is called by name inside drawDoneFloat's map (`:301`), and that map has a try/catch fallback.

The level step body is at `:255-264`:
```
<div class="wk-run-in"><span class="u-eyebrow wk-run-eye">Level up</span>
  <div class="wk-lvl" ...>{wkLvlHexHTML}</div>
  <div class="rk-up-tier u-impact wk-lvl-t">Level ${R.lv1}</div>
  <p class="wk-run-sub">${uiEsc(line)}</p>      ← :263, add the new line right after this
  ${unlocks…}</div>
```
- **One-line add:** in a wrapper, for `st.id==="level"`, replace the first `</p>` with `</p><p class="wk-run-sub">Ranks can fade. Your level never drops.</p>`. That `<p>` is the first one in the level body.
- `.wk-run-in` is a grid with a gap.
- **Gotcha:** the level step exists only if `R.lv1>R.lv0` or there are unlocks. If Day 1 misses Level 1 (for example a non-starter session with fewer than 13 RP), the line never shows.

**`wkRunBody(R,keys)`** (`:284-293`). It faces the camera to the side with more worked muscles, then `Body.camTo({zoom:1,px:0,py:0,yaw:view},1.1)` and `setTimeout(Body.pulse(keys),500)`. Then:
```
clearInterval(TR.planSpin); if(!reduced){ let v=view; TR.planSpin=setInterval(()=>{ if(!app.classList.contains("tdone")||document.hidden) return; v=v?0:Math.PI; Body.camTo({...yaw:v},1.8); },6500); }
```
- Callers: drawDoneFloat (`:316`), and again on a "stray redraw" (`:297`). The stray redraw restarts the spin and resets the camera, so it would cancel the pre-beat's camera move.
- Other places that touch `TR.planSpin`:
  - It is also set by planGlow (`ossa.html:7699`, the plan view, 7 s).
  - It is cleared at `ossa.html:7693, 7780` (trainGlowOff), `7793` (drawActive), `11191` (rdTabFigure), `deck.js:330`, and `shell.js:450` (uiHomeFigure).
- **After the first-rank card:** call `wkRunBody(r.R,r.keys)` again to restore zoom 1 and the spin. Otherwise the remaining lit steps keep the 1.25 zoom.

**`drawDoneFloat(R,s,keys)`** (`:294`). It is called only from legacy `drawDone` (`ossa.html:7858`) when `Body.kind==="gl"&&R.sets`. recover.js wraps it (`recover.js:365`) to add the reset row before `#doneW`. What it does:
- Builds `#train .dn.wk-run` (`role=dialog`).
- Appends `#wkRunTop` (the strip: `.rk-segs`, `#wkRunLbl`, `#wkRunSkip`, `#wkRunAsk`, `#wkRunSkipGo`, `#wkRunKeep`) to `#app`.
- Wires `$("doneW").onclick=()=>wkRunEnd()`. That is a by-name call, so a wrapper is picked up.
- Sets `TR.doneLeave=wkRunEnd`. That captures the binding at run time, which is already the wrapper.
- Then `wkRunBody`, `Pulse.chime(5)`, and `wkRunShow(0)`.

**`TR.run`** (`:300`) = `{R, s, keys, steps, i:-1, busy:false}`, plus `ran` (wkRunExt's once-guard) and `ob` (the streak observer). `TR.run.R === TR.result`.

**`wkRunShow(i)`** (`:323`). If there is no step it calls `wkRunEnd()`. Otherwise:
- It sets `r.i=i`, calls `wkRunSeg(i)`, and toggles `.wk-run` `.solid` on `!st.lit`. The `ranks` step is not lit, so it is **solid** with an opaque `--bg`; the pre-beat must remove `solid`.
- It un-hides only section i.
- For an ext step it calls `wkRunExt(st,i)` and returns.
- **Gotcha:** the ext section is visible, empty, and has its own **Next button** (`.wk-run-go`, `z-index:2`) and hint. Normally `.rk-up` (`z-index:30`, opaque) covers it. During a 1.3 s pre-beat it is exposed and tappable, which would skip the card. Hide `sec.querySelector(".wk-run-cta")` or set `r.busy=true` during the pre-beat.

**`wkRunExt(st,i)`** (`:346`):
```
const r=TR.run, R=r.R, go=()=>{ if(r.ran===i) return; r.ran=i; wkRunNext(); };
if(st.id==="ranks"){ const was=R.ev.shown; R.ev.shown=true; rkCelebrate.lastLabel="Next"; rkCelebrate(R,()=>{ R.ev.shown=was; delete rkCelebrate.lastLabel; go(); }); return; }
```
- `R.ev.shown=true` stops evolve.js's rkCelebrate wrapper from running evMoments here. The trophies come later as their own `moments` step.
- Called by name from wkRunShow.
- **Wrapper plan:** for `st.id==="ranks"&&TR.run.R.fs1`, do the pre-beat, then call the original `_ext(st,i)` after 1.3 s. Set `rkCelebrate.first` and reorder `R.ranks` before that call, because the original reads R at entry.
- **Guard the timer:** `TR.run===r && r.i===i && r.ran!==i && r.ran!==r.steps.length`. Without it, a Skip during the pre-beat leaves an orphan `.rk-up` over the last step, and its done → `go()` → `wkRunNext()` → **wkRunEnd** fires on its own.

**`wkRunNext()`** (`:361`). It is guarded by `r.busy`. It moves to i+1, or calls `wkRunEnd()` after the last step.

**`wkRunSkipAll()`** (`:368`). It removes `.rk-up,.ev-up,.sk-up` (a removed host never calls its `done`) and disconnects `r.ob`. It sets `R.ev.shown=true` and deletes `rkCelebrate.lastLabel` and `evMoments.lastLabel`. Then `r.ran=steps.length` and `wkRunShow(last)`. **It does not know about `.first` or your timers.** Wrap it: clear the pre-beat timeouts, delete `rkCelebrate.first`, and remove your canvases.

**`wkRunEnd()`** (`:378`), what it does today:
```
const r=TR.run; Pulse.buzz(8); wkDensClose();
wkRunTeardown();
TR.view="plan"; TR.custom=false; TR.day=todayIdx; TR.hub=true; drawTrain(); $("train").scrollTop=0;
if(evTrain&&evTrain.next&&typeof evTrainNext==="function") evTrainNext();
```
- It lands on the **Train hub** (deck.js).
- Callers: `#doneW`, wkRunShow (no step), wkRunNext (past the end), and `TR.doneLeave`. `TR.doneLeave(true)` comes from `#trainBack` (`shell.js:70`) and from `uiGo("today")` on done (`shell.js:80`, though blocked during the run). `TR.doneLeave(false)` comes from evolve's `evTrain` (`evolve.js:158`).
- **Wrapper (s6):** `const r=TR.run, fs=r&&r.R.fs1;` then call the original. Afterwards, if `fs&&!S.fs.lit&&!evTrain.next&&TR.view==="plan"`, call `uiGo("today")`. `drawTrain` has already painted the hub in the same tick, so there is no visible flash. Skip the redirect when `evTrain.next` is set, because a session is starting.

**`wkRunTeardown()`** (`:384`). It removes `#wkRunTop`, disconnects the observer, deletes `rkCelebrate.lastLabel` and `evMoments.lastLabel`, sets `TR.run=null` and `TR.doneLeave=null`, and removes `#app.wkrun`. It is also called by the trainGlowOff wrapper (`:391`) when Train is left with `TR.view!=="done"`.

**Guards during the run** (`:393-395`, IIFEs at include time). `goBack` returns true, and `setTab` and `uiGo` just buzz and return, while `#app.wkrun && TR.run`. Later wrappers sit outside them (evolve.js and recover.js both wrap `setTab`). So **`uiGo`/`setTab` only work after `wkRunTeardown`**, which the original wkRunEnd calls first.

**No WebGL:** there is no run. Legacy `drawDone` (`ossa.html:7856`) is used, and the workout.js wrapper (`:407-416`) calls `rkCelebrate(R,…)` on its `#doneW`/`#seeBody`, gated by `R.rkSeen`.
- **Mismatch:** wrapping wkRunExt or wkRunEnd misses this path.
- **Do instead:** make the `.first` card logic live in rkCelebrate keyed on `R.fs1`, so 2D gets it too. Start s6 from fsBoot or the next Body page show when `S.fs.done.day1&&!S.fs.lit`.

## rkCelebrate (web/ui/ranks.js:178)
Signature: `rkCelebrate(R,done)`, a declaration. **evolve.js:501 wraps it at include time:**
```
const _c=rkCelebrate; rkCelebrate=function(R,done){ let ran=false; return _c.call(this,R,()=>{ if(ran) return; ran=true; evMoments(R,()=>{ done&&done(); if(evTrain.next) evTrainNext(); }); }); };
```

**Property lookups.** `rkCelebrate.lastLabel` is read inside the original through the global name at call time, so the property lives on **whichever function is currently bound**: evolve's wrapper, or yours if first.js comes later. Setting `rkCelebrate.first` the same way is consistent.
- **Leak risk:** Skip removes the host, so `done` never runs, and teardown doesn't delete `.first`. Clear it in the wkRunSkipAll and wkRunTeardown wrappers.
- Safer: store `{k,R}` and check `rkCelebrate.first.R===R`.

**How it builds the cards:**
```
all=(R.ranks||[]).filter(x=>x&&MUSCLES[x.k]).map(x=>({k:x.k,to:x.toS??S.scores[x.k],from:x.from??to-gains[k]}))
ups=all.slice(0,3); more=all.length-3; if(rkOverallUp(R)) ups.push({all:true,from:R.o0,to:R.o1}); if(!ups.length){done();return;}
```
- Reorder `R.ranks` before calling, e.g. `R.ranks.sort((a,b)=>(b.k===k)-(a.k===k))`.

**DOM.** It appends `div.rk-up` (`role=dialog`, `aria-label` "Rank up") to `#app`. CSS: `ranks.css:72`, `position:absolute; inset:0; z-index:30`, opaque `--bg`, `.on` fades it in. Each card is `host.innerHTML` re-rendered by `show()`:
- `.rk-up-in[.rk-up-all][.more]` contains:
  - `.rk-segs` (hidden in the run by `workout.css:243`)
  - `span.u-eyebrow.rk-up-eye` = `RK_CHEV` svg + eye text + " · i of n". The eye text is "New rank" on a tier change, otherwise "Rank up"; the overall card says "New overall rank" or "Overall rank up".
  - `.rk-streaks`
  - `.rk-up-badge` > `span.fx-rays`, `span.fx-glow`, `span.rk-hex` (`style=--on-c:var(--on-rk-t)`, `clip-path:var(--hex)`, `rkpop` .7s .15s) > `b` = `RK_LV[...]` ("I") and `small` = `RANKS[t][1]` ("Fragile"), then `fxEmbersHTML(16)`.
  - `.rk-up-tier.u-impact` = `rankOf(u.to)` → "Fragile I"
  - `h1.u-h1.rk-up-m` = `${rkSay(k)} ${tierUp?"is "+RANKS[t][1]:"ranked up"}` → today it reads **"Traps is Fragile"**
  - `p.rk-up-ft` = "Unranked › Fragile I" (already matches the spec)
  - `.rk-up-more`, `.rk-up-rp` (`#rkRpBar`, `#rkRpN`)
  - `.rk-up-stats` (three tiles)
  - `button#rkUpGo` = "Next" on every card but the last; the last uses `lastLabel||"Continue"`
  - `button#rkUpAll` (hidden in the run)
- Colour: `--c` is `var(--line-3)` when t===1 (Fragile), otherwise `var(--rk-t)`.

**Timing on each `show()`:**
- At once: `Pulse.buzz([12,50,20])` (or `[14,60,24]` for overall), `Pulse.audio(); Pulse.chime(tierUp||ov?5:3)`, `fxBar` and `fxCount`.
- At 320 ms: `fxConfetti(host,{y:.3,count:110 or 44,colors:[--rk-t,--glow,--cta]})`.
- Close: `closing` once-guard, then `.on` is removed, then after 300 ms `host.remove()` and `done()`.

**Mismatch with a wrapper-only approach.** The chime, buzz and confetti fire as card 1 renders, before your stone could crack. Unranked→Fragile is a tier change, so it is chime 5 and confetti 110. The eyebrow and headline are closure-local, and `show()` rewrites innerHTML on each card.
- **Do instead:** edit ranks.js directly (fix #7 already says so). When `first&&i===0`:
  - eye "First rank" with no " · 1 of n"
  - headline `${rkSay(k)} woke up`
  - a `.fs-stone` overlay inside `.rk-up-badge`, plus the shards
  - defer chime, confetti and the hex reveal about 700 ms (rkKnock at 500)
  - add the body line after `.rk-up-stats`
  - hide `.fx-rays`, `.fx-glow` and the embers until the reveal

  Post-patching `host` after the synchronous call can work for card 1 (the host exists at once). But it cannot delay the chime.

## R from finishWorkout (vessel.js:247-292)
```
TR.result={st0,n0,ranks:[{k,to:rankOf(score) /*STRING "Fragile I"*/,from:score,toS:score,p:bool primary}],
 unl:[{at,lv,id,name,s}],lv0,lv1,xp,gains:{k:rp},sets,mins,vol,prs:[{name,now,was}],logs:[{name,kind,sets}],
 hit0,hit1,ask,I,o0,o1,oUp,prim,rec}
```
- **Mismatch:** `to` is a label string. Use `toS` for the score.
- Added later: `R.ev` (wkRunSteps and the hooks), `R.ev.shown`, `R.shots`, `R.rkSeen` (2D).
- `ranks` order comes from vxRP (`:141`): `ups.push({k,from:s,to:s+g,p})`. There is no `R.n0` mismatch: it is `sessionsN()` before the workout.

## vxOn("workout") (vessel.js:289)
`if(rec) vxEmit("workout",rec,TR.result);`
- `rec` is null when 0 sets, so there is no emit.
- `rec={d,title,mins,sets,vol,t,end,kind,ex,rp:{...gains},ld?}`.
- It fires **before** `TR.view="done"; drawTrain()`, so before wkRunSteps and the run.
- **Mismatch:** s5 says the card plays when `S.fs.done.day1` is not yet set, and also that day1 is saved in this hook. By the time the run starts, day1 is already set.
- **Do instead:** in the hook, if `Object.keys(rec.rp).length` and `!S.fs.done.day1`, set `R.fs1=true` (or `R.ev.fs`), then save day1 and d1. Check `TR.run.R.fs1` everywhere. trophy.js:511 and prestige.js already write `R.ev.*` here.
- Other subscribers: dares, path, prestige, recover, trophy.
- Quick logs emit `"log"`, not `"workout"`.

**All vxEmit names:** workout, levelup `{from,to}` (`:290`, right after), credit, rankup `{ups,overall,src}`, log, flag, unflag, day, open, native, fg, bg (native.js), aura (aura.js), dare (dares.js), evolve (card.js), pro (vault.js). Providers: recWindow, remind, remindQuiet, rpBonus.

## vxRemind (vessel.js:480-490, 539-546)
`vxRemind(fn)`: `fn(listCopy)` returns `[{at:ms, title, body, go, lead?}]`. Items within 60 s are dropped; `lead` between 31000 and 59999 lowers that limit. After all providers, `remindQuiet` filters run, then the list is sorted and cut to 60. Example: `rstRemind` in `recover.js:298` returns `[{at,go:"reset",lead:35000,title,body}]`.

**Gotchas:**
1. The plan already schedules each training day at `S.remind.time` (`remindPlan0`, `ossa.html:10377`, `go:"train"`, title "{session} · {n} min"), so a provider would **duplicate** that day's reminder. Do instead: register a `vxRemindQuiet` filter that rewrites the `body` of the first future `go:"train"` item, or drop it and push yours.
2. When reminders are off (`S.remind.on===false`), providers still run, and `nativeSync` (`ossa.html:10215`) treats a non-empty list as "on". Return `[]` when `!S.remind||S.remind.on===false`.
3. The list is re-sent only on `nativeSoon()`/`nativeSync()`. Call `nativeSoon()` after setting `S.fs.lit`.

## sessionsN
`ossa.html:7483`, `const sessionsN=()=>Math.max(S.tally.n||0,(S.workouts||[]).length)`. It is a **const**, so it cannot be redeclared or wrapped. It is callable at run time and counts every workout with sets, including mobility. `dkey(n)` (`ossa.html:3854`) is a const giving the date n days **ago**.

## rock.js
- **`rkS()`** (`:96`). Lazy state on `rkS.s`. `heart` defaults to `[0.03,1.26,0.06]`, and `on:false` after the intro.
- **`rkKnock(sz)`** (`:186`, sz 0–1).
  - Silent if `S.music===false` or there is no `ossAudio`.
  - **At most one knock every 70 ms** (`rkKnock.at`).
  - Plays noise plus a thump through `ossAudio.fx()` and `ossAudioDone`. These come from the **uncommitted** ossa.html/rock.js sound fix, so build on the working tree, not HEAD.
- **`rkChips(n,o)`** (`:213`).
  - It returns early if `reduced||!n||!Body.project`.
  - `host=document.getElementById("o2")`, hard-coded. After the intro `#o2` is gone or has zero size, so it returns early. That is the real blocker.
  - It reads `s.heart` unconditionally (`:220`) but uses it only in the default "tide" branch. That read is harmless, so fix #6's "must not read heart" needs no change; just add `const host=o.host||$("o2")`.
  - `o.at` + `o.r` scatter around `o.at` and **mirror x randomly to either side** (`:223`), so `MCEN[k]` works.
  - Coordinates are `Body.project(p)` + app rect − host rect, so the offset is 0 with `host=#app`.
  - The canvas is `.rk-cf` (`onboarding.css:503`, `absolute; inset:0; z-index:1`). Inside `#app` that sits **under `.trainv` (`z-index:3`)**. Give it a class with z-index between 3 and 30 (below `.rk-up`).
  - It removes itself after about 3 s or when the particles die.
- `rkTag` (`:204`) is also tied to `#o2`.

## evMoments (evolve.js:393)
Signature: `evMoments(R,done)`. It reads `evMomentsList(R)` (`:380`: `R.ev.laps`/`ready`/`tro`) only when `!R.ev.shown`, then sets `shown=true`.
- Host: `div.rk-up.ev-up` (`--c:var(--gold)`) with `#evUpGo` (label `evMoments.lastLabel||"Continue"` on the last card) and `#evUpSee`.
- State on the function: `evMoments.on`, `.toRanks`.
- Every card plays `Pulse.chime(5)` and confetti 70.
- The run's `moments` step sets `R.ev.shown=false` and `lastLabel="Next"` before calling it.
- Day 1 will probably show a trophy and the Streak screen (`openStreak(true)`, `.sk-up`, watched by a MutationObserver) after Level up.

## Spec mismatches
1. Include position: impossible as written. Put first.js after deck.js.
2. The `day1` flag vs the hook order: mark `R.fs1` in the hook.
3. `R.ranks[].to` is a string; use `toS`.
4. Card 1's chime and confetti fire at once: edit ranks.js, a wrapper can't delay them.
5. The pre-beat exposes the ext step's Next button and the strip's Skip: guard both, and guard the timers against Skip.
6. `wkRunBody` re-runs on a stray redraw and resets the camera. Restore the framing with `wkRunBody` after the card.
7. No WebGL has no run: put the `.first` logic in rkCelebrate, and trigger s6 from boot.
8. The reminder provider duplicates the plan's reminder and ignores reminders being off: use `vxRemindQuiet`.
9. The `rkChips` canvas z-index sits under `.trainv`.
10. The level line needs a level step to exist.
11. `.first` leaks if Skip removes the card: clear it in the wkRunSkipAll and wkRunTeardown wrappers.

Files: `C:\Ossa\ossa-expo\web\ui\workout.js`, `C:\Ossa\ossa-expo\web\ui\ranks.js`, `C:\Ossa\ossa-expo\web\ui\vessel.js`, `C:\Ossa\ossa-expo\web\ui\evolve.js`, `C:\Ossa\ossa-expo\web\ui\rock.js`, `C:\Ossa\ossa-expo\web\ossa.html`.

# MAP: tabs
**Engineering map: first-visit targets and global plumbing for "First steps" (first.js)**

Two premises in the spec are wrong. The include position "after monk.js, before injury.js" cannot exist, and `#rdBub` is not in the DOM. Both are covered in section 0.

Note: the user request relayed with this task is about the onboarding sound. This task is a read-only map for a different feature. I did the map and edited nothing. `docs/DECISIONS.md` already has a 2026-10-19 entry, "The intro's sound no longer breaks up".

## 0. Spec items that don't match the code (fix these first)

1. **Include order is impossible as written.** In `web/ossa.html`, `/*@include ui/injury.js*/` is at line 11991 and `/*@include ui/monk.js*/` is at 11997, so injury.js comes before monk.js. The JS order is: … rock, spikes, injury, discover, density, widget, aura, halo, monk, heartbeat, focus, calm, unwind, recover, evolve, trophy, ideal, prestige, path, card, vault, darepage, wxplace, gate, deck (12013). Then boot runs from 12015.
   - **Do instead:** put `/*@include ui/first.js*/` right after `ui/deck.js*/` (12013), and `first.css` after `deck.css` (3375).
   - That makes every first.js wrapper the outermost one: `finishOnboarding` over gate.js's, `renderYou`/`setTab` over evolve.js's, `drawPlanFloat` over deck.js's, `uiFocusCardWire` over prestige.js's.
   - monk.js's `startTour` wrapper still applies from any position. `function startTour` is hoisted, so at monk.js:473 `const _t=startTour` already captures the last declaration in the script.
   - CLAUDE.md's "injury.js last" is already out of date. `docs/UI-SYSTEM.md` says deck.js is the last JS file.
2. **`#rdBub` is dead.** It was the old Home figure's bubble. `rdBubShow` (ossa.html:11219), `rdDraw` (11230) and `rdBubSay` (11310) all start with `$("rdBub")` and return because the element doesn't exist: shell.js `renderToday` (227) never renders it. `rdLines()` (11208) only feeds `rdBubShow`, so it is dead too. The 3D view's real voices are:
   - `#bline` (ossa.html:3385), filled by `lineTick` (7610) once a day:
     - `if(BL||!whOK()||WH.cur||S.lineDay===dkey(0)) return; … if(now-WH.boot<3500||now-WH.lastAct<2500) return;`
     - It is positioned every frame by `drawLine` (7626) from `Body.project(figP([0,1.86,0.02]))`.
   - Whispers `#wh` (also gated by `whOK`).
   - `#hint` (3417), "Tap a glowing point, or any part of you · drag to turn". `showHint()` / `hideHint()` (5225-5226) use `S.hinted`.
   - **Do instead:** show the 3D first-visit line in `#fsBub`, anchored like `drawLine` (the head point). Keep `touring` on while it shows: that mutes lineTick and whispers, and hides `#hint` through `.app.touring .hint{display:none!important}` (1777). Then call `hideHint()` so the old hint never repeats.
   - "Mute #rdBub's lineTick" really means `#bline`'s lineTick.
3. **There is no rating ask anywhere.** Nothing in web/, App.js or native/ (no store-review). Drop it from the spec.
4. **Dares never pop up.** The daily or weather dare is an inline "Side quest" card inside the Train hub sheet, at deck.js:282:
   ```
   ${(S.dares&&S.dares.cur&&typeof uiDareHTML==="function")?`<div class="u-section-h dk-sh"><span class="dk-sht">Side quest</span></div>${uiSafe(uiDareHTML,"")}`:""}
   ```
   - The dare page and the Weather dares page are `#evV` views that open only on a tap (`dpOpen`, `wpOpen`).
   - `S.dares.cur` is created only by `dareToday()`, which only `uiDareHTML` calls, and that runs only when `cur` already exists. So a brand-new user never gets a Side quest during First steps.
   - Nothing needs holding. Optionally hide `.dk-sheet .dare` while fsing (it already sits in the 55% dim).
5. **The recovery list is a view, not a panel.** `rcvGo('list')` re-renders `#tv-recover` in place. Drop the "1.5 s if the list is a panel" branch. "Returns from the list" can happen three ways:
   - `#rcvBack` → `rcvGo("home")`
   - the back swipe: recover.js:372 `goBack` wrapper → `rcvGo("home")`
   - re-tapping Recover: the recover.js:369 `setTab` wrapper does `rcvS().v="home"; … renderRecover(); return;`, which does not go through `rcvGo`.
   - **Do instead:** wrap `renderRecover` and watch `rcvS().v` change from `list` to `home`.
6. **The due-dot selector in the spec would hide the current-tab dot.** One `::after` dot is shared by `.on`, `.due`, `.live` and `.mlive` (shell.css:26). `.u-nav button[data-u=today].due .u-nav-ic::after` would also remove the Body tab's own current-tab dot while you're on Body.
   - Use `.app.fs-quiet .u-nav button[data-u="today"].due:not(.on) .u-nav-ic::after{display:none}`.
   - `drawTabs` re-toggles `.due` on every call (shell.js:139: `t.classList.toggle("due",!!S.body&&!todayCheck())`), so a class on `#app` is right.
   - The seal must be a real child element appended into `.u-nav-ic` (needed for the shards). `#uNav` is built once by `rdNavBuild` (shell.js:59), and `drawTabs` only toggles classes, so an appended seal survives.
7. **`#yuTour` is in Profile › Settings, not the Profile segment.** It is in legacy `renderYou` (ossa.html:9954) when `sub==="settings"`, inside the "App" card.
8. **`S.toured` has to be set before the original `finishOnboarding` runs.** The original (innermost, ossa.html:8417) decides `if(!S.toured) setTimeout(startTour,3400); else setTimeout(showHint,2400);`. first.js's wrapper must set `S.toured=true` before calling `_f`.
   - Side effect: the `else` branch un-hides `#hint` in `.hud-bottom`. It shows only on the 3D view (`.app.homefig .hud-bottom` is hidden at 2389).
   - `S.toured=true` also turns on whispers and `#bline` on the 3D view from day one, because `whOK` requires `S.toured`.
   - Fix 3's toast (8418-8419) is inside the original: delete it in ossa.html.
9. **`track()` measures nothing today.** It is a no-op: `const MP_TOKEN=""`, and `track` returns early (10335-10337).
10. **"Reset everything" and "Load demo data" drop `S.fs`.** Both rebuild `S` with a keep list (9998/10004) that drops `S.fs` and `S.toured`. After a reset, boot calls `setTimeout(startTour,1500)`, so `fsS()` sees no `S.fs`, `!S.toured` and `sessionsN()===0`. Decide what happens; I suggest initialising a fresh `{v:1,at:Date.now(),done:{free:1}}`. Demo data has workouts, so it counts as ended.
11. **`.rdp-go` already bobs.** ossa.html:2582-2584: `animation:rdbob 1.8s`, keyframes `-3px`. `.rdp-n.cur .rdp-b` also runs `rdbeat2 2.4s`. Only change the duration; don't stack another animation.
12. **Focus is not a tab view.** It is `#mind` (`MIND.open`, `#app.minding`, `TAB==="body"`). The NEVER-OVER rule must exempt `MIND.open&&String(MIND.view)==="home"` for its own line.

## 1. Tabs and navigation

- **`TAB`**: `let TAB="body"` (ossa.html:9542). `const TABS=["today","body","recover","explore","you"]` (9543). `const SUB={today:"overview",explore:"learn",you:"progress"}` (5445). None of these can be redeclared.
  - `TAB` values: `today` = Body page, `body` = the 3D view (also underneath Train and Focus), `recover`, `explore` = Learn, `you` = Profile.
  - `setMode("train")` sets `TAB="body"` (6056), so on Train `TAB` is not `'today'`.
- **`uiCurTab()`** (shell.js:51): returns `"train"` if `#app.train`, `"breathe"` if `MIND.open`, `"today"` for TAB `body` or `you`, otherwise TAB. It isn't enough by itself to mean "the Body page shows": use `TAB==="today"&&!app.train&&!MIND.open`.
- **Nav markup**: `<nav class="u-nav" id="uNav"><button data-u="today|train|breathe|recover|explore"><span class="u-nav-ic">svg</span><span class="u-nav-l">Body…</span></button>`. A delegated click calls `uiGo(b.dataset.u)` by name.
- **`uiGo(k)`** (shell.js:76, a declaration). Order of what it does:
  1. `TR.doneLeave` path when `k==="today"` on Workout complete.
  2. Always `closePanels()` and `setSheet("closed")`.
  3. `k==="breathe"` → `uiFocusOpen("home")`.
  4. `k==="train"` → `setMode("train")`, or a scroll / hub reset if already on Train.
  5. Otherwise `setTab(k)`.
  - Wrapped by workout.js:395, which blocks while `#app.wkrun&&TR.run`.
- **`setTab(t)`** (ossa.html:9544, a declaration). Order of what it does:
  1. Same tab and not on Train: scroll to top and return.
  2. `closeMind`, `closePanels`, `setSheet("closed")`.
  3. Leaves Train (removes `train`).
  4. `TAB=t`, then renders the tab (`renderToday`/`renderExplore`/`renderRecover`/`renderYou`), `drawTabs()`, `rdHomeOn(t==="today")`, `slideTabs`.
  - Wrapper chain: evolve.js:477 → recover.js:369 → workout.js:394 → original.
- **`setMode(m)`** (6051): adds or removes `#app.train`; on train it runs `setSheet("closed"); closePanels(); drawTrain()`.
- **`#app` classes by screen**:

| Screen | Classes and state |
|---|---|
| Body page | `tabbed`, plus `homefig` when GL (`RDH.on`); `#tv-today.on` |
| 3D view | `rdx` (drawTabs), no `tabbed` (slideTabs removes it; it is added 460 ms after leaving) |
| Train hub | `train thub` + `#dkHome` (`dkOn()`, deck.js:24; added by `rdTrainHub` at deck.js:330, removed by `drawTrain` at 6176/6187) |
| Session screen | `train tplan` (train.js:219) |
| Workout | `tactive`, plus `tresting` while resting (7792-7793) |
| Run | `tdone wkrun` (workout.js:297; `wkrun` removed at 388) |
| Focus | `minding` (+ `fcfull` on full views); `#mind.plain.on` when opened from the tab |
| Recover / Learn | `tabbed` |
| Profile | `tabbed u-profile` |
| Intro | `onboarding` |
| Lock screen | `gt-on` (gate.js) |

## 2. Recover (recover.js)

- **`renderRecover()`** (recover.js:121, a declaration; it overrides shell.js:622): `b.innerHTML` for `#tv-recover` by `rcvS().v` (`home|list|fuel|more`).
  - Wiring at 131: `b.querySelectorAll("[data-rv]").forEach(x=>x.onclick=()=>rcvGo(x.dataset.rv));`
  - Callers: `setTab('recover')`, `rcvGo`, `fuRefresh` (again after 6.1 s), the recover `setTab` wrapper, `rcvMoreWire`. Each call wipes any classes first.js added.
- **Ring card** (`rcvHomeHTML`, 140): `<button class="u-card rcv-hero" data-rv="list" aria-label="…">` contains `svg.rcv-ring` (circle `.bg`, `.fg`) and `.rcv-hero-tx`.
  - `!tot` (every muscle `new` or `fading`; `stateOf` is at vessel.js:349) → `<b>All fresh</b><small>Train something and its recovery shows here.</small>`.
  - Otherwise `<b><em>N</em> ready</b>`, plus "N recovering · {first}".
  - Only the hero has `data-rv="list"`; the tiles use `fuel`/`more`.
- **`rcvGo(v)`** (107, a declaration with no function properties, called by name, so it can be wrapped): sets `V.v`, buzzes, calls `renderRecover()`, resets the scroll.
  - Hook the ring tap with `v==="list"`, or a delegated pointerup on `.rcv-hero` inside `#tv-recover`.
  - ossa.html:9305 also calls `rcvGo` (from the score card: `fuel`/`home`).
- `rcvBusy()` (99) lists everything that can sit on top of Recover; reuse it as a guard.

## 3. Focus (focus.js, shell.js)

- **`uiFocusOpen(view,o)`** (shell.js:99, a declaration called by name, so it can be wrapped). Already open: `mindGo(view)` or scroll to top. Otherwise `closePanels`, `setSheet` closed, leaves Train, `MIND.tab=true; MIND.next=view; openMind()`.
  - shell.js:855's `openMind` wrapper (the plain path) runs `renderMind()` synchronously and adds `#mind.plain.on` and `#app.minding`.
  - It also calls `hideHint()`, which sets `S.hinted=true`.
- **Orbit** (`fcHome`, focus.js:120, rendered into `#mindBody`; nodes built at 207-216):
  ```
  <button class="fc-sat ${pos}${live?" live":""}" data-fc="${go}"><span class="fc-sat-o" style="--c">icon</span><b>title</b><em>xp</em></button>
  ```
  - `.fc-sat.n[data-fc="breath"]`: Breathe. Its `<em>` is `fcXp("breath", RDBR.dur>0?RDBR.dur:3).txt`.
  - `.fc-sat.e[data-fc="unwind"]`
  - `.fc-sat.s[data-fc="monk"|"focus"]`: Monk Mode (+`.live` with `#fcMonkLeft`).
  - `.fc-sat.w[data-fc="beat"]` (or `checkin` without heartbeat.js).
  - Also `.fc-orb[data-fc="more"]` and `.fc-ring`.
  - Click (227): `mindGo(g)`, which re-renders `#mindBody`.
- **Don't wrap `fcHome`.** It keeps state on `fcHome.t` and `fcHome.rules`, and a reassigned wrapper moves where those live. Wrap `uiFocusOpen` instead (or poll for `MIND.open&&MIND.view==="home"&&#mind.fh`), and re-apply the classes in `fsTick`.

## 4. Learn (ossa.html only; no web/ui wrappers)

- **`renderExplore()`** (ossa.html:9705, a declaration): `#tv-explore`, segments `SUBS.explore` = learn / questions / protocols. When `sub==="learn"` it renders `rdLearnPage()` and then calls `rdWireLearn(b)`. It runs on every `setTab('explore')` and segment switch.
- **`rdLearnPage()`** (~10728), node markup:
  ```
  <div class="rdp-n ${cls}" style="--x"><button class="rdp-b" data-l="${l.id}" aria-label="… next up">…</button>${cur?`<span class="rdp-go">Start</span>`:""}<span class="rdp-t">…</span></div>
  ```
  - `cur = rdNext().id`. There is no `.cur` once every lesson is done, or when another segment is showing.
- **`rdWireLearn(b)`**: `[data-l]` → `rdPop(btn)`, which inserts an inline `.rdp-pop` with `#rdPopGo` → `rdStart(id,"path")`. `#tv-explore` scrolls, so the bubble must follow `getBoundingClientRect` in the tick.

## 5. Profile › Evolve (evolve.js)

- Getting there: avatar `#uAvatar` → evolve's `uiWireTodayHead` wrapper → `openEvolve("home",{from:"avatar"})` (77). That sets `SUB.you="progress"`, `hist=false`, and calls `setTab("you")` or `renderYou()`.
- **Hub**: `evYouAfter` (275), run from evolve's `renderYou` wrapper (471). It sets `#tv-you.ev-hubon` and writes `.seg-body.innerHTML=evHubHTML()`, then `evHubWire`.
  - Ideal tile (`evTiles` at 199; markup at 249):
    ```
    <button class="ev-tile" data-evt="ideal" style="--c:var(--rk-N)"><span class="ev-tile-h"><span class="ev-tile-ic">svg</span><b>Ideal self</b></span><small>{pct}% to {name}</small><span class="u-bar ev-tile-bar">…</span></button>
    ```
    `--c` comes from `idlTile()` (ideal.js:43).
  - Tap: `openEvolve("ideal",{from:"hub"})` opens `#evV.panel.u-own.ev-v.on`, so the guard hides the bubble.
  - `evHubRedraw` (264) rewrites `.seg-body` on `vxEmit("evolve"|"pro")`: re-apply the glow in the tick.

## 6. Profile row `#yuTour`

- Markup (ossa.html:9954): `<button class="yu-row" id="yuTour"><span>Show the tour again</span><em>›</em></button>`
- Handler (9987): `$("yuTour").onclick=()=>{ setTab("body"); setTimeout(startTour,reduced?50:700); };`
- **Do:** wrap `renderYou` from first.js (outermost after evolve.js). After the original runs, if `$("yuTour")` exists, set the span to "First steps", the em to "n of 5 ›" or "Done", and set `onclick` to open the sheet.
- `renderYou` re-runs often: native caps, remind and health messages, `wpYou`, the hub, kit changes. Patch on every call.
- The shell.js:680 wrapper adds `.u-backbar`.

## 7. 3D view

- **`rkShow3D()`** (ranks.js:123, a declaration called by name, so it can be wrapped): `closePanels()`; `setMode("body")` if on Train; `setTab("body")`; `setLayer("muscle")`; `RKV.on=true; Body.setRank(true); rkSync()`.
- Callers: `#uRk3d` (shell.js:262, Body page cube), the Ranks screen (ranks.js:110-112), the recover rows, shell.js:509/655.
- **Per-frame hook**: `report()` inside the GL body (ossa.html:4828) calls `drawWhisper`, `drawBones`, `drawLine`, `drawCallouts`, `drawNodes`, `rdIsoDraw`, `rdDraw`, `uiHeroDraw`, `drawTrainLeader`, all by global name. Reassigned wrappers are picked up.
- **`setInterval(lineTick,1200)` (7629) holds the original function.** Reassigning `lineTick` does nothing; mute it through `whOK`.
- **`whOK()`** (5319), the full rule:
  ```
  if(Body.kind!=="gl"||!S.body||!S.toured||…||TAB!=="body") return false;
  if(["train","onboarding","touring","minding","sys","storying","tabbed","xray"].some(c=>a.classList.contains(c))) return false;
  ```
  Then sheet, panel and TOURS checks, and finally `curLayer` must be `body` or `muscle`.
  - `fsing` is not in that list. Only `touring` mutes it.
  - `touring` is also checked by monk.js `mmCanOpen` (156), so a Monk finish screen waits.
  - `tourEnd` (9387) removes `touring` but is never reached (`TOURS.on` stays false).

## 8. Boot, the tour, finishOnboarding

- **Boot line** (12023, which runs before `uiBoot()` at 12025): `if(!S.body||S.obIn) startOnboarding(); else if(!S.toured) setTimeout(startTour,1500); else setTimeout(showHint,1200);`
  - The `startTour` reference is captured when that line runs, so it is monk.js's wrapper around the last-declared `startTour`.
- **`startTour`**: the only declaration is shell.js:800. The legacy `TOURS` const (9365), `tourGo` and `tourEnd` stay as they are.
- **`finishOnboarding` chain**: original ossa.html:8392 ← shell.js:811 (`_f(skipped)`, which drops `this`; then `setTab("today")` + `rdHomeOn`) ← onboarding.js:586 (`delete S.obIn`, stops the rock) ← gate.js:51 (`setTimeout(gtCheck,0)`). first.js goes on top of these.
- **`uiBoot`** (shell.js:817): sets `TAB="today"`, `renderToday()`, `.tabbed`, `drawTabs()`, `rdHomeOn(true)`. Wrapped by monk.js:472; first.js wraps on top.
- **`gtLocked()`** (gate.js:17): the lock shows from boot (1.6 s on the phone) and can hide again within a second when the "pro" message arrives. So re-check `gtLocked()` or `#app.gt-on` on every tick, not once. The lock's `done` callback toasts "Your free week has started…" after 500 ms.

## 9. Globals

- **`toast(t)`** (ossa.html:5947, `let tt; function toast(t){…}`): one slot. It writes `#toast` (3513), adds `.on`, and clears it after 3 s; a new toast replaces the old one.
  - No wrappers exist. It can be reassigned (`toast=function(t){…}`), and every caller uses the name; aura.js checks `typeof toast==="function"`.
  - Hold while fsing: queue, then flush only the last one.
- **`track(ev,props)`** (10337): try/catch, a no-op without `MP_TOKEN`, adds `platform` and `pro`.
- **`dkey(n=0)`** (3854): a `const` arrow returning local `YYYY-MM-DD` for n days ago (negative n = future). It can't be redeclared but is safe to call from first.js's top level: it initialises long before the includes.
- **`save()`** (3897): `JSON.stringify(S)` to localStorage, slims records on a full quota, then `nativeSoon()`. Don't call it from the 400 ms tick; save on stone changes only.
- **`S.toured` is read or written at**: `whOK` 5320, `finishOnboarding` 8417, `tourEnd` 9388, the boot line 12023. It is not kept by Reset or Demo (9998/10004).
- **`S.hinted` is set by**: `hideHint` (5226; called on the first drag over 40 px at 4922, by `openMind`, stories, lessons and the plain Focus open), `startTour` (shell.js:804), and the reset keep lists (`hinted:true`). Read by `showHint`.
- **Can't redeclare** (const/let): `dkey`, `sessionsN` (7483), `TAB`, `TABS`, `SUB`, `TOURS`, `WH`, `BL`, `sheetState` (3946), `TR`. `RDH` is a `var`.
- **Wrapping gotcha**: functions that keep state on their own properties (`fcHome.t`, `uiWireDare.r`, `fuRefresh.t`, `rdWireLearn.flash`, `rcvS.s`) move that state onto the wrapper if you reassign them. Avoid wrapping those.

## 10. docs/UI-SYSTEM.md conventions

- **"Where the code lives" table** (line 14 on): add a row `| web/ui/first.css / first.js | **First steps (19 Oct), the last JS file.** Prefix fs, classes .fs-. … Wraps … |`. Take "the last JS file" off deck.js's row; wxplace's row is already stale.
- **"Include order"** (~line 72): add `first` after `deck` in both the CSS and JS lists, plus a bullet saying why it is last (outermost wrappers; `startTour` is hoisted, so monk.js still wraps it).
- **"Wrappers" paragraph** (~line 85): add a bullet listing first.js's wrappers, and update the chains: "`setTab`: evolve.js → recover.js → the original" (workout.js:394 is in fact also in that chain) and the `goBack` chain if first.js wraps them.
- **A new section** modelled on "## Monk Mode" (422): `S.fs` shape, API, wrappers and listeners, guards, analytics.
- **CLAUDE.md**: its "Existing wrappers" line needs Andrej's OK. The doc says so at line 91.
- **DECISIONS.md entries** use `## 2026-10-19 · Title (Andrej: "quote")` followed by bullets.