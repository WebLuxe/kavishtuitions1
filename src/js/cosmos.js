/* Cosmos: the 3D world behind every page, on one canvas that never reloads.
     stars   quads that stretch into warp streaks
     glyphs  chrome tube maths symbols you can flick
     dust    particles that morph between recognisable maths figures
   A frame is a handful of uniforms; figures are built only when needed, quality
   adapts to the device, and the frame rate drops whenever nothing is happening. */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var C = window.Cosmos = {
    ok: false,
    /* Tween any of these with GSAP. The renderer just reads them. */
    s: {
      mix: 1,                      // morph from figure A to figure B
      x: 0, y: 0, scale: 1,        // figure position and size
      yaw: 0, pitch: 0, spin: 0,
      alpha: 1, dim: 1, burst: 1, size: 1,
      stars: 1, warp: 0, drift: 1,
      glyphs: 0, gdim: 1, gx: 0, gy: 0,     // chrome symbols: visibility and group offset
      sky: 0, sun: 0, mask: 0, maskScale: 1
    },
    /* Horizontal finger drag adds to this */
    spinV: 0,
    scrollV: 0
  };

  var DUST_VS = [
    'attribute vec4 aA,aB;attribute vec2 aS;',
    'uniform float uT,uMix,uBurst,uYaw,uPitch,uScale,uSize,uAlpha,uDpr,uTouchF,uRip;',
    'uniform vec2 uFit,uOff,uTouch,uRipC;uniform vec3 uC0;',
    'varying vec3 vC;varying float vA;',
    'vec3 pal(float t){t=fract(t);',
    ' vec3 a=vec3(.56,.42,1.),b=vec3(.28,.9,.98),c=vec3(1.,.5,.8);',
    ' if(t<.34)return mix(a,b,t*2.94);if(t<.67)return mix(b,c,(t-.34)*3.03);return mix(c,a,(t-.67)*3.03);}',
    'void main(){',
    ' float r=aS.x,m=clamp(uMix*1.75-r*.75,0.,1.);m=m*m*(3.-2.*m);',
    ' vec3 p=mix(aA.xyz,aB.xyz,m);float role=mix(aA.w,aB.w,m),fly=sin(3.14159*m);',
    ' vec3 n=vec3(sin(aS.y*37.+uT*.7),cos(r*91.-uT*.6),sin(aS.y*53.+r*29.));',
    ' p+=n*(.0035+fly*.42);',
    ' p.z+=.03*sin(p.x*2.6+uT*.9)*cos(p.y*2.2-uT*.5);',
    ' vec3 dir=normalize(vec3(sin(r*113.),cos(r*71.),sin(r*197.))+.001);',
    ' p+=dir*uBurst*(1.1+r*2.6);',
    ' float cy=cos(uYaw),sy=sin(uYaw),cp=cos(uPitch),sp=sin(uPitch);',
    ' vec3 q=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);q=vec3(q.x,cp*q.y-sp*q.z,sp*q.y+cp*q.z);',
    ' float k=3.1/(3.1-q.z*uScale*.6);',
    ' vec2 c=q.xy*k*uScale*uFit+uOff;',
    ' vec2 t=c-uTouch;t.x/=uFit.x/uFit.y;float d2=dot(t,t);',
    ' vec2 w=normalize(t+.0001);',
    ' c+=(w*.3+vec2(-w.y,w.x)*.2)*uTouchF*exp(-d2*9.)*uFit/uFit.y;',
    ' vec2 g=c-uRipC;g.x/=uFit.x/uFit.y;float gl=length(g),ring=exp(-pow(gl-uRip*2.2,2.)*26.)*(1.-uRip);',
    ' c+=normalize(g+.0001)*ring*.14;',
    ' gl_Position=vec4(c,0.,1.);',
    ' float bright=role<.25?.42:(role<.75?.85:1.);',
    ' gl_PointSize=max(uSize*k*(role>.75?1.08:(role<.25?.86:1.))*(.8+r*.5),1.)*uDpr;',
    ' float hue=p.x*.24+p.y*.18+uT*.02+.04;vec3 h=pal(hue);',
    ' vC=role<.25?mix(uC0,h,.4):(role>.75?mix(pal(hue+.36),vec3(1.),.28):mix(h,vec3(1.),.08));',
    ' vC=mix(vC,vec3(1.),ring*.6+fly*.12);',
    ' vA=uAlpha*bright*(1.-uBurst*.5);',
    '}'].join('\n');

  var DUST_FS = [
    'precision mediump float;varying vec3 vC;varying float vA;',
    'void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.12,d);a*=a*vA;gl_FragColor=vec4(vC*a,a*.9);}'
  ].join('\n');

  var STAR_VS = [
    'attribute vec3 aP;attribute vec2 aC;',
    'uniform float uT,uWarp,uDpr,uAlpha;uniform vec2 uFit,uRes;',
    'varying float vA,vH;',
    'vec2 proj(vec3 p){return p.xy/max(p.z,.02);}',
    'void main(){',
    ' float z=fract(aP.z-uT*(.012+uWarp*.42))*2.+.02;',
    ' vec3 p=vec3(aP.xy*1.7,z);',
    ' float len=.006+uWarp*uWarp*.42*z;',
    ' vec2 a=proj(p),b=proj(p+vec3(0.,0.,len));',
    ' vec2 s=vec2(uFit.y/uFit.x,1.);',
    ' a*=s.yx*vec2(1.,1.);b*=s.yx*vec2(1.,1.);',
    ' a*=.5;b*=.5;',
    ' vec2 d=a-b;float l=length(d*uRes);vec2 n=l>.5?normalize(vec2(-d.y,d.x)*uRes.yx):vec2(1.,0.);',
    ' float wd=(.75+(1.-min(z,1.))*1.5+uWarp*1.2)*uDpr;',
    ' vec2 o=n/uRes*wd*aC.y;',
    ' vec2 c=mix(a,b,aC.x)+o;',
    ' if(l<wd*1.5*1.)c=a+vec2(aC.x*2.-1.,aC.y)*wd/uRes;',
    ' gl_Position=vec4(c,0.,1.);',
    ' vA=uAlpha*smoothstep(2.,1.1,z)*smoothstep(.02,.12,z)*(.45+.55*fract(aP.x*91.))*(.45+uWarp*.55);',
    ' vH=fract(aP.y*53.);',
    '}'].join('\n');

  var STAR_FS = [
    'precision mediump float;varying float vA,vH;',
    'void main(){vec3 c=mix(vec3(.72,.66,1.),vec3(.55,.9,1.),vH);c=mix(c,vec3(1.,.8,.92),step(.8,vH));gl_FragColor=vec4(c*vA,vA);}'
  ].join('\n');

  var GLYPH_VS = [
    'attribute vec3 aPos,aNor;',
    'uniform mat3 uR;uniform vec3 uP;uniform float uS;uniform vec2 uFit;',
    'varying vec3 vN,vV;',
    'void main(){vec3 q=uR*aPos*uS+uP;float k=3.1/(3.1-q.z);',
    ' vN=uR*aNor;vV=normalize(vec3(0.,0.,3.1)-q);',
    ' gl_Position=vec4(q.xy*k*uFit,-q.z*.2,1.);}'].join('\n');

  var GLYPH_FS = [
    'precision mediump float;varying vec3 vN,vV;uniform vec3 uG0,uG1,uG2;',
    'vec3 env(vec3 r){float y=r.y*.5+.5;',
    ' vec3 c=mix(uG0,uG1,smoothstep(.08,.6,y));',
    ' c=mix(c,uG2,smoothstep(.56,.66,y)*(1.-smoothstep(.68,.84,y)));',
    ' c=mix(c,vec3(.98,.92,1.),smoothstep(.8,.93,y));',
    ' float s=max(dot(r,normalize(vec3(.5,.55,.65))),0.);c+=vec3(1.,.5,.78)*pow(s,14.)*.9;',
    ' s=max(dot(r,normalize(vec3(-.7,-.1,.7))),0.);c+=vec3(1.,.8,.5)*pow(s,40.)*1.4;',
    ' return c;}',
    'void main(){vec3 n=normalize(vN),v=normalize(vV),r=reflect(-v,n);',
    ' float f=pow(1.-max(dot(n,v),0.),3.);',
    ' gl_FragColor=vec4(env(r)+vec3(.68,.56,1.)*f*1.05,1.);}'].join('\n');

  var QUAD_VS = 'attribute vec2 aQ;varying vec2 vP;void main(){vP=aQ;gl_Position=vec4(aQ,0.,1.);}';

  /* Dusk sky with a banded sun, used behind the MATHS fly-through */
  var SKY_FS = [
    'precision mediump float;varying vec2 vP;uniform float uSky,uSun,uAsp;',
    'void main(){float y=vP.y*.5+.5;',
    ' vec3 c=mix(vec3(.98,.46,.32),vec3(.8,.14,.72),smoothstep(.16,.46,y));',
    ' c=mix(c,vec3(.27,.1,.62),smoothstep(.42,.72,y));',
    ' c=mix(c,vec3(.07,.03,.2),smoothstep(.68,1.,y));',
    ' vec2 p=vec2(vP.x*uAsp,vP.y-.2);float m=min(uAsp,1.)*.62+.06,d=length(p)/m;',
    ' float g=exp(-d*d*1.1)*.5;c+=vec3(1.,.5,.25)*g*uSun;',
    ' float b=smoothstep(.1,-.62,p.y/m);float band=step(b*.92,fract(p.y/m*7.5+.06*0.+.1));',
    ' float disc=(1.-smoothstep(.985,1.005,d))*mix(1.,band,step(p.y,.1*m));',
    ' vec3 sun=mix(vec3(.98,.24,.5),vec3(1.,.74,.36),smoothstep(-.85,.8,p.y/m));',
    ' c=mix(c,sun,disc*uSun);',
    ' gl_FragColor=vec4(c*uSky,uSky);}'].join('\n');

  var MASK_FS = [
    'precision mediump float;varying vec2 vP;uniform sampler2D uTex;',
    'uniform float uMaskA,uScale,uAsp,uW,uE;uniform vec3 uNight;',
    'void main(){vec2 p=vP*vec2(uAsp,1.)/uScale;',
    ' p.x+=.0;vec2 uv=vec2(p.x/uW,p.y/uW*4.)*.5+.5;',
    ' float d=(uv.x>0.&&uv.x<1.&&uv.y>0.&&uv.y<1.)?texture2D(uTex,uv).r:0.;',
        ' float a=(1.-smoothstep(.5-uE,.5+uE,d))*uMaskA;',
    ' gl_FragColor=vec4(uNight*a,a);}'].join('\n');

  /* ─── tube geometry for the chrome symbols ─── */
  function catmull(pts, closed, perSeg) {
    var out = [], n = pts.length, segs = closed ? n : n - 1;
    function P(i) { return closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; }
    for (var i = 0; i < segs; i++) {
      var a = P(i - 1), b = P(i), c = P(i + 1), d = P(i + 2);
      for (var j = 0; j < perSeg; j++) {
        var t = j / perSeg, t2 = t * t, t3 = t2 * t, p = [0, 0, 0];
        for (var k = 0; k < 3; k++) {
          var A = a[k] || 0, B = b[k] || 0, C2 = c[k] || 0, D = d[k] || 0;
          p[k] = .5 * (2 * B + (-A + C2) * t + (2 * A - 5 * B + 4 * C2 - D) * t2 + (-A + 3 * B - 3 * C2 + D) * t3);
        }
        out.push(p);
      }
    }
    if (!closed) { var l = pts[n - 1]; out.push([l[0], l[1], l[2] || 0]); }
    return out;
  }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  /* A strand: variable-width tube with rounded ends, so the strokes feel inflated */
  function tube(mesh, line, R, sides, closed, widthFn) {
    var n = line.length, ringsStart = mesh.pos.length / 3, tan = [], i, j;
    for (i = 0; i < n; i++) {
      var a = line[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = line[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
      tan.push(norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]));
    }
    var N = norm(cross(tan[0], Math.abs(tan[0][2]) > .9 ? [1, 0, 0] : [0, 0, 1]));
    var rings = 0;
    function ring(c, T, nor, r, shift) {
      var B = cross(T, nor);
      for (var s = 0; s < sides; s++) {
        var ang = s / sides * TAU, ca = Math.cos(ang), sa = Math.sin(ang);
        var d = [nor[0] * ca + B[0] * sa, nor[1] * ca + B[1] * sa, nor[2] * ca + B[2] * sa];
        mesh.pos.push(c[0] + d[0] * r, c[1] + d[1] * r, c[2] + d[2] * r);
        var nn = norm([d[0] + T[0] * shift, d[1] + T[1] * shift, d[2] + T[2] * shift]);
        mesh.nor.push(nn[0], nn[1], nn[2]);
      }
      rings++;
    }
    if (!closed) {
      var r0 = R * widthFn(0);
      for (j = 3; j > 0; j--) {
        var th0 = j / 3 * Math.PI / 2;
        ring([line[0][0] - tan[0][0] * r0 * Math.sin(th0), line[0][1] - tan[0][1] * r0 * Math.sin(th0), line[0][2] - tan[0][2] * r0 * Math.sin(th0)], tan[0], N, Math.max(r0 * Math.cos(th0), .001), -Math.tan(th0));
      }
    }
    for (i = 0; i < n; i++) {
      if (i) {
        var T = tan[i], proj = dot(N, T);
        N = norm([N[0] - T[0] * proj, N[1] - T[1] * proj, N[2] - T[2] * proj]);
      }
      ring(line[i], tan[i], N, R * widthFn(i / (n - 1)), 0);
    }
    if (!closed) {
      var r1 = R * widthFn(1), L = line[n - 1], TL = tan[n - 1];
      for (j = 1; j <= 3; j++) {
        var th1 = j / 3 * Math.PI / 2;
        ring([L[0] + TL[0] * r1 * Math.sin(th1), L[1] + TL[1] * r1 * Math.sin(th1), L[2] + TL[2] * r1 * Math.sin(th1)], TL, N, Math.max(r1 * Math.cos(th1), .001), Math.tan(th1));
      }
    }
    var last = closed ? rings : rings - 1;
    for (i = 0; i < last; i++) {
      var i2 = (i + 1) % rings;
      for (j = 0; j < sides; j++) {
        var j2 = (j + 1) % sides, a0 = ringsStart + i * sides + j, b0 = ringsStart + i * sides + j2, c0 = ringsStart + i2 * sides + j, d0 = ringsStart + i2 * sides + j2;
        mesh.idx.push(a0, c0, b0, b0, c0, d0);
      }
    }
  }

  var one = function () { return 1; };
  var swell = function (t) { return .72 + .55 * Math.sin(Math.PI * t); };
  var GLYPHS = [
    { n: 'pi', s: [ // π
      { p: [[-1.02, .42], [-.74, .66], [-.3, .66], [.34, .6], [.8, .66], [1.02, .86]], w: swell },
      { p: [[-.38, .64], [-.4, .1], [-.5, -.42], [-.74, -.82]], w: function (t) { return 1.15 - .55 * t; } },
      { p: [[.32, .62], [.3, .02], [.34, -.5], [.56, -.82], [.88, -.62]], w: function (t) { return 1.1 - .45 * t; } }] },
    { n: 'sum', s: [ // ∑
      { p: [[.76, .84], [-.72, .84]], w: one }, { p: [[-.72, .84], [-.42, .42], [.14, 0]], w: function (t) { return 1.1 + .2 * Math.sin(Math.PI * t); } },
      { p: [[.14, 0], [-.3, -.42], [-.76, -.86]], w: function () { return .8; } }, { p: [[-.76, -.86], [.78, -.86]], w: one },
      { p: [[.78, -.86], [.92, -.52]], w: function () { return .9; } }, { p: [[.76, .84], [.88, .52]], w: function () { return .9; } }] },
    { n: 'root', s: [ // √
      { p: [[-.96, -.06], [-.64, .06]], w: function () { return .8; } },
      { p: [[-.64, .06], [-.42, -.42], [-.22, -.86]], w: function (t) { return .9 + .45 * t; } },
      { p: [[-.22, -.86], [-.02, -.1], [.2, .84]], w: function () { return .8; } },
      { p: [[.2, .84], [.62, .84], [1.02, .84]], w: one }] },
    { n: 'int', s: [ // ∫
      { p: [[.62, .78], [.46, .94], [.26, .86], [.14, .44], [.04, 0], [-.06, -.46], [-.18, -.88], [-.4, -.96], [-.6, -.76]], w: function (t) { return .55 + .85 * Math.sin(Math.PI * t); } }] },
    { n: 'inf', closed: true, s: [ // ∞
      { p: (function () { var a = [], i, t, c; for (i = 0; i < 14; i++) { t = i / 14 * TAU; c = 1 + Math.pow(Math.sin(t), 2); a.push([1.05 * Math.cos(t) / c, 1.2 * Math.sin(t) * Math.cos(t) / c, .16 * Math.sin(t)]); } return a; })(), w: function (t) { return .85 + .25 * Math.cos(t * TAU * 2); } }] },
    { n: 'theta', s: [ // θ
      { closed: true, p: (function () { var a = [], i, t; for (i = 0; i < 12; i++) { t = i / 12 * TAU; a.push([.58 * Math.cos(t), .92 * Math.sin(t), 0]); } return a; })(), w: function (t) { return .85 + .3 * Math.pow(Math.cos(t * TAU), 2); } },
      { p: [[-.56, 0], [0, .02], [.56, 0]], w: one }] },
    { n: 'delta', s: [ // Δ
      { p: [[-.86, -.76], [-.4, 0], [0, .82]], w: function () { return .8; } }, { p: [[0, .82], [.42, 0], [.88, -.76]], w: function () { return 1.3; } },
      { p: [[.88, -.76], [0, -.76], [-.86, -.76]], w: one }] }
  ];

  function buildGlyphs(sides, perSeg) {
    var mesh = { pos: [], nor: [], idx: [] }, ranges = [];
    GLYPHS.forEach(function (g) {
      var start = mesh.idx.length;
      g.s.forEach(function (st) {
        var closed = !!(st.closed || g.closed);
        tube(mesh, catmull(st.p, closed, perSeg), .165, sides, closed, st.w);
      });
      ranges.push({ start: start, count: mesh.idx.length - start });
    });
    return { pos: new Float32Array(mesh.pos), nor: new Float32Array(mesh.nor), idx: new Uint16Array(mesh.idx), ranges: ranges };
  }

  /* ─── signed distance field for the MATHS window, so the letters stay sharp at any zoom ─── */
  function edt(f, w, h) {
    var INF = 1e12, d = new Float64Array(Math.max(w, h)), v = new Int16Array(Math.max(w, h)), z = new Float64Array(Math.max(w, h) + 1);
    function pass(off, step, n) {
      var q, k = 0, s, i;
      v[0] = 0; z[0] = -INF; z[1] = INF;
      for (q = 1; q < n; q++) {
        do { s = (f[off + q * step] + q * q - f[off + v[k] * step] - v[k] * v[k]) / (2 * q - 2 * v[k]); } while (s <= z[k] && --k > -1);
        k++; v[k] = q; z[k] = s; z[k + 1] = INF;
      }
      k = 0;
      for (q = 0; q < n; q++) {
        while (z[k + 1] < q) k++;
        d[q] = f[off + v[k] * step] + (q - v[k]) * (q - v[k]);
      }
      for (i = 0; i < n; i++) f[off + i * step] = d[i];
    }
    for (var x = 0; x < w; x++) pass(x, w, h);
    for (var y = 0; y < h; y++) pass(y * w, 1, w);
  }
  function maskTexture(word, font) {
    var W = 1024, H = 256, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var x = cv.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = font; x.fontStretch = 'expanded';
    var m = x.measureText(word), size = parseFloat(font.match(/(\d+)px/)[1]), fit = Math.min(1, (W * .97) / m.width);
    x.font = font.replace(/\d+px/, Math.floor(size * fit) + 'px');
    x.fillText(word, W / 2, H / 2 + 4);
    var px = x.getImageData(0, 0, W, H).data, inside = new Float64Array(W * H), outside = new Float64Array(W * H), i;
    for (i = 0; i < W * H; i++) { var on = px[i * 4] > 127; inside[i] = on ? 1e12 : 0; outside[i] = on ? 0 : 1e12; }
    edt(inside, W, H); edt(outside, W, H);
    var out = new Uint8Array(W * H * 4), range = 26, sdf = new Float32Array(W * H), tmp = new Float32Array(W * H);
    for (i = 0; i < W * H; i++) sdf[i] = Math.sqrt(inside[i]) - Math.sqrt(outside[i]);
    for (var pass = 0; pass < 2; pass++) {
      var xx, yy, r = 1, n = r * 2 + 1, sum;
      for (yy = 0; yy < H; yy++) { sum = 0; for (xx = -r; xx <= r; xx++) sum += sdf[yy * W + Math.max(0, xx)]; for (xx = 0; xx < W; xx++) { tmp[yy * W + xx] = sum / n; sum += sdf[yy * W + Math.min(W - 1, xx + r + 1)] - sdf[yy * W + Math.max(0, xx - r)]; } }
      for (xx = 0; xx < W; xx++) { sum = 0; for (yy = -r; yy <= r; yy++) sum += tmp[Math.max(0, yy) * W + xx]; for (yy = 0; yy < H; yy++) { sdf[yy * W + xx] = sum / n; sum += tmp[Math.min(H - 1, yy + r + 1) * W + xx] - tmp[Math.max(0, yy - r) * W + xx]; } }
    }
    for (i = 0; i < W * H; i++) {
      var v = Math.max(0, Math.min(255, (sdf[i] / range * .5 + .5) * 255));
      out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; out[i * 4 + 3] = 255;
    }
    return { data: out, w: W, h: H };
  }

  /* ─── GL boot ─── */
  var cv, gl, P = {}, B = {}, W = 1, H = 1, dpr = 1, fitX = 1, fitY = 1;
  var tier = 2, dustCount = 0, dustMax = 0, starCount = 0, gMeshes = null, mask = null;
  var pal = { c0: [.44, .36, .81], g0: [.06, .03, .2], g1: [.36, .2, .92], g2: [.2, .82, .95] };
  var figA = null, figB = null, figName = '', figCache = {}, figOrder = [], figQueue = null, lastInput = 0, nextFrame = 0;
  var touch = { x: 9, y: 9, f: 0, tf: 0 }, rip = { x: 0, y: 0, t: 1 }, tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  var time = 0, last = 0, frames = 0, spent = 0, slowRuns = 0, running = false;
  var glyphs = [], layout = null, grabbed = null;

  function sh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(vs, fs, attrs, unis) {
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    attrs.forEach(function (a, i) { gl.bindAttribLocation(p, i, a); });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var o = { p: p, u: {} };
    unis.forEach(function (n) { o.u[n] = gl.getUniformLocation(p, n); });
    return o;
  }
  function pickTier() {
    var m = navigator.deviceMemory || 4, c = navigator.hardwareConcurrency || 4, small = Math.min(screen.width, screen.height) < 500;
    if (m <= 2 || c <= 4 && small) return 0;
    if (small || m <= 4) return 1;
    return 2;
  }
  var COUNTS = [12000, 24000, 46000], DPR = [1, 1.5, 2];

  function setup() {
    gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'default', stencil: false, depth: true, preserveDrawingBuffer: !!C.debug });
    if (!gl) return false;
    tier = window.KT_LITE ? 0 : pickTier();
    gl.enable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.depthFunc(gl.LEQUAL);

    P.dust = program(DUST_VS, DUST_FS, ['aA', 'aB', 'aS'], ['uT', 'uMix', 'uBurst', 'uYaw', 'uPitch', 'uScale', 'uSize', 'uAlpha', 'uDpr', 'uFit', 'uOff', 'uTouch', 'uTouchF', 'uRip', 'uRipC', 'uC0']);
    P.star = program(STAR_VS, STAR_FS, ['aP', 'aC'], ['uT', 'uWarp', 'uDpr', 'uAlpha', 'uFit', 'uRes']);
    P.glyph = program(GLYPH_VS, GLYPH_FS, ['aPos', 'aNor'], ['uR', 'uP', 'uS', 'uFit', 'uG0', 'uG1', 'uG2']);
    P.sky = program(QUAD_VS, SKY_FS, ['aQ'], ['uSky', 'uSun', 'uAsp']);
    P.mask = program(QUAD_VS, MASK_FS, ['aQ'], ['uTex', 'uMaskA', 'uScale', 'uAsp', 'uW', 'uE', 'uNight']);

    /* dust: only as many particles as this device will ever use */
    dustMax = COUNTS[tier];
    dustCount = dustMax;
    var i, d = new Float32Array(dustMax * 2);
    for (i = 0; i < dustMax * 2; i++) d[i] = Math.random();
    B.seed = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, B.seed); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
    B.a = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, B.a); gl.bufferData(gl.ARRAY_BUFFER, dustMax * 16, gl.DYNAMIC_DRAW);
    B.b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, B.b); gl.bufferData(gl.ARRAY_BUFFER, dustMax * 16, gl.DYNAMIC_DRAW);

    starCount = tier === 0 ? 260 : tier === 1 ? 460 : 800;
    var sv = new Float32Array(starCount * 4 * 5), si = new Uint16Array(starCount * 6);
    for (i = 0; i < starCount; i++) {
      var x = (Math.random() - .5) * 2, y = (Math.random() - .5) * 2, z = Math.random();
      var corners = [[0, -1], [0, 1], [1, -1], [1, 1]];
      for (var c = 0; c < 4; c++) { sv.set([x, y, z, corners[c][0], corners[c][1]], (i * 4 + c) * 5); }
      si.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3], i * 6);
    }
    B.star = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, B.star); gl.bufferData(gl.ARRAY_BUFFER, sv, gl.STATIC_DRAW);
    B.starI = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, B.starI); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, si, gl.STATIC_DRAW);

    gMeshes = buildGlyphs(tier === 0 ? 7 : 10, tier === 0 ? 7 : 12);
    B.gPos = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, B.gPos); gl.bufferData(gl.ARRAY_BUFFER, gMeshes.pos, gl.STATIC_DRAW);
    B.gNor = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, B.gNor); gl.bufferData(gl.ARRAY_BUFFER, gMeshes.nor, gl.STATIC_DRAW);
    B.gIdx = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, B.gIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gMeshes.idx, gl.STATIC_DRAW);

    B.quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, B.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    glyphs = GLYPHS.map(function (g, i) {
      return { i: i, r: gMeshes.ranges[i], x: 0, y: 0, z: 0, vx: 0, vy: 0, hx: 0, hy: 0, hz: 0, hs: 0, s: 0,
        rx: 0, ry: 0, sa: 0, ph: Math.random() * TAU, sx: 0, sy: 0, sr: 0, spin: 0 };
    });
    return true;
  }

  function resize(force) {
    if (!gl) return;
    var box = cv.getBoundingClientRect(), nw = box.width || innerWidth, nh = box.height || innerHeight;
    /* the phone URL bar sliding away is not a real resize */
    if (cv.width > 1 && nw === W && Math.abs(nh - H) < 170 && force !== true) return;
    W = nw; H = nh;
    dpr = Math.min(window.devicePixelRatio || 1, DPR[tier]);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    gl.viewport(0, 0, cv.width, cv.height);
    var mn = Math.min(W, H);
    fitX = mn / W; fitY = mn / H;
  }

  function mat(rx, ry) {
    var cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
    return [cy, sx * sy, -cx * sy, 0, cx, sx, sy, -sx * cy, cx * cy];
  }

  function setLayout(list) { layout = list; arrange(); }
  function arrange() {
    if (!glyphs.length) return;
    var wide = W >= 820, l = layout ? (wide ? layout.wide : layout.tall) : [];
    glyphs.forEach(function (g, i) {
      var h = l[i];
      g.hs = h ? h[3] : 0;
      if (h) { g.hx = h[0] / fitX; g.hy = h[1] / fitY; g.hz = h[2]; if (!g.placed) { g.x = g.hx; g.y = g.hy - 1.6; g.z = g.hz; g.placed = true; } }
    });
  }
  function stepGlyphs(dt) {
    var S = C.s, sc = S.glyphs * S.gdim;
    glyphs.forEach(function (g) {
      var target = g.hs * sc;
      g.s += (target - g.s) * Math.min(1, dt * 5);
      if (g.s < .004) { g.sx = -9999; return; }
      var bob = Math.sin(time * .7 + g.ph) * .06, tx = g.hx + S.gx + tilt.x * .1, ty = g.hy + S.gy + bob - tilt.y * .08;
      if (g !== grabbed) {
        g.vx += (tx - g.x) * dt * 7; g.vy += (ty - g.y) * dt * 7;
        g.vx *= Math.pow(.09, dt); g.vy *= Math.pow(.09, dt);
      }
      g.x += g.vx * dt; g.y += g.vy * dt;
      g.z += (g.hz - g.z) * dt * 3;
      /* face the viewer with a gentle sway; a flick winds up a full turn that settles back */
      g.sa += g.spin * dt;
      g.spin *= Math.pow(.2, dt);
      if (Math.abs(g.spin) < 1.2) { var home = Math.round(g.sa / TAU) * TAU; g.sa += (home - g.sa) * Math.min(1, dt * 2.4); }
      g.rx = Math.sin(time * .55 + g.ph) * .26 - g.vy * .16;
      g.ry = g.sa + Math.sin(time * .43 + g.ph * 2.1) * .46 + g.vx * .16;
      var k = 3.1 / (3.1 - g.z);
      g.sx = (g.x * k * fitX * .5 + .5) * W;
      g.sy = (-g.y * k * fitY * .5 + .5) * H;
      g.sr = g.s * k * fitY * .5 * H * 1.05 + 12;
    });
  }

  function draw() {
    var S = C.s, u, i;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    /* sky */
    if (S.sky > .004) {
      u = P.sky; gl.useProgram(u.p); gl.disable(gl.DEPTH_TEST); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindBuffer(gl.ARRAY_BUFFER, B.quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.disableVertexAttribArray(1);
      gl.uniform1f(u.u.uSky, S.sky); gl.uniform1f(u.u.uSun, S.sun); gl.uniform1f(u.u.uAsp, W / H);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    /* stars */
    var warp = Math.min(1, S.warp + Math.min(.16, Math.abs(C.scrollV) * .0011));
    if (S.stars > .01) {
      u = P.star; gl.useProgram(u.p); gl.disable(gl.DEPTH_TEST); gl.blendFunc(gl.ONE, gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER, B.star);
      gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, B.starI);
      gl.uniform1f(u.u.uT, time); gl.uniform1f(u.u.uWarp, warp); gl.uniform1f(u.u.uDpr, dpr); gl.uniform1f(u.u.uAlpha, S.stars);
      gl.uniform2f(u.u.uFit, fitX, fitY); gl.uniform2f(u.u.uRes, cv.width, cv.height);
      gl.drawElements(gl.TRIANGLES, starCount * 6, gl.UNSIGNED_SHORT, 0);
      gl.disableVertexAttribArray(1);
    }

    /* chrome symbols */
    if (S.glyphs * S.gdim > .004) {
      u = P.glyph; gl.useProgram(u.p); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      gl.bindBuffer(gl.ARRAY_BUFFER, B.gPos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, B.gNor); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, B.gIdx);
      gl.uniform2f(u.u.uFit, fitX, fitY);
      gl.uniform3fv(u.u.uG0, pal.g0); gl.uniform3fv(u.u.uG1, pal.g1); gl.uniform3fv(u.u.uG2, pal.g2);
      for (i = 0; i < glyphs.length; i++) {
        var g = glyphs[i];
        if (g.s < .004) continue;
        gl.uniformMatrix3fv(u.u.uR, false, mat(g.rx, g.ry));
        gl.uniform3f(u.u.uP, g.x, g.y, g.z); gl.uniform1f(u.u.uS, g.s);
        gl.drawElements(gl.TRIANGLES, g.r.count, gl.UNSIGNED_SHORT, g.r.start * 2);
      }
      gl.disableVertexAttribArray(1); gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
    }

    /* the figure */
    if (S.alpha * S.dim > .004 && figB) {
      u = P.dust; gl.useProgram(u.p); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindBuffer(gl.ARRAY_BUFFER, B.a); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, B.b); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, B.seed); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(u.u.uT, time); gl.uniform1f(u.u.uMix, S.mix);
      gl.uniform1f(u.u.uBurst, S.burst); gl.uniform1f(u.u.uYaw, S.yaw + yawAcc); gl.uniform1f(u.u.uPitch, S.pitch);
      gl.uniform1f(u.u.uScale, S.scale); gl.uniform1f(u.u.uAlpha, S.alpha * S.dim * (tier === 0 ? 1.3 : tier === 1 ? 1.1 : 1));
      gl.uniform1f(u.u.uSize, S.size * (tier === 0 ? 2 : W < 820 ? 1.5 : 1.75)); gl.uniform1f(u.u.uDpr, dpr);
      gl.uniform2f(u.u.uFit, fitX, fitY); gl.uniform2f(u.u.uOff, S.x + tilt.x * .03, S.y - tilt.y * .025);
      gl.uniform2f(u.u.uTouch, touch.x, touch.y); gl.uniform1f(u.u.uTouchF, touch.f);
      gl.uniform1f(u.u.uRip, rip.t); gl.uniform2f(u.u.uRipC, rip.x, rip.y);
      gl.uniform3fv(u.u.uC0, pal.c0);
      gl.drawArrays(gl.POINTS, 0, dustCount);
      gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2);
    }

    /* the MATHS window */
    if (S.mask > .004 && mask) {
      u = P.mask; gl.useProgram(u.p); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindBuffer(gl.ARRAY_BUFFER, B.quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, mask);
      gl.uniform1i(u.u.uTex, 0); gl.uniform1f(u.u.uMaskA, S.mask); gl.uniform1f(u.u.uScale, S.maskScale);
      var asp = W / H;
      var tw = Math.min(asp * .9, 1.6);
      gl.uniform1f(u.u.uAsp, asp); gl.uniform1f(u.u.uW, tw);
      gl.uniform1f(u.u.uE, Math.max(.004, (1024 / (tw / asp * cv.width * S.maskScale)) * .5 / 26 * 1.1));
      gl.uniform3f(u.u.uNight, 11 / 255, 7 / 255, 32 / 255);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  var yawAcc = 0;
  function frame(now) {
    if (!running) return;
    var busy = now - lastInput < 1600 || C.s.mix < 1 || C.s.warp > .001 || C.s.burst > .001 || touch.tf > 0 || Math.abs(C.spinV) > .01 || C.spin;
    if (C.dimmed) { if (now < nextFrame) return; nextFrame = now + 120; }
    else if (!busy && tier < 2) { if (now < nextFrame) return; nextFrame = now + 32; }
    var dt = Math.min(.05, (now - last) / 1000 || .016);
    last = now;
    var t0 = performance.now();
    if (!C.calm) {
      time += dt * C.s.drift;
      yawAcc += (C.s.spin + C.spinV) * dt;
      C.spinV *= Math.pow(.12, dt);
      /* flat drawings sway around facing you, so they always stay readable */
      if (!C.s.spin) { yawAcc += (Math.sin(time * .5) * .34 - yawAcc) * Math.min(1, dt * 1.6); }
    }
    touch.f += (touch.tf - touch.f) * Math.min(1, dt * 9);
    tilt.x += (tilt.tx - tilt.x) * Math.min(1, dt * 3); tilt.y += (tilt.ty - tilt.y) * Math.min(1, dt * 3);
    if (rip.t < 1) rip.t = Math.min(1, rip.t + dt * .9);
    C.scrollV *= Math.pow(.02, dt);
    stepGlyphs(dt);
    draw();
    /* adapt to the device: if frames run long for a while, step quality down */
    spent += dt; frames++;
    if (frames >= 45) {
      var avg = spent / frames;
      frames = 0; spent = 0;
      if (avg > .0235 && tier > 0 && !document.hidden && busy) {
        if (++slowRuns >= 2) { slowRuns = 0; tier--; dustCount = Math.min(dustMax, COUNTS[tier]); resize(true); }
      } else slowRuns = 0;
    }
  }

  /* ─── touch ─── */
  function clip(e) { return [e.clientX / W * 2 - 1, -(e.clientY / H * 2 - 1)]; }
  var downX = 0, downY = 0, downT = 0, lastX = 0, lastY = 0, dragging = false, zoneOK = false;
  function blocked(el) { return !!(el.closest && el.closest('a,button,input,select,textarea,label,summary,dialog,[data-no3d]')); }
  function onDown(e) {
    lastInput = performance.now();
    if (e.button > 0) return;
    zoneOK = !blocked(e.target);
    if (!zoneOK) return;
    var c = clip(e);
    touch.x = c[0]; touch.y = c[1]; touch.tf = 1;
    downX = lastX = e.clientX; downY = lastY = e.clientY; downT = performance.now(); dragging = true;
    grabbed = null;
    var best = 1e9;
    glyphs.forEach(function (g) {
      if (g.s < .03) return;
      var d = Math.hypot(g.sx - e.clientX, g.sy - e.clientY);
      if (d < Math.max(g.sr, 44) && d < best) { best = d; grabbed = g; }
    });
  }
  function onMove(e) {
    lastInput = performance.now();
    if (!dragging) { if (e.pointerType === 'mouse') { var m = clip(e); touch.x += (m[0] - touch.x) * .25; touch.y += (m[1] - touch.y) * .25; touch.tf = blocked(e.target) ? 0 : .42; } return; }
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    var c = clip(e); touch.x = c[0]; touch.y = c[1];
    if (grabbed) {
      var k = 2 / (Math.min(W, H) || 1);
      grabbed.x += dx * k; grabbed.y -= dy * k;
      grabbed.vx = dx * k * 42; grabbed.vy = -dy * k * 42;
      grabbed.spin += dx * .09;
    } else {
      C.spinV += dx * .006;
    }
  }
  function onUp(e) {
    if (!dragging) return;
    dragging = false; touch.tf = 0;
    var moved = Math.hypot(e.clientX - downX, e.clientY - downY), quick = performance.now() - downT < 260;
    if (quick && moved < 12) {
      var c = clip(e); rip.x = c[0]; rip.y = c[1]; rip.t = 0;
      if (grabbed) { grabbed.spin += 16; grabbed.vy += 1.1; }
      if (C.onTap) C.onTap(grabbed ? grabbed.i : -1);
    } else if (grabbed && C.onFlick) C.onFlick(grabbed.i);
    grabbed = null;
  }

  /* ─── public ─── */
  C.init = function (canvas, opts) {
    cv = canvas;
    C.calm = !!(opts && opts.calm);
    try {
      if (!setup()) throw new Error('no webgl');
    } catch (err) {
      if (window.console) console.warn('Cosmos off:', err.message);
      canvas.remove();
      return false;
    }
    resize();
    C.ok = true;
    addEventListener('resize', function () { resize(); arrange(); }, { passive: true });
    addEventListener('pointerdown', onDown, { passive: true });
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerup', onUp, { passive: true });
    addEventListener('pointercancel', function () { dragging = false; touch.tf = 0; grabbed = null; }, { passive: true });
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); running = false; });
    canvas.addEventListener('webglcontextrestored', function () { if (setup()) { resize(true); arrange(); makeMask(); C.start(); } });
    document.addEventListener('visibilitychange', function () { if (document.hidden) running = false; else C.start(); });
    addEventListener('pagehide', function (e) {
      if (e.persisted) return;
      var x = gl && gl.getExtension('WEBGL_lose_context');
      if (x) x.loseContext();
    });
    /* Android lets the universe follow the tilt of the phone, with no permission prompt */
    if (!C.calm && !(window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission)) {
      addEventListener('deviceorientation', function (e) {
        if (e.gamma == null) return;
        tilt.tx = Math.max(-1, Math.min(1, e.gamma / 34)); tilt.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 40));
      }, { passive: true });
    }
    return true;
  };
  C.start = function () { if (C.ok && !running && !document.hidden) { running = true; last = performance.now(); } };
  C.stop = function () { running = false; };
  C.tick = function (now) { if (running) frame(now); };
  C.glyphLayout = setLayout;
  C.ripple = function (x, y) { var c = clip({ clientX: x, clientY: y }); rip.x = c[0]; rip.y = c[1]; rip.t = 0; };
  C.quality = function () { return { tier: tier, dust: dustCount, dpr: dpr }; };
  C.lite = function (on) { if (!C.ok) return; tier = on ? 0 : pickTier(); dustCount = Math.min(dustMax, COUNTS[tier]); resize(true); };

  /* ── figures ── */
  function getFig(name) {
    var c = figCache[name];
    if (c) return c;
    c = window.KTFigs.build(name, dustMax);
    figCache[name] = c; figOrder.push(name);
    /* keep only a few figures in memory; the rest are simply rebuilt if needed */
    while (figOrder.length > 4) { var old = figOrder.shift(); if (old !== figName) delete figCache[old]; else figOrder.push(old); if (figOrder.length <= 4) break; }
    return c;
  }
  C.figure = function (name, dur) {
    if (!C.ok || name === figName) return;
    if (C.s.mix < 1 && figB) { figQueue = [name, dur]; return; }
    var data = getFig(name);
    figName = name;
    var t = B.a; B.a = B.b; B.b = t;              /* what was the target is now the start */
    gl.bindBuffer(gl.ARRAY_BUFFER, B.b); gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    if (!figB) { gl.bindBuffer(gl.ARRAY_BUFFER, B.a); gl.bufferSubData(gl.ARRAY_BUFFER, 0, data); }
    figB = data;
    C.s.spin = window.KTFigs.solid(name) ? .28 : 0;
    if (C.calm || !window.gsap || dur === 0) { C.s.mix = 1; return; }
    C.s.mix = 0;
    window.gsap.to(C.s, { mix: 1, duration: dur || 1.15, ease: 'none', overwrite: 'auto', onComplete: function () {
      if (figQueue) { var q = figQueue; figQueue = null; C.figure(q[0], .8); }
    } });
  };
  C.prepare = function (name) { if (C.ok && name) getFig(name); };
  C.theme = function (p) { pal = p; };
  C.wake = function () { lastInput = performance.now(); };

  var maskWord = 'MATHS', maskFont = '800 210px "Mona Sans", sans-serif';
  function makeMask() {
    if (!gl) return;
    var t = maskTexture(maskWord, maskFont);
    mask = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, mask);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, t.w, t.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, t.data);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  C.prepareMask = function () { if (C.ok && !mask) makeMask(); };
})();
