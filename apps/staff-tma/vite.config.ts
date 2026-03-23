// apps/client-tma/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      // Intercept all requests starting with /api and forward them to the Go backend
      '/api': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      }
    }
  },
})