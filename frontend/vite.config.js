import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 2004,
    proxy: {
      '/api': 'http://localhost:2003',
      '/auth': 'http://localhost:2003'
    }
  }
})
