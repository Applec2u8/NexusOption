// Nexus Option Service Worker v2 - Simplified
// Only handles push notifications from the backend
// Trade resolution is now handled by the backend (Edge Function) and frontend fallback

const SW_VERSION = 'v2';

self.addEventListener('install', (event) => {
  console.log(`[SW ${SW_VERSION}] Installing...`);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log(`[SW ${SW_VERSION}] Activated`);
  event.waitUntil(self.clients.claim());
});

// Handle push notifications from the backend
self.addEventListener('push', (event) => {
  let data = { title: 'Trade Result', body: 'Your trade has been settled.' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'trade-result',
      renotify: true,
      data: data
    })
  );
});

// Handle notification click - open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) client = clientList[i];
        }
        return client.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

// Ignore TRACK_TRADE messages (legacy support - no longer needed)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRACK_TRADE') {
    // Intentionally ignored - trade resolution is now handled by backend + frontend fallback
    console.log(`[SW ${SW_VERSION}] TRACK_TRADE ignored (handled by backend)`);
  }
});
