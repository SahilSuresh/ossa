# Ossa 2.0 designs (reference only)

These are 26 screens Andrej made in Screens Design for the "Body as a Character" redesign.

- `images/` shows what each screen looks like.
- `screens/` holds each mock-up as Tailwind HTML. Its images load from media.screensdesign.com.
- `manifest.json` lists all 26.

Read `docs/REDESIGN-BRIEF.md` first. It holds the brief, the ground rules that override these designs, and how each screen maps onto the existing code. In short:

- Keep Ossa's own 3D body. The renders here are mood references.
- Build in the app's token system (`web/ui/tokens.css`), not Tailwind.
- `clan_vessel` and `mirror_match` are dropped for now (no accounts).
- Any health-sounding number becomes real logged data with a game name.
