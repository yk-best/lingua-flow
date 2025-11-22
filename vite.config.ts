import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // 1. Base path for the website assets (JS/CSS)
  base: '/lingua-flow/', 
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      // 2. Base path for the PWA Service Worker and Scope
      scope: '/lingua-flow/',
      base: '/lingua-flow/',
      manifest: {
        name: 'LinguaFlow',
        short_name: 'LinguaFlow',
        description: 'English Vocabulary Learning for Chinese Speakers',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        // 3. Start URL must point to the subfolder
        start_url: '/lingua-flow/',
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
      }
    })
  ],
})