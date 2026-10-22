**Ossa icon research: three concepts (sources: ScreensDesign market data and 26 store icons)**

**What I looked at.** I pulled 26 store icons through ScreensDesign and viewed each at 100, 60 and 29 px on a dark home-screen colour. That was 18 fitness and gamified apps (Opal, Hevy, Strava, Gentler Streak, Bevel, Ladder, Fitbod, Finch, GymStreak, Liftoff, Symmetry, Muscle Booster, Stoic, Arise, Life Reset, Gravl, Boostcamp, Push Up Arena) and 8 3D anatomy apps. Future isn't in the ScreensDesign catalogue. ScreensDesign never returned a conversation_id, so the calls ran one at a time.

**Findings**
1. **One solid glyph wins.** Every top earner uses one flat or slightly bevelled glyph on a single-colour ground. Examples: Hevy (white chain "H" on black), Strava (white chevron on orange, est. $18M a month), Symmetry (white extruded S on near-black), Opal (chrome ring on black), Life Reset (white half-sun on black), Stoic ("S." on white). These stay crisp at 29 px. Their marks fill about 45–60% of the canvas, and strokes are at least about 60 px on 1024.
2. **Lime as a background is taken.** Ladder (est. $7M a month) uses a lime fill with a black mark, and Gravl uses a lime fill with a navy G. A lime-filled Ossa icon would look like Ladder's.
   - Ladder: https://media.screensdesign.com/appicon-thumbs/1f1ff6e8ead941358186a92f91aa1813.webp
   - Gravl: https://media.screensdesign.com/appicon-thumbs/e76a4aa4324443c8bd82c0af0d9a5a3a.webp
3. **Black is crowded, but only with white glyphs.** Opal, Hevy, Symmetry, Muscle Booster, Arise and Life Reset all put a white or chrome glyph on black. None puts a lime glyph on black. **Lime light on black is free, and it is Ossa's own colour pair.**
4. **Hexes.** Fitbod uses a white hex-like "F" on pink-red (https://media.screensdesign.com/appicon-thumbs/83183e37cb46444caf52e610d2b37ef5.webp). Arise, the closest RPG-fitness rival, uses a blue shard and white bars on black (https://media.screensdesign.com/appicon-thumbs/ca263f5bdd8f413493f74778231c8974.webp). A solid stone hex lit with lime doesn't clash with either.
5. **Bodies and figures.** Only the anatomy apps show a body (Complete Anatomy, Human Anatomy Atlas, Easy Anatomy and others). They are realistic skinned heads and torsos that turn into red blobs at 29 px and look medical. No top fitness earner shows a human figure. The mascots (GymStreak, Finch, Liftoff) are busy at small sizes and only work because of their colour.
6. **Subtle depth reads as premium.** Symmetry's extrusion, Bevel's bevelled D and Opal's chrome add depth without adding detail.
7. **The current Ossa icon** (`C:\Ossa\ossa-expo\assets\icon.png`) has 10–12 px strokes, which become about 0.6 px at 60 px. At 29 px it is a grey dot and reads as a lamp or a target.

**Rules for all three concepts:** 1024×1024, no text, no transparency, no baked-in corners. Background #000 with a radial gradient centred at (512,470), radius 560, from #17181A to #000, so the icon doesn't look like a hole in dark mode. Nothing thinner than 36 px. Keep everything within about 820 px of the canvas because of the iOS corner mask. Also export dark and tinted variants: a lime-on-black glyph converts cleanly to greyscale.

---

### 1. "Breakout Hex" (recommended)

**Hex.** It uses the app's own `--hex` shape, `polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)`, in a 620 box centred on the canvas. Vertices: (512,202) (822,357) (822,667) (512,822) (202,667) (202,357).

**Stone.** A top-to-bottom gradient: #6E6E72 → #46464A at 45% → #2A2A2E. Add an 8 px inner rim light (#9A9A9E, 60% opacity) on the two upper-left edges and an 8 px #0E0E10 inner shadow on the lower edges. Optional grain: feTurbulence with baseFrequency 0.85, at 5% opacity.

**Crack.** It runs from the top vertex to the bottom vertex, unevenly so it doesn't look like a lightning bolt: `M512 202 L556 318 L494 420 L578 532 L500 648 L548 744 L512 822`. Split the hex along this path and move the halves 14 px left and 14 px right, which opens a 28 px gap.
- Fill the gap with #D4FF00, with a 10 px core line of #F6FFD0 down the middle.
- Glow: the same path stroked 110 px wide in #D4FF00, Gaussian blur 32, opacity 0.55.
- Inner edges: each half's cut edge gets a lime spill, a linear gradient from #D4FF00 at 35% to 0 over 70 px.

**What it says.** Your rank emblem (the hex from Level and rank-up) splitting open with light inside. It is the "Out of the Stone" onboarding in one mark.

**Why it reads small.** It is one silhouette with three values: black ground, mid-grey stone and a bright lime split. At 29 px it reads as a grey hex with a lime line, and it is the only lime-on-black icon in the category.

**Risks**
- "Cracked" next to "Ossa" (bones) could suggest a fracture or injury. Keep the glow strong and the halves clearly pulled apart (opening, not breaking). Never put red near it.
- The crack can look like a lightning bolt, so keep the segments uneven.
- The hex form is close to Fitbod's, but the colour and fill differ.

---

### 2. "First Form" (a figure set into the hex)

**Hex.** Same hex and stone as concept 1, with no split.

**Figure.** One solid shape cut into the stone and filled with light. The arms sit close to the body so the outline stays one piece.
- Head: a circle at (512,330), radius 44.
- Neck: 36 wide at y 374.
- Shoulders: from (414,404) to (610,404), with rounded caps of radius 30.
- Arms: the outer edges fall to the hands at (400,600) and (624,600).
- Waist: from 470 to 554 at y 590.
- Legs: a 20 px gap starting at y 610. Each leg is 44 px wide at the top and 34 px at the feet, ending at (468,770) and (556,770).
- Total height: 286 to 770 px (47% of the canvas).

**Light.** The fill is a gradient from #ECFF7A to #D4FF00 to #A8CC00 (top to bottom), with a #D4FF00 outer glow (blur 24, 60%) spilling onto the stone. Add three 10 px hairline cracks (#D4FF00 at 50%) running from the shoulders and hips into the stone. These show at large sizes only.

**What it says.** Your body, the character, lit from inside the stone, inside its rank badge. Of the three, it is the most literal "body as a character".

**Why it reads small.** One shape in lime on grey, about 14 px tall at 29 px.

**Risks**
- It can read as a generic person pictogram: a toilet sign, accessibility, a contacts app, or a keyhole.
- Figure icons tend to look cheap in this category, which is why no top earner uses one.
- The arms blur together below 60 px.

---

### 3. "Stone Torso"

**Shape.** A classical statue torso with no head and no arms, centred.
- Shoulder line: y 270, from x 252 to 772, with deltoid caps of radius 64.
- It tapers to the waist: x 380–644 at y 760.
- The bottom is cut flat at y 800, like a plinth.

**Stone.** A gradient from #7A7A7E to #3C3C40, with a 10 px rim light (#A4A4A8) along the left shoulder and flank.

**Lime seams.** These are the onboarding's "cracks where you trained". All are #D4FF00, 30 px wide, with a 90 px glow (blur 26, 50%).
- Breastbone: from (512,300) to (512,780).
- Two lower-chest curves: `M300 452 Q410 500 512 474` and its mirror.
- One short branch across the stomach: from (512,610) to (566,650).

**What it says.** The statue body opening along its muscles.

**Why it reads small.** A broad grey shape with a lime Y. It reads as a torso at 60 px and as a crest at 29 px.

**Risks**
- It can look like a security or shield app, or a superhero crest.
- Bodybuilding torsos are a supplement and gym-app cliché.
- A headless torso looks odd to some people.
- Its Y is busier than concept 1's single line.

---

**Ranking**
1. **Breakout Hex.** The sharpest at 29 px, it owns lime-on-black, and it ties to the rank hex and the stone onboarding. It is closest to how the top earners build their icons.
2. **First Form.** It shows the body, but risks looking like a pictogram. It could work as an alternate icon or the splash screen.
3. **Stone Torso.** Strong in story, but it risks reading as a cliché or a shield.

Draw all three and compare them at 60 and 29 px on both a light and a dark wallpaper before choosing.