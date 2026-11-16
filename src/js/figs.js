/* Maths figures for the particle world. Each figure is drawn once on a small hidden
   canvas (or computed in 3D), then the pixels become particle targets. Nothing here
   runs until a section actually needs that figure, and results are kept only briefly.
   Channels: main = the drawing, hi = the highlight, dim = faint structure such as grids. */
window.KTFigs = (function () {
  'use strict';
  var R = 512, cv, x;
  var CH = { main: '#f00', hi: '#0f0', dim: '#00f' };
  var SERIF = '"Times New Roman",STIXGeneral,"Noto Serif",Georgia,serif';

  function sheet() {
    if (cv) return;
    cv = document.createElement('canvas'); cv.width = cv.height = R;
    x = cv.getContext('2d', { willReadFrequently: true });
  }
  var px = function (v) { return (v + 1) * .5 * R; };
  var py = function (v) { return (1 - v) * .5 * R; };
  var sz = function (v) { return v * .5 * R; };

  var g = {
    style: function (c, w) { x.strokeStyle = x.fillStyle = CH[c || 'main']; x.lineWidth = w || 3; },
    line: function (a, b, c2, d, c, w) { g.style(c, w); x.beginPath(); x.moveTo(px(a), py(b)); x.lineTo(px(c2), py(d)); x.stroke(); },
    poly: function (p, c, w, close) { g.style(c, w); x.beginPath(); p.forEach(function (q, i) { i ? x.lineTo(px(q[0]), py(q[1])) : x.moveTo(px(q[0]), py(q[1])); }); if (close) x.closePath(); x.stroke(); },
    fill: function (p, c) { g.style(c); x.beginPath(); p.forEach(function (q, i) { i ? x.lineTo(px(q[0]), py(q[1])) : x.moveTo(px(q[0]), py(q[1])); }); x.closePath(); x.fill(); },
    curve: function (f, a, b, c, w, n) { var p = [], i; n = n || 90; for (i = 0; i <= n; i++) { var t = a + (b - a) * i / n; p.push([t, f(t)]); } g.poly(p, c, w); return p; },
    circle: function (a, b, r, c, w) { g.style(c, w); x.beginPath(); x.arc(px(a), py(b), sz(r), 0, 6.2832); x.stroke(); },
    arc: function (a, b, r, s, e, c, w) { g.style(c, w); x.beginPath(); x.arc(px(a), py(b), sz(r), -s, -e, e > s); x.stroke(); },
    dot: function (a, b, r, c) { g.style(c); x.beginPath(); x.arc(px(a), py(b), sz(r), 0, 6.2832); x.fill(); },
    text: function (s, a, b, h, c, it) { g.style(c); x.font = (it ? 'italic ' : '') + 'bold ' + Math.round(sz(h)) + 'px ' + SERIF; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, px(a), py(b)); },
    grid: function (st, e) { e = e || 1; for (var i = -e; i <= e + .001; i += st) { g.line(i, -e, i, e, 'dim', 1); g.line(-e, i, e, i, 'dim', 1); } },
    axes: function (cx, cy, e) { e = e || .96; g.line(-e, cy, e, cy, 'main', 2.5); g.line(cx, -e, cx, e, 'main', 2.5); g.fill([[e + .03, cy], [e - .05, cy + .035], [e - .05, cy - .035]], 'main'); g.fill([[cx, e + .03], [cx + .035, e - .05], [cx - .035, e - .05]], 'main'); },
    /* a symbol with a crisp bright outline and a soft inside, so it reads instantly */
    sym: function (s, h, b) { x.font = 'bold ' + Math.round(sz(h)) + 'px ' + SERIF; x.textAlign = 'center'; x.textBaseline = 'middle'; g.style('dim'); x.fillText(s, px(0), py(b || 0)); g.style('hi', 5); x.lineJoin = 'round'; x.strokeText(s, px(0), py(b || 0)); }
  };

  var FIG = {
    pi: function () { g.sym('π', 2.1, .06); },
    sum: function () { g.sym('∑', 1.9, .04); },
    int: function () { g.sym('∫', 2.1, .02); },
    grade: function () { g.sym('A+', 1.32, -.02); },
    formula: function () {
      g.text('x =', -.74, 0, .29, 'hi', 1);
      g.text('−b ± √(b² − 4ac)', .2, .2, .205, 'hi');
      g.line(-.5, 0, .92, 0, 'main', 4);
      g.text('2a', .2, -.2, .24, 'hi');
    },
    parabola: function () {
      g.grid(.25); g.axes(0, -.6);
      g.curve(function (t) { return 1.45 * t * t - .6; }, -.84, .84, 'hi', 8);
      g.dot(0, -.6, .04, 'main');
      g.text('y = x²', .5, .8, .21, 'hi', 1);
    },
    sine: function () {
      g.grid(.25); g.axes(0, 0);
      g.curve(function (t) { return .62 * Math.sin(t * 6.2832 * .95); }, -.96, .96, 'hi', 7);
      g.text('y = sin x', .44, .83, .2, 'hi', 1);
    },
    unit: function () {
      var a = .95, r = .74, cx = Math.cos(a) * r, cy = Math.sin(a) * r;
      g.axes(0, 0); g.circle(0, 0, r, 'main', 4);
      g.fill([[0, 0], [cx, 0], [cx, cy]], 'dim');
      g.poly([[0, 0], [cx, cy], [cx, 0]], 'hi', 6, true);
      g.arc(0, 0, .17, 0, a, 'hi', 3);
      g.text('θ', .25, .09, .16, 'hi', 1); g.text('1', cx * .34, cy * .68, .16, 'hi', 1);
      g.text('sin θ', cx + .28, cy * .5, .15, 'hi', 1); g.text('cos θ', cx * .52, -.13, .15, 'hi', 1);
    },
    pythagoras: function () {
      var A = [-.3, -.06], B = [.22, -.06], C = [-.3, .34];
      g.fill([A, B, C], 'dim');
      g.poly([A, B, C], 'hi', 7, true);
      g.poly([A, B, [.22, -.58], [-.3, -.58]], 'main', 4, true);
      g.poly([A, C, [-.7, .34], [-.7, -.06]], 'main', 4, true);
      g.poly([B, C, [-.7 + .8, .86], [.62, .46]], 'main', 4, true);
      g.text('b²', -.04, -.32, .21, 'hi', 1); g.text('a²', -.5, .14, .21, 'hi', 1); g.text('c²', .17, .42, .22, 'hi', 1);
    },
    area: function () {
      g.grid(.25); g.axes(-.72, -.62);
      var f = function (t) { return .3 + .42 * Math.sin((t + .1) * 2.4) + .2 * t; }, p = [[-.42, -.62]], i;
      for (i = 0; i <= 40; i++) { var t = -.42 + .96 * i / 40; p.push([t, f(t)]); }
      p.push([.54, -.62]); g.fill(p, 'dim');
      g.line(-.42, -.62, -.42, f(-.42), 'main', 3); g.line(.54, -.62, .54, f(.54), 'main', 3);
      g.curve(f, -.68, .84, 'hi', 7);
      g.text('∫ f(x) dx', .06, -.26, .2, 'hi', 1);
    },
    pie: function () {
      var r = .8, n = 8, i, t;
      for (i = 2; i < n; i++) {
        var p = [[0, 0]], s = i / n * 6.2832;
        for (t = 0; t <= 12; t++) { var a = s + t / 12 * 6.2832 / n; p.push([Math.cos(a) * r, Math.sin(a) * r]); }
        g.fill(p, 'dim');
        g.line(0, 0, Math.cos(s) * r, Math.sin(s) * r, 'main', 3);
      }
      g.line(0, 0, r, 0, 'hi', 6); g.line(0, 0, 0, r, 'hi', 6);
      g.arc(0, 0, r, 1.5708, 6.2832, 'hi', 7); g.arc(0, 0, r, 0, 1.5708, 'main', 3);
      g.text('¾', .38, .38, .36, 'hi');
    },
    bell: function () {
      g.axes(0, -.62);
      var f = function (t) { return 1.28 * Math.exp(-t * t * 5.4) - .62; };
      for (var i = -.8; i < .79; i += .16) g.poly([[i, -.62], [i, f(i + .08)], [i + .16, f(i + .08)], [i + .16, -.62]], 'main', 2.5);
      g.curve(f, -.94, .94, 'hi', 7);
      g.text('μ', .13, -.78, .17, 'hi', 1);
    },
    growth: function () {
      g.grid(.25); g.axes(-.74, -.68);
      g.curve(function (t) { return Math.pow(2, (t + .72) * 3.3) * .11 - .7; }, -.72, .8, 'hi', 8);
      g.text('y = 2', -.26, .55, .23, 'hi', 1); g.text('x', -.02, .63, .15, 'hi', 1);
    },
    bars: function () {
      g.axes(-.8, -.72);
      [.22, .42, .36, .66, .84, 1.12].forEach(function (h, i) {
        var a = -.68 + i * .27;
        g.fill([[a, -.72], [a + .2, -.72], [a + .2, -.72 + h], [a, -.72 + h]], 'dim');
        g.poly([[a, -.72], [a, -.72 + h], [a + .2, -.72 + h], [a + .2, -.72]], 'hi', 5);
      });
    },
    numberline: function () {
      g.line(-.96, 0, .96, 0, 'main', 5);
      g.fill([[1, 0], [.9, .05], [.9, -.05]], 'main');
      for (var i = -8; i <= 8; i++) { var t = i / 10, k = i % 4 === 0; g.line(t, k ? -.1 : -.05, t, k ? .1 : .05, k ? 'hi' : 'main', k ? 5 : 3); }
      g.dot(-.8, 0, .045, 'hi'); g.dot(.8, 0, .045, 'hi');
      g.text('2017', -.8, -.28, .2, 'hi'); g.text('now', .8, -.28, .2, 'hi');
      g.arc(0, 0, .8, .28, 2.86, 'dim', 4);
    },
    spiral: function () {
      var u = 1.9 / 13, ox = -.95, oy = -.585, X = function (v) { return ox + v * u; }, Y = function (v) { return oy + v * u; };
      [[0, 0, 8], [8, 3, 5], [10, 0, 3], [8, 0, 2], [8, 2, 1], [9, 2, 1]].forEach(function (q) {
        g.poly([[X(q[0]), Y(q[1])], [X(q[0] + q[2]), Y(q[1])], [X(q[0] + q[2]), Y(q[1] + q[2])], [X(q[0]), Y(q[1] + q[2])]], 'main', 3, true);
        if (q[2] > 1) g.text(String(q[2]), X(q[0] + (q[2] === 8 ? 2.6 : q[2] * .3)), Y(q[1] + (q[2] === 8 ? 2.2 : q[2] * .3)), q[2] === 8 ? .22 : .05 + q[2] * .022, 'main');
      });
      [[8, 0, 8, Math.PI, Math.PI / 2], [8, 3, 5, Math.PI / 2, 0], [10, 3, 3, 0, -Math.PI / 2], [10, 2, 2, -Math.PI / 2, -Math.PI], [9, 2, 1, Math.PI, Math.PI / 2], [9, 2, 1, Math.PI / 2, 0]].forEach(function (a) {
        var p = [], i; for (i = 0; i <= 40; i++) { var t = a[3] + (a[4] - a[3]) * i / 40; p.push([X(a[0] + Math.cos(t) * a[2]), Y(a[1] + Math.sin(t) * a[2])]); }
        g.poly(p, 'hi', 7);
      });
    },
    vectors: function () {
      g.grid(.25);
      var arrow = function (a, b, c2, d, c, w) { g.line(a, b, c2, d, c, w); var t = Math.atan2(d - b, c2 - a), l = .1; g.fill([[c2, d], [c2 - l * Math.cos(t - .4), d - l * Math.sin(t - .4)], [c2 - l * Math.cos(t + .4), d - l * Math.sin(t + .4)]], c); };
      arrow(-.68, -.6, .12, -.2, 'main', 6); arrow(.12, -.2, .3, .66, 'main', 6); arrow(-.68, -.6, .3, .66, 'hi', 8);
      g.text('a', -.2, -.52, .23, 'hi', 1); g.text('b', .4, .14, .23, 'hi', 1); g.text('a + b', -.34, .22, .23, 'hi', 1);
    },
    circles: function () {
      var r = .76, P = [Math.cos(2.5) * r, Math.sin(2.5) * r], A = [-r * .86, -r * .5], B = [r * .86, -r * .5], C = [Math.cos(1.2) * r, Math.sin(1.2) * r];
      g.circle(0, 0, r, 'main', 4);
      g.fill([A, B, C], 'dim');
      g.poly([A, B, C], 'hi', 6, true);
      g.dot(0, 0, .03, 'main');
      g.text('A', A[0] - .1, A[1] - .08, .17, 'hi', 1); g.text('B', B[0] + .1, B[1] - .08, .17, 'hi', 1); g.text('C', C[0] + .08, C[1] + .1, .17, 'hi', 1);
    }
  };

  /* True 3D figures: these are allowed to turn all the way round */
  function push(o, a, b, c2, role) { if (o.i < o.n) { var k = o.i++ * 4; o.a[k] = a; o.a[k + 1] = b; o.a[k + 2] = c2; o.a[k + 3] = role; } }
  function seg(o, p, q, n, role) { for (var i = 0; i < n; i++) { var t = Math.random(); push(o, p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t, role); } }
  var CLOUD = {
    ocean: function (o) {
      for (var i = 0; i < o.n; i++) { var a = (Math.random() - .5) * 3.4, b = (Math.random() - .5) * 2.4; push(o, a, b, .05 * Math.sin(a * 5) * Math.cos(b * 4), Math.random() < .35 ? 1 : .5); }
    },
    cube: function (o) {
      var s = .62, v = [[-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s], [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]];
      var e = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]], n = o.n * .72 / 12 | 0;
      e.forEach(function (q) { seg(o, v[q[0]], v[q[1]], n, 1); });
      seg(o, v[0], v[6], o.n * .1 | 0, .5);
      while (o.i < o.n) { var f = Math.random() * 3 | 0, a = (Math.random() - .5) * 2 * s, b = (Math.random() - .5) * 2 * s, c = (Math.random() < .5 ? -s : s); push(o, f === 0 ? c : a, f === 1 ? c : (f === 0 ? a : b), f === 2 ? c : b, 0); }
    },
    bowl: function (o) {
      var n = o.n, i, a, r;
      for (i = 0; i < n * .32; i++) { var ring = Math.ceil(Math.random() * 6) / 6; a = Math.random() * 6.2832; r = ring * .92; push(o, Math.cos(a) * r, r * r * 1.1 - .55, Math.sin(a) * r, .5); }
      for (i = 0; i < n * .28; i++) { a = Math.floor(Math.random() * 16) / 16 * 6.2832; r = Math.random() * .92; push(o, Math.cos(a) * r, r * r * 1.1 - .55, Math.sin(a) * r, .5); }
      for (i = 0; i < n * .3; i++) { var t = Math.random() * 1.84 - .92; push(o, t, t * t * 1.1 - .55, 0, 1); }
      seg(o, [-1.1, -.55, 0], [1.1, -.55, 0], n * .03 | 0, .5); seg(o, [0, -.8, 0], [0, 1, 0], n * .03 | 0, .5); seg(o, [0, -.55, -1.1], [0, -.55, 1.1], n * .03 | 0, .5);
      while (o.i < n) { a = Math.random() * 6.2832; r = Math.sqrt(Math.random()) * .92; push(o, Math.cos(a) * r, r * r * 1.1 - .55, Math.sin(a) * r, 0); }
    }
  };

  function sample(name, N) {
    sheet();
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-over'; x.fillStyle = '#000'; x.fillRect(0, 0, R, R);
    x.globalCompositeOperation = 'lighter'; x.lineCap = x.lineJoin = 'round'; x.setLineDash([]);
    FIG[name]();
    var d = x.getImageData(0, 0, R, R).data, A = new Int32Array(R * R), B = new Int32Array(R * R), C = new Int32Array(R * R), na = 0, nb = 0, nc = 0, i, p;
    for (i = 0, p = 0; p < R * R; p++, i += 4) { if (d[i] > 120) A[na++] = p; if (d[i + 1] > 120) B[nb++] = p; if (d[i + 2] > 120) C[nc++] = p; }
    var wa = na * 1.3, wb = nb * 1.5, wc = nc * .24, t = wa + wb + wc || 1, ca = N * wa / t | 0, cb = N * wb / t | 0;
    var out = new Float32Array(N * 4), R2 = 2 / R;
    function put(k, list, n, role) {
      var q = list[Math.random() * n | 0], u = (q % R + Math.random()) * R2 - 1, v = 1 - ((q / R | 0) + Math.random()) * R2, layer = role > .9 ? .05 : role < .1 ? -.07 : 0;
      out[k * 4] = u; out[k * 4 + 1] = v; out[k * 4 + 2] = layer + (Math.random() - .5) * .05 - (u * u + v * v) * .06; out[k * 4 + 3] = role;
    }
    for (i = 0; i < N; i++) {
      if (i < ca && na) put(i, A, na, .5);
      else if (i < ca + cb && nb) put(i, B, nb, 1);
      else if (nc) put(i, C, nc, 0);
      else if (nb) put(i, B, nb, 1); else if (na) put(i, A, na, .5);
    }
    /* shuffle-free stagger: particles were written in role order, so mix them up for morphing */
    for (i = N - 1; i > 0; i--) { var j = Math.random() * (i + 1) | 0; for (var k = 0; k < 4; k++) { var tmp = out[i * 4 + k]; out[i * 4 + k] = out[j * 4 + k]; out[j * 4 + k] = tmp; } }
    return out;
  }

  function build(name, N) {
    if (CLOUD[name]) { var o = { a: new Float32Array(N * 4), i: 0, n: N }; CLOUD[name](o); return o.a; }
    return sample(FIG[name] ? name : 'pi', N);
  }
  /* a figure the user may spin freely; flat drawings only sway so they stay readable */
  return { build: build, solid: function (n) { return n === 'cube' || n === 'bowl'; }, names: Object.keys(FIG).concat(Object.keys(CLOUD)) };
})();
