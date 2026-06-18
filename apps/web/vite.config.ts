import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/v1/social/vote') ||
              url.pathname.startsWith('/api/v1/posts') ||
              url.pathname.startsWith('/api/v1/polls'),
            handler: 'NetworkOnly',
            method: 'POST',
            options: {
              backgroundSync: {
                name: 'offline-mutations-queue',
                options: {
                  maxRetentionTime: 24 * 60, // Retry for max 24 hours
                },
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/v1/posts'),
            handler: 'NetworkOnly',
            method: 'PATCH',
            options: {
              backgroundSync: {
                name: 'offline-mutations-queue',
                options: {
                  maxRetentionTime: 24 * 60,
                },
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/v1/posts'),
            handler: 'NetworkOnly',
            method: 'DELETE',
            options: {
              backgroundSync: {
                name: 'offline-mutations-queue',
                options: {
                  maxRetentionTime: 24 * 60,
                },
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/v1/posts') &&
              !url.pathname.includes('/comments') &&
              !url.pathname.includes('/vote'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-posts-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/v1/events') ||
              url.pathname.startsWith('/api/v1/social/trending') ||
              url.pathname.startsWith('/api/v1/posts/course-codes'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-additional-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 10 * 60, // 10 minutes
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Logos',
        short_name: 'Logos',
        description: 'Logos - The academic social network for university students.',
        theme_color: '#00236f',
        background_color: '#faf8ff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: env.BACKEND_API_URL || 'http://localhost:7001',
        changeOrigin: true,
      },
    },
  },
  }
})
