/* KavishTuitions cache engine.
   Core files are stored at install, so repeat visits don't wait for the network and the
   site still opens offline. Pages check the network first so updates arrive quickly.
   A new version replaces the whole cache, so nothing old lingers. */
var V = 'kt-@@VERSION@@', CORE = @@CORE@@;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (e) {
  if (e.data && e.data.warm) caches.open(V).then(function (c) {
    e.data.warm.forEach(function (u) { c.match(u).then(function (hit) { if (!hit) c.add(u).catch(function () {}); }); });
  });
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  var page = r.mode === 'navigate' || /\.html$/.test(u.pathname) || u.pathname.slice(-1) === '/';
  if (page) {
    /* network first, but never leave someone waiting on a bad connection */
    e.respondWith(new Promise(function (done) {
      var settled = false, finish = function (x) { if (!settled && x) { settled = true; done(x); } };
      var fallback = function () { return caches.match(u.pathname).then(function (h) { return h || caches.match('index.html'); }); };
      var t = setTimeout(function () { fallback().then(finish); }, 2500);
      fetch(r).then(function (res) {
        clearTimeout(t);
        if (res.ok) { var copy = res.clone(); caches.open(V).then(function (c) { c.put(u.pathname, copy); }); }
        finish(res);
      }).catch(function () { clearTimeout(t); fallback().then(function (h) { finish(h || Response.error()); }); });
    }));
    return;
  }
  e.respondWith(caches.match(r).then(function (hit) {
    if (hit) return hit;
    return fetch(r).then(function (res) {
      if (res.ok && res.type === 'basic') { var copy = res.clone(); caches.open(V).then(function (c) { c.put(r, copy); }); }
      return res;
    });
  }));
});
