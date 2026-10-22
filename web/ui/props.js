/* =========================================================
   BODY PROPS — the kit in exercise demos (21 Oct, Sahil: "for the dumbbell workout I want the model to hold the
   dumbbell, and for bench press to lie on the bench and do the workout")
   The demo body (makeGLBody in ossa.html) calls BODY_PROPS.draw(api,cm,st) right after it draws itself, with the
   same camera and depth buffer, while a demo plays. A move in MOVES (ossa.html) can now also carry:
     f(p,t,fig)  the pose, as before (p 0→1 through the rep, t seconds). The new moves build it with ppSolve:
                 where the body sits (pelvis turn, a body point placed in the room) and where the hands and feet
                 go, in metres; a two-bone solver turns that into joint rotations. Shoulders and hips come out as
                 quaternions (boneMats takes those since 21 Oct), so a straight-up arm never locks
     cam         the camera for it: {yaw, pitch (radians looking down), zoom (the most it zooms in)}. ossa.html fits the
                 scene to whatever frame it plays in from BODY_PROPS.span (the posed body and its kit). Without one, as before
     kit(st,K)   the equipment, built every frame from the full pose (K: bars, boxes, dumbbells, the grips)
   Every exercise in the library has one (149, 21 Oct), in six batches, each a section below: the chest (benches,
   push-ups, dips, the press machine), free weights standing and seated (curls, presses, raises, shrugs), rows and
   pulldowns (pull-ups, cable and machine rows, rear delts), legs and hinges (squats, the leg press, lunges, deadlifts,
   thrusts, curls and extensions, calves, hips), cables, flies and triceps, then core and the rest.
   A batch is: pose functions (ppStand, ppSit, ppLieBody, ppHangBase… place the body; ppHands and the rest set the hand
   and foot targets), kit functions, ppMovesN() (key → {view, cam, f, kit}) and ppNamesN() (library name → key) with
   ppMoveForN() (the batch's word rules, for your own exercises' names). Exact names are checked first across every batch.
   New keys never reuse an old move's name: lessons and stories still play those (raise_lat, pulldown, leg_ext…).
   The room: metres, y up, the floor at 0 (the dial ring), the standing body faces +z, its right is +x.
   Function declarations and two wrappers (moveFor; MOVES gets the new keys) only.
   ========================================================= */

/* ---------- vectors and 4×4 column-major matrices (ossa.html's m4) ---------- */
function ppSub(a,b){ return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
function ppAdd(a,b){ return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }
function ppMul(a,k){ return [a[0]*k,a[1]*k,a[2]*k]; }
function ppDot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function ppCross(a,b){ return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
function ppLen(a){ return Math.hypot(a[0],a[1],a[2]); }
function ppNorm(a){ const l=ppLen(a)||1; return [a[0]/l,a[1]/l,a[2]/l]; }
function ppLerp(a,b,t){ return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]; }
function ppXf(M,p){ return [M[0]*p[0]+M[4]*p[1]+M[8]*p[2]+M[12],M[1]*p[0]+M[5]*p[1]+M[9]*p[2]+M[13],M[2]*p[0]+M[6]*p[1]+M[10]*p[2]+M[14]]; }
function ppXd(M,d){ return [M[0]*d[0]+M[4]*d[1]+M[8]*d[2],M[1]*d[0]+M[5]*d[1]+M[9]*d[2],M[2]*d[0]+M[6]*d[1]+M[10]*d[2]]; }
function ppInv(M){   // a rigid transform's inverse
  const o=new Float32Array(16); for(let c=0;c<3;c++) for(let r=0;r<3;r++) o[c*4+r]=M[r*4+c];
  for(let r=0;r<3;r++) o[12+r]=-(o[r]*M[12]+o[4+r]*M[13]+o[8+r]*M[14]); o[15]=1; return o; }
function ppBone(B,i){ return B.subarray(i*16,i*16+16); }
/* 3×3 rotations, row-major arrays of 9 */
function ppAxis(a,t){ const c=Math.cos(t),s=Math.sin(t),k=1-c,x=a[0],y=a[1],z=a[2];
  return [c+x*x*k,x*y*k-z*s,x*z*k+y*s, y*x*k+z*s,c+y*y*k,y*z*k-x*s, z*x*k-y*s,z*y*k+x*s,c+z*z*k]; }
function ppM3(A,B){ const o=new Array(9); for(let r=0;r<3;r++) for(let c=0;c<3;c++) o[r*3+c]=A[r*3]*B[c]+A[r*3+1]*B[3+c]+A[r*3+2]*B[6+c]; return o; }
function ppM3v(A,v){ return [A[0]*v[0]+A[1]*v[1]+A[2]*v[2],A[3]*v[0]+A[4]*v[1]+A[5]*v[2],A[6]*v[0]+A[7]*v[1]+A[8]*v[2]]; }
function ppQuat(R){   // → [w,x,y,z], w ≥ 0
  const t=R[0]+R[4]+R[8]; let w,x,y,z;
  if(t>0){ const s=Math.sqrt(t+1)*2; w=s/4; x=(R[7]-R[5])/s; y=(R[2]-R[6])/s; z=(R[3]-R[1])/s; }
  else if(R[0]>R[4]&&R[0]>R[8]){ const s=Math.sqrt(1+R[0]-R[4]-R[8])*2; w=(R[7]-R[5])/s; x=s/4; y=(R[1]+R[3])/s; z=(R[2]+R[6])/s; }
  else if(R[4]>R[8]){ const s=Math.sqrt(1+R[4]-R[0]-R[8])*2; w=(R[2]-R[6])/s; x=(R[1]+R[3])/s; y=s/4; z=(R[5]+R[7])/s; }
  else { const s=Math.sqrt(1+R[8]-R[0]-R[4])*2; w=(R[3]-R[1])/s; x=(R[2]+R[6])/s; y=(R[5]+R[7])/s; z=s/4; }
  return w<0?[-w,-x,-y,-z]:[w,x,y,z]; }

/* ---------- the two-bone solver ----------
   Joint A, through B, to the end point E (all in the rest pose, the right side), so E lands on T (A's parent frame,
   rest coordinates). B is a hinge about its local x: the elbow flexes with a negative turn (flex −1), the knee with a
   positive one (+1). pole: where B should point. Returns A's turn as a quaternion and the hinge angle. */
function ppTwoBone(A,B,E,T,pole,flex){
  const a=ppSub(B,A), b0=ppSub(E,B), la=ppLen(a), lb=ppLen(b0), t=ppSub(T,A);
  const d=Math.max(Math.abs(la-lb)+1e-4,Math.min(la+lb-1e-4,ppLen(t)));
  const k=(d*d-la*la-lb*lb)/2, A0=a[0]*b0[0], Bc=a[1]*b0[1]+a[2]*b0[2], Ds=a[2]*b0[1]-a[1]*b0[2];
  const R=Math.hypot(Bc,Ds)||1e-9, dl=Math.atan2(Ds,Bc), ac=Math.acos(Math.max(-1,Math.min(1,(k-A0)/R)));
  const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x)), h1=wrap(dl+ac), h2=wrap(dl-ac), h=h1*flex>=h2*flex?h1:h2;
  const c=Math.cos(h), s=Math.sin(h), v=ppAdd(a,[b0[0],c*b0[1]-s*b0[2],s*b0[1]+c*b0[2]]);
  const tn=ppNorm(t), vn=ppNorm(v), ax=ppCross(vn,tn), sa=ppLen(ax), ca=ppDot(vn,tn);
  let Q=sa>1e-7?ppAxis(ppMul(ax,1/sa),Math.atan2(sa,ca)):ca>0?[1,0,0,0,1,0,0,0,1]:ppAxis(ppNorm(ppCross(vn,Math.abs(vn[0])<0.9?[1,0,0]:[0,1,0])),Math.PI);
  /* the swivel round the target line: the hinge's axis (x, carried by Q) is turned to lie across the pole, so the bend
     opens towards it. Steady with the limb straight, where the middle joint's own offset says nothing (22 Oct: a near
     straight knee, slightly hyperextended at rest, could flip a quarter turn and tip the foot) */
  const x0=ppM3v(Q,[1,0,0]), xc=ppSub(x0,ppMul(tn,ppDot(x0,tn))), up=ppSub(pole,ppMul(tn,ppDot(pole,tn))), xd=ppMul(ppCross(tn,up),-flex);
  if(ppLen(xc)>1e-6&&ppLen(xd)>1e-6) Q=ppM3(ppAxis(tn,Math.atan2(ppDot(tn,ppCross(xc,xd)),ppDot(xc,xd))),Q);
  return {q:ppQuat(Q),h};
}
/* the hand's own frame (rest, the right side): W the wrist, A along the hand, N out of the palm, X across it towards the
   little finger. The grip in ossa.html (GRIP_GLSL) curls the fingers in this frame */
function ppHandFrame(L){ const A=ppNorm(ppSub(L.hand,L.wr)), N=ppNorm(ppSub([-0.83,0,-0.55],ppMul(A,ppDot([-0.83,0,-0.55],A)))); return {W:L.wr,A,N,X:ppCross(A,N)}; }
/* where the hand holds things (22 Oct): the line a bar runs along through the closed fist, across the palm at the finger
   roots (GRIP_GLSL's fist was shaped round it). The poses aim this point; the kit draws bars and handles through it */
function ppGripPt(L){ const f=ppHandFrame(L); return ppAdd(f.W,ppAdd(ppMul(f.A,0.133),ppAdd(ppMul(f.N,0.024),ppMul(f.X,-0.028)))); }
/* the middle of an open hand: flat on the floor or a bench, on a hip, round a knee (a hand with h.flat) */
function ppFlatPt(L){ return ppLerp(L.wr,L.hand,0.42); }
/* a twisted forearm (tw) carries the hand's point round the forearm's line */
function ppTwistPt(L,P,tw){ if(!tw) return P; const a=ppNorm(ppSub(L.hand,L.el)); return ppAdd(L.el,ppM3v(ppAxis(a,tw),ppSub(P,L.el))); }
/* how far an arm may rise from hanging, against the torso: past about 150° the shoulder's skin stretches into flaps */
function ppMaxRaise(){ return 2.62; }
/* the limb joints a pose can set by hand */
function ppJoints(){ return ["uaR","uaL","faR","faL","twR","twL","thR","thL","shR","shL","ftR","ftL"]; }
/* a pose from targets. sp: {pelvis, spine, head, shrug, set (extra angles), hands:{R,L:{t,pole,flat}},
   feet:{R,L:{t,pole,aim}}}, every target and direction in room metres. The body must already be placed (sp.root).
   A hand holds what is at its target (ppGripPt, the fist closes round it: pose.grip) unless it is flat (h.flat, or
   sp.flat for both: ppFlatPt, the hand stays open) */
function ppSolve(sp,fig){
  const L=RIG[fig], pose={root:sp.root||[0,0,0],pelvis:sp.pelvis||[0,0,0],spine:sp.spine||[0,0,0],head:sp.head||[0,0,0],shrug:sp.shrug||0};
  ppJoints().forEach(k=>{ if(sp[k]) pose[k]=sp[k]; }); Object.assign(pose,sp.set||{});   // joints set by hand (a free leg, bent knees) stay; the targets below override
  const B=boneMats(pose,fig,1), iP=ppInv(ppBone(B,0)), iS=ppInv(ppBone(B,1)); pose.grip=[0,0];
  const arm=S=>{ const s=S==="R"?1:-1, h=sp.hands&&sp.hands[S]; if(!h) return;
    const t=ppXf(iS,h.t), pl=ppXd(iS,h.pole||[0,-1,0]); let tr=[t[0]*s,t[1]-pose.shrug,t[2]];
    const flat=!!(h.flat||sp.flat), E=ppTwistPt(L,flat?ppFlatPt(L):ppGripPt(L),pose["tw"+S]||0); pose.grip[S==="R"?0:1]=flat?0:1;
    /* an arm never rises past ppMaxRaise() from hanging, against the torso: the body's skin can't follow a shoulder
       further (22 Oct, Sahil: arms straight up looked "messed up"). The hand stays on its line from the shoulder, just
       lower. A hang (sp.free) keeps its hands on the bar and leans the body instead */
    if(!sp.free){ const d=ppSub(tr,L.sh), l=ppLen(d), e=Math.acos(Math.max(-1,Math.min(1,-d[1]/(l||1)))), mx=ppMaxRaise();
      if(e>mx&&l>1e-6){ let hz=[d[0],0,d[2]], hl=ppLen(hz); hz=hl>0.02*l?ppMul(hz,1/hl):ppNorm([0.35,0,1]);
        tr=ppAdd(L.sh,ppMul(ppAdd(ppMul(hz,Math.sin(mx)),[0,-Math.cos(mx),0]),l)); } }
    const r=ppTwoBone(L.sh,L.el,E,tr,[pl[0]*s,pl[1],pl[2]],-1); pose["ua"+S]=r.q; pose["fa"+S]=[r.h,0,0]; };
  ["R","L"].forEach(S=>{ const s=S==="R"?1:-1; arm(S);
    const f=sp.feet&&sp.feet[S];
    if(f){ const t=ppXf(iP,f.t), pl=ppXd(iP,f.pole||[0,0,1]);
      const r=ppTwoBone(L.hip,L.kn,L.an,[t[0]*s,t[1],t[2]],[pl[0]*s,pl[1],pl[2]],1); pose["th"+S]=r.q; pose["sh"+S]=[r.h,0,0]; } });
  /* a bar in both hands (sp.bar) lies along both fists: each forearm turns, palm up or down the nearer way round, until
     its fist lines up with the bar, within a forearm's natural turn; then the arms are solved again for the turn */
  if(sp.bar&&!sp.flat&&sp.hands&&sp.hands.R&&sp.hands.L) for(let it=0;it<3;it++){ const B1=boneMats(pose,fig,1), g=ppGrips(B1,fig), b=ppNorm(ppSub(g.L,g.R));
    ["R","L"].forEach(S=>{ const s=S==="R"?1:-1, fa=ppNorm(ppXd(ppBone(B1,S==="R"?3:5),[s*(L.hand[0]-L.el[0]),L.hand[1]-L.el[1],L.hand[2]-L.el[2]])), a=ppFistAxis(B1,fig,S);
      const bp=ppSub(b,ppMul(fa,ppDot(b,fa))), ap=ppSub(a,ppMul(fa,ppDot(a,fa))); if(ppLen(bp)<1e-4||ppLen(ap)<1e-4) return;
      let phi=Math.atan2(ppDot(fa,ppCross(ap,bp)),ppDot(ap,bp)); if(phi>Math.PI/2) phi-=Math.PI; else if(phi<-Math.PI/2) phi+=Math.PI;
      pose["tw"+S]=Math.max(-1.7,Math.min(1.7,(pose["tw"+S]||0)+(S==="R"?phi:-phi))); });
    arm("R"); arm("L"); }
  /* each foot turns about its ankle to point where asked (aim: a room direction for the heel-to-toe line) */
  if(sp.feet&&((sp.feet.R&&sp.feet.R.aim)||(sp.feet.L&&sp.feet.L.aim))){
    const B2=boneMats(pose,fig,1), f0=ppSub(L.toe,L.an);
    ["R","L"].forEach(S=>{ const f=sp.feet[S]; if(!f||!f.aim) return;
      const d=ppXd(ppInv(ppBone(B2,S==="R"?7:10)),f.aim);
      pose["ft"+S]=[Math.atan2(f0[1]*d[2]-f0[2]*d[1],f0[1]*d[1]+f0[2]*d[2]),0,0]; }); }
  return pose;
}
/* put the body where a rest-pose point (on the pelvis) lands on a room point; returns the pose */
function ppPlace(pose,fig,rest,room,bone){
  pose.root=[0,0,0]; const w=ppXf(ppBone(boneMats(pose,fig,1),bone||0),rest); pose.root=ppSub(room,w); return pose; }
function ppShoulders(pose,fig){ const L=RIG[fig], Sp=ppBone(boneMats(pose,fig,1),1), y=pose.shrug||0;
  return {R:ppXf(Sp,[L.sh[0],L.sh[1]+y,L.sh[2]]),L:ppXf(Sp,[-L.sh[0],L.sh[1]+y,L.sh[2]])}; }
function ppReach(L,flat){ return ppLen(ppSub(L.el,L.sh))+ppLen(ppSub(flat?ppFlatPt(L):ppGripPt(L),L.el)); }   // flat: to an open hand
function ppEase(p){ return p*p*(3-2*p); }
function ppSmooth(a,b,x){ return ppEase(Math.max(0,Math.min(1,(x-a)/(b-a)))); }

/* ---------- the moves ---------- */
/* lying on a bench (or the floor): o.incl (radians: 0 flat, + head up, − head down), o.grip [half-width at the
   bottom, at the top], o.touch (how far in front of the chest the hands are at the bottom, rest metres), o.db
   (dumbbells), o.vertical (the Smith machine's straight path), o.floor */
function ppBenchPose(p,fig,o){
  const L=RIG[fig], th=o.incl||0;
  const pose={pelvis:[-(Math.PI/2-th),0,0],spine:[-0.05,0,0],head:[o.floor?-0.12:-0.2,0,0],shrug:-0.008};
  ppPlace(pose,fig,[0,0.83,-0.155],o.hipAt||[0,0.455,0.32]);
  const B=boneMats(pose,fig,1), Sp=ppBone(B,1), P=ppBone(B,0), sh=ppShoulders(pose,fig);
  const mid=ppMul(ppAdd(sh.R,sh.L),0.5), q=ppEase(p);
  const half=o.grip[0]+(o.grip[1]-o.grip[0])*q;
  const low=ppXf(Sp,[0,o.touchY||1.21,o.touch||0.125]);   // the bottom: over the lower chest
  const ra=ppReach(L), dx=Math.max(0,o.grip[1]-L.sh[0]);
  const up=Math.sqrt(Math.max(0.02,(0.965*ra)*(0.965*ra)-dx*dx));
  const top=o.vertical?[0,mid[1]+up*0.97,low[2]]:[0,mid[1]+up,mid[2]+(o.topZ==null?0.035:o.topZ)];
  const c=ppLerp(low,top,q);
  const pole=ppXd(Sp,ppNorm([0.72,-0.32,-0.6]));   // elbows out, a little towards the hips and down past the bench
  const hip=ppXf(P,L.hip);
  const ank=o.legs==="hook"?null:[0.25,0.115,hip[2]+(o.floor?0.36:0.43)];
  const sp={...pose,hands:{R:{t:[half,c[1],c[2]],pole},L:{t:[-half,c[1],c[2]],pole:[-pole[0],pole[1],pole[2]]}}};
  if(o.legs==="hook"){   // decline: knees over the roller, shins hooked under it
    const a=ppAdd(hip,[0.12,-0.36,0.30]);
    sp.feet={R:{t:a,pole:[0.15,1,0.4]},L:{t:[-a[0],a[1],a[2]],pole:[-0.15,1,0.4]}};
  } else sp.feet={R:{t:ank,pole:[0.3,0.75,0.6],aim:[0.08,-0.55,0.83]},L:{t:[-ank[0],ank[1],ank[2]],pole:[-0.3,0.75,0.6],aim:[-0.08,-0.55,0.83]}};
  sp.bar=!o.db; return ppSolve(sp,fig);
}
/* push-ups: the body a straight line pivoting on its toes; o.hands {x half-width, y (0 the floor, 0.45 a bench)},
   o.feetY (0.45 with the feet on a bench), o.plus (only the top, the shoulder blades moving) */
function ppPushPose(p,fig,o){
  const L=RIG[fig], ra=ppReach(L,true), hx=o.hx||0.3, hy=(o.handY||0)+0.035, q=ppEase(p);
  const dx=Math.max(0,hx-L.sh[0]), topY=hy+Math.sqrt(Math.max(0.02,(0.955*ra)*(0.955*ra)-dx*dx-0.0025));
  const lowY=(o.handY||0)+0.2;   // the chest a few centimetres off the floor (or the bench)
  const want=o.plus?topY-0.04+0.04*q:lowY+(topY-lowY)*q;
  const toe=[L.toe[0],L.toe[1],L.toe[2]], at=[0.19,(o.feetY||0)+0.004,-0.72], shrug=o.plus?-0.025+0.03*q:0;
  /* the plank's angle off the floor, phi, so the shoulders sit at the height wanted: the body is rigid and pivots on
     its toes, so shoulder height = toes + sin(phi)·dy − cos(phi)·dz (dy, dz: shoulder minus toe, standing) */
  const dy=L.sh[1]+shrug-toe[1], dz=L.sh[2]-toe[2], R=Math.hypot(dy,dz), dl=Math.atan2(-dz,dy);
  const phi=Math.asin(Math.max(-1,Math.min(1,(want-at[1])/R)))-dl;
  const pose=ppPlace({pelvis:[Math.PI/2-phi,0,0],head:[-0.18,0,0],shrug},fig,toe,at,8);
  const sh=ppShoulders(pose,fig), z=(sh.R[2]+sh.L[2])/2-0.03;
  const pole=o.close?[0.3,0.35,-0.88]:[0.62,0.42,-0.66];
  return ppSolve({...pose,flat:true,hands:{R:{t:[hx,hy,z],pole},L:{t:[-hx,hy,z],pole:[-pole[0],pole[1],pole[2]]}}},fig);
}
/* dips on parallel bars at height o.h, half-width o.w; o.assist kneels on the machine's pad */
function ppDipsPose(p,fig,o){
  const L=RIG[fig], ra=ppReach(L), q=ppEase(p), lean=0.32-0.14*q;
  const pose={pelvis:[lean,0,0],spine:[0.04,0,0],head:[0.02,0,0],shrug:-0.012+0.024*q,set:{thR:[-0.32,0,0],thL:[-0.32,0,0],shR:[1.45,0,0],shL:[1.45,0,0],ftR:[0.45,0,0],ftL:[0.45,0,0]}};
  Object.assign(pose,pose.set); delete pose.set;
  const hy=o.h, dx=Math.max(0,o.w-L.sh[0]);   // the fist round the bar
  const shY=hy+(0.27+(Math.sqrt(Math.max(0.02,(0.96*ra)*(0.96*ra)-dx*dx))-0.27)*q);
  ppPlace(pose,fig,[0,L.sh[1],L.sh[2]],[0,shY,0.02],1);
  const sh=ppShoulders(pose,fig), z=(sh.R[2]+sh.L[2])/2-0.02, pole=[0.18,0.05,-1];
  return ppSolve({...pose,hands:{R:{t:[o.w,hy,z],pole},L:{t:[-o.w,hy,z],pole:[-pole[0],pole[1],pole[2]]}}},fig);
}
/* bench dips: hands on a bench behind, legs out in front, heels on the floor */
function ppBenchDipsPose(p,fig){
  const L=RIG[fig], q=ppEase(p);
  const pose={pelvis:[0.06,0,0],spine:[0.04,0,0],head:[0.05,0,0],shrug:-0.015+0.025*q};
  ppPlace(pose,fig,L.hip.map((v,i)=>i===0?0:v),[0,0.2+0.24*q,0.03]);
  const pole=[0.1,0.15,-1];
  return ppSolve({...pose,flat:true,hands:{R:{t:[0.21,0.475,-0.19],pole},L:{t:[-0.21,0.475,-0.19],pole:[-0.1,0.15,-1]}},
    feet:{R:{t:[0.15,0.09,0.86],pole:[0.1,1,0.25],aim:[0.05,0.6,0.8]},L:{t:[-0.15,0.09,0.86],pole:[-0.1,1,0.25],aim:[-0.05,0.6,0.8]}}},fig);
}
/* the seated chest press machine; o.path 0 flat, + incline, − decline */
function ppMachinePose(p,fig,o){
  const L=RIG[fig], q=ppEase(p), ra=ppReach(L);
  const pose={pelvis:[-0.12,0,0],spine:[0.02,0,0],head:[0.06,0,0],shrug:-0.006};
  ppPlace(pose,fig,L.hip.map((v,i)=>i===0?0:v),[0,0.555,0]);
  const sh=ppShoulders(pose,fig), mid=ppMul(ppAdd(sh.R,sh.L),0.5), hx=0.27, path=o.path||0;
  const lowP=[0,mid[1]-0.09+path*0.05,mid[2]+0.2];
  const reach=0.95*ra, dx=hx-L.sh[0], ang=path*0.42;
  const fw=Math.sqrt(Math.max(0.02,reach*reach-dx*dx));
  const topP=[0,mid[1]-0.07+Math.sin(ang)*fw,mid[2]+Math.cos(ang)*fw];
  const c=ppLerp(lowP,topP,q), pole=[0.8,-0.55,-0.25];
  return ppSolve({...pose,hands:{R:{t:[hx,c[1],c[2]],pole},L:{t:[-hx,c[1],c[2]],pole:[-0.8,-0.55,-0.25]}},
    feet:{R:{t:[0.19,0.115,0.47],pole:[0.2,0.5,1],aim:[0.08,-0.55,0.83]},L:{t:[-0.19,0.115,0.47],pole:[-0.2,0.5,1],aim:[-0.08,-0.55,0.83]}}},fig);
}

/* ---------- the kit: boxes, bars and plates, in room metres ---------- */
/* K collects draw items: {g:"box"|"cyl"|"hex", m (a 4×4), k (material: 0 metal, 1 pad, 2 frame)} */
function ppKit(){
  const out=[];
  const mat4=(R,c,s)=>{ const m=new Float32Array(16); for(let col=0;col<3;col++) for(let r=0;r<3;r++) m[col*4+r]=R[r*3+col]*s[col]; m[12]=c[0]; m[13]=c[1]; m[14]=c[2]; m[15]=1; return m; };
  const K={
    out,
    /* a box with corners lo and hi, in the room or in a bone's frame F (rest-pose coordinates) */
    box(lo,hi,k,F){ const c=ppLerp(lo,hi,0.5), s=ppSub(hi,lo).map(Math.abs);
      let m=mat4([1,0,0,0,1,0,0,0,1],c,s); if(F) m=m4.mul(F,m); out.push({g:"box",m,k}); },
    /* a round (or six-sided) bar from a to b */
    bar(a,b,r,k,hex){ const d=ppSub(b,a), l=ppLen(d)||1e-4, n=ppMul(d,1/l), ax=ppCross([0,1,0],n), sa=ppLen(ax), ca=n[1];
      const R=sa>1e-6?ppAxis(ppMul(ax,1/sa),Math.atan2(sa,ca)):(ca>0?[1,0,0,0,1,0,0,0,1]:[1,0,0,0,-1,0,0,0,-1]);
      out.push({g:hex?"hex":"cyl",m:mat4(R,ppLerp(a,b,0.5),[2*r,l,2*r]),k}); },
    /* a post from a point straight down to the floor */
    post(top,w,k){ K.box([top[0]-w/2,0,top[2]-w/2],[top[0]+w/2,top[1],top[2]+w/2],k); },
    /* a barbell through two grips: the shaft, collars and one big plate a side (sleeves drawn short, 1.7 m end to end,
       so the scene fits a phone). o.half: the shaft's half-length (0.42 an EZ bar), o.r the plates' radius */
    barbell(gR,gL,o){ o=o||{}; const c=ppLerp(gR,gL,0.5), d=ppNorm(ppSub(gL,gR)), at=x=>ppAdd(c,ppMul(d,x)), h=o.half||0.66, r=o.r||0.2;
      K.bar(at(-h),at(h),0.0135,0);
      [-1,1].forEach(s=>{ K.bar(at(s*h),at(s*(h+0.2)),0.025,0); K.bar(at(s*(h-0.015)),at(s*(h+0.005)),0.04,0);
        if(o.plates!==false){ K.bar(at(s*(h+0.03)),at(s*(h+0.085)),r,0); K.bar(at(s*(h+0.085)),at(s*(h+0.115)),r*0.78,0); } }); },
    /* a hex dumbbell held at g, its handle along axis; sc sizes its heads (0.75 a light one) */
    dumbbell(g,axis,sc){ sc=sc||1; const d=ppNorm(axis), at=x=>ppAdd(g,ppMul(d,x)), h1=0.085+0.075*sc;
      K.bar(at(-0.075),at(0.075),0.016,0); [-1,1].forEach(s=>{ K.bar(at(s*0.075),at(s*0.085),0.032,0); K.bar(at(s*0.085),at(s*h1),0.06*sc,0,true); }); },
    /* a box on its own axes (unit vectors ax, ay, az), sizes s along them, centred at c */
    obox(c,ax,ay,az,s,k){ out.push({g:"box",m:mat4([ax[0],ay[0],az[0],ax[1],ay[1],az[1],ax[2],ay[2],az[2]],c,s),k}); },
    /* a pad whose top face runs along a→b (w wide, t thick) facing n: a sloping preacher or back-extension pad */
    slab(a,b,w,t,n,k){ const d=ppSub(b,a), l=ppLen(d)||1e-4, z=ppMul(d,1/l), y=ppNorm(ppSub(n,ppMul(z,ppDot(n,z)))), x=ppCross(y,z);
      K.obox(ppSub(ppLerp(a,b,0.5),ppMul(y,t/2)),x,y,z,[w,t,l],k); },
  };
  return K;
}
/* where the grips are in a full pose (bone matrices) */
function ppGrips(B,fig){ const L=RIG[fig], G=ppGripPt(L); return {R:ppXf(ppBone(B,3),G),L:ppXf(ppBone(B,5),[-G[0],G[1],G[2]])}; }
/* where open hands are (flat on a bench) */
function ppFlats(B,fig){ const L=RIG[fig], G=ppFlatPt(L); return {R:ppXf(ppBone(B,3),G),L:ppXf(ppBone(B,5),[-G[0],G[1],G[2]])}; }
/* the line a held bar runs along through a fist, in the room (S "R" or "L") */
function ppFistAxis(B,fig,S){ const X=ppHandFrame(RIG[fig]).X; return ppNorm(ppXd(ppBone(B,S==="R"?3:5),[S==="R"?X[0]:-X[0],X[1],X[2]])); }
/* a bench under a lying body: the pad follows the back (pelvis frame), the legs reach the floor */
function ppBenchKit(K,B,o){
  const P=ppBone(B,0), pad=(y0,y1)=>K.box([-0.145,y0,-0.24],[0.145,y1,-0.153],1,P);
  if(!o.incl){ pad(0.72,1.86);
    const a=ppXf(P,[0,0.86,-0.24]), b=ppXf(P,[0,1.7,-0.24]); [a,b].forEach(t=>{ K.post([t[0],t[1],t[2]],0.06,2); K.box([-0.24,0,t[2]-0.03],[0.24,0.04,t[2]+0.03],2); });
    K.box([-0.03,a[1]-0.07,Math.min(a[2],b[2])],[0.03,a[1]-0.01,Math.max(a[2],b[2])],2); return; }
  /* incline or decline: the back pad on the torso, a seat (or the roller end) in the room */
  pad(o.incl>0?0.96:0.74,1.86);
  const lo=ppXf(P,[0,o.incl>0?1.0:0.8,-0.24]), hi=ppXf(P,[0,1.72,-0.24]);
  if(o.incl>0){ const g=ppXf(P,[0,0.8,-0.11]), sy=g[1]-0.035, sz=g[2];
    K.box([-0.15,sy-0.075,sz-0.2],[0.15,sy,sz+0.16],1); K.post([0,sy-0.075,sz],0.06,2);
    K.post([hi[0],hi[1],hi[2]],0.06,2); K.box([-0.03,0,Math.min(sz,hi[2])-0.05],[0.03,0.05,Math.max(sz,hi[2])+0.05],2);
    K.box([-0.24,0,hi[2]-0.03],[0.24,0.04,hi[2]+0.03],2); K.box([-0.24,0,sz-0.03],[0.24,0.04,sz+0.03],2); }
  else { K.post(lo,0.06,2); K.post(hi,0.06,2); K.box([-0.03,0,Math.min(lo[2],hi[2])],[0.03,0.05,Math.max(lo[2],hi[2])],2);
    [lo,hi].forEach(t=>K.box([-0.24,0,t[2]-0.03],[0.24,0.04,t[2]+0.03],2)); }
}
/* the decline bench's leg roller, in front of the shins */
function ppRoller(K,B,fig){ const L=RIG[fig], aR=ppXf(ppBone(B,7),[L.an[0],L.an[1]+0.1,L.an[2]+0.075]), aL=ppXf(ppBone(B,10),[-L.an[0],L.an[1]+0.1,L.an[2]+0.075]);
  const c=ppLerp(aR,aL,0.5); K.bar([c[0]-0.2,c[1],c[2]],[c[0]+0.2,c[1],c[2]],0.055,1); K.post([c[0],c[1]-0.05,c[2]],0.05,2); }
/* the moves' kits */
function ppBenchKitFor(o){ return (st,K)=>{ const B=st.B, g=ppGrips(B,st.fig);
  if(!o.floor) ppBenchKit(K,B,o);
  if(o.legs==="hook") ppRoller(K,B,st.fig);
  if(o.db){ K.dumbbell(g.R,[1,0,0]); K.dumbbell(g.L,[1,0,0]); }
  else { K.barbell(g.R,g.L,{r:0.17});
    if(o.vertical){ [-1,1].forEach(s=>{ const z=(g.R[2]+g.L[2])/2; K.bar([s*0.6,0,z],[s*0.6,2.05,z],0.022,2); K.box([s*0.6-0.05,2.05,z-0.05],[s*0.6+0.05,2.09,z+0.05],2); }); } } }; }
function ppPushKit(o){ return (st,K)=>{ const B=st.B, L=RIG[st.fig];
  if(o.handY){ const g=ppFlats(B,st.fig), z=(g.R[2]+g.L[2])/2; K.box([-0.6,o.handY-0.07,z-0.16],[0.6,o.handY,z+0.14],1); [-0.48,0.48].forEach(x=>K.post([x,o.handY-0.07,z-0.01],0.05,2)); }
  if(o.feetY){ const t=ppXf(ppBone(B,8),L.toe); K.box([-0.6,o.feetY-0.07,t[2]-0.16],[0.6,o.feetY,t[2]+0.12],1); [-0.48,0.48].forEach(x=>K.post([x,o.feetY-0.07,t[2]-0.02],0.05,2)); } }; }
function ppDipsKit(o){ return (st,K)=>{ [-1,1].forEach(s=>{ const x=s*o.w;
    K.bar([x,o.h,-0.42],[x,o.h,0.42],0.022,2); K.post([x,o.h-0.02,-0.42],0.05,2); K.post([x,o.h-0.02,0.42],0.05,2); K.box([x-0.03,0,-0.5],[x+0.03,0.04,0.5],2); });
  /* the assisted machine's knee pad, right under the knees (the thigh bones carry the knee joints), on its post */
  if(o.assist){ const L=RIG[st.fig], kR=ppXf(ppBone(st.B,6),L.kn), kL=ppXf(ppBone(st.B,9),[-L.kn[0],L.kn[1],L.kn[2]]), c=ppLerp(kR,kL,0.5), y=Math.min(kR[1],kL[1])-0.065;
    K.box([c[0]-0.19,y-0.07,c[2]-0.16],[c[0]+0.19,y,c[2]+0.08],1); K.post([c[0],y-0.07,c[2]-0.04],0.06,2); } }; }
function ppBenchDipsKit(st,K){ K.box([-0.6,0.405,-0.5],[0.6,0.475,-0.165],1); [-0.48,0.48].forEach(x=>{ K.post([x,0.405,-0.25],0.05,2); K.post([x,0.405,-0.42],0.05,2); }); }
function ppMachineKit(o){ return (st,K)=>{ const B=st.B, P=ppBone(B,0), g=ppGrips(B,st.fig), seat=ppXf(P,[0,0.79,-0.1]);
  K.box([-0.21,seat[1]-0.085,-0.16],[0.21,seat[1]-0.005,0.3],1);   // the seat
  K.box([-0.19,0.94,-0.25],[0.19,1.64,-0.17],1,P);                  // the back pad, behind the back
  const bp=ppXf(P,[0,1.0,-0.25]);
  K.post([0,seat[1]-0.085,0.05],0.07,2); K.box([-0.035,0,-0.36],[0.035,0.05,0.42],2); K.post([0,bp[1],bp[2]-0.02],0.07,2);
  [-1,1].forEach(s=>{ const pv=[s*0.52,1.56,-0.32], gp=s>0?g.R:g.L;
    K.box([s*0.52-0.035,0,-0.355],[s*0.52+0.035,1.62,-0.285],2);    // the uprights
    K.bar(pv,[gp[0]+s*0.03,gp[1]+0.07,gp[2]],0.022,0);                 // the press arm down to the handle
    K.bar([gp[0],gp[1]-0.075,gp[2]],[gp[0],gp[1]+0.075,gp[2]],0.018,0); });   // the handle
  K.box([-0.55,1.6,-0.355],[0.55,1.66,-0.285],2); }; }

/* the scene's extent, for the camera's fit: points [x,y,z,r] on the posed body (r: how far the body reaches round the
   point) and the corners of its kit, at the bottom, middle and top of the rep */
function ppCorners(g){ const c=ppCorners.c||(ppCorners.c={}); if(c[g]) return c[g]; const o=c[g]=[];   // of the unit shapes (ppGeo)
  if(g==="box") [-0.5,0.5].forEach(x=>[-0.5,0.5].forEach(y=>[-0.5,0.5].forEach(z=>o.push([x,y,z]))));
  else [-0.5,0.5].forEach(y=>{ for(let i=0;i<8;i++) o.push([Math.cos(i*Math.PI/4)*0.5,y,Math.sin(i*Math.PI/4)*0.5]); });
  return o; }
function ppSpan(mv,fig){
  const L=RIG[fig], out=[], mir={2:4,3:5,6:9,7:10,8:11};
  const limbs=[[2,L.sh,0.075],[2,ppLerp(L.sh,L.el,0.5),0.06],[3,L.el,0.055],[3,L.wr,0.045],[3,L.hand,0.055],[6,L.hip,0.09],[6,ppLerp(L.hip,L.kn,0.5),0.09],
    [7,L.kn,0.075],[7,ppLerp(L.kn,L.an,0.5),0.065],[8,L.an,0.055],[8,L.toe,0.05],[8,[L.an[0],0.03,L.an[2]-0.06],0.045]];
  const core=[[0,[0,0.92,-0.02],0.14],[1,L.waist,0.14],[1,[0,1.3,0],0.15],[1,L.neck,0.07],[12,[0,1.64,0.01],0.13]];
  [0,0.5,1].forEach(p=>{ const B=boneMats(mv.f(p,0,fig),fig,1);
    limbs.forEach(([b,q,r])=>{ out.push([...ppXf(ppBone(B,b),q),r],[...ppXf(ppBone(B,mir[b]),[-q[0],q[1],q[2]]),r]); });
    core.forEach(([b,q,r])=>out.push([...ppXf(ppBone(B,b),q),r]));
    if(mv.kit){ const K=ppKit(); mv.kit({e:1,ph:p,t:0,fig,B},K); K.out.forEach(it=>ppCorners(it.g==="box"?"box":"cyl").forEach(q=>out.push([...ppXf(it.m,q),0]))); } });
  return out;
}
/* the pilot's moves, by key. cam: yaw (the camera's angle round the body), pitch (looking down), zoom (the most) */
function ppMoves(){
  const camLie={yaw:2.45,pitch:0.5}, camInc={yaw:0.62,pitch:0.32}, camFloor={yaw:2.45,pitch:0.62};   // from the head end and above: the chest, both hands on the bar and the bench at once (an incline is filmed from the front, its back pad faces the head end)
  const camPush={yaw:Math.PI/2+0.25,pitch:0.28}, camDip={yaw:0.75,pitch:0.08}, camSeat={yaw:0.95,pitch:0.14};
  const bench=(o,cam)=>({view:cam.yaw,cam,o,f:(p,t,fig)=>ppBenchPose(p,fig,o),kit:ppBenchKitFor(o)});
  const push=o=>({view:camPush.yaw,cam:o.cam||camPush,f:(p,t,fig)=>ppPushPose(p,fig,o),kit:ppPushKit(o)});
  const BB=[0.4,0.4], DB=[0.31,0.2];   // dumbbells: wide at the chest, together (not touching) at the top
  return {
    bench_bb:bench({grip:BB},camLie), bench_bb_close:bench({grip:[0.25,0.25]},camLie),
    bench_bb_inc:bench({grip:BB,incl:0.6,touchY:1.29,topZ:0.06,hipAt:[0,0.47,0.36]},camInc),
    bench_bb_dec:bench({grip:BB,incl:-0.3,touchY:1.17,legs:"hook",hipAt:[0,0.58,0.3]},camLie),
    bench_smith:bench({grip:BB,vertical:true},camLie), bench_smith_inc:bench({grip:BB,incl:0.6,touchY:1.29,vertical:true,hipAt:[0,0.47,0.36]},camInc),
    bench_db:bench({grip:DB,db:true,touch:0.12},camLie), bench_db_inc:bench({grip:DB,db:true,incl:0.6,touchY:1.29,topZ:0.06,hipAt:[0,0.47,0.36]},camInc),
    bench_db_dec:bench({grip:DB,db:true,incl:-0.3,touchY:1.17,legs:"hook",hipAt:[0,0.58,0.3]},camLie),
    floor_db:bench({grip:[0.32,0.18],db:true,floor:true,touch:0.27,hipAt:[0,0.02,0.32]},camFloor),
    pushup:push({}), pushup_close:push({hx:0.075,close:true}), pushup_plus:push({plus:true}),
    pushup_inc:push({handY:0.45}), pushup_dec:push({feetY:0.45}),
    dips:{view:camDip.yaw,cam:camDip,f:(p,t,fig)=>ppDipsPose(p,fig,{h:1.3,w:0.27}),kit:ppDipsKit({h:1.3,w:0.27})},
    dips_assist:{view:camDip.yaw,cam:camDip,f:(p,t,fig)=>ppDipsPose(p,fig,{h:1.3,w:0.27}),kit:ppDipsKit({h:1.3,w:0.27,assist:true})},
    bench_dips:{view:0.95,cam:{yaw:0.95,pitch:0.16},f:(p,t,fig)=>ppBenchDipsPose(p,fig),kit:ppBenchDipsKit},
    machine_press:{view:camSeat.yaw,cam:camSeat,f:(p,t,fig)=>ppMachinePose(p,fig,{path:0}),kit:ppMachineKit({})},
    machine_press_inc:{view:camSeat.yaw,cam:camSeat,f:(p,t,fig)=>ppMachinePose(p,fig,{path:1}),kit:ppMachineKit({})},
    machine_press_dec:{view:camSeat.yaw,cam:camSeat,f:(p,t,fig)=>ppMachinePose(p,fig,{path:-1}),kit:ppMachineKit({})},
  };
}
/* which of them an exercise uses (others keep the old mapping) */
function ppMoveFor(name){
  const n=String(name||"").toLowerCase();
  if(n==="push-up plus") return "pushup_plus";
  if(/diamond push-up/.test(n)) return "pushup_close";
  if(/incline push-up/.test(n)) return "pushup_inc";
  if(/decline push-up/.test(n)) return "pushup_dec";
  if(n==="push-ups") return "pushup";
  if(n==="bench dips") return "bench_dips";
  if(n==="machine-assisted dips") return "dips_assist";
  if(n==="dips"||n==="weighted dips") return "dips";
  if(/floor press/.test(n)) return "floor_db";
  if(/smith machine incline press/.test(n)) return "bench_smith_inc";
  if(/smith machine bench press/.test(n)) return "bench_smith";
  if(/incline barbell bench/.test(n)) return "bench_bb_inc";
  if(/decline barbell bench/.test(n)) return "bench_bb_dec";
  if(/close-grip bench/.test(n)) return "bench_bb_close";
  if(n==="barbell bench press") return "bench_bb";
  if(n==="incline dumbbell press") return "bench_db_inc";
  if(n==="decline dumbbell press") return "bench_db_dec";
  if(n==="dumbbell bench press") return "bench_db";
  if(n==="incline machine press") return "machine_press_inc";
  if(n==="decline machine press") return "machine_press_dec";
  if(n==="machine chest press"||n==="plate-loaded chest press") return "machine_press";
  return null;
}

/* =========================================================
   STANDING AND SEATED FREE WEIGHTS (batch 2, 21 Oct, Sahil: "do one after another now"): curls, shoulder presses,
   raises, shrugs, the overhead extension and the farmer's carry
   ========================================================= */
/* the torso's frame: arm paths are written on the standing rest pose (metres, the right side) and ride with the torso */
function ppFrame(pose,fig){ const B=boneMats(pose,fig,1); return {B,Sp:ppBone(B,1),P:ppBone(B,0)}; }
function ppArm(L,flat){ return [ppLen(ppSub(L.el,L.sh)),ppLen(ppSub(flat?ppFlatPt(L):ppGripPt(L),L.el))]; }
function ppBez(a,b,c,t){ return ppAdd(ppAdd(ppMul(a,(1-t)*(1-t)),ppMul(b,2*t*(1-t))),ppMul(c,t*t)); }
/* both hands from the right hand's point and elbow pole in the torso's rest frame (the left mirrors them); one: the right only */
function ppHands(F,g,pole,one){ const H={R:{t:ppXf(F.Sp,g),pole:ppXd(F.Sp,pole)}};
  if(!one) H.L={t:ppXf(F.Sp,[-g[0],g[1],g[2]]),pole:ppXd(F.Sp,[-pole[0],pole[1],pole[2]])}; return H; }
/* both hands at a room point and pole, the left mirrored across the body's middle */
function ppHandsAt(g,pole){ return {R:{t:g,pole},L:{t:[-g[0],g[1],g[2]],pole:[-pole[0],pole[1],pole[2]]}}; }
/* standing, both feet flat. o: w (feet half-width), turn (toes out), fz [right, left] (a foot forward + or back −), fy (a
   foot lifted), fx (both feet sideways), drop (the hips sink), hz (the hips forward + or back −), hx, hinge (the torso
   tipped forward), tilt (sideways), spine, head, shrug */
function ppStand(fig,o){
  const L=RIG[fig], w=o.w==null?0.13:o.w, tn=o.turn==null?0.14:o.turn, fz=o.fz||[0,0], fy=o.fy||[0,0], tp=o.tip||[0,0], c=Math.cos(tn), sn=Math.sin(tn);
  const pose={pelvis:[o.hinge||0,o.twist||0,o.tilt||0],spine:o.spine||[0,0,0],head:o.head||[0,0,0],shrug:o.shrug||0};
  ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[o.hx||0,L.hip[1]-(o.drop||0),L.hip[2]+(o.hz||0)]);
  /* tip: the foot turned about its ball (+ the heel up, − the heel dropped below a block's edge), the toes staying put;
     toes: the toes lifted, the foot turning about its heel */
  const tz=o.toes||[0,0];
  const foot=(s,z,y,d,e)=>{ const a0=[s*(0.08*c+0.83*sn),-0.55,0.83*c-0.08*sn], lh=Math.hypot(a0[0],a0[2]), al0=Math.atan2(0.1,0.15), al=Math.atan2(-a0[1],lh)+d-e;
    const t=[s*w+(o.fx||0),L.an[1]+y,L.an[2]+z]; if(d){ t[1]+=0.181*(Math.sin(al0+d)-Math.sin(al0)); t[2]+=0.181*(Math.cos(al0)-Math.cos(al0+d)); }
    return {t,pole:[s*Math.sin(tn+0.12),0,Math.cos(tn+0.12)],aim:[a0[0]/lh*Math.cos(al),-Math.sin(al),a0[2]/lh*Math.cos(al)]}; };
  pose.feet={R:foot(1,fz[0],fy[0],tp[0],tz[0]),L:foot(-1,fz[1],fy[1],tp[1],tz[1])}; return pose;
}
/* sitting on a seat whose top is o.h high, the feet flat in front (o.fz the ankles forward, o.w half-width); o.lean tips
   the torso forward (+) or back (−) from upright */
function ppSit(fig,o){
  const L=RIG[fig], h=o.h==null?0.45:o.h, w=o.w==null?0.19:o.w, fz=o.fz==null?0.46:o.fz;
  const pose={pelvis:[(o.lean||0)-0.12,0,0],spine:o.spine||[0.02,0,0],head:o.head||[0.04,0,0],shrug:o.shrug||0};
  ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0,h+0.085,o.hz||0]);
  const foot=s=>({t:[s*w,L.an[1]-0.005,fz],pole:[s*0.25,0.5,1],aim:[s*0.08,-0.55,0.83]});
  pose.feet={R:foot(1),L:foot(-1)}; return pose;
}
/* a curl's grip (the right hand): the upper arm from the shoulder sh along ud, the forearm a radians up from straight
   down towards +z, drawn in or out to the grip's half-width x. In the torso's rest frame or the room's, as sh is */
function ppCurlGrip(L,sh,ud,a,x){
  const [la,lb]=ppArm(L), E=ppAdd(sh,ppMul(ppNorm(ud),la)), dx=Math.max(-0.9,Math.min(0.9,(x-E[0])/lb)), k=Math.sqrt(1-dx*dx);
  return ppAdd(E,[dx*lb,-Math.cos(a)*k*lb,Math.sin(a)*k*lb]); }
/* standing curls. o: x0, x1 (the grip's half-width at the bottom and the top), tw (the forearms' twist: −1.45 palms up,
   0 palms in, +1.45 palms down) */
function ppCurlPose(p,fig,o){
  const L=RIG[fig], q=ppEase(p), pose=ppStand(fig,{drop:0.012,spine:[0.03,0,0],head:[0.06,0,0]}), F=ppFrame(pose,fig);
  const g=ppCurlGrip(L,L.sh,[-0.03,-1,0.05+0.3*q],0.12+2.15*q,o.x0+(o.x1-o.x0)*q);
  pose.hands=ppHands(F,g,[0.25,-0.45,-1]); pose.set={twR:o.tw||0,twL:o.tw||0}; pose.bar=!!o.bar; return ppSolve(pose,fig);
}
/* the incline curl: lying back on a bench at o.incl, the arms hanging straight down behind the body, curling up */
function ppInclineCurlPose(p,fig,o){
  const L=RIG[fig], q=ppEase(p), pose={pelvis:[-(Math.PI/2-o.incl),0,0],spine:[-0.05,0,0],head:[-0.05,0,0],shrug:-0.01};
  ppPlace(pose,fig,[0,0.83,-0.155],[0,0.47,0.36]);
  const sh=ppShoulders(pose,fig), hip=ppXf(ppBone(boneMats(pose,fig,1),0),L.hip), ank=[0.25,0.115,hip[2]+0.43];
  pose.hands=ppHandsAt(ppCurlGrip(L,sh.R,[0.08,-1,-0.05],0.1+2.05*q,sh.R[0]+0.05),[0.2,-0.3,-1]);
  pose.feet={R:{t:ank,pole:[0.3,0.75,0.6],aim:[0.08,-0.55,0.83]},L:{t:[-ank[0],ank[1],ank[2]],pole:[-0.3,0.75,0.6],aim:[-0.08,-0.55,0.83]}};
  pose.set={twR:-1.45,twL:-1.45}; return ppSolve(pose,fig);
}
/* the preacher curl: seated high, the upper arms down a pad sloping at about 45°, the forearms swing up */
function ppPreacherPose(p,fig){
  const L=RIG[fig], q=ppEase(p), pose=ppSit(fig,{h:0.62,lean:0.45,w:0.17,fz:0.4,head:[0.12,0,0],spine:[0.08,0,0]}), sh=ppShoulders(pose,fig);
  pose.hands=ppHandsAt(ppCurlGrip(L,sh.R,[0.03,-0.66,0.75],1.0+1.5*q,0.19),[0.1,-1,0.55]);
  pose.set={twR:-1.45,twL:-1.45}; pose.bar=true; return ppSolve(pose,fig);
}
/* the concentration curl: sitting on a bench's end, leaning over, the right elbow against the inner thigh, the dumbbell
   curled in towards the chest; the left hand on the left knee */
function ppConcPose(p,fig){
  const L=RIG[fig], q=ppEase(p), [la,lb]=ppArm(L), pose=ppSit(fig,{h:0.45,lean:0.72,w:0.32,fz:0.52,head:[0.3,0,0],spine:[0.1,0,0]});
  const sh=ppShoulders(pose,fig), E=ppAdd(sh.R,[-0.03,-la*0.97,0.1]), a=0.15+2.05*q, cd=ppNorm([-0.22,0,-0.97]);   /* the forearm swings up in front of the body, towards the shoulder */
  const G=ppAdd(E,ppAdd(ppMul([0,-1,0],Math.cos(a)*lb),ppMul(cd,Math.sin(a)*lb)));
  pose.hands={R:{t:G,pole:[0.55,-0.2,0.8]},L:{t:[-0.27,0.57,0.44],pole:[-1,0.3,-0.2],flat:true}};
  pose.set={twR:-1.45}; return ppSolve(pose,fig);
}
/* wrist curls: sitting on a bench, forearms along the thighs, the bar just past the knees (o.tw palms up or down) */
function ppWristPose(p,fig,o){
  const q=ppEase(p), pose=ppSit(fig,{h:0.45,lean:0.85,w:0.15,fz:0.44,head:[0.3,0,0],spine:[0.2,0,0]});
  pose.hands=ppHandsAt([0.16,0.6+0.045*q,0.47],[0.3,-0.8,-0.5]); pose.set={twR:o.tw,twL:o.tw}; pose.bar=true; return ppSolve(pose,fig);
}
/* the standing barbell press: from the front of the shoulders, past the face, to locked out overhead; o.push dips the
   knees and drives first */
function ppOHPPose(p,fig,o){
  const q=ppEase(o.push?Math.max(0,(p-0.25)/0.75):p), dip=o.push?0.075*Math.sin(Math.min(1,p/0.5)*Math.PI):0;
  const pose=ppStand(fig,{w:0.15,drop:0.01+dip,hz:dip*0.25,head:[0.03-0.12*(1-q)*(1-q),0,0]}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,ppBez([0.25,1.47,0.125],[0.25,1.71,0.19],[0.25,1.875,-0.015],q),ppNorm(ppLerp([0.4,-0.55,0.75],[1,-0.3,-0.1],q)));
  pose.bar=true; return ppSolve(pose,fig);
}
/* seated dumbbell presses on an upright bench: from the shoulders (o.arnold: from in front of the face, palms in, turning
   out on the way up) to locked out overhead */
function ppSeatPressPose(p,fig,o){
  const q=ppEase(p), pose=ppSit(fig,{h:0.45,lean:0.08,w:0.21,fz:0.47}), F=ppFrame(pose,fig);
  const g=o.arnold?ppBez([0.14,1.46,0.16],[0.3,1.68,0.14],[0.33,1.84,0.13],q):ppBez([0.34,1.43,0.03],[0.33,1.68,0.07],[0.33,1.84,0.13],q);   // the lockout above the shoulders, a little wide and forward
  pose.hands=ppHands(F,g,o.arnold?ppNorm(ppLerp([0.2,-0.75,0.65],[1,-0.4,0.05],q)):[1,-0.45,0.08]);
  if(o.arnold) pose.set={twR:-1.4*(1-q),twL:-1.4*(1-q)}; return ppSolve(pose,fig);
}
function ppMachShPose(p,fig){
  const q=ppEase(p), pose=ppSit(fig,{h:0.47,w:0.2,fz:0.47}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,ppBez([0.3,1.42,0.09],[0.29,1.66,0.09],[0.27,1.865,0.07],q),[1,-0.5,0.2]); return ppSolve(pose,fig);
}
/* the seated Smith press: the bar runs straight up and down in front of the face */
function ppSmithShPose(p,fig){
  const q=ppEase(p), pose=ppSit(fig,{h:0.45,lean:0.06,w:0.21,fz:0.47}), sh=ppShoulders(pose,fig);
  const z=(sh.R[2]+sh.L[2])/2+0.13, y0=sh.R[1]+0.08, y1=sh.R[1]+0.46;
  pose.hands=ppHandsAt([0.26,y0+(y1-y0)*q,z],[0.55,-0.6,0.55]); pose.bar=true; return ppSolve(pose,fig);
}
/* the landmine press: a bar's end in a pivot on the floor in front, the other end in both hands at the chest, pressed up
   and forward along its arc. The arc (pivot A, radius, start and end angles) from the standing pose's shoulders */
function ppLandmineArc(fig){ const c=ppLandmineArc.c||(ppLandmineArc.c={}); if(c[fig]) return c[fig];
  const pose=ppStand(fig,{w:0.16,fz:[0.06,-0.12],hinge:0.1}), sh=ppShoulders(pose,fig), m=ppLerp(sh.R,sh.L,0.5);
  const b=ppAdd(m,[0,-0.06,0.17]), t=ppAdd(m,[0,0.22,0.4]), y0=0.05, za=((t[1]-y0)**2-(b[1]-y0)**2+t[2]**2-b[2]**2)/(2*(t[2]-b[2])), A=[0,y0,za];
  const ang=v=>Math.atan2(v[1]-y0,za-v[2]); return c[fig]={pose,A,r:ppLen(ppSub(b,A)),a0:ang(b),a1:ang(t)}; }
function ppLandminePose(p,fig){
  const q=ppEase(p), M=ppLandmineArc(fig), a=M.a0+(M.a1-M.a0)*q, h=[0,M.A[1]+Math.sin(a)*M.r,M.A[2]-Math.cos(a)*M.r];
  const pose=ppStand(fig,{w:0.16,fz:[0.06,-0.12],hinge:0.1});
  pose.hands={R:{t:ppAdd(h,[0.045,0,0]),pole:[0.6,-0.8,0.1]},L:{t:ppAdd(h,[-0.045,0,0]),pole:[-0.6,-0.8,0.1]}}; return ppSolve(pose,fig);
}
/* raises with near-straight arms: o.side (lateral, in the shoulder blade's plane) or to the front; o.one the right arm only */
function ppRaisePose(p,fig,o){
  const L=RIG[fig], q=ppEase(p), r=0.95*ppReach(L), a=0.22+(o.top||1.3)*q;
  const pose=ppStand(fig,o.stand||{drop:0.015,spine:[0.06,0,0]}), F=ppFrame(pose,fig);
  const g=o.side?ppAdd(L.sh,[Math.sin(a)*r,-Math.cos(a)*r,0.12*Math.sin(a)*r]):ppAdd(L.sh,[o.x!=null?o.x-L.sh[0]:0.035,-Math.cos(a)*r,Math.sin(a)*r]);
  pose.hands=ppHands(F,g,o.side?[0.1,0.2,-1]:[1,-0.35,-0.2],o.one);
  if(o.post) pose.hands.L={t:o.post,pole:[-0.3,-1,-0.2]};
  pose.set={twR:o.tw||0,twL:o.tw||0}; pose.bar=!!o.bar; return ppSolve(pose,fig);
}
/* the machine lateral raise: seated, elbows bent, the upper arms lift the pads out to the sides */
function ppMachRaisePose(p,fig){
  const L=RIG[fig], q=ppEase(p), [la,lb]=ppArm(L), pose=ppSit(fig,{h:0.47,lean:0.04,w:0.2,fz:0.47}), F=ppFrame(pose,fig);
  const a=0.18+1.3*q, E=ppAdd(L.sh,[Math.sin(a)*la,-Math.cos(a)*la,0.02]);
  pose.hands=ppHands(F,ppAdd(E,[-0.03,0.02,lb*0.99]),[Math.sin(a),-Math.cos(a),-0.25]); return ppSolve(pose,fig);
}
/* the wide-grip upright row: the bar from the thighs to the lower chest, the elbows leading high and out */
function ppUprightPose(p,fig){
  const q=ppEase(p), pose=ppStand(fig,{w:0.14,drop:0.015}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,ppBez([0.3,0.9,0.12],[0.31,1.1,0.16],[0.29,1.29,0.13],q),ppNorm(ppLerp([1,-0.2,-0.3],[1,0.85,-0.2],q))); pose.bar=true; return ppSolve(pose,fig);
}
/* shrugs: the shoulders lift, the arms hang straight (o.x, o.z: the hands' place, in front for a bar, by the sides for dumbbells) */
function ppShrugPose(p,fig,o){
  const q=ppEase(p), s=0.055*q, pose=ppStand(fig,{w:0.14,drop:0.01,shrug:s,head:[0.06,0,0]}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,[o.x,0.885+s,o.z],[0.3,-0.2,-1]); pose.bar=!!o.bar; return ppSolve(pose,fig);
}
/* the overhead dumbbell extension, one arm (two hands on one dumbbell hide it behind the forearms): the elbow up by the
   head, the forearm lowers the dumbbell behind it and presses it back up; the other hand on the hip */
function ppOHExtPose(p,fig){
  const L=RIG[fig], q=ppEase(p), [la,lb]=ppArm(L), pose=ppStand(fig,{w:0.14,drop:0.012,spine:[-0.04,0,0],head:[0.05,0,0]}), F=ppFrame(pose,fig);
  const E=ppAdd(L.sh,ppMul(ppNorm([-0.1,1,0.5]),la)), a=1.75*(1-q)+0.1, dx=Math.max(-0.9,Math.min(0.9,(0.1-E[0])/lb)), k=Math.sqrt(1-dx*dx);
  pose.hands=ppHands(F,ppAdd(E,[dx*lb,Math.cos(a)*k*lb,-Math.sin(a)*k*lb]),[0.1,0.55,1],true); pose.hands.L={t:ppXf(F.Sp,[-0.2,1.0,0.07]),pole:ppXd(F.Sp,[-1,0,-0.6]),flat:true};
  pose.set={twR:0.6}; return ppSolve(pose,fig);
}
/* the farmer's carry: walking on the spot with a heavy dumbbell in each hand */
function ppCarryPose(p,fig,t){
  const s=Math.sin(t*4.2), up=v=>Math.max(0,v), pose=ppStand(fig,{w:0.12,fy:[0.07*up(s),0.07*up(-s)],fz:[0.05*up(s),0.05*up(-s)],shrug:0.012,tilt:0.025*s}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,[0.36,0.895,0.0],[0.3,-0.2,-1]); return ppSolve(pose,fig);
}

/* ---------- batch 2's kit ---------- */
/* a dumbbell in a hand: the handle through the fist, along its line */
function ppHandDB(K,B,fig,S,sc){ const L=RIG[fig], s=S==="R"?1:-1, G=ppGripPt(L), g=ppXf(ppBone(B,S==="R"?3:5),[s*G[0],G[1],G[2]]);
  K.dumbbell(g,ppFistAxis(B,fig,S),sc); }
/* kit makers: dumbbells in the hands (o.one "R" for one; o.sc their size), a barbell through the grips; o.with adds a bench or a frame */
function ppDBs(o){ o=o||{}; return (st,K)=>{ ["R","L"].forEach(S=>{ if(!o.one||o.one===S) ppHandDB(K,st.B,st.fig,S,o.sc); }); if(o.with) o.with(st,K); }; }
function ppBB(o){ o=o||{}; return (st,K)=>{ const g=ppGrips(st.B,st.fig); K.barbell(g.R,g.L,o); if(o.with) o.with(st,K); }; }
/* a flat bench along z, its pad from z0 to z1 */
function ppFlatBench(K,z0,z1,h){ h=h||0.45; K.box([-0.145,h-0.075,z0],[0.145,h,z1],1);
  [z0+0.12,z1-0.12].forEach(z=>{ K.post([0,h-0.075,z],0.06,2); K.box([-0.24,0,z-0.03],[0.24,0.04,z+0.03],2); }); }
/* an upright bench under a seated body: the seat under the hips, the back pad behind the back (the pelvis frame) */
function ppUprightKit(K,B,o){ o=o||{}; const P=ppBone(B,0), y=ppXf(P,[0,0.79,-0.1])[1]-0.005;
  K.box([-0.17,y-0.075,-0.2],[0.17,y,0.24],1); K.post([0,y-0.075,0.03],0.06,2); K.box([-0.24,0,0.0],[0.24,0.04,0.06],2); K.box([-0.03,0,-0.36],[0.03,0.04,0.06],2);
  if(o.back!==false){ K.box([-0.16,0.95,-0.255],[0.16,1.72,-0.175],1,P); const bp=ppXf(P,[0,1.0,-0.26]); K.post([0,bp[1],bp[2]],0.06,2); K.box([-0.24,0,bp[2]-0.03],[0.24,0.04,bp[2]+0.03],2); } }
/* a backpack held by its top loop */
function ppPackKit(st,K){ const g=ppGrips(st.B,st.fig), c=ppLerp(g.R,g.L,0.5);
  K.bar([c[0]-0.07,c[1],c[2]],[c[0]+0.07,c[1],c[2]],0.013,1); [-1,1].forEach(s=>K.bar([c[0]+s*0.07,c[1],c[2]],[c[0]+s*0.11,c[1]-0.11,c[2]+0.04],0.01,1));
  K.box([c[0]-0.16,c[1]-0.52,c[2]+0.06],[c[0]+0.16,c[1]-0.1,c[2]+0.23],1); K.box([c[0]-0.12,c[1]-0.42,c[2]+0.23],[c[0]+0.12,c[1]-0.2,c[2]+0.27],1); }
/* the preacher bench: a high seat and a pad sloping down under the upper arms; o.mach adds the machine's levers and handle */
function ppPreacherKit(o){ return (st,K)=>{ const B=st.B, L=RIG[st.fig], P=ppBone(B,0), y=ppXf(P,[0,0.79,-0.1])[1]-0.005;
  const sR=ppXf(ppBone(B,2),L.sh), eR=ppXf(ppBone(B,2),L.el), sL=ppXf(ppBone(B,4),[-L.sh[0],L.sh[1],L.sh[2]]), eL=ppXf(ppBone(B,4),[-L.el[0],L.el[1],L.el[2]]);
  const s=ppLerp(sR,sL,0.5), e=ppLerp(eR,eL,0.5), d=ppNorm(ppSub(e,s)), n=ppNorm(ppCross(d,[1,0,0])), up=n[1]>0?n:ppMul(n,-1);
  /* the pad's top runs under the upper arms from where they leave the chest to past the elbows (its top edge in the armpits) */
  const a=ppAdd(ppAdd(s,ppMul(d,0.04)),ppMul(up,-0.05)), b=ppAdd(ppAdd(e,ppMul(d,0.15)),ppMul(up,-0.05));
  K.slab(a,b,0.5,0.08,up,1); const lo=ppAdd(ppLerp(a,b,0.55),ppMul(up,-0.08)); K.post(lo,0.06,2);
  K.box([-0.16,y-0.075,-0.18],[0.16,y,0.18],1); K.post([0,y-0.075,0],0.06,2); K.box([-0.03,0,-0.1],[0.03,0.04,lo[2]+0.05],2); K.box([-0.26,0,-0.03],[0.26,0.04,0.03],2);
  K.box([-0.26,0,lo[2]-0.03],[0.26,0.04,lo[2]+0.03],2);
  const g=ppGrips(B,st.fig);
  if(!o.mach){ K.barbell(g.R,g.L,{r:0.12,half:0.42}); return; }
  /* the machine: a hub at each elbow, a lever out to the handle, a frame and the weight stack in front */
  [[1,g.R,eR],[-1,g.L,eL]].forEach(([sd,gp,ep])=>{ const pv=ppAdd(ep,[sd*0.1,0,0]); K.bar(ppAdd(pv,[-sd*0.03,0,0]),ppAdd(pv,[sd*0.05,0,0]),0.06,0); K.bar(pv,ppAdd(gp,[sd*0.1,0,0]),0.026,0); });
  K.bar(ppAdd(g.R,[0.1,0,0]),ppAdd(g.L,[-0.1,0,0]),0.02,0);
  const hz=(eR[2]+eL[2])/2, hy=(eR[1]+eL[1])/2; K.box([-0.62,0,hz-0.12],[-0.4,1.35,hz+0.12],1); K.box([-0.66,1.35,hz-0.15],[-0.36,1.42,hz+0.15],2); K.bar([-0.4,hy,hz],[eL[0]-0.15,hy,hz],0.03,2); }; }
/* the landmine: a pivot on the floor, the bar up to the hands, a plate near the loaded end */
function ppLandmineKit(st,K){ const g=ppGrips(st.B,st.fig), h=ppLerp(g.R,g.L,0.5), A=ppLandmineArc(st.fig).A, d=ppNorm(ppSub(h,A)), at=x=>ppAdd(h,ppMul(d,x));
  K.box([A[0]-0.1,0,A[2]-0.1],[A[0]+0.1,0.05,A[2]+0.1],2); K.bar([A[0],0.05,A[2]],[A[0],0.1,A[2]],0.035,2);
  K.bar(A,at(-0.4),0.0135,0); K.bar(at(-0.4),at(0.05),0.025,0); K.bar(at(-0.44),at(-0.4),0.04,0); K.bar(at(-0.39),at(-0.34),0.17,0); }
/* a seated shoulder-press machine: the bench, a frame behind, a handle in each fist on a lever from a pivot low behind */
function ppMachShKit(st,K){ const B=st.B, L=RIG[st.fig], G=ppGripPt(L); ppUprightKit(K,B,{});
  [[1,"R"],[-1,"L"]].forEach(([s,S])=>{ const g=ppXf(ppBone(B,S==="R"?3:5),[s*G[0],G[1],G[2]]), ax=ppFistAxis(B,st.fig,S);
    K.bar(ppAdd(g,ppMul(ax,-0.075)),ppAdd(g,ppMul(ax,0.075)),0.017,0); const o=ppAdd(g,[s*0.1,0,0]); K.bar(g,o,0.02,0); K.bar(o,[s*0.42,1.1,-0.42],0.024,0);
    K.box([s*0.42-0.035,0,-0.46],[s*0.42+0.035,1.95,-0.39],2); });
  K.box([-0.45,1.92,-0.46],[0.45,1.98,-0.39],2); }
/* the Smith machine's rails at the bar's depth */
function ppSmithRails(K,z){ [-1,1].forEach(s=>{ K.bar([s*0.62,0,z],[s*0.62,2.1,z],0.022,2); K.box([s*0.62-0.05,2.1,z-0.05],[s*0.62+0.05,2.14,z+0.05],2); K.box([s*0.62-0.05,0,z-0.25],[s*0.62+0.05,0.04,z+0.25],2); }); }
/* the machine lateral raise: the bench, pads on the outside of the upper arms on levers from pivots behind the shoulders */
function ppMachRaiseKit(st,K){ const B=st.B, L=RIG[st.fig]; ppUprightKit(K,B,{});
  [[1,2],[-1,4]].forEach(([s,bi])=>{ const U=ppBone(B,bi), mr=v=>[s*v[0],v[1],v[2]];
    K.box(mr([0.29,1.1,-0.09]),mr([0.36,1.3,0.05]),1,U);
    const pv=ppXf(U,mr([L.sh[0],L.sh[1],L.sh[2]-0.18])), pd=ppXf(U,mr([0.33,1.2,-0.09])); K.bar(pv,pd,0.026,0); K.bar(ppAdd(pv,[0,0,-0.05]),ppAdd(pv,[0,0,0.03]),0.05,0); }); }

/* batch 2's moves. Cameras: yaw round the body (0 the front, + towards its right), pitch looking down */
function ppMoves2(){
  const mv=(f,cam,kit)=>({view:cam.yaw,cam,f,kit});
  const cS={yaw:0.75,pitch:0.07}, cSeat={yaw:0.62,pitch:0.1}, cSide={yaw:1.15,pitch:0.07}, cFront={yaw:0.3,pitch:0.07};
  const bench=(st,K)=>ppFlatBench(K,-1.05,0.17);
  return {
    curl_bb:mv((p,t,fig)=>ppCurlPose(p,fig,{x0:0.24,x1:0.22,tw:-1.45,bar:true}),cS,ppBB({r:0.15,half:0.55})),
    curl_ez:mv((p,t,fig)=>ppCurlPose(p,fig,{x0:0.2,x1:0.18,tw:-1.15,bar:true}),cS,ppBB({r:0.13,half:0.42})),
    curl_rev:mv((p,t,fig)=>ppCurlPose(p,fig,{x0:0.24,x1:0.22,tw:1.45,bar:true}),cS,ppBB({r:0.15,half:0.55})),
    curl_db:mv((p,t,fig)=>ppCurlPose(p,fig,{x0:0.34,x1:0.26,tw:-1.45}),cS,ppDBs()),
    curl_hammer:mv((p,t,fig)=>ppCurlPose(p,fig,{x0:0.32,x1:0.28,tw:0}),cS,ppDBs()),
    curl_pack:mv((p,t,fig)=>ppCurlPose(p,fig,{x0:0.1,x1:0.09,tw:-1.2}),cS,ppPackKit),
    curl_inc:mv((p,t,fig)=>ppInclineCurlPose(p,fig,{incl:0.8}),{yaw:0.95,pitch:0.28},ppDBs({with:(st,K)=>ppBenchKit(K,st.B,{incl:0.8})})),
    curl_preach:mv((p,t,fig)=>ppPreacherPose(p,fig),{yaw:1.1,pitch:0.14},ppPreacherKit({})),
    curl_mach:mv((p,t,fig)=>ppPreacherPose(p,fig),{yaw:1.1,pitch:0.14},ppPreacherKit({mach:true})),
    curl_conc:mv((p,t,fig)=>ppConcPose(p,fig),{yaw:0.55,pitch:0.2},ppDBs({one:"R",with:bench})),
    wrist_up:mv((p,t,fig)=>ppWristPose(p,fig,{tw:-1.45}),{yaw:0.9,pitch:0.3},ppBB({r:0.13,half:0.5,with:bench})),
    wrist_down:mv((p,t,fig)=>ppWristPose(p,fig,{tw:1.45}),{yaw:0.9,pitch:0.3},ppBB({r:0.13,half:0.5,with:bench})),
    ohp:mv((p,t,fig)=>ppOHPPose(p,fig,{}),{yaw:0.95,pitch:0.06},ppBB({})),
    push_press:mv((p,t,fig)=>ppOHPPose(p,fig,{push:true}),{yaw:0.95,pitch:0.06},ppBB({})),
    press_db_seat:mv((p,t,fig)=>ppSeatPressPose(p,fig,{}),cSeat,ppDBs({with:(st,K)=>ppUprightKit(K,st.B,{})})),
    press_arnold:mv((p,t,fig)=>ppSeatPressPose(p,fig,{arnold:true}),cSeat,ppDBs({with:(st,K)=>ppUprightKit(K,st.B,{})})),
    press_mach_sh:mv((p,t,fig)=>ppMachShPose(p,fig),cSeat,ppMachShKit),
    press_smith_sh:mv((p,t,fig)=>ppSmithShPose(p,fig),cSeat,ppBB({with:(st,K)=>{ ppUprightKit(K,st.B,{}); const g=ppGrips(st.B,st.fig); ppSmithRails(K,(g.R[2]+g.L[2])/2); }})),
    press_landmine:mv((p,t,fig)=>ppLandminePose(p,fig),{yaw:0.85,pitch:0.14},ppLandmineKit),
    raise_lat_db:mv((p,t,fig)=>ppRaisePose(p,fig,{side:true,top:1.3}),{yaw:0.62,pitch:0.07},ppDBs({sc:0.75})),
    raise_lean:mv((p,t,fig)=>ppRaisePose(p,fig,{side:true,top:1.35,one:true,stand:{drop:0.015,tilt:-0.2,fx:-0.08,spine:[0.04,0,0]},post:[-0.56,1.15,0.0]}),{yaw:0.55,pitch:0.07},ppDBs({one:"R",sc:0.75,with:(st,K)=>K.box([-0.6,0,-0.04],[-0.52,2.0,0.04],2)})),
    raise_mach:mv((p,t,fig)=>ppMachRaisePose(p,fig),{yaw:0.45,pitch:0.1},ppMachRaiseKit),
    upright_row:mv((p,t,fig)=>ppUprightPose(p,fig),{yaw:0.45,pitch:0.06},ppBB({})),
    raise_front_db:mv((p,t,fig)=>ppRaisePose(p,fig,{side:false,top:1.4,tw:1.45}),cSide,ppDBs({sc:0.75})),
    shrug_bb:mv((p,t,fig)=>ppShrugPose(p,fig,{x:0.24,z:0.11,bar:true}),{yaw:0.5,pitch:0.07},ppBB({})),
    shrug_db:mv((p,t,fig)=>ppShrugPose(p,fig,{x:0.34,z:0.0}),{yaw:0.5,pitch:0.07},ppDBs({})),
    ohx_db:mv((p,t,fig)=>ppOHExtPose(p,fig),{yaw:2.3,pitch:0.1},ppDBs({one:"R"})),
    carry_db:mv((p,t,fig)=>ppCarryPose(p,fig,t),{yaw:0.6,pitch:0.07},ppDBs({sc:1.1})),
  };
}
function ppNames2(){ return ppNames2.m||(ppNames2.m={"barbell curl":"curl_bb","ez-bar curl":"curl_ez","reverse curl":"curl_rev","dumbbell curl":"curl_db","hammer curl":"curl_hammer",
    "backpack curl":"curl_pack","incline dumbbell curl":"curl_inc","preacher curl":"curl_preach","machine preacher curl":"curl_mach","concentration curl":"curl_conc",
    "wrist curl":"wrist_up","reverse wrist curl":"wrist_down","overhead press":"ohp","push press":"push_press","seated dumbbell overhead press":"press_db_seat",
    "arnold press":"press_arnold","machine shoulder press":"press_mach_sh","smith machine shoulder press":"press_smith_sh","landmine press":"press_landmine",
    "lateral raise":"raise_lat_db","lean-away lateral raise":"raise_lean","machine lateral raise":"raise_mach","wide-grip upright row":"upright_row",
    "front raise":"raise_front_db","barbell shrug":"shrug_bb","dumbbell shrug":"shrug_db","overhead dumbbell extension":"ohx_db","farmer's carry":"carry_db"}); }
function ppMoveFor2(n){
  const ex=ppNames2();
  if(ex[n]) return ex[n];
  /* your own exercises, by their words (cable and band ones wait for their batch) */
  if(/cable|band|machine|smith/.test(n)) return null;
  if(/hammer curl/.test(n)) return "curl_hammer";
  if(/preacher/.test(n)) return "curl_preach";
  if(/(dumbbell|\bdb\b).*curl/.test(n)&&!/leg|wrist/.test(n)) return "curl_db";
  if(/(barbell|ez).*curl/.test(n)&&!/leg|wrist/.test(n)) return "curl_bb";
  if(/(dumbbell|\bdb\b).*(lateral|side) raise/.test(n)) return "raise_lat_db";
  if(/(dumbbell|\bdb\b).*front raise/.test(n)) return "raise_front_db";
  if(/(dumbbell|\bdb\b).*shrug/.test(n)) return "shrug_db";
  if(/(barbell|trap bar).*shrug/.test(n)) return "shrug_bb";
  if(/farmer/.test(n)) return "carry_db";
  return null;
}

/* =========================================================
   ROWS AND PULLDOWNS (batch 3, 21 Oct): bent-over rows, rows on a bench, cable and machine rows, pulldowns, pull-ups,
   chin-ups, the dead hang, the inverted row, face pulls, rear-delt flies, the band pull-apart, prone raises
   ========================================================= */
/* bent over: the torso tipped forward o.hinge, knees soft, the hips back so the shoulders sit over the feet */
function ppBentBase(fig,o){ return ppStand(fig,{w:o.w||0.15,hinge:o.hinge||1.0,drop:o.drop==null?0.11:o.drop,hz:o.hz==null?-0.28:o.hz,spine:[0.06,0,0],head:[-0.28,0,0],fz:o.fz,fy:o.fy}); }
/* lying face down, the head towards +z: o.y the hips' height (0.115 on the floor), o.lift the chest off the floor */
function ppProneBase(fig,o){ const L=RIG[fig], pose={pelvis:[Math.PI/2-(o.lift||0),0,0],spine:[-(o.arch||0),0,0],head:o.head||[-0.25,0,0],shrug:0};
  ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0,o.y==null?0.115:o.y,0]); return pose; }
/* hanging from a bar: the shoulders at sy (o.sz forward), knees bent behind (o.th, o.kn) */
function ppHangBase(fig,o){ const pose={pelvis:[o.lean||0,0,0],spine:[-0.04-(o.arch||0),0,0],head:o.head||[-0.06,0,0],shrug:o.shrug||0,
    thR:[o.th||-0.28,0,0],thL:[o.th||-0.28,0,0],shR:[o.kn||0.8,0,0],shL:[o.kn||0.8,0,0],ftR:[0.45,0,0],ftL:[0.45,0,0]};
  return ppPlace(pose,fig,[0,RIG[fig].sh[1],RIG[fig].sh[2]],[0,o.sy,o.sz||0],1); }
/* a row's hand path: from hanging straight under the shoulder (room) to a point on the torso (its rest frame) */
function ppRowHands(pose,fig,q,x,top,pole,one){ const F=ppFrame(pose,fig), sh=ppShoulders(pose,fig), H={};
  [["R",1,sh.R],["L",-1,sh.L]].forEach(([S,s,S0])=>{ if(one&&S==="L") return; const lo=[s*x,S0[1]-0.5,S0[2]+0.02], hi=ppXf(F.Sp,[s*top[0],top[1],top[2]]);
    H[S]={t:ppLerp(lo,hi,q),pole:ppXd(F.Sp,[s*pole[0],pole[1],pole[2]])}; }); return H; }
function ppBarRowPose(p,fig,o){ const q=ppEase(p), pose=ppBentBase(fig,{hinge:1.0});
  pose.hands=ppRowHands(pose,fig,q,o.x,[o.x,1.06,0.17],[0.3,-0.15,-1]); if(o.tw) pose.set={twR:o.tw,twL:o.tw}; pose.bar=true; return ppSolve(pose,fig); }
/* the T-bar row: straddling a bar pivoted on the floor behind, a close handle pulled to the chest along the bar's arc */
function ppTBarArc(fig){ const c=ppTBarArc.c||(ppTBarArc.c={}); if(c[fig]) return c[fig];
  const pose=ppBentBase(fig,{hinge:0.95,w:0.2}), sh=ppShoulders(pose,fig), m=ppLerp(sh.R,sh.L,0.5), A=[0,0.05,-1.0];
  const lo=[0,m[1]-0.5,m[2]+0.02], r=ppLen(ppSub(lo,A)), hiY=m[1]-0.21, hi=[0,hiY,A[2]+Math.sqrt(Math.max(0.01,r*r-(hiY-A[1])**2))];
  return c[fig]={pose,A,r,lo,hi}; }
function ppTBarPose(p,fig){ const q=ppEase(p), T=ppTBarArc(fig), a0=Math.atan2(T.lo[1]-T.A[1],T.lo[2]-T.A[2]), a1=Math.atan2(T.hi[1]-T.A[1],T.hi[2]-T.A[2]), a=a0+(a1-a0)*q;
  const h=[0,T.A[1]+Math.sin(a)*T.r,T.A[2]+Math.cos(a)*T.r], pose=ppBentBase(fig,{hinge:0.95,w:0.2});
  pose.hands={R:{t:ppAdd(h,[0.075,-0.03,0]),pole:[0.35,0.55,-0.75]},L:{t:ppAdd(h,[-0.075,-0.03,0]),pole:[-0.35,0.55,-0.75]}}; return ppSolve(pose,fig); }
/* the single-arm dumbbell row: left knee and hand on a bench, right foot on the floor, the right arm rows */
function ppOneArmRowPose(p,fig){ const L=RIG[fig], q=ppEase(p);
  const pose={pelvis:[1.38,0,0.04],spine:[0.04,0,0],head:[-0.35,0,0],shrug:0}; ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0.02,0.8,-0.1]);
  const sh=ppShoulders(pose,fig), F=ppFrame(pose,fig);
  pose.feet={R:{t:[0.27,L.an[1],-0.32],pole:[0.3,0.2,1],aim:[0.15,-0.55,0.82]},L:{t:[-0.13,0.53,-0.62],pole:[0,-0.2,1],aim:[0,-0.8,-0.6]}};
  pose.hands={R:{t:ppLerp([sh.R[0]+0.02,sh.R[1]-0.5,sh.R[2]+0.03],ppXf(F.Sp,[0.24,1.0,0.02]),q),pole:ppXd(F.Sp,[0.15,-0.1,-1])},L:{t:[-0.16,0.5,sh.L[2]+0.04],pole:[-0.6,0.2,-0.6],flat:true}};
  return ppSolve(pose,fig); }
/* the chest-supported row: chest on an incline pad, feet on the floor behind, dumbbells rowed to the ribs */
function ppChestRowPose(p,fig){ const q=ppEase(p), pose=ppStand(fig,{w:0.17,hinge:0.92,drop:0.04,hz:-0.32,fz:[-0.08,-0.08],spine:[-0.04,0,0],head:[-0.35,0,0]});
  pose.hands=ppRowHands(pose,fig,q,0.27,[0.25,1.08,0.04],[0.25,-0.1,-1]); return ppSolve(pose,fig); }
/* the seated cable row: on a low bench, feet on the plate, a close handle from arms long to the stomach */
function ppCableRowPose(p,fig){ const q=ppEase(p), L=RIG[fig];
  const pose={pelvis:[-0.12+0.32*(1-q),0,0],spine:[0.06*(1-q),0,0],head:[0.05,0,0],shrug:0}; ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0,0.42,0]);
  const hy=0.78, hz=0.57-0.42*q;
  pose.feet={R:{t:[0.14,0.27,0.7],pole:[0.2,1,0.1],aim:[0.06,0.8,0.6]},L:{t:[-0.14,0.27,0.7],pole:[-0.2,1,0.1],aim:[-0.06,0.8,0.6]}};
  pose.hands={R:{t:[0.075,hy,hz],pole:[0.3,-0.6,-0.75]},L:{t:[-0.075,hy,hz],pole:[-0.3,-0.6,-0.75]}}; return ppSolve(pose,fig); }
/* the machine row: seated, the chest on a pad, the handles pulled from arms long to beside the ribs */
function ppMachRowPose(p,fig){ const q=ppEase(p), pose=ppSit(fig,{h:0.47,lean:0.12,w:0.2,fz:0.44});
  pose.hands=ppHandsAt([0.21,1.0,0.62-0.4*q],[0.35,-0.5,-0.8]); return ppSolve(pose,fig); }
/* lat pulldowns: seated under the thigh roller, the bar from arms long overhead to the top of the chest; o.x the grip */
function ppPulldownPose(p,fig,o){ const q=ppEase(p), pose=ppSit(fig,{h:0.47,lean:-0.1-0.12*q,w:0.17,fz:0.42,head:[-0.12,0,0]});
  const sh=ppShoulders(pose,fig), m=ppLerp(sh.R,sh.L,0.5), x=o.x, top=[x,m[1]+Math.sqrt(Math.max(0.05,0.27-(x-0.21)*(x-0.21))),m[2]+0.08], low=[x,m[1]+0.02,m[2]+0.2];
  pose.hands=ppHandsAt(ppLerp(top,low,q),x>0.2?[1,-0.6,-0.2]:[0.4,-0.6,0.5]); if(o.tw) pose.set={twR:o.tw,twL:o.tw}; pose.bar=o.x>0.2; return ppSolve(pose,fig); }
/* the straight-arm pulldown: hinged a little, arms long, the bar swept from head height down to the thighs */
function ppStraightPullPose(p,fig){ const L=RIG[fig], q=ppEase(p), r=0.96*ppReach(L), a=1.95-1.6*q;
  const pose=ppStand(fig,{w:0.15,hinge:0.32,drop:0.05,hz:-0.08,spine:[0.04,0,0],head:[-0.15,0,0]}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,ppAdd(L.sh,[0.0,-Math.cos(a)*r,Math.sin(a)*r]),[0.4,-0.6,-0.6]); pose.bar=true; return ppSolve(pose,fig); }
/* pull-ups and chin-ups: hanging from the bar at PP_BAR, the shoulders from arms long up until the chin clears it;
   o.hang the dead hang (the shoulder blades only), o.knee kneeling on the assist pad */
function ppPullPose(p,fig,o){ const q=ppEase(o.hang?p*0.12:p), sy=ppBarY()-0.52+0.36*q+(o.hang?0.02-0.05*p:0);
  const pose=ppHangBase(fig,{sy,sz:-0.06-0.02*q,lean:-0.1-0.04*q,arch:0.16-0.08*q,head:[-0.1*q,0,0],shrug:o.hang?0.03-0.05*p:0.02-0.03*q,th:o.knee?-1.35:null,kn:o.knee?1.5:null});
  pose.free=true; pose.hands=ppHandsAt([o.x,ppBarY(),0.04],o.chin?[0.25,-0.6,0.75]:[1,-0.5,0.1]); if(o.tw) pose.set={twR:o.tw,twL:o.tw}; pose.bar=true; return ppSolve(pose,fig); }
function ppBarY(){ return 2.32; }
/* the inverted row: under a bar at hip height, heels on the floor, the body straight, the chest pulled to the bar */
function ppInvRowArc(fig){ const c=ppInvRowArc.c||(ppInvRowArc.c={}); if(c[fig]) return c[fig];
  const L=RIG[fig], heel=[L.an[0],0.0,L.an[2]-0.06], d=ppSub(L.sh,heel);
  return c[fig]={heel,R:Math.hypot(d[1],d[2]),dl:Math.atan2(d[2],d[1]),hb:0.95}; }
function ppInvRowAt(fig,want){ const I=ppInvRowArc(fig), phi=Math.asin(Math.max(-1,Math.min(1,want/I.R)))-I.dl, pose={pelvis:[-(Math.PI/2-phi),0,0],head:[0.15,0,0],shrug:0};
  return ppPlace(pose,fig,I.heel,[I.heel[0],0.035,0.95],8); }
function ppInvRowTop(fig){ const c=ppInvRowTop.c||(ppInvRowTop.c={}); if(c[fig]!=null) return c[fig];
  const I=ppInvRowArc(fig), sh=ppShoulders(ppInvRowAt(fig,I.hb-0.12-0.035),fig); return c[fig]=(sh.R[2]+sh.L[2])/2+0.1; }
function ppInvRowPose(p,fig){ const q=ppEase(p), I=ppInvRowArc(fig), pose=ppInvRowAt(fig,I.hb-0.5+0.38*q-0.035);
  pose.hands=ppHandsAt([0.3,I.hb,ppInvRowTop(fig)],[0.7,-0.6,0.3]); pose.bar=true; return ppSolve(pose,fig); }
/* the face pull: a rope from a high pulley pulled to the face, the elbows high and wide */
function ppFacePullPose(p,fig){ const q=ppEase(p), pose=ppStand(fig,{w:0.15,fz:[0.08,-0.1],hz:-0.03,spine:[-0.04,0,0]}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,ppBez([0.08,1.48,0.47],[0.26,1.6,0.32],[0.27,1.6,0.06],q),ppNorm(ppLerp([0.6,-0.2,-0.4],[1,0.55,-0.4],q))); pose.set={twR:0.5*q,twL:0.5*q}; return ppSolve(pose,fig); }
/* bent-over work for the rear delts: o.fly (arms near straight, swung out) or a wide row (elbows flared) */
function ppRearPose(p,fig,o){ const q=ppEase(p), pose=ppBentBase(fig,{hinge:1.2,drop:0.12,hz:-0.3}), sh=ppShoulders(pose,fig), F=ppFrame(pose,fig), r=0.94*ppReach(RIG[fig]), H={};
  [["R",1,sh.R],["L",-1,sh.L]].forEach(([S,s,S0])=>{
    if(o.fly){ const a=0.12+1.3*q; H[S]={t:ppAdd(S0,[s*Math.sin(a)*r,-Math.cos(a)*r,0.05]),pole:[0,0.3,-1]}; }
    else { const lo=[s*0.26,S0[1]-0.5,S0[2]+0.03], hi=ppXf(F.Sp,[s*0.38,1.3,0.08]); H[S]={t:ppLerp(lo,hi,q),pole:ppXd(F.Sp,[s*1,0,-0.5])}; } });
  pose.hands=H; return ppSolve(pose,fig); }
/* arms swung back out to the sides at shoulder height: the band pull-apart, the reverse pec deck, the cable rear-delt fly */
function ppPullApartPose(p,fig,o){ const L=RIG[fig], q=ppEase(p), r=0.95*ppReach(L), a=0.22+1.3*q;
  const pose=o.seat?ppSit(fig,{h:0.47,lean:0.06,w:0.2,fz:0.44}):ppStand(fig,{w:0.15,drop:0.015}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,ppAdd(L.sh,[Math.sin(a)*r,-0.05,Math.cos(a)*r]),[0,-1,-0.25]); pose.set={twR:o.tw||0,twL:o.tw||0}; return ppSolve(pose,fig); }
/* prone raises on the floor: arms out in a T (or overhead in a Y), lifted a hand's height */
function ppProneRaisePose(p,fig,o){ const L=RIG[fig], q=ppEase(p), r=0.97*ppReach(L,true), pose=ppProneBase(fig,{head:[-0.3,0,0],lift:0.04*q,arch:0.06*q}), sh=ppShoulders(pose,fig);
  const a=o.y?0.75:0, H={}; [["R",1,sh.R],["L",-1,sh.L]].forEach(([S,s,S0])=>{ H[S]={t:[S0[0]+s*Math.cos(a)*r,0.06+0.13*q,S0[2]+Math.sin(a)*r],pole:[0,1,-0.2]}; });
  pose.hands=H; const k=ppXf(ppBone(boneMats(pose,fig,1),0),L.hip);
  pose.feet={R:{t:[0.16,0.06,k[2]-0.78],pole:[0,-1,0],aim:[0,-0.2,-1]},L:{t:[-0.16,0.06,k[2]-0.78],pole:[0,-1,0],aim:[0,-0.2,-1]}};
  pose.flat=true; pose.set={twR:o.y?1.4:0.9,twL:o.y?1.4:0.9}; return ppSolve(pose,fig); }

/* ---------- batch 3's kit ---------- */
/* a cable column at (x, z) with a pulley at height y, the cable from it to the point to (where the handle clips on) */
function ppCable(K,x,z,y,to){ K.box([x-0.07,0,z-0.07],[x+0.07,2.2,z+0.07],2); K.box([x-0.22,0,z-0.2],[x+0.22,0.05,z+0.2],2);
  const d=ppNorm(ppSub(to,[x,y,z])), pu=ppAdd([x,y,z],ppMul(d,0.09)); K.bar(ppAdd([x,y,z],[0,-0.02,0]),pu,0.03,2);
  K.bar(ppAdd(pu,[-0.016,0,0]),ppAdd(pu,[0.016,0,0]),0.05,0); K.bar(pu,to,0.0055,0); }
/* handles at the grips: a straight bar, a close V-handle, a rope. Each gives back where the cable clips on */
function ppStraightBar(K,g,half){ const c=ppLerp(g.R,g.L,0.5), d=ppNorm(ppSub(g.L,g.R)); K.bar(ppAdd(c,ppMul(d,-half)),ppAdd(c,ppMul(d,half)),0.016,0); return c; }
function ppVHandle(K,B,fig){ const L=RIG[fig], g=ppGrips(B,fig), c=ppLerp(g.R,g.L,0.5), H=[];
  [[1,"R",g.R],[-1,"L",g.L]].forEach(([s,S,gp])=>{ const ax=ppFistAxis(B,fig,S);
    K.bar(ppAdd(gp,ppMul(ax,-0.065)),ppAdd(gp,ppMul(ax,0.065)),0.016,0); H.push(ppAdd(gp,ppMul(ax,0.065)),ppAdd(gp,ppMul(ax,-0.065))); });
  const tip=ppAdd(c,ppMul(ppNorm(ppSub(c,ppLerp(H[1],H[3],0.5))),0.09)); K.bar(H[0],tip,0.013,0); K.bar(H[2],tip,0.013,0); K.bar(H[1],H[3],0.013,0); return tip; }
function ppRope(K,g,clip){ [g.R,g.L].forEach(gp=>{ const d=ppNorm(ppSub(gp,clip)); K.bar(clip,gp,0.013,1); K.bar(ppAdd(gp,ppMul(d,0.01)),ppAdd(gp,ppMul(d,0.05)),0.022,1); });
  K.bar(ppAdd(clip,[0,0,-0.02]),ppAdd(clip,[0,0,0.02]),0.02,0); }
/* a pull-up frame: the bar between two posts */
function ppPullFrame(K,z,w){ w=w||0.72; const y=ppBarY(); K.bar([-w,y,z],[w,y,z],0.017,0); [-1,1].forEach(s=>{ K.box([s*w-0.04,0,z-0.04],[s*w+0.04,y+0.06,z+0.04],2); K.box([s*w-0.05,0,z-0.45],[s*w+0.05,0.05,z+0.45],2); }); }
/* the lat pulldown machine: seat, a roller over the thighs, the tall frame, the top pulley and its cable to the bar */
function ppPulldownKit(o){ return (st,K)=>{ const B=st.B, L=RIG[st.fig], P=ppBone(B,0), y=ppXf(P,[0,0.79,-0.1])[1]-0.005, g=ppGrips(B,st.fig);
  K.box([-0.18,y-0.075,-0.22],[0.18,y,0.24],1); K.post([0,y-0.075,0],0.07,2); K.box([-0.25,0,-0.03],[0.25,0.05,0.03],2);
  const kR=ppXf(ppBone(B,6),L.kn), kL=ppXf(ppBone(B,9),[-L.kn[0],L.kn[1],L.kn[2]]), ky=Math.max(kR[1],kL[1])+0.1, kz=(kR[2]+kL[2])/2-0.06;
  K.bar([-0.24,ky,kz],[0.24,ky,kz],0.05,1); K.bar([0,ky,kz],[0,ky,0.62],0.025,2); K.box([-0.04,0,0.58],[0.04,2.45,0.66],2); K.box([-0.08,2.4,-0.04],[0.08,2.48,0.66],2);
  const clip=o.v?ppVHandle(K,B,st.fig):ppStraightBar(K,g,0.62); if(!o.v) [-1,1].forEach(s=>K.bar([s*0.62,clip[1],clip[2]],[s*0.68,clip[1]-0.08,clip[2]],0.016,0));
  K.bar([0,2.38,0.02],[0,2.38,0.08],0.05,0); K.bar([0,2.33,0.05],clip,0.0055,0); K.box([-0.14,0,0.68],[0.14,1.1,0.9],1); }; }
/* the seated cable row's bench, foot plate and low pulley */
function ppCableRowKit(st,K){ const v=ppVHandle(K,st.B,st.fig);
  K.box([-0.15,0.27,-0.55],[0.15,0.34,0.36],1); [-0.4,0.24].forEach(z=>{ K.post([0,0.27,z],0.06,2); K.box([-0.22,0,z-0.03],[0.22,0.04,z+0.03],2); });
  ppSolePlate(K,st.B,0.42); K.box([-0.03,0,0.36],[0.03,0.05,1.0],2);
  ppCable(K,0,1.05,0.52,v); }
/* a foot plate flat against both soles (from the posed feet: the heel and the ball of each foot), h tall */
function ppSolePlate(K,B,h,w){ const P=(b,s,p)=>ppXf(ppBone(B,b),[s*p[0],p[1],p[2]]), hc=ppLerp(P(8,1,[0.176,0.005,-0.12]),P(11,-1,[0.176,0.005,-0.12]),0.5), bc=ppLerp(P(8,1,[0.19,0.005,0.06]),P(11,-1,[0.19,0.005,0.06]),0.5);
  const up=ppNorm(ppSub(bc,hc)), nz=ppNorm(ppCross([1,0,0],up)); K.obox(ppAdd(ppLerp(hc,bc,0.55),ppMul(nz,0.022)),[1,0,0],up,nz,[w||0.46,h,0.04],2); }
/* the row machine: seat, chest pad on its post, handles on levers swinging from pivots up in front */
function ppMachRowKit(st,K){ const B=st.B, L=RIG[st.fig], G=ppGripPt(L), P=ppBone(B,0), y=ppXf(P,[0,0.79,-0.1])[1]-0.005, c=ppXf(ppBone(B,1),[0,1.18,0.2]);
  K.box([-0.18,y-0.075,-0.2],[0.18,y,0.22],1); K.post([0,y-0.075,0],0.07,2); K.box([-0.25,0,-0.03],[0.25,0.05,0.03],2);
  K.box([-0.15,c[1]-0.2,c[2]],[0.15,c[1]+0.17,c[2]+0.08],1); K.bar([0,c[1]-0.15,c[2]+0.08],[0,c[1]-0.15,0.72],0.03,2); K.box([-0.05,0,0.68],[0.05,1.75,0.78],2);
  [[1,"R"],[-1,"L"]].forEach(([s,S])=>{ const g=ppXf(ppBone(B,S==="R"?3:5),[s*G[0],G[1],G[2]]), ax0=ppFistAxis(B,st.fig,S), ax=ax0[1]<0?ppMul(ax0,-1):ax0, top=ppAdd(g,ppMul(ax,0.08));
    K.bar(ppAdd(g,ppMul(ax,-0.08)),top,0.017,0); K.bar(top,ppAdd(top,[s*0.05,0.02,0]),0.02,0); K.bar(ppAdd(top,[s*0.05,0.02,0]),[s*0.3,1.72,0.72],0.024,0); });
  K.box([-0.36,1.7,0.68],[0.36,1.78,0.78],2); }
/* the T-bar: the bar from its floor pivot behind, between the feet, to the handle; plates beyond */
function ppTBarKit(st,K){ const g=ppGrips(st.B,st.fig), h=ppAdd(ppLerp(g.R,g.L,0.5),[0,0.04,0]), A=ppTBarArc(st.fig).A, d=ppNorm(ppSub(h,A)), at=x=>ppAdd(h,ppMul(d,x));
  K.box([A[0]-0.1,0,A[2]-0.1],[A[0]+0.1,0.05,A[2]+0.1],2); K.bar(A,at(0.05),0.0135,0); K.bar(at(0.05),at(0.17),0.025,0); K.bar(at(0.07),at(0.11),0.09,0);
  K.bar(ppAdd(g.R,[0.06,0,0]),ppAdd(g.L,[-0.06,0,0]),0.016,0); K.bar(ppLerp(g.R,g.L,0.5),h,0.014,0); }
/* the single-arm row's bench, along z under the left knee and hand */
function ppRowBench(K){ K.box([-0.29,0.375,-0.75],[0.0,0.45,0.62],1); [-0.62,0.5].forEach(z=>{ K.post([-0.145,0.375,z],0.06,2); K.box([-0.38,0,z-0.03],[0.09,0.04,z+0.03],2); }); }
/* the chest-supported row's incline pad, under the front of the torso */
function ppChestPad(st,K){ const S=ppBone(st.B,1), P=ppBone(st.B,0), a=ppXf(S,[0,1.47,0.14]), b=ppXf(P,[0,0.95,0.16]), n=ppNorm(ppXd(S,[0,0,-1]));
  K.slab(a,b,0.34,0.08,n,1); const lo=ppAdd(ppLerp(a,b,0.5),ppMul(n,-0.08)); K.post(lo,0.07,2); K.box([-0.25,0,lo[2]-0.03],[0.25,0.012,lo[2]+0.03],2); K.box([-0.03,0,lo[2]-0.45],[0.03,0.012,lo[2]+0.4],2); }
/* the inverted row's bar in a rack */
function ppInvRowKit(st,K){ const z=ppInvRowTop(st.fig); K.bar([-0.62,0.95,z],[0.62,0.95,z],0.0135,0);
  [-1,1].forEach(s=>{ K.box([s*0.62-0.04,0,z-0.04],[s*0.62+0.04,1.8,z+0.04],2); K.box([s*0.62-0.05,0,z-0.4],[s*0.62+0.05,0.05,z+0.4],2); }); }
/* the reverse pec deck: seat, the chest pad in front, the arms swing from a column in front */
function ppRevDeckKit(st,K){ const B=st.B, L=RIG[st.fig], G=ppGripPt(L), P=ppBone(B,0), y=ppXf(P,[0,0.79,-0.1])[1]-0.005, c=ppXf(ppBone(B,1),[0,1.2,0.21]);
  K.box([-0.18,y-0.075,-0.2],[0.18,y,0.22],1); K.post([0,y-0.075,0],0.07,2); K.box([-0.25,0,-0.03],[0.25,0.05,0.03],2);
  K.box([-0.14,c[1]-0.22,c[2]],[0.14,c[1]+0.2,c[2]+0.08],1); K.box([-0.06,0,c[2]+0.4],[0.06,2.0,c[2]+0.52],2); K.bar([0,c[1]-0.15,c[2]+0.08],[0,c[1]-0.15,c[2]+0.4],0.03,2);
  const pv=[0,1.72,c[2]+0.46];
  [[1,"R"],[-1,"L"]].forEach(([s,S])=>{ const g=ppXf(ppBone(B,S==="R"?3:5),[s*G[0],G[1],G[2]]), ax0=ppFistAxis(B,st.fig,S), ax=ax0[1]<0?ppMul(ax0,-1):ax0; K.bar(ppAdd(g,ppMul(ax,-0.08)),ppAdd(g,ppMul(ax,0.08)),0.017,0);
    const top=ppAdd(g,ppMul(ax,0.08)); K.bar(top,[top[0],pv[1],top[2]],0.022,0); K.bar([top[0],pv[1],top[2]],pv,0.022,0); });
  K.bar([0,pv[1]-0.04,pv[2]],[0,pv[1]+0.04,pv[2]],0.06,0); }
/* a mat on the floor for floor moves */
function ppMat(K,z0,z1,x){ x=x||0.32; K.box([-x,0,z0],[x,0.012,z1],1); }

function ppMoves3(){
  const mv=(f,cam,kit)=>({view:cam.yaw,cam,f,kit}), frame=(st,K)=>ppPullFrame(K,0.04);
  return {
    row_bb:mv((p,t,fig)=>ppBarRowPose(p,fig,{x:0.27,tw:0.6}),{yaw:1.85,pitch:0.16},ppBB({})),
    row_tbar:mv((p,t,fig)=>ppTBarPose(p,fig),{yaw:0.95,pitch:0.2},ppTBarKit),
    row_db1:mv((p,t,fig)=>ppOneArmRowPose(p,fig),{yaw:1.15,pitch:0.22},ppDBs({one:"R",with:(st,K)=>ppRowBench(K)})),
    row_chest:mv((p,t,fig)=>ppChestRowPose(p,fig),{yaw:1.6,pitch:0.15},ppDBs({with:ppChestPad})),
    row_cable:mv((p,t,fig)=>ppCableRowPose(p,fig),{yaw:1.35,pitch:0.1},ppCableRowKit),
    row_mach:mv((p,t,fig)=>ppMachRowPose(p,fig),{yaw:1.25,pitch:0.12},ppMachRowKit),
    pulldown_bar:mv((p,t,fig)=>ppPulldownPose(p,fig,{x:0.42}),{yaw:2.45,pitch:0.08},ppPulldownKit({})),
    pulldown_v:mv((p,t,fig)=>ppPulldownPose(p,fig,{x:0.075}),{yaw:2.2,pitch:0.08},ppPulldownKit({v:true})),
    pull_straight:mv((p,t,fig)=>ppStraightPullPose(p,fig),{yaw:1.3,pitch:0.08},(st,K)=>ppCable(K,0,1.05,2.0,ppStraightBar(K,ppGrips(st.B,st.fig),0.3))),
    pullup:mv((p,t,fig)=>ppPullPose(p,fig,{x:0.38,tw:0.3}),{yaw:2.55,pitch:0.04},frame),
    chinup:mv((p,t,fig)=>ppPullPose(p,fig,{x:0.2,chin:true,tw:-1.45}),{yaw:0.6,pitch:0.04},frame),
    dead_hang:mv((p,t,fig)=>ppPullPose(p,fig,{x:0.36,hang:true,tw:0.3}),{yaw:0.6,pitch:0.04},frame),
    pullup_assist:mv((p,t,fig)=>ppPullPose(p,fig,{x:0.3,knee:true,tw:0.3}),{yaw:1.0,pitch:0.04},(st,K)=>{ ppPullFrame(K,0.04,0.62);
      const L=RIG[st.fig], kR=ppXf(ppBone(st.B,6),L.kn), kL=ppXf(ppBone(st.B,9),[-L.kn[0],L.kn[1],L.kn[2]]), c=ppLerp(kR,kL,0.5), y=Math.min(kR[1],kL[1])-0.065;
      K.box([c[0]-0.2,y-0.07,c[2]-0.2],[c[0]+0.2,y,c[2]+0.08],1); K.post([c[0],y-0.07,c[2]-0.06],0.06,2); }),
    row_inverted:mv((p,t,fig)=>ppInvRowPose(p,fig),{yaw:1.62,pitch:0.2},ppInvRowKit),
    face_pull:mv((p,t,fig)=>ppFacePullPose(p,fig),{yaw:1.05,pitch:0.07},(st,K)=>{ const g=ppGrips(st.B,st.fig), c=ppAdd(ppLerp(g.R,g.L,0.5),[0,0,0.16]); ppRope(K,g,c); ppCable(K,0,1.3,1.78,c); }),
    rear_fly:mv((p,t,fig)=>ppRearPose(p,fig,{fly:true}),{yaw:0.75,pitch:0.42},ppDBs({sc:0.75})),
    rear_row:mv((p,t,fig)=>ppRearPose(p,fig,{}),{yaw:0.75,pitch:0.42},ppDBs({sc:0.85})),
    pull_apart:mv((p,t,fig)=>ppPullApartPose(p,fig,{tw:1.2}),{yaw:0.35,pitch:0.14},(st,K)=>{ const g=ppGrips(st.B,st.fig); K.bar(g.R,g.L,0.007,1); }),
    rev_deck:mv((p,t,fig)=>ppPullApartPose(p,fig,{seat:true}),{yaw:2.4,pitch:0.14},ppRevDeckKit),
    cable_rear_fly:mv((p,t,fig)=>ppPullApartPose(p,fig,{tw:0.4}),{yaw:0.35,pitch:0.1},(st,K)=>{ const g=ppGrips(st.B,st.fig); ppCable(K,-0.95,0.75,1.45,g.R); ppCable(K,0.95,0.75,1.45,g.L); }),
    prone_t:mv((p,t,fig)=>ppProneRaisePose(p,fig,{}),{yaw:0.55,pitch:0.45},(st,K)=>ppMat(K,-1.05,0.95,0.85)),
    prone_y:mv((p,t,fig)=>ppProneRaisePose(p,fig,{y:true}),{yaw:0.55,pitch:0.45},(st,K)=>ppMat(K,-1.05,1.1,0.75)),
  };
}
function ppNames3(){ return ppNames3.m||(ppNames3.m={"barbell row":"row_bb","t-bar row":"row_tbar","single-arm dumbbell row":"row_db1","chest-supported row":"row_chest","seated cable row":"row_cable",
    "machine row":"row_mach","lat pulldown":"pulldown_bar","close-grip lat pulldown":"pulldown_v","straight-arm pulldown":"pull_straight","pull-up":"pullup",
    "chin-up":"chinup","dead hang":"dead_hang","machine-assisted pull-up":"pullup_assist","inverted row":"row_inverted","face pull":"face_pull",
    "reverse fly":"rear_fly","rear-delt row":"rear_row","band pull-apart":"pull_apart","reverse pec deck":"rev_deck","cable rear-delt fly":"cable_rear_fly",
    "prone t-raise":"prone_t","prone y-raise":"prone_y"}); }
function ppMoveFor3(n){
  const ex=ppNames3();
  if(ex[n]) return ex[n];
  /* your own exercises, by their words */
  if(/pull-?up|chin-?up/.test(n)&&!/assist|band/.test(n)) return /chin/.test(n)?"chinup":"pullup";
  if(/pulldown/.test(n)) return /straight/.test(n)?"pull_straight":/close|v-bar|neutral/.test(n)?"pulldown_v":"pulldown_bar";
  if(/(barbell|pendlay|bent-over) row/.test(n)) return "row_bb";
  if(/(one|single)-arm.*row/.test(n)) return "row_db1";
  if(/cable row/.test(n)) return "row_cable";
  if(/face pull/.test(n)) return "face_pull";
  return null;
}

/* =========================================================
   LEGS AND HINGES, PART 1 (batch 4, 21 Oct): squats, the leg press and hack squat, lunges, deadlifts, the good morning,
   hip thrusts and bridges, the back extension, the pull-through, the bird dog
   ========================================================= */
/* squats: the hips sink o.depth and travel back o.hz as the torso leans o.lean (p 1 the bottom); o.hold where the hands are */
function ppSquatPose(p,fig,o){ const q=ppEase(p);
  const pose=ppStand(fig,{w:o.w||0.2,turn:o.turn==null?0.35:o.turn,drop:0.01+(o.depth||0.42)*q,hinge:(o.lean==null?0.6:o.lean)*q,hz:(o.hz==null?-0.17:o.hz)*q,fz:o.fz,spine:[0.04*q,0,0],head:[-0.22*q,0,0]});
  const F=ppFrame(pose,fig), sh=ppShoulders(pose,fig), m=ppLerp(sh.R,sh.L,0.5);
  if(o.hold==="back") pose.hands=ppHands(F,[0.42,1.46,-0.1],[0.35,-1,-0.35]);
  else if(o.hold==="front") pose.hands=ppHands(F,[0.23,1.43,0.11],[0.2,0.25,1]);
  else if(o.hold==="goblet") pose.hands=ppHands(F,[0.06,1.27,0.21],[0.6,-1,0.15]);
  else if(o.hold==="sumo") pose.hands={R:{t:[0.045,m[1]-0.52,m[2]+0.22],pole:[0.5,-0.2,-1]},L:{t:[-0.045,m[1]-0.52,m[2]+0.22],pole:[-0.5,-0.2,-1]}};
  else if(o.hold==="hack") pose.hands=ppHands(F,[0.3,1.47,0.02],[0.5,-1,0.1]);
  pose.bar=o.hold==="back"||o.hold==="front"; return ppSolve(pose,fig); }
/* the 45° leg press: reclined in the seat, the feet on the sled, the knees bending towards the chest (p 1 the bottom);
   o.calf: the legs long, the ankles pushing the sled with the balls of the feet */
function ppLegSled(){ return ppNorm([0,0.72,0.69]); }
function ppLegPressPose(p,fig,o){ const L=RIG[fig], q=ppEase(p), s=ppLegSled(), up=[0,s[2],-s[1]];
  const pose={pelvis:[-0.95,0,0],spine:[0.08,0,0],head:[0.3,0,0],shrug:0}; ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0,0.5,0]);
  const H=[0.12,0.5,0], k=o.calf?0.7:0.71-0.33*q, tip=o.calf?0.62*q:0;
  const ft=x=>{ const t=ppAdd([x,H[1],H[2]],ppMul(s,k)), a=ppNorm(ppAdd(ppMul(up,Math.cos(0.15+tip)),ppMul(s,Math.sin(0.15+tip)))); return {t:[x,t[1],t[2]],pole:[x>0?0.3:-0.3,0.7,-0.65],aim:[x>0?0.06:-0.06,a[1],a[2]]}; };
  pose.feet={R:ft(0.15),L:ft(-0.15)}; pose.hands=ppHandsAt([0.29,0.47,-0.06],[0.4,-0.3,-0.8]); return ppSolve(pose,fig); }
/* the hack squat: the back on a pad leaning back, shoulders under its pads, the feet forward on the platform */
function ppHackRail(){ return [0,-Math.cos(0.62),Math.sin(0.62)]; }   // the sled slides along the back, down towards the feet
function ppHackPose(p,fig){ const L=RIG[fig], q=ppEase(p), r=ppHackRail();
  const pose={pelvis:[-0.62,0,0],spine:[0.02,0,0],head:[0.05,0,0],shrug:0}; ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],ppAdd([0,0.9,0.0],ppMul(r,0.45*q)));
  const F=ppFrame(pose,fig); pose.feet={R:{t:[0.15,0.27,0.42],pole:[0.12,0,0.96],aim:[0.12,-0.25,0.96]},L:{t:[-0.15,0.27,0.42],pole:[-0.12,0,0.96],aim:[-0.12,-0.25,0.96]}};   /* knees over the toes: the feet stay planted */
  pose.hands=ppHands(F,[0.3,1.5,0.02],[0.5,-1,0.15]); return ppSolve(pose,fig); }
/* lunges: the right foot forward, the left back on its ball; the hips sink until the back knee nearly touches down.
   o.bench: the back foot's top on a bench behind (the Bulgarian split squat); o.hold the hands */
function ppLungePose(p,fig,o){ const q=ppEase(p), b=o.bench;
  const pose=ppStand(fig,{w:0.12,turn:0.1,fz:b?[0.36,-0.62]:[0.42,-0.48],fy:b?[0,0.38]:[0,0.0],tip:b?[0,0]:[0,0.6],drop:(b?0.06:0.05)+(b?0.36:0.38)*q,hz:b?-0.08-0.04*q:-0.02,hinge:(b?0.12:0.06)+0.1*q,spine:[0.02,0,0]});
  if(b) pose.feet.L.aim=[-0.02,-0.3,-0.95];
  pose.feet.L.pole=[0,-0.35,1];
  const F=ppFrame(pose,fig);
  pose.flat=o.hold==="hips"; pose.hands=o.hold==="hips"?ppHands(F,[0.2,1.0,0.02],[1,0.2,-0.5]):ppHands(F,[0.37,0.885,0.0],[0.3,-0.2,-1]); return ppSolve(pose,fig); }
/* the step-up: the right foot on a box, standing up onto it, the left foot coming up beside */
function ppStepUpPose(p,fig){ const L=RIG[fig], q=ppEase(p), bh=0.45, pose={pelvis:[0.35*(1-q),0,0],spine:[0.04,0,0],head:[-0.08*(1-q),0,0],shrug:0};
  ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0.02,0.86+0.46*q,0.0+0.28*q]);
  pose.feet={R:{t:[0.13,bh+L.an[1],0.32],pole:[0.15,0,1],aim:[0.08,-0.55,0.83]},L:{t:[-0.13,L.an[1]+bh*ppSmooth(0.35,0.85,q),-0.12+0.36*ppSmooth(0.55,1,q)],pole:[-0.15,0,1],aim:[-0.08,-0.55,0.83]}};
  const F=ppFrame(pose,fig); pose.hands=ppHands(F,[0.34,0.885,0.0],[0.3,-0.2,-1]); return ppSolve(pose,fig); }
/* hip hinges with a bar hanging from straight arms: o.from (0 standing: the Romanian deadlift; the bar's height at the
   start for a deadlift from the floor or a rack pull), o.back (the bar on the back: the good morning) */
function ppHingePose(p,fig,o){ const q=ppEase(p);
  if(o.from){ const u=1-q, pose=ppStand(fig,{w:0.14,turn:0.12,drop:0.02+o.drop*u,hinge:o.hinge*u,hz:o.hz*u,spine:[0.03*u,0,0],head:[-0.3*u,0,0]});
    const sh=ppShoulders(pose,fig), y=o.from+(sh.R[1]-0.505-o.from)*Math.min(1,q*1.15);
    pose.hands=ppHandsAt([o.x,Math.min(y,sh.R[1]-0.49),0.06],[0.3,-0.2,-1]); pose.bar=true; return ppSolve(pose,fig); }
  const pose=ppStand(fig,{w:0.15,turn:0.12,drop:0.03+(o.knee||0.05)*q,hinge:0.08+(o.hinge||1.2)*q,hz:-(o.hz||0.24)*q,spine:[0.04,0,0],head:[-0.25*q,0,0]});
  const F=ppFrame(pose,fig), sh=ppShoulders(pose,fig);
  if(o.back) pose.hands=ppHands(F,[0.42,1.46,-0.1],[0.35,-1,-0.35]);
  else pose.hands={R:{t:[o.x,sh.R[1]-0.505,sh.R[2]+0.02],pole:[0.3,-0.2,-1]},L:{t:[-o.x,sh.L[1]-0.505,sh.L[2]+0.02],pole:[-0.3,-0.2,-1]}};
  pose.bar=true; return ppSolve(pose,fig); }
/* the single-leg Romanian deadlift: on the left leg, the right leg swinging back in line with the torso, dumbbells hanging */
function ppSLRDLPose(p,fig){ const L=RIG[fig], q=ppEase(p), th=0.08+1.22*q;
  const pose={pelvis:[th,0,0],spine:[0.03,0,0],head:[-0.3*q,0,0],shrug:0,thR:[0,0,0],shR:[0.12,0,0],ftR:[0.5*q,0,0]};
  ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0,0.845-0.07*q,-0.12*q]);
  pose.feet={L:{t:[-0.11,L.an[1],-0.06],pole:[-0.1,0,1],aim:[-0.08,-0.55,0.83]}};
  const sh=ppShoulders(pose,fig); pose.hands={R:{t:[sh.R[0]+0.03,sh.R[1]-0.5,sh.R[2]+0.02],pole:[0.3,-0.2,-1]},L:{t:[sh.L[0]-0.03,sh.L[1]-0.5,sh.L[2]+0.02],pole:[-0.3,-0.2,-1]}};
  return ppSolve(pose,fig); }
/* hip thrusts and bridges: the shoulders stay put (on a bench's edge, or the floor), the hips swing up round them to a
   straight line from knees to shoulders; o.one lifts the left leg straight; o.hold the hands */
function ppThrustPose(p,fig,o){ const L=RIG[fig], q=ppEase(p), S=o.bench?[0,0.475,0]:[0,0.1,0], R=0.52;
  const f0=o.bench?-0.5:0.05, f1=o.bench?0.27:0.6, f=f0+(f1-f0)*q, H=ppAdd(S,[0,R*Math.sin(f),R*Math.cos(f)]);
  const pose={pelvis:[-(Math.PI/2)-f+0.067,0,0],spine:[0,0,0],head:[o.bench?0.35:0.2,0,0],shrug:0}; ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],H);
  const fz=o.bench?0.92:0.82, fw=o.bench?0.2:0.16; pose.feet={R:{t:[fw,L.an[1],fz],pole:[0.3,0.6,0.4],aim:[0.08,-0.55,0.83]}};
  if(o.one) Object.assign(pose,{thL:[0,0,0],shL:[0.05,0,0],ftL:[-0.2,0,0]}); else pose.feet.L={t:[-fw,L.an[1],fz],pole:[-0.3,0.6,0.4],aim:[-0.08,-0.55,0.83]};
  const P=ppBone(boneMats(pose,fig,1),0);
  if(o.hold==="bar"){ const c=ppXf(P,[0,0.87,0.2]); pose.hands=ppHandsAt([0.32,c[1],c[2]],[0.4,1,0.2]); }
  else if(o.hold==="mach"){ const c=ppXf(P,[0,0.9,0.05]); pose.hands=ppHandsAt([0.34,c[1],c[2]],[0.5,0.6,-0.3]); }
  else { pose.hands=ppHandsAt([0.3,0.03,0.22],[0.5,1,0]); pose.flat=true; }
  pose.bar=o.hold==="bar"; return ppSolve(pose,fig); }
/* the back extension on a 45° bench: hips over the pad, heels under the roller; the torso folds down from in line */
function ppBackExtPose(p,fig){ const L=RIG[fig], q=ppEase(p), th=Math.PI/4+1.45*(1-q);
  const pose={pelvis:[th,0,0],spine:[0.1*(1-q),0,0],head:[-0.25,0,0],shrug:0,thR:[Math.PI/4-th,0,0],thL:[Math.PI/4-th,0,0],shR:[0.05,0,0],shL:[0.05,0,0],ftR:[0.25,0,0],ftL:[0.25,0,0]};
  ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0,0.98,0.0]); const F=ppFrame(pose,fig); pose.hands=ppHands(F,[-0.13,1.33,0.13],[1,-0.4,0.3]); pose.flat=true; return ppSolve(pose,fig); }
/* the cable pull-through: facing away from a low pulley, the rope between the legs; hinged down, then hips through */
function ppPullThroughPose(p,fig){ const q=ppEase(p), u=1-q, pose=ppStand(fig,{w:0.24,turn:0.3,drop:0.04+0.1*u,hinge:1.15*u,hz:-0.26*u,spine:[0.04,0,0],head:[-0.3*u,0,0]});
  const P=ppBone(boneMats(pose,fig,1),0), lo=ppXf(P,[0,0.62,-0.02]), hi=ppXf(P,[0,0.82,0.22]), h=ppLerp(lo,hi,q);
  pose.hands={R:{t:ppAdd(h,[0.05,0,0]),pole:[0.6,-0.3,-0.6]},L:{t:ppAdd(h,[-0.05,0,0]),pole:[-0.6,-0.3,-0.6]}}; return ppSolve(pose,fig); }
/* the bird dog: on hands and knees, the right arm reaches forward and the left leg back */
function ppBirdDogPose(p,fig){ const L=RIG[fig], q=ppEase(p), pose={pelvis:[Math.PI/2-0.02,0,0],spine:[-0.04,0,0],head:[-0.4,0,0],shrug:0};
  ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0,0.5,-0.25]); const sh=ppShoulders(pose,fig);
  pose.feet={R:{t:[0.13,0.13,-0.66],pole:[0,-1,0.1],aim:[0.05,-0.25,-0.97]},L:{t:ppLerp([-0.13,0.13,-0.66],[-0.1,0.5,-1.0],q),pole:ppNorm(ppLerp([0,-1,0.1],[0,-1,0.6],q)),aim:ppNorm(ppLerp([-0.05,-0.25,-0.97],[0,0.1,-1],q))}};
  pose.hands={R:{t:ppLerp([sh.R[0],0.045,sh.R[2]+0.02],[0.27,sh.R[1]+0.03,sh.R[2]+0.48],q),pole:[0.3,-0.2,-1]},L:{t:[sh.L[0],0.045,sh.L[2]+0.02],pole:[-0.3,-0.2,-1]}}; pose.flat=true;
  return ppSolve(pose,fig); }

/* ---------- batch 4's kit (part 1) ---------- */
/* the goblet squat's dumbbell, upright against the chest, its top head in the hands */
function ppGobletDB(st,K){ const g=ppGrips(st.B,st.fig), h=ppLerp(g.R,g.L,0.5), up=ppXd(ppBone(st.B,1),[0,1,0]); K.dumbbell(ppAdd(h,ppMul(up,-0.1)),up,1.05); }
/* the sumo squat's dumbbell, hanging upright between the legs from the top head */
function ppSumoDB(st,K){ const g=ppGrips(st.B,st.fig), h=ppLerp(g.R,g.L,0.5); K.dumbbell(ppAdd(h,[0,-0.11,0]),[0,1,0],1.1); }
/* a squat rack: two uprights with hooks (or pins at y) either side of the bar */
function ppRack(K,z,y){ [-1,1].forEach(s=>{ K.box([s*0.6-0.04,0,z-0.04],[s*0.6+0.04,2.1,z+0.04],2); K.box([s*0.6-0.05,0,z-0.4],[s*0.6+0.05,0.05,z+0.4],2);
  if(y) K.bar([s*0.6,y,z-0.25],[s*0.6,y,z+0.25],0.02,0); }); }
/* the leg press: the reclined seat, the sled's platform under the feet, its rails */
function ppLegPressKit(st,K){ const B=st.B, L=RIG[st.fig], P=ppBone(B,0), S=ppBone(B,1), s=ppLegSled(), up=[0,s[2],-s[1]];
  K.slab(ppXf(P,[0,0.78,-0.16]),ppXf(S,[0,1.55,-0.16]),0.42,0.08,ppXd(S,[0,0,1]),1);   // the back
  K.slab(ppXf(P,[0,0.8,-0.12]),ppXf(P,[0,0.75,0.25]),0.4,0.08,ppXd(P,[0,1,0]),1);       // the seat
  const aR=ppXf(ppBone(B,8),L.toe), aL=ppXf(ppBone(B,11),[-L.toe[0],L.toe[1],L.toe[2]]), hR=ppXf(ppBone(B,8),[L.an[0],0.02,L.an[2]-0.05]);
  const c=ppLerp(ppLerp(aR,aL,0.5),ppLerp(hR,[-hR[0],hR[1],hR[2]],0.5),0.5), n=ppMul(s,-1), cs=ppAdd(c,ppMul(s,0.035)), x=[1,0,0];
  K.obox(ppAdd(cs,ppMul(s,0.02)),x,up,s,[0.62,0.55,0.04],2);
  [-1,1].forEach(sd=>{ const a=[sd*0.38,0.3,-0.25], b=[sd*0.38,0.3+s[1]*2.0,-0.25+s[2]*2.0]; K.bar(a,b,0.03,0); K.bar(ppAdd(cs,[sd*0.31,0,0]),[sd*0.38,cs[1],cs[2]],0.025,0); });
  K.box([-0.45,0,-0.6],[0.45,0.3,0.25],2); K.box([-0.45,0,0.25],[0.45,0.08,1.55],2); K.bar([-0.32,0.47,-0.06],[0.32,0.47,-0.06],0.018,0); }
/* the hack squat: the back pad along the back, pads on the shoulders, rails behind, the platform under the feet */
function ppHackKit(st,K){ const B=st.B, P=ppBone(B,0), S=ppBone(B,1), r=ppHackRail(), q=ppEase(st.ph||0);
  K.slab(ppXf(P,[0,0.85,-0.17]),ppXf(S,[0,1.62,-0.17]),0.42,0.08,ppXd(S,[0,0,1]),1);
  [-1,1].forEach(s=>{ K.box([s*0.09,1.4,-0.12],[s*0.22,1.48,0.06],1,S); const a=ppSub(ppXf(S,[s*0.3,1.0,-0.27]),ppMul(r,0.45*q)); K.bar(ppAdd(a,ppMul(r,-0.95)),ppAdd(a,ppMul(r,0.72)),0.03,0); });
  ppSolePlate(K,B,0.5,0.66); K.box([-0.4,0,-0.9],[0.4,0.08,0.7],2); }
/* a plyo box for step-ups */
function ppBox(K,c,h,w,d){ K.box([c[0]-w/2,0,c[1]-d/2],[c[0]+w/2,h,c[1]+d/2],1); }
/* the hip thrust's bench (across the back) and the machine's pad over the hips */
function ppThrustBench(K){ K.box([-0.75,0.385,-0.38],[0.75,0.46,-0.01],1); [-0.55,0.55].forEach(x=>{ K.post([x,0.385,-0.2],0.06,2); K.box([x-0.03,0,-0.35],[x+0.03,0.04,-0.05],2); }); }
function ppThrustMach(st,K){ const P=ppBone(st.B,0); ppThrustBench(K); K.box([-0.26,0.94,0.13],[0.26,1.02,0.3],1,P); const a=ppXf(P,[0.38,0.98,0.2]), b=ppXf(P,[-0.38,0.98,0.2]);
  [a,b].forEach(e=>{ K.bar(e,[e[0],0.25,-0.3],0.026,0); }); K.box([-0.48,0,-0.4],[-0.38,0.3,-0.2],2); K.box([0.38,0,-0.4],[0.48,0.3,-0.2],2); K.box([-0.45,0,-0.45],[0.45,0.012,1.1],2); }
/* the back-extension bench: the hip pad, the foot plate and the heel roller on a 45° frame */
function ppBackExtKit(st,K){ const B=st.B, L=RIG[st.fig], d=ppNorm([0,-0.7071,-0.7071]), up=[0,0.7071,-0.7071];
  const hR=ppXf(ppBone(B,6),[L.hip[0],L.hip[1]-0.12,L.hip[2]+0.13]), c=[0,hR[1],hR[2]], a=ppAdd(c,ppMul(d,-0.05)), b=ppAdd(c,ppMul(d,0.3));
  K.slab(ppAdd(a,ppMul(up,-0.07)),ppAdd(b,ppMul(up,-0.07)),0.42,0.08,ppMul(up,-1),1);
  const an=ppXf(ppBone(B,7),[L.an[0],L.an[1],L.an[2]]); K.bar([-0.2,an[1]+0.06,an[2]+0.08],[0.2,an[1]+0.06,an[2]+0.08],0.045,1);
  K.obox([0,an[1]-0.09,an[2]+0.02],[1,0,0],up,ppMul(d,-1),[0.42,0.03,0.3],2);
  K.bar(ppAdd(c,[0,-0.15,-0.1]),[0,0.05,an[2]-0.1],0.035,2); K.box([-0.35,0,an[2]-0.3],[0.35,0.05,c[2]+0.25],2); K.bar([0,an[1]-0.1,an[2]],[0,0.05,an[2]],0.035,2); }

function ppMoves4(){
  const mv=(f,cam,kit)=>({view:cam.yaw,cam,f,kit}), cSq={yaw:1.0,pitch:0.08}, cSide={yaw:1.45,pitch:0.1};
  const bbBack=o=>ppBB({r:0.225,...(o||{})}), mat=(st,K)=>ppMat(K,-1.2,1.0,0.36);
  return {
    squat_back:mv((p,t,fig)=>ppSquatPose(p,fig,{hold:"back"}),cSq,bbBack({with:(st,K)=>ppRack(K,-0.12,1.4)})),
    squat_front:mv((p,t,fig)=>ppSquatPose(p,fig,{hold:"front",lean:0.3,hz:-0.09,depth:0.44}),cSq,ppBB({r:0.225})),
    squat_goblet:mv((p,t,fig)=>ppSquatPose(p,fig,{hold:"goblet",lean:0.35,hz:-0.1,depth:0.46}),{yaw:0.75,pitch:0.08},ppGobletDB),
    squat_sumo:mv((p,t,fig)=>ppSquatPose(p,fig,{hold:"sumo",w:0.34,turn:0.62,lean:0.28,hz:-0.08,depth:0.34}),{yaw:0.5,pitch:0.08},ppSumoDB),
    squat_smith:mv((p,t,fig)=>ppSquatPose(p,fig,{hold:"back",fz:[0.12,0.12],lean:0.35,hz:-0.12}),cSq,bbBack({with:(st,K)=>{ const g=ppGrips(st.B,st.fig); ppSmithRails(K,(g.R[2]+g.L[2])/2); }})),
    squat_hack:mv((p,t,fig)=>ppHackPose(p,fig),{yaw:1.25,pitch:0.1},ppHackKit),
    leg_press:mv((p,t,fig)=>ppLegPressPose(p,fig,{}),{yaw:1.5,pitch:0.15},ppLegPressKit),
    leg_press_calf:mv((p,t,fig)=>ppLegPressPose(p,fig,{calf:true}),{yaw:1.5,pitch:0.15},ppLegPressKit),
    lunge_walk:mv((p,t,fig)=>ppLungePose(p,fig,{}),{yaw:1.3,pitch:0.08},ppDBs({})),
    lunge_rev:mv((p,t,fig)=>ppLungePose(p,fig,{hold:"hips"}),{yaw:1.3,pitch:0.08},()=>{}),
    split_bulg:mv((p,t,fig)=>ppLungePose(p,fig,{bench:true}),{yaw:1.3,pitch:0.1},ppDBs({with:(st,K)=>{ K.box([-0.55,0.375,-0.82],[0.55,0.45,-0.52],1); [-0.4,0.4].forEach(x=>K.post([x,0.375,-0.67],0.06,2)); }})),
    step_up:mv((p,t,fig)=>ppStepUpPose(p,fig),{yaw:1.1,pitch:0.1},ppDBs({with:(st,K)=>ppBox(K,[0.1,0.33],0.45,0.6,0.42)})),
    rdl:mv((p,t,fig)=>ppHingePose(p,fig,{x:0.24}),cSide,ppBB({r:0.225})),
    deadlift:mv((p,t,fig)=>ppHingePose(p,fig,{x:0.24,from:0.225,drop:0.36,hinge:1.05,hz:-0.3}),cSide,ppBB({r:0.225})),
    rack_pull:mv((p,t,fig)=>ppHingePose(p,fig,{x:0.24,from:0.5,drop:0.13,hinge:0.72,hz:-0.2}),{yaw:0.72,pitch:0.12},ppBB({r:0.225,with:(st,K)=>ppRack(K,0.06,0.47)})),
    good_morning:mv((p,t,fig)=>ppHingePose(p,fig,{back:true,hinge:1.15,knee:0.06,hz:0.22}),cSide,ppBB({r:0.2})),
    rdl_one:mv((p,t,fig)=>ppSLRDLPose(p,fig),{yaw:1.35,pitch:0.1},ppDBs({sc:0.9})),
    hip_thrust:mv((p,t,fig)=>ppThrustPose(p,fig,{bench:true,hold:"bar"}),{yaw:1.25,pitch:0.18},ppBB({r:0.225,with:(st,K)=>ppThrustBench(K)})),
    hip_thrust_mach:mv((p,t,fig)=>ppThrustPose(p,fig,{bench:true,hold:"mach"}),{yaw:1.25,pitch:0.18},ppThrustMach),
    glute_bridge:mv((p,t,fig)=>ppThrustPose(p,fig,{}),{yaw:1.3,pitch:0.25},mat),
    glute_bridge_one:mv((p,t,fig)=>ppThrustPose(p,fig,{one:true}),{yaw:1.3,pitch:0.25},mat),
    back_ext:mv((p,t,fig)=>ppBackExtPose(p,fig),{yaw:1.35,pitch:0.1},ppBackExtKit),
    pull_through:mv((p,t,fig)=>ppPullThroughPose(p,fig),{yaw:1.35,pitch:0.1},(st,K)=>{ const g=ppGrips(st.B,st.fig), c=ppAdd(ppLerp(g.R,g.L,0.5),[0,-0.04,-0.16]); ppRope(K,g,c); ppCable(K,0,-1.1,0.22,c); }),
    bird_dog:mv((p,t,fig)=>ppBirdDogPose(p,fig),{yaw:1.15,pitch:0.25},(st,K)=>ppMat(K,-1.15,0.75,0.36)),
  };
}
function ppNames4(){ return ppNames4.m||(ppNames4.m={"back squat":"squat_back","front squat":"squat_front","goblet squat":"squat_goblet","sumo squat":"squat_sumo","smith machine squat":"squat_smith",
    "hack squat":"squat_hack","leg press":"leg_press","leg press calf raise":"leg_press_calf","walking lunge":"lunge_walk","reverse lunge":"lunge_rev",
    "bulgarian split squat":"split_bulg","step-up":"step_up","romanian deadlift":"rdl","deadlift":"deadlift","rack pull":"rack_pull","good morning":"good_morning",
    "single-leg romanian deadlift":"rdl_one","hip thrust":"hip_thrust","hip thrust machine":"hip_thrust_mach","glute bridge":"glute_bridge",
    "single-leg glute bridge":"glute_bridge_one","back extension":"back_ext","cable pull-through":"pull_through","bird dog":"bird_dog"}); }
function ppMoveFor4(n){
  const ex=ppNames4();
  if(ex[n]) return ex[n];
  /* your own exercises, by their words */
  if(/split squat/.test(n)) return "split_bulg";
  if(/lunge/.test(n)) return /reverse/.test(n)?"lunge_rev":"lunge_walk";
  if(/romanian|rdl|stiff-leg/.test(n)) return /single/.test(n)?"rdl_one":"rdl";
  if(/deadlift/.test(n)&&!/single|romanian/.test(n)) return "deadlift";
  if(/hip thrust/.test(n)) return "hip_thrust";
  if(/glute bridge/.test(n)) return "glute_bridge";
  if(/front squat/.test(n)) return "squat_front";
  if(/goblet/.test(n)) return "squat_goblet";
  if(/(back|barbell|high-bar|low-bar) squat/.test(n)) return "squat_back";
  return null;
}

/* =========================================================
   LEGS, PART 2 (batch 4, 21 Oct): leg curls and the leg extension, the Nordic and glute-ham raises, calf and tibialis
   work, the jump rope, hip abduction and adduction, kickbacks
   ========================================================= */
/* the lying leg curl: face down on the bench, the heels curled up towards the seat */
function ppLyingCurlPose(p,fig){ const L=RIG[fig], q=ppEase(p), k=0.1+1.75*q;
  const pose={pelvis:[Math.PI/2-0.12,0,0],spine:[-0.03,0,0],head:[-0.4,0,0],shrug:0,thR:[0.12,0,0],thL:[0.12,0,0],shR:[k,0,0],shL:[k,0,0],ftR:[0.35,0,0],ftL:[0.35,0,0]};
  ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0,0.72,-0.1]); const sh=ppShoulders(pose,fig);
  pose.hands=ppHandsAt([0.24,0.56,sh.R[2]+0.3],[0.5,-0.5,-0.5]); return ppSolve(pose,fig); }
/* seated: the leg curl (o.ext false: the shins sweep down and back under the pad) and the leg extension (they rise level) */
function ppSeatLegPose(p,fig,o){ const L=RIG[fig], q=ppEase(p), k=o.ext?1.55-1.45*q:0.15+1.5*q;
  const pose={pelvis:[-0.2,0,0],spine:[0.04,0,0],head:[0.06,0,0],shrug:0,thR:[-1.37,0,0],thL:[-1.37,0,0],shR:[k,0,0],shL:[k,0,0],ftR:[-0.15,0,0],ftL:[-0.15,0,0]};
  ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0,0.57,0]); pose.hands=ppHandsAt([0.29,0.6,0.12],[0.4,-0.4,-0.8]); return ppSolve(pose,fig); }
/* the standing leg curl: hips against the pad, the right heel curled up */
function ppStandCurlPose(p,fig){ const q=ppEase(p), pose=ppStand(fig,{w:0.12,hinge:0.2,hz:-0.05,drop:0.012}); delete pose.feet.R;
  Object.assign(pose,{thR:[-0.12,0,0],shR:[0.1+1.55*q,0,0],ftR:[0.2,0,0]}); const F=ppFrame(pose,fig); pose.hands=ppHands(F,[0.24,1.12,0.34],[0.5,-0.6,-0.4]); pose.bar=true; return ppSolve(pose,fig); }
/* the Nordic curl (kneeling on the floor, ankles held) and the glute-ham raise (o.ghr: on its pad): straight from the
   knees, the body lowers forward from upright and pulls back up */
function ppKneelCurlPose(p,fig,o){ const L=RIG[fig], q=ppEase(p), th=o.ghr?1.45*(1-q)+0.12:0.1+1.2*q;
  const pose={pelvis:[th,0,0],spine:[0.02,0,0],head:[-0.25,0,0],shrug:0,thR:[0,0,0],thL:[0,0,0],shR:[Math.PI/2-th,0,0],shL:[Math.PI/2-th,0,0],ftR:[0.6,0,0],ftL:[0.6,0,0]};
  ppPlace(pose,fig,L.kn,[L.kn[0],o.ghr?1.0:0.07,0],7); const F=ppFrame(pose,fig);
  pose.hands=ppHands(F,o.ghr?[-0.12,1.33,0.13]:[0.17,1.22,0.24],o.ghr?[1,-0.4,0.3]:[0.5,-0.8,-0.2]); pose.flat=true; return ppSolve(pose,fig); }
/* calf raises: the heel drops below the ball (d below 0) and rises (d above 0), the toes staying put, the legs straight.
   o.kind: stand (on a block in the machine), one (one foot on a step), bent (knees soft), seat, wall (sitting against a
   wall, thighs level), rope (the jump rope's bounce) */
function ppCalfRise(d){ const a=Math.atan2(0.1,0.15); return 0.181*(Math.sin(a+d)-Math.sin(a)); }
function ppCalfPose(p,fig,o,t){ const L=RIG[fig], q=ppEase(p), k=o.kind;
  if(k==="seat"){ const d=-0.3+0.85*q, pose=ppSit(fig,{h:0.47,w:0.16,fz:0.44}); ["R","L"].forEach(S=>{ const f=pose.feet[S], a=Math.atan2(0.1,0.15);
      f.t=[f.t[0],f.t[1]+0.08+ppCalfRise(d),f.t[2]+0.181*(Math.cos(a)-Math.cos(a+d))]; const al=a+d; f.aim=[f.aim[0],-Math.sin(al),Math.cos(al)]; });
    pose.hands=ppHandsAt([0.2,0.62,0.32],[0.5,-0.4,-0.7]); pose.flat=true; return ppSolve(pose,fig); }
  if(k==="rope"){ const w=t*9.5, c=Math.max(0,Math.cos(w)), d=0.3+0.25*c, hop=0.055*c, r=ppCalfRise(d);
    const pose=ppStand(fig,{w:0.11,turn:0.08,tip:[d,d],fy:[hop,hop],drop:-(r+hop)+0.015,spine:[0.03,0,0]}), F=ppFrame(pose,fig);
    pose.hands=ppHands(F,[0.33,0.98,0.13],[0.3,-0.5,-1]); return ppSolve(pose,fig); }
  const blk=k==="wall"?0:0.11, d=k==="wall"?0.55*q:-0.32+0.85*q, r=blk+ppCalfRise(d), one=k==="one";
  const bent=k==="bent"?0.09:k==="wall"?0.36:0;
  const pose=ppStand(fig,{w:one?0.1:0.12,turn:0.08,fy:[blk,blk],tip:[d,d],drop:bent-r+0.01,hz:k==="wall"?0.0:-0.01,hinge:k==="bent"?0.12:0,fz:k==="wall"?[0.36,0.36]:[0,0],hx:one?0.04:0,shrug:k==="stand"?-0.01:0});
  if(one){ delete pose.feet.L; Object.assign(pose,{thL:[-0.1,0,0.02],shL:[1.25,0,0],ftL:[0.45,0,0]}); }
  const F=ppFrame(pose,fig);
  pose.hands=k==="stand"?ppHands(F,[0.3,1.5,0.06],[0.5,-1,0.1]):one?{R:{t:ppXf(F.Sp,[0.34,0.9,0.0]),pole:ppXd(F.Sp,[0.3,-0.2,-1])},L:{t:[-0.36,1.15,0.38],pole:[-0.5,-0.6,-0.4]}}:k==="wall"?ppHands(F,[0.22,0.98,0.2],[0.5,-0.3,-0.6]):ppHands(F,[0.34,0.885,0.0],[0.3,-0.2,-1]); pose.flat=k==="wall"||k==="bent"; if(one) pose.hands.R.flat=true;
  return ppSolve(pose,fig); }
/* tibialis work: o.kind wall (leaning back on a wall, the toes lifting), walk (walking on the heels), band (sitting on the
   floor, the toes pulled back against a band) */
function ppTibPose(p,fig,o,t){ const L=RIG[fig], q=ppEase(p), k=o.kind;
  if(k==="band"){ const pose={pelvis:[-0.1,0,0],spine:[0.06,0,0],head:[0.15,0,0],shrug:0,thR:[-1.46,0,0],thL:[-1.46,0,0],shR:[0.04,0,0],shL:[0.04,0,0],ftR:[0.25-0.65*q,0,0],ftL:[0.25-0.65*q,0,0]};
    ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0,0.11,0]); pose.hands=ppHandsAt([0.26,0.04,-0.28],[0.3,0.4,-1]); pose.flat=true; return ppSolve(pose,fig); }
  if(k==="walk"){ const s=Math.sin(t*4.2), up=v=>Math.max(0,v), pose=ppStand(fig,{w:0.12,toes:[0.5,0.5],fy:[0.06*up(s),0.06*up(-s)],fz:[0.05*up(s),0.05*up(-s)],drop:-0.02,tilt:0.02*s}), F=ppFrame(pose,fig);
    pose.hands=ppHands(F,[0.2,1.0,0.02],[1,0.2,-0.5]); pose.flat=true; return ppSolve(pose,fig); }
  const pose=ppStand(fig,{w:0.13,fz:[0.32,0.32],toes:[0.55*q,0.55*q],hinge:-0.16,hz:-0.02,drop:0.03}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,[0.27,0.95,0.03],[0.4,-0.2,-1]); pose.flat=true; return ppSolve(pose,fig); }
/* lying on the left side along x (head towards −x, facing +z), propped on the left forearm: o.lift raises the hips
   (a side plank), o.ab lifts the right leg */
function ppSidePose(p,fig,o){ const L=RIG[fig], q=ppEase(p), lift=o.cph?0.2+0.13*q:0;
  const pose={pelvis:[0,0,Math.PI/2-(o.cph?-0.1:0.22)],spine:[0,0,o.cph?0:-0.1],head:[0,0,-0.2],shrug:0,thR:[0,0,o.ab?0.75*q:0],shR:[0.02,0,0],thL:[0,0,0],shL:[o.cph?1.2:0.02,0,0]};
  if(o.cph) pose.thL=[-0.35,0,0];
  ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0.12,0.16+lift,0]); const sh=ppShoulders(pose,fig);
  pose.hands={L:{t:[sh.L[0]-0.02,0.045,sh.L[2]+0.28],pole:[0.1,-1,-0.3]},R:{t:ppXf(ppBone(boneMats(pose,fig,1),0),[0.2,1.0,0.03]),pole:[0,1,-0.5]}}; pose.flat=true;
  if(o.cph) pose.feet={R:{t:[0.95,0.55,0.0],pole:[0,0,1],aim:[0.2,0,0.98]}};
  return ppSolve(pose,fig); }
/* the banded lateral walk: half squat, a band round the knees, the feet stepping wide and back */
function ppLatWalkPose(p,fig){ const q=ppEase(p), pose=ppStand(fig,{w:0.12+0.13*q,turn:0.18,drop:0.12,hinge:0.28,hz:-0.08,spine:[0.03,0,0],head:[-0.15,0,0]}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,[0.2,1.0,0.03],[1,0.2,-0.5]); pose.flat=true; return ppSolve(pose,fig); }
/* the adductor and abductor machines: seated, knees bent over the pads, the thighs squeezing in (o.add) or pushing out */
function ppHipMachPose(p,fig,o){ const q=ppEase(p), ab=o.add?0.62*(1-q)+0.06:0.06+0.58*q, pose=ppSit(fig,{h:0.47,lean:-0.05,w:0.2,fz:0.44}); delete pose.feet;
  Object.assign(pose,{thR:[-1.35,ab,0],thL:[-1.35,ab,0],shR:[1.4,0,0],shL:[1.4,0,0],ftR:[-0.15,0,0],ftL:[-0.15,0,0]});
  const F=ppFrame(pose,fig); pose.hands=ppHands(F,[0.3,0.95,0.05],[0.5,-0.6,-0.4]); return ppSolve(pose,fig); }
/* kickbacks: o.cable (standing, the right leg swept back against a low cable) or the machine (chest on its pad, the
   right foot driving the plate back and up) */
function ppKickPose(p,fig,o){ const q=ppEase(p);
  if(o.cable){ const pose=ppStand(fig,{w:0.12,hinge:0.32,hz:-0.04,drop:0.015}); delete pose.feet.R;
    Object.assign(pose,{thR:[-0.25+0.85*q,0,0.06],shR:[0.18,0,0],ftR:[0.25,0,0]}); const F=ppFrame(pose,fig); pose.hands=ppHands(F,[0.2,1.18,0.42],[0.5,-0.6,-0.5]); return ppSolve(pose,fig); }
  const pose=ppStand(fig,{w:0.13,hinge:0.95,hz:-0.18,drop:0.06}); delete pose.feet.R;
  Object.assign(pose,{thR:[-0.95+1.5*q,0,0.04],shR:[1.5-0.45*q,0,0],ftR:[-0.2,0,0]}); const F=ppFrame(pose,fig); pose.hands=ppHands(F,[0.22,1.15,0.45],[0.6,-0.4,-0.6]); return ppSolve(pose,fig); }

/* ---------- batch 4's kit (part 2) ---------- */
/* a roller across both legs at a point on the right shin (rest coordinates, mirrored for the left) */
function ppLegRoller(K,B,fig,pt,r){ const a=ppXf(ppBone(B,7),pt), b=ppXf(ppBone(B,10),[-pt[0],pt[1],pt[2]]), d=ppNorm(ppSub(b,a));
  K.bar(ppAdd(a,ppMul(d,-0.1)),ppAdd(b,ppMul(d,0.1)),r||0.05,1); return [ppAdd(a,ppMul(d,-0.1)),ppAdd(b,ppMul(d,0.1))]; }
/* the lying leg curl's bench, handles and ankle roller on its lever */
function ppLyingCurlKit(st,K){ const B=st.B, L=RIG[st.fig], P=ppBone(B,0), S=ppBone(B,1), n=ppMul(ppXd(P,[0,0,1]),-1);
  K.slab(ppXf(ppBone(B,6),[0,0.5,0.14]),ppXf(S,[0,1.42,0.14]),0.34,0.08,n,1);
  const r=ppLegRoller(K,B,st.fig,[L.an[0],L.an[1]+0.1,L.an[2]-0.08]), kp=ppXf(ppBone(B,6),[L.kn[0]+0.14,L.kn[1],L.kn[2]]); K.bar(kp,ppAdd(r[0],[0.02,0,0]),0.022,0); K.bar(ppAdd(kp,[-0.03,0,0]),ppAdd(kp,[0.04,0,0]),0.045,0);
  K.bar([-0.3,0.56,0.72],[0.3,0.56,0.72],0.016,0); [-1,1].forEach(s=>K.box([s*0.12-0.03,0,-0.35],[s*0.12+0.03,0.55,-0.29],2)); K.box([-0.03,0,0.3],[0.03,0.55,0.36],2); K.box([-0.3,0,-0.4],[0.3,0.04,0.75],2); }
/* the seated machines: seat, back pad, a roller behind (the curl) or in front of (the extension) the shins, the curl's thigh pad */
function ppSeatLegKit(o){ return (st,K)=>{ const B=st.B, L=RIG[st.fig], P=ppBone(B,0), S=ppBone(B,1), y=ppXf(P,[0,0.79,-0.1])[1]-0.005;
  K.box([-0.19,y-0.08,-0.22],[0.19,y,0.32],1); K.slab(ppXf(P,[0,0.95,-0.17]),ppXf(S,[0,1.6,-0.17]),0.4,0.08,ppXd(S,[0,0,1]),1);
  K.post([0,y-0.08,0.0],0.07,2); K.box([-0.3,0,-0.4],[0.3,0.012,0.15],2);
  const r=ppLegRoller(K,B,st.fig,[L.an[0],L.an[1]+0.12,L.an[2]+(o.ext?0.1:-0.09)]), kp=ppXf(ppBone(B,6),[L.kn[0]+0.15,L.kn[1],L.kn[2]]);
  K.bar(kp,ppAdd(r[0],[0.02,0,0]),0.024,0); K.bar(ppAdd(kp,[-0.03,0,0]),ppAdd(kp,[0.05,0,0]),0.05,0); K.box([0.32,0,kp[2]-0.08],[0.42,kp[1]+0.05,kp[2]+0.08],2);
  if(!o.ext){ const a=ppXf(ppBone(B,6),[L.kn[0],L.kn[1]+0.11,L.kn[2]+0.11]), b=ppXf(ppBone(B,9),[-L.kn[0],L.kn[1]+0.11,L.kn[2]+0.11]); K.bar(ppAdd(a,[0.1,0,0]),ppAdd(b,[-0.1,0,0]),0.045,1); } }; }
/* the standing leg curl: a pad at the hips, handles, the roller behind the right ankle on its lever */
function ppStandCurlKit(st,K){ const B=st.B, L=RIG[st.fig], P=ppBone(B,0), a=ppXf(ppBone(B,7),[L.an[0],L.an[1]+0.1,L.an[2]-0.08]), kp=ppXf(ppBone(B,6),[L.kn[0]+0.14,L.kn[1],L.kn[2]]);
  K.bar(ppAdd(a,[-0.08,0,0]),ppAdd(a,[0.1,0,0]),0.045,1); K.bar(kp,ppAdd(a,[0.1,0,0]),0.022,0); K.bar(ppAdd(kp,[-0.03,0,0]),ppAdd(kp,[0.04,0,0]),0.045,0);
  K.box([-0.2,0.86,0.12],[0.22,1.02,0.2],1,P); const g=ppGrips(B,st.fig); K.bar(ppAdd(g.L,[-0.05,0,0]),ppAdd(g.R,[0.05,0,0]),0.016,0);
  K.box([-0.04,0,0.42],[0.04,1.12,0.5],2); K.box([-0.3,0,0.3],[0.3,0.05,0.6],2); K.box([0.3,0,kp[2]-0.06],[0.38,kp[1]+0.04,kp[2]+0.06],2); }
/* the Nordic's ankle anchor on the floor; the glute-ham bench's knee pad, foot plate and heel roller */
function ppNordicKit(st,K){ const B=st.B, L=RIG[st.fig]; ppMat(K,-0.75,1.1,0.36); const r=ppLegRoller(K,B,st.fig,[L.an[0],L.an[1]+0.04,L.an[2]-0.05],0.045);
  K.box([-0.3,0,r[0][2]-0.06],[0.3,0.05,r[0][2]+0.06],2); [r[0],r[1]].forEach(e=>K.bar([e[0],0.05,e[2]],e,0.02,2)); }
function ppGHRKit(st,K){ const B=st.B, L=RIG[st.fig], kn=ppXf(ppBone(B,7),L.kn); K.bar([-0.22,kn[1]-0.15,kn[2]+0.13],[0.22,kn[1]-0.15,kn[2]+0.13],0.08,1);
  const r=ppLegRoller(K,B,st.fig,[L.an[0],L.an[1]+0.05,L.an[2]-0.06],0.045), an=ppXf(ppBone(B,7),L.an); K.box([-0.2,an[1]-0.15,an[2]-0.14],[0.2,an[1]+0.1,an[2]-0.11],2);
  K.bar([0,kn[1]-0.2,kn[2]+0.12],[0,0.05,kn[2]+0.12],0.035,2); K.bar([0,an[1]-0.15,an[2]-0.12],[0,0.05,an[2]-0.12],0.035,2); K.box([-0.3,0,an[2]-0.2],[0.3,0.05,kn[2]+0.2],2); }
/* the calf machines: a block under the balls of the feet; shoulder pads on a frame (standing), a knee pad (seated) */
function ppCalfKit(o){ return (st,K)=>{ const B=st.B, L=RIG[st.fig], k=o.kind;
  if(k==="seat"){ ppUprightKit(K,B,{back:false}); K.box([-0.25,0,0.5],[0.25,0.08,0.6],2);   /* a narrow step: the heels hang off its back, the toes over its front */ const a=ppXf(ppBone(B,6),[L.kn[0],L.kn[1]+0.15,L.kn[2]+0.1]), b=ppXf(ppBone(B,9),[-L.kn[0],L.kn[1]+0.15,L.kn[2]+0.1]);
    K.bar(ppAdd(a,[0.08,0,0]),ppAdd(b,[-0.08,0,0]),0.05,1); K.bar(ppAdd(a,[0.08,0,0]),[0.3,0.3,a[2]+0.2],0.025,0); return; }
  if(k==="wall"){ ppWallKit(st,K); return; }
  if(k==="one"){ K.box([-0.25,0,-0.1],[0.32,0.11,0.12],1); K.box([-0.4,0,0.34],[-0.32,1.9,0.42],2); return; }
  K.box([-0.3,0,-0.1],[0.3,0.11,0.12],1);
  if(k==="stand"){ const S=ppBone(B,1); [-1,1].forEach(s=>{ K.box([s*0.1,1.5,-0.12],[s*0.24,1.58,0.07],1,S); const t=ppXf(S,[s*0.32,1.54,-0.03]); K.bar(t,[s*0.42,t[1],-0.3],0.026,0); K.box([s*0.42-0.035,0,-0.335],[s*0.42+0.035,2.0,-0.265],2); }); K.box([-0.45,1.98,-0.34],[0.45,2.04,-0.26],2); } }; }
/* the jump rope: a loop through both hands, turning round them; under the feet as the body leaves the floor */
function ppRopeKit(st,K){ const g=ppGrips(st.B,st.fig), w=(st.t||0)*9.5, N=18, pts=[], m=ppLerp(g.R,g.L,0.5);
  for(let i=0;i<=N;i++){ const u=i/N, x=0.44*Math.cos(Math.PI*u), r=0.9*Math.pow(Math.sin(Math.PI*u),0.6)+0.03, base=[m[0]+x*(Math.abs(g.R[0])>0?1:1),m[1],m[2]];
    pts.push(ppAdd(base,[0,-Math.cos(w)*r,Math.sin(w)*r])); }
  pts[0]=g.R; pts[N]=g.L; for(let i=0;i<N;i++) K.bar(pts[i],pts[i+1],0.006,1);
  [g.R,g.L].forEach(h=>K.bar(ppAdd(h,[0,-0.07,0]),ppAdd(h,[0,0.07,0]),0.018,1)); }
/* a wall behind the back */
/* the body's back-most point (its back, buttocks and head): a wall it leans on stands there */
function ppBackZ(B){ let z=1e9; [[1,[0,1.38,-0.172]],[1,[0.1,1.36,-0.166]],[1,[-0.1,1.36,-0.166]],[1,[0,1.2,-0.14]],[1,[0,1.47,-0.158]],[0,[0.09,0.88,-0.17]],[0,[-0.09,0.88,-0.17]],[12,[0,1.68,-0.105]]].forEach(([b,p])=>{ z=Math.min(z,ppXf(ppBone(B,b),p)[2]); }); return z; }
function ppWallKit(st,K){ const wz=ppBackZ(st.B); K.box([-0.48,0,wz-0.1],[0.48,1.55,wz],2); }
/* the band round both knees */
function ppKneeBand(st,K){ const B=st.B, L=RIG[st.fig], pt=[L.kn[0]+0.07,L.kn[1]+0.06,L.kn[2]], a=ppXf(ppBone(B,6),pt), b=ppXf(ppBone(B,9),[-pt[0],pt[1],pt[2]]);
  [0.07,-0.06].forEach(z=>K.bar(ppAdd(a,[0,0,z]),ppAdd(b,[0,0,z]),0.009,1)); [a,b].forEach(e=>K.bar(ppAdd(e,[0,0,0.07]),ppAdd(e,[0,0,-0.06]),0.009,1)); }
/* the hip machines: the bench, a pad on the inside (adductor) or outside (abductor) of each knee on its lever */
function ppHipMachKit(o){ return (st,K)=>{ const B=st.B, L=RIG[st.fig]; ppUprightKit(K,B,{});
  [[1,6],[-1,9]].forEach(([s,bi])=>{ const T=ppBone(B,bi), x=o.add?L.kn[0]-0.075:L.kn[0]+0.075, c=[s*x,L.kn[1]+0.08,L.kn[2]];
    K.box([c[0]-0.025*s,c[1]-0.11,c[2]-0.07],[c[0]+0.025*s,c[1]+0.11,c[2]+0.07],1,T); const e=ppXf(T,c); K.bar(e,[e[0],0.3,0.05],0.024,0); });
  K.box([-0.45,0,-0.1],[0.45,0.012,0.62],2); }; }
/* the cable kickback's column, low pulley and ankle cuff */
function ppKickCableKit(st,K){ const B=st.B, L=RIG[st.fig], a=ppXf(ppBone(B,7),[L.an[0],L.an[1]+0.07,L.an[2]]), b=ppXf(ppBone(B,7),[L.an[0],L.an[1]+0.13,L.an[2]]);
  K.bar(a,b,0.05,1); ppCable(K,0.12,0.72,0.14,ppLerp(a,b,0.5)); }
/* the glute kickback machine: a chest pad, handles, the foot plate under the right sole on its lever */
function ppKickMachKit(st,K){ const B=st.B, L=RIG[st.fig], S=ppBone(B,1), F=ppBone(B,8), g=ppGrips(B,st.fig);
  K.slab(ppXf(S,[0,1.45,0.14]),ppXf(S,[0,1.05,0.14]),0.38,0.08,ppMul(ppXd(S,[0,0,1]),-1),1); const lo=ppAdd(ppXf(S,[0,1.25,0.22]),[0,-0.02,0]); K.post(lo,0.07,2);
  K.bar(ppAdd(g.L,[-0.05,0,0]),ppAdd(g.R,[0.05,0,0]),0.016,0); [g.R,g.L].forEach(h=>K.bar(h,[h[0],0.05,h[2]],0.02,2));
  K.box([L.an[0]-0.07,-0.015,-0.12],[L.an[0]+0.08,0.005,0.13],2,F); const pl=ppXf(F,[L.an[0]+0.1,0.0,0.0]), pv=ppXf(ppBone(B,0),[0.3,0.87,-0.05]); K.bar(pl,pv,0.025,0);
  K.box([-0.35,0,lo[2]-0.3],[0.35,0.012,lo[2]+0.3],2); }

function ppMoves4b(){
  const mv=(f,cam,kit)=>({view:cam.yaw,cam,f,kit}), none=()=>{};
  return {
    curl_lying:mv((p,t,fig)=>ppLyingCurlPose(p,fig),{yaw:1.25,pitch:0.2},ppLyingCurlKit),
    curl_seated:mv((p,t,fig)=>ppSeatLegPose(p,fig,{}),{yaw:1.3,pitch:0.12},ppSeatLegKit({})),
    leg_ext_mach:mv((p,t,fig)=>ppSeatLegPose(p,fig,{ext:true}),{yaw:1.3,pitch:0.12},ppSeatLegKit({ext:true})),
    curl_standing:mv((p,t,fig)=>ppStandCurlPose(p,fig),{yaw:1.6,pitch:0.08},ppStandCurlKit),
    nordic:mv((p,t,fig)=>ppKneelCurlPose(p,fig,{}),{yaw:1.45,pitch:0.12},ppNordicKit),
    ghr:mv((p,t,fig)=>ppKneelCurlPose(p,fig,{ghr:true}),{yaw:1.45,pitch:0.1},ppGHRKit),
    calf_stand:mv((p,t,fig)=>ppCalfPose(p,fig,{kind:"stand"}),{yaw:1.15,pitch:0.08},ppCalfKit({kind:"stand"})),
    calf_one:mv((p,t,fig)=>ppCalfPose(p,fig,{kind:"one"}),{yaw:1.1,pitch:0.08},ppCalfKit({kind:"one"})),
    calf_bent:mv((p,t,fig)=>ppCalfPose(p,fig,{kind:"bent"}),{yaw:1.15,pitch:0.08},ppCalfKit({kind:"bent"})),
    calf_seat:mv((p,t,fig)=>ppCalfPose(p,fig,{kind:"seat"}),{yaw:1.2,pitch:0.12},ppCalfKit({kind:"seat"})),
    calf_wall:mv((p,t,fig)=>ppCalfPose(p,fig,{kind:"wall"}),{yaw:1.25,pitch:0.08},ppCalfKit({kind:"wall"})),
    jump_rope:mv((p,t,fig)=>ppCalfPose(p,fig,{kind:"rope"},t),{yaw:0.55,pitch:0.06},ppRopeKit),
    tib_wall:mv((p,t,fig)=>ppTibPose(p,fig,{kind:"wall"}),{yaw:1.2,pitch:0.08},ppWallKit),
    heel_walk:mv((p,t,fig)=>ppTibPose(p,fig,{kind:"walk"},t),{yaw:1.1,pitch:0.08},none),
    toe_band:mv((p,t,fig)=>ppTibPose(p,fig,{kind:"band"}),{yaw:1.15,pitch:0.25},(st,K)=>{ const B=st.B, L=RIG[st.fig]; ppMat(K,-0.5,1.3,0.36);
      const a=ppXf(ppBone(B,8),L.toe), b=ppXf(ppBone(B,11),[-L.toe[0],L.toe[1],L.toe[2]]), c=[0,0.25,1.25]; K.bar(a,b,0.012,1); K.bar(a,c,0.008,1); K.bar(b,c,0.008,1); K.box([-0.05,0,1.2],[0.05,0.55,1.3],2); }),
    abd_side:mv((p,t,fig)=>ppSidePose(p,fig,{ab:true}),{yaw:0.25,pitch:0.3},(st,K)=>{ K.box([-1.05,0,-0.36],[1.0,0.012,0.36],1); }),
    copenhagen:mv((p,t,fig)=>ppSidePose(p,fig,{cph:true}),{yaw:0.3,pitch:0.22},(st,K)=>{ K.box([-1.05,0,-0.36],[0.6,0.012,0.36],1); K.box([0.75,0.375,-0.35],[1.15,0.45,0.35],1); [-0.25,0.25].forEach(z=>K.post([0.95,0.375,z],0.06,2)); }),
    lat_walk:mv((p,t,fig)=>ppLatWalkPose(p,fig),{yaw:0.35,pitch:0.08},ppKneeBand),
    adductor:mv((p,t,fig)=>ppHipMachPose(p,fig,{add:true}),{yaw:0.4,pitch:0.15},ppHipMachKit({add:true})),
    abductor:mv((p,t,fig)=>ppHipMachPose(p,fig,{}),{yaw:0.4,pitch:0.15},ppHipMachKit({})),
    kick_cable:mv((p,t,fig)=>ppKickPose(p,fig,{cable:true}),{yaw:1.5,pitch:0.08},ppKickCableKit),
    kick_mach:mv((p,t,fig)=>ppKickPose(p,fig,{}),{yaw:1.5,pitch:0.1},ppKickMachKit),
  };
}
function ppNames4b(){ return ppNames4b.m||(ppNames4b.m={"lying leg curl":"curl_lying","seated leg curl":"curl_seated","leg extension":"leg_ext_mach","standing leg curl":"curl_standing","nordic curl":"nordic",
    "glute-ham raise":"ghr","standing calf raise":"calf_stand","single-leg calf raise":"calf_one","bent-knee calf raise":"calf_bent","seated calf raise":"calf_seat",
    "wall-sit calf raise":"calf_wall","jump rope":"jump_rope","tibialis raise":"tib_wall","heel walk":"heel_walk","banded toe raise":"toe_band",
    "side-lying hip abduction":"abd_side","copenhagen plank":"copenhagen","banded lateral walk":"lat_walk","adductor machine":"adductor",
    "hip abduction machine":"abductor","cable kickback":"kick_cable","glute kickback machine":"kick_mach"}); }
function ppMoveFor4b(n){
  const ex=ppNames4b();
  if(ex[n]) return ex[n];
  if(/leg curl/.test(n)) return /seated/.test(n)?"curl_seated":/standing/.test(n)?"curl_standing":"curl_lying";
  if(/leg extension/.test(n)) return "leg_ext_mach";
  if(/calf raise/.test(n)&&!/press/.test(n)) return /seated/.test(n)?"calf_seat":/single|one/.test(n)?"calf_one":"calf_stand";
  return null;
}

/* =========================================================
   CABLES, FLIES AND TRICEPS (batch 5, 21 Oct): cable flies and the cable press, the pec deck, dumbbell flies and the
   pullover, skull crushers and the triceps machine, kickbacks, pushdowns, the overhead cable extension, cable curls,
   cable raises, the doorway stretch
   ========================================================= */
/* a fly's hand in the torso's rest frame: the arm swung round the shoulder from out to the side (a 1.45) to in front
   (a 0.12), y lifts or drops it */
function ppFlyHand(L,a,r,y){ return ppAdd(L.sh,[Math.sin(a)*r,y,Math.cos(a)*r]); }
/* lying on a bench (flat or o.incl), feet on the floor: the bench press's body without its hands */
function ppLieBody(fig,o){ const L=RIG[fig], th=o.incl||0, pose={pelvis:[-(Math.PI/2-th),0,0],spine:[-0.05,0,0],head:[-0.2,0,0],shrug:-0.008};
  ppPlace(pose,fig,[0,0.83,-0.155],th?[0,0.47,0.36]:[0,0.455,0.32]); const hip=ppXf(ppBone(boneMats(pose,fig,1),0),L.hip), ank=[0.25,0.115,hip[2]+0.43];
  pose.feet={R:{t:ank,pole:[0.3,0.75,0.6],aim:[0.08,-0.55,0.83]},L:{t:[-ank[0],ank[1],ank[2]],pole:[-0.3,0.75,0.6],aim:[-0.08,-0.55,0.83]}}; return pose; }
/* flies: o.body lie (a bench, o.incl), stand (between cable towers, a step forward) or seat (the pec deck); o.y0, o.y1
   lift the hands' path from the start to the end (low-to-high, high-to-low) */
function ppFlyPose(p,fig,o){ const L=RIG[fig], q=ppEase(p), r=0.88*ppReach(L), a=1.42-1.7*q, y=(o.y0||0)+((o.y1||0)-(o.y0||0))*q;
  const pose=o.body==="lie"?ppLieBody(fig,o):o.body==="seat"?ppSit(fig,{h:0.47,lean:-0.05,w:0.2,fz:0.44}):ppStand(fig,{w:0.13,fz:[0.24,-0.2],hinge:0.18,hz:-0.03,drop:0.03,spine:[0.04,0,0]});
  const F=ppFrame(pose,fig); pose.hands=ppHands(F,ppFlyHand(L,a,r,y-0.03),[0.5,-0.7,-0.5]); return ppSolve(pose,fig); }
/* the standing cable chest press: from beside the chest, pressed forward and a little in */
function ppCablePressPose(p,fig){ const q=ppEase(p), pose=ppStand(fig,{w:0.13,fz:[0.24,-0.2],hinge:0.15,hz:-0.03,drop:0.03}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,ppBez([0.3,1.27,0.05],[0.24,1.3,0.3],[0.12,1.33,0.5],q),[0.6,-0.6,-0.5]); return ppSolve(pose,fig); }
/* the dumbbell pullover: lying on the bench, one dumbbell from over the chest back behind the head, arms long */
function ppPulloverPose(p,fig){ const L=RIG[fig], q=ppEase(p), r=0.94*ppReach(L), b=0.95*q, pose=ppLieBody(fig,{}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,ppAdd([0.065,L.sh[1],L.sh[2]],[0,Math.sin(b)*r,Math.cos(b)*r]),[0.6,-0.3,0.2]); return ppSolve(pose,fig); }
/* the skull crusher: lying on the bench, upper arms up (a little back), the forearms lower the bar to the forehead */
function ppSkullPose(p,fig){ const L=RIG[fig], q=ppEase(p), [la,lb]=ppArm(L), ud=ppNorm([-0.02,0.25,1]), bu=Math.atan2(0.25,1), E=ppAdd(L.sh,ppMul(ud,la)), a=1.95*q;
  const pose=ppLieBody(fig,{}), F=ppFrame(pose,fig), dx=Math.max(-0.9,Math.min(0.9,(0.15-E[0])/lb)), k=Math.sqrt(1-dx*dx);
  pose.hands=ppHands(F,ppAdd(E,[dx*lb,Math.sin(bu+a)*k*lb,Math.cos(bu+a)*k*lb]),[0,-0.5,1]); pose.set={twR:1.1,twL:1.1}; pose.bar=true; return ppSolve(pose,fig); }
/* the machine triceps extension: seated, upper arms down the pad (as the preacher curl), the forearms pressed down */
function ppTriMachPose(p,fig){ const L=RIG[fig], q=ppEase(p), pose=ppSit(fig,{h:0.62,lean:0.45,w:0.17,fz:0.4,head:[0.12,0,0],spine:[0.08,0,0]}), sh=ppShoulders(pose,fig);
  pose.hands=ppHandsAt(ppCurlGrip(L,sh.R,[0.03,-0.66,0.75],2.45-1.5*q,0.17),[0.1,-1,0.55]); pose.set={twR:0.4,twL:0.4}; pose.bar=true; return ppSolve(pose,fig); }
/* the triceps kickback: bent over, upper arms along the torso, the forearms swing from hanging to straight back */
function ppKickbackPose(p,fig){ const L=RIG[fig], q=ppEase(p), [la,lb]=ppArm(L), pose=ppBentBase(fig,{hinge:1.15,drop:0.12,hz:-0.3}), F=ppFrame(pose,fig), H={};
  [["R",1],["L",-1]].forEach(([S,s])=>{ const sh=ppXf(F.Sp,[s*L.sh[0],L.sh[1],L.sh[2]]), ud=ppNorm(ppXd(F.Sp,[s*0.2,-1,-0.45])), E=ppAdd(sh,ppMul(ud,la));
    const fd=ppNorm(ppLerp([0,-1,0.04],ud,q)); H[S]={t:ppAdd(E,ppMul(fd,lb)),pole:[0,1,0.2]}; });
  pose.hands=H; return ppSolve(pose,fig); }
/* pushdowns: elbows pinned at the sides, the forearms from up at the chest to straight down; o.rope spreads at the bottom */
function ppPushdownPose(p,fig,o){ const L=RIG[fig], q=ppEase(p), pose=ppStand(fig,{w:0.14,hinge:0.14,hz:-0.04,drop:0.025,spine:[0.04,0,0]}), F=ppFrame(pose,fig);
  const x=o.rope?0.09+0.11*q:0.16; pose.hands=ppHands(F,ppCurlGrip(L,L.sh,[-0.02,-1,0.1],1.95-1.8*q,x),[0.25,-0.45,-1]); pose.set={twR:o.rope?0:1.3,twL:o.rope?0:1.3}; pose.bar=!o.rope; return ppSolve(pose,fig); }
/* the overhead cable extension: facing away from the pulley, a step forward, the elbows up by the head, the forearms
   extending from behind the head to forward and up */
function ppOHCablePose(p,fig){ const L=RIG[fig], q=ppEase(p), [la,lb]=ppArm(L), pose=ppStand(fig,{w:0.12,fz:[0.3,-0.22],hinge:0.32,hz:-0.04,drop:0.05,spine:[0.04,0,0],head:[-0.15,0,0]}), F=ppFrame(pose,fig);
  const ud=ppNorm([-0.14,0.62,0.78]), th=Math.atan2(ud[1],ud[2]), E=ppAdd(L.sh,ppMul(ud,la)), a=1.95*(1-q)+0.08, dx=Math.max(-0.9,Math.min(0.9,(0.07-E[0])/lb)), k=Math.sqrt(1-dx*dx);
  pose.hands=ppHands(F,ppAdd(E,[dx*lb,Math.sin(th+a)*k*lb,Math.cos(th+a)*k*lb]),[0.1,0.5,1]); return ppSolve(pose,fig); }
/* the Bayesian cable curl: facing away from a low pulley, the right arm reaching back, curled forward */
function ppBayesPose(p,fig){ const L=RIG[fig], q=ppEase(p), pose=ppStand(fig,{w:0.12,fz:[-0.18,0.24],hinge:0.12,drop:0.03}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,ppCurlGrip(L,L.sh,[0.02,-1,-0.42+0.2*q],0.15+2.05*q,0.27),[0.25,-0.4,-1],true); pose.hands.L={t:ppXf(F.Sp,[-0.2,1.0,0.03]),pole:ppXd(F.Sp,[-1,0.2,-0.5]),flat:true};
  pose.set={twR:-1.45}; return ppSolve(pose,fig); }
/* the doorway stretch: forearms up on the door frame, the body easing forward through it */
function ppDoorPose(p,fig){ const L=RIG[fig], q=ppEase(p), [la,lb]=ppArm(L,true), pose=ppStand(fig,{w:0.12,fz:[0.2+0.1*q,-0.1],hinge:0.06+0.08*q,hz:0.04+0.1*q,drop:0.02,spine:[-0.05,0,0]});
  const sh=ppShoulders(pose,fig), H={}; [["R",1],["L",-1]].forEach(([S,s])=>{ const S0=s>0?sh.R:sh.L, E=[s*0.51,S0[1]-0.02,ppDoorZ()-0.075], g=[s*0.51,E[1]+lb*0.97,ppDoorZ()-0.07];
    H[S]={t:g,pole:[s*0.5,-1,-0.45]}; }); pose.hands=H; pose.flat=true;   /* elbows forward, on the frame's face */ return ppSolve(pose,fig); }
function ppDoorZ(){ return -0.05; }   // the door frame's back face

/* ---------- batch 5's kit ---------- */
/* D-handles across the fists */
function ppDHandles(K,B,fig){ const L=RIG[fig], G=ppGripPt(L), out=[]; [[1,"R"],[-1,"L"]].forEach(([s,S])=>{ const g=ppXf(ppBone(B,S==="R"?3:5),[s*G[0],G[1],G[2]]), ax=ppFistAxis(B,fig,S);
  K.bar(ppAdd(g,ppMul(ax,-0.06)),ppAdd(g,ppMul(ax,0.06)),0.016,0); out.push(g); }); return out; }
/* a cable tower each side with the pulley at height y, each cable to the near hand (o.cross: to the far hand) */
function ppTowers(o){ return (st,K)=>{ const g=ppDHandles(K,st.B,st.fig); ppCable(K,0.9,o.z==null?-0.15:o.z,o.y,o.cross?g[1]:g[0]); ppCable(K,-0.9,o.z==null?-0.15:o.z,o.y,o.cross?g[0]:g[1]); if(o.with) o.with(st,K); }; }
/* the pec deck: seat and tall back, the arms on a pivot behind the shoulders, handles at the hands */
function ppPecDeckKit(st,K){ const B=st.B, S=ppBone(B,1); ppUprightKit(K,B,{}); const g=ppDHandles(K,B,st.fig), top=ppXf(S,[0,1.75,-0.3]);
  [[1,g[0]],[-1,g[1]]].forEach(([s,h])=>{ const pv=ppXf(S,[s*0.22,1.62,-0.3]); K.bar(ppAdd(h,[0,0.08,0]),[h[0],pv[1],h[2]],0.022,0); K.bar([h[0],pv[1],h[2]],pv,0.022,0); K.bar(ppAdd(pv,[0,-0.05,0]),ppAdd(pv,[0,0.05,0]),0.045,0); });
  K.box([-0.3,top[1]-0.04,top[2]-0.06],[0.3,top[1]+0.04,top[2]+0.04],2); K.box([-0.05,0,top[2]-0.14],[0.05,top[1],top[2]-0.04],2); }
/* the pullover's dumbbell: upright from the hands, its top head in the palms */
function ppTwoHandDB(st,K){ const B=st.B, L=RIG[st.fig], g=ppGrips(B,st.fig), h=ppLerp(g.R,g.L,0.5), eR=ppXf(ppBone(B,3),L.el), eL=ppXf(ppBone(B,5),[-L.el[0],L.el[1],L.el[2]]), d=ppNorm(ppSub(ppLerp(eR,eL,0.5),h));
  K.dumbbell(ppAdd(h,ppMul(d,0.12)),d,1); }
/* the door frame */
function ppDoorKit(st,K){ const z=ppDoorZ(); [-1,1].forEach(s=>K.box([s*0.46,0,z],[s*0.56,2.1,z+0.12],2)); K.box([-0.56,2.1,z],[0.56,2.2,z+0.12],2); }

function ppMoves5(){
  const mv=(f,cam,kit)=>({view:cam.yaw,cam,f,kit}), cSt={yaw:0.55,pitch:0.08}, bench=(st,K)=>ppBenchKit(K,st.B,{}), cLie={yaw:2.45,pitch:0.5};
  return {
    fly_cable:mv((p,t,fig)=>ppFlyPose(p,fig,{body:"stand"}),cSt,ppTowers({y:1.55})),
    fly_cable_up:mv((p,t,fig)=>ppFlyPose(p,fig,{body:"stand",y0:-0.42,y1:0.02}),cSt,ppTowers({y:0.3})),
    fly_cable_down:mv((p,t,fig)=>ppFlyPose(p,fig,{body:"stand",y0:0.32,y1:-0.32}),cSt,ppTowers({y:2.0})),
    press_cable:mv((p,t,fig)=>ppCablePressPose(p,fig),cSt,ppTowers({y:1.3,z:-0.3})),
    pec_deck:mv((p,t,fig)=>ppFlyPose(p,fig,{body:"seat"}),{yaw:0.5,pitch:0.1},ppPecDeckKit),
    fly_db:mv((p,t,fig)=>ppFlyPose(p,fig,{body:"lie"}),cLie,ppDBs({with:bench})),
    fly_db_inc:mv((p,t,fig)=>ppFlyPose(p,fig,{body:"lie",incl:0.6}),{yaw:0.62,pitch:0.32},ppDBs({with:(st,K)=>ppBenchKit(K,st.B,{incl:0.6})})),
    pullover:mv((p,t,fig)=>ppPulloverPose(p,fig),{yaw:1.35,pitch:0.32},(st,K)=>{ ppTwoHandDB(st,K); ppBenchKit(K,st.B,{}); }),
    skull:mv((p,t,fig)=>ppSkullPose(p,fig),{yaw:1.3,pitch:0.3},ppBB({r:0.12,half:0.42,with:bench})),
    tri_mach:mv((p,t,fig)=>ppTriMachPose(p,fig),{yaw:1.1,pitch:0.14},ppPreacherKit({mach:true})),
    tri_kickback:mv((p,t,fig)=>ppKickbackPose(p,fig),{yaw:1.55,pitch:0.12},ppDBs({sc:0.8})),
    pushdown_bar:mv((p,t,fig)=>ppPushdownPose(p,fig,{}),{yaw:1.6,pitch:0.07},(st,K)=>ppCable(K,0,0.42,2.1,ppStraightBar(K,ppGrips(st.B,st.fig),0.24))),
    pushdown_rope:mv((p,t,fig)=>ppPushdownPose(p,fig,{rope:true}),{yaw:1.6,pitch:0.07},(st,K)=>{ const g=ppGrips(st.B,st.fig), c=ppAdd(ppLerp(g.R,g.L,0.5),[0,0.17,0.04]); ppRope(K,g,c); ppCable(K,0,0.42,2.1,c); }),
    oh_cable:mv((p,t,fig)=>ppOHCablePose(p,fig),{yaw:1.5,pitch:0.07},(st,K)=>{ const g=ppGrips(st.B,st.fig), c=ppAdd(ppLerp(g.R,g.L,0.5),[0,-0.02,-0.15]); ppRope(K,g,c); ppCable(K,0,-0.85,1.55,c); }),
    curl_cable:mv((p,t,fig)=>ppCurlPose(p,fig,{x0:0.2,x1:0.18,tw:-1.45,bar:true}),{yaw:1.6,pitch:0.07},(st,K)=>ppCable(K,0,0.5,0.15,ppStraightBar(K,ppGrips(st.B,st.fig),0.25))),
    curl_cable_rope:mv((p,t,fig)=>ppCurlPose(p,fig,{x0:0.12,x1:0.11,tw:0}),{yaw:1.6,pitch:0.07},(st,K)=>{ const g=ppGrips(st.B,st.fig), c=ppAdd(ppLerp(g.R,g.L,0.5),[0,-0.14,0.03]); ppRope(K,g,c); ppCable(K,0,0.5,0.15,c); }),
    curl_bayes:mv((p,t,fig)=>ppBayesPose(p,fig),{yaw:1.4,pitch:0.07},(st,K)=>{ const g=ppDHandles(K,st.B,st.fig); ppCable(K,0.12,-0.62,0.18,g[0]); }),
    raise_cable_lat:mv((p,t,fig)=>ppRaisePose(p,fig,{side:true,top:1.3,one:true,stand:{drop:0.015,tilt:-0.06,fx:-0.04,spine:[0.04,0,0]},post:[-0.5,0.98,0.1]}),{yaw:0.4,pitch:0.07},(st,K)=>{ const g=ppDHandles(K,st.B,st.fig); ppCable(K,-0.58,0.1,0.18,g[0]); }),
    raise_cable_y:mv((p,t,fig)=>ppRaisePose(p,fig,{side:true,top:2.1}),{yaw:0.35,pitch:0.07},ppTowers({y:0.2,z:0.35,cross:true})),
    raise_cable_front:mv((p,t,fig)=>ppRaisePose(p,fig,{side:false,top:1.4,x:0.2,bar:true}),{yaw:1.2,pitch:0.07},(st,K)=>ppCable(K,0,-0.55,0.15,ppStraightBar(K,ppGrips(st.B,st.fig),0.24))),
    door_stretch:mv((p,t,fig)=>ppDoorPose(p,fig),{yaw:0.75,pitch:0.08},ppDoorKit),
  };
}
function ppNames5(){ return ppNames5.m||(ppNames5.m={"cable fly":"fly_cable","low-to-high cable fly":"fly_cable_up","high-to-low cable fly":"fly_cable_down",
  "cable chest press":"press_cable","pec deck":"pec_deck","dumbbell fly":"fly_db","incline dumbbell fly":"fly_db_inc","dumbbell pullover":"pullover",
  "skull crusher":"skull","machine triceps extension":"tri_mach","triceps kickback":"tri_kickback","cable pushdown":"pushdown_bar","rope pushdown":"pushdown_rope",
  "overhead cable extension":"oh_cable","cable curl":"curl_cable","cable hammer curl":"curl_cable_rope","bayesian cable curl":"curl_bayes",
  "cable lateral raise":"raise_cable_lat","cable y-raise":"raise_cable_y","cable front raise":"raise_cable_front","doorway pec stretch":"door_stretch"}); }
function ppMoveFor5(n){ const ex=ppNames5(); if(ex[n]) return ex[n];
  /* your own exercises, by their words */
  if(/fly|flye/.test(n)&&!/reverse|rear/.test(n)) return /cable/.test(n)?"fly_cable":/incline/.test(n)?"fly_db_inc":"fly_db";
  if(/pushdown|push-down/.test(n)) return /rope/.test(n)?"pushdown_rope":"pushdown_bar";
  if(/skull/.test(n)) return "skull";
  if(/cable.*curl/.test(n)) return /hammer|rope/.test(n)?"curl_cable_rope":"curl_cable";
  if(/cable.*lateral raise/.test(n)) return "raise_cable_lat";
  if(/kickback/.test(n)&&/tricep/.test(n)) return "tri_kickback";
  if(/pec deck|chest fly machine/.test(n)&&!/reverse/.test(n)) return "pec_deck";
  return null; }

/* =========================================================
   CORE AND THE REST (batch 6, 21 Oct): the plank, the side plank, the ab wheel, the hanging leg raise, the dead bug,
   the Pallof press, the woodchop, the wall slide, the pike push-up
   ========================================================= */
/* the forearm plank: straight from the toes to the shoulders, elbows under the shoulders, a slow brace */
function ppPlankPose(p,fig){ const L=RIG[fig], q=ppEase(p), want=0.37+0.012*q, toe=L.toe, at=[0.12,0.004,-0.78], shrug=0;
  const dy=L.sh[1]-toe[1], dz=L.sh[2]-toe[2], R=Math.hypot(dy,dz), dl=Math.atan2(-dz,dy), phi=Math.asin(Math.max(-1,Math.min(1,(want-at[1])/R)))-dl;
  const pose=ppPlace({pelvis:[Math.PI/2-phi,0,0],head:[-0.2,0,0],shrug},fig,toe,at,8), sh=ppShoulders(pose,fig);
  pose.hands={R:{t:[0.13,0.045,sh.R[2]+0.26],pole:[0.2,-1,-0.3]},L:{t:[-0.13,0.045,sh.L[2]+0.26],pole:[-0.2,-1,-0.3]}}; pose.flat=true; return ppSolve(pose,fig); }
/* the side plank: on the left forearm, feet stacked on the floor, the hips lifting into a straight line */
function ppSidePlankPose(p,fig){ const L=RIG[fig], q=ppEase(p), d=0.17+0.08*q;   // the body rises from the feet to the shoulder; the hips sag, then lift into line
  const pose={pelvis:[0,0,Math.PI/2-d],spine:[0,0,-0.1*(1-q)],head:[0,0,0.05],shrug:0,thR:[0,0,-0.02],shR:[0.02,0,0],thL:[0,0,0.02],shL:[0.02,0,0]};
  ppPlace(pose,fig,[-L.an[0],L.an[1],L.an[2]],[0.9,0.075,-0.02],11); const sh=ppShoulders(pose,fig);
  pose.hands={L:{t:[sh.L[0]+0.02,0.045,sh.L[2]+0.28],pole:[0.1,-1,-0.3]},R:{t:ppXf(ppBone(boneMats(pose,fig,1),0),[0.2,1.0,0.03]),pole:[0,1,-0.5]}}; pose.flat=true; return ppSolve(pose,fig); }
/* the ab wheel: kneeling, the wheel rolled out from under the shoulders until the body is nearly straight, and back */
function ppWheelArc(fig,q){ const L=RIG[fig], al=0.22+0.75*q, be=1.25+0.2*q, pose={pelvis:[be,0,0],spine:[0.06*(1-q),0,0],head:[-0.3,0,0],shrug:0,thR:[al-be,0,0],thL:[al-be,0,0],shR:[Math.PI/2-al,0,0],shL:[Math.PI/2-al,0,0],ftR:[0.9,0,0],ftL:[0.9,0,0]};
  ppPlace(pose,fig,L.kn,[L.kn[0],0.075,0],7); const sh=ppShoulders(pose,fig), m=ppLerp(sh.R,sh.L,0.5), r=0.97*ppReach(L), dy=m[1]-0.09;
  return {pose,w:[0,0.09,m[2]+Math.sqrt(Math.max(0.0025,r*r-dy*dy))]}; }
function ppWheelPose(p,fig){ const W=ppWheelArc(fig,ppEase(p)), pose=W.pose; pose.hands=ppHandsAt([0.1,W.w[1],W.w[2]],[0.4,-0.3,-1]); return ppSolve(pose,fig); }
/* the hanging leg raise: hanging from the bar, straight legs lifted to level */
function ppLegRaisePose(p,fig){ const q=ppEase(p), pose=ppHangBase(fig,{sy:ppBarY()-0.52,sz:-0.06,lean:-0.12-0.12*q,arch:0.12,th:-0.04-1.4*q,kn:0.08});
  pose.free=true; pose.hands=ppHandsAt([0.33,ppBarY(),0.04],[1,-0.5,0.1]); pose.set={twR:0.3,twL:0.3}; pose.bar=true; return ppSolve(pose,fig); }
/* the dead bug: on the back, arms up and knees over the hips; the right arm reaches back overhead as the left leg
   straightens out low */
function ppDeadBugPose(p,fig){ const L=RIG[fig], q=ppEase(p), r=0.96*ppReach(L,true);
  const pose={pelvis:[-Math.PI/2+0.04,0,0],spine:[0,0,0],head:[0.12,0,0],shrug:0,thR:[-1.57,0,0],shR:[1.57,0,0],thL:[-1.57+1.32*q,0,0],shL:[1.57-1.5*q,0,0],ftR:[0.2,0,0],ftL:[0.2,0,0]};
  ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0,0.105,0.35]); const sh=ppShoulders(pose,fig), b=1.45*q;
  pose.hands={R:{t:ppAdd(sh.R,[0.02,Math.cos(b)*r,-Math.sin(b)*r]),pole:[0.6,0.2,0.4]},L:{t:ppAdd(sh.L,[-0.02,r,0]),pole:[-0.6,0.2,0.4]}}; pose.flat=true; return ppSolve(pose,fig); }
/* the Pallof press: side-on to a cable, the handle pressed straight out from the chest and back, the body not turning */
function ppPallofPose(p,fig){ const q=ppEase(p), pose=ppStand(fig,{w:0.21,turn:0.2,drop:0.06,hz:-0.02,hinge:0.06}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,ppLerp([0.04,1.24,0.16],[0.04,1.3,0.55],q),[0.4,-0.8,-0.3]); return ppSolve(pose,fig); }
/* the cable woodchop: a handle pulled from high on the right, across the body, to low on the left; the hips and torso turn */
function ppChopPose(p,fig){ const q=ppEase(p), tw=-0.4+0.85*q, pose=ppStand(fig,{w:0.24,turn:0.25,drop:0.05+0.1*q,twist:tw*0.5,hinge:0.1*q});
  pose.spine=[0.08*q,tw*0.45,0]; const F=ppFrame(pose,fig);
  const g=ppLerp([0.55,1.75,0.32],[-0.42,0.78,0.42],q); pose.hands={R:{t:ppAdd(g,[0.03,0.03,0]),pole:[0.3,-0.6,-0.5]},L:{t:ppAdd(g,[-0.03,-0.03,0]),pole:[-0.3,-0.6,-0.5]}}; return ppSolve(pose,fig); }
/* the wall slide: back to the wall, the arms slide up it from a W to overhead */
function ppWallSlidePose(p,fig){ const q=ppEase(p), pose=ppStand(fig,{w:0.13,fz:[0.12,0.12],hz:0.0,drop:0.04}), F=ppFrame(pose,fig);
  pose.hands=ppHands(F,ppBez([0.43,1.58,-0.11],[0.42,1.78,-0.11],[0.37,1.88,-0.1],q),[1,-0.5,-0.3]); pose.set={twR:1.2,twL:1.2}; pose.flat=true; return ppSolve(pose,fig); }
/* the pike push-up: hips high in an inverted V, the head lowered towards the floor between the hands */
function ppPikePose(p,fig){ const L=RIG[fig], q=ppEase(p), th=2.2+0.38*q;
  const pose={pelvis:[th,0,0],spine:[0.04,0,0],head:[-0.4,0,0],shrug:0}; ppPlace(pose,fig,[0,L.hip[1],L.hip[2]],[0,0.88,0]);
  pose.feet={R:{t:[0.12,0.14,-0.82],pole:[0,0.4,1],aim:[0.03,-0.85,0.52]},L:{t:[-0.12,0.14,-0.82],pole:[0,0.4,1],aim:[-0.03,-0.85,0.52]}};
  pose.hands=ppHandsAt([0.27,0.04,0.5],[0.6,0.3,-0.75]); pose.flat=true; return ppSolve(pose,fig); }

/* ---------- batch 6's kit ---------- */
function ppWheelKit(st,K){ const g=ppGrips(st.B,st.fig), c=ppLerp(g.R,g.L,0.5), w=[c[0],0.09,c[2]];
  K.bar([-0.035,w[1],w[2]],[0.035,w[1],w[2]],0.09,1); K.bar([-0.14,w[1],w[2]],[0.14,w[1],w[2]],0.015,0); K.bar(ppAdd(g.R,[0.02,0,0]),ppAdd(g.R,[-0.05,0,0]),0.019,1); K.bar(ppAdd(g.L,[-0.02,0,0]),ppAdd(g.L,[0.05,0,0]),0.019,1);
  ppMat(K,-0.75,1.35,0.36); }
function ppMoves6(){
  const mv=(f,cam,kit)=>({view:cam.yaw,cam,f,kit}), mat=(z0,z1)=>(st,K)=>ppMat(K,z0,z1,0.36);
  return {
    plank:mv((p,t,fig)=>ppPlankPose(p,fig),{yaw:1.25,pitch:0.22},mat(-1.0,0.75)),
    side_plank:mv((p,t,fig)=>ppSidePlankPose(p,fig),{yaw:0.3,pitch:0.15},(st,K)=>K.box([-1.05,0,-0.36],[1.05,0.012,0.36],1)),
    ab_wheel:mv((p,t,fig)=>ppWheelPose(p,fig),{yaw:1.3,pitch:0.2},ppWheelKit),
    leg_raise_hang:mv((p,t,fig)=>ppLegRaisePose(p,fig),{yaw:1.1,pitch:0.04},(st,K)=>ppPullFrame(K,0.04)),
    dead_bug:mv((p,t,fig)=>ppDeadBugPose(p,fig),{yaw:1.15,pitch:0.32},mat(-1.05,1.1)),
    pallof:mv((p,t,fig)=>ppPallofPose(p,fig),{yaw:0.35,pitch:0.08},(st,K)=>{ const g=ppDHandles(K,st.B,st.fig), c=ppLerp(g[0],g[1],0.5); ppCable(K,-0.95,c[2],1.25,c); }),
    woodchop:mv((p,t,fig)=>ppChopPose(p,fig),{yaw:0.3,pitch:0.08},(st,K)=>{ const g=ppDHandles(K,st.B,st.fig), c=ppLerp(g[0],g[1],0.5); ppCable(K,0.95,0.35,2.0,c); }),
    wall_slide:mv((p,t,fig)=>ppWallSlidePose(p,fig),{yaw:0.55,pitch:0.07},ppWallKit),
    pike_push:mv((p,t,fig)=>ppPikePose(p,fig),{yaw:1.5,pitch:0.12},mat(-1.05,0.8)),
  };
}
function ppNames6(){ return ppNames6.m||(ppNames6.m={"plank":"plank","side plank":"side_plank","ab wheel rollout":"ab_wheel","hanging leg raise":"leg_raise_hang",
  "dead bug":"dead_bug","pallof press":"pallof","cable woodchop":"woodchop","wall slide":"wall_slide","pike push-up":"pike_push"}); }
function ppMoveFor6(n){ const ex=ppNames6(); if(ex[n]) return ex[n];
  if(/side plank/.test(n)&&!/copenhagen/.test(n)) return "side_plank";
  if(/plank/.test(n)&&!/copenhagen/.test(n)) return "plank";
  if(/ab wheel|rollout/.test(n)) return "ab_wheel";
  if(/hanging.*(leg|knee) raise/.test(n)) return "leg_raise_hang";
  if(/woodchop|wood chop/.test(n)) return "woodchop";
  if(/pallof/.test(n)) return "pallof";
  return null; }

/* posture-plan aliases: a few PS_MOVES names had no demo of their own, so the Watch body stood idle. Each maps to an
   animated pose — a reused lift demo or a small ps_/rd_ MOVES defined in ossa.html — so every posture move actually
   plays on the model. Checked before the lift batches. (22 Oct, Sahil's "model isn't doing the exercise" screenshot) */
function ppNamesPS(){ return ppNamesPS.m||(ppNamesPS.m={
  "chin tucks":"rd_tuck",
  "upper trap stretch":"ps_sideneck",
  "neck side stretch":"ps_sideneck",
  "wall angels":"wall_slide",
  "thoracic extension over a foam roller":"ps_tfoamroll",
  "kneeling hip flexor stretch":"ps_hipflex_kneel",
  "half-kneeling hip flexor stretch":"ps_hipflex_kneel",
  "side-lying leg raise":"ps_sidelying_abd",
  "single-leg balance":"rd_oneleg",
  "side-lying clamshell":"ps_clamshell",
  "cat-cow":"rd_flex",
  "pelvic tilt":"rd_tilt"
}); }
/* the exact library names of every batch, checked before any batch's word rules */
function ppMoveExact(n){ for(const f of [ppNamesPS,ppNames2,ppNames3,ppNames4,ppNames4b,ppNames5,ppNames6]){ const k=f()[n]; if(k) return k; } return null; }

/* ---------- drawing ---------- */
function ppShaders(cam){
  const VS=`#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm;
${cam}
uniform mat4 uM; uniform vec2 uNF; uniform float uHull;
out vec3 vW; out vec3 vN;
void main(){
  vec3 w=(uM*vec4(aPos,1.)).xyz; vec3 n=normalize(transpose(inverse(mat3(uM)))*aNrm);
  float z=dot(w-uRo,uFw); if(uHull>0.) w+=n*uHull*z/(uF*uH);
  vec3 rel=w-uRo; z=dot(rel,uFw);
  vec2 px=uCen+vec2(dot(rel,uRt),dot(rel,uUp))/z*uF*uH; vec2 ndc=px/uRes*2.-1.;
  float n0=uNF.x,f0=uNF.y; gl_Position=vec4(ndc*z,((f0+n0)/(f0-n0))*z-2.*f0*n0/(f0-n0),z);
  vW=w; vN=n; }`;
  /* the body's own look: near-black, two soft lights and a bright rim (FS in ossa.html); metal shines, pads stay matte */
  const FS=`#version 300 es
precision highp float;
${cam}
uniform float uMat,uA,uHull; in vec3 vW; in vec3 vN; out vec4 o;
void main(){
  if(uHull>0.){ o=vec4(vec3(0.5,0.51,0.53),uA); return; }
  vec3 vd=normalize(vW-uRo), n=normalize(vN); if(!gl_FrontFacing) n=-n;
  float ndv=clamp(dot(n,-vd),0.,1.);
  vec3 L=normalize(-uFw*0.5-uRt*0.6+uUp*0.85), L2=normalize(uFw*0.3+uRt*0.8-uUp*0.2);
  float dif=clamp(dot(n,L),0.,1.), dif2=clamp(dot(n,L2),0.,1.), rim=pow(1.-ndv,3.5)*0.55+pow(1.-ndv,1.6)*0.05;
  vec3 H=vec3(0.914,0.925,0.945);
  vec3 base=uMat<.5?vec3(0.035,0.037,0.041):uMat<1.5?vec3(0.012,0.012,0.014):vec3(0.022,0.023,0.026);
  float kd=uMat<.5?0.2:uMat<1.5?0.075:0.13, kr=uMat<.5?0.55:uMat<1.5?0.22:0.36;
  float sp=uMat<.5?pow(clamp(dot(reflect(vd,n),L),0.,1.),28.)*0.6:0.;
  o=vec4(base+H*(kd*pow(dif,1.4)+0.035*dif2+rim*kr+sp),uA); }`;
  return {VS,FS};
}
/* unit shapes: a box (−0.5…0.5) and cylinders along y (radius 0.5, −0.5…0.5); flat-shaded hexes for dumbbell heads */
function ppGeo(kind){
  const P=[], N=[], I=[];
  const quad=(a,b,c,d,n)=>{ const i=P.length/3; [a,b,c,d].forEach(v=>{ P.push(...v); N.push(...n); }); I.push(i,i+1,i+2,i,i+2,i+3); };
  if(kind==="box"){ const h=0.5;
    quad([h,-h,-h],[h,h,-h],[h,h,h],[h,-h,h],[1,0,0]); quad([-h,-h,h],[-h,h,h],[-h,h,-h],[-h,-h,-h],[-1,0,0]);
    quad([-h,h,-h],[-h,h,h],[h,h,h],[h,h,-h],[0,1,0]); quad([-h,-h,h],[-h,-h,-h],[h,-h,-h],[h,-h,h],[0,-1,0]);
    quad([-h,-h,h],[h,-h,h],[h,h,h],[-h,h,h],[0,0,1]); quad([h,-h,-h],[-h,-h,-h],[-h,h,-h],[h,h,-h],[0,0,-1]);
  } else { const n=kind==="hex"?6:22, flat=kind==="hex";
    for(let i=0;i<n;i++){ const a0=i/n*Math.PI*2, a1=(i+1)/n*Math.PI*2, c0=Math.cos(a0)*0.5, s0=Math.sin(a0)*0.5, c1=Math.cos(a1)*0.5, s1=Math.sin(a1)*0.5;
      const am=(a0+a1)/2, nm=[Math.cos(am),0,Math.sin(am)];
      /* sides wound anticlockwise seen from outside (the renderer culls back faces) */
      if(flat) quad([c0,-0.5,s0],[c0,0.5,s0],[c1,0.5,s1],[c1,-0.5,s1],nm);
      else { const j=P.length/3; P.push(c0,-0.5,s0, c0,0.5,s0, c1,0.5,s1, c1,-0.5,s1); N.push(c0*2,0,s0*2, c0*2,0,s0*2, c1*2,0,s1*2, c1*2,0,s1*2); I.push(j,j+1,j+2,j,j+2,j+3); }
      const t=P.length/3; P.push(0,0.5,0, c1,0.5,s1, c0,0.5,s0); N.push(0,1,0, 0,1,0, 0,1,0); I.push(t,t+1,t+2);
      const b=P.length/3; P.push(0,-0.5,0, c0,-0.5,s0, c1,-0.5,s1); N.push(0,-1,0, 0,-1,0, 0,-1,0); I.push(b,b+1,b+2); } }
  return {P:new Float32Array(P),N:new Float32Array(N),I:new Uint16Array(I)};
}
function ppMesh(gl,g){ const v=gl.createVertexArray(); gl.bindVertexArray(v);
  const pb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,pb); gl.bufferData(gl.ARRAY_BUFFER,g.P,gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
  const nb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,nb); gl.bufferData(gl.ARRAY_BUFFER,g.N,gl.STATIC_DRAW); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
  const ib=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,g.I,gl.STATIC_DRAW);
  gl.bindVertexArray(null); return {v,n:g.I.length}; }
/* the GL objects, made again after a lost context (api.gen changes) */
function ppGL(api){
  const S=ppGL.s||(ppGL.s={g:-1}); if(S.g===api.gen()&&S.pr) return S;
  const gl=api.gl, sh=ppShaders(api.cam); S.pr=api.mk(sh.VS,sh.FS); if(!S.pr){ S.g=api.gen(); return null; }
  S.u={}; ["uRo","uFw","uRt","uUp","uF","uH","uCen","uRes","uNF","uM","uMat","uA","uHull"].forEach(n=>S.u[n]=gl.getUniformLocation(S.pr,n));
  S.mesh={box:ppMesh(gl,ppGeo("box")),cyl:ppMesh(gl,ppGeo("cyl")),hex:ppMesh(gl,ppGeo("hex"))}; S.g=api.gen(); return S;
}
window.BODY_PROPS={
  /* the points the camera fits a move's scene to (ppSpan); null for a move without kit */
  span(move,fig){ const mv=MOVES[move]; return mv&&mv.kit?ppSpan(mv,fig):null; },
  /* st: {move, e (0→1 as the demo eases in), ph, t, fig}; the kit is built from the full pose, so it waits in place
     while the body moves into it */
  draw(api,cm,st){
    /* the kit fades in over the second half of the body's move into place (so the body never passes through a solid
       bench on its way down) and out as the demo ends */
    const mv=MOVES[st.move], a=Math.max(0,Math.min(1,(st.e-0.45)/0.5)); if(!mv||!mv.kit||a<0.01) return;
    const S=ppGL(api); if(!S) return;
    const B=boneMats(st.pose||mv.f(st.ph,st.t,st.fig),st.fig,1), K=ppKit(); mv.kit({...st,B},K);   // st.pose: the frame's own pose, solved once if(!K.out.length) return;
    const gl=api.gl;
    gl.useProgram(S.pr); api.setCam(S.u,cm); gl.uniform1f(S.u.uA,a);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
    if(a<0.999){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); }
    const each=()=>K.out.forEach(it=>{ const m=S.mesh[it.g]; gl.uniformMatrix4fv(S.u.uM,false,it.m); gl.uniform1f(S.u.uMat,it.k); gl.bindVertexArray(m.v); gl.drawElements(gl.TRIANGLES,m.n,gl.UNSIGNED_SHORT,0); });
    /* the outline first (back faces pushed out a pixel, like the body's), then the kit itself */
    gl.cullFace(gl.FRONT); gl.uniform1f(S.u.uHull,1); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(6,24); each(); gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.cullFace(gl.BACK); gl.uniform1f(S.u.uHull,0); each();
    gl.depthMask(true); gl.disable(gl.BLEND); gl.bindVertexArray(null);
  }
};
/* register the moves, and send the pilot's exercises to them */
(()=>{ try{ const M={...ppMoves(),...ppMoves2(),...ppMoves3(),...ppMoves4(),...ppMoves4b(),...ppMoves5(),...ppMoves6()}; Object.keys(M).forEach(k=>{ MOVES[k]=M[k]; });
  if(typeof moveFor==="function"){ const _m=moveFor; moveFor=function(name){ const n=String(name||"").toLowerCase(); return ppMoveFor(name)||ppMoveExact(n)||ppMoveFor6(n)||ppMoveFor5(n)||ppMoveFor4b(n)||ppMoveFor4(n)||ppMoveFor3(n)||ppMoveFor2(n)||_m(name); }; }
}catch(e){ console.warn("Ossa: exercise kit",e); } })();
