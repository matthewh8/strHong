// Custom service worker additions — merged into the Serwist-generated SW by @ducanh2912/next-pwa

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event) => {
  const data = event.data?.json() as { title?: string; body?: string } | undefined ?? {};

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Water Reminder', {
      body: data.body ?? "Time to drink water! 💧",
      icon: '/api/icon?size=192',
      badge: '/api/icon?size=192',
      tag: 'water-reminder',
      renotify: true,
      data: { url: '/water' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url: string = (event.notification.data as { url?: string })?.url ?? '/water';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes('/water'));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
