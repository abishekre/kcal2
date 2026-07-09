import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// frame-ancestors (clickjacking protection) can't be expressed via the
// <meta> CSP tag in index.html — browsers only honor it as an HTTP header.
// This covers local dev/preview; production hosting must set the same
// header at the server/CDN layer.
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "frame-ancestors 'none'",
};

// https://vitejs.dev/config/
export default defineConfig({
  server: { headers: securityHeaders },
  preview: { headers: securityHeaders },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Kcal',
        short_name: 'Kcal',
        description: 'Track calories, macros, water, weight, and fasting with a fast, science-backed daily log.',
        // Matches the app's actual light-mode background (#F0F1EE) instead
        // of pure black, so the install/splash screen doesn't flash dark
        // before the real UI paints.
        theme_color: '#F0F1EE',
        background_color: '#F0F1EE',
        display: 'standalone',
        icons: [
          {
            src: '/icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
  }
})