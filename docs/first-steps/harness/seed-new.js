// A person who has just finished the intro: fresh state, a body, a plan, Pro on (trial), not toured.
module.exports = (o = {}) => `(()=>{
  try{ localStorage.clear(); }catch(e){}
  S=fresh(); S.body="m"; S.name=${JSON.stringify(o.name || "Alex")}; S.goal="muscle"; S.goals=["muscle"]; S.flagged=["lowerback"];
  S.focus={chain:"back",regions:["upperback","lowerback","core"]};
  S.profile={age:"25-34",activity:"1-2",sleep:"ok",sleepH:7,diet:"ok",stress:"some",kit:"gym",days:[0,2,4],sit:"6-8"};
  S.pro={active:true,trial:true,at:Date.now(),plan:"yearly"};
  try{ S.program=genPlan({days:3,exp:"new",kit:"gym",mins:45,focus:"balanced"}); const wk=Array(7).fill(null), ss=S.program.week.filter(Boolean); [0,2,4].forEach((d,j)=>wk[d]=ss[j]); S.program.week=wk; }catch(e){ console.warn("plan",e); }
  S.done={day:new Date().toDateString(),items:[]};
  ${o.toured ? "S.toured=true; S.hinted=true;" : ""}
  save(); return "ok";
})()`;
