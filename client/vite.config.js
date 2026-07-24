import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'vendor-leaflet';
            }
            if (id.includes('@clerk')) {
              return 'vendor-clerk';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor-others';
          }
        },
      },
    },
  },
})
