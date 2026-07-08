import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { CodeInspectorPlugin } from 'code-inspector-plugin'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      CodeInspectorPlugin({
        bundler: 'vite', // 默认 vite
        editor: 'webstorm' // 使用 VS Code 作为编辑器
      })
    ],
    define: {
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
          target: env.VITE_API_HOST || 'http://localhost:8000',
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
  }
})
