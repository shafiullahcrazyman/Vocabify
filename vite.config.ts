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
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script',
        includeAssets: ['icon.png', 'tutorial.mp4'],
        manifest: {
          name: 'Vocabify',
          short_name: 'Vocabify',
          description: 'A modern, offline-first vocabulary application.',
          theme_color: '#141218',
          background_color: '#141218',
          display: 'standalone',
          scope: '/Vocabify/',
          start_url: '/Vocabify/',
          icons: [
            { src: 'icon.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            // For true maskable support: generate icon-maskable.png at https://maskable.app
            // then uncomment: { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ],
        },
        workbox: {
          // Cache all built assets
          globPatterns: ['**/*.{js,css,html,ico,png,svg,mp4,json,woff2,woff}'],
          // Runtime caching for Google Fonts so they work offline after first load
          runtimeCaching: [
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
