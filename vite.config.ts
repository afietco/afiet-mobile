import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Font dosyaları da offline çalışsın
        globPatterns: ['**/*.{js,css,html,woff2}'],
      },
      manifest: {
        name: 'Aile Sağlık',
        short_name: 'AileSağlık',
        description: 'Ailece sağlıklı beslenme ve aktivite takibi',
        lang: 'tr',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        theme_color: '#059669',
        background_color: '#f8fafc',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
