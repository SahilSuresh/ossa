// Store tweaks on top of the demo (saved to localStorage, then the page reloads):
// - one upper-body story: Upper A is today's quest and ready (yesterday's upper session is dropped), the chest is
//   one session from Forged (Strong III, 58.8), the dumbbell moves have history so "Previous" shows real numbers
// - region attributes agree with the body: shoulders Unbreakable (front/side/rear delts 84/82/81), arms Forged
//   (forearms 58), no sore spots, the plain scene
module.exports = `(()=>{
  const y=dkey(1);
  S.workouts=(S.workouts||[]).filter(w=>w.d!==y);
  S.log=(S.log||[]).filter(e=>e.d!==y);
  Object.keys(S.lifts||{}).forEach(k=>{ S.lifts[k]=S.lifts[k].filter(e=>e.d!==y); if(!S.lifts[k].length) delete S.lifts[k]; });
  const H=(kg,r,n)=>Array.from({length:n},()=>({kg,r}));
  S.lifts["Dumbbell bench press"]=[{d:dkey(5),sets:H(30,9,3),p:"pec_major"}];
  S.lifts["Single-arm dumbbell row"]=[{d:dkey(5),sets:H(32,10,3),p:"lats"}];
  S.lifts["Cable lateral raise"]=[{d:dkey(5),sets:H(10,12,3),p:"side_delt"}];
  const w=S.program.week, ui=w.findIndex(d=>d&&/^Upper A/.test(d.title)); if(ui>=0&&ui!==todayIdx){ const t=w[todayIdx]; w[todayIdx]=w[ui]; w[ui]=t; }
  Object.assign(S.scores,{front_delt:84,side_delt:82,rear_delt:81,forearms:58,pec_major:58.8,glute_max:47,hamstrings:41,gastrocnemius:34,obliques:34,pec_minor:55,serratus:54,soleus:23});   // + the Chest region reads Strong III and Lower legs Stable I, like the muscles on the other slides   // the leg days predict no plural rank-up (the app says "Glutes ranks up")
  S.spots=[]; S.scene=0;
  localStorage.setItem(KEY,JSON.stringify(S)); return w.map(d=>d&&d.title).join(",");
})()`;
