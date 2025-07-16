import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { frontendCompressPlugin } from '@yuanjing/tinypng-plugin' // 修正包名
import { resolve } from 'path'
import type { PluginOption } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    frontendCompressPlugin({
      proxyUrl: process.env.VITE_TINYPNG_PROXY_URL || 'http://localhost:3001/api/tinypng/compress',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      enableCache: true
    }) as PluginOption
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
