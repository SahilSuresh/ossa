// Ossa icon, "Breakout Hex" polished after the judge's notes. node gen-final.js
// Writes final.svg (iOS master, opaque), final-fg.svg (Android adaptive foreground, transparent)
// and final-mono.svg (Android themed icon, white on transparent).
const fs = require("fs"), path = require("path");
const OUT = __dirname; const SX = 0.87; const NM = "reg";
const P = {
  dx: 34,        // each half moves this far out: a 68 px gap
  oy: 9,         // the right half also rides up a little, so the halves read as pulled apart
  bevel: 40,     // chamfer on the outer edges
  depth: 18,     // slab thickness under the bottom edges
  cut: 13,       // the cut face (the stone's thickness) shown along each split edge
  lime: 50,      // width of the lit body inside the gap
  core: 28,      // width of the pale core
  // the split: steep and calm, every segment ~100 px tall, drift within +-28 px of the centre, turns under ~16 deg
  crack: [[512,202],[528,300],[540,398],[524,500],[530,604],[506,712],[512,822]],
};
const H = [[512,202],[822,357],[822,667],[512,822],[202,667],[202,357]].map(([x,y])=>[512+(x-512)*0.87*1.06,512+(y-512)*1.06]); // the app's --hex: t tr br b bl tl
const f = n => +n.toFixed(1);
const sx = a => a.map(([x, y]) => [512 + (x - 512) * SX * 1.06, 512 + (y - 512) * 1.06]);
const pts = a => a.map(p => p.map(f).join(",")).join(" ");
const mv = (a, dx, dy = 0) => a.map(([x, y]) => [x + dx, y + dy]);
const d = a => "M" + a.map(p => p.map(f).join(" ")).join(" L");
const FU = 'filterUnits="userSpaceOnUse" x="-200" y="-200" width="1424" height="1424"';

function inset(poly, w) { // offset a clockwise polygon inwards by w
  const n = poly.length, lines = [];
  for (let i = 0; i < n; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % n];
    const len = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
    lines.push([[x1 + nx * w, y1 + ny * w], [x2 + nx * w, y2 + ny * w]]);
  }
  const X = (a, b) => { const [[x1, y1], [x2, y2]] = a, [[x3, y3], [x4, y4]] = b;
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4), t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]; };
  return poly.map((_, i) => X(lines[(i - 1 + n) % n], lines[i]));
}

P.crack = P.crack.map(([x,y])=>[512+(x-512)*0.87*1.06,512+(y-512)*1.06]);
const c = P.crack, dx = P.dx, oy = P.oy;
const [t, tr, br, b, bl, tl] = H;
const L = [...c, bl, tl], R = [t, tr, br, b, ...c.slice().reverse().slice(1, -1)];
const off = { L: [-dx, 0], R: [dx, -oy] };
const Lm = mv(L, ...off.L), Rm = mv(R, ...off.R);           // the two halves in place
const cL = mv(c, ...off.L), cR = mv(c, ...off.R);            // their split edges
const mid = mv(c, 0, -oy / 2);                                // the centre line of the light
const gap = [...cR, ...cL.slice().reverse()];
const I = inset(H, P.bevel);
// bevel per outer edge (edge i runs H[i] -> H[i+1]); light from the upper left, warm bone highlight
const shade = ["rgba(163,160,154,.42)", "rgba(0,0,0,.30)", "rgba(24,24,26,.78)", "rgba(24,24,26,.70)", "rgba(163,160,154,.16)", "rgba(163,160,154,.80)"];
const bev = H.map((p, i) => ({ q: [p, H[(i + 1) % 6], I[(i + 1) % 6], I[i]], c: shade[i] }));
// faint carved planes on the face (+-4 % lightness, no lines), echoing the onboarding statue
const planes = [
  { q: sx([[202,357],[512,202],[470,470],[202,585]]), c: "rgba(255,255,255,.03)" },
  { q: sx([[202,585],[470,470],[512,822],[202,667]]), c: "rgba(0,0,0,.04)" },
  { q: sx([[512,202],[822,357],[822,500],[575,455]]), c: "rgba(255,255,255,.02)" },
  { q: sx([[575,455],[822,500],[822,667],[512,822]]), c: "rgba(0,0,0,.04)" },
];
// clip regions that split the slab along each half's own edge, so the bottom ends in two clean points
const extend = (e, side) => { const top = [e[0][0], -50], bot = [e[e.length - 1][0], 1100];
  return side === "L" ? [top, ...e, bot, [-50, 1100], [-50, -50]] : [top, ...e, bot, [1100, 1100], [1100, -50]]; };
const sideL = extend(cL, "L"), sideR = extend(cR, "R");

// Android: the solid glyph (halves + slab) must sit inside a circle of radius 300 around the centre
const solid = [...Lm, ...Rm, ...mv(Lm, 0, P.depth), ...mv(Rm, 0, P.depth)];
const rMax = Math.max(...solid.map(([x, y]) => Math.hypot(x - 512, y - 512)));
const S = 300 / rMax;
const fit = inner => `<g transform="translate(512 512) scale(${S.toFixed(4)}) translate(-512 -512)">${inner}</g>`;

const defs = `
  <defs>
    <radialGradient id="bg" cx="512" cy="470" r="560" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#161617"/><stop offset="1" stop-color="#000"/>
    </radialGradient>
    <linearGradient id="stone" x1="0" y1="202" x2="0" y2="822" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#77746F"/><stop offset=".45" stop-color="#4A4845"/><stop offset="1" stop-color="#2E2D2B"/>
    </linearGradient>
    <filter id="bloom" ${FU}><feGaussianBlur stdDeviation="32"/></filter>
    <filter id="tip" ${FU}><feGaussianBlur stdDeviation="26"/></filter>
    <filter id="spill" ${FU}><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="soft" ${FU}><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="core" ${FU}><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="drop" ${FU}><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="grain" ${FU}>
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="11"/><feColorMatrix type="saturate" values="0"/>
    </filter>
    <clipPath id="cL"><polygon points="${pts(L)}"/></clipPath>
    <clipPath id="cR"><polygon points="${pts(R)}"/></clipPath>
    <clipPath id="sL"><polygon points="${pts(sideL)}"/></clipPath>
    <clipPath id="sR"><polygon points="${pts(sideR)}"/></clipPath>
    <clipPath id="gp"><polygon points="${pts(gap)}"/></clipPath>
  </defs>`;

const half = s => {
  const poly = s === "L" ? L : R, [sx, sy] = off[s];
  return `
    <g transform="translate(${sx} ${sy})">
      <polygon points="${pts(poly)}" fill="url(#stone)"/>
      <g clip-path="url(#c${s})">
        ${planes.map(e => `<polygon points="${pts(e.q)}" fill="${e.c}"/>`).join("")}
        <rect x="${-sx}" y="${-sy}" width="1024" height="1024" filter="url(#grain)" opacity=".07"/>
        ${bev.map(e => `<polygon points="${pts(e.q)}" fill="${e.c}"/>`).join("")}
        <!-- lime spill on the face, gone within ~60 px of the split -->
        <path d="${d(c)}" fill="none" stroke="#D4FF00" stroke-width="40" stroke-linejoin="round" opacity=".40" filter="url(#spill)"/>
        <!-- the cut face: the stone's thickness, dark, lit by the light from the split -->
        <path d="${d(c)}" fill="none" stroke="#2B2A27" stroke-width="${P.cut * 2}" stroke-linejoin="round"/>
        <path d="${d(c)}" fill="none" stroke="#D4FF00" stroke-width="${P.cut * 2 - 4}" stroke-linejoin="round" opacity=".5" filter="url(#soft)"/>
        <path d="${d(c)}" fill="none" stroke="#D4FF00" stroke-width="${P.cut}" stroke-linejoin="round" opacity=".65" filter="url(#soft)"/>
      </g>
    </g>`;
};

const tipT = mid[0], tipB = mid[mid.length - 1];
const glyph = `
    <!-- shadow and slab thickness, each slab cut along its own half's edge -->
    <polygon points="${pts(mv(Lm, 0, 26))}" fill="#000" opacity=".8" filter="url(#drop)"/>
    <polygon points="${pts(mv(Rm, 0, 26))}" fill="#000" opacity=".8" filter="url(#drop)"/>
    <g clip-path="url(#sL)"><polygon points="${pts(mv(Lm, 0, P.depth))}" fill="#18181A"/></g>
    <g clip-path="url(#sR)"><polygon points="${pts(mv(Rm, 0, P.depth))}" fill="#18181A"/></g>
    <!-- the light coming out: bloom along the split and past both points -->
    <path d="${d(mid)}" fill="none" stroke="#D4FF00" stroke-width="150" stroke-linecap="round" stroke-linejoin="round" opacity=".5" filter="url(#bloom)"/>
    <ellipse cx="${f(tipT[0])}" cy="${f(tipT[1] + 4)}" rx="48" ry="62" fill="#D4FF00" opacity=".5" filter="url(#tip)"/>
    <ellipse cx="${f(tipB[0])}" cy="${f(tipB[1] + 4)}" rx="50" ry="66" fill="#D4FF00" opacity=".5" filter="url(#tip)"/>
    <!-- inside the gap: deep lime at the walls, the lit body, a pale core -->
    <polygon points="${pts(gap)}" fill="#8FB000"/>
    <g clip-path="url(#gp)">
      <path d="${d(mid)}" fill="none" stroke="#D4FF00" stroke-width="${P.lime}" stroke-linejoin="round" filter="url(#soft)"/>
      <path d="${d(mid)}" fill="none" stroke="#F6FFD0" stroke-width="${P.core}" stroke-linejoin="round" filter="url(#core)"/>
    </g>
    <path d="${d([[tipT[0], tipT[1] - 14], ...mid.slice(1, -1), [tipB[0], tipB[1] + 14]])}" fill="none" stroke="#F6FFD0" stroke-width="${P.core - 6}" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#core)"/>
    <!-- the two stone halves -->${half("L")}${half("R")}`;

const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${body}
</svg>
`;
const ios = svg(`${defs}
  <rect width="1024" height="1024" fill="url(#bg)"/>${glyph}`);
const fg = svg(`${defs}
  ${fit(glyph)}`);
const mono = svg(`
  ${fit(`<polygon points="${pts(Lm)}" fill="#FFFFFF"/><polygon points="${pts(Rm)}" fill="#FFFFFF"/>`)}`);

fs.writeFileSync(path.join(OUT, "reg.svg"), ios);
fs.writeFileSync(path.join(OUT, "reg-fg.svg"), fg);
fs.writeFileSync(path.join(OUT, "reg-mono.svg"), mono);
console.log(JSON.stringify({ scale: +S.toFixed(4), rMax: +rMax.toFixed(1) }));
