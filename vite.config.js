import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['police-logo.png', 'police-logo-transparent.png', 'favicon.ico'],
      manifest: {
        name: 'Tanzania Police Digital Operations Platform',
        short_name: 'TPDOP',
        description: 'Field officer console for Tanzania Police Force - citations, arrests, investigations, patrols.',
        theme_color: '#0D3477',
        background_color: '#03102B',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'sw',
        icons: [
          { src: '/police-logo.png',             sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/police-logo.png',             sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/police-logo-transparent.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache strategy: app shell + Supabase API calls.
        // Officers in low-signal areas can still navigate cached pages.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,webp,woff2}'],
        // 5 MiB - allows mugshot / evidence photos to be precached
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          // Supabase REST queries - stale-while-revalidate (fast load, fresh in background)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-rest',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }, // 24h
            },
          },
          // Map tiles for the patrol map - cache aggressively (they don't change)
          {
            urlPattern: /^https:\/\/.*tile\.openstreetmap\.org/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
            },
          },
        ],
      },
      devOptions: { enabled: false }, // disable in dev (avoids confusing cache during dev)
    }),
  ],
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@':            resolve(__dirname, './src'),
      '@components':  resolve(__dirname, './src/components'),
      '@pages':       resolve(__dirname, './src/pages'),
      '@features':    resolve(__dirname, './src/features'),
      '@hooks':       resolve(__dirname, './src/hooks'),
      '@context':     resolve(__dirname, './src/context'),
      '@redux':       resolve(__dirname, './src/redux'),
      '@services':    resolve(__dirname, './src/services'),
      '@utils':       resolve(__dirname, './src/utils'),
      '@assets':      resolve(__dirname, './src/assets'),
      '@layout':      resolve(__dirname, './src/layout'),
    },
  },
  server: {
    port: 3000,
    open: true,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
