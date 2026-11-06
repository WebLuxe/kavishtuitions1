/* KavishTuitions app: smooth scroll, seamless pages, sheets, and every page's behaviour.
   The canvas and dock never reload. Links swap <main> and the world morphs around it.
   If anything here can't run, the pages are still plain, readable HTML. */
(function () {
  'use strict';
  var KT = window.KT, B = window.KTB || {}, doc = document, H = doc.documentElement, C = window.Cosmos, S = C.s;
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  window.KTAPP = true;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: 'power3.out' });

  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var calm = !!B.calm || matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var wide = function () { return innerWidth >= 820; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var icon = function (n, c) { return '<svg class="' + (c || 'ic') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; };
  var esc = function (t) { var d = doc.createElement('div'); d.textContent = t; return d.innerHTML; };

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var waLink = function (t) { return 'https://wa.me/' + KT.whatsapp + (t ? '?text=' + encodeURIComponent(t) : ''); };
  var unlocked = function () { return KT.keys.indexOf(store.get('kt_key') || '') > -1; };

  /* ── little joys ── */
  function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {} }
  var AC = null, SON = store.get('kt_snd') === '1';
  function tone(f, d, type, v, f2) {
    if (!SON) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      var o = AC.createOscillator(), g = AC.createGain(), n = AC.currentTime;
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, n);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, n + d);
      g.gain.setValueAtTime(v || .04, n); g.gain.exponentialRampToValueAtTime(.0001, n + d);
      o.connect(g).connect(AC.destination); o.start(); o.stop(n + d);
    } catch (e) {}
  }
  var toastEl, toastT;
  function toast(m, top) {
    if (!toastEl) { toastEl = doc.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); doc.body.appendChild(toastEl); }
    toastEl.textContent = m; toastEl.classList.toggle('top', !!top); toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
  }

  /* ── streak and XP: a reason to come back tomorrow ── */
  function today(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  var RANKS = [[0, 'Starter'], [100, 'Solver'], [300, 'Problem crusher'], [700, 'Exam ready'], [1500, 'Maths legend']];
  var Progress = {
    get: function () { var o; try { o = JSON.parse(store.get('kt_prog') || 'null'); } catch (e) {} return o || { xp: 0, day: '', streak: 0 }; },
    played: function (xp) {
      var p = Progress.get(), t = today(), y = new Date(); y.setDate(y.getDate() - 1);
      var before = Progress.rank(p.xp);
      if (p.day !== t) { p.streak = p.day === today(y) ? p.streak + 1 : 1; p.day = t; }
      p.xp += xp; store.set('kt_prog', JSON.stringify(p));
      var after = Progress.rank(p.xp);
      paintStreak();
      return { streak: p.streak, xp: p.xp, rose: after !== before ? after : '' };
    },
    rank: function (xp) { var r = RANKS[0][1]; RANKS.forEach(function (x) { if (xp >= x[0]) r = x[1]; }); return r; },
    live: function () { var p = Progress.get(), t = today(), y = new Date(); y.setDate(y.getDate() - 1); return p.day === t || p.day === today(y) ? p.streak : 0; }
  };
  function paintStreak() {
    var n = Progress.live(), a = $('#topStreak');
    if (a) { a.hidden = !n; $('span', a).textContent = n; }
  }

  /* ── scenes: what the world looks like on each page ── */
  var LAY = {
    home: {
      wide: [[.12, .56, .3, .15], [.8, .58, .2, .13], [.8, -.58, .3, .16], [.24, -.72, .2, .12], [.56, -.82, .1, .1], [.58, .7, .1, .09], [.05, .05, .1, 0]],
      tall: [[-.62, .72, .2, .13], [.66, .74, .2, .11], [-.7, .32, .1, .09], [.72, .3, .2, .1], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
    },
    tuition: {
      wide: [[.2, .58, .3, .15], [.56, .72, .1, .11], [.9, .56, .3, .14], [.88, -.6, .2, .17], [.34, -.76, .2, .12], [.62, -.82, .1, .1], [.1, -.7, .1, 0]],
      tall: [[.64, .76, .2, .11], [-.66, .74, .2, .12], [.74, .34, .1, .09], [-.72, .32, .2, .1], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
    }
  };
  var SCENES = {
    home: { s: 'knot', w: [.5, .02, 1], t: [.02, .6, .6], pitch: 1.02, spin: .16, alpha: 1, glyphs: 1, lay: 'home' },
    tuition: { s: 'planet', w: [.52, .03, .9], t: [.1, .52, .66], pitch: 1.24, spin: .2, alpha: 1, glyphs: 1, lay: 'tuition' },
    courses: { s: 'galaxy', w: [.56, .24, .92], t: [.34, .62, .56], pitch: .92, spin: .1, alpha: .9, glyphs: 0 },
    lab: { s: 'saddle', w: [.62, .34, .78], t: [.46, .74, .44], pitch: 1, spin: .18, alpha: .9, glyphs: 0 },
    pricing: { s: 'mobius', w: [.56, .26, .84], t: [.32, .6, .6], pitch: .95, spin: .2, alpha: .9, glyphs: 0 },
    contact: { s: 'helix', w: [.6, .16, .76], t: [.42, .56, .56], pitch: .3, spin: .22, alpha: .9, glyphs: 0 }
  };
  var curShape = -1, curScene = null;
  function morph(name, dur) {
    if (!C.ok) return;
    var id = C.SHAPES[name];
    if (id == null || curShape === id) return;
    curShape = id;
    gsap.killTweensOf(S, 'mix');
    S.a = S.mix > .5 ? S.b : S.a; S.b = id; S.mix = 0;
    gsap.to(S, { mix: 1, duration: calm ? .01 : dur || 1.5, ease: 'power1.inOut', onComplete: function () { S.a = id; S.b = id; S.mix = 0; } });
  }
  function applyScene(name, dur, instant) {
    var c = SCENES[name]; if (!c || !C.ok) return;
    curScene = name;
    var v = wide() ? c.w : c.t, short = !wide() && innerHeight < 690, land = innerHeight < 500 && innerWidth > innerHeight;
    if (short) v = [v[0], Math.min(.72, v[1] + .1), v[2] * .72];
    if (land) v = [.56, .08, c.w[2] * .84];
    var to = { x: v[0], y: v[1], scale: v[2], pitch: c.pitch, spin: c.spin, alpha: c.alpha * (short ? .7 : 1), glyphs: c.glyphs, gy: 0, sky: 0, sun: 0, mask: 0, maskScale: 1, dim: 1, gdim: 1, stars: 1 };
    C.glyphLayout(c.lay ? LAY[c.lay] : null);
    if (instant) { gsap.set(S, to); S.a = S.b = curShape = C.SHAPES[c.s]; S.mix = 0; return; }
    morph(c.s, dur * 1.3);
    gsap.to(S, Object.assign({ duration: dur, ease: 'power2.inOut', overwrite: 'auto' }, to));
  }

  /* ── smooth scrolling ── */
  var lenis = null, lastY = 0, lastT = 0;
  function startScroll() {
    if (!calm && window.Lenis) {
      lenis = new window.Lenis({ lerp: .09, wheelMultiplier: 1, syncTouch: false, anchors: false });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    }
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add(function () { C.tick(performance.now()); });
    addEventListener('scroll', function () {
      var now = performance.now(), y = scrollY;
      if (now > lastT) C.scrollV = clamp((y - lastY) / (now - lastT) * 16, -160, 160);
      lastY = y; lastT = now;
    }, { passive: true });
  }
  function scrollTo(target, opts) {
    if (lenis) lenis.scrollTo(target, Object.assign({ offset: -24, duration: 1.3, easing: function (t) { return 1 - Math.pow(1 - t, 5); } }, opts || {}));
    else { if (typeof target === 'number') window.scrollTo(0, target); else target.scrollIntoView(); }
  }

  /* ── bottom sheets: the only popup on the site ── */
  var Sheet = (function () {
    var d, panel, scrim, body, title, isOpen = false, ignorePop = false, closing = false;
    function build() {
      d = doc.createElement('dialog'); d.className = 'sheet'; d.setAttribute('aria-labelledby', 'shT');
      d.innerHTML = '<div class="sheet__scrim"></div><section class="sheet__p"><div class="sheet__grip"><i></i></div><header class="sheet__head"><h2 id="shT"></h2><button type="button" class="sheet__x" aria-label="Close">' + icon('x') + '</button></header><div class="sheet__b" data-lenis-prevent></div></section>';
      doc.body.appendChild(d);
      panel = $('.sheet__p', d); scrim = $('.sheet__scrim', d); body = $('.sheet__b', d); title = $('#shT', d);
      scrim.addEventListener('click', function () { api.close(); });
      $('.sheet__x', d).addEventListener('click', function () { api.close(); });
      d.addEventListener('cancel', function (e) { e.preventDefault(); api.close(); });
      var y0 = 0, y = 0, t0 = 0, on = false;
      [$('.sheet__grip', d), $('.sheet__head', d)].forEach(function (h) {
        h.addEventListener('pointerdown', function (e) {
          if (e.target.closest('button')) return;
          on = true; y0 = e.clientY; y = 0; t0 = performance.now(); h.setPointerCapture(e.pointerId); gsap.killTweensOf(panel);
        });
        h.addEventListener('pointermove', function (e) {
          if (!on) return;
          y = Math.max(0, e.clientY - y0); gsap.set(panel, { y: y });
          gsap.set(scrim, { opacity: 1 - clamp(y / 420, 0, 1) });
        });
        function end() {
          if (!on) return; on = false;
          var v = y / Math.max(1, performance.now() - t0);
          if (y > 120 || (v > .7 && y > 30)) api.close();
          else { gsap.to(panel, { y: 0, duration: .5, ease: 'elastic.out(1,.8)' }); gsap.to(scrim, { opacity: 1, duration: .2 }); }
        }
        h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
      });
    }
    var api = {
      open: function (t, html, after) {
        if (!d) build();
        title.textContent = t; body.innerHTML = html; body.scrollTop = 0;
        if (after) after(body);
        if (isOpen) { gsap.fromTo(body, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .3 }); return; }
        isOpen = true; closing = false;
        d.showModal();
        if (lenis) lenis.stop();
        history.pushState({ sheet: 1, page: location.href }, '');
        haptic(6); tone(520, .12, 'triangle', .03, 760);
        gsap.set(panel, { y: 0, yPercent: 0 });
        gsap.fromTo(panel, { y: panel.offsetHeight + 30 }, { y: 0, duration: calm ? .01 : .56, ease: 'expo.out' });
        gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: .3, ease: 'none' });
      },
      close: function (fromPop) {
        if (!isOpen || closing) return;
        closing = true;
        if (!fromPop) { ignorePop = true; history.back(); }
        gsap.to(scrim, { opacity: 0, duration: .24, ease: 'none' });
        gsap.to(panel, {
          y: panel.offsetHeight + 40, duration: calm ? .01 : .3, ease: 'power2.in', onComplete: function () {
            d.close(); isOpen = false; closing = false; body.innerHTML = '';
            if (lenis) lenis.start();
          }
        });
      },
      get isOpen() { return isOpen; },
      takePop: function () { if (ignorePop) { ignorePop = false; return true; } if (isOpen) { api.close(true); return true; } return false; }
    };
    return api;
  })();

  /* ── Google sign-in: only loads if a real client ID is set ── */
  var USER = null;
  try { USER = JSON.parse(store.get('kt_user') || 'null'); } catch (e) {}
  var hasGoogle = /\.apps\.googleusercontent\.com$/.test(KT.googleClientId || '');
  function parseJwt(tok) {
    try {
      var b = tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(atob(b).split('').map(function (c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); }).join('')));
    } catch (e) { return null; }
  }
  function renderGsi(slot) {
    if (!slot) return;
    if (USER) { slot.textContent = 'Signed in as ' + (USER.name || USER.email); return; }
    if (!hasGoogle) return;
    var go = function () {
      window.google.accounts.id.initialize({ client_id: KT.googleClientId, ux_mode: 'popup', callback: function (res) {
        var p = parseJwt(res.credential);
        if (!p) { toast('Google sign-in failed. Use WhatsApp instead.'); return; }
        USER = { name: p.name, given_name: p.given_name, email: p.email, picture: p.picture };
        store.set('kt_user', JSON.stringify(USER));
        slot.textContent = 'Signed in as ' + USER.name;
      } });
      window.google.accounts.id.renderButton(slot, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: 280 });
    };
    if (window.google && window.google.accounts) return go();
    var s = doc.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = go; doc.head.appendChild(s);
  }

  var GRADES = '<option>Grade 9 (NCE)</option><option>Grade 10 (SC / IGCSE)</option><option>Grade 11 (SC / IGCSE)</option><option>Grade 12 (HSC / A-Level)</option><option>Grade 13 (HSC / A-Level)</option>';

  function openUnlock(plan) {
    Sheet.open('Unlock full access',
      '<div id="gsi" style="display:flex;justify-content:center;margin-bottom:8px;font-size:.94rem;color:var(--mute)"></div>' +
      '<ol class="steps3"><li><span>Send the fee via <b>MCB Juice</b> to <b>' + esc(KT.phone) + '</b>.</span></li><li><span>Send the receipt screenshot on WhatsApp.</span></li><li><span>Receive your unlock key.</span></li></ol>' +
      '<form id="fWaF" novalidate>' + (plan ? '<p style="margin-top:12px;color:var(--sun);font-weight:600">Selected plan: ' + esc(plan) + '</p>' : '') +
      '<label class="field">Full name<input type="text" id="fName" name="name" autocomplete="name" enterkeyhint="next" required></label>' +
      '<label class="field">Grade<select id="fGrade" name="grade">' + GRADES + '</select></label>' +
      '<label class="field">Your WhatsApp number<input type="tel" id="fWa" name="tel" autocomplete="tel" inputmode="tel" enterkeyhint="send" required></label>' +
      '<button class="btn btn--wa btn--wide" style="margin-top:14px">' + icon('wa') + 'Send on WhatsApp</button><p class="err" id="fErr" role="alert"></p></form>' +
      '<hr class="hair" style="margin:10px 0 2px"><form id="fKeyF" novalidate><label class="field">Already have an unlock key?<input type="text" id="fKey" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="done"></label>' +
      '<button class="btn btn--line btn--wide" style="margin-top:12px">' + icon('key') + 'Apply key</button><p class="err" id="kErr" role="alert"></p></form>',
      function (body) {
        renderGsi($('#gsi', body));
        $('#fWaF', body).addEventListener('submit', function (e) {
          e.preventDefault();
          var n = $('#fName', body).value.trim(), w = $('#fWa', body).value.trim(), g = $('#fGrade', body).value;
          if (!n || w.replace(/\D/g, '').length < 7) { $('#fErr', body).textContent = 'Enter your name and a WhatsApp number with at least 7 digits.'; return; }
          $('#fErr', body).textContent = '';
          var who = USER ? ' (Google: ' + USER.email + ')' : '';
          window.open(waLink('Hi! I just paid via MCB Juice.' + (plan ? '\nPlan: ' + plan : '') + '\nName: ' + n + who + '\nGrade: ' + g + '\nWhatsApp: ' + w + '\n(Receipt attached)'), '_blank', 'noopener');
        });
        $('#fKeyF', body).addEventListener('submit', function (e) {
          e.preventDefault();
          var k = $('#fKey', body).value.trim();
          if (KT.keys.indexOf(k) < 0) { $('#kErr', body).textContent = "That key isn't valid. Check it, or ask Kavish on WhatsApp."; haptic(30); return; }
          store.set('kt_key', k); Sheet.close(); haptic(14); toast('Full access unlocked'); paintMain();
          doc.dispatchEvent(new Event('kt:unlocked'));
        });
      });
  }
  function openJoin() {
    if (unlocked()) { go('courses.html'); return; }
    Sheet.open('Join KavishTuitions',
      '<p class="mute">Start free, then pick a plan when you are ready.</p>' +
      '<a class="btn btn--sun btn--wide" style="margin-top:12px" href="courses.html" data-close>Start a free lesson' + icon('arrow') + '</a>' +
      '<div class="jplans"><button type="button" class="jplan" data-plan="Monthly (Rs 500)"><b>Monthly</b><span>Per month</span><i>Rs 500</i></button>' +
      '<button type="button" class="jplan hot" data-plan="Term (Rs 1,200)"><b>Term</b><span>Most popular, save 20%</span><i>Rs 1,200</i></button>' +
      '<button type="button" class="jplan" data-plan="Full Year (Rs 3,500)"><b>Full Year</b><span>Best value</span><i>Rs 3,500</i></button></div>' +
      '<div class="row"><a class="btn btn--wa" style="flex:1 1 150px" href="' + waLink("Hi Kavish! I'd like to know more about your Maths tuition.") + '" target="_blank" rel="noopener">' + icon('wa') + 'WhatsApp</a>' +
      '<a class="btn btn--line" style="flex:1 1 120px" href="tel:+' + KT.whatsapp + '">' + icon('phone') + 'Call</a></div>');
  }
  function openMenu() {
    var cur = location.pathname.split('/').pop() || 'index.html';
    var item = function (h, n, i) { return '<a href="' + h + '"' + (h === cur ? ' aria-current="page"' : '') + '>' + icon(i) + '<span>' + n + '</span>' + icon('arrow') + '</a>'; };
    var p = Progress.get(), live = Progress.live();
    Sheet.open('Menu',
      '<nav class="mlinks" aria-label="All pages">' + item('index.html', 'Home', 'home') + item('tuition.html', 'Tuition', 'cap') + item('courses.html', 'Courses', 'book') + item('lab.html', 'Maths Lab', 'lab') + item('pricing.html', 'Pricing', 'tag') + item('contact.html', 'Contact', 'chat') + '</nav>' +
      (p.xp ? '<div class="mtog"><span>' + esc(Progress.rank(p.xp)) + '<small>' + p.xp + ' XP, ' + live + ' day streak</small></span>' + icon('flame') + '</div>' : '') +
      '<div class="mtog"><span>Sound effects<small>Soft ticks and chimes</small></span><button type="button" class="tog" id="tSnd" aria-pressed="' + SON + '" aria-label="Sound effects"></button></div>' +
      '<div class="mtog" style="border-bottom:0"><span>Battery saver<small>Calmer 3D for older phones</small></span><button type="button" class="tog" id="tLite" aria-pressed="' + (store.get('kt_lite') === '1') + '" aria-label="Battery saver"></button></div>',
      function (b) {
        $('#tSnd', b).addEventListener('click', function () { SON = !SON; store.set('kt_snd', SON ? '1' : '0'); this.setAttribute('aria-pressed', SON); tone(500, .2, 'triangle', .05, 900); haptic(6); });
        $('#tLite', b).addEventListener('click', function () { var on = store.get('kt_lite') !== '1'; store.set('kt_lite', on ? '1' : '0'); this.setAttribute('aria-pressed', on); C.lite(on); haptic(6); });
      });
  }
  function paintMain() {
    var l = $('[data-main-label]'); if (l) l.textContent = unlocked() ? 'Learn' : 'Join';
    var j = $('.top__join'); if (j) j.textContent = unlocked() ? 'Learn' : 'Join';
  }

  /* ── motion helpers ── */
  function splitWords(el) {
    if (el.__split) return el.__split;
    var out = [];
    var wrap = function () { var o = doc.createElement('span'), i = doc.createElement('span'); o.className = 'w'; i.className = 'wi'; o.appendChild(i); return [o, i]; };
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var f = doc.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { f.appendChild(doc.createTextNode(' ')); return; }
          var p = wrap(); p[1].textContent = w; f.appendChild(p[0]); out.push(p[1]);
        });
        n.parentNode.replaceChild(f, n);
      } else if (n.nodeName === 'EM') {
        var parts = n.textContent.split(/\s+/).filter(Boolean), fr = doc.createDocumentFragment();
        parts.forEach(function (w, i) {
          var p = wrap(), e = doc.createElement('em'); e.textContent = w; p[1].appendChild(e); fr.appendChild(p[0]); out.push(p[1]);
          if (i < parts.length - 1) fr.appendChild(doc.createTextNode(' '));
        });
        n.parentNode.replaceChild(fr, n);
      }
    });
    el.__split = out;
    return out;
  }
  function rotator(el, off) {
    var words = el.dataset.words.split(','), i = 0, cur = el.firstElementChild, timer, inline = getComputedStyle(el).display !== 'block';
    var fit = function (s, t) { if (inline) gsap.to(el, { width: s.offsetWidth + 2, duration: t, ease: 'power3.inOut' }); };
    fit(cur, 0);
    function next() {
      i = (i + 1) % words.length;
      var n = doc.createElement('span'); n.textContent = words[i]; n.className = cur.className; el.appendChild(n);
      var o = cur;
      gsap.to(o, { yPercent: -112, opacity: 0, duration: .34, ease: 'power2.in', onComplete: function () { o.remove(); } });
      gsap.fromTo(n, { yPercent: 112 }, { yPercent: 0, duration: .7, delay: .2, ease: 'expo.out' });
      fit(n, .55);
      cur = n;
    }
    if (calm) return;
    timer = setInterval(function () { if (!doc.hidden && el.getBoundingClientRect().bottom > 0) next(); }, 2300);
    off.push(function () { clearInterval(timer); });
  }
  function counters(root) {
    $$('[data-count]', root).forEach(function (el) {
      if (calm) return;
      var to = +el.dataset.count, o = { v: 0 }, suf = el.dataset.suffix || '';
      el.textContent = '0' + suf;
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () {
        gsap.to(o, { v: to, duration: 1.5, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v) + suf; } });
      } });
    });
  }
  function rails(root, off) {
    $$('[data-rail],[data-plans]', root).forEach(function (el) {
      var kids = Array.prototype.slice.call(el.children), q = false;
      function up() {
        q = false;
        if (el.scrollWidth <= el.clientWidth + 2) { kids.forEach(function (k) { k.style.transform = ''; }); return; }
        var c = el.getBoundingClientRect(), mid = c.left + c.width / 2;
        kids.forEach(function (k) {
          var r = k.getBoundingClientRect(), d = (r.left + r.width / 2 - mid) / c.width;
          k.style.transform = 'rotateY(' + clamp(-d * 22, -20, 20).toFixed(2) + 'deg) scale(' + (1 - Math.min(Math.abs(d) * .1, .08)).toFixed(3) + ')';
        });
      }
      var on = function () { if (!q) { q = true; requestAnimationFrame(up); } };
      el.addEventListener('scroll', on, { passive: true });
      var start = $('[data-start]', el);
      if (start && el.scrollWidth > el.clientWidth + 2) el.scrollLeft = start.offsetLeft - (el.clientWidth - start.offsetWidth) / 2;
      if (!calm) up();
      if (fine) {
        var down = false, sx = 0, sl = 0, moved = 0;
        el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = el.scrollLeft; el.style.scrollSnapType = 'none'; el.style.cursor = 'grabbing'; });
        var mv = function (e) { if (down) { moved = Math.abs(e.clientX - sx); el.scrollLeft = sl - (e.clientX - sx); } };
        var up2 = function () { if (down) { down = false; el.style.scrollSnapType = ''; el.style.cursor = ''; } };
        var clk = function (e) { if (moved > 8) { e.preventDefault(); e.stopPropagation(); } };
        addEventListener('pointermove', mv, { passive: true }); addEventListener('pointerup', up2, { passive: true });
        el.addEventListener('click', clk, true);
        off.push(function () { removeEventListener('pointermove', mv); removeEventListener('pointerup', up2); });
      }
    });
  }
  function tilts(root) {
    if (!fine || calm) return;
    $$('.plan,.feat,.rec,.hstep,.cl', root).forEach(function (el) {
      var rx = gsap.quickTo(el, 'rotationX', { duration: .5 }), ry = gsap.quickTo(el, 'rotationY', { duration: .5 });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 9); rx(-((e.clientY - r.top) / r.height - .5) * 9); });
      el.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }
  function accordions(root) {
    $$('[data-faq] details', root).forEach(function (d) {
      var sum = $('summary', d), a = $('.a', d);
      sum.addEventListener('click', function (e) {
        e.preventDefault(); haptic(5);
        if (d.open) {
          gsap.to(a, { height: 0, opacity: 0, duration: calm ? .01 : .34, ease: 'power2.inOut', onComplete: function () { d.open = false; gsap.set(a, { clearProps: 'height,opacity' }); ScrollTrigger.refresh(); } });
        } else {
          d.open = true;
          gsap.from(a, { height: 0, opacity: 0, duration: calm ? .01 : .42, ease: 'power3.out', clearProps: 'height,opacity', onComplete: function () { ScrollTrigger.refresh(); } });
        }
      });
    });
  }
  /* scroll-driven reveals for one page */
  function reveals(root) {
    if (calm) return;
    $$('[data-rise]', root).forEach(function (h) {
      gsap.from(splitWords(h), { yPercent: 118, duration: 1.05, stagger: .06, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 90%' } });
    });
    var fades = $$('[data-fade]', root);
    if (fades.length) {
      gsap.set(fades, { opacity: 0, y: 34 });
      ScrollTrigger.batch(fades, { start: 'top 90%', once: true, onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: .95, stagger: .1, ease: 'power3.out', clearProps: 'transform' }); } });
    }
    $$('[data-hero]', root).forEach(function (h) {
      gsap.timeline({ scrollTrigger: { trigger: h, start: 'top top', end: 'bottom top', scrub: .5 } })
        .to(S, { dim: .24, gdim: 0, ease: 'none' }, 0);
      gsap.to($$('.prof,h1,.lede,.row,.chips,.eyebrow', h).slice(0, 1), { yPercent: -12, ease: 'none', scrollTrigger: { trigger: h, start: 'top top', end: 'bottom top', scrub: .5 } });
    });
    $$('[data-shape]', root).forEach(function (s) {
      ScrollTrigger.create({ trigger: s, start: 'top 60%', end: 'bottom 40%', onToggle: function (t) { if (t.isActive) morph(s.dataset.shape, 1.6); } });
    });
    $$('[data-sky]', root).forEach(function (s) {
      ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: function (t) { if (t.isActive) sky(+s.dataset.sky); } });
    });
  }
  function sky(n) {
    var l = $$('.sky i');
    gsap.to(l[1], { opacity: n === 1 ? 1 : 0, duration: 1.1, ease: 'none', overwrite: 'auto' });
    gsap.to(l[2], { opacity: n === 2 ? 1 : 0, duration: 1.1, ease: 'none', overwrite: 'auto' });
  }
  function progressBar() {
    var set = gsap.quickSetter('.prog', 'scaleX');
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (s) { set(s.progress); } });
  }
  /* entrance of the top of a page, played after the loader or a page change */
  function prepEnter(root) {
    if (calm) return;
    var now = $$('[data-rise-now]', root), ins = $$('[data-in]', root), h1 = $('.thero h1', root);
    if (h1) { h1.querySelectorAll('.rot').forEach(function (r) { r.__keep = 1; }); }
    now.forEach(function (h) { gsap.set(splitWords(h), { yPercent: 118 }); });
    if (ins.length) gsap.set(ins, { opacity: 0, y: 24 });
    if (h1) gsap.set(h1, { opacity: 0, y: 34 });
  }
  function playEnter(root, delay) {
    if (calm) return;
    var tl = gsap.timeline({ delay: delay || 0 }), now = $$('[data-rise-now]', root), ins = $$('[data-in]', root), h1 = $('.thero h1', root);
    if (h1) tl.to(h1, { opacity: 1, y: 0, duration: 1, ease: 'expo.out' }, 0);
    now.forEach(function (h, i) { tl.to(splitWords(h), { yPercent: 0, duration: 1.15, stagger: .09, ease: 'expo.out' }, i * .1); });
    if (ins.length) tl.to(ins, { opacity: 1, y: 0, duration: .85, stagger: .09, ease: 'power3.out' }, .3);
    return tl;
  }

  /* ── pages ── */
  var Pages = {};

  Pages.home = function (root) {
    var slot = function (list, host, ic) {
      if (!host) return;
      host.innerHTML = list.map(function (c) {
        return '<li class="' + (c.slot ? 'slot' : '') + '"><span class="tag">' + icon(c.slot ? 'plus' : ic) + '</span><span><b>' + esc(c.title) + '</b><br><small>' + esc(c.slot ? 'Details coming soon' : [c.place, c.when].filter(Boolean).join(', ')) + '</small></span></li>';
      }).join('');
    };
    var ex = $('#experience', root);
    if (ex) ex.innerHTML = KT.experience.map(function (e) {
      return '<li><b>' + esc(e.role) + '</b><small>' + esc(e.place + ', ' + e.when) + '</small>' + (e.note ? '<p>' + esc(e.note) + '</p>' : '') + '</li>';
    }).join('');
    slot(KT.education, $('#education', root), 'cap');
    slot(KT.certifications, $('#certifications', root), 'medal');
    if (KT.photo) $$('[data-avatar] .ava__in', root).forEach(function (a) { a.innerHTML = '<img src="' + esc(KT.photo) + '" alt="' + esc(KT.name) + '" width="224" height="224" decoding="async">'; });
    var posts = $('#posts', root);
    if (posts) {
      posts.innerHTML = KT.posts.map(function (p, i) { return '<li><button type="button" class="post" data-post="' + i + '"><b>' + esc(p.title) + '</b><span>' + esc(p.lead) + '</span>' + icon('arrow') + '</button></li>'; }).join('');
      posts.addEventListener('click', function (e) {
        var b = e.target.closest('[data-post]'); if (!b) return;
        var p = KT.posts[+b.dataset.post];
        Sheet.open(p.title, p.body.map(function (t) { return '<p class="mute" style="margin-bottom:14px;font-size:1.06rem">' + esc(t) + '</p>'; }).join('') + '<a class="btn btn--line btn--wide" href="' + waLink('Hi Kavish, I read your post "' + p.title + '".') + '" target="_blank" rel="noopener">' + icon('wa') + 'Reply on WhatsApp</a>');
      });
    }
    /* the pull of the gate: stars begin to streak as you reach the end of the profile */
    var gate = $('#gate', root);
    if (gate && !calm) gsap.fromTo(S, { warp: 0 }, { warp: .2, ease: 'none', immediateRender: false, scrollTrigger: { trigger: gate, start: 'top 80%', end: 'bottom bottom', scrub: 1 } });
  };

  Pages.tuition = function (root, off) {
    $$('[data-strip]', root).forEach(function (t) {
      var syms = ['∫', '√', 'Σ', 'π', 'Δ', 'θ', '∞'], html = t.dataset.strip.split(',').map(function (w, i) { return '<span>' + esc(w) + '<i>' + syms[i % 7] + '</i></span>'; }).join('');
      t.innerHTML = html + html;
    });
    var q = $('[data-strip-quotes]', root);
    if (q) {
      var quotes = [['Add Maths from D to A in one term!', 'Priya, Grade 11'], ['The calculus videos are crystal clear.', 'Kevin, HSC'], ['Finally understood algebra. Thank you!', 'Aisha, Grade 9'], ['Worked solutions saved me before SC.', 'Jayden, Grade 10'], ['Mechanics made so simple.', 'Anisha, A-Level']];
      var qh = quotes.map(function (a) { return '<span>“' + esc(a[0]) + '”<i style="font-size:.9rem">' + esc(a[1]) + '</i></span>'; }).join('');
      q.innerHTML = qh + qh;
    }
    $$('[data-flip]', root).forEach(function (f) {
      var tog = function () { var on = f.classList.toggle('on'); f.setAttribute('aria-expanded', on); haptic(6); tone(420, .1, 'sine', .03, 620); };
      f.addEventListener('click', function (e) { if (e.target.closest('a')) return; tog(); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { if (e.target.closest('a')) return; e.preventDefault(); tog(); } });
    });
    if (calm) return;

    /* the MATHS fly-through: dusk behind giant letters, then straight through the T */
    var z = $('#zoom', root);
    if (z && C.ok) {
      C.prepareMask();
      var v = wide() ? SCENES.tuition.w : SCENES.tuition.t;
      var flat = { x: 0, y: -.74, scale: wide() ? 1.9 : 2.3, pitch: 1.36 };
      gsap.timeline({ scrollTrigger: { trigger: z, start: 'top 96%', end: 'top top', scrub: .4 } })
        .fromTo(S, { mask: 0, sky: 0, sun: 0 }, { mask: 1, sky: 1, sun: 1, ease: 'none', immediateRender: false }, 0)
        .fromTo(S, { x: v[0], y: v[1], scale: v[2], pitch: SCENES.tuition.pitch }, Object.assign({ ease: 'none', immediateRender: false }, flat), 0);
      ScrollTrigger.create({ trigger: z, start: 'top 80%', end: 'bottom 30%', onEnter: function () { morph('wave', 1.1); }, onEnterBack: function () { morph('wave', .9); }, onLeaveBack: function () { morph('planet', 1.2); } });
      var txt = $('.zoom__t', z), fl = $$('.zf', z), words = $('.zoom__t h2', z);
      var tl = gsap.timeline({ scrollTrigger: { trigger: z, start: 'top top', end: 'bottom bottom', scrub: .5 } });
      tl.fromTo(S, { maskScale: 1 }, { maskScale: 30, ease: 'power3.in', duration: .62, immediateRender: false }, 0)
        .fromTo(S, { mask: 1 }, { mask: 0, ease: 'none', duration: .06, immediateRender: false }, .57);
      fl.forEach(function (f, i) {
        var d = +f.dataset.d;
        tl.fromTo(f, { y: d * 70, opacity: 0 }, { y: -d * 60, opacity: 1, ease: 'none', duration: .4 }, .46 + i * .012)
          .to(f, { opacity: 0, duration: .08, ease: 'none' }, .9);
      });
      tl.fromTo(txt, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .16, ease: 'power2.out' }, .63).to({}, { duration: .08 }, .92);
      gsap.timeline({ scrollTrigger: { trigger: z, start: 'bottom 100%', end: 'bottom 35%', scrub: .4 } })
        .to(S, { sky: 0, ease: 'none' }, 0)
        .to(S, { sun: 0, ease: 'none' }, 0)
        .to(txt, { opacity: 0, y: -50, ease: 'none' }, 0)
        .fromTo(S, { x: 0, y: -.74, scale: flat.scale, pitch: 1.36 }, { x: v[0], y: v[1], scale: v[2] * .9, pitch: 1.05, ease: 'none', immediateRender: false }, 0);
    }

    var say = $('[data-say]', root);
    if (say) {
      var sw = splitWords(say);
      var st = { trigger: '#say', start: 'top top', end: 'bottom bottom', scrub: .4 };
      gsap.fromTo(sw, { opacity: .14 }, { opacity: 1, stagger: .12, ease: 'none', scrollTrigger: st });
      gsap.fromTo('.say__bar', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: st });
    }
    var cta = $('[data-cta]', root);
    if (cta) gsap.fromTo(cta, { clipPath: 'inset(16% 22% round 64px)', scale: .92 }, { clipPath: 'inset(0% 0% round 32px)', scale: 1, ease: 'none', scrollTrigger: { trigger: cta, start: 'top 96%', end: 'center 62%', scrub: .5 } });

    var mm = gsap.matchMedia();
    mm.add('(min-width:1040px)', function () {
      var track = $('[data-hsteps]', root); if (!track) return;
      var dist = function () { return Math.max(0, track.scrollWidth - innerWidth + track.getBoundingClientRect().left * 2); };
      var tw = gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: '#how', start: 'top top', end: 'bottom bottom', scrub: .7, invalidateOnRefresh: true } });
      $$('.hstep', track).forEach(function (c) {
        gsap.from(c, { rotateY: -24, scale: .88, opacity: .4, transformPerspective: 1200, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tw, start: 'left 100%', end: 'left 58%', scrub: true } });
      });
    });
    off.push(function () { mm.revert(); });
  };

  Pages.courses = function (root, off) {
    var DONE = new Set();
    try { DONE = new Set(JSON.parse(store.get('kt_done') || '[]')); } catch (e) {}
    var param = new URLSearchParams(location.search).get('level');
    var level = KT.levels.filter(function (l) { return l.id === param; })[0] || KT.levels[+(store.get('kt_lvl') || 0)] || KT.levels[0];
    var host = $('#path', root), segs = $('#levels', root), total = KT.levels.reduce(function (s, l) { return s + l.lessons.length; }, 0);
    var keyOf = function (t) { return level.key + '|' + t.n; };
    var allowed = function (t) { return t.free || unlocked(); };

    var exam = $('#exam', root);
    if (exam) {
      var now = new Date(), d = new Date(now.getFullYear(), KT.examMonth, KT.examDay);
      if (d < now) d.setFullYear(d.getFullYear() + 1);
      var days = Math.ceil((d - now) / 864e5);
      exam.textContent = 'Next exam season in ' + days + (days === 1 ? ' day' : ' days');
    }
    function drawSeg() {
      segs.innerHTML = KT.levels.map(function (l) { return '<button type="button" data-l="' + l.id + '" aria-pressed="' + (l === level) + '">' + esc(l.label) + '<small>' + esc(l.exam) + '</small></button>'; }).join('');
    }
    function progress() {
      var r = $('#ringP', root), n = DONE.size;
      r.style.strokeDashoffset = 150.8 * (1 - Math.min(n / total, 1));
      $('#ringT', root).textContent = n;
      $('#pT', root).textContent = n ? n + ' of ' + total + ' lessons complete' : 'Start your first lesson';
      $('#pS', root).textContent = n ? (n === total ? 'Every lesson done. Legend.' : 'Keep going, one step at a time.') : 'Free previews are open to everyone.';
    }
    function draw(animate) {
      var w = host.clientWidth, amp = Math.min(w * .24, 130), curDone = false;
      var html = level.lessons.map(function (t, i) {
        var done = DONE.has(keyOf(t)), ok = allowed(t), cur = !done && ok && !curDone;
        if (cur) curDone = true;
        var cls = done ? 'done' : ok ? (t.free && !unlocked() ? 'free' : 'open') : 'locked';
        var sub = done ? 'Done' : t.free ? 'Free preview' : unlocked() ? 'Unlocked' : 'Locked';
        var ico = done ? 'check' : ok ? 'play' : 'lock';
        return '<div class="node ' + cls + (cur ? ' cur' : '') + '" style="--x:' + (Math.sin(i * 1.3 + .5) * amp).toFixed(1) + 'px"><button type="button" class="node__b" data-i="' + i + '" aria-label="' + esc(t.n) + ', ' + sub + '">' + icon(ico) + '</button><span class="node__n">' + esc(t.n) + '</span><span class="node__s">' + sub + '</span></div>';
      }).join('');
      host.innerHTML = '<svg class="line" aria-hidden="true"><path class="bg" stroke="rgb(226 220 255/.18)" stroke-dasharray="3 9"/><path class="fg" stroke="#ffcf7a"/></svg>' + html;
      requestAnimationFrame(function () {
        var r = host.getBoundingClientRect(), nodes = $$('.node__b', host);
        var pts = nodes.map(function (n) { var q = n.getBoundingClientRect(); return [q.left - r.left + q.width / 2, q.top - r.top + q.height / 2]; });
        var d2 = 'M' + pts[0][0] + ' ' + pts[0][1];
        for (var i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i], m = (b[1] - a[1]) * .52; d2 += 'C' + a[0] + ' ' + (a[1] + m) + ' ' + b[0] + ' ' + (b[1] - m) + ' ' + b[0] + ' ' + b[1]; }
        var bg = $('.bg', host), fg = $('.fg', host); bg.setAttribute('d', d2); fg.setAttribute('d', d2);
        var doneN = level.lessons.filter(function (t) { return DONE.has(keyOf(t)); }).length, len = fg.getTotalLength();
        var frac = pts.length > 1 ? Math.min(1, doneN / (pts.length - 1)) : 0;
        fg.style.strokeDasharray = len; fg.style.strokeDashoffset = len * (1 - frac);
      });
      if (animate && !calm) gsap.from($$('.node', host), { opacity: 0, y: 26, scale: .9, duration: .6, stagger: .07, ease: 'back.out(1.7)', clearProps: 'opacity,scale,y,transform' });
    }
    function video(t) {
      return '<button type="button" class="play" data-yt="' + esc(t.yt) + '" aria-label="Play ' + esc(t.n) + '" style="background-image:url(https://i.ytimg.com/vi/' + esc(t.yt) + '/hqdefault.jpg)"><span>' + icon('play', '') + '</span></button>';
    }
    function open(i) {
      var t = level.lessons[i], ok = allowed(t), k = keyOf(t);
      var box = function (inner) { return '<div class="vbox">' + inner + '</div>'; };
      var notes = t.pdf === 'FILE_ID_HERE' ? '<div class="vbox__b"><b>Notes coming soon</b></div>' : '<iframe src="https://drive.google.com/file/d/' + esc(t.pdf) + '/preview" title="' + esc(t.n) + ' notes" loading="lazy"></iframe>';
      var content = ok
        ? '<p class="mute" style="margin-bottom:10px">' + esc(level.label + ', ' + level.exam) + '</p>' +
          '<div class="seg" role="group" aria-label="Lesson view" style="margin-bottom:12px"><button type="button" data-v="video" aria-pressed="true">Video</button><button type="button" data-v="notes" aria-pressed="false">Notes</button></div>' +
          '<div data-pane="video">' + box(video(t)) + '</div><div data-pane="notes" hidden>' + box(notes) + '</div>' +
          '<button type="button" class="btn btn--sun btn--wide" id="mk" style="margin-top:14px">' + (DONE.has(k) ? 'Completed, undo' : icon('check') + 'Mark lesson complete') + '</button>'
        : '<p class="mute">This lesson is part of full access. Unlock every lesson, note and worked solution.</p>' +
          '<button type="button" class="btn btn--sun btn--wide" style="margin-top:14px" data-unlock>' + icon('lock') + 'Unlock full access</button>';
      Sheet.open(t.n, content, function (b) {
        if (!ok) return;
        var seg = $('.seg', b);
        seg.addEventListener('click', function (e) {
          var v = e.target.closest('[data-v]'); if (!v) return;
          $$('[data-v]', seg).forEach(function (x) { x.setAttribute('aria-pressed', x === v); });
          $$('[data-pane]', b).forEach(function (p) { p.hidden = p.dataset.pane !== v.dataset.v; });
        });
        var play = $('.play', b);
        if (play) play.addEventListener('click', function () {
          var f = doc.createElement('iframe');
          f.src = 'https://www.youtube-nocookie.com/embed/' + play.dataset.yt + '?autoplay=1&playsinline=1';
          f.title = t.n + ' video lesson'; f.allow = 'autoplay; fullscreen; encrypted-media'; f.allowFullscreen = true;
          play.replaceWith(f);
        });
        $('#mk', b).addEventListener('click', function () {
          var had = DONE.has(k);
          if (had) DONE.delete(k); else DONE.add(k);
          store.set('kt_done', JSON.stringify(Array.from(DONE)));
          draw(false); progress();
          if (!had) { Sheet.close(); haptic(16); tone(660, .16, 'triangle', .05, 990); toast('Lesson complete. Nice work!'); C.ripple(innerWidth / 2, innerHeight / 2); var r = Progress.played(40); if (r.rose) toast('New rank: ' + r.rose); }
          else Sheet.close();
        });
      });
    }
    segs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-l]'); if (!b) return;
      level = KT.levels.filter(function (l) { return l.id === b.dataset.l; })[0];
      store.set('kt_lvl', KT.levels.indexOf(level));
      history.replaceState(history.state, '', '?level=' + level.id);
      haptic(6); drawSeg(); draw(true); requestAnimationFrame(function () { ScrollTrigger.refresh(); });
    });
    host.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) { haptic(6); open(+b.dataset.i); } });
    var unl = function () { draw(false); }; doc.addEventListener('kt:unlocked', unl);
    off.push(function () { doc.removeEventListener('kt:unlocked', unl); });
    var rs = function () { draw(false); }, rt;
    var onRs = function () { clearTimeout(rt); rt = setTimeout(rs, 200); }; addEventListener('resize', onRs, { passive: true });
    off.push(function () { removeEventListener('resize', onRs); });
    drawSeg(); draw(false); progress();
  };

  /* True or false bank. Every line was worked through by hand.
     [statement, is it true, why, level] */
  var BANK = [
    ['3² + 4² = 5²', 1, '9 + 16 = 25', 'nce'], ['½ + ¼ = ¾', 1, '2/4 + 1/4 = 3/4', 'nce'], ['0.5 = 5%', 0, '0.5 = 50%', 'nce'], ['25% of 80 = 20', 1, 'A quarter of 80', 'nce'],
    ['−3 × −4 = −12', 0, 'Negative × negative = positive: 12', 'nce'], ['2³ = 6', 0, '2 × 2 × 2 = 8', 'nce'], ['√81 = 9', 1, '9 × 9 = 81', 'nce'], ['Angles in a triangle add to 180°', 1, 'Always 180°', 'nce'],
    ['Angles on a straight line add to 360°', 0, 'A straight line is 180°', 'nce'], ['A square has 4 lines of symmetry', 1, '2 diagonals and 2 through the midpoints of opposite sides', 'nce'], ['3x + 2x = 5x', 1, 'Add like terms', 'nce'],
    ['3x × 2x = 6x', 0, '3x × 2x = 6x²', 'nce'], ['(−2)² = 4', 1, '−2 × −2 = 4', 'nce'], ['7 is a prime number', 1, 'Only 1 and 7 divide it', 'nce'], ['1 is a prime number', 0, 'Primes need exactly two factors', 'nce'],
    ['9 is a prime number', 0, '9 = 3 × 3', 'nce'], ['⅓ = 0.3', 0, '⅓ = 0.333…', 'nce'], ['The mean of 2, 4 and 9 is 5', 1, '15 ÷ 3 = 5', 'nce'], ['The median of 1, 3 and 9 is 3', 1, 'It is the middle value', 'nce'], ['0.1 × 0.1 = 0.01', 1, '1/10 × 1/10 = 1/100', 'nce'],
    ['(x + 2)² = x² + 4', 0, '(x + 2)² = x² + 4x + 4', 'sc'], ['(x + 3)(x − 3) = x² − 9', 1, 'Difference of two squares', 'sc'], ['x² − 5x + 6 = (x − 2)(x − 3)', 1, '−2 and −3 add to −5, multiply to 6', 'sc'],
    ['sin 30° = ½', 1, 'A standard value', 'sc'], ['cos 60° = ½', 1, 'A standard value', 'sc'], ['tan 45° = 1', 1, 'Opposite equals adjacent', 'sc'], ['sin 90° = 0', 0, 'sin 90° = 1', 'sc'], ['sin²θ + cos²θ = 1', 1, 'Pythagoras on the unit circle', 'sc'],
    ['log₁₀ 1000 = 3', 1, '10³ = 1000', 'sc'], ['log a + log b = log(a + b)', 0, 'log a + log b = log(ab)', 'sc'], ['a³ × a⁴ = a¹²', 0, 'Add the powers: a⁷', 'sc'], ['(a³)⁴ = a¹²', 1, 'Multiply the powers', 'sc'], ['√2 × √8 = 4', 1, '√16 = 4', 'sc'],
    ['√9 + √16 = √25', 0, '3 + 4 = 7, but √25 = 5', 'sc'], ['The gradient of y = 3x − 2 is 3', 1, 'y = mx + c, so m = 3', 'sc'], ['The derivative of x³ is 3x²', 1, 'Bring down the power, reduce by one', 'sc'], ['The derivative of 5 is 5', 0, 'A constant differentiates to 0', 'sc'],
    ['x² + 1 = 0 has no real roots', 1, 'The discriminant is −4', 'sc'], ['The angle in a semicircle is 90°', 1, 'A circle theorem', 'sc'], ['The angle at the centre is half the angle at the circumference', 0, 'The angle at the centre is twice as big', 'sc'],
    ['Parallel lines have equal gradients', 1, 'Same slope, never meet', 'sc'], ['The area of a circle is 2πr', 0, 'Area is πr². 2πr is the circumference', 'sc'], ['Interior angles of a hexagon add to 720°', 1, '(6 − 2) × 180° = 720°', 'sc'],
    ['d/dx (sin x) = cos x', 1, 'A standard derivative', 'hsc'], ['d/dx (cos x) = sin x', 0, 'd/dx (cos x) = −sin x', 'hsc'], ['d/dx (eˣ) = eˣ', 1, 'eˣ is its own derivative', 'hsc'], ['d/dx (ln x) = 1/x', 1, 'A standard derivative', 'hsc'],
    ['∫ 2x dx = x² + C', 1, 'Reverse of the power rule', 'hsc'], ['∫ 1/x dx = ln|x| + C', 1, 'A standard integral', 'hsc'], ['∫ x² dx = 2x + C', 0, '∫ x² dx = x³/3 + C', 'hsc'], ['sin 2θ = 2 sin θ cos θ', 1, 'The double angle formula', 'hsc'],
    ['cos 2θ = cos²θ + sin²θ', 0, 'cos 2θ = cos²θ − sin²θ', 'hsc'], ['ln(ab) = ln a + ln b', 1, 'A log law', 'hsc'], ['ln(a + b) = ln a + ln b', 0, 'There is no such law for a sum', 'hsc'], ['1 + 2 + 3 + … + 100 = 5050', 1, '100 × 101 ÷ 2', 'hsc'],
    ['½ + ¼ + ⅛ + … adds up to 1', 1, 'a/(1 − r) = ½ ÷ ½ = 1', 'hsc'], ['A geometric series converges when |r| < 1', 1, 'The terms shrink to zero', 'hsc'], ['With constant acceleration, v = u + at', 1, 'A suvat equation', 'hsc'], ['With constant acceleration, s = ut + at²', 0, 's = ut + ½at²', 'hsc'],
    ['The mean of B(n, p) is np', 1, 'A standard result', 'hsc'], ['The variance of B(n, p) is np', 0, 'Variance is np(1 − p)', 'hsc'], ['P(A or B) = P(A) + P(B) for any events', 0, 'Only when they are mutually exclusive', 'hsc'], ['(x + 1)³ = x³ + 3x² + 3x + 1', 1, 'Binomial coefficients 1, 3, 3, 1', 'hsc'],
    ['d/dx (x² sin x) = 2x cos x', 0, 'Product rule: 2x sin x + x² cos x', 'hsc']
  ];
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.random() * (i + 1) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function quickCard() {
    var a = 3 + (Math.random() * 10 | 0), b = 3 + (Math.random() * 10 | 0), good = Math.random() < .5, off = [1, 2, 10, -1, -2, -10][Math.random() * 6 | 0], r = a * b;
    return [a + ' × ' + b + ' = ' + (good ? r : r + off), good ? 1 : 0, a + ' × ' + b + ' = ' + r, 'any'];
  }

  function swipeGame(el, off) {
    var ROUND = 60, level = store.get('kt_glv') || 'sc', running = false, best = +store.get('kt_gbest') || 0, timer = null;
    var deck = [], cards = [], score = 0, combo = 0, right = 0, wrong = [], seen = 0, keyH;
    function title() {
      var p = Progress.get(), live = Progress.live();
      el.innerHTML = '<div class="over"><h2 class="d3">Swipe <em>Maths</em></h2><p class="mute">True or false? Swipe right for true, left for false. You get ' + ROUND + ' seconds.</p>' +
        '<div class="lvlpick" role="group" aria-label="Choose your level">' + [['nce', 'NCE'], ['sc', 'SC / IGCSE'], ['hsc', 'HSC']].map(function (l) { return '<button type="button" data-g="' + l[0] + '" aria-pressed="' + (l[0] === level) + '">' + l[1] + '</button>'; }).join('') + '</div>' +
        '<button type="button" class="btn btn--sun btn--wide" id="gGo">' + icon('play', 'ic') + 'Play</button>' +
        '<p class="mute" style="font-size:.94rem">Best score <b style="color:var(--ink)">' + best + '</b>' + (live ? ', ' + live + ' day streak' : '') + (p.xp ? ', ' + p.xp + ' XP' : '') + '</p></div>';
      $$('[data-g]', el).forEach(function (b) { b.addEventListener('click', function () { level = b.dataset.g; store.set('kt_glv', level); $$('[data-g]', el).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); haptic(5); }); });
      $('#gGo', el).addEventListener('click', start);
      if (!calm) gsap.from($('.over', el), { opacity: 0, y: 20, duration: .5 });
    }
    function pool() {
      var a = BANK.filter(function (c) { return c[3] === level; }), out = shuffle(a.slice());
      for (var i = 3; i < out.length; i += 4) out.splice(i, 0, quickCard());
      return out;
    }
    function draw1() { if (!deck.length) deck = pool(); return deck.shift(); }
    function makeCard(c, top) {
      var d = doc.createElement('div'); d.className = 'cardx';
      d.innerHTML = '<span class="stamp stamp--t">TRUE</span><span class="stamp stamp--f">FALSE</span><small>True or false?</small><div class="st">' + esc(c[0]) + '</div><div class="hintx" aria-hidden="true"><i>← False</i><b>True →</b></div>';
      d.__c = c;
      $('.deck', el).insertBefore(d, $('.deck', el).firstChild);
      gsap.set(d, { scale: top ? 1 : .94, y: top ? 0 : 14 });
      return d;
    }
    function start() {
      running = true; score = 0; combo = 0; right = 0; wrong = []; seen = 0; deck = pool();
      H.classList.add('playing');
      var top = el.getBoundingClientRect().top + scrollY - 10;
      if (lenis) { lenis.scrollTo(top, { immediate: true, force: true }); lenis.stop(); } else window.scrollTo(0, top);
      el.innerHTML = '<div class="game__top"><span>Score <b id="gS">0</b></span><span id="gC"></span><span><b id="gT">' + ROUND + '</b>s</span></div><div class="timer"><i id="gBar"></i></div><div class="deck" id="gDeck" aria-live="polite"></div>' +
        '<div class="game__btns"><button type="button" class="btn btn--f" id="gF">' + icon('x') + 'False</button><button type="button" class="btn btn--t" id="gTr">' + icon('check') + 'True</button></div>';
      cards = [makeCard(draw1(), true), makeCard(draw1(), false)];
      wire(cards[0]);
      $('#gF', el).addEventListener('click', function () { fly(cards[0], -1); });
      $('#gTr', el).addEventListener('click', function () { fly(cards[0], 1); });
      keyH = function (e) { if (!running) return; if (e.key === 'ArrowLeft') fly(cards[0], -1); if (e.key === 'ArrowRight') fly(cards[0], 1); };
      addEventListener('keydown', keyH);
      var t = { v: ROUND }, tEl = $('#gT', el);
      timer = gsap.to(t, { v: 0, duration: ROUND, ease: 'none', onUpdate: function () {
        tEl.textContent = Math.ceil(t.v); $('#gBar', el).style.transform = 'scaleX(' + (t.v / ROUND) + ')';
      }, onComplete: finish });
    }
    function wire(card) {
      var sx = 0, sy = 0, x = 0, y = 0, t0 = 0, on = false;
      var st = $('.stamp--t', card), sf = $('.stamp--f', card);
      card.addEventListener('pointerdown', function (e) { if (!running) return; on = true; sx = e.clientX; sy = e.clientY; t0 = performance.now(); card.setPointerCapture(e.pointerId); gsap.killTweensOf(card); });
      card.addEventListener('pointermove', function (e) {
        if (!on) return;
        x = e.clientX - sx; y = e.clientY - sy;
        gsap.set(card, { x: x, y: y * .3, rotation: x * .055, rotationY: x * .05 });
        var k = clamp(x / 90, -1, 1);
        st.style.opacity = clamp(k, 0, 1); sf.style.opacity = clamp(-k, 0, 1);
        card.style.borderColor = k > .05 ? 'rgb(94 234 212/' + k + ')' : k < -.05 ? 'rgb(251 113 133/' + (-k) + ')' : '';
      });
      var up = function () {
        if (!on) return; on = false;
        var v = x / Math.max(1, performance.now() - t0);
        if (Math.abs(x) > 84 || Math.abs(v) > .55 && Math.abs(x) > 24) fly(card, x > 0 ? 1 : -1, true);
        else { gsap.to(card, { x: 0, y: 0, rotation: 0, rotationY: 0, duration: .5, ease: 'back.out(2)' }); st.style.opacity = 0; sf.style.opacity = 0; card.style.borderColor = ''; }
      };
      card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
    }
    function fly(card, dir, dragged) {
      if (!running || !card || card.__gone) return;
      card.__gone = true;
      var c = card.__c, ok = (dir > 0) === !!c[1];
      seen++;
      if (ok) {
        right++; combo++;
        var mult = Math.min(1 + Math.floor(combo / 3), 5), add = 10 * mult;
        score += add; haptic(10); tone(520 + Math.min(combo, 12) * 40, .1, 'triangle', .04);
        if (!calm) {
          var pop = doc.createElement('span'); pop.className = 'pop'; pop.textContent = '+' + add; $('#gDeck', el).appendChild(pop);
          gsap.fromTo(pop, { xPercent: -50, y: 10, opacity: 1, scale: .7 }, { y: -90, opacity: 0, scale: 1.25, duration: .75, ease: 'power2.out', onComplete: function () { pop.remove(); } });
        }
      } else {
        wrong.push(c); combo = 0; haptic(40); tone(170, .22, 'sawtooth', .025, 110);
        var dk = $('#gDeck', el); if (dk && !calm) gsap.fromTo(dk, { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1.2,.3)' });
      }
      $('#gS', el).textContent = score;
      $('#gC', el).innerHTML = combo >= 3 ? '<b style="color:var(--sun)">×' + Math.min(1 + Math.floor(combo / 3), 5) + ' combo</b>' : '';
      if (!dragged) { $('.stamp--' + (dir > 0 ? 't' : 'f'), card).style.opacity = 1; }
      gsap.to(card, { x: dir * (innerWidth * .7 + 220), y: 30, rotation: dir * 26, rotationY: dir * 18, opacity: 0, duration: calm ? .01 : .36, ease: 'power2.in', onComplete: function () { card.remove(); } });
      cards.shift();
      var nextC = cards[0];
      if (nextC) { gsap.to(nextC, { scale: 1, y: 0, duration: .3, ease: 'back.out(1.6)' }); wire(nextC); }
      cards.push(makeCard(draw1(), false));
    }
    function finish() {
      running = false; removeEventListener('keydown', keyH);
      H.classList.remove('playing'); if (lenis) lenis.start();
      var isBest = score > best;
      if (isBest) { best = score; store.set('kt_gbest', best); }
      var p = Progress.played(Math.round(score / 10) + 5);
      var acc = seen ? Math.round(right / seen * 100) : 0;
      var share = 'I scored ' + score + ' on Swipe Maths at KavishTuitions. Can you beat me? ' + location.href.split('#')[0].split('?')[0];
      el.innerHTML = '<div class="over"><span class="eyebrow" style="margin:0">' + (isBest ? 'New best score!' : 'Time!') + '</span><div class="big shimmer" id="gBig">' + score + '</div>' +
        '<p class="mute">' + right + ' of ' + seen + ' correct (' + acc + '%). ' + p.streak + ' day streak, ' + p.xp + ' XP.</p>' + (p.rose ? '<p style="color:var(--sun);font-weight:600">New rank: ' + esc(p.rose) + '</p>' : '') +
        '<div class="row" style="width:100%"><button type="button" class="btn btn--sun" style="flex:1 1 140px" id="gAgain">Play again</button><a class="btn btn--wa" style="flex:1 1 140px" href="' + waLink2(share) + '" target="_blank" rel="noopener">' + icon('wa') + 'Challenge a friend</a></div>' +
        (wrong.length ? '<ul>' + wrong.slice(0, 5).map(function (c) { return '<li><b>' + esc(c[0]) + '</b><span>' + (c[1] ? 'True. ' : 'False. ') + esc(c[2]) + '</span></li>'; }).join('') + '</ul>' : '') + '</div>';
      $('#gAgain', el).addEventListener('click', start);
      if (!calm) { gsap.from($('.over', el), { opacity: 0, y: 24, duration: .5 }); gsap.from('#gBig', { scale: .5, duration: .9, ease: 'elastic.out(1,.5)' }); }
      C.ripple(innerWidth / 2, innerHeight / 2); haptic(isBest ? [20, 40, 20] : 12);
    }
    function waLink2(t) { return 'https://wa.me/?text=' + encodeURIComponent(t); }
    off.push(function () { running = false; H.classList.remove('playing'); if (lenis) lenis.start(); if (timer) timer.kill(); if (keyH) removeEventListener('keydown', keyH); });
    title();
  }

  function parabola(root, off) {
    var cv = $('#graph', root), g = cv.getContext('2d'), css = getComputedStyle(H);
    var COL = { ink: '#f5f2ff', sun: '#ffcf7a', pink: '#f9a8d4', cyan: '#67e8f9' };
    var ia = $('#ia', root), ib = $('#ib', root), ic = $('#ic', root);
    var T = { a: 1, b: -2, c: -3 }, P = { a: 1, b: -2, c: -3 }, tx = 2;
    var tangent = false, W = 1, Hh = 1, Sc = 1, raf = 0, drag = null;
    var fm = function (n) { return (+n.toFixed(2)).toString().replace('-', '−'); };
    function resize() {
      var r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      if (!r.width) return;
      W = r.width; Hh = r.height; Sc = Math.min(W / 14, Hh / 11);
      cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    }
    var x0 = function () { return W / 2; }, y0 = function () { return Hh / 2; };
    var sx = function (x) { return x0() + x * Sc; }, sy = function (y) { return y0() - y * Sc; };
    var f = function (x) { return P.a * x * x + P.b * x + P.c; };
    function paint() {
      var i, X = x0(), Y = y0();
      g.clearRect(0, 0, W, Hh);
      g.lineWidth = 1; g.strokeStyle = 'rgba(226,220,255,.09)'; g.beginPath();
      for (i = X % Sc; i < W; i += Sc) { g.moveTo(i, 0); g.lineTo(i, Hh); }
      for (i = Y % Sc; i < Hh; i += Sc) { g.moveTo(0, i); g.lineTo(W, i); }
      g.stroke();
      g.strokeStyle = 'rgba(226,220,255,.5)'; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, Hh); g.moveTo(0, Y); g.lineTo(W, Y); g.stroke();
      var grad = g.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, '#a48dff'); grad.addColorStop(.5, '#67e8f9'); grad.addColorStop(1, '#f9a8d4');
      g.strokeStyle = grad; g.lineWidth = 3.2; g.lineJoin = 'round'; g.beginPath();
      for (var px = 0; px <= W; px += 2) { var y = sy(f((px - X) / Sc)); if (px) g.lineTo(px, y); else g.moveTo(px, y); }
      g.stroke();
      var dot = function (x, y, c, r, ring) {
        g.fillStyle = c; g.beginPath(); g.arc(sx(x), sy(y), r, 0, 6.2832); g.fill();
        if (ring) { g.strokeStyle = c; g.globalAlpha = .34; g.lineWidth = 2; g.beginPath(); g.arc(sx(x), sy(y), r + 9, 0, 6.2832); g.stroke(); g.globalAlpha = 1; }
      };
      if (Math.abs(P.a) > .01) {
        var xv = -P.b / (2 * P.a), D = P.b * P.b - 4 * P.a * P.c;
        if (D >= 0) { var r = Math.sqrt(D); dot((-P.b + r) / (2 * P.a), 0, COL.cyan, 5); dot((-P.b - r) / (2 * P.a), 0, COL.cyan, 5); }
        dot(xv, f(xv), COL.pink, 9, true);
        if (!tangent) dot(xv + 1, f(xv + 1), COL.sun, 8, true);
      }
      if (tangent) {
        var m = 2 * P.a * tx + P.b, y1 = f(tx);
        g.strokeStyle = COL.sun; g.lineWidth = 1.8; g.setLineDash([8, 7]); g.beginPath();
        g.moveTo(sx(-9), sy(y1 + m * (-9 - tx))); g.lineTo(sx(9), sy(y1 + m * (9 - tx))); g.stroke(); g.setLineDash([]);
        dot(tx, y1, COL.sun, 9, true);
      }
    }
    function tick() {
      raf = 0;
      var still = true;
      ['a', 'b', 'c'].forEach(function (k) { var d = T[k] - P[k]; if (Math.abs(d) > .004) { P[k] += d * .3; still = false; } else P[k] = T[k]; });
      paint();
      if (!still) raf = requestAnimationFrame(tick);
    }
    function queue() { if (!raf) raf = requestAnimationFrame(tick); }
    function terms(a, b, c) {
      var out = '';
      var add = function (v, s) { if (!v) return; var m = Math.abs(v), co = m === 1 && s ? '' : fm(m); out += (out ? (v < 0 ? ' − ' : ' + ') : (v < 0 ? '−' : '')) + co + s; };
      add(a, 'x²'); add(b, 'x'); add(c, '');
      return 'y = ' + (out || '0');
    }
    function update(fromInputs) {
      var a = T.a, b = T.b, c = T.c, D = b * b - 4 * a * c;
      if (!fromInputs) { ia.value = a; ib.value = b; ic.value = c; }
      $('#oa', root).value = fm(a); $('#ob', root).value = fm(b); $('#oc', root).value = fm(c);
      $('#eq', root).textContent = terms(a, b, c);
      $('#rD', root).textContent = fm(D);
      var why = $('#why', root);
      if (!a) {
        $('#rV', root).textContent = 'none'; $('#rR', root).textContent = b ? fm(-c / b) : 'none'; $('#rN', root).textContent = 'Straight line';
        why.textContent = "With a = 0 there's no x² term, so this isn't a parabola.";
      } else {
        var xv = -b / (2 * a), r = Math.sqrt(Math.max(D, 0));
        $('#rV', root).textContent = '(' + fm(xv) + ', ' + fm(a * xv * xv + b * xv + c) + ')';
        $('#rR', root).textContent = D < 0 ? 'none' : D === 0 ? fm(xv) : [(-b - r) / (2 * a), (-b + r) / (2 * a)].sort(function (p, q) { return p - q; }).map(fm).join(', ');
        $('#rN', root).textContent = D > 0 ? '2 real roots' : D === 0 ? '1 repeated root' : 'No real roots';
        why.textContent = D > 0 ? 'Drag the pink vertex or the gold point. b² − 4ac > 0, so the curve crosses the x-axis twice.' : D === 0 ? 'b² − 4ac = 0, so the curve just touches the x-axis.' : 'b² − 4ac < 0, so the curve never reaches the x-axis.';
      }
      if (tangent) {
        var m = 2 * a * tx + b;
        why.textContent = 'Drag the gold point. At x = ' + fm(tx) + ' the gradient dy/dx = 2ax + b = ' + fm(m) + '.';
      }
      queue();
    }
    [ia, ib, ic].forEach(function (el) { el.addEventListener('input', function () { T.a = +ia.value; T.b = +ib.value; T.c = +ic.value; update(true); }); });
    function setMode(on) { tangent = on; $('#mMaths', root).setAttribute('aria-pressed', !on); $('#mAdd', root).setAttribute('aria-pressed', on); haptic(5); update(); paint(); }
    $('#mMaths', root).addEventListener('click', function () { setMode(false); });
    $('#mAdd', root).addEventListener('click', function () { setMode(true); });
    var snap = function (v, s) { return Math.round(v / s) * s; };
    function toXY(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left - x0()) / Sc, (y0() - (e.clientY - r.top)) / Sc]; }
    function moveTo(p) {
      if (drag === 'tan') { tx = clamp(p[0], -6.5, 6.5); paint(); update(); return; }
      var a = T.a, xv = a ? -T.b / (2 * a) : 0, yv = T.a * xv * xv + T.b * xv + T.c;
      if (drag === 'v') {
        var h = snap(clamp(p[0], -6, 6), .25), k = snap(clamp(p[1], -6, 6), .25);
        T.b = -2 * a * h; T.c = a * h * h + k;
      } else if (drag === 'a') {
        var na = snap(clamp(p[1] - yv, -4, 4), .25); if (!na) na = .25 * (p[1] >= yv ? 1 : -1);
        T.a = na; T.b = -2 * na * xv; T.c = na * xv * xv + yv;
      }
      T.b = +T.b.toFixed(3); T.c = +T.c.toFixed(3);
      update();
    }
    cv.addEventListener('pointerdown', function (e) {
      var p = toXY(e), a = T.a;
      cv.setPointerCapture(e.pointerId);
      if (tangent) { drag = 'tan'; moveTo(p); haptic(5); return; }
      if (!a) { drag = null; return; }
      var xv = -T.b / (2 * a), yv = a * xv * xv + T.b * xv + T.c;
      var dV = Math.hypot(p[0] - xv, p[1] - yv), dA = Math.hypot(p[0] - (xv + 1), p[1] - (yv + a));
      drag = dV <= dA ? 'v' : 'a'; haptic(5); moveTo(p);
    });
    cv.addEventListener('pointermove', function (e) { if (drag) moveTo(toXY(e)); });
    var endDrag = function () { drag = null; }; cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
    var ro = new ResizeObserver(resize); ro.observe(cv);
    off.push(function () { ro.disconnect(); if (raf) cancelAnimationFrame(raf); });
    update();
    return { show: resize };
  }

  function quickFire(root) {
    var ans = 0, sk = 0, best = +store.get('kt_best') || 0, R = function (n) { return 2 + Math.floor(Math.random() * n); };
    $('#qB', root).textContent = best;
    function nq() {
      var r = Math.random(), q, h;
      if (r < .4) { var a = R(8), x = R(12), b = R(20); q = a + 'x + ' + b + ' = ' + (a * x + b); ans = x; h = 'Solve for x'; }
      else if (r < .7) { var p = [10, 20, 25, 50, 75][R(5) - 2], n = [40, 80, 120, 200, 360][R(5) - 2]; q = p + '% of ' + n; ans = p * n / 100; h = 'Work it out'; }
      else { var s = R(4), l = s + 1 + Math.floor(Math.random() * 10); q = l + '² − ' + s + '²'; ans = l * l - s * s; h = 'Evaluate'; }
      $('#qq', root).textContent = q; $('#qh', root).textContent = h; $('#qin', root).value = '';
      if (!calm) gsap.fromTo('#qq', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .4 });
    }
    $('#quiz', root).addEventListener('submit', function (e) {
      e.preventDefault();
      var v = parseFloat($('#qin', root).value), m = $('#mark', root);
      if (isNaN(v)) { m.textContent = 'Type a number first.'; return; }
      if (Math.abs(v - ans) < .01) {
        sk++; if (sk > best) { best = sk; store.set('kt_best', best); }
        m.textContent = sk > 1 ? 'Correct! ' + sk + ' in a row.' : 'Correct!'; haptic(10); tone(660, .12, 'triangle', .04, 880);
        Progress.played(4); setTimeout(nq, 620);
      } else { sk = 0; m.textContent = 'Not quite. Try again.'; haptic(30); }
      $('#qS', root).textContent = sk; $('#qB', root).textContent = best;
    });
    $('#skip', root).addEventListener('click', function () { $('#mark', root).textContent = ''; nq(); });
    nq();
  }

  Pages.lab = function (root, off) {
    var game = $('#game', root);
    swipeGame(game, off);
    var pb = parabola(root, off);
    quickFire(root);
    var seg = $('#labTabs', root);
    function show(t) {
      if (!$('[data-tab="' + t + '"]', root)) t = 'swipe';
      $$('[data-t]', seg).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.t === t); });
      $$('[data-tab]', root).forEach(function (p) { p.hidden = p.dataset.tab !== t; });
      if (t === 'parabola') pb.show();
      var cur = $('[data-tab="' + t + '"]', root);
      if (!calm) gsap.fromTo(cur, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .5, clearProps: 'opacity,transform' });
      ScrollTrigger.refresh();
    }
    seg.addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (b) { haptic(5); show(b.dataset.t); } });
    var st = $('#labStreak', root), n = Progress.live();
    if (st && n) st.textContent = n + ' day streak. Keep it alive.';
    if (location.hash) show(location.hash.slice(1));
  };

  Pages.pricing = function () {};

  Pages.contact = function (root) {
    if (KT.email) {
      var l = $('#contactList', root), a = doc.createElement('a');
      a.className = 'cl'; a.href = 'mailto:' + KT.email;
      a.innerHTML = '<span class="i">' + icon('mail') + '</span><span><small>Email</small><b>' + esc(KT.email) + '</b></span>' + icon('arrow');
      l.insertBefore(a, l.children[2]);
    }
    $('#contactForm', root).addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { return $(id, root).value.trim(); }, er = $('#cErr', root);
      if (!v('#cName') || v('#cPhone').replace(/\D/g, '').length < 7) { er.textContent = 'Enter your name and a phone number with at least 7 digits.'; haptic(30); return; }
      er.textContent = '';
      var extra = v('#cMsg');
      window.open(waLink("Hi Kavish! I'd like to know more about your Maths tuition.\nName: " + v('#cName') + '\nPhone: ' + v('#cPhone') + '\nSubject: ' + v('#cSub') + '\nGrade: ' + v('#cGrade') + (extra ? '\n' + extra : '')), '_blank', 'noopener');
    });
  };

  /* ── page lifecycle ── */
  var ctx = null, offs = [], busy = false;
  function initPage(root) {
    var name = root.dataset.page;
    offs = [];
    ctx = gsap.context(function () {
      var fn = Pages[name]; if (fn) fn(root, offs);
      $$('[data-words]', root).forEach(function (r) { rotator(r, offs); });
      counters(root); rails(root, offs); accordions(root); tilts(root);
      reveals(root); progressBar();
    });
  }
  function destroyPage() {
    offs.forEach(function (f) { try { f(); } catch (e) {} }); offs = [];
    if (ctx) { ctx.revert(); ctx = null; }
    ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
  }
  function markNav(file) {
    $$('.nav a,.dock a').forEach(function (a) {
      if (a.getAttribute('href') === file) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* ── seamless navigation ── */
  var cache = {}, scrolls = {};
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function fileOf(url) { var p = new URL(url, location.href).pathname.split('/').pop(); return p || 'index.html'; }
  function fetchPage(url) {
    if (location.protocol === 'file:') return Promise.reject(new Error('file'));
    var k = new URL(url, location.href).pathname;
    if (cache[k]) return cache[k];
    return (cache[k] = fetch(k).then(function (r) { if (!r.ok) throw new Error('bad'); return r.text(); }).then(function (t) {
      var d = new DOMParser().parseFromString(t, 'text/html');
      return { title: d.title, desc: ($('meta[name=description]', d) || {}).content, main: d.getElementById('main') };
    }).catch(function (e) { delete cache[k]; throw e; }));
  }
  var flash, queued = null;
  function settle() {
    busy = false;
    if (queued) { var q = queued; queued = null; go(q[0], q[1]); }
  }
  function warpFlash() {
    if (!flash) { flash = doc.createElement('div'); flash.style.cssText = 'position:fixed;inset:0;z-index:35;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 50%,#f3e8ff,#a78bfa 26%,rgba(124,92,255,.34) 50%,transparent 74%)'; doc.body.appendChild(flash); }
    return flash;
  }
  function go(url, opt) {
    opt = opt || {};
    if (busy) { queued = [url, opt]; return; }
    var target = new URL(url, location.href);
    if (location.protocol === 'file:' || calm && false) { location.href = url; return; }
    busy = true;
    scrolls[fileOf(location.href)] = scrollY;
    if (Sheet.isOpen) Sheet.close();
    var big = !!opt.warp && !calm, old = $('#main');
    var out = gsap.timeline();
    if (calm) out.set(old, { opacity: 0 });
    else if (big) {
      var fl = warpFlash(); haptic(14); tone(120, 1.3, 'sawtooth', .025, 900);
      out.to(old, { opacity: 0, scale: .96, duration: .5, ease: 'power2.in' }, 0)
        .to(S, { warp: 1, dim: .3, gdim: 0, duration: 1.05, ease: 'power2.in', overwrite: 'auto' }, 0)
        .to(fl, { opacity: .9, duration: .42, ease: 'power2.in' }, .72);
    } else {
      out.to(old, { opacity: 0, y: -14, duration: .24, ease: 'power2.in' }, 0)
        .to(S, { warp: .16, duration: .24, ease: 'power2.in', overwrite: 'auto' }, 0);
    }
    Promise.all([fetchPage(target.href), new Promise(function (r) { out.eventCallback('onComplete', r); })]).then(function (res) {
      var next = res[0];
      destroyPage();
      if (lenis) { lenis.scrollTo(0, { immediate: true, force: true }); } else window.scrollTo(0, 0);
      window.scrollTo(0, 0);
      var fresh = doc.importNode(next.main, true);
      old.replaceWith(fresh);
      doc.title = next.title;
      var m = $('meta[name=description]'); if (m && next.desc) m.content = next.desc;
      doc.body.dataset.page = fresh.dataset.page;
      doc.body.dataset.file = fileOf(target.href);
      if (opt.push !== false) history.pushState({ page: target.href }, '', target.href);
      markNav(fileOf(target.href));
      sky(0); gsap.set('.prog', { scaleX: 0 });
      prepEnter(fresh);
      if (!calm) gsap.set(fresh, { opacity: 0 });
      initPage(fresh);
      applyScene(fresh.dataset.page, big ? 1.1 : .9);
      requestAnimationFrame(function () {
        ScrollTrigger.refresh();
        var back = opt.push === false ? scrolls[fileOf(target.href)] : 0;
        if (back) { if (lenis) lenis.scrollTo(back, { immediate: true, force: true }); else window.scrollTo(0, back); }
      });
      if (calm) { settle(); return; }
      gsap.to(fresh, { opacity: 1, duration: .5, ease: 'none', clearProps: 'opacity' });
      gsap.to(S, { warp: 0, duration: big ? 1.3 : .6, ease: 'power3.out' });
      if (big) { gsap.fromTo(S, { burst: .5 }, { burst: 0, duration: 1.3, ease: 'power3.out' }); gsap.to(warpFlash(), { opacity: 0, duration: .9, ease: 'power2.out' }); }
      playEnter(fresh, big ? .25 : .08);
      setTimeout(settle, 160);
    }).catch(function () { location.href = url; });
  }

  doc.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement; if (!t) return;
    var p = t.closest('[data-plan]'); if (p) { openUnlock(p.dataset.plan); return; }
    if (t.closest('[data-unlock]')) { openUnlock(); return; }
    if (t.closest('[data-join]')) { openJoin(); return; }
    if (t.closest('[data-menu]')) { openMenu(); return; }
    var a = t.closest('a[href]'); if (!a) return;
    if (a.target || a.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var href = a.getAttribute('href');
    if (/^(tel:|mailto:|https?:)/.test(href)) return;
    e.preventDefault();
    if (href.charAt(0) === '#') { var tg = $(href); if (tg) scrollTo(tg); return; }
    var sameFile = fileOf(a.href) === fileOf(location.href);
    if (sameFile && !a.search) { if (Sheet.isOpen) Sheet.close(); scrollTo(0, { offset: 0 }); return; }
    if (a.hasAttribute('data-close') && Sheet.isOpen) Sheet.close();
    go(a.href, { warp: a.hasAttribute('data-warp') });
  });
  function warm(e) { var a = e.target.closest && e.target.closest('a[href$=".html"],a[href*=".html?"]'); if (a) fetchPage(a.href).catch(function () {}); }
  doc.addEventListener('pointerover', warm, { passive: true });
  doc.addEventListener('touchstart', warm, { passive: true });
  addEventListener('popstate', function () {
    if (Sheet.takePop()) return;
    if (fileOf(location.href) !== doc.body.dataset.file) go(location.href, { push: false });
  });

  var T0 = doc.title;
  doc.addEventListener('visibilitychange', function () {
    if (doc.hidden) { T0 = doc.title; doc.title = 'Come back, x is waiting!'; } else doc.title = T0;
  });

  /* ── the intro exit: warp, burst, flash, open ── */
  function exitLoader(root) {
    var ld = $('#ld');
    if (!ld) { playEnter(root, 0); return; }
    if (calm || !B.wp) { B.kill && B.kill(); return; }
    var fullIntro = !!B.full, ls = $$('#ldLogo .l'), n = ls.length, mob = innerWidth < 760;
    var tl = gsap.timeline({ onComplete: function () { B.wp.on = 0; ld.remove(); if (lenis) lenis.start(); ScrollTrigger.refresh(); } });
    var fades = ['.ld-t', '.ld-b', '.ld-m', '.ld-n', '.ld-s'];
    var warpT = fullIntro ? 2.1 : .62, burstAt = fullIntro ? .8 : .16, flashAt = fullIntro ? 1.5 : .32, open = fullIntro ? 2 : .56;
    ls.forEach(function (l) { l.style.animation = 'none'; });
    tl.to(fades, { opacity: 0, y: -18, duration: fullIntro ? .6 : .3, stagger: .06, ease: 'power2.in' }, 0)
      .to('#ldLogo', { scale: 1.1, duration: 1, ease: 'power2.out' }, 0)
      .to('.ld-o', { scale: 2.4, opacity: 0, duration: fullIntro ? 1.6 : .7, ease: 'power3.in' }, fullIntro ? .4 : 0)
      .to(B.wp, { s: 1, duration: warpT, ease: 'power2.in' }, 0)
      .to(ls, { scale: mob ? 6 : 9, x: function (i) { return (i - (n - 1) / 2) * innerWidth * .11; }, opacity: 0, duration: fullIntro ? 1.3 : .7, stagger: { each: fullIntro ? .04 : .02, from: 'center' }, ease: 'power3.in' }, burstAt)
      .to('.ld-f', { opacity: .85, duration: fullIntro ? .7 : .35, ease: 'power2.in' }, flashAt)
      .addLabel('open', open)
      .to('.ld-f', { opacity: 0, duration: fullIntro ? 1.2 : .5, ease: 'power2.out' }, 'open')
      .to('#ldc', { opacity: 0, duration: fullIntro ? .9 : .4, ease: 'none' }, 'open')
      .to(ld, { opacity: 0, duration: fullIntro ? 1.5 : .55, ease: 'power2.out' }, fullIntro ? 'open-=.2' : 'open-=.1')
      .to(S, { burst: 0, duration: fullIntro ? 2.1 : 1.2, ease: 'expo.out' }, 'open-=.2')
      .add(function () { playEnter(root, 0); hint(); }, 'open-=.3');
    if (B.skip) tl.timeScale(2.4);
    B.onSkip = function () { tl.timeScale(2.4); };
  }

  function hint() {
    if (calm || !C.ok || store.get('kt_hint') || S.glyphs < .5) return;
    setTimeout(function () { if (store.get('kt_hint')) return; store.set('kt_hint', '1'); toast(fine ? 'Try it: drag the maths symbols' : 'Try it: flick the maths symbols', true); }, 2600);
  }

  /* ── go ── */
  function boot() {
    var root = $('#main'), canvas = $('#cosmos');
    doc.body.dataset.file = fileOf(location.href);
    if (store.get('kt_lite') === '1') window.KT_LITE = true;
    if (calm) H.classList.add('calm');
    var ok = C.init(canvas, { calm: calm });
    startScroll();
    if (lenis && $('#ld')) lenis.stop();
    if (ok) {
      S.burst = calm ? 0 : 1;
      S.dim = 1; S.gdim = 1;
      applyScene(root.dataset.page, 0, true);
      C.start();
      C.onTap = function () { haptic(10); tone(740, .1, 'sine', .03, 1100); };
      C.onFlick = function () { haptic(8); store.set('kt_hint', '1'); };
    }
    prepEnter(root);
    initPage(root);
    paintStreak(); paintMain();
    var lastW = innerWidth;
    addEventListener('resize', function () { if (innerWidth === lastW) return; lastW = innerWidth; if (curScene && !busy) { var c = SCENES[curScene], v = wide() ? c.w : c.t; if (scrollY < innerHeight) gsap.to(S, { x: v[0], y: v[1], scale: v[2], duration: .5 }); } }, { passive: true });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    if (fine && !calm) {
      var c = $('.kcur'), cx = gsap.quickTo(c, 'x', { duration: .3 }), cy = gsap.quickTo(c, 'y', { duration: .3 });
      addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        c.style.opacity = 1; cx(e.clientX); cy(e.clientY);
        c.classList.toggle('big', !!(e.target.closest && e.target.closest('a,button,[data-flip],summary')));
      }, { passive: true });
      doc.addEventListener('mouseleave', function () { c.style.opacity = 0; });
    }
    /* warm the likely next pages once everything is settled */
    setTimeout(function () { ['tuition.html', 'courses.html', 'lab.html'].forEach(function (u) { fetchPage(u).catch(function () {}); }); }, 3500);
    var finish = function () { exitLoader(root); };
    if (B.whenDone) B.whenDone(finish); else finish();
    window.KTDBG = { S: S, go: go, Sheet: Sheet, BANK: BANK, Progress: Progress, lenis: lenis };
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
