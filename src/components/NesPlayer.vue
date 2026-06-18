<template>
  <div class="nes-player" :style="{ width: width + 'px', height: height + 'px' }">
    <canvas ref="canvas" class="nes-canvas" />
    <button v-if="showOverlay" class="nes-overlay" @click="handleStart">
      <span class="nes-label">{{ isLoading ? 'Loading...' : label }}</span>
    </button>
  </div>
</template>

<script>
import { NES, Controller } from 'jsnes'

const AUDIO_BUF_LEN = 16384
const SCRIPT_BUF_SIZE = 2048
const AUDIO_MIN_SAMPLES = SCRIPT_BUF_SIZE * 2
const FRAME_MS = 1000 / 60.098 // NES 原生帧率

const KEY_MAP = {
  1: [1, Controller.BUTTON_START],
  2: [1, Controller.BUTTON_SELECT],
  w: [1, Controller.BUTTON_UP],
  W: [1, Controller.BUTTON_UP],
  a: [1, Controller.BUTTON_LEFT],
  A: [1, Controller.BUTTON_LEFT],
  s: [1, Controller.BUTTON_DOWN],
  S: [1, Controller.BUTTON_DOWN],
  d: [1, Controller.BUTTON_RIGHT],
  D: [1, Controller.BUTTON_RIGHT],
  k: [1, Controller.BUTTON_A],
  K: [1, Controller.BUTTON_A],
  j: [1, Controller.BUTTON_B],
  J: [1, Controller.BUTTON_B],
  ArrowUp: [1, Controller.BUTTON_UP],
  ArrowDown: [1, Controller.BUTTON_DOWN],
  ArrowLeft: [1, Controller.BUTTON_LEFT],
  ArrowRight: [1, Controller.BUTTON_RIGHT]
}

export default {
  name: 'NesPlayer',
  props: {
    url: { type: String, required: true },
    width: { type: Number, default: 512 },
    height: { type: Number, default: 480 },
    label: { type: String, default: 'Click to Start' }
  },
  emits: ['fps', 'error', 'success', 'saved', 'loaded'],

  data () {
    return {
      isLoading: false,
      isStarted: false
    }
  },

  computed: {
    showOverlay () {
      return !this.isStarted || this.isLoading
    }
  },

  watch: {
    url (newUrl, oldUrl) {
      if (newUrl && newUrl !== oldUrl) this.loadRom(newUrl)
    },
    width () { this._resizeCanvas() },
    height () { this._resizeCanvas() }
  },

  mounted () {
    this._initCanvas()
    if (this.url) this.loadRom(this.url)
  },

  beforeUnmount () {
    this._destroy()
  },

  methods: {
    // ─── Canvas ──────────────────────────────────────────────────────────────

    _initCanvas () {
      const cv = this.$refs.canvas
      cv.width = 256
      cv.height = 240
      this._resizeCanvas()
      this._ctx = cv.getContext('2d')
      this._imageData = this._ctx.createImageData(256, 240)
    },

    _resizeCanvas () {
      const cv = this.$refs.canvas
      if (!cv) return
      cv.style.width = this.width + 'px'
      cv.style.height = this.height + 'px'
    },

    _drawFrame (buf) {
      const data = this._imageData.data
      for (let i = 0; i < 256 * 240; i++) {
        const px = buf[i]
        data[i * 4] = px & 0xFF // R（低位）
        data[i * 4 + 1] = (px >> 8) & 0xFF // G
        data[i * 4 + 2] = (px >> 16) & 0xFF // B（高位）
        data[i * 4 + 3] = 0xFF
      }
      this._ctx.putImageData(this._imageData, 0, 0)
    },

    // ─── ROM 加载 ─────────────────────────────────────────────────────────────

    async loadRom (url) {
      this.isStarted = false
      this.isLoading = true
      this._stopEmulator() // 停当前游戏，但保留 canvas

      // 防止多次并发加载时旧请求覆盖新结果
      const version = (this._loadVersion = (this._loadVersion || 0) + 1)

      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const bytes = new Uint8Array(await res.arrayBuffer())

        if (version !== this._loadVersion) return // 已被更新请求取代

        // jsnes 需要二进制字符串格式的 ROM
        let romStr = ''
        for (let i = 0; i < bytes.length; i++) {
          romStr += String.fromCharCode(bytes[i])
        }

        this._initNes()
        this._nes.loadROM(romStr)
        this.isLoading = false
        this.$emit('success')
      } catch (err) {
        if (version !== this._loadVersion) return
        this.isLoading = false
        console.error('NES ROM load failed:', err)
        this.$emit('error', err.message)
      }
    },

    // ─── NES 实例初始化 ───────────────────────────────────────────────────────

    _initNes () {
      this._audioL = new Float32Array(AUDIO_BUF_LEN)
      this._audioR = new Float32Array(AUDIO_BUF_LEN)
      this._audioWritePos = 0
      this._audioReadPos = 0
      this._audioReady = false

      this._nes = new NES({
        onFrame: (buf) => this._drawFrame(buf),
        onAudioSample: (l, r) => {
          if (this._audioWritePos - this._audioReadPos >= AUDIO_BUF_LEN) {
            this._audioReadPos = this._audioWritePos - AUDIO_BUF_LEN + 1
          }
          const pos = this._audioWritePos % AUDIO_BUF_LEN
          this._audioL[pos] = l
          this._audioR[pos] = r
          this._audioWritePos++
          if (!this._audioReady && this._audioWritePos - this._audioReadPos >= AUDIO_MIN_SAMPLES) {
            this._audioReady = true
          }
        }
      })

      // Web Audio —— 在用户点击时才 resume（浏览器自动播放策略）
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' })
      const sp = this._audioCtx.createScriptProcessor(SCRIPT_BUF_SIZE, 0, 2)
      sp.onaudioprocess = (e) => {
        const l = e.outputBuffer.getChannelData(0)
        const r = e.outputBuffer.getChannelData(1)
        const available = this._audioWritePos - this._audioReadPos

        if (!this._audioReady || available < SCRIPT_BUF_SIZE) {
          l.fill(0)
          r.fill(0)
          return
        }

        for (let i = 0; i < SCRIPT_BUF_SIZE; i++) {
          const rp = this._audioReadPos % AUDIO_BUF_LEN
          l[i] = this._audioL[rp]
          r[i] = this._audioR[rp]
          this._audioReadPos++
        }
      }
      sp.connect(this._audioCtx.destination)
      this._scriptProcessor = sp
    },

    // ─── 游戏循环 ─────────────────────────────────────────────────────────────

    handleStart () {
      if (this.isLoading || !this._nes) return
      if (this._audioCtx?.state === 'suspended') this._audioCtx.resume()
      this.isStarted = true
      this._startLoop()
      this._addKeyListeners()
    },

    _startLoop () {
      if (this._running) return
      this._running = true
      this._lastFrameTime = performance.now()
      this._fpsFrameCount = 0
      this._fpsMeasureTime = performance.now()

      const loop = (now) => {
        if (!this._running) return
        this._rafId = requestAnimationFrame(loop)
        const elapsed = now - this._lastFrameTime
        if (elapsed >= FRAME_MS) {
          this._lastFrameTime = now - (elapsed % FRAME_MS)
          this._nes.frame()
          this._fpsFrameCount++
          const d = now - this._fpsMeasureTime
          if (d >= 1000) {
            this.$emit('fps', this._fpsFrameCount / (d / 1000))
            this._fpsFrameCount = 0
            this._fpsMeasureTime = now
          }
        }
      }
      this._rafId = requestAnimationFrame(loop)
    },

    _addKeyListeners () {
      if (this._keysAdded) return
      this._keysAdded = true
      this._onKeyDown = (e) => {
        const m = KEY_MAP[e.key]
        if (m) { e.preventDefault(); this._nes.buttonDown(m[0], m[1]) }
      }
      this._onKeyUp = (e) => {
        const m = KEY_MAP[e.key]
        if (m) this._nes.buttonUp(m[0], m[1])
      }
      window.addEventListener('keydown', this._onKeyDown)
      window.addEventListener('keyup', this._onKeyUp)
    },

    // ─── 公开 API（供父组件通过 ref 调用）────────────────────────────────────

    reset () {
      if (this._nes) this._nes.reset()
    },

    stop () {
      this._stopEmulator()
      this.isStarted = false
    },

    save (id) {
      if (!this._nes) return
      try {
        localStorage.setItem('nes_state_' + id, JSON.stringify(this._nes.toJSON()))
        this.$emit('saved', { id })
      } catch (e) {
        console.error('Save state failed:', e)
      }
    },

    load (id) {
      if (!this._nes) return
      try {
        const raw = localStorage.getItem('nes_state_' + id)
        if (raw) {
          this._nes.fromJSON(JSON.parse(raw))
          this.$emit('loaded', { id })
        }
      } catch (e) {
        console.error('Load state failed:', e)
      }
    },

    // ─── 内部清理 ─────────────────────────────────────────────────────────────

    _stopEmulator () {
      this._running = false
      cancelAnimationFrame(this._rafId)
      if (this._scriptProcessor) {
        this._scriptProcessor.disconnect()
        this._scriptProcessor = null
      }
      if (this._audioCtx) {
        this._audioCtx.close().catch(() => {})
        this._audioCtx = null
      }
    },

    _destroy () {
      this._stopEmulator()
      if (this._onKeyDown) {
        window.removeEventListener('keydown', this._onKeyDown)
        window.removeEventListener('keyup', this._onKeyUp)
        this._keysAdded = false
      }
      this._nes = null
    }
  }
}
</script>

<style scoped>
.nes-player {
  position: relative;
  background: #000;
  line-height: 0;
  overflow: hidden;
}

.nes-canvas {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.nes-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  cursor: pointer;
  border: none;
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  font: inherit;
  color: inherit;
}

.nes-label {
  color: #fff;
  font-size: 1.2rem;
  font-family: monospace;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
}
</style>
