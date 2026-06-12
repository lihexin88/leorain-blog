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
      '@': resolve(__dirname, 'src'),
      'codemirror/addon/edit/continuelist.js': resolve(__dirname, 'node_modules/codemirror/addon/edit/continuelist.js'),
      'codemirror/addon/display/fullscreen.js': resolve(__dirname, 'node_modules/codemirror/addon/display/fullscreen.js'),
      'codemirror/mode/markdown/markdown.js': resolve(__dirname, 'node_modules/codemirror/mode/markdown/markdown.js'),
      'codemirror/addon/mode/overlay.js': resolve(__dirname, 'node_modules/codemirror/addon/mode/overlay.js'),
      'codemirror/addon/display/placeholder.js': resolve(__dirname, 'node_modules/codemirror/addon/display/placeholder.js'),
      'codemirror/addon/selection/mark-selection.js': resolve(
        __dirname,
        'node_modules/codemirror/addon/selection/mark-selection.js'
      ),
      'codemirror/mode/gfm/gfm.js': resolve(__dirname, 'node_modules/codemirror/mode/gfm/gfm.js'),
      'codemirror/mode/xml/xml.js': resolve(__dirname, 'node_modules/codemirror/mode/xml/xml.js')
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
    host: '0.0.0.0',
    open: true
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    sourcemap: false
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler', // 使用现代 Sass API
        additionalData: '@use "@/assets/styles/_mixins.scss" as *;\n'
      }
    }
  }
})
