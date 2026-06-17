/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

// Precache static assets injected by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
clientsClaim()

self.addEventListener('push', (event) => {
  const payload = event.data?.json()
  if (!payload) return

  const { title, body, data } = payload

  const options = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: data ?? {},
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    self.registration.showNotification(title, options as any),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data ?? {}
  const postId: string | undefined = data.postId
  const type: string | undefined = data.type

  let path = '/'
  if (postId && ['LIKE', 'LIKE_COMMENT', 'COMMENT', 'REPLY', 'MENTION', 'REPOST'].includes(type!)) {
    path = `/post/${postId}`
  } else if (type === 'FOLLOW' || type === 'SYSTEM') {
    path = '/notifications'
  }

  const urlToOpen = new URL(path, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(urlToOpen)
    }),
  )
})
