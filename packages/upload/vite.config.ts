import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { uploadCompressPlugin } from '@yuanjing/tinypng-plugin'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    // 添加上传压缩插件
    uploadCompressPlugin({
      apiKey: process.env.VITE_TINYPNG_API_KEY,
      uploadPaths: ['/api/upload', '/upload'], // 拦截的上传路径
      concurrency: 2,
      enableCache: true,
      quality: 0.8,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      fallbackToLocal: true
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
