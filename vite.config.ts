import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true,
    allowedHosts: [
      'admin-flowershow.kushaldulani.xyz',
      'localhost',
      '.kushaldulani.xyz'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8010',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8010',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8010',
        changeOrigin: true,
      }
    }
  }
})
