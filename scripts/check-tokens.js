// Keeps the new UI layer on the design system.
// Fails if a raw colour or a px font size appears in web/ui/ outside tokens.css.
// Pillar and finding colours that are data (passed as --c into a component) live in JS as named values
// and are allowed only where marked with a trailing  // token-ok  comment.
// Also reports how many raw colours the legacy CSS in web/ossa.html still has, as a number to bring down.
// Run: node scripts/check-tokens.js
const fs = require("fs");
const path = require("path");
const UI = path.join(__dirname, "..", "web", "ui");

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const RGB = /\brgba?\(\s*\d/g;
const FONT_PX = /font-size\s*:\s*\d+(\.\d+)?px/g;

let bad = 0;
for (const f of fs.readdirSync(UI)) {
  if (f === "tokens.css" || !/\.(css|js)$/.test(f)) continue;
  const lines = fs.readFileSync(path.join(UI, f), "utf8").split("\n");
  lines.forEach((line, i) => {
    if (/token-ok/.test(line)) return;
    const code = line.replace(/\/\*.*?\*\//g, "");
    const hits = [...(code.match(HEX) || []), ...(code.match(FONT_PX) || [])];
    // translucent black and white overlays (glass, shadows) are allowed; colours are not
    const rgb = (code.match(/\brgba?\([^)]*\)/g) || []).filter(c => !/^rgba?\(\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\b/.test(c));
    for (const h of [...hits, ...rgb]) { console.log(`web/ui/${f}:${i + 1}  ${h}`); bad++; }
  });
}

const legacy = fs.readFileSync(path.join(__dirname, "..", "web", "ossa.html"), "utf8");
const css = legacy.slice(0, legacy.indexOf("</style>"));
const legacyHex = new Set((css.match(HEX) || []).map(h => h.toUpperCase())).size;
const legacyPx = new Set((css.match(FONT_PX) || []).map(s => s.replace(/\s/g, ""))).size;

console.log(`legacy CSS in ossa.html: ${legacyHex} distinct hex colours, ${legacyPx} distinct px font sizes (bring these down over time)`);
if (bad) { console.log(`\n${bad} value(s) in web/ui/ bypass the tokens. Use a token from web/ui/tokens.css.`); process.exit(1); }
console.log("web/ui/: every colour and font size comes from tokens.css");
