/* Hayata Technology — service worker V6.3.0
   Objectif : le site reste consultable avec une connexion lente ou coupée (contacts inclus).
   - Pages HTML : réseau d'abord (contenu toujours à jour), cache puis page hors-ligne en secours.
   - Fichiers statiques : cache d'abord + mise à jour en arrière-plan.
   Pour forcer une mise à jour chez tous les visiteurs : changer VERSION ci-dessous. */
const VERSION = 'hayata-v7.1.0';
const PRECACHE = [
  'offline.html', 'index.html', 'a-propos.html', 'services.html', 'connectivite.html', 'contact.html', '404.html',
  'assets/css/style.css?v=7.1.0', 'assets/css/icons.css?v=7.1.0', 'assets/css/v7.css?v=7.1.0', 'assets/js/v7.js?v=7.1.0',
  'assets/js/main.js?v=7.1.0', 'assets/js/v6-experience.js?v=7.1.0',
  'manifest.webmanifest', 'assets/img/emblem.png', 'assets/img/emblem-transparent.png', 'assets/img/favicon.png', 'assets/img/icon-192.png', 'assets/img/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(PRECACHE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('hayata-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const timeout = (ms, p) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout')), ms); p.then(v => { clearTimeout(t); res(v); }, err => { clearTimeout(t); rej(err); }); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!/^https?:$/.test(url.protocol)) return;

  // Pages : réseau d'abord (4 s max), sinon cache, sinon page hors-ligne
  if (req.mode === 'navigate') {
    e.respondWith(
      timeout(4000, fetch(req)).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req, {ignoreSearch:true}).then(r => r || caches.match(new URL('offline.html', self.registration.scope).href)))
    );
    return;
  }

  // Ressources du site et CDN (polices, icônes) : cache d'abord + rafraîchissement silencieux
  const sameOrigin = url.origin === location.origin;
  const cdn = /(^|\.)(googleapis|gstatic|cloudflare)\.com$/.test(url.hostname);
  if (!sameOrigin && !cdn) return;
  e.respondWith(
    caches.match(req).then(cached => {
      const refresh = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      return cached || refresh;
    })
  );
});
