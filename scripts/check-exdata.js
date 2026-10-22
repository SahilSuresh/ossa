// Checks web/ui/exdata.js (exercise tags, job lines, set zones) against the live tables it mirrors.
// Read-only: it evaluates the tables from web/ossa.html, web/ui/train.js, web/ui/vessel.js and
// web/ui/ranks.js in a sandbox, loads exdata.js next to them, and writes nothing.
// Fails when:
//  - a movement name in any table or routine has no tag, or a tag names a movement nothing uses
//  - the listed set isn't exactly EXW + MX stretches + MX mobility drills (190), or the total isn't 211
//  - a kit tag differs from today's Home rule (EQX bodyweight column, or BW_EX minus trSessionFor's
//    kit regex, read from train.js; every no-RP move is home)
//  - a type tag disagrees with the engine (mobility = no rank points, vxIsStretch), apart from the
//    known gaps listed in KNOWN below, or the pattern isn't 'none' exactly for mobility
//  - a set that counts for a zoned muscle (weight 0.6 or more, slot credit included) has no zone
//  - a job line or zone label is missing, too long or not sentence case
//  - exdata.js has anything at the top level but function declarations, or declares a name that
//    web/ossa.html or another web/ui file already declares at the top level (ZONES, exKind, norm…)
// Run: node scripts/check-exdata.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.join(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");

/* the numbers Exercises is built on: change them on purpose, never to make the check pass */
const EXPECT = { listed: 190, total: 212 };   /* 22 Oct: +1 Pelvic tilt (routine-only, posture plan); 21 Oct: +20 chest library (docs/DECISIONS.md) */
/* type tags that knowingly disagree with the engine, with why (docs/BUGS.md) */
const KNOWN = {};   /* BUG-14 fixed 22 Oct: vxIsStretch falls back to exInfo */

let bad = 0;
const fail = m => { console.log("FAIL  " + m); bad++; };
const note = m => console.log("note  " + m);

/* ---------- read the sources (the two mesh lines are megabytes of base64: skip them) ---------- */
const html = read("web/ossa.html").split("\n").map(l => (l.length < 200000 ? l : "")).join("\n");
const trainJs = read("web/ui/train.js"), vesselJs = read("web/ui/vessel.js"), ranksJs = read("web/ui/ranks.js");
const exSrc = read("web/ui/exdata.js");

/* Bracket matching from src[i] (strings and comments skipped). toEnd=false: src[i] is an opening
   bracket, return up to its match. toEnd=true: return the expression up to a ; or line end at depth 0. */
function scan(src, i, toEnd) {
  let depth = 0;
  const start = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") { const q = c; i++; while (i < src.length && src[i] !== q) { if (src[i] === "\\") i++; i++; } continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; i--; continue; }
    if (c === "/" && src[i + 1] === "*") { i = src.indexOf("*/", i + 2) + 1; continue; }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") { depth--; if (depth === 0 && !toEnd) return src.slice(start, i + 1); }
    else if (toEnd && depth === 0 && (c === ";" || c === "\n")) return src.slice(start, i);
  }
  throw new Error("unterminated literal");
}
/* the value of a top-level `const NAME = …` */
function constOf(src, name) {
  const m = new RegExp("^const\\s+" + name + "\\s*=\\s*", "m").exec(src);
  if (!m) throw new Error("no `const " + name + "`");
  const at = m.index + m[0].length;
  return scan(src, at, !/[\[{]/.test(src[at]));
}
/* the whole `function NAME(…){…}` */
function fnOf(src, name) {
  const m = new RegExp("^function\\s+" + name + "\\s*\\(", "m").exec(src);
  if (!m) throw new Error("no `function " + name + "`");
  const paren = m.index + m[0].length - 1, body = src.indexOf("{", paren + scan(src, paren, false).length);
  return src.slice(m.index, body) + scan(src, body, false);
}

const ctx = { console };
vm.createContext(ctx);
const load = (code, what) => { try { vm.runInContext(code, ctx, { filename: what }); return true; } catch (e) { fail(`${what}: ${e.message}`); return false; } };
const TABLES = ["MUSCLES", "GLORDER", "MX", "EXW", "EQX", "BW_EX", "PS_MOVES", "CK_TESTS", "RDT_GROUPS", "POSTURE_DAYS"];
let ok = true;
for (const n of TABLES) { try { ok = load(`var ${n} = ${constOf(html, n)};`, `web/ossa.html ${n}`) && ok; } catch (e) { fail(`web/ossa.html: ${e.message}`); ok = false; } }
try { ok = load(`var JOINT_RELIEF = ${constOf(trainJs, "JOINT_RELIEF")};`, "web/ui/train.js JOINT_RELIEF") && ok; } catch (e) { fail(`web/ui/train.js: ${e.message}`); ok = false; }
for (const f of ["vxStretchSet", "vxIsStretch", "vxW", "vxSay"]) { try { ok = load(fnOf(vesselJs, f), `web/ui/vessel.js ${f}`) && ok; } catch (e) { fail(`web/ui/vessel.js: ${e.message}`); ok = false; } }
try { load(`var RK_SAY = ${constOf(ranksJs, "RK_SAY")}; var rkSay = ${constOf(ranksJs, "rkSay")};`, "web/ui/ranks.js rkSay"); } catch (e) { note(`web/ui/ranks.js: ${e.message} (search runs without the friendly names)`); }
const kitM = /const kit=(\/[^\n;]*\/[a-z]*);/.exec(fnOf(trainJs, "trSessionFor"));
if (!kitM) { fail("web/ui/train.js trSessionFor: can't find `const kit=/…/` (the Home kit rule)"); ok = false; }
if (!ok) { console.log(`\n${bad} problem(s): the tables could not be read, so exdata.js was not checked.`); process.exit(1); }
if (!load(exSrc, "web/ui/exdata.js")) { console.log(`\n${bad} problem(s).`); process.exit(1); }
const kitRe = vm.runInContext(kitM[1], ctx);
const run = code => vm.runInContext(code, ctx);
const { MUSCLES, MX, EXW, EQX, BW_EX, PS_MOVES, CK_TESTS, RDT_GROUPS, POSTURE_DAYS, JOINT_RELIEF } = ctx;
/* each part runs on its own, so one broken helper is reported as a FAIL instead of hiding the rest */
const part = (title, fn) => { try { fn(); } catch (e) { fail(`${title}: ${e.message}`); } };
let T = {}, Z = {}, J = { base: {}, lift: {} }, gym = {}, home = {}, zoneSets = 0;
part("exTags()", () => { T = run("exTags()") || {}; });
const names = Object.keys(T);

/* ---------- 1. every name used anywhere has a tag, and every tag is used ---------- */
const used = new Map();   // name -> where
const use = (n, where) => { if (n && !used.has(n)) used.set(n, where); };
Object.keys(MUSCLES).forEach(k => (MUSCLES[k].ex || []).forEach(e => use(e[0], `MUSCLES.${k}.ex`)));
Object.keys(MX).forEach(k => { const x = MX[k]; (x.lv || []).forEach(e => use(e[0], `MX.${k}.lv`)); (x.stretch || []).forEach(e => use(e[0], `MX.${k}.stretch`)); if (x.mob) use(x.mob[0], `MX.${k}.mob`); });
Object.keys(EQX).forEach(k => EQX[k].forEach(n => use(n, `EQX.${k}`)));
BW_EX.forEach(n => use(n, "BW_EX"));
Object.keys(PS_MOVES).forEach(k => PS_MOVES[k].forEach(e => use(e[0], `PS_MOVES.${k}`)));
Object.keys(JOINT_RELIEF).forEach(j => JOINT_RELIEF[j].m.forEach(e => use(e[0], `JOINT_RELIEF.${j}`)));
CK_TESTS.forEach(t => (t.moves || []).forEach(e => use(e[0], `CK_TESTS ${t.id}`)));
POSTURE_DAYS.forEach(d => d.moves.forEach(e => use(e[0], `POSTURE_DAYS ${d.name}`)));
Object.keys(EXW).forEach(n => use(n, "EXW"));
for (const [n, where] of used) if (!T[n]) fail(`"${n}" (${where}) has no tag in exdata.js`);
for (const n of names) if (!used.has(n)) fail(`exdata.js tags "${n}", which no table or routine uses (a typo or a renamed lift?)`);

/* ---------- 2. listed = EXW + MX stretches + MX mobility drills; the rest are routine-only ---------- */
const core = new Set(Object.keys(EXW));
Object.values(MX).forEach(x => { (x.stretch || []).forEach(e => core.add(e[0])); if (x.mob) core.add(x.mob[0]); });
for (const n of names) {
  if (core.has(n) && !T[n].listed) fail(`"${n}" is a lift, stretch or drill Exercises should list, but it's tagged x (listed:false)`);
  if (!core.has(n) && T[n].listed) fail(`"${n}" only lives in routines, so it should be tagged x (listed:false)`);
}
const listed = names.filter(n => T[n].listed);
if (listed.length !== EXPECT.listed) fail(`${listed.length} listed movements, expected ${EXPECT.listed}`);
if (names.length !== EXPECT.total) fail(`${names.length} tagged movements, expected ${EXPECT.total}`);

/* ---------- 3. kit = today's Home rule ---------- */
const bwCol = new Set(Object.values(EQX).map(x => x[1]));
for (const n of names) {
  /* a lift: the Home rule. Anything else (stretches, drills, routine moves): mobility and relief
     sessions ignore kit, so home */
  const home = EXW[n] ? (bwCol.has(n) || (BW_EX.has(n) && !kitRe.test(n))) : true;
  const want = home ? "home" : "gym";
  if (T[n].kit !== want) fail(`"${n}" is tagged ${T[n].kit}, but today's sessions make it ${want}${EXW[n] ? ` (EQX bodyweight column: ${bwCol.has(n)}, BW_EX: ${BW_EX.has(n)}, kit regex ${kitRe}: ${kitRe.test(n)})` : ""}`);
}

/* ---------- 4. type and pattern ---------- */
const PATTERNS = ["push", "pull", "hinge", "squat", "lunge", "core", "calf", "carry", "none"];
for (const n of names) {
  const t = T[n], noRP = run(`vxIsStretch(${JSON.stringify(n)})`);
  if (!PATTERNS.includes(t.pattern)) fail(`"${n}" has an unknown pattern "${t.pattern}"`);
  if ((t.type === "mobility") !== (t.pattern === "none")) fail(`"${n}": pattern 'none' is for mobility only (type ${t.type}, pattern ${t.pattern})`);
  if ((t.type === "mobility") !== noRP) {
    if (KNOWN[n]) note(`known: "${n}" ${KNOWN[n]}`);
    else fail(`"${n}" is tagged ${t.type}, but the engine ${noRP ? "gives it no RP (a stretch)" : "credits it as a lift"}`);
  } else if (KNOWN[n]) note(`"${n}" now agrees with the engine: remove it from KNOWN`);
}

/* ---------- 5. zones: every set that counts (weight 0.6 or more) has a zone ---------- */
part("zones", () => {
Z = run("exZoneT()");
const ctxOf = new Map();   // name -> muscles it can be done for (its slot muscle in any session)
const addCtx = (n, k) => { if (!EXW[n] || !MUSCLES[k]) return; if (!ctxOf.has(n)) ctxOf.set(n, new Set([EXW[n][0]])); ctxOf.get(n).add(k); };
Object.keys(EXW).forEach(n => addCtx(n, EXW[n][0]));
Object.entries(run("exOwners()")).forEach(([n, ks]) => ks.forEach(k => addCtx(n, k)));
Object.values(PS_MOVES).forEach(l => l.forEach(e => addCtx(e[0], e[2])));
CK_TESTS.forEach(t => (t.moves || []).forEach(e => addCtx(e[0], e[2])));
POSTURE_DAYS.forEach(d => d.moves.forEach(e => addCtx(e[0], e[2])));
for (const [n, ks] of ctxOf) for (const k of ks) {
  const w = run(`vxW(${JSON.stringify(n)},${JSON.stringify(k)})`);
  for (const m of Object.keys(Z)) {
    if (!(w[m] >= 0.6)) continue;
    zoneSets++;
    const id = run(`exZoneOf(${JSON.stringify(n)},${JSON.stringify(m)})`);
    if (!id) fail(`"${n}" done for ${k} counts as a ${m} set (weight ${w[m]}) but has no ${m} zone`);
    else if (!Z[m].order.includes(id)) fail(`"${n}" has ${m} zone "${id}", which isn't in exZoneList('${m}')`);
  }
}
for (const m of Object.keys(Z)) {
  if (!MUSCLES[m]) fail(`zone table has an unknown muscle "${m}"`);
  for (const id of Z[m].order) { const L = run(`exZoneLabel(${JSON.stringify(m)},${JSON.stringify(id)})`); if (!L || !L[0] || !L[1]) fail(`zone ${m}.${id} has no label or work line`); }
  for (const [n, id] of Object.entries(Z[m].ex)) {
    if (!EXW[n]) fail(`zone ${m}: "${n}" is not a lift`);
    else if (!(EXW[n][0] === m || EXW[n][1][m] > 0)) fail(`zone ${m}: "${n}" doesn't work ${m}`);
    if (!Z[m].z[id]) fail(`zone ${m}: "${n}" points at an unknown zone "${id}"`);
  }
}
});
if (run("typeof ZONES") !== "undefined") fail("exdata.js declares ZONES: ossa.html already has const ZONES (the mind zones), and the app would go blank");

/* ---------- 6. job lines ---------- */
part("job lines", () => {
J = run("exJobT()");
const lineOk = (s, where) => {
  if (!s) return fail(`${where}: no job line`);
  if (s.length > 36) fail(`${where}: "${s}" is longer than 36 characters`);
  if (!/^[A-Z]/.test(s) || /[.!]$/.test(s)) fail(`${where}: "${s}" should be sentence case with no full stop`);
};
Object.keys(MUSCLES).forEach(k => lineOk(J.base[k], `job line for ${k}`));
Object.keys(J.base).forEach(k => { if (!MUSCLES[k]) fail(`job line for unknown muscle "${k}"`); });
for (const [n, o] of Object.entries(J.lift)) {
  if (!EXW[n]) { fail(`job override for "${n}", which is not a lift`); continue; }
  for (const [k, s] of Object.entries(o)) {
    lineOk(s, `job override ${n} / ${k}`);
    if (!(EXW[n][0] === k || EXW[n][1][k] > 0)) fail(`job override ${n} / ${k}: the lift doesn't work ${k}`);
  }
}
});

/* ---------- 7. the API the screens call ---------- */
part("API", () => {
const list = run("exList({})");
if (list.length !== listed.length || new Set(list).size !== list.length) fail(`exList({}) gives ${list.length} names, expected ${listed.length} distinct`);
gym = run("exCounts({})"); home = run("exCounts({kit:'home'})");
for (const g of RDT_GROUPS) {
  if (gym[g.id] !== run(`exList({group:${JSON.stringify(g.id)}}).length`)) fail(`exCounts({}).${g.id} doesn't match its list`);
  if (home[g.id] !== run(`exList({group:${JSON.stringify(g.id)},kit:'home'}).length`)) fail(`exCounts({kit:'home'}).${g.id} doesn't match its list`);
}
for (const n of listed) {
  const I = run(`exInfo(${JSON.stringify(n)})`);
  if (!MUSCLES[I.primary]) fail(`exInfo("${n}").primary is ${I.primary}`);
  if (EXW[n] && I.primary !== EXW[n][0]) fail(`exPrimary("${n}") is ${I.primary}, but EXW says ${EXW[n][0]}`);
  if (!I.groups.length) fail(`"${n}" is in no group`);
  if (!I.muscles.length || I.muscles[0] !== I.primary) fail(`exMuscles("${n}") should start with its main muscle`);
}
for (const n of names.filter(n => !T[n].listed)) if (!run(`exPrimary(${JSON.stringify(n)})`)) fail(`routine-only "${n}" has no main muscle`);
const push = run("exSearch('push up')");
for (const n of ["Push-ups", "Push-up plus", "Pike push-up", "Incline push-ups"]) if (!push.includes(n)) fail(`exSearch('push up') misses ${n}`);
if (run("exSearch('pushups')")[0] !== "Push-ups") fail("exSearch('pushups') should find Push-ups first");
if (run("exSearch('Supported deep squat hold')").length) fail("exSearch shows a routine-only name");
for (const n of Object.keys(run("exAliasT()"))) if (!T[n] || !T[n].listed) fail(`search alias for "${n}", which Exercises doesn't list`);
if (run("exSearch('press ups')")[0] !== "Push-ups") fail("exSearch('press ups') should find Push-ups first");
if (run("exSearch('biceps')").includes("Romanian deadlift")) fail("exSearch('biceps') finds hamstring lifts (Biceps femoris)");
});

/* ---------- 8. start-up rules: only function declarations, and no name another file declares ---------- */
let mine = [];
try {
  const acorn = require("acorn");
  const ast = acorn.parse(exSrc, { ecmaVersion: "latest", sourceType: "script" });
  for (const s of ast.body) {
    if (s.type === "FunctionDeclaration") mine.push(s.id.name);
    else if (s.type !== "EmptyStatement") fail(`exdata.js line ${exSrc.slice(0, s.start).split("\n").length}: only function declarations at the top level (found ${s.type}${s.kind ? " " + s.kind : ""})`);
  }
} catch (e) {
  if (e.code !== "MODULE_NOT_FOUND") fail(`exdata.js doesn't parse: ${e.message}`);
  exSrc.split("\n").forEach((l, i) => { if (/^(const|let|var|class)\b/.test(l)) fail(`exdata.js:${i + 1}: top-level ${l.split(/\s/)[0]} (use a function with a cache on a property)`); });
  mine = [...exSrc.matchAll(/^function\s+([\w$]+)/gm)].map(m => m[1]);
}
const TOP = /^(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm;
const others = [["web/ossa.html", html], ...fs.readdirSync(path.join(ROOT, "web/ui")).filter(f => f.endsWith(".js") && f !== "exdata.js").map(f => ["web/ui/" + f, read("web/ui/" + f)])];
for (const [f, src] of others) for (const m of src.matchAll(TOP)) if (mine.includes(m[1])) fail(`exdata.js declares ${m[1]}, and so does ${f} (line ${src.slice(0, m.index).split("\n").length}); the last one wins`);
const dup = mine.filter((n, i) => mine.indexOf(n) !== i);
if (dup.length) fail(`exdata.js declares ${dup.join(", ")} twice`);

/* ---------- summary ---------- */
const by = f => names.filter(n => T[n].listed).reduce((a, n) => (a[T[n][f]] = (a[T[n][f]] || 0) + 1, a), {});
const fmt = o => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(", ");
console.log(`exdata: ${listed.length} listed + ${names.length - listed.length} routine-only = ${names.length} movements`);
console.log(`  type: ${fmt(by("type"))}`);
console.log(`  kit: ${fmt(by("kit"))} (Gym lists all ${listed.length})`);
console.log(`  pattern: ${fmt(by("pattern"))}`);
console.log(`  groups at Gym: ${fmt(Object.fromEntries(RDT_GROUPS.map(g => [g.n, gym[g.id]])))}`);
console.log(`  groups at Home: ${fmt(Object.fromEntries(RDT_GROUPS.map(g => [g.n, home[g.id]])))}`);
console.log(`  zones: ${Object.keys(Z).map(m => `${m} ${Z[m].order.join("/")}`).join(", ")}; ${zoneSets} counted (exercise, muscle) pairs covered`);
console.log(`  job lines: ${Object.keys(J.base).length} muscles, ${Object.keys(J.lift).length} movements with their own lines`);
if (bad) { console.log(`\n${bad} problem(s) in web/ui/exdata.js. Fix the tags there (never the session tables) unless the tables changed on purpose.`); process.exit(1); }
console.log("web/ui/exdata.js agrees with the tables and today's sessions");
