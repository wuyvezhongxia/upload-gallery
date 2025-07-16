import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { frontendCompressPlugin } from '@yuanjing/tinypng-plugin'
import { resolve } from 'path'
import type { PluginOption } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    frontendCompressPlugin({
      apiKey: process.env.VITE_TINYPNG_API_KEY || '',
      enableTinyPng: true,
      enableLocalCompress: true,
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      maxFileSize: 10 * 1024 * 1024,
      concurrency: 2,
      enableCache: true,
      autoInject: true
    }) as PluginOption
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
