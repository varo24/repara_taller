
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'ReparaPro Master Console',
        short_name: 'ReparaPro',
        description: 'Consola de Gestión Técnica Local para Talleres de Electrodomésticos.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3062/3062331.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: './', // CRITICAL: Permite que la app funcione en cualquier subcarpeta de GitHub Pages
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    host: true
  }
});
