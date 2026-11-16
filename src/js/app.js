/* Kavish Maths app. One locked deck of full-screen sections.
   A mouse notch, swipe or arrow key moves exactly one section. The canvas and dock never
   reload: links swap the deck's content and the world morphs around it.
   Anything that can't run leaves plain, readable HTML behind. */
(function () {
  'use strict';
  var KT = window.KT, B = window.KTB || {}, doc = document, H = doc.documentElement, C = window.Cosmos, S = C.s;
  var gsap = window.gsap;
  window.KTAPP = true;
  gsap.defaults({ ease: 'power3.out' });

  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var calm = !!B.calm || matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var icon = function (n, c) { return '<svg class="' + (c || 'ic') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; };
  var esc = function (t) { var d = doc.createElement('div'); d.textContent = t; return d.innerHTML; };
  var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 60); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var waLink = function (t) { return 'https://wa.me/' + KT.whatsapp + (t ? '?text=' + encodeURIComponent(t) : ''); };
  var unlocked = function () { return KT.keys.indexOf(store.get('kt_key') || '') > -1; };
  var conn = navigator.connection || {}, thrifty = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');

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
    toastEl.textContent = m; toastEl.classList.toggle('up', !!top); toastEl.classList.add('on');
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


  /* colours live in one place; the 3D reads them from there */
  function hex(n, c) { var s = c.getPropertyValue(n).trim(); return [1, 3, 5].map(function (i) { return parseInt(s.substr(i, 2), 16) / 255; }); }
  function syncTheme() {
    var c = getComputedStyle(H);
    C.theme({ c0: hex('--p0', c), g0: hex('--g0', c), g1: hex('--g1', c), g2: hex('--g2', c) });
  }

  function fit() {}
  function place() {}
  function sky() {}

  /* ── the page: sections scroll normally. This only tracks which one you are looking at ── */
  var Deck = (function () {
    var el, secs = [], cur = -1, hold = false, io, hooks = {}, seen = new Map(), tween, raf = 0, HEAD = 84;
    function setCur(i) {
      if (i === cur || !secs[i]) return;
      var prev = cur;
      if (secs[prev] && hooks.leave) hooks.leave(secs[prev], secs[i]);
      cur = i;
      if (!hold && hooks.enter) hooks.enter(secs[i], secs[prev]);
    }
    function pick() {
      raf = 0;
      var best = -1, h = 0;
      secs.forEach(function (s, i) { var v = seen.get(s) || 0; if (v > h) { h = v; best = i; } });
      if (best > -1) setCur(best);
    }
    function observe(es) {
      es.forEach(function (e) {
        seen.set(e.target, e.isIntersecting ? e.intersectionRect.height : 0);
        if (e.isIntersecting && !hold) e.target.classList.add('on');
      });
      if (!raf) raf = requestAnimationFrame(pick);
    }
    function topOf(s) { return Math.max(0, s.offsetTop - (secs.indexOf(s) ? HEAD : 0)); }
    function goTo(i, instant) {
      i = clamp(i, 0, secs.length - 1);
      var s = secs[i]; if (!s) return;
      if (tween) tween.kill();
      if (calm || instant) { el.scrollTop = topOf(s); return; }
      tween = gsap.to(el, { scrollTop: topOf(s), duration: .7, ease: 'power3.inOut' });
    }
    return {
      setup: function () {
        el = $('#deck');
        /* a finger or the wheel always wins over a scroll that is still gliding */
        var stop = function () { if (tween) tween.kill(); };
        el.addEventListener('wheel', stop, { passive: true });
        el.addEventListener('touchstart', stop, { passive: true });
      },
      start: function (h, opt) {
        hooks = h || {}; hold = !!(opt && opt.hold);
        secs = $$('.s', el); cur = -1; seen = new Map();
        el.classList.remove('lock'); el.scrollTop = 0;
        secs.forEach(function (s) { $$('[data-a]', s).forEach(function (a, i) { a.style.setProperty('--a', Math.min(i, 6)); }); });
        if (io) io.disconnect();
        io = new IntersectionObserver(observe, { root: el, threshold: [0, .05, .15, .3, .5, .75, 1] });
        var start = clamp(opt && opt.at || 0, 0, secs.length - 1);
        if (start) el.scrollTop = topOf(secs[start]);
        setCur(start);
        secs.forEach(function (s) { io.observe(s); });
      },
      release: function () {
        if (!hold) return;
        hold = false;
        secs.forEach(function (s, i) { if (i === cur || (seen.get(s) || 0) > 0) s.classList.add('on'); });
        if (secs[cur] && hooks.enter) hooks.enter(secs[cur], undefined);
      },
      goTo: goTo,
      get index() { return cur; },
      get section() { return secs[cur]; },
      indexOf: function (s) { return secs.indexOf(s); },
      byId: function (id) { var s = doc.getElementById(id), sec = s && s.closest('.s'); return sec ? secs.indexOf(sec) : -1; },
      lock: function (on) { if (el) el.classList.toggle('lock', !!on); },
      stop: function () { if (io) io.disconnect(); if (tween) tween.kill(); hooks = {}; secs = []; cur = -1; }
    };
  })();

  /* ── bottom sheets: the only popup on the site ── */
  var Sheet = (function () {
    var d, panel, scrim, body, title, isOpen = false, ignorePop = false, closing = false;
    function build() {
      d = doc.createElement('dialog'); d.className = 'sheet'; d.setAttribute('aria-labelledby', 'shT');
      d.innerHTML = '<div class="sheet__scrim"></div><section class="sheet__p"><div class="sheet__grip"><i></i></div><header class="sheet__head"><h2 id="shT"></h2><button type="button" class="sheet__x" aria-label="Close">' + icon('x') + '</button></header><div class="sheet__b"></div></section>';
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
        C.dimmed = true;
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
            C.dimmed = false;
          }
        });
      },
      get isOpen() { return isOpen; },
      takePop: function () { if (ignorePop) { ignorePop = false; return true; } if (isOpen) { api.close(true); return true; } return false; }
    };
    return api;
  })();

  /* ── The notes reader. PDF pages are drawn right in the site with PDF.js, so notes open
        on phones too (a plain PDF frame shows nothing on most phones). Pages are drawn
        only as they scroll into view, so long notes stay light. ── */
  var Reader = (function () {
    var d, wrap, pgEl, tEl, sEl, dl, isOpen = false, ignorePop = false, pdf = null, io = null, job = 0, lib = null, zoom = 1, ratios = [], cur = 0;
    var MAXPX = 12e6; // phones refuse very large canvases
    function loadLib() {
      if (lib) return lib;
      lib = new Promise(function (ok, no) {
        if (window.pdfjsLib) { ok(window.pdfjsLib); return; }
        var s = doc.createElement('script'); s.src = 'js/pdf/pdf.min.js';
        s.onload = function () { var L = window.pdfjsLib; if (!L) { no(); return; } L.GlobalWorkerOptions.workerSrc = 'js/pdf/pdf.worker.min.js'; ok(L); };
        s.onerror = function () { lib = null; s.remove(); no(); };
        doc.head.appendChild(s);
      });
      return lib;
    }
    function build() {
      d = doc.createElement('dialog'); d.className = 'rd'; d.setAttribute('aria-labelledby', 'rdT');
      d.innerHTML = '<header class="rd__bar"><button type="button" class="rd__i" data-rd="x" aria-label="Close the notes">' + icon('back') + '</button>' +
        '<div class="rd__t"><b id="rdT"></b><small></small></div><span class="rd__pg" aria-live="polite"></span>' +
        '<button type="button" class="rd__i rd__z" data-rd="out" aria-label="Zoom out">' + icon('minus') + '</button><button type="button" class="rd__i rd__z" data-rd="in" aria-label="Zoom in">' + icon('plus') + '</button>' +
        '<a class="rd__i" download aria-label="Download the notes">' + icon('down') + '</a></header><div class="rd__pages" tabindex="0"></div>';
      doc.body.appendChild(d);
      wrap = $('.rd__pages', d); pgEl = $('.rd__pg', d); tEl = $('#rdT', d); sEl = $('.rd__t small', d); dl = $('a[download]', d);
      d.addEventListener('cancel', function (e) { e.preventDefault(); api.close(); });
      d.addEventListener('click', function (e) {
        var b = e.target.closest('[data-rd]'); if (!b) return;
        if (b.dataset.rd === 'x') api.close(); else setZoom(zoom * (b.dataset.rd === 'in' ? 1.25 : .8));
      });
      wrap.addEventListener('scroll', count, { passive: true });
      addEventListener('resize', function () { if (isOpen && pdf) lay(); });
    }
    function baseW() { return Math.min(wrap.clientWidth - 24, 860); }
    function lay() {
      var w = Math.round(baseW() * zoom);
      $$('.rd__p', wrap).forEach(function (el, i) {
        el.style.width = w + 'px'; el.style.height = Math.round(w * ratios[i]) + 'px'; el.dataset.w = w;
        if (io) { io.unobserve(el); io.observe(el); }
      });
    }
    function setZoom(z) {
      z = clamp(z, .6, 3); if (!pdf || z === zoom) return;
      var y = wrap.scrollTop / Math.max(1, wrap.scrollHeight), x = wrap.scrollLeft / Math.max(1, wrap.scrollWidth);
      zoom = z; lay();
      wrap.scrollTop = y * wrap.scrollHeight; wrap.scrollLeft = x * wrap.scrollWidth;
      haptic(5);
    }
    function render(el) {
      var w = +el.dataset.w, my = job;
      if (+el.dataset.r === w || !pdf) return;
      el.dataset.r = w;
      pdf.getPage(+el.dataset.n + 1).then(function (page) {
        if (my !== job) return;
        var v1 = page.getViewport({ scale: 1 }), s = w / v1.width * Math.min(devicePixelRatio || 1, 2);
        if (v1.width * v1.height * s * s > MAXPX) s = Math.sqrt(MAXPX / (v1.width * v1.height));
        var vp = page.getViewport({ scale: s }), c = doc.createElement('canvas');
        c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
        return page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () {
          if (my !== job || +el.dataset.r !== w) return;
          var old = $('canvas', el); if (old) old.replaceWith(c); else el.appendChild(c);
        });
      }).catch(function () { el.dataset.r = ''; });
    }
    function count() {
      if (!pdf) return;
      var ps = $$('.rd__p', wrap), mid = wrap.scrollTop + wrap.clientHeight / 3, i = 0;
      while (i < ps.length - 1 && ps[i + 1].offsetTop <= mid) i++;
      if (i !== cur || !pgEl.textContent) { cur = i; pgEl.textContent = (i + 1) + ' / ' + ps.length; }
    }
    function fail(url) {
      wrap.innerHTML = '<div class="rd__msg"><p>These notes couldn’t open here' + (navigator.onLine === false ? ' while you’re offline' : '') + '.</p><a class="btn btn--sun" href="' + esc(url) + '" target="_blank" rel="noopener">Open the PDF</a></div>';
    }
    var api = {
      open: function (url, title, sub) {
        if (!d) build();
        var my = ++job;
        if (io) io.disconnect(); io = null;
        if (pdf) { pdf.destroy(); pdf = null; }
        zoom = 1; cur = 0;
        tEl.textContent = title; sEl.textContent = sub || ''; pgEl.textContent = '';
        dl.href = url; dl.setAttribute('download', title.replace(/[\\/:*?"<>|]/g, '') + '.pdf');
        wrap.innerHTML = '<div class="rd__msg"><span class="rd__spin"></span><p>Opening the notes…</p></div>';
        if (!isOpen) { isOpen = true; d.showModal(); history.pushState({ reader: 1, page: location.href }, ''); tone(520, .12, 'triangle', .03, 760); }
        wrap.scrollTop = 0; wrap.focus({ preventScroll: true });
        /* fetched whole, so the cache engine keeps a copy and notes read before open offline */
        var file = fetch(url).then(function (r) { if (!r.ok) throw new Error('missing'); return r.arrayBuffer(); });
        Promise.all([loadLib(), file]).then(function (res) {
          if (my !== job) return;
          return res[0].getDocument({ data: new Uint8Array(res[1]), isEvalSupported: false }).promise.then(function (p) {
            if (my !== job) { p.destroy(); return; }
            pdf = p;
            var all = [];
            for (var i = 1; i <= p.numPages; i++) all.push(p.getPage(i).then(function (pg) { var v = pg.getViewport({ scale: 1 }); return v.height / v.width; }));
            return Promise.all(all).then(function (r) {
              if (my !== job) return;
              ratios = r;
              wrap.innerHTML = r.map(function (_, i) { return '<div class="rd__p" data-n="' + i + '" role="img" aria-label="Page ' + (i + 1) + ' of ' + r.length + '"></div>'; }).join('');
              io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) render(e.target); }); }, { root: wrap, rootMargin: '900px 0px' });
              lay(); count();
            });
          });
        }).catch(function () { if (my === job) fail(url); });
      },
      close: function (fromPop) {
        if (!isOpen) return;
        isOpen = false; job++;
        if (io) io.disconnect(); io = null;
        if (pdf) { pdf.destroy(); pdf = null; }
        d.close(); wrap.innerHTML = '';
        if (!fromPop) { ignorePop = true; history.back(); }
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
    var go2 = function () {
      window.google.accounts.id.initialize({ client_id: KT.googleClientId, ux_mode: 'popup', callback: function (res) {
        var p = parseJwt(res.credential);
        if (!p) { toast('Google sign-in failed. Use WhatsApp instead.'); return; }
        USER = { name: p.name, given_name: p.given_name, email: p.email, picture: p.picture };
        store.set('kt_user', JSON.stringify(USER));
        slot.textContent = 'Signed in as ' + USER.name;
      } });
      window.google.accounts.id.renderButton(slot, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: 280 });
    };
    if (window.google && window.google.accounts) return go2();
    var s = doc.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = go2; doc.head.appendChild(s);
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
      '<form id="fKeyF" novalidate style="border-top:1px solid var(--line);padding-top:6px"><label class="field">Already have an unlock key?<input type="text" id="fKey" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="done"></label>' +
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
          /* keys work however they are typed: capitals, small letters, stray spaces */
          var typed = $('#fKey', body).value.replace(/\s+/g, '').toUpperCase();
          var k = KT.keys.filter(function (x) { return x.replace(/\s+/g, '').toUpperCase() === typed; })[0];
          if (!k) { $('#kErr', body).textContent = "That key isn't valid. Check it, or ask Kavish on WhatsApp."; haptic(30); return; }
          store.set('kt_key', k); Sheet.close(); haptic(14); toast('Full access unlocked'); paintMain();
          doc.dispatchEvent(new Event('kt:unlocked'));
        });
      });
  }
  function openJoin() {
    if (unlocked()) { go('courses.html'); return; }
    Sheet.open('Join Kavish Maths',
      '<p class="mute">Start free, then pick a plan when you are ready.</p>' +
      '<a class="btn btn--sun btn--wide" style="margin-top:12px" href="courses.html" data-close>Start a free lesson' + icon('arrow') + '</a>' +
      '<div class="jplans"><button type="button" class="jplan" data-plan="Monthly (Rs 500)"><b>Monthly</b><span>Per month</span><i>Rs 500</i></button>' +
      '<button type="button" class="jplan hot" data-plan="Term (Rs 1,200)"><b>Term</b><span>Most popular, save 20%</span><i>Rs 1,200</i></button>' +
      '<button type="button" class="jplan" data-plan="Full Year (Rs 3,500)"><b>Full Year</b><span>Best value</span><i>Rs 3,500</i></button></div>' +
      '<div class="row"><a class="btn btn--wa" style="flex:1 1 150px" href="' + waLink("Hi Kavish! I'd like to know more about your Maths tuition.") + '" target="_blank" rel="noopener">' + icon('wa') + 'WhatsApp</a>' +
      '<a class="btn btn--line" style="flex:1 1 120px" href="tel:+' + KT.whatsapp + '">' + icon('phone') + 'Call</a></div>');
  }
  function openMenu() {
    var cur = fileOf(location.href);
    var item = function (h, n, i) { return '<a href="' + h + '"' + (h === cur ? ' aria-current="page"' : '') + '>' + icon(i) + '<span>' + n + '</span>' + icon('arrow') + '</a>'; };
    var p = Progress.get(), live = Progress.live();
    Sheet.open('Menu',
      '<nav class="mlinks" aria-label="All pages">' + item('index.html', 'Home', 'home') + item('courses.html', 'Courses', 'book') + item('pricing.html', 'Pricing', 'tag') + item('lab.html', 'Maths Lab', 'lab') + item('contact.html', 'Contact', 'chat') + '</nav>' +
      (p.xp ? '<div class="mtog"><span>' + esc(Progress.rank(p.xp)) + '<small>' + p.xp + ' XP, ' + live + ' day streak</small></span>' + icon('flame') + '</div>' : '') +
      '<div class="mtog" style="border-bottom:0"><span>Sound effects<small>Soft ticks and chimes</small></span><button type="button" class="tog" id="tSnd" aria-pressed="' + SON + '" aria-label="Sound effects"></button></div>',
      function (b) {
        $('#tSnd', b).addEventListener('click', function () { SON = !SON; store.set('kt_snd', SON ? '1' : '0'); this.setAttribute('aria-pressed', SON); tone(500, .2, 'triangle', .05, 900); haptic(6); });
      });
  }
  function paintMain() {
    var l = $('[data-main-label]'); if (l) l.textContent = unlocked() ? 'Learn' : 'Join';
    var j = $('.top__end [data-unlock]'); if (j) j.hidden = unlocked();
  }

  /* ── small motion pieces ── */
  function split(el) {
    if (el.__split) return;
    el.__split = 1;
    var n = 0, wrap = function (node) { var o = doc.createElement('span'), i = doc.createElement('span'); o.className = 'w'; i.className = 'wi'; i.style.setProperty('--w', n++); i.appendChild(node); o.appendChild(i); return o; };
    Array.prototype.slice.call(el.childNodes).forEach(function (c) {
      var f = doc.createDocumentFragment(), words = (c.textContent || '').split(/(\s+)/);
      if (c.nodeType === 3) {
        words.forEach(function (w) { if (!w) return; if (/^\s+$/.test(w)) f.appendChild(doc.createTextNode(' ')); else f.appendChild(wrap(doc.createTextNode(w))); });
        c.parentNode.replaceChild(f, c);
      } else if (c.nodeName === 'EM') {
        words.forEach(function (w) { if (!w) return; if (/^\s+$/.test(w)) f.appendChild(doc.createTextNode(' ')); else { var e = doc.createElement('em'); e.textContent = w; f.appendChild(wrap(e)); } });
        c.parentNode.replaceChild(f, c);
      }
    });
  }
  function rotator(el) {
    var words = el.dataset.words.split(','), i = 0, cur = el.firstElementChild, inline = el.classList.contains('rot');
    var fitW = function (s, t) { if (inline) gsap.to(el, { width: s.offsetWidth + 2, duration: t, ease: 'power3.inOut' }); };
    fitW(cur, 0);
    return function () {
      i = (i + 1) % words.length;
      var n = doc.createElement('span'); n.textContent = words[i]; el.appendChild(n);
      var o = cur;
      gsap.to(o, { yPercent: -112, opacity: 0, duration: .34, ease: 'power2.in', onComplete: function () { o.remove(); } });
      gsap.fromTo(n, { yPercent: 112 }, { yPercent: 0, duration: .7, delay: .2, ease: 'expo.out' });
      fitW(n, .55); cur = n;
    };
  }
  function quotes(q) {
    var figs = $$('figure', q), dots = q.parentNode.querySelector('[data-qdots]'), i = 0;
    dots.innerHTML = figs.map(function (f, n) { return '<button type="button" aria-label="Quote ' + (n + 1) + '" aria-pressed="' + (n === 0) + '"><i></i></button>'; }).join('');
    var btns = $$('button', dots);
    function show(n) { i = n; figs.forEach(function (f, k) { f.classList.toggle('on', k === n); }); btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === n); }); }
    btns.forEach(function (b, n) { b.addEventListener('click', function () { show(n); haptic(5); }); });
    return function () { show((i + 1) % figs.length); };
  }
  function count(el) {
    var to = +el.dataset.count, o = { v: 0 }, suf = el.dataset.suffix || '';
    if (calm) return;
    gsap.to(o, { v: to, duration: 1.3, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v) + suf; } });
  }
  function accordions(root) {
    $$('[data-faq]', root).forEach(function (box) {
      var all = $$('details', box);
      var close = function (d) { var a = $('.a', d); gsap.to(a, { height: 0, opacity: 0, duration: calm ? .01 : .3, ease: 'power2.inOut', onComplete: function () { d.open = false; gsap.set(a, { clearProps: 'height,opacity' }); } }); };
      if (all[0]) all[0].open = true;
      all.forEach(function (d) {
        $('summary', d).addEventListener('click', function (e) {
          e.preventDefault(); haptic(5);
          if (d.open) { close(d); return; }
          all.forEach(function (x) { if (x.open && x !== d) close(x); });
          d.open = true;
          gsap.from($('.a', d), { height: 0, opacity: 0, duration: calm ? .01 : .36, ease: 'power3.out', clearProps: 'height,opacity' });
        });
      });
    });
  }

  /* ── pages ── */
  var Pages = {};

  Pages.home = function (root, off, each) {
    /* Qualifications appear only once they are real. An empty slot never reaches the page. */
    var creds = $('#creds', root), real = function (c) { return !c.slot; };
    var row = function (ic) { return function (c) { return '<li><span class="tag">' + icon(ic) + '</span><span><b>' + esc(c.title) + '</b><br><small>' + esc([c.place, c.when].filter(Boolean).join(', ')) + '</small></span></li>'; }; };
    if (creds) {
      creds.innerHTML = (KT.education || []).filter(real).map(row('cap')).concat((KT.certifications || []).filter(real).map(row('medal'))).slice(0, 3).join('');
      creds.hidden = !creds.innerHTML;
    }
    if (KT.photo) $$('[data-avatar]', root).forEach(function (a) { a.innerHTML = '<img src="' + esc(KT.photo) + '" alt="' + esc(KT.name) + '" width="224" height="224" decoding="async" loading="lazy">'; });
  };

  Pages.courses = function (root, off) { chapters(root, off); };

  /* The chapter list: pick a grade and a course, open a chapter, read its notes. */
  function chapters(root, off) {
    var ST = window.KTS || [], DONE = new Set(), all = [], filter = '';
    try { DONE = new Set(JSON.parse(store.get('kt_done') || '[]')); } catch (e) {}
    var segs = $('#levels', root), crs = $('#crs', root), info = $('#cinfo', root), host = $('#chapters', root);
    if (!segs || !host || !ST.length) return;
    ST.forEach(function (st) { st.courses.forEach(function (c) { c.stage = st; all.push(c); }); });
    var byId = function (id) { return all.filter(function (c) { return c.id === id; })[0]; };
    var q = new URLSearchParams(location.search), lv = q.get('level');
    var oldLevel = ST.filter(function (s) { return s.id === (lv === 'nce' ? 'g9' : lv); })[0];
    var course = byId(q.get('course')) || (oldLevel && oldLevel.courses[0]) || byId(store.get('kt_course')) || all[0];
    var list = function () { return course.parts.reduce(function (a, p) { return a.concat(p.ch); }, []); };
    var allowed = function (ch) { return !!ch.free || unlocked(); };
    var codeOf = function (c) { return c.code && c.code !== 'NCE' ? ' (' + c.code + ')' : ''; };

    function drawPick() {
      segs.innerHTML = ST.map(function (s) { return '<button type="button" data-st="' + s.id + '" aria-pressed="' + (s === course.stage) + '">' + esc(s.label) + '</button>'; }).join('');
      var cs = course.stage.courses;
      crs.hidden = cs.length < 2;
      crs.innerHTML = cs.map(function (c) { return '<button type="button" data-co="' + c.id + '" aria-pressed="' + (c === course) + '">' + esc(c.name) + (c.code ? '<small>' + esc(c.code) + '</small>' : '') + '</button>'; }).join('');
    }
    function drawInfo() {
      var l = list(), done = l.filter(function (c) { return DONE.has(c.k); }).length, real = l.filter(function (c) { return c.real; }).length;
      info.innerHTML = '<div class="cinfo__top"><div><b>' + esc(course.board) + esc(codeOf(course)) + '</b><small>' + l.length + ' chapters, ' + (real ? real + ' with notes ready' : 'sample notes for now') + (course.note ? '. ' + esc(course.note) : '') + '</small></div>' +
        '<span class="cinfo__n" title="Chapters done">' + done + '/' + l.length + '</span></div><div class="cinfo__bar" aria-hidden="true"><i style="width:' + (l.length ? done / l.length * 100 : 0).toFixed(1) + '%"></i></div>' +
        '<label class="cinfo__q">' + icon('search') + '<span class="sr">Find a chapter</span><input class="inp" type="search" id="chq" placeholder="Find a chapter or topic" autocomplete="off" enterkeyhint="search" value="' + esc(filter) + '"></label>';
    }
    function row(ch) {
      var done = DONE.has(ch.k), ok = allowed(ch), tags = [];
      var cls = done ? 'done' : ok ? (ch.free && !unlocked() ? 'free' : 'open') : 'locked';
      if (done) tags.push('Done'); else if (!ok) tags.push('Locked'); else if (ch.free && !unlocked()) tags.push('Free');
      tags.push(ch.real ? (ch.real > 1 ? ch.real + ' notes' : 'Notes') : 'Sample notes');
      if (ch.yt) tags.push('Video');
      return '<button type="button" class="node ' + cls + (ch.real ? ' real' : '') + '" data-c="' + ch.n + '" aria-label="Chapter ' + ch.n + ', ' + esc(ch.t) + '. ' + tags.join(', ') + '">' +
        '<span class="node__b" aria-hidden="true">' + (done ? icon('check') : ok ? '<span class="node__num">' + ch.n + '</span>' : icon('lock')) + '</span>' +
        '<span class="node__t"><span class="node__n">' + esc(ch.t) + '</span><span class="node__s">' + tags.join(' · ') + '</span></span></button>';
    }
    function drawList() {
      var f = filter.trim().toLowerCase(), html = '';
      course.parts.forEach(function (p) {
        var rows = p.ch.filter(function (ch) { return !f || (ch.t + ' ' + ch.s.join(' ')).toLowerCase().indexOf(f) > -1; });
        if (rows.length) html += '<section class="part"><h2 class="part__h">' + esc(p.name) + '<small>' + p.ch.length + ' chapter' + (p.ch.length > 1 ? 's' : '') + '</small></h2><div class="glass path">' + rows.map(row).join('') + '</div></section>';
      });
      host.innerHTML = html || '<p class="note">No chapter matches “' + esc(filter.trim()) + '”.</p>';
    }
    function drawAll() { drawPick(); drawInfo(); drawList(); }
    function pick(c) {
      if (!c || c === course) return;
      course = c; filter = '';
      store.set('kt_course', c.id);
      history.replaceState(history.state, '', '?course=' + c.id);
      haptic(6); drawAll();
    }
    function open(n) {
      var ch = list().filter(function (x) { return x.n === n; })[0]; if (!ch) return;
      var ok = allowed(ch), k = ch.k, sub = 'Chapter ' + ch.n + ' · ' + course.name + codeOf(course);
      var html = '<p class="mute" style="margin-bottom:14px">' + esc(course.board + codeOf(course) + ', chapter ' + ch.n) + '</p>' +
        '<h3 class="cs__h">In this chapter</h3><ul class="ticks cs__l">' + ch.s.map(function (s) { return '<li>' + icon('check') + '<span>' + esc(s) + '</span></li>'; }).join('') + '</ul>';
      if (ok) {
        if (!ch.real) html += '<p class="cs__sample">' + icon('note') + '<span>These are <b>sample notes</b> so the site can be tested. Kavish’s real notes for this chapter are on the way.</span></p>';
        if (ch.yt) html += '<div class="vbox" style="margin-top:16px"><button type="button" class="play" data-yt="' + esc(ch.yt) + '" aria-label="Play the video for ' + esc(ch.t) + '" style="background-image:url(https://i.ytimg.com/vi/' + esc(ch.yt) + '/hqdefault.jpg)"><span>' + icon('play', '') + '</span></button></div>';
        html += '<h3 class="cs__h" style="margin-top:18px">Notes</h3><div class="cs__files">' + ch.f.map(function (f, i) {
          return '<div class="cs__file"><button type="button" class="cs__open" data-read="' + i + '">' + icon('note') + '<span><b>' + esc(f.t || (ch.real ? 'Chapter notes' : 'Sample notes')) + '</b><small>Read here</small></span></button>' +
            '<a class="cs__dl" href="' + esc(f.u) + '" download="' + esc('Chapter ' + ch.n + ' - ' + ch.t + (f.t ? ' - ' + f.t : '') + '.pdf') + '" aria-label="Download ' + esc(f.t || 'the notes') + '">' + icon('down') + '</a></div>';
        }).join('') + '</div>' +
          '<button type="button" class="btn btn--line btn--wide" id="mk" style="margin-top:14px">' + (DONE.has(k) ? 'Completed, undo' : icon('check') + 'Mark chapter complete') + '</button>';
      } else {
        html += '<p class="mute" style="margin-top:16px">This chapter is part of full access. Unlock every chapter, its notes and worked solutions.</p><button type="button" class="btn btn--sun btn--wide" style="margin-top:14px" data-unlock>' + icon('lock') + 'Unlock full access</button>';
      }
      Sheet.open(ch.t, html, function (b) {
        if (!ok) return;
        $('.cs__files', b).addEventListener('click', function (e) {
          var r = e.target.closest('[data-read]'); if (!r) return;
          var f = ch.f[+r.dataset.read]; haptic(6);
          Reader.open(f.u, f.t ? ch.t + ': ' + f.t : ch.t, sub + (ch.real ? '' : ' · sample'));
        });
        var play = $('.play', b);
        if (play) play.addEventListener('click', function () {
          var f = doc.createElement('iframe');
          f.src = 'https://www.youtube-nocookie.com/embed/' + play.dataset.yt + '?autoplay=1&playsinline=1';
          f.title = ch.t + ' video'; f.allow = 'autoplay; fullscreen; encrypted-media'; f.allowFullscreen = true;
          play.replaceWith(f);
        });
        $('#mk', b).addEventListener('click', function () {
          var had = DONE.has(k);
          if (had) DONE.delete(k); else DONE.add(k);
          store.set('kt_done', JSON.stringify(Array.from(DONE)));
          drawInfo(); drawList(); Sheet.close();
          if (!had) { haptic(16); tone(660, .16, 'triangle', .05, 990); toast('Chapter complete. Nice work!'); C.ripple(innerWidth / 2, innerHeight / 2); var r = Progress.played(40); if (r.rose) toast('New rank: ' + r.rose); }
        });
      });
    }
    segs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-st]'); if (!b) return;
      var st = ST.filter(function (s) { return s.id === b.dataset.st; })[0];
      if (st && st !== course.stage) pick(st.courses[0]);
    });
    crs.addEventListener('click', function (e) { var b = e.target.closest('[data-co]'); if (b) pick(byId(b.dataset.co)); });
    info.addEventListener('input', function (e) { if (e.target.id === 'chq') { filter = e.target.value; drawList(); } });
    host.addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (b) { haptic(6); open(+b.dataset.c); } });
    var unl = function () { drawInfo(); drawList(); }; doc.addEventListener('kt:unlocked', unl);
    off.push(function () { doc.removeEventListener('kt:unlocked', unl); });
    drawAll();
  }

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
      el.innerHTML = '<div class="over"><h1 class="d1">Swipe <em>Maths</em></h1><p class="lede">True or false? Swipe the card right for true, left for false. You get ' + ROUND + ' seconds.</p>' +
        '<div class="lvlpick" role="group" aria-label="Choose your level">' + [['nce', 'NCE'], ['sc', 'SC / IGCSE'], ['hsc', 'HSC']].map(function (l) { return '<button type="button" data-g="' + l[0] + '" aria-pressed="' + (l[0] === level) + '">' + l[1] + '</button>'; }).join('') + '</div>' +
        '<button type="button" class="btn btn--sun btn--wide" id="gGo">' + icon('play', 'ic') + 'Play</button>' +
        '<p class="mute" style="font-size:.94rem">Best score <b style="color:var(--ink)">' + best + '</b>' + (live ? ', ' + live + ' day streak' : '') + (p.xp ? ', ' + p.xp + ' XP' : '') + '</p></div>';
      $$('[data-g]', el).forEach(function (b) { b.addEventListener('click', function () { level = b.dataset.g; store.set('kt_glv', level); $$('[data-g]', el).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); haptic(5); }); });
      $('#gGo', el).addEventListener('click', start);
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
      $('.deckx', el).insertBefore(d, $('.deckx', el).firstChild);
      gsap.set(d, { scale: top ? 1 : .94, y: top ? 0 : 14 });
      return d;
    }
    function start() {
      running = true; score = 0; combo = 0; right = 0; wrong = []; seen = 0; deck = pool();
      H.classList.add('playing');
      /* while a round is on, the game takes the whole screen so the buttons are never cut off */
      var panel = el.closest('.tool'), box = $('#deck');
      if (panel && box) box.scrollTop += panel.getBoundingClientRect().top - 12;
      Deck.lock(true);
      el.innerHTML = '<div class="game__top"><span>Score <b id="gS">0</b></span><span id="gC"></span><span><b id="gT">' + ROUND + '</b>s</span></div><div class="timer"><i id="gBar"></i></div><div class="deckx" id="gDeck" aria-live="polite"></div>' +
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
      H.classList.remove('playing'); Deck.lock(false);
      var isBest = score > best;
      if (isBest) { best = score; store.set('kt_gbest', best); }
      var p = Progress.played(Math.round(score / 10) + 5);
      var acc = seen ? Math.round(right / seen * 100) : 0;
      var share = 'I scored ' + score + ' on Swipe Maths at Kavish Maths. Can you beat me? ' + location.href.split('#')[0].split('?')[0];
      el.innerHTML = '<div class="over"><span class="eyebrow" style="margin:0">' + (isBest ? 'New best score!' : 'Time!') + '</span><div class="big shimmer" id="gBig">' + score + '</div>' +
        '<p class="mute">' + right + ' of ' + seen + ' correct (' + acc + '%). ' + p.streak + ' day streak, ' + p.xp + ' XP.</p>' + (p.rose ? '<p style="color:var(--sun);font-weight:600">New rank: ' + esc(p.rose) + '</p>' : '') +
        '<div class="row" style="width:100%"><button type="button" class="btn btn--sun" style="flex:1 1 140px" id="gAgain">Play again</button><a class="btn btn--wa" style="flex:1 1 140px" href="' + waLink2(share) + '" target="_blank" rel="noopener">' + icon('wa') + 'Challenge a friend</a></div>' +
        (wrong.length ? '<ul>' + wrong.slice(0, 5).map(function (c) { return '<li><b>' + esc(c[0]) + '</b><span>' + (c[1] ? 'True. ' : 'False. ') + esc(c[2]) + '</span></li>'; }).join('') + '</ul>' : '') + '</div>';
      $('#gAgain', el).addEventListener('click', start);
      if (!calm) { gsap.from($('.over', el), { opacity: 0, y: 24, duration: .5 }); gsap.from('#gBig', { scale: .5, duration: .9, ease: 'elastic.out(1,.5)' }); }
      C.ripple(innerWidth / 2, innerHeight / 2); haptic(isBest ? [20, 40, 20] : 12);
    }
    function waLink2(t) { return 'https://wa.me/?text=' + encodeURIComponent(t); }
    off.push(function () { running = false; H.classList.remove('playing'); Deck.lock(false); if (timer) timer.kill(); if (keyH) removeEventListener('keydown', keyH); });
    title();
  }

  function parabola(root, off) {
    var cv = $('#graph', root), g = cv.getContext('2d'), css = getComputedStyle(H), tok = function (n) { return css.getPropertyValue(n).trim(); };
    var COL = { ink: tok('--ink'), sun: tok('--sun'), pink: tok('--pink'), cyan: tok('--cyan'), violet: tok('--violet') };
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
      g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.08)'; g.beginPath();
      for (i = X % Sc; i < W; i += Sc) { g.moveTo(i, 0); g.lineTo(i, Hh); }
      for (i = Y % Sc; i < Hh; i += Sc) { g.moveTo(0, i); g.lineTo(W, i); }
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.42)'; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, Hh); g.moveTo(0, Y); g.lineTo(W, Y); g.stroke();
      var grad = g.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, COL.violet); grad.addColorStop(.5, COL.cyan); grad.addColorStop(1, COL.pink);
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
      var why = $('#why-l', root);
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
      if (!calm) gsap.fromTo($('#qq', root), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .4 });
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


  Pages.lab = function (root, off, each) {
    swipeGame($('#game', root), off);
    var pb = null, qf = false;
    /* the graph and quiz are only built when you get near them */
    each.push({ enter: function (s) {
      if (s.id === 'parabola' || s.id === 'swipe') { if (!pb) pb = parabola(root, off); else pb.show(); }
      if (s.id === 'quick' && !qf) { qf = true; quickFire(root); }
    } });
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
  var offs = [];
  function initPage(root, opt) {
    var name = doc.body.dataset.page, each = [];
    offs = [];
    var fn = Pages[name]; if (fn) fn(root, offs, each);
    accordions(root);
    var rots = new Map(), qs = new Map();
    $$('[data-words]', root).forEach(function (r) { rots.set(r.closest('.s'), rotator(r)); });
    $$('[data-quotes]', root).forEach(function (q) { qs.set(q.closest('.s'), quotes(q)); });
    var tick = setInterval(function () {
      if (doc.hidden) return;
      var s = Deck.section; if (!s) return;
      if (rots.get(s)) rots.get(s)();
    }, 2300), tick2 = setInterval(function () {
      if (doc.hidden) return;
      var s = Deck.section; if (s && qs.get(s)) qs.get(s)();
    }, 4200);
    offs.push(function () { clearInterval(tick); clearInterval(tick2); });
    var counted = new Set();
    Deck.start({
      enter: function (s, from) {
        each.forEach(function (h) { if (h && h.enter) h.enter(s, from); });
        if (s.hasAttribute('data-warp-pull') && !calm) gsap.to(S, { warp: .14, duration: 1.2, overwrite: 'auto' });
        if (!counted.has(s)) { counted.add(s); $$('[data-count]', s).forEach(count); }
      },
      leave: function (s, to) {
        each.forEach(function (h) { if (h && h.leave) h.leave(s, to); });
        if (s.hasAttribute('data-warp-pull')) gsap.to(S, { warp: 0, duration: .6, overwrite: 'auto' });
      }
    }, opt);
  }
  function destroyPage() {
    offs.forEach(function (f) { try { f(); } catch (e) {} }); offs = [];
    Deck.stop();
  }
  function markNav(file) {
    $$('.nav a,.dock a').forEach(function (a) {
      if (a.getAttribute('href') === file) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* ── seamless navigation, with a small memory of recent pages ── */
  var cache = new Map(), spots = {}, queued = null, busy = false;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function fileOf(url) { var p = new URL(url, location.href).pathname.split('/').pop(); return p || 'index.html'; }
  function fetchPage(url) {
    if (location.protocol === 'file:') return Promise.reject(new Error('file'));
    var k = new URL(url, location.href).pathname;
    if (cache.has(k)) return cache.get(k);
    var p = fetch(k).then(function (r) { if (!r.ok) throw new Error('bad'); return r.text(); }).catch(function (e) { cache.delete(k); throw e; });
    cache.set(k, p);
    if (cache.size > 7) cache.delete(cache.keys().next().value);
    return p;
  }
  var flash;
  function warpFlash() {
    if (!flash) { flash = doc.createElement('div'); flash.style.cssText = 'position:fixed;inset:0;z-index:35;pointer-events:none;opacity:0;background:var(--flash)'; doc.body.appendChild(flash); }
    return flash;
  }
  function settle() { busy = false; if (queued) { var q = queued; queued = null; go(q[0], q[1]); } }
  function go(url, opt) {
    opt = opt || {};
    if (busy) { queued = [url, opt]; return; }
    var target = new URL(url, location.href);
    if (location.protocol === 'file:') { location.href = url; return; }
    busy = true;
    spots[fileOf(location.href)] = Deck.index;
    if (Sheet.isOpen) Sheet.close();
    var big = !!opt.warp && !calm, deck = $('#deck'), out = gsap.timeline();
    if (calm) out.set(deck, { opacity: 0 });
    else if (big) {
      var fl = warpFlash(); haptic(14); tone(120, 1.3, 'sawtooth', .025, 900);
      out.to(deck, { opacity: 0, scale: .96, duration: .5, ease: 'power2.in' }, 0)
        .to(S, { warp: 1, dim: .3, duration: 1.05, ease: 'power2.in', overwrite: 'auto' }, 0)
        .to(fl, { opacity: .9, duration: .42, ease: 'power2.in' }, .72);
    } else {
      out.to(deck, { opacity: 0, y: -14, duration: .22, ease: 'power2.in' }, 0)
        .to(S, { warp: .16, duration: .22, ease: 'power2.in', overwrite: 'auto' }, 0);
    }
    Promise.all([fetchPage(target.href), new Promise(function (r) { out.eventCallback('onComplete', r); })]).then(function (res) {
      var d = new DOMParser().parseFromString(res[0], 'text/html'), next = d.getElementById('deck');
      destroyPage();
      deck.innerHTML = '';
      while (next.firstChild) deck.appendChild(doc.adoptNode(next.firstChild));
      doc.title = d.title;
      var m = $('meta[name=description]'), md = $('meta[name=description]', d); if (m && md) m.content = md.content;
      doc.body.dataset.page = d.body.dataset.page;
      doc.body.dataset.file = fileOf(target.href);
      if (opt.push !== false) history.pushState({ page: target.href }, '', target.href);
      markNav(fileOf(target.href));
      sky(0);
      gsap.set(S, { mask: 0, sky: 0, sun: 0, maskScale: 1 });
      gsap.set(deck, { clearProps: 'scale,y' });
      var at = opt.push === false ? spots[fileOf(target.href)] || 0 : 0;
      if (target.hash) { var sec = doc.getElementById(target.hash.slice(1)); if (sec) at = $$('.s', deck).indexOf(sec); }
      initPage(deck, { at: at, hold: true });
      if (calm) { gsap.set(deck, { clearProps: 'opacity' }); Deck.release(); settle(); return; }
      gsap.to(deck, { opacity: 1, duration: .42, ease: 'none', clearProps: 'opacity' });
      gsap.to(S, { warp: 0, duration: big ? 1.3 : .6, ease: 'power3.out' });
      if (big) { gsap.fromTo(S, { burst: .5 }, { burst: 0, duration: 1.3, ease: 'power3.out' }); gsap.to(warpFlash(), { opacity: 0, duration: .9, ease: 'power2.out' }); }
      gsap.delayedCall(big ? .2 : .05, Deck.release);
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
    var sameFile = fileOf(a.href) === fileOf(location.href);
    if (sameFile && !a.search) {
      if (Sheet.isOpen) Sheet.close();
      var id = href.split('#')[1]; Deck.goTo(id ? Math.max(0, Deck.byId(id)) : 0); return;
    }
    if (a.hasAttribute('data-close') && Sheet.isOpen) Sheet.close();
    go(a.href, { warp: a.hasAttribute('data-warp') });
  });
  function warm(e) { var a = e.target.closest && e.target.closest('a[href$=".html"],a[href*=".html?"],a[href*=".html#"]'); if (a) fetchPage(a.href).catch(function () {}); }
  doc.addEventListener('pointerover', warm, { passive: true });
  doc.addEventListener('touchstart', warm, { passive: true });
  addEventListener('popstate', function () {
    if (Reader.takePop()) return;
    if (Sheet.takePop()) return;
    if (fileOf(location.href) !== doc.body.dataset.file) go(location.href, { push: false });
  });

  var T0 = doc.title;
  doc.addEventListener('visibilitychange', function () {
    if (doc.hidden) { T0 = doc.title; doc.title = 'Come back, x is waiting!'; } else doc.title = T0;
  });

  /* ── the cache engine: makes repeat visits instant, and works offline ── */
  function offlineReady() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      var tell = function () {
        if (thrifty) return;
        var w = reg.active || reg.waiting || reg.installing;
        if (w) w.postMessage({ warm: ['index.html', 'courses.html', 'pricing.html', 'lab.html', 'contact.html'] });
      };
      if (reg.active) tell(); else navigator.serviceWorker.ready.then(tell);
    }).catch(function () {});
  }

  /* ── the intro exit: warp, burst, flash, open ── */
  function hint() {
    /* mouse only: on a phone the bubble sat on top of the headline */
    if (calm || !fine || !C.ok || store.get('kt_hint') || S.glyphs < .5) return;
    setTimeout(function () { if (store.get('kt_hint')) return; store.set('kt_hint', '1'); toast(fine ? 'Try it: drag the maths symbols' : 'Try it: flick the maths symbols', true); }, 2600);
  }
  function unlockScroll() { H.classList.remove('loading'); }
  var introTl = null;
  function exitLoader() {
    var ld = $('#ld');
    if (!ld) { unlockScroll(); Deck.release(); return; }
    if (calm || !B.wp) { unlockScroll(); Deck.release(); if (B.kill) B.kill(); return; }
    var fullIntro = !!B.full, ls = $$('#ldLogo .l'), n = ls.length, mob = innerWidth < 760;
    var tl = introTl = gsap.timeline({ onComplete: function () { B.wp.on = 0; ld.remove(); } });
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
      .add(function () { unlockScroll(); Deck.release(); hint(); }, 'open-=.3');
    if (B.skip) tl.timeScale(2.4);
    B.onSkip = function () { tl.timeScale(2.4); };
  }

  /* ── go ── */
  function boot() {
    var root = $('#deck'), canvas = $('#cosmos');
    doc.body.dataset.file = fileOf(location.href);
    if (store.get('kt_lite') === '1' || thrifty) window.KT_LITE = true;
    if (calm) H.classList.add('calm');
    syncThemeSoon();
    var ok = C.init(canvas, { calm: calm });
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add(function () { C.tick(performance.now()); });
    Deck.setup();
    if (ok) {
      syncTheme();
      S.burst = calm ? 0 : 1; S.dim = 1; S.gdim = 1;
      C.start();
      C.onTap = function () { haptic(10); tone(740, .1, 'sine', .03, 1100); };
      C.onFlick = function () { haptic(8); store.set('kt_hint', '1'); };
    }
    var at = 0;
    if (location.hash) { var sec = doc.getElementById(location.hash.slice(1)); if (sec) at = $$('.s', root).indexOf(sec); }
    initPage(root, { at: Math.max(0, at), hold: true });
    paintStreak(); paintMain();
    /* once the page is settled, quietly fetch the likely next pages and turn on the cache */
    var settled = function () {
      offlineReady();
      if (!thrifty) ['courses.html', 'pricing.html'].forEach(function (u) { fetchPage(u).catch(function () {}); });
    };
    setTimeout(function () { idle(settled); }, 3200);
    var finish = function () { exitLoader(); };
    if (B.whenDone) B.whenDone(finish); else finish();
    /* the intro runs on animation frames. If they ever stop, it must not trap anyone on its screen */
    setTimeout(function () {
      if (!$('#ld')) return;
      if (introTl) introTl.kill();
      unlockScroll(); Deck.release(); if (B.kill) B.kill();
    }, 12000);
    window.KTDBG = { S: S, go: go, Sheet: Sheet, BANK: BANK, Progress: Progress, Deck: Deck };
  }
  /* the changing word in the headline is measured again once the real font has arrived */
  function syncThemeSoon() { if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { $$('.rot').forEach(function (r) { var c = r.lastElementChild; if (c) gsap.set(r, { width: c.offsetWidth + 2 }); }); }); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
