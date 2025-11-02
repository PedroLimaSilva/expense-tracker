import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0', // Allow access from local network
    port: 5173, // Default Vite port, can be changed if needed
    strictPort: false, // Allow fallback to next available port if 5173 is taken
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Auto-update but ensure offline functionality works
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      devOptions: {
        enabled: true, // Enable in dev for testing
        type: 'module'
      },
      manifest: {
        name: 'Expense Tracker',
        short_name: 'Expense Tracker',
        description: 'Track your personal expenses offline and sync to cloud',
        theme_color: '#38ef7d',
        background_color: '#161b22',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        // Ensure all app shell assets are precached
        maximumFileSizeToCacheInBytes: 5000000, // 5MB - increase if needed
        // Clean up old caches on update
        cleanupOutdatedCaches: true,
        // Runtime caching for static external assets only
        // Note: Firebase API requests are NOT cached - app uses IndexedDB for offline-first storage
        runtimeCaching: [
          {
            // Cache Google Fonts - CacheFirst since fonts don't change often
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-static-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
})
