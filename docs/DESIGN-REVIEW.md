# DESIGN REVIEW: Existing muscle/region sheet (`web/ossa.html`)

Reviewer: Theo (Design) · 2026-10-04 · Scope: the sheet that already exists (CSS lines 93–145 and 1365–1400, render logic lines 4413–4533). This replaces the "new screen" idea in `DESIGN.md`. That doc specced something Ossa already has, and the real sheet is richer: Learn / Train / Recover tabs, a recovery ring, quick-log, demos and form cues. My job now is to tidy what's there, not to rebuild it.

Contrast figures are measured against the sheet surface `--surface #0A0B0D`.

---

## Issues

### 1. One state, three words, and "Fresh" means two opposite things
- **Area:** Status copy (header line, Recover card, top HUD line)
- **Problem:** `stateOf()` (2720) returns `new / fading / recovering / ready`, but each surface uses its own words for those states:
  - **Never trained:** the header says "Unexplored · you haven't trained this yet" (4092). The Recover card says **"Fresh** · Nothing to recover from yet" (4332, and 4466 for regions). So you see two labels for one state on the same sheet.
  - **Recovered:** the HUD live line says "Legs recovering · **fresh by tonight**" (3874), so there "fresh" means *recovered and ready*.
  - **Fading:** the header says "Neglected" (4093) and the Recover card says "Ready". Both are true, but "Neglected" is a guilt word that our voice rules ban.

  At 7am, "Fresh" on a never-trained muscle followed by "fresh by tonight" on a recovering one tells the user that a word means opposite things depending on where it appears.
- **Suggested fix:** Keep Andrej's three labels and give each one exactly one meaning. **Fresh = never trained** (the code's current meaning, and the only one that isn't harmful), plus **Recovering** and **Ready**. Then:
  - (a) Change 3874 to "ready by tonight / tomorrow / {weekday}".
  - (b) Change 4092 to "Fresh · you haven't trained this yet".
  - (c) Change 4093 to a neutral word ("Ready · last trained 9 days ago"), or a 4th label Andrej signs off. `fading` can stay an internal state.
  - (d) Put the label strings in one map keyed by `stateOf()` so they can't drift apart again.
- **Severity:** must-fix · **Effort:** S

### 2. The whole sheet is an `aria-live` region
- **Area:** VoiceOver
- **Problem:** `<aside class="sheet" id="sheet" aria-live="polite">` (2252). `renderSheet()` replaces all of `#shIn`'s innerHTML on every tab tap, quick-log and region→muscle hop (4479). So VoiceOver re-reads the whole sheet each time: name, score, rank, both buttons, tabs and the full body text.
- **Suggested fix:** Remove `aria-live` from `.sheet`. Add one small visually hidden live region that announces only what changed ("Recover tab", "Bench press logged, chest plus 3"; the toast at 4611 could serve as that region). When the sheet opens, move focus to the `h3`.
- **Severity:** must-fix · **Effort:** S

### 3. Tap targets under 44px, worst on the two buttons you hit most
- **Area:** Train tab rows, breadcrumb, tabs
- **Problem:**
  - `.play` and `.done` are **30×30** (887, 156) and sit side by side in each exercise row (4445–4446). A thumb aiming for "watch" can easily hit "log".
  - The back breadcrumb `‹ Chest` is bare 10.5px text with no padding (100, 4424).
  - Tabs are about 29px tall (`padding:8px 0` at 10.5px, 1366).
  - Teammate `.lnk` links are inline words (4453).
- **Suggested fix:** Keep the 30px circles visually, but give each button a 44×44 hit area (padding or a `::before` inset) and at least 8px between play and done. Give the crumb `min-height:44px; padding-right:12px`. Make tabs `min-height:44px`. Give inline links `padding:10px 0` (line height can stay).
- **Severity:** must-fix · **Effort:** S

### 4. One-tap quick-log has no undo
- **Area:** Train tab, the `+` button
- **Problem:** `quickLog()` (4488) writes the score, the load log, the streak and `S.done` straight away. The button then disables itself (4446), and the toast disappears after 3s with no action (4611). Combined with issue 3, a mis-tap makes a fake session that also changes recovery for the muscle and its secondaries (4492). The user can't take it back.
- **Suggested fix:** Add an "Undo" action to the toast (about 5s) that restores the snapshot from before the log. Alternatively, make the logged check tappable again to un-log today's entry. Undo is better than a confirm dialog because it doesn't slow the happy path.
- **Severity:** must-fix · **Effort:** M

### 5. Low-contrast labels and control edges
- **Area:** Contrast
- **Problem:**
  - Inactive tab labels `#6E747C` = **4.17:1** at 10.5px uppercase mono (1366). That fails AA 4.5:1 for small text, and these are the main way around the sheet.
  - The `.ex .lvl` "Beginner / Intermediate / Advanced" label uses the same colour at **9.5px** (1390).
  - The edges of `.play` / `.done` and the grab handle are `#33373E` = **1.65:1** (887, 156, 97). Non-text UI needs 3:1, so on a dim phone the log button looks like a ghost.
- **Suggested fix:** Inactive tabs and `.lvl` → `var(--dim)` `#80868F` (5.37:1). Set a floor of 11px for any mono caption. Control borders and the grab handle → `#5A6069` or lighter (≥3:1). The look stays dark and calm. This only stops it disappearing.
- **Severity:** must-fix · **Effort:** S

### 6. "Can I train this?" is the smallest text in the header
- **Area:** Status clarity, peek state
- **Problem:** In the head (4425–4427), the biggest element is the 40px score with its rank. The answer people open the sheet for at 7am is the `wkInfo` line ("Recovering · 62% recovered, ready tomorrow"), and that's 11px mono (330). Then the peek row always offers **"Train this muscle"** as the primary button (4478), even when the line above says it's recovering.
- **Suggested fix:** Raise `wkInfo` to body size (about 14px, regular, still state-coloured, word first). When `stateOf` is `recovering`, swap the peek primary to "See recovery" (opening the Recover tab) and demote "Train anyway" to the secondary button. The score stays where it is.
- **Severity:** nice-to-have · **Effort:** M

### 7. Tabs and form cues are only half-built for VoiceOver
- **Area:** Semantics
- **Problem:**
  - `role="tablist"/"tab"` with `aria-selected` (4440), but there's no `role="tabpanel"`, no `aria-controls` and no arrow-key handling. VoiceOver says "tab" and then the content isn't linked to it.
  - The form cues show their meaning through a CSS glyph and colour only (`.cue.ok::before "✓"` green and `.cue.no::before "✕"` red, 1394). VoiceOver reads these glyphs inconsistently ("multiplication x") or skips them, so "do" and "don't" sound the same.
- **Suggested fix:** Give `.sh-body` `role="tabpanel"` and `aria-labelledby` pointing at the active tab, and add left/right arrow handling. Split Form into two small sub-heads, **"Do"** and **"Avoid"**, and keep the glyphs as `aria-hidden` decoration.
- **Severity:** nice-to-have · **Effort:** S

### 8. Food details live in a hover tooltip
- **Area:** Recover tab, Fuel
- **Problem:** `<span class="pk" title="${f[1]}">` (4473). The second line of each food pick sits only in `title`, and phones never show it. So on mobile, half of that content can't be reached.
- **Suggested fix:** Render it as the `.food` pattern that already exists (130–132): name in bold with the detail line underneath. Or make the chip a button that expands inline.
- **Severity:** nice-to-have · **Effort:** S

*Noticed but not counted:* the sheet CSS uses about nine raw font sizes (10.5 to 15px) even though a type scale already exists at 1446 (`--t-xs … --t-2xl`). That's worth a tidy-up pass later, but users won't feel it.

---

## Don't break these

1. **One status function everywhere.** The sheet header, Recover card, HUD line and coach all read `stateOf()` / `recoveredPct()` (2716–2720) with the same 90% threshold. That's exactly the "never disagree" guarantee from DECISIONS.md, and it's already built. Fix 1 is a copy change only. It must not fork the logic.
2. **The smart default tab plus the peek.** A first visit opens Learn, a recovering muscle opens Recover, and anything else opens Train (3819). The peek shows the name, status and one primary action without needing a scroll. That's the right shape for a 7am glance.
3. **Status is never colour alone, and time is in human words.** Every status line leads with a word, and the Recover ring pairs a % with "Ready tomorrow" / "later today" (4331–4336, 2721). Never-trained shows "–" rather than a fake 0% (4468). Global reduced-motion (2030) and the honest "not medical advice / sharp pain isn't soreness" footers (4457, 4476) belong in the same category.

From my old DESIGN.md, the 3-segment meter and the sheet layout are **superseded**. The ring does the job better. Still worth keeping: the "Last trained: Today / Yesterday, never '0 days ago'" rule (already met by `agoText`, 2722), and "anything that looks tappable must do something".

---

## Note to Maya

Maya, we specced a screen that already existed, and the real one is better than ours. Let's shelf DESIGN.md §3 and treat this review as the backlog. Issues 1–5 are small and must-fix, with undo (4) the only M.
Please take one call to Andrej: "Fresh" stays, but it can only mean one thing. I'm proposing **Fresh = never trained** (what the code already does) and fixing the "fresh by tonight" line. He also needs to say whether "fading" gets its own label or just reads as Ready.
Everything else I can hand straight to Raj as copy and CSS tweaks. No new screens, no new tokens.
