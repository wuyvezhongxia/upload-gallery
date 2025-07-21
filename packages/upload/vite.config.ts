import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { frontendCompressPlugin } from '@yuanjing/tinypng-plugin' // 修正包名
import { resolve } from 'path'
import type { PluginOption } from 'vite'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd());
  
  return {
    plugins: [
      react(),
      frontendCompressPlugin({
        proxyUrl: env.VITE_TINYPNG_PROXY_URL, // 使用完整的压缩API URL
        maxFileSize: 10 * 1024 * 1024, // 10MB
        enableCache: true
      }) as PluginOption
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server:{
      proxy:{
        '/api':{
          target: env.VITE_API_BASE_URL, // 使用基础URL环境变量
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
