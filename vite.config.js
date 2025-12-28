import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { CodeInspectorPlugin } from 'code-inspector-plugin'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

// 加载 .js.env 文件
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: resolve(__dirname, '.js.env') })

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    CodeInspectorPlugin({
      bundler: 'vite', // 默认 vite
      editor: 'webstorm' // 使用 VS Code 作为编辑器
    })
  ],
  define: {
    'process.env': process.env,
    global: 'window'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.API_HOST,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    },
    open: true
  },
  base: process.env.NODE_ENV === 'production' ? '/static/' : '/',
  build: {
    outDir: '../public/frontend',
    assetsDir: 'static',
    sourcemap: false
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler' // 使用现代 Sass API
      }
    }
  }
})
