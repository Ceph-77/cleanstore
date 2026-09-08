import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: "KLEAN'STOR",
        short_name: "KLEAN'STOR",
        description: 'Gestion du nettoyage de magasins — magasins, tâches, paiements.',
        lang: 'fr-CA',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#2d5871',
        theme_color: '#2d5871',
        categories: ['business', 'productivity'],
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // API lives on another origin, so it's never precached or intercepted here.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Keep the big, rarely-changing vendors in their own long-cache chunks.
        // Leaflet and Stripe are deliberately left out: route-level lazy loading
        // now pulls them only into the map / wallet chunks that actually use them.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@sentry")) return "sentry";
          if (id.includes("@tanstack")) return "query";
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/.test(id)) {
            return "react";
          }
        },
      },
    },
  },
})
