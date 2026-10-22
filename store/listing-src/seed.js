// The page-side seed: demo data, a finished intro, Pro on, a 4-day plan. Run with ev() on a loaded page, then reload.
module.exports = `(()=>{
  try{ localStorage.clear(); }catch(e){}
  const keep={body:"m",name:"Alex",goal:"muscle",goals:["muscle"],flagged:["lowerback"],hinted:true,toured:true,
    pro:{active:true,trial:false,at:Date.now(),plan:"yearly"},
    profile:{age:"25-34",activity:"3-4",sleep:"ok",sleepH:7,diet:"ok",stress:"some",kit:"gym",days:[0,2,4,5],sit:"6-8"}};
  S=Object.assign(demoData(),keep);
  try{ S.program=genPlan({days:4,exp:"some",kit:"gym",mins:45,focus:"balanced"}); }catch(e){ console.warn("plan",e); }
  S.done={day:new Date().toDateString(),items:[]};
  save(); return Object.keys(S).join(",");
})()`;
