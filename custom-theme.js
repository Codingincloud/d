/* The one reading mode that is not precomputed: the reader's own.

   The other eight modes are finished palettes. This file derives a ninth from
   two colours the reader picks - an accent and a surface - and it has to produce
   the SAME 39-token contract the hand-written modes declare, because the
   stylesheet cannot tell the difference: every rule in foundation.css reads
   var(--pri-bg), var(--t2), var(--brd) and never a literal.

   THE HARD PART IS NOT THE COLOURS, IT IS THE GUARANTEE. A reader can pick
   white-on-white, or a saturated mid-grey, or the exact hue of the "success"
   callout for their accent. All of those are valid inputs and none of them may
   produce an unreadable page. So nothing here is a lookup or a fixed offset:
   every colour that carries meaning is SOLVED - walked along its own hue until
   it clears the contrast it has to clear, with a margin - and the walk always
   terminates on a value that cannot fail (pure black for ink on paper, pure
   white for ink on ink).

   Two rules hold the meaning of the notes together while the palette changes:

     1. The reader's accent drives the BRAND layer (--pri*), all seven surfaces,
        all three inks, the rules, the table head and the shadows. That is most
        of what a reader recognises as "their" theme.
     2. The four SEMANTIC roles do not move: green is still success, ochre still
        caution, brick still danger, plum still "commonly asked". Only their
        lightness is solved, so they sit correctly on the reader's surface. If a
        reader's accent lands on one of those hues it is nudged off it, because
        a green brand accent beside a green success callout reads as two
        successes.

   The output is the token set WITH the leading `--` stripped, keyed the way
   tools/check_themes.py parses it, plus `kind` (light or dark, decided by the
   surface) and `meta` (the browser chrome colour, which is --bg).

   Loaded as a plain script in <head> - before the boot script, because the
   reader's stored custom palette has to be on <html> before the first style
   resolution, exactly like the stored mode id. Also loadable in node via
   `vm` for tools/test_custom_theme.js, which is what proves the guarantee over
   a grid of awkward inputs rather than the three a human would try by hand. */
(function(){
'use strict';

/* ---------------------------------------------------------------- maths ---- */

function hex2rgb(hex){
  var h=String(hex||'').trim().replace(/^#/,'');
  if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  if(!/^[0-9a-fA-F]{6}$/.test(h))return null;
  return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)};
}
function rgb2hex(c){
  var f=function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16);};
  return '#'+f(c.r)+f(c.g)+f(c.b);
}
/* rgb with alpha, for the two shadows and the dark stripe - the same shapes the
   hand-written modes use, so a derived mode is not a special case in the CSS. */
function rgba(c,a){
  var f=function(v){return Math.max(0,Math.min(255,Math.round(v)));};
  return 'rgba('+f(c.r)+', '+f(c.g)+', '+f(c.b)+', '+a+')';
}
function rgb2hsl(c){
  var r=c.r/255,g=c.g/255,b=c.b/255;
  var max=Math.max(r,g,b),min=Math.min(r,g,b);
  var l=(max+min)/2,h=0,s=0;
  if(max!==min){
    var d=max-min;
    s=l>0.5?d/(2-max-min):d/(max+min);
    if(max===r)h=((g-b)/d+(g<b?6:0));
    else if(max===g)h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h*=60;
  }
  return {h:h,s:s,l:l};
}
function hsl2rgb(o){
  var h=((o.h%360)+360)%360/360,s=Math.max(0,Math.min(1,o.s)),l=Math.max(0,Math.min(1,o.l));
  function hue(p,q,t){
    if(t<0)t+=1;if(t>1)t-=1;
    if(t<1/6)return p+(q-p)*6*t;
    if(t<1/2)return q;
    if(t<2/3)return p+(q-p)*(2/3-t)*6;
    return p;
  }
  if(s===0)return {r:l*255,g:l*255,b:l*255};
  var q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;
  return {r:hue(p,q,h+1/3)*255,g:hue(p,q,h)*255,b:hue(p,q,h-1/3)*255};
}
/* W3C relative luminance, the same numbers tools/check_themes.py computes, so a
   palette this file accepts cannot then fail the gate. */
function lum(hex){
  var c=hex2rgb(hex);
  if(!c)return null;
  var f=function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
  return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b);
}
function ratio(a,b){
  var la=lum(a),lb=lum(b);
  if(la===null||lb===null)return null;
  var hi=Math.max(la,lb),lo=Math.min(la,lb);
  return (hi+0.05)/(lo+0.05);
}
/* Compound a colour at alpha over a surface - the hairline and stripe tokens are
   rgba in the dark modes, and a contrast check has to see the painted colour. */
function over(fg,alpha,bgHex){
  var f=hex2rgb(fg),b=hex2rgb(bgHex);
  return rgb2hex({r:f.r*alpha+b.r*(1-alpha),g:f.g*alpha+b.g*(1-alpha),b:f.b*alpha+b.b*(1-alpha)});
}
function mix(aHex,bHex,t){
  var a=hex2rgb(aHex),b=hex2rgb(bHex);
  return rgb2hex({r:a.r+(b.r-a.r)*t,g:a.g+(b.g-a.g)*t,b:a.b+(b.b-a.b)*t});
}
function at(h,s,l){ return rgb2hex(hsl2rgb({h:h,s:s,l:l})); }
function clamp(v,lo,hi){ return v<lo?lo:(v>hi?hi:v); }
/* Saturation with a floor - EXCEPT at exactly zero, which is not "almost none",
   it is "this colour has no hue". Flooring a zero up is how a grey accent became
   a muted rose: the hue of a neutral is reported as 0, and 0 is red. */
function sat(s,floor){ return s<=0?0:clamp(s,floor,0.95); }
/* The distance between two hues in degrees, the short way round. */
function hueGap(a,b){ var d=Math.abs(a-b)%360; return d>180?360-d:d; }

/* THE SOLVER. Walk lightness in small steps from `from` toward `to` and stop at
   the first value that satisfies `test`. `to` is always chosen so that it cannot
   fail - pure black for dark ink, pure white for light ink, pure black for a
   fill that carries white text - so a reader cannot hand this a surface that
   has no answer. The fallback at the end is therefore unreachable, and exists so
   the function is total rather than so it is used.

   0.004 is roughly the smallest lightness step that is visible in an sRGB
   palette; anything finer spends time to produce the same hex. */
function solve(h,s,from,to,test){
  var dir=to>from?1:-1, l=from, guard=0;
  while(guard++<600){
    var hex=at(h,s,l);
    if(test(hex))return hex;
    if(dir>0?l>=to:l<=to)break;
    l=clamp(l+dir*0.004,0,1);
  }
  return at(h,s,to);
}

/* ------------------------------------------------------- the reader's two ---- */

var DEFAULT_ACCENT='#4f5bd5';
var DEFAULT_SURFACE='#f6f5f2';

/* The four semantic roles, and the brand. Hue is the meaning and the reader
   cannot move it; saturation is a starting point the solver may darken. */
var ROLES=[
  {key:'pri',hue:null,sat:0.62},
  {key:'sec',hue:148,sat:0.34},
  {key:'acc',hue:38, sat:0.62},
  {key:'dan',hue:6,  sat:0.54},
  {key:'vio',hue:288,sat:0.30}
];
/* THE ACCENT IS THE READER'S, AND THAT IS A PROMISE.

   A first version of this file rotated the brand hue clear of any semantic hue
   it came within 30 degrees of, and it was wrong in the way that matters most:
   a reader who picked crimson #c2185b - 336 degrees, about 30 from the danger
   brick - watched their accent come out BLUE, because the search looked for a
   fully free hue and found one 90 degrees away. The feature appeared broken.

   So the rule is now the narrowest one that still holds the contract together:
   two roles may not be the SAME colour, and nothing else is touched. Under 10
   degrees apart is not "a similar colour", it is the same colour twice, which is
   what makes a brand green indistinguishable from a success green; at 14 degrees
   of nudge they are still plainly the same family and no longer equal. Anything
   further apart than 10 is left exactly as the reader set it, and
   tools/test_custom_theme.js asserts that hue preservation directly. */
var SEMANTIC_TOLERANCE=10, SEMANTIC_NUDGE=14;

/* Surfaces, as offsets in HSL lightness from the page. Signed the same way in
   both kinds - positive is lighter - so the table reads as one ladder. "Cards
   are lighter than the page, the sidebar is darker" is true in both a paper
   theme and a lamp theme; only the base moves. */
var LIGHT_LADDER={ 'bg-card':0.055,'bg-side':-0.045,'bg-side-h':-0.085,
                   'bg-side-a':-0.130,'bg-input':-0.040,'bg-code':-0.028,
                   'stripe':0.020,'th-bg':-0.045 };
var DARK_LADDER ={ 'bg-card':0.036,'bg-side':-0.028,'bg-side-h':-0.010,
                   'bg-side-a':0.030,'bg-input':0.030,'bg-code':0.022,
                   'stripe':-0.014,'th-bg':0.036 };

/* The page is clamped into a band per kind. Not to overrule the reader: a page
   at L 0.55 is neither a paper theme nor a lamp theme, and the ladder, the inks
   and the tints all need one or the other. The HUE and most of the SATURATION
   survive, which is what a reader is actually choosing. */
var LIGHT_PAGE=[0.90,0.97], LIGHT_SAT=0.34;
var DARK_PAGE =[0.020,0.070], DARK_SAT=0.42;

function derive(accentHex,surfaceHex){
  var accent=hex2rgb(accentHex)||hex2rgb(DEFAULT_ACCENT);
  var surface=hex2rgb(surfaceHex)||hex2rgb(DEFAULT_SURFACE);

  /* 1. the kind, from the surface the reader picked ---------------------- */
  var kind=lum(rgb2hex(surface))>=0.20?'light':'dark';
  var light=kind==='light';

  /* 2. the page, and the ladder of surfaces around it -------------------- */
  var sHSL=rgb2hsl(surface);
  var band=light?LIGHT_PAGE:DARK_PAGE;
  var pageL=clamp(sHSL.l,band[0],band[1]);
  var pageS=clamp(sHSL.s,0,light?LIGHT_SAT:DARK_SAT);
  var pageH=sHSL.h;
  var t={};
  t.bg=at(pageH,pageS,pageL);

  var ladder=light?LIGHT_LADDER:DARK_LADDER;
  Object.keys(ladder).forEach(function(name){
    /* Cards sit further from the page than the rest, and lose saturation: a
       tinted card on a tinted page reads as a print error, not as a card. */
    var satScale=name==='bg-card'?0.5:1;
    /* The dark stripes are translucent white, matching all four hand-written
       dark modes - a solid grey stripe on a dark page looks like a seam. */
    if(name==='stripe'&&!light){ t.stripe=rgba({r:255,g:255,b:255},0.022); return; }
    t[name]=at(pageH,pageS*satScale,clamp(pageL+ladder[name],0,1));
  });
  /* 3. the five roles: fill, tint, border -------------------------------- */
  var accentHSL=rgb2hsl(accent);
  /* A GREY ACCENT IS NOT A RED ONE. rgb2hsl gives a neutral colour hue 0, and
     hue 0 is red - so clamping the saturation up from 0 turned #828282 into a
     muted rose the reader never asked for. Below this chroma the brand layer is
     kept neutral instead: the chrome goes grey, and the four semantic roles keep
     their own hues, so the page reads as a neutral theme with coloured callouts
     rather than as somebody else's palette. */
  var NEUTRAL=0.06;
  var priHue=accentHSL.h, priSat=accentHSL.s<NEUTRAL?0:sat(accentHSL.s,0.15);
  ROLES.forEach(function(role){
    if(role.key==='pri'){ role._h=priHue; role._s=priSat; }
    else{ role._h=role.hue; role._s=role.sat; }
  });
  /* Break a tie with a semantic role, and only a tie: see SEMANTIC_TOLERANCE.
     Both directions are scored and the roomier one wins, so a brand hue that is
     sitting on the success green moves away from it rather than into the
     caution ochre. */
  var semantic=ROLES.filter(function(r){ return r.key!=='pri'; });
  var roomiest=function(h){ return Math.min.apply(null,semantic.map(function(r){ return hueGap(h,r._h); })); };
  if(priSat>0&&roomiest(priHue)<SEMANTIC_TOLERANCE){
    var dirs=[priHue+SEMANTIC_NUDGE,priHue-SEMANTIC_NUDGE].map(function(c){
      return ((c%360)+360)%360;
    });
    dirs.sort(function(a,b){ return roomiest(b)-roomiest(a); });
    ROLES[0]._h=dirs[0];
  }

  var tintL=light?clamp(pageL-0.055,0.74,0.97):clamp(pageL+0.050,0.03,0.20);
  var bdL  =light?clamp(pageL-0.090,0.66,0.94):clamp(pageL+0.085,0.05,0.26);
  /* Every surface an ink or a label can land on, collected as we build them, so
     the solver below tests against what the stylesheet will actually paint
     instead of against a hand-copied list that can drift. */
  var inkSurfaces=['bg','bg-card','bg-side'];
  var labelTests;

  ROLES.forEach(function(role){
    var h=role._h, s=role._s;
    /* The tint is the same hue, pulled toward the page: it has to read as a
       tinted band, not as a second card. */
    var tintSat=s<=0?0:(light?clamp(s*0.55,0.10,0.40):clamp(s*0.50,0.12,0.42));
    t[role.key+'-bg']=at(h,tintSat,tintL);
    t[role.key+'-bd']=at(h,s<=0?0:clamp(s*0.6,0.10,0.45),bdL);
    inkSurfaces.push(role.key+'-bg');
    /* The FILL carries hardcoded white text - quiz option letters, the +10 XP
       chip, "Mark done". Solved, never offset: the ochre role is the one that
       fails this by eye, and it failed for real in Lamp at 3.24:1.

       THE WALK STARTS AT THE COLOUR THE READER PICKED, not at a fixed lightness.
       Starting low and walking down would darken every accent to the same navy-
       ish fill and throw away the thing they chose; starting at the accent's own
       lightness and darkening only as far as white text requires keeps a vivid
       accent vivid, and still lands a pale one (yellow, lime) deep enough to
       carry white. The four semantic roles have no such colour to preserve, so
       they start where the hand-written modes sit: 0.40 on paper, 0.34 on ink. */
    /* The saturation floor is low on purpose: a reader who picks a near-grey
       accent wants a near-grey accent, and 0.30 turned #808080 into a colour
       they did not choose. 0.15 keeps white-on-fill solvable without inventing
       chroma that was not there. */
    var fillFrom=role.key==='pri'?clamp(accentHSL.l,0.30,0.62):(light?0.40:0.34);
    t[role.key]=solve(h,sat(s,0.15),fillFrom,0,function(hex){
      return ratio('#ffffff',hex)>=4.75;
    });
    role._hue=h;
  });

  /* 4. the inks, solved against EVERY surface they can land on ------------ */
  var dir=light?-1:1;                      /* light mode darkens, dark lightens */
  var from=light?0.42:0.62, to=light?0:1;
  function inkTargets(min){
    return function(hex){
      for(var i=0;i<inkSurfaces.length;i++){
        var r=ratio(hex,t[inkSurfaces[i]]);
        if(r===null||r<min)return false;
      }
      return true;
    };
  }
  /* Three inks, three jobs, three margins. 11 and 8 rather than 4.5 because
     these are the values a reader spends the most time in, and headroom is what
     keeps a 15px footnote from being the thing AT the limit. */
  t.t1=solve(pageH,clamp(pageS,0,0.30),from,to,inkTargets(11));
  t.t2=solve(pageH,clamp(pageS,0,0.30),light?0.60:0.74,to,inkTargets(8));
  t.t3=solve(pageH,clamp(pageS,0,0.24),light?0.78:0.86,to,inkTargets(4.8));

  /* 5. the accent label, solved against the page, a card AND its own tint --- */
  ROLES.forEach(function(role){
    var h=role._hue,s=role._s;
    t[role.key+'-l']=solve(h,sat(s,0.18),light?0.50:0.60,to,function(hex){
      return ratio(hex,t.bg)>=4.7&&ratio(hex,t['bg-card'])>=4.7
          &&ratio(hex,t[role.key+'-bg'])>=4.7;
    });
  });
  /* The formula box is --pri-l on --bg-code, and bg-code is a ladder surface the
     pri-l walk above did not know about. One extra pass, on the same hue. */
  t['pri-l']=solve(ROLES[0]._hue,sat(ROLES[0]._s,0.18),light?0.50:0.60,to,function(hex){
    return ratio(hex,t.bg)>=4.7&&ratio(hex,t['bg-card'])>=4.7
        &&ratio(hex,t['pri-bg'])>=4.7&&ratio(hex,t['bg-code'])>=4.7;
  });

  /* 6. structure: rules, the figure stroke, the table head --------------- */
  /* A hairline only has to be visible as a line - 1.15:1 for the card border,
     1.05:1 for the rule inside a table - and a fixed offset looks right on
     paper and vanishes on ink: a 0.05 lightness step near L 0.02 is a ratio of
     1.04, which is why the first version of this file failed on every dark
     surface in the grid. Solved instead, walking away from the page only as far
     as the ratio requires, so the rule stays a hairline on a light theme and
     becomes a visible one on a dark theme - which is what the four hand-written
     dark modes do too. */
  function structure(min,surfaces){
    return function(hex){
      for(var i=0;i<surfaces.length;i++){
        var r=ratio(hex,t[surfaces[i]]);
        if(r===null||r<min)return false;
      }
      return true;
    };
  }
  t.brd=solve(pageH,clamp(pageS,0,0.30),clamp(pageL+(light?-0.050:0.050),0,1),to,
              structure(1.22,['bg','bg-card','bg-side']));
  t['brd-l']=solve(pageH,clamp(pageS,0,0.24),clamp(pageL+(light?-0.020:0.020),0,1),to,
                   structure(1.09,['bg-card']));
  /* fig-line is CONTENT, not decoration - WCAG 1.4.11 wants 3:1 - so it is
     solved rather than offset, and solved against both surfaces it is drawn on. */
  t['fig-line']=solve(pageH,0.06,light?0.55:0.55,light?0:1,function(hex){
    var a=ratio(hex,t['bg-card']),b=ratio(hex,t.bg);
    return a!==null&&b!==null&&a>=3.2&&b>=3.2;
  });
  t['th-c']=solve(pageH,clamp(pageS,0,0.24),light?0.40:0.70,to,function(hex){
    return ratio(hex,t['th-bg'])>=5;
  });

  /* 7. elevation and grain ---------------------------------------------- */
  /* Shadows are tinted with the page's own hue, never flat black: a neutral
     shadow under a warm page reads as dirt. */
  var shadowHue=hex2rgb(t.t1);
  t.sh   ='0 1px 2px '+rgba(shadowHue,light?0.06:0.16);
  t['sh-md']='0 12px 32px '+rgba(shadowHue,light?0.12:0.30);
  t.grain=light?0.022:0.010;

  t.kind=kind;
  t.meta=t.bg;
  /* The five swatches the picker shows on this tile - the derived palette's own
     colours, so the tile reads the way the hand-written ones do. */
  t.strip=[t.bg,t['bg-side'],t['pri-bg'],t.pri,t.t1];
  return t;
}

/* The token names the stylesheet requires, in the order tokens.css declares
   them. tools/test_custom_theme.js fails if `derive` ever returns fewer. */
var TOKENS=['bg','bg-card','bg-side','bg-side-h','bg-side-a','bg-input','bg-code',
  'pri','pri-l','pri-bg','pri-bd','sec','sec-l','sec-bg','sec-bd',
  'acc','acc-l','acc-bg','acc-bd','dan','dan-l','dan-bg','dan-bd',
  'vio','vio-l','vio-bg','vio-bd','t1','t2','t3','brd','brd-l','fig-line',
  'sh','sh-md','th-bg','th-c','stripe','grain'];

/* Where the custom palette is remembered. Kept here rather than in app.js so the
   boot script and the picker cannot disagree about the key.

   The namespace is read from window.COURSE **at call time, not at load time**.
   That matters: this file is bundled after the course file, but the bundle is one
   parse unit and the browser hoists nothing of the sort we need, so reading it
   once at module scope would be reading it at a moment a reorder could change.
   Reading it per call costs nothing and cannot be got wrong.

   It has to match the literal in each entry page's boot script, which cannot see
   window.COURSE - that script runs in <head>, before any course file. So the two
   are tied together by tools/test_custom_theme.js, which reads the id out of
   dcc-site/course.js and the key out of the boot script and fails if they
   disagree. */
function ns(){ return (typeof window!=='undefined'&&window.COURSE&&window.COURSE.id)||'sm'; }
function keyOf(what){ return ns()+'-'+what; }
var STORE_ACCENT='accent', STORE_SURFACE='surface', STORE_CACHE='custom-palette';

/* WHY THE PALETTE IS CACHED, AND NOT JUST THE TWO COLOURS.

   The boot script in each entry page runs during parse, in <head>, and it has to
   have the reader's palette on <html> before the first style resolution - that is
   the whole reason it exists rather than living in app.js (see the long note
   there). But this file is BUNDLED: build_deploy folds every <script src> into a
   deferred site.js, so at boot time `window.CustomTheme` does not exist yet and
   the derivation cannot be run.

   So the derivation runs once, when the reader picks, and the RESULT is stored:
   a flat list of [property, value] pairs that the boot script can apply with a
   three-line loop and no knowledge of how it was computed. Anything else - a
   dark palette derived on a light seed, say - would flash the seed palette on
   every single page load.

   The cache is validated on read: the version, and both colours, have to still
   match what is stored, and every token has to be present. A cache that fails
   any of those is ignored rather than trusted, and the reader gets the seed
   palette from tokens.css - which is valid by construction, and which
   tools/test_custom_theme.js proves is a palette derive() would itself produce.
   Bump VERSION whenever `derive` changes what it returns. */
var VERSION=1;

/* Put a derived palette on <html> as INLINE custom properties. Inline beats
   every selector, so these win over [data-theme="custom"] in tokens.css - which
   is exactly the point: that block is the fallback for a reader who has never
   opened the picker, and this is the reader's own. */
function apply(t,el){
  el=el||document.documentElement;
  TOKENS.forEach(function(name){ el.style.setProperty('--'+name,t[name]); });
  el.style.setProperty('--stripe',t.stripe);
  return t;
}
/* And take them off again. Without this, switching from Custom to Lamp leaves
   the derived surfaces inline on <html>, where no stylesheet can override them
   and every other mode renders in the reader's old palette. */
function clear(el){
  el=el||document.documentElement;
  TOKENS.forEach(function(name){ el.style.removeProperty('--'+name); });
  return el;
}
function stored(){
  try{
    return {accent:localStorage.getItem(keyOf(STORE_ACCENT))||DEFAULT_ACCENT,
            surface:localStorage.getItem(keyOf(STORE_SURFACE))||DEFAULT_SURFACE};
  }catch(e){ return {accent:DEFAULT_ACCENT,surface:DEFAULT_SURFACE}; }
}
function remember(accent,surface,palette){
  try{
    localStorage.setItem(keyOf(STORE_ACCENT),accent);
    localStorage.setItem(keyOf(STORE_SURFACE),surface);
    if(palette)localStorage.setItem(keyOf(STORE_CACHE),JSON.stringify(pack(palette,accent,surface)));
  }catch(e){}
}
/* The cache record: what it is, what it was made from, and the list of
   properties the boot script paints. */
function pack(t,accent,surface){
  var out=t.kind+'|'+(t.bg||'');
  return {v:VERSION,a:accent,s:surface,kind:t.kind,bg:t.bg,strip:t.strip,
          pairs:TOKENS.map(function(n){ return ['--'+n,t[n]]; })};
}
/* Read it back, or null. Never throws and never returns a partial palette: the
   boot script has no way to report a problem, so the only honest answer to
   "something is off" is the fallback block. */
function cached(){
  try{
    var c=JSON.parse(localStorage.getItem(keyOf(STORE_CACHE))||'null');
    if(!c||c.v!==VERSION||!c.pairs||c.pairs.length!==TOKENS.length)return null;
    if(c.a!==(localStorage.getItem(keyOf(STORE_ACCENT))||DEFAULT_ACCENT))return null;
    if(c.s!==(localStorage.getItem(keyOf(STORE_SURFACE))||DEFAULT_SURFACE))return null;
    for(var i=0;i<c.pairs.length;i++)if(!c.pairs[i][1])return null;
    return c;
  }catch(e){ return null; }
}
/* What a *reader* asked for, as opposed to what the cache happens to hold: the
   two colours, their palette, and the cache record. */
function current(){
  var s=stored(), t=derive(s.accent,s.surface);
  return {accent:s.accent,surface:s.surface,palette:t,record:pack(t,s.accent,s.surface)};
}

/* ------------------------------------------------------- the link codec ----

   The appearance has two halves that are stored per device: the mode id, the
   width, and - for Custom - the reader's two colours. There is no account and
   no server to sync them through, and a static site has no other place to put
   them, so the transport is the URL: three short parameters, `t`, `w` and `c`.

     ?t=custom&w=full&c=4f5bd5,f6f5f2      - the reader's own palette
     ?t=eveningmix&w=comfort               - one of the eight

   What that buys, exactly: `Sync` in the picker copies a link, the reader opens
   it once on the other device, and the appearance is applied there and then
   PERSISTED locally - so the link is a courier, not a live connection. Both
   devices agree from then on because each remembers what it was told, and each
   stays free to diverge without dragging the other with it. A real two-way sync
   needs a backend, and this site deliberately has none.

   THIS IS THE ONLY COPY OF THE FORMAT. app.js builds the link from here, and the
   boot script in each entry page - which cannot see this file, because it runs
   during parse and this is bundled into a deferred site.js - parses it with a
   small inline copy. tools/test_custom_theme.js reads both boot scripts and
   fails if the three parameter names in them drift from PARAMS here, because a
   typo in that copy would be silent: the page would simply keep the mode it
   already had. */
var PARAMS={theme:'t',width:'w',colours:'c'};

/* Read the appearance out of a `location.search`. Never throws, never returns a
   half-applied state: anything that does not parse cleanly comes back null and
   the device keeps what it had. Colours are normalised through hex2rgb/rgb2hex,
   so `#AB12CD`, `ab12cd` and `#ABC` all land on the same value and a link that
   has been through a chat app's URL mangling still works. */
function readLink(search){
  var out={theme:null,width:null,accent:null,surface:null};
  var q=String(search||'').replace(/^\?/,'');
  if(!q)return out;
  var seen={};
  q.split('&').forEach(function(pair){
    if(!pair)return;
    var i=pair.indexOf('=');
    try{
      var k=decodeURIComponent(i<0?pair:pair.slice(0,i));
      seen[k]=decodeURIComponent(i<0?'':pair.slice(i+1));
    }catch(e){}
  });
  if(seen[PARAMS.width]==='full'||seen[PARAMS.width]==='comfort')out.width=seen[PARAMS.width];
  if(seen[PARAMS.theme])out.theme=seen[PARAMS.theme];
  var c=String(seen[PARAMS.colours]||'').split(',');
  if(c.length===2){
    var a=hex2rgb(c[0]),s=hex2rgb(c[1]);
    if(a&&s){ out.accent=rgb2hex(a); out.surface=rgb2hex(s); }
  }
  /* Two colours with no mode named can only mean Custom. Without this the link
     would carry a palette that nothing had been told to display - the mode would
     stay Lamp and the colours would sit in storage, unused. */
  if(out.accent&&!out.theme)out.theme='custom';
  return out;
}

/* The query string for an appearance. `theme`/`width` are passed through
   unprefixed rather than validated against a list of ids, because the list of
   ids lives in app.js and in the boot scripts and this file may not guess: a
   caller that names a mode the stylesheet does not have is a bug the tests
   catch, and silently dropping it here would hide it. Colours are only carried
   for Custom - the eight shipped modes do not have any. */
function link(o){
  o=o||{};
  var parts=[];
  if(o.theme)parts.push(PARAMS.theme+'='+encodeURIComponent(o.theme));
  if(o.width)parts.push(PARAMS.width+'='+encodeURIComponent(o.width));
  var a=hex2rgb(o.accent),s=hex2rgb(o.surface);
  if(o.theme==='custom'&&a&&s)
    parts.push(PARAMS.colours+'='+rgb2hex(a).slice(1)+','+rgb2hex(s).slice(1));
  return parts.length?'?'+parts.join('&'):'';
}

window.CustomTheme={derive:derive,apply:apply,clear:clear,stored:stored,cached:cached,
  /* Exported for app.js: how bright the page the reader chose is, so a decision
     that depends on it (dimming slide screenshots) can be measured off the mode
     instead of kept as a second hand-maintained list of "the dark ones". */
  lum:lum,
  current:current,remember:remember,pack:pack,ns:ns,keyOf:keyOf,TOKENS:TOKENS,VERSION:VERSION,
  PARAMS:PARAMS,readLink:readLink,link:link,
  /* The tie-break rule, exported so the test asserts the real numbers rather
     than a copy of them. */
  TOLERANCE:SEMANTIC_TOLERANCE,NUDGE:SEMANTIC_NUDGE,
  DEFAULT_ACCENT:DEFAULT_ACCENT,DEFAULT_SURFACE:DEFAULT_SURFACE,
  /* The palette a reader gets before they have chosen anything. tokens.css
     declares it as [data-theme="custom"], and test_custom_theme.js asserts the
     two agree - so the fallback can never be a palette this file would not
     itself produce. */
  seed:function(){ return derive(DEFAULT_ACCENT,DEFAULT_SURFACE); }};
})();
