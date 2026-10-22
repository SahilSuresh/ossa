/* =========================================================
   WXGATE: the weather-dare gate. Ossa 2.0 Phase 6 "Challenge" (package: gate).
   It reads one weather summary from the phone (native/weather.js summarise(): MET Norway, CC BY 4.0) and
   decides whether today's life dare may become a short weather dare, an indoor one, or stay as it is.
   It fails closed: severe weather, a stale, future or malformed reading, an unknown symbol, a place that
   isn't yours, an unknown clock, quiet hours and the dark never give an outdoor dare.
   Pure: every top-level statement is a function declaration named dw*; tables live on function
   properties; no host globals (no S, NATIVE, document, window, save…) and no clock (`now` is always an
   argument, the phone's zone comes in as c.tz; only dwClock formats with the host's zone).
   node scripts/check-dares.js loads this file alone in an empty vm context and runs every severe case.
   Units: °C, wind and gusts m/s (13.9 m/s = 50 km/h), precipitation mm, times ms since 1970.

   The context c = {tz, src, placeAt, sumAt, m, quiet} (built by dares.js drCtx):
     tz      the phone's offset at now, minutes east of UTC (not a number: fail closed)
     src     "gps" | "typed" (the place's), placeAt: when the place was set (ms)
     sumAt   when the phone last re-summarised this reading (ms | null: no outdoor accept)
     m       total walk minutes for the late check (missing: dwRules().walkMax)
     quiet   false only under a localhost ?wx= fixture (quiet hours off); anything else: they apply

   dwKinds() shape (the copy and rows of §4.3; returns a fresh copy, so callers may mutate it):
     {rain|cold|wind|bright|indoor: {id, name, min, each?, out, lead:{coach, drill}, dark?:{coach, drill},
       safety, rows:[{id, t, s, sH?, src, go, n}]}}
     t/s/sH/lead may hold {m} (walk minutes), {h} (minutes each way) and {n} (steps): fill with dwFill.
     Walk rows have src:"steps" and n:null (n = m × 100; src only counts when Health is on at Accept);
     wind's into/back rows have src:null, n:null (hand ticks); indoor water has n:2.
   ========================================================= */
function dwRules(){ return dwRules.r||(dwRules.r=Object.freeze({
  gustMax:13.9,   /* m/s (50 km/h): an effective gust at or above it, now or in the next 3 h → "gust" */
  windMax:10.8,   /* m/s mean (Beaufort 6, about 39 km/h) → "wind" */
  gustK:1.6,      /* no gust from MET (outside the Nordic area): effective gust = wind × 1.6 */
  heavyNow:4,     /* mm in the current hour → "heavy" */
  heavySoon:10,   /* mm over the next 3 h → "heavy" */
  freezeT:0,      /* °C: temp ≤ 0 → "freeze" */
  iceT:2,         /* °C: temp ≤ 2 → "ice" (air at 2 m reads warmer than the ground) */
  wetIceT:5,      /* °C: temp ≤ 5 with any precipitation or a rain/showers symbol, now or soon → "ice" */
  hotT:30,        /* °C: temp ≥ 30 → "hot" */
  darkPadMin:45,  /* a walk must END 45 min before sunset */
  walkMax:15,     /* minutes: the longest walk, for the late check when c.m is missing */
  quietTo:6, quietFrom:21,   /* phone-local hours: no outdoor dare before 06:00 or one that ends after 21:00 */
  zoneH:3.5,      /* the place's solar noon must fall within 12:00 ± 3.5 h on the phone's clock */
  gpsMaxH:12,     /* a GPS place older than 12 h → "gps" */
  pickH:3,        /* a reading older than 3 h never picks a weather dare */
  acceptH:1,      /* an outdoor dare is accepted only on a reading fetched in the last hour… */
  sumMin:30,      /* …and re-summarised by the phone in the last 30 min (c.sumAt) */
  showH:6,        /* older than 6 h: not used at all */
  rainMm:0.2, dryNow:0.1, drySoon:0.5,
  coldMax:6, windMin:8.3, brightMin:8, brightMax:25 })); }   /* notable-weather bands (8.3 m/s = 30 km/h) */

/* MET Norway's 41 base symbol codes (the allow-list), with its own misspellings "lightssleet…" and "lightssnow…" */
function dwSyms(){ return (dwSyms.s||(dwSyms.s=Object.freeze(["clearsky","fair","partlycloudy","cloudy",
  "rainshowers","rainshowersandthunder","sleetshowers","snowshowers","rain","heavyrain","heavyrainandthunder",
  "sleet","snow","snowandthunder","fog","sleetshowersandthunder","snowshowersandthunder","rainandthunder",
  "sleetandthunder","lightrainshowersandthunder","heavyrainshowersandthunder","lightssleetshowersandthunder",
  "heavysleetshowersandthunder","lightssnowshowersandthunder","heavysnowshowersandthunder","lightrainandthunder",
  "lightsleetandthunder","heavysleetandthunder","lightsnowandthunder","heavysnowandthunder","lightrainshowers",
  "heavyrainshowers","lightsleetshowers","heavysleetshowers","lightsnowshowers","heavysnowshowers","lightrain",
  "lightsleet","heavysleet","lightsnow","heavysnow"]))).slice(); }
function dwSym(s){ return typeof s==="string"?s.replace(/_(day|night|polartwilight)$/,""):""; }
function dwKnown(s){ const b=dwSym(s); return !!b&&dwSyms().indexOf(b)>=0; }
/* every argument is a finite number (dwNum(x) is Number.isFinite(x)) */
function dwNum(...xs){ return xs.length>0&&xs.every(x=>Number.isFinite(x)); }
/* "51.51,-0.13" → [51.51, -0.13] */
function dwLL(key){
  if(typeof key!=="string") return null;
  const m=/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(key);
  if(!m) return null;
  const lat=+m[1], lon=+m[2];
  return dwNum(lat,lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180?[lat,lon]:null;
}

/* An EXACT copy of native/weather.js sun() (check-dares.js Stage C compares them): sunrise and sunset for
   the local solar day that contains `now`. polar: "day" (sun never sets) or "night" (never rises). */
function dwSun(lat, lon, now){
  const rad = Math.PI / 180;
  const jd = now / 86400000 + 2440587.5;
  const n = Math.round(jd - 2451545 + lon / 360); // the solar noon nearest to now, at this longitude
  const Js = n - lon / 360;
  const M = (357.5291 + 0.98560028 * Js) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const L = (M + C + 180 + 102.9372) % 360;
  const Jt = 2451545 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
  const sd = Math.sin(L * rad) * Math.sin(23.4397 * rad);
  const cd = Math.cos(Math.asin(sd));
  const cw = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * sd) / (Math.cos(lat * rad) * cd);
  const ms = (j) => Math.round((j - 2440587.5) * 86400000);
  if (!(cw >= -1)) return { rise: null, set: null, polar: "day", dark: false };
  if (!(cw <= 1)) return { rise: null, set: null, polar: "night", dark: true };
  const w = Math.acos(cw) / rad;
  const rise = ms(Jt - w / 360), set = ms(Jt + w / 360);
  return { rise, set, polar: null, dark: !(now >= rise && now <= set) };
}

/* the gust to judge by: MET's when it gives one, else wind × gustK */
function dwGust(g, wind){ return dwNum(g)?g:dwNum(wind)?wind*dwRules().gustK:null; }

/* is this place's daylight yours? tz: no phone zone; zone: its solar noon is far from 12:00 on your clock
   (a typed town in another part of the world); gps: a GPS place that hasn't updated for gpsMaxH hours */
function dwHere(lat, lon, now, c){
  const R=dwRules();
  c=c&&typeof c==="object"?c:{};
  if(!dwNum(c.tz)) return {ok:false, why:"tz"};
  if(!dwNum(lat,lon)||Math.abs(lat)>90||Math.abs(lon)>180) return {ok:false, why:"zone"};
  const noon=12-lon/15+c.tz/60, d=((((noon-12)%24)+36)%24)-12;
  if(!(Math.abs(d)<=R.zoneH)) return {ok:false, why:"zone"};
  if(c.src==="gps"){
    const a=now-c.placeAt;
    if(!(dwNum(now,c.placeAt)&&a>=0&&a<=R.gpsMaxH*36e5)) return {ok:false, why:"gps"};
  }
  return {ok:true, why:null};
}

/* daylight for a walk: "pre" (before sunrise or 06:00), "day", "late" (the walk wouldn't end 45 min before
   sunset or by 21:00), "night".
   The sun is the one for the PHONE'S calendar day (dwSun at local noon), never simply the solar noon nearest
   to now: east of a zone's meridian (Warsaw, Tokyo) the nearest noon is already tomorrow's for the last
   minutes before midnight, and west of it (London in BST, Madrid) it is still yesterday's just after
   midnight. The reading's own sun times count only when they describe that same day (the fixtures need
   them). Under a localhost fixture (c.quiet false) there are no quiet hours and the day is the one around now. */
function dwLight(lat, lon, now, c, w){
  const R=dwRules(), H=36e5, MIN=6e4;
  c=c&&typeof c==="object"?c:{};
  const quiet=c.quiet!==false;
  const res0=light=>({light, from:null, until:null, rise:null, set:null, polar:null});
  if(!dwNum(now)) return res0("night");
  if(quiet&&!dwNum(c.tz)) return res0("night");                               /* no phone clock: fail closed */
  /* the phone's day: local midnight day0, its noon (ref) and the quiet bounds */
  let ref=now, qEnd=-Infinity, qStart=Infinity;
  if(quiet){ const off=c.tz*MIN, day0=Math.floor((now+off)/864e5)*864e5-off; ref=day0+12*H; qEnd=day0+R.quietTo*H; qStart=day0+R.quietFrom*H; }
  const ll=dwNum(lat,lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180;
  const s=ll?dwSun(lat,lon,ref):null;                                          /* the place's sun on the phone's day */
  let sn=null;
  if(w&&typeof w==="object"){
    if(w.polar==="night") sn={rise:null, set:null, polar:"night"};             /* whichever day it was made for: fail closed */
    else if(w.polar==="day"){ if(!s||s.polar==="day") sn={rise:null, set:null, polar:"day"}; }
    else if(dwNum(w.rise,w.set)&&w.set>w.rise&&Math.abs(ref-(w.rise+w.set)/2)<12*H) sn={rise:w.rise, set:w.set, polar:null};
  }
  if(!sn&&s) sn={rise:s.rise, set:s.set, polar:s.polar};
  const res=(light,from,until)=>({light, from:dwNum(from)?from:null, until:dwNum(until)?until:null,
    rise:sn&&dwNum(sn.rise)?sn.rise:null, set:sn&&dwNum(sn.set)?sn.set:null, polar:sn?sn.polar:null});
  if(!sn) return res("night");                                                 /* no sun to go by: fail closed */
  if(sn.polar==="night") return res("night");
  const pd=sn.polar==="day";
  if(!pd&&!dwNum(sn.rise,sn.set)) return res("night");
  const from=pd?qEnd:Math.max(sn.rise,qEnd), until=pd?qStart:Math.min(sn.set-R.darkPadMin*MIN,qStart);
  const m=dwNum(c.m)&&c.m>0?c.m:R.walkMax;
  const dusk=()=>now<=(pd?qStart:sn.set)?"late":"night";
  let light="day";
  if(now>=qStart) light=dusk();                                                /* quiet hours have begun: never "pre" */
  else if(!(now>=from)) light="pre";
  else if(!(now<=until-m*MIN)) light=dusk();
  return res(light,from,until);
}

/* is the reading usable, fresh, recent, safe; is the place yours; how light is it; what kind of weather */
function dwCheck(w, now, key, c){
  const R=dwRules(), H=36e5, MIN=6e4;
  c=c&&typeof c==="object"?c:{};
  const g={use:false, why:null, age:null, fresh:false, recent:false, safe:false, here:false, hereWhy:null,
    light:"night", from:null, until:null, rise:null, set:null, polar:null, kind:null, out:false};
  const isObj=o=>!!o&&typeof o==="object"&&!Array.isArray(o);
  const so=isObj(w)&&isObj(w.soon)?w.soon:null;
  const nn=x=>dwNum(x)&&x>=0;                                                  /* a finite, non-negative amount */
  if(!dwNum(now)) g.why="data";
  else if(!isObj(w)||w.ok!==true) g.why="none";
  else if(key!=null&&w.key!==key) g.why="place";
  else {
    g.age=dwNum(w.at)?now-w.at:null;
    if(!dwNum(w.at)||g.age<0||!dwLL(w.key)||!dwNum(w.temp)||!nn(w.wind)||!nn(w.precip)
      ||typeof w.thunder!=="boolean"||typeof w.fog!=="boolean"||(w.gust!==null&&!nn(w.gust))||!dwKnown(w.symbol)
      ||!so||!nn(so.wind)||!nn(so.precip)||typeof so.thunder!=="boolean"||(so.gust!==null&&!nn(so.gust))||!dwKnown(so.symbol)) g.why="data";
    else if(g.age>R.showH*H) g.why="stale";
    else g.use=true;
  }
  const ll=dwLL(key!=null?key:isObj(w)?w.key:null)||[NaN,NaN];
  const hr=dwHere(ll[0],ll[1],now,c);
  g.here=hr.ok; g.hereWhy=hr.why;
  const L=dwLight(ll[0],ll[1],now,c,g.use?w:null);
  g.light=L.light; g.from=L.from; g.until=L.until; g.rise=L.rise; g.set=L.set; g.polar=L.polar;
  if(!g.use) return g;
  g.fresh=g.age<=R.pickH*H;
  g.recent=g.age<=R.acceptH*H&&dwNum(c.sumAt)&&now-c.sumAt>=0&&now-c.sumAt<=R.sumMin*MIN;
  const s0=dwSym(w.symbol), s1=dwSym(so.symbol), either=re=>re.test(s0)||re.test(s1), t=w.temp;
  const gEff=Math.max(dwGust(w.gust,w.wind), dwGust(so.gust,so.wind));
  let why=null;
  if(w.thunder||so.thunder||either(/thunder/)) why="thunder";
  else if(gEff>=R.gustMax) why="gust";
  else if(Math.max(w.wind,so.wind)>=R.windMax) why="wind";
  else if(either(/heavyrain/)||w.precip>=R.heavyNow||so.precip>=R.heavySoon) why="heavy";
  else if(either(/snow/)) why="snow";
  else if(t<=R.freezeT) why="freeze";
  else if(either(/sleet/)||t<=R.iceT||(t<=R.wetIceT&&(w.precip>0||so.precip>0||either(/rain|showers/)))) why="ice";
  else if(w.fog||either(/^fog/)) why="fog";
  else if(t>=R.hotT) why="hot";
  g.why=why; g.safe=!why;
  if(g.safe){
    const dry=w.precip<R.dryNow&&so.precip<R.drySoon;
    if(/rain|showers/.test(s0)||w.precip>=R.rainMm) g.kind="rain";
    else if(dry&&t<=R.coldMax) g.kind="cold";
    else if(dry&&gEff>=R.windMin) g.kind="wind";
    else if(/^(clearsky|fair)/.test(s0)&&t>=R.brightMin&&t<=R.brightMax&&g.light==="day") g.kind="bright";
  }
  g.out=!!(g.recent&&g.safe&&g.here&&g.light==="day");
  return g;
}

/* the PICK: null = no weather dare (the normal life dare), "indoor", or an outdoor kind ("pre" counts: it waits) */
function dwChoose(w, now, key, c){
  const g=dwCheck(w,now,key,c);
  if(!g.use) return {id:null, why:g.why||"none", g};
  if(!g.fresh) return {id:null, why:"stale", g};
  if(!g.here) return {id:null, why:g.hereWhy||"zone", g};
  if(g.safe&&!g.kind) return {id:null, why:"calm", g};
  if(g.light==="late"||g.light==="night") return {id:"indoor", why:g.safe?"dark":g.why, g};
  if(!g.safe) return {id:"indoor", why:g.why, g};
  return {id:g.kind, why:null, g};
}

/* ---------- words ---------- */
function dwSky(sym){
  if(!dwKnown(sym)) return "";
  const s=dwSym(sym);
  if(/thunder/.test(s)) return "Thunder about";
  if(/sleet/.test(s)) return "Sleet";
  if(/snow/.test(s)) return "Snow";
  if(s==="fog") return "Fog";
  if(/^heavyrain/.test(s)) return "Heavy rain";
  if(/^lightrain/.test(s)) return "Light rain";
  if(/rain/.test(s)) return "Rain";
  return {clearsky:"Clear", fair:"Fair", partlycloudy:"Partly cloudy", cloudy:"Cloudy"}[s]||"";
}
function dwWhy(why){
  return {thunder:"Thunder about", gust:"Gusty", wind:"Strong wind", heavy:"Heavy rain", snow:"Snow",
    freeze:"Below freezing", ice:"Could be icy", fog:"Foggy", hot:"Hot", dark:"Dark out"}[why]||"";
}
/* the first sentence of the amber warn line on an accepted outdoor dare (dares.js adds the skip sentence,
   except after "nofresh", which stands alone) */
function dwWarn(why){
  return {thunder:"Thunder in the forecast.", gust:"Strong gusts in the forecast.", wind:"Strong wind in the forecast.",
    heavy:"Heavy rain in the forecast.", snow:"Snow in the forecast.", freeze:"Below freezing out.",
    ice:"It could be icy out.", fog:"Fog in the forecast.", hot:"Too hot for this one.", dark:"It's getting dark.",
    far:"This forecast isn't for where you are.", nofresh:"No fresh forecast. Check the sky before you go."}[why]||"";
}
/* "8 °C", "−2 °C" (no-break space, U+2212 minus), "–" without a number */
function dwTemp(t){
  if(!dwNum(t)) return "–";
  const r=Math.round(t)||0;
  return (r<0?"−"+(-r):String(r))+" °C";
}
/* m/s → km/h, to the nearest 5 (13.9 → 50) */
function dwKmh(ms){ return dwNum(ms)?Math.round(ms*3.6/5)*5:null; }
/* "16:42" on the phone's own clock */
function dwClock(ms){
  if(!dwNum(ms)) return "–";
  const d=new Date(ms), p=n=>(n<10?"0":"")+n;
  return p(d.getHours())+":"+p(d.getMinutes());
}
/* {m} {h} {n} in a copy string; {n} is written "1,000" */
function dwFill(s, v){
  v=v&&typeof v==="object"?v:{};
  return String(s==null?"":s).replace(/\{(m|h|n)\}/g,(a,k)=>{
    const x=v[k];
    if(!dwNum(x)) return "–";
    const r=String(Math.round(x));
    return k==="n"?r.replace(/\B(?=(\d{3})+(?!\d))/g,","):r;
  });
}
/* the one-line conditions under the headline; "" when the reading isn't usable (dares.js then shows the pick snapshot) */
function dwCond(w, now, key, c, id, why){
  const g=dwCheck(w,now,key,c);
  if(!g.use) return "";
  const t=dwTemp(w.temp), sky=dwSky(w.symbol), old=g.age>30*6e4;
  const gEff=Math.max(dwGust(w.gust,w.wind), dwGust(w.soon.gust,w.soon.wind));
  if(id==="indoor"){
    if(why==="gust") return `Gusts up to ${dwKmh(gEff)} km/h · ${t}`;
    if(why==="wind") return `Strong wind · ${t}`;
    return `${dwWhy(why)||sky} · ${t}`;
  }
  if(id==="wind") return `Windy · gusts ${dwKmh(gEff)} km/h · ${t}`+(old?` at ${dwClock(w.at)}`:"");
  if(old) return `${sky} · ${t} at ${dwClock(w.at)}`;
  if(g.light==="pre"&&g.from!=null) return `${sky} · ${t} · from ${dwClock(g.from)}`;
  if(g.polar==="day"||g.set==null||(id!=="rain"&&id!=="cold"&&id!=="bright")) return `${sky} · ${t}`;
  return `${sky} · ${t} · light till ${dwClock(g.set)}`;
}

/* the kinds: name, lead (coach / drill), safety line and the three rows (§4.3). A fresh copy every call. */
function dwKinds(){
  if(!dwKinds.k){
    const water={id:"water", t:"Water when you're back", s:"Tap to log a glass. Ticks itself.", src:"water", go:"water", n:1};
    const breath=s=>({id:"breath", t:"1 minute of slow breathing", s, src:"breath", go:"breath", n:1});
    const walk=(s,sH)=>({id:"walk", t:"{m}-minute walk outside", s, sH, src:"steps", go:null, n:null});
    dwKinds.k=JSON.stringify({
      rain:{id:"rain", name:"Rain walk", min:10, out:true,
        lead:{coach:"{m} minutes out in it, then back in the warm.", drill:"It's only rain. {m} minutes. Go."},
        safety:"Skip it if you feel unwell or it's slippery underfoot. Head in if you get cold.",
        rows:[walk("Dress for the weather. Brisk pace.","Dress for it. Ticks at {n} steps."), breath("Outside or under cover. Ticks itself."), water]},
      cold:{id:"cold", name:"Cold walk", min:10, out:true,
        lead:{coach:"{m} brisk minutes in the cold air. Wrap up first.", drill:"It's chilly, not Arctic. {m} minutes."},
        safety:"Skip it if you feel unwell or it's icy underfoot. Head in if you start shivering.",
        rows:[walk("Hat, gloves and a warm layer.","Wrap up. Ticks at {n} steps."), breath("Back indoors is fine. Ticks itself."), water]},
      wind:{id:"wind", name:"Headwind", min:5, each:true, out:true,
        lead:{coach:"{h} minutes into the wind, then let it walk you home.", drill:"The wind's pushing. Push back. {h} minutes each way."},
        safety:"Skip it if you feel unwell. Head in if the gusts pick up.",
        rows:[{id:"into", t:"{h} minutes into the wind", s:"Keep clear of trees and scaffolding.", src:null, go:null, n:null},
          {id:"back", t:"{h} minutes back with it", s:"Easy pace home.", src:null, go:null, n:null}, water]},
      bright:{id:"bright", name:"Daylight", min:15, out:true,
        lead:{coach:"{m} minutes outside while it's bright.", drill:"Sun's out. You're in. Fix that."},
        safety:"Skip it if you feel unwell. Take water if it's warm.",
        rows:[walk("No phone needed for this one.","No phone needed. Ticks at {n} steps."), breath("Outside if you like. Ticks itself."), water]},
      indoor:{id:"indoor", name:"Stay in", min:0, out:false,
        lead:{coach:"Not one to be out in. Same dare, indoors.", drill:"The weather won today. You don't have to."},
        dark:{coach:"Save the walk for daylight. This one's indoors.", drill:"Too dark to walk. Indoors, then."},
        safety:"Weather dares stay in when the forecast shows thunder, ice, strong wind or heat, and after dark.",
        rows:[{id:"flow", t:"A short mobility flow", s:"Tap to start. Ticks itself at the end.", src:"flow", go:"flow", n:1},
          {id:"breath", t:"1 minute of slow breathing", s:"Tap to start. Ticks itself.", src:"breath", go:"breath", n:1},
          {id:"water", t:"Two glasses of water", s:"Tap to log one. Ticks itself.", src:"water", go:"water", n:2}]}
    });
  }
  return JSON.parse(dwKinds.k);
}

/* ---------- preview fixtures (dares.js uses them only on localhost under ?wx=<name>) ---------- */
function dwFixtures(){ return ["rain","cold","wind","bright","calm","thunder","gust","windy","heavy","snow","sleet","wet",
  "ice","freeze","fog","hot","dark","pre","polar","stale","old","far","gpsold","junk"]; }
/* {place, w}: w has exactly the keys of a real weather.js summarise() result (check-dares.js Stage A) */
function dwFixture(name, now){
  if(!dwNum(now)||dwFixtures().indexOf(name)<0) return null;
  const H=36e5, MIN=6e4, r1=x=>x==null?null:Math.round(x*10)/10;
  /* [symbol, temp, precip, wind, gust, thunder, fog] now, then soon [symbol, precip, wind, gust, thunder] */
  const lr=[["lightrain",9,0.6,3.2,null,false,false],["lightrain",1.4,3.6,null,false]];
  const T={
    rain:lr, pre:lr, polar:lr, stale:lr, old:lr, far:lr, gpsold:lr, junk:lr,
    cold:[["cloudy",4,0,2.5,null,false,false],["cloudy",0,2.8,null,false]],
    wind:[["cloudy",12,0,6,11,false,false],["cloudy",0,6.4,11.6,false]],
    bright:[["clearsky_day",15,0,2.1,null,false,false],["clearsky_day",0,2.4,null,false]],
    calm:[["cloudy",14,0,2,null,false,false],["cloudy",0,2.2,null,false]],
    thunder:[["rainshowersandthunder_day",14,1.2,4,null,true,false],["rainshowersandthunder_day",2.6,4.6,null,true]],
    gust:[["cloudy",12,0,7,16,false,false],["cloudy",0,7.4,16.4,false]],
    windy:[["cloudy",12,0,9.5,null,false,false],["cloudy",0,9.5,null,false]],
    heavy:[["heavyrain",10,6,4.5,null,false,false],["heavyrain",14.2,5,null,false]],
    snow:[["lightsnow",1,0.4,3,null,false,false],["lightsnow",1.1,3.3,null,false]],
    sleet:[["sleet",2,0.8,3.5,null,false,false],["sleet",2,3.8,null,false]],
    wet:[["lightrain",4,0.4,3,null,false,false],["lightrain",1,3.2,null,false]],
    ice:[["clearsky_day",1,0,1.5,null,false,false],["clearsky_day",0,1.8,null,false]],
    freeze:[["clearsky_day",-2,0,1.5,null,false,false],["clearsky_day",0,1.6,null,false]],
    fog:[["fog",8,0,1,null,false,true],["fog",0,1.2,null,false]],
    hot:[["clearsky_day",31,0,2.5,null,false,false],["clearsky_day",0,3,null,false]],
    dark:[["rain",9,1,3.5,null,false,false],["rain",2.4,3.8,null,false]]
  }[name];
  const a=T[0], b=T[1];
  const at=name==="stale"?now-3*H-5*MIN:name==="old"?now-7*H:now-5*MIN;
  const sun=name==="dark"?{rise:now-11*H, set:now-H, polar:null, dark:true}
    :name==="pre"?{rise:now+H, set:now+10*H, polar:null, dark:true}
    :name==="polar"?{rise:null, set:null, polar:"night", dark:true}
    :{rise:now-4*H, set:now+5*H, polar:null, dark:false};
  const far=name==="far";
  const place={town:far?"Sydney":"London", cc:far?"AU":"GB", lat:far?-33.87:51.51, lon:far?151.21:-0.13,
    src:name==="gpsold"?"gps":"typed", approx:true, at:name==="gpsold"?now-13*H:now};
  const w={ok:true, src:"met", key:far?"-33.87,151.21":"51.51,-0.13", at, exp:at+H, upd:null,
    temp:r1(a[1]), symbol:name==="junk"?"drizzle":a[0], wind:r1(a[3]), gust:r1(a[4]), precip:r1(a[2]),
    thunder:a[5], fog:a[6],
    soon:{gust:r1(b[3]), wind:r1(b[2]), precip:r1(b[1]), thunder:b[4], symbol:b[0]},
    rise:sun.rise, set:sun.set, polar:sun.polar, dark:sun.dark, credit:"Weather data from MET Norway"};
  return {place, w};
}
