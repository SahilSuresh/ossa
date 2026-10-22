/* =========================================================
   EXERCISE DATA (Ossa 2.0 Phase 2, 2026-10-16)
   Tags, plain job lines and set zones for every movement Ossa can put in a session, plus the
   lookups Exercises (discover.js), Kinetic chain (discover.js) and Where your sets went (density.js)
   read. Data only: it never writes S and never changes how sessions are built.
   Checked by scripts/check-exdata.js (run it after any change here or to the tables it mirrors).

   Start-up rules: function declarations only, with caches on function properties, and no top-level
   const or let (boot code must never reach a TDZ). Never declare a name ossa.html already has:
   ZONES (the mind check-in zones), exKind, norm, EXSYS. The tables are read at call time
   (EXW, MUSCLES, MX, EQX, RDT_GROUPS, PS_MOVES, CK_TESTS, POSTURE_DAYS and train.js's JOINT_RELIEF).

   THE 211 NAMES. Exercises lists 190: the 149 EXW lifts (66 of them the 21 Oct library: 20 chest, 46 back, shoulders, arms, legs and glutes), the 22 MX stretches and the 21 MX mobility
   drills (Doorway pec stretch and Dead hang are in two lists). 21 more names live only inside
   routines (posture scan, joint relief, body check); they are tagged with listed:false and Exercises
   never shows them. Names are join keys (S.lifts, S.swaps, S.myDay, workout rows): never rename one,
   and keep near-twins apart ("Wall slide" / "Wall slides", "90/90 hip switch" / "90/90 hip switches").

   TYPE. mobility = the engine gives it no rank points (vxIsStretch: EXW's stretch flag, or a stretch or
   drill that isn't a lift). The lifts keep their Phase 1 compound/isolation types. One known gap:
   "Supported deep squat hold" is tagged mobility but still earns adductor RP (logged in BUGS.md).

   KIT. 'home' or 'gym', and Gym lists everything (a gym has it all).
   A lift is 'home' exactly when today's Home sessions can give it: it's the muscle's bodyweight move
   (EQX's second column), or it's in BW_EX and doesn't match train.js trSessionFor's kit regex
   /band|dip|hang|pull-up|chin-up|nordic|glute-ham|ab wheel|carry/i. Every no-RP move is 'home' (mobility and relief
   sessions ignore kit). This copies the session code; check-exdata.js fails when they drift apart.

   PATTERN (one rule, for the movement, not the muscle). Knee-dominant is squat, or lunge in a split
   stance. Hip-dominant is hinge, including leg curls and moving the leg in or out at the hip. The ankle
   doing the work is calf. Upper-body pushing and raising the arm in front or to the side is push.
   Pulling, upper-back raises, shrugs, curls and grip work are pull. A loaded walk is carry. Trunk holds
   and bends are core. No-RP moves are none.

   GROUPS. The 7 RDT_GROUPS (Chest, Back, Shoulders, Arms, Legs, Glutes, Core). A movement belongs to
   the group of its main muscle and of every muscle that lists it (MUSCLES.ex, MX.lv/stretch/mob,
   EQX), so it can sit in 2-3 groups (Dips: Chest and Arms; erectors are in both Back and Core).
   A card's count is exactly the rows its filter shows.

   ZONES (Where your sets went). A set counts for a muscle when it does at least 60% of the work
   (vxW >= 0.6); every such exercise has a zone here, so a muscle's zones add up to its sets.
   Chest upper/middle/lower, triceps long/other, biceps long/other, hamstrings hip/knee.
   Incline push-ups are middle chest; lower chest is dips, decline presses and high-to-low cable flies. Every label and job line is
   "Andrej to confirm" (docs/DECISIONS.md).

   API (other files call these behind typeof guards)
     exInfo(name)               -> {name,type,kit,pattern,primary,muscles,groups,listed} (a copy) | null
                                   type 'compound'|'isolation'|'mobility'; kit 'home'|'gym';
                                   pattern push|pull|hinge|squat|lunge|core|calf|carry|none
     exList({type,kit,group,k}) -> [name] listed names only, by group, then type, then name.
                                   kit 'home' keeps home moves, 'gym' or none keeps all;
                                   k = main muscle k, or k lists it. exList({}) is all 190.
     exCounts({type,kit})       -> {chest:n,back:n,shoulders:n,arms:n,legs:n,glutes:n,core:n}
     exSearch(q,{type,kit})     -> [name] listed only, best first: names and a few other names people
                                   use ('press ups', 'rdl'), hyphen- and case-insensitive ('push up'
                                   finds Push-ups), then muscle and group names. Blank q -> [].
     exPrimary(name)            -> main muscle key | null (EXW, else the first muscle listing it)
     exMuscles(name)            -> [main, ...muscles that list it]
     exGroupsOf(name)           -> [group id]
     exJob(name,k)              -> a plain job line for muscle k in this movement ('' if unknown)
     exZoneOf(name,k)           -> zone id | null
     exZoneLabel(k,id)          -> [label, work] | null
     exZoneList(k)              -> [{id,label,work}] in display order ([] for unzoned muscles)
   ========================================================= */

/* ---------- tags: code = type (C compound, I isolation, M mobility) + kit (h home, g gym)
   + x when the name lives only in routines (listed:false), then the pattern ---------- */
function exTagSrc(){
  return {
    "Cg core":"Ab wheel rollout|Cable woodchop",
    "Cg hinge":"Hip thrust|Romanian deadlift|Rack pull|Deadlift|Good morning|Hip thrust machine|Cable pull-through",
    "Cg lunge":"Step-up",
    "Cg pull":"Wide-grip upright row|Face pull|Rear-delt row|Pull-up|Lat pulldown|Single-arm dumbbell row|Seated cable row|Chest-supported row|Barbell row|T-bar row|Machine row|Close-grip lat pulldown|Machine-assisted pull-up|Chin-up",
    "Cg push":"Overhead press|Arnold press|Landmine press|Seated dumbbell overhead press|Close-grip bench press|Dips|Barbell bench press|Incline dumbbell press|Dumbbell bench press|Weighted dips|Incline barbell bench press|Decline barbell bench press|Smith machine bench press|Smith machine incline press|Decline dumbbell press|Dumbbell floor press|Machine chest press|Plate-loaded chest press|Incline machine press|Decline machine press|Machine-assisted dips|Cable chest press|Machine shoulder press|Smith machine shoulder press|Push press",
    "Cg squat":"Back squat|Goblet squat|Sumo squat|Leg press|Hack squat|Smith machine squat|Front squat",
    "Ch calf":"Jump rope",
    "Ch carry":"Farmer's carry",
    "Ch hinge":"Glute bridge|Single-leg glute bridge|Single-leg Romanian deadlift|Back extension",
    "Ch lunge":"Walking lunge|Bulgarian split squat|Reverse lunge",
    "Ch pull":"Inverted row",
    "Ch push":"Pike push-up|Bench dips|Push-ups|Incline push-ups|Push-up plus|Decline push-ups|Diamond push-ups",
    "Ig calf":"Standing calf raise|Banded toe raise|Seated calf raise|Leg press calf raise",
    "Ig core":"Hanging leg raise|Pallof press",
    "Ig hinge":"Cable kickback|Banded lateral walk|Lying leg curl|Nordic curl|Adductor machine|Seated leg curl|Standing leg curl|Glute-ham raise|Glute kickback machine|Hip abduction machine",
    "Ig pull":"Reverse fly|Band pull-apart|Barbell curl|Incline dumbbell curl|Hammer curl|Dead hang|Wrist curl|Barbell shrug|Dumbbell shrug|Dumbbell pullover|Straight-arm pulldown|Reverse pec deck|Cable rear-delt fly|Dumbbell curl|EZ-bar curl|Preacher curl|Machine preacher curl|Cable curl|Bayesian cable curl|Concentration curl|Cable hammer curl|Reverse curl|Reverse wrist curl",
    "Ig push":"Front raise|Lateral raise|Cable lateral raise|Lean-away lateral raise|Overhead cable extension|Cable pushdown|Overhead dumbbell extension|Dumbbell fly|Incline dumbbell fly|Pec deck|Cable fly|Low-to-high cable fly|High-to-low cable fly|Cable front raise|Machine lateral raise|Cable Y-raise|Skull crusher|Rope pushdown|Machine triceps extension|Triceps kickback",
    "Ig squat":"Leg extension",
    "Ih calf":"Single-leg calf raise|Tibialis raise|Heel walk|Bent-knee calf raise|Wall-sit calf raise",
    "Ih core":"Copenhagen plank|Plank|Side plank|Bird dog|Dead bug",
    "Ih hinge":"Side-lying hip abduction",
    "Ih pull":"Prone Y-raise|Prone T-raise|Backpack curl",
    "Ih push":"Wall slide",
    "Mh none":"Doorway pec stretch|Doorway stretch, arm high|Side-lying open book|Behind-the-back chest opener|Cross-body shoulder stretch|Wall biceps stretch|Overhead triceps stretch|Wrist flexor stretch|Cobra stretch|Standing side bend|Upper trap stretch|Bench lat stretch|Hug stretch|Child's pose|Figure-four stretch|Cross-over glute stretch|Kneeling quad stretch|Standing hamstring stretch|Frog stretch|Wall calf stretch|Bent-knee calf stretch|Kneeling shin stretch|Thoracic extension over a foam roller|Wall slides|Quadruped scapular circles|Shoulder dislocates with a band|Arm circles|Sleeper stretch|Elbow circles|Wall angels|Wrist circles|Cat-cow|Seated thoracic rotation|Chin tucks|Thread the needle|90/90 hip switches|Hip circles|Deep squat hold|Leg swings|Cossack squat|Ankle rocks|Ankle circles",
    /* routine-only (posture scan, joint relief, body check): tagged, never listed */
    "Mhx none":"Kneeling hip flexor stretch|Neck side stretch|Side-lying leg raise|Single-leg balance|Pelvic tilt|Wrist extensor stretch|Slow wrist lowering|Forearm rotations|Prayer stretch|Reverse prayer stretch|Fist to spread|Knee-to-chest stretch|Half-kneeling hip flexor stretch|90/90 hip switch|Side-lying clamshell|Standing quad stretch|Straight-leg raise|Wall sit|Knee-to-wall rock|Calf raises|Supported deep squat hold",
    "Chx squat":"Bodyweight squat"
  };
}
/* {name: {type, kit, pattern, listed}} */
function exTags(){
  if(exTags.t) return exTags.t;
  const T={}, src=exTagSrc(), TY={C:"compound",I:"isolation",M:"mobility"};
  Object.keys(src).forEach(code=>{
    const m=/^([CIM])([hg])(x?) (\w+)$/.exec(code); if(!m) return;
    src[code].split("|").forEach(n=>{ T[n]={type:TY[m[1]],kit:m[2]==="h"?"home":"gym",pattern:m[4],listed:!m[3]}; });
  });
  return (exTags.t=T);
}

/* ---------- who lists a movement ---------- */
/* {name: [muscle…]} from MUSCLES.ex, MX.lv/stretch/mob and EQX, in MUSCLES order */
function exOwners(){
  if(exOwners.t) return exOwners.t;
  const O={}, add=(n,k)=>{ if(!n) return; (O[n]=O[n]||[]); if(!O[n].includes(k)) O[n].push(k); };
  Object.keys(MUSCLES).forEach(k=>{
    ((MUSCLES[k]&&MUSCLES[k].ex)||[]).forEach(e=>add(e[0],k));
    const x=MX[k]||{};
    (x.lv||[]).forEach(e=>add(e[0],k));
    (x.stretch||[]).forEach(e=>add(e[0],k));
    if(x.mob) add(x.mob[0],k);
    (EQX[k]||[]).forEach(n=>add(n,k));
  });
  return (exOwners.t=O);
}
/* {name: [muscle…]} for names that live only in routines. Built once everything has loaded;
   a table still in its TDZ (very early calls) is skipped and the build is retried next time. */
function exRoutineOwners(){
  if(exRoutineOwners.t) return exRoutineOwners.t;
  const O={}, add=(n,k)=>{ if(!n||!k||!MUSCLES[k]) return; (O[n]=O[n]||[]); if(!O[n].includes(k)) O[n].push(k); };
  let full=true;
  try{ Object.values(PS_MOVES).forEach(l=>l.forEach(e=>add(e[0],e[2]))); }catch(e){ full=false; }
  try{ Object.values(JOINT_RELIEF).forEach(R=>((R&&R.m)||[]).forEach(e=>add(e[0],e[2]))); }catch(e){ full=false; }
  try{ CK_TESTS.forEach(t=>(t.moves||[]).forEach(e=>add(e[0],e[2]))); }catch(e){ full=false; }
  try{ POSTURE_DAYS.forEach(d=>(d.moves||[]).forEach(e=>add(e[0],e[2]))); }catch(e){ full=false; }
  if(full) exRoutineOwners.t=O;
  return O;
}
function exPrimary(name){
  if(!name) return null;
  const r=EXW[name]; if(r) return r[0];
  const o=exOwners()[name]; if(o&&o.length) return o[0];
  const ro=exRoutineOwners()[name]; return ro&&ro.length?ro[0]:null;
}
/* the main muscle, then every muscle that lists it (for no-RP moves: what it stretches or moves) */
function exMuscles(name){
  if(!name) return [];
  const p=exPrimary(name), o=exOwners()[name]||exRoutineOwners()[name]||[];
  return (p?[p]:[]).concat(o.filter(k=>k!==p));
}
function exGroupsOf(name){
  const ms=exMuscles(name);
  return RDT_GROUPS.filter(g=>g.ks.some(k=>ms.includes(k))).map(g=>g.id);
}
function exInfo(name){
  if(!name) return null;
  const t=exTags()[name];
  let stretch=false; if(!t){ try{ stretch=vxIsStretch(name); }catch(e){} }
  return {name,
    type:t?t.type:(stretch?"mobility":"isolation"),
    kit:t?t.kit:"home",
    pattern:t?t.pattern:"none",
    primary:exPrimary(name), muscles:exMuscles(name), groups:exGroupsOf(name),
    listed:!!(t&&t.listed)};
}

/* ---------- lists, counts and search ---------- */
/* listed names in display order: the main muscle's group (RDT_GROUPS order), type, then name */
function exListed(){
  if(exListed.t) return exListed.t;
  const T=exTags(), TY={compound:0,isolation:1,mobility:2}, flat=[];
  RDT_GROUPS.forEach(g=>g.ks.forEach(k=>{ if(!flat.includes(k)) flat.push(k); }));
  const rank=n=>{ const i=flat.indexOf(exPrimary(n)); return i<0?999:i; };
  const L=Object.keys(T).filter(n=>T[n].listed);
  L.sort((a,b)=>rank(a)-rank(b)||TY[T[a].type]-TY[T[b].type]||a.localeCompare(b));
  return (exListed.t=L);
}
function exKeep(n,o){
  o=o||{};
  const T=exTags()[n]; if(!T||!T.listed) return false;
  const type=o.type||o.t, group=o.group||o.g;
  if(type&&type!=="all"&&T.type!==type) return false;
  if(o.kit==="home"&&T.kit!=="home") return false;
  if(group&&!exGroupsOf(n).includes(group)) return false;
  if(o.k&&!exMuscles(n).includes(o.k)) return false;
  return true;
}
function exList(o){ return exListed().filter(n=>exKeep(n,o)); }
function exCounts(o){
  o=o||{};
  const C={};
  RDT_GROUPS.forEach(g=>{ C[g.id]=exList({type:o.type||o.t,kit:o.kit,group:g.id}).length; });
  return C;
}
/* lower case, hyphens and punctuation to spaces, apostrophes dropped: "Push-ups" -> "push ups" */
function exNorm(s){ return String(s||"").toLowerCase().replace(/['’]/g,"").replace(/[^a-z0-9]+/g," ").trim(); }
/* other names people search by (British first: press-ups, skipping), matched like the name itself */
function exAliasT(){
  return exAliasT.t||(exAliasT.t={
    "Push-ups":["press ups"], "Incline push-ups":["incline press ups"], "Push-up plus":["press up plus"], "Pike push-up":["pike press up"],
    "Romanian deadlift":["rdl"], "Single-leg Romanian deadlift":["single leg rdl"],
    "Overhead press":["ohp","military press","shoulder press"], "Seated dumbbell overhead press":["shoulder press"],
    "Bulgarian split squat":["bss"], "Lying leg curl":["hamstring curl"], "Cable pushdown":["triceps pushdown"],
    "Farmer's carry":["farmers walk"], "Jump rope":["skipping"],
    /* the chest library (21 Oct): the names gyms and people use */
    "Barbell bench press":["flat bench press","bench press"], "Dumbbell bench press":["flat dumbbell press"],
    "Incline barbell bench press":["incline bench press","incline press"], "Decline barbell bench press":["decline bench press"],
    "Smith machine bench press":["smith bench press"], "Smith machine incline press":["smith incline"],
    "Machine chest press":["chest press machine","seated chest press"], "Plate-loaded chest press":["hammer strength chest press","iso lateral chest press"],
    "Incline machine press":["hammer strength incline press"], "Pec deck":["butterfly","machine fly","pec fly"],
    "Cable fly":["cable crossover"], "Machine-assisted dips":["assisted dips"], "Decline push-ups":["decline press ups"],
    /* the back, shoulder, arm, leg and glute library (21 Oct) */
    "Barbell row":["bent over row"], "Machine row":["seated row machine","hammer strength row"], "Chin-up":["chin ups"],
    "Machine-assisted pull-up":["assisted pull up"], "Straight-arm pulldown":["lat pushdown"], "Close-grip lat pulldown":["v bar pulldown"],
    "Deadlift":["conventional deadlift"], "Reverse pec deck":["rear delt machine","reverse fly machine"], "Cable rear-delt fly":["rear delt cable fly"],
    "Machine shoulder press":["shoulder press machine"], "Machine lateral raise":["lateral raise machine"],
    "Skull crusher":["lying triceps extension"], "Rope pushdown":["rope triceps pushdown"], "Machine triceps extension":["triceps machine"],
    "Triceps kickback":["dumbbell kickback"], "Diamond push-ups":["diamond press ups","close grip push ups"],
    "Preacher curl":["scott curl"], "Machine preacher curl":["biceps curl machine"], "Leg press":["leg press machine"],
    "Seated leg curl":["hamstring curl machine"], "Hip abduction machine":["abductor machine","outer thigh machine"],
    "Hip thrust machine":["glute drive"], "Glute-ham raise":["ghr"], "Leg press calf raise":["calf press"]
  });
}
function exSearch(q,o){
  const nq=exNorm(q); if(!nq) return [];
  const qc=nq.replace(/ /g,""), toks=nq.split(" "), A=exAliasT();
  const L=exList({type:o&&(o.type||o.t),kit:o&&o.kit}), score={};
  const tier=x=>{ const s=exNorm(x), c=s.replace(/ /g,"");
    if(s===nq||c===qc) return 0;
    if(s.startsWith(nq)||c.startsWith(qc)) return 1;
    if((" "+s).includes(" "+nq)) return 2;
    if(s.includes(nq)||c.includes(qc)) return 3;
    if(toks.length>1&&toks.every(t=>s.includes(t))) return 4;
    return 9; };
  L.forEach(n=>{ const t=Math.min(tier(n),...(A[n]||[]).map(tier)); if(t<9) score[n]=t; });
  if(nq.length>=3){
    /* a muscle matches by its name, friendly name or alias (the Latin name only in full:
       "biceps" must not find the hamstrings' Biceps femoris) */
    const hit=s=>{ s=exNorm(s); return s===nq||s.startsWith(nq)||(" "+s).includes(" "+nq); };
    const say=k=>{ try{ return vxSay(k); }catch(e){ return ""; } };
    const ks=Object.keys(MUSCLES).filter(k=>{ const m=MUSCLES[k]; return exNorm(m.latin)===nq||[m.name,say(k),...(m.alias||[])].some(hit); });
    const gs=RDT_GROUPS.filter(g=>hit(g.n)).map(g=>g.id);
    L.forEach(n=>{ if(n in score) return;
      if(ks.includes(exPrimary(n))) score[n]=5;
      else if(ks.length&&exMuscles(n).some(k=>ks.includes(k))) score[n]=6;
      else if(gs.length&&exGroupsOf(n).some(g=>gs.includes(g))) score[n]=7; });
  }
  const at=n=>L.indexOf(n);
  return Object.keys(score).sort((a,b)=>score[a]-score[b]||(score[a]<5?a.length-b.length:0)||at(a)-at(b));
}

/* ---------- job lines: what each muscle does in the movement, in plain words ---------- */
function exJobT(){
  return exJobT.t||(exJobT.t={
    base:{
      pec_major:"Pushes the arms forward", pec_minor:"Pulls the shoulder blade forward",
      serratus:"Holds the shoulder blade to the ribs",
      front_delt:"Raises the arm in front", side_delt:"Lifts the arm out to the side", rear_delt:"Pulls the arm back",
      biceps:"Bends the elbow", triceps:"Straightens the elbow", forearms:"Holds the grip",
      abs:"Braces the trunk", obliques:"Stops the trunk twisting",
      traps:"Steadies the shoulder blades", lats:"Pulls the arms down and back",
      rhomboids:"Squeezes the shoulder blades", erectors:"Keeps the back straight",
      glute_max:"Drives the hips forward", glute_med:"Keeps the hips level",
      quads:"Straightens the knee", hamstrings:"Straightens the hip", adductors:"Pulls the legs together",
      gastrocnemius:"Points the foot", soleus:"Points the foot, knee bent", tibialis:"Lifts the toes"
    },
    /* per-movement lines where the muscle's usual job isn't what it does here */
    lift:{
      "Lying leg curl":{hamstrings:"Bends the knee",gastrocnemius:"Helps bend the knee"},
      "Nordic curl":{hamstrings:"Bends the knee",gastrocnemius:"Helps bend the knee"},
      "Back squat":{adductors:"Helps straighten the hip"},
      "Goblet squat":{adductors:"Helps straighten the hip"},
      "Bulgarian split squat":{adductors:"Helps straighten the hip"},
      "Walking lunge":{adductors:"Helps straighten the hip"},
      "Sumo squat":{adductors:"Drives up from a wide stance"},
      "Side-lying hip abduction":{glute_med:"Moves the leg out to the side"},
      "Banded lateral walk":{glute_med:"Moves the leg out to the side"},
      "Barbell shrug":{traps:"Shrugs the shoulders up"},
      "Dumbbell shrug":{traps:"Shrugs the shoulders up"},
      "Hammer curl":{forearms:"Helps bend the elbow"},
      "Hip thrust":{quads:"Steadies the knees"},
      "Glute bridge":{quads:"Steadies the knees"},
      "Wall-sit calf raise":{quads:"Holds the wall sit"},
      "Dead hang":{lats:"Steadies the shoulders"},
      "Cable woodchop":{obliques:"Turns the trunk"},
      "Side plank":{obliques:"Stops the trunk bending sideways"},
      "Hanging leg raise":{abs:"Curls the hips up"},
      "Cable kickback":{glute_max:"Drives the leg back"},
      "Back extension":{erectors:"Straightens the back"},
      "Standing calf raise":{soleus:"Helps point the foot"},
      "Single-leg calf raise":{soleus:"Helps point the foot"},
      "Jump rope":{soleus:"Helps point the foot"},
      /* the chest's flies: the arms sweep together, they don't push */
      "Dumbbell fly":{pec_major:"Brings the arms together"},
      "Incline dumbbell fly":{pec_major:"Brings the arms together"},
      "Pec deck":{pec_major:"Brings the arms together"},
      "Cable fly":{pec_major:"Brings the arms together"},
      "Low-to-high cable fly":{pec_major:"Sweeps the arms up and together"},
      "High-to-low cable fly":{pec_major:"Sweeps the arms down and together"},
      "Dumbbell pullover":{pec_major:"Pulls the arms down from overhead",lats:"Helps pull the arms down"},
      /* the back, shoulder, arm, leg and glute library (21 Oct) */
      "Seated leg curl":{hamstrings:"Bends the knee",gastrocnemius:"Helps bend the knee"},
      "Standing leg curl":{hamstrings:"Bends the knee",gastrocnemius:"Helps bend the knee"},
      "Glute-ham raise":{hamstrings:"Bends the knee",gastrocnemius:"Helps bend the knee"},
      "Leg press":{adductors:"Helps straighten the hip"}, "Hack squat":{adductors:"Helps straighten the hip"},
      "Smith machine squat":{adductors:"Helps straighten the hip"}, "Front squat":{adductors:"Helps straighten the hip"},
      "Step-up":{adductors:"Helps straighten the hip"}, "Reverse lunge":{adductors:"Helps straighten the hip"},
      "Leg press calf raise":{soleus:"Helps point the foot"},
      "Hip abduction machine":{glute_med:"Moves the leg out to the side"},
      "Glute kickback machine":{glute_max:"Drives the leg back"},
      "Cable hammer curl":{forearms:"Helps bend the elbow"},
      "Reverse curl":{forearms:"Bends the elbow, palms down"},
      "Reverse wrist curl":{forearms:"Lifts the back of the hand"},
      "Straight-arm pulldown":{triceps:"Keeps the arms straight"},
      "Push press":{quads:"Drives the bar up with the legs"}
    }
  });
}
function exJob(name,k){
  const J=exJobT(), o=name&&J.lift[name];
  return (o&&o[k])||J.base[k]||"";
}

/* ---------- zones (Where your sets went). Never call this table ZONES. ---------- */
function exZoneT(){
  return exZoneT.t||(exZoneT.t={
    pec_major:{order:["upper","middle","lower"],
      z:{upper:["Upper chest","incline work"],middle:["Middle chest","flat pressing and flies"],lower:["Lower chest","dips and decline work"]},
      ex:{"Incline dumbbell press":"upper","Landmine press":"upper","Front raise":"upper","Pike push-up":"upper",
        "Barbell bench press":"middle","Dumbbell bench press":"middle","Push-ups":"middle","Incline push-ups":"middle",
        "Close-grip bench press":"middle","Push-up plus":"middle",
        "Dips":"lower","Weighted dips":"lower","Bench dips":"lower",
        /* the chest library (21 Oct): incline and low-to-high is upper, flat is middle, decline and high-to-low is lower.
           Decline push-ups raise the feet, so they work the upper chest */
        "Incline barbell bench press":"upper","Smith machine incline press":"upper","Incline machine press":"upper",
        "Incline dumbbell fly":"upper","Low-to-high cable fly":"upper","Decline push-ups":"upper",
        "Smith machine bench press":"middle","Dumbbell floor press":"middle","Dumbbell fly":"middle","Dumbbell pullover":"middle",
        "Machine chest press":"middle","Plate-loaded chest press":"middle","Pec deck":"middle","Cable fly":"middle","Cable chest press":"middle",
        "Decline barbell bench press":"lower","Decline dumbbell press":"lower","Decline machine press":"lower",
        "High-to-low cable fly":"lower","Machine-assisted dips":"lower",
        "Diamond push-ups":"middle"}},
    triceps:{order:["long","other"],
      z:{long:["Long head","overhead work"],other:["Other two heads","pushdowns, dips and presses"]},
      ex:{"Overhead cable extension":"long","Overhead dumbbell extension":"long",
        "Cable pushdown":"other","Close-grip bench press":"other","Dips":"other","Weighted dips":"other","Bench dips":"other","Machine-assisted dips":"other",
        "Skull crusher":"other","Rope pushdown":"other","Machine triceps extension":"other","Triceps kickback":"other","Diamond push-ups":"other"}},
    biceps:{order:["long","other"],
      z:{long:["Long head","incline curls"],other:["Whole biceps","regular curls"]},
      ex:{"Incline dumbbell curl":"long",
        "Barbell curl":"other","Hammer curl":"other","Backpack curl":"other",
        "Bayesian cable curl":"long",
        "Dumbbell curl":"other","EZ-bar curl":"other","Preacher curl":"other","Machine preacher curl":"other","Cable curl":"other",
        "Concentration curl":"other","Cable hammer curl":"other","Chin-up":"other"}},
    hamstrings:{order:["hip","knee"],
      z:{hip:["Hip work","hinges and bridges"],knee:["Knee work","leg curls"]},
      ex:{"Romanian deadlift":"hip","Single-leg Romanian deadlift":"hip","Back extension":"hip","Rack pull":"hip",
        "Hip thrust":"hip","Glute bridge":"hip","Single-leg glute bridge":"hip","Walking lunge":"hip","Cable kickback":"hip",
        "Lying leg curl":"knee","Nordic curl":"knee",
        "Deadlift":"hip","Good morning":"hip","Seated leg curl":"knee","Standing leg curl":"knee","Glute-ham raise":"knee"}}
  });
}
function exZoneOf(name,k){ const T=exZoneT()[k]; return (T&&name&&T.ex[name])||null; }
function exZoneLabel(k,id){ const T=exZoneT()[k], z=T&&T.z[id]; return z?[z[0],z[1]]:null; }
function exZoneList(k){ const T=exZoneT()[k]; return T?T.order.map(id=>({id,label:T.z[id][0],work:T.z[id][1]})):[]; }
