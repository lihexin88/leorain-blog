<script>
import { useLayoutsStore } from '@/store/layouts'

export default {
  name: 'ToolShot',
  data () {
    return {
      loading: true,
      error: ''
    }
  },
  async mounted () {
    const layoutsStore = await useLayoutsStore()
    layoutsStore.showFooter = false
    this.installAudioContextResumeShim()
    this.startGame()
  },
  beforeUnmount () {
    this.teardownAudioContextResumeShim()
    if (this._loadTimer) {
      clearTimeout(this._loadTimer)
      this._loadTimer = null
    }
    window.__shootingOnInit = null
  },
  methods: {
    // 浏览器在用户交互前会挂起 Web Audio，Bevy/rodio 启动时创建的 AudioContext 会停在
    // "suspended" 状态导致没声音。这里用 Proxy 拦截 AudioContext 的创建，并在第一次
    // click / keydown / touch 时调用 resume()，之后音频恢复正常。
    installAudioContextResumeShim () {
      this._audioContextList = []
      this._userInputEventNames = [
        'click',
        'contextmenu',
        'auxclick',
        'dblclick',
        'mousedown',
        'mouseup',
        'pointerup',
        'touchend',
        'keydown',
        'keyup'
      ]

      const list = this._audioContextList
      this._audioContextProxy = new Proxy(self.AudioContext, {
        construct (target, args) {
          const result = new target(...args)
          list.push(result)
          return result
        }
      })
      self.AudioContext = this._audioContextProxy

      this._resumeAllContexts = () => {
        let count = 0
        list.forEach(context => {
          if (context.state !== 'running') {
            context.resume()
          } else {
            count++
          }
        })
        // 所有被跟踪的 context 都进入 running 后，解除监听。
        if (count > 0 && count === list.length) {
          this.teardownAudioContextResumeShim()
        }
      }

      this._userInputEventNames.forEach(eventName => {
        document.addEventListener(eventName, this._resumeAllContexts)
      })
    },
    teardownAudioContextResumeShim () {
      if (this._userInputEventNames && this._resumeAllContexts) {
        this._userInputEventNames.forEach(eventName => {
          document.removeEventListener(eventName, this._resumeAllContexts)
        })
      }
      this._resumeAllContexts = null
    },
    // 加载 public/shooting/ 下的 wasm 胶水。shooting.js 会自动在它自己的目录里
    // 找 shooting_bg.wasm（new URL('shooting_bg.wasm', import.meta.url)），所以无需传路径。
    startGame () {
      // 不能直接用 `import('/shooting/shooting.js')` 加载 public/ 里的 JS：
      //   * 静态字符串会被 Vite 拒绝——"Cannot import non-asset file ... inside /public"；
      //   * 换成变量 + `@vite-ignore`，Vite 仍会把它改写为
      //     `__vite__injectQuery(modUrl, 'import')`，给 URL 追加 `?import`，而 dev server
      //     对 `/shooting/shooting.js?import` 返回 500。
      // 所以这里用内联 `<script type="module">` 做一次**原生** ES import：它不在 Vite 的
      // 模块图里，浏览器会直接请求 `/shooting/shooting.js`（public/ 原样命中），其
      // `import.meta.url` 也因此正确解析出 wasm 地址。dev/prod 行为一致。
      //
      // 注意：内联 `<script type="module">`（无 src）不会触发 `load`/`error` 事件，
      // 所以不能靠 `onload` 交还 init；这里让内联模块执行后主动调用全局回调
      // `window.__shootingOnInit(init)` 来交还，再配一个超时兜底以防模块加载失败时卡住。
      const modUrl = '/shooting/shooting.js'

      const run = init => {
        if (this._loadTimer) {
          clearTimeout(this._loadTimer)
          this._loadTimer = null
        }
        init()
          .then(() => {
            this.loading = false
          })
          .catch(err => {
            const msg = String(err && err.message ? err.message : err)
            // winit 的 Web 事件循环用异常做控制流，说明游戏其实已经成功启动。
            if (/control flow|isn't actually an error/i.test(msg)) {
              console.log('[shooting] started (winit event loop running)')
              this.loading = false
              return
            }
            this.loading = false
            this.error = msg
            console.error('[shooting] failed to start:', err)
          })
      }

      window.__shootingOnInit = run

      const script = document.createElement('script')
      script.type = 'module'
      script.textContent = 'import init from ' + JSON.stringify(modUrl) + ';\n' + 'window.__shootingOnInit(init);\n'
      document.head.appendChild(script)

      // 兜底：如果模块 import 失败（网络/404），上面的回调不会被调用，这里超时后报错。
      this._loadTimer = setTimeout(() => {
        this.loading = false
        this.error = '游戏模块加载失败（超时）'
        console.error('[shooting] module load timed out')
      }, 15000)
    }
  }
}
</script>

<template>
  <div class="shot-container">
    <canvas id="shooting-canvas"></canvas>
    <div v-if="loading" class="shot-overlay">游戏加载中…</div>
    <div v-else-if="error" class="shot-overlay">
      <p>游戏启动失败。</p>
      <p class="shot-error">{{ error }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.shot-container {
  // fit_canvas_to_parent 会按父元素尺寸撑满 canvas，父元素必须给显式尺寸
  //（不能由子元素撑开，否则会形成“越拉越大”的反馈循环）。
  width: 100%;
  height: calc(100vh - 65px);
  position: relative;
  overflow: hidden;
  background: #0b0d12;
  touch-action: none;
  user-select: none;
}

#shooting-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.shot-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #fff;
  font-size: 1rem;
  pointer-events: none;

  p {
    margin: 0;
  }

  .shot-error {
    font-family: monospace;
    font-size: 0.85rem;
    color: #ff6b6b;
  }
}
</style>
