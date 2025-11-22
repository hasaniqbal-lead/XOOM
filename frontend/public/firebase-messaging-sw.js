// Service Worker for Push Notifications
import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

// Listen for push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.notification.body,
    icon: data.notification.icon || '/icon-192x192.png',
    badge: data.notification.badge || '/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.data?.type || 'default',
    data: data.data,
    actions: data.notification.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.notification.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let url = '/';

  if (event.notification.data) {
    const { type, ride_id, driver_id } = event.notification.data;

    switch (type) {
      case 'new_ride':
        url = '/driver';
        break;
      case 'ride_assigned':
        url = '/rider';
        break;
      case 'ride_completed':
        url = '/rider/history';
        break;
      default:
        url = '/';
    }
  }

  event.waitUntil(
    clients.openWindow(url)
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-rides') {
    event.waitUntil(syncRides());
  }
});

async function syncRides() {
  // Implement background sync logic
  console.log('Syncing rides...');
}
