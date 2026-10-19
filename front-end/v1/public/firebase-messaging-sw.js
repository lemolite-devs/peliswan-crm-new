// Firebase messaging service worker for handling push notifications
importScripts(
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js'
)
importScripts(
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js'
)

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyArh-2Q0Gimj2F8Vvi7GTZ5ojkOSXO8Vbs',
  authDomain: 'peliswan-sales-crm.firebaseapp.com',
  projectId: 'peliswan-sales-crm',
  storageBucket: 'peliswan-sales-crm.firebasestorage.app',
  messagingSenderId: '113411520206',
  appId: '1:113411520206:web:f6c2925d80bfb8d1b6429f'
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/logo192.png',
    badge: payload.notification.badge || '/logo192.png',
    data: payload.data,
    actions: payload.notification.actions || [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    requireInteraction: true,
    silent: false
  }

  // Show notification
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  )
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window/tab open with the target URL
          for (const client of clientList) {
            if (
              client.url.includes(self.location.origin) &&
              'focus' in client
            ) {
              return client.focus()
            }
          }

          // If not, open a new window/tab
          if (clients.openWindow) {
            const data = event.notification.data
            let url = '/'

            // Navigate to specific page based on notification data
            if (data && data.url) {
              // Use the URL from notification data if available
              url = data.url
            } else if (data && data.path) {
              url = `/${data.path}`
            }
            return clients.openWindow(url)
          }
        })
    )
  }
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {})
