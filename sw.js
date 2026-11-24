/* Agenda Hub — Service Worker
   - Cache do "app shell" para funcionar offline
   - Rede primeiro para o HTML (sempre pega a versão nova quando há internet)
   - APIs do Google, RSS, ntfy e Telegram NUNCA passam pelo cache
   - Suporte a notificações (local e Web Push, se um dia você ligar um servidor VAPID) */

const VERSION = 'agenda-hub-v1.1.1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];
const CDN_HOSTS = ['cdn.tailwindcss.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Mesmo domínio: rede primeiro, cache como reserva (offline)
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))
        )
    );
    return;
  }

  // Tailwind CDN: usa o cache e atualiza em segundo plano
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => { cache.put(req, res.clone()); return res; })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
  // Demais domínios (Google APIs, RSS, ntfy, Telegram): segue direto para a rede
});

// Web Push (só dispara se você configurar um servidor de push com VAPID no futuro)
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Agenda Hub', {
      body: data.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: data.tag || undefined,
      data: { url: data.url || './' }
    })
  );
});

// Clique na notificação: foca o app (ou abre)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
