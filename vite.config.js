import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { CodeInspectorPlugin } from 'code-inspector-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    CodeInspectorPlugin({
      bundler: 'vite', // 默认 vite
      editor: 'webstorm' // 使用 VS Code 作为编辑器
    }),
  ],
  define: {
    'process.env': {}
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
        target: 'http://blog.leorain.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
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
