import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/Vocabify/', // MUST be the exact GitHub Repo name with slashes for the Service Worker scope
    build: {
      outDir: 'dist',
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto', // Tells Vite to auto-inject the service worker into index.html
        includeAssets: ['icon.png', 'tutorial.mp4'],
        manifest: {
          name: 'Vocabify',
          short_name: 'Vocabify',
          description: 'A modern, offline-first vocabulary application specifically built for mastering English word derivatives.',
          theme_color: '#141218',
          background_color: '#141218',
          display: 'standalone',
          scope: '/Vocabify/',
          start_url: '/Vocabify/',
          icons: [
            { src: 'icon.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon.png', sizes: '512x512', type: 'image/png' }, // Standard icon required by Chrome
            { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' } // Maskable fallback
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,mp4,json}']
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});