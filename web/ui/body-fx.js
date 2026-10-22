/* =========================================================
   BODY FX — effects drawn on our own 3D body (Ossa 2.0, ground rule 1)
   The renderer (makeGLBody in ossa.html) pastes the GLSL in BODY_FX.glsl into
   marked places in its shaders when it builds. Fragment shader:
     decl    uniforms and helper functions
     muscle  inside the muscle layer, after the rank colour. In scope: id (muscle index in
             GLORDER), w (how much of this pixel is muscle, 0..1), vR (rest-pose position,
             +x is the figure's left), q (the same with x mirrored), fib, edge, dif, col
     base    (Ossa 2.0 Phase 5) right after the skin's base colour, before the head lines and
             every layer. In scope: p (world position), q (rest, x mirrored), pid, dm (distance to
             the nearest muscle part), id, vd (view ray), n (normal), ndv, L, L2, dif, dif2, rim and
             col (the base colour, uRimC*rim included). The muscle layer draws on top of what it leaves
     fill    (Ossa 2.0 Phase 5) inside the muscle layer, after the rank colour, fibres and seams and
             before the unexplored, demo, isolate, selection and pulse blocks (so those still win).
             In scope: what muscle sees up to there: id, w, heat, lvl, fd, rc, fib, bl, near,
             differs, edge, col, col0, dif. Demos replace col after it, so a fill is off in demos
     final   just before the pixel is written. col is the colour; lay is the layer (1 muscles)
     ob      (19 Oct) inside the onboarding branch (uIn.z), after every system and the scan. In scope: c (colour),
             n0, nv, da, db, bt (heartbeat), tm, r (=vR), qa, vW, and obA (set 1 to make the pixel opaque over the
             glass). The pick pass never runs it. The onboarding rock (web/ui/rock.js) uses it
   Vertex shader (the body, picking and the outline all use it):
     vdecl   uniforms and helper functions
     vertex  after skinning and breathing. In scope: r (rest-pose position, +x is the
             figure's left), nr (rest normal), M (skin matrix), n (world normal) and
             w (world position: move it to change the shape). vR stays r, so colours and
             picking follow the moved body. Normals aren't recomputed: keep moves small.
             uHull tells the passes apart: 0 the body and picking, 1 the outline, 2 the glow pass
   Outline fragment shader (Ossa 2.0 Phase 3; the outline and the glow pass):
     hdecl   uniforms and helper functions
     hull    inside main. In scope: vW (world position, after any vertex move), vN (world
             normal), vR (rest position), uRo (the camera), uA, uHull, and three locals:
             col (the outline's opaque colour), add (the glow pass's colour, added on top)
             and glow (true in the glow pass). Write add only when glow; a pixel whose add
             stays 0 is dropped
   The glow pass: the outline mesh drawn again after the body (uHull 2: back faces,
   depth-tested but never written, added with ONE,ONE). It runs only on a frame where
   post() is true, so it costs nothing while no effect asks for it. A vertex chunk grows
   the mesh there (gate the move on uHull>1.5) and a hull chunk colours it.
   If an effect doesn't compile, the body is built without any effects, never the flat
   2D figure. Add effects with BODY_FX.add({...}) before boot, or call Body.fxRebuild()
   after adding one later. BODY_FX.drop([ids]) takes effects out again (their GLSL, draw,
   busy and post; a uniform name stays listed, which is harmless): call Body.fxRebuild()
   after it. look-fx.js drops its bx-* looks this way when they don't compile on a phone.
   BODY_FX.uniforms   extra uniform names the renderer looks up
   draw(gl,U,pick)    sets them each frame (U holds their locations). With a vertex or hull
                      chunk it also runs for the outline pass and again for the glow pass
                      (both with the outline program's locations, where the body-only
                      names are null). Uniforms keep their last value, so always set them
   post()             true asks for the glow pass on this frame (any effect)
   inShot, shotFlags  set only while Body.shot draws a still card (see ossa.html)
   shotFx             the fx object that Body.shot({fx}) was given, null otherwise: an effect
                      that only shows in stills reads it (halo.js: shotFx.aura, .chest, .ring, .col)
   busy()             true while an effect animates: the body then redraws at about
                      30 fps, and only while it's on screen
   ========================================================= */
window.BODY_FX={
  glsl:{decl:[],base:[],muscle:[],fill:[],final:[],vdecl:[],vertex:[],hdecl:[],hull:[],ob:[]}, uniforms:[], active:false, inShot:false, shotFlags:false, shotFx:null, _draw:[], _busy:[], _post:[], ids:[], _by:{},
  add(fx){
    if(!fx||this.ids.includes(fx.id)) return this;
    this.ids.push(fx.id);
    const own={glsl:{},draw:fx.draw||null,busy:fx.busy||null,post:fx.post||null};   // kept per id, so drop() can take it out again
    ["decl","base","muscle","fill","final","vdecl","vertex","hdecl","hull","ob"].forEach(k=>{ if(fx[k]){ const c=`/* ${fx.id} */\n${fx[k]}`; own.glsl[k]=c; this.glsl[k].push(c); } });
    (fx.uniforms||[]).forEach(u=>{ if(!this.uniforms.includes(u)) this.uniforms.push(u); });
    if(fx.draw) this._draw.push(fx.draw);
    if(fx.busy) this._busy.push(fx.busy);
    if(fx.post) this._post.push(fx.post);
    this._by[fx.id]=own;
    return this;
  },
  /* take effects out again (Ossa 2.0 Phase 5): their GLSL chunks, draw, busy and post. Uniform names stay listed
     (a missing uniform's location is null, and setting a null location does nothing). Call Body.fxRebuild() after */
  drop(ids){
    (Array.isArray(ids)?ids:[ids]).forEach(id=>{
      const own=this._by[id]; if(!own) return;
      Object.keys(own.glsl).forEach(k=>{ const a=this.glsl[k], i=a?a.indexOf(own.glsl[k]):-1; if(i>=0) a.splice(i,1); });
      [["_draw","draw"],["_busy","busy"],["_post","post"]].forEach(([l,f])=>{ const i=own[f]?this[l].indexOf(own[f]):-1; if(i>=0) this[l].splice(i,1); });
      delete this._by[id]; this.ids=this.ids.filter(x=>x!==id);
    });
    return this;
  },
  /* one effect that throws never stops the others setting their uniforms */
  draw(gl,U,pick){ for(const f of this._draw){ try{ f(gl,U,pick); }catch(e){} } },
  busy(){ return this._busy.some(f=>{ try{ return f(); }catch(e){ return false; } }); },
  post(){ return this._post.some(f=>{ try{ return !!f(); }catch(e){ return false; } }); }
};

/* Preview only (desktop, localhost/?fx=test): tints the quads lime and pulses them,
   to prove the hook works without changing anything in the app. */
(()=>{ try{
  if(!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)||!/[?&]fx=test\b/.test(location.search)) return;
  BODY_FX.add({ id:"fx-test", uniforms:["uFxTest"],
    decl:"uniform float uFxTest;",
    muscle:"if(uFxTest>=0.&&id==int(uFxTest)){ col=mix(col,vec3(0.831,1.0,0.0)*(0.5+0.4*dif),w*(0.55+0.25*sin(uFxT*4.))); }",
    draw(gl,U){ gl.uniform1f(U.uFxTest,GLORDER.indexOf("quads")); },
    busy:()=>true });
}catch(e){} })();
