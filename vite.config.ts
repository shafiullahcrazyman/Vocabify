import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: '/Vocabify/',
    build: {
      outDir: 'dist',
      // Strip all console.* calls and debugger statements from production bundle.
      // This prevents internal storage key names and debug info leaking to DevTools.
      minify: true,
      esbuild: {
        drop: ['console', 'debugger'],
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script',
        // tutorial.mp4 is excluded from precache (1.1 MB) — it is handled by
        // runtimeCaching below so it is only fetched and cached on first play.
        includeAssets: ['icon.png'],
        manifest: {
          name: 'Vocabify',
          short_name: 'Vocabify',
          description: 'A modern, offline-first vocabulary application.',
          theme_color: '#141218',
          background_color: '#141218',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/Vocabify/',
          start_url: '/Vocabify/',
          icons: [
            { src: 'icon.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          ],
        },
        workbox: {
          // Cache all built assets
          // mp4 is excluded from precache — see runtimeCaching below
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2,woff}'],
          // Runtime caching for Google Fonts so they work offline after first load
          runtimeCaching: [
            {
              // Cache tutorial.mp4 at runtime (first play) rather than at
              // SW install time — keeps the precache payload ~1.1 MB lighter.
              urlPattern: /\/tutorial\.mp4$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'video-cache',
                expiration: {
                  maxEntries: 1,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: { statuses: [200] },
              },
            },
            {
              // Cache the CSS descriptor from fonts.googleapis.com
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Cache the actual font files from fonts.gstatic.com
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
