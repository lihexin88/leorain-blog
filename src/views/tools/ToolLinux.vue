<template>
  <div class="linux-tool" :class="{ 'is-fullscreen': isFullscreen }">
    <el-card shadow="hover" class="linux-card">
      <template #header>
        <div class="card-header">
          <span>Linux 在线终端</span>
          <el-tooltip :content="isFullscreen ? '退出全屏 (Esc)' : '展开全屏'" placement="top">
            <el-button
                :icon="isFullscreen ? ScaleToOriginal : FullScreen"
                circle
                size="small"
                @click="toggleFullscreen"
            />
          </el-tooltip>
        </div>
      </template>

      <!-- 状态栏 -->
      <div class="status-section">
        <div class="status-bar">
          <div class="status-left">
            <span :class="['status-dot', statusClass]"></span>
            <span class="status-label">{{ statusText }}</span>
          </div>
          <div v-if="countdownMessage" class="countdown-message">
            {{ countdownMessage }}
          </div>
          <div class="status-right">
            <el-button
                v-if="status === 'disconnected'"
                type="primary"
                :icon="Connection"
                @click="connect"
            >连接
            </el-button>
            <el-button
                v-else
                type="danger"
                :icon="Close"
                @click="disconnect"
            >断开
            </el-button>
            <el-button :icon="Delete" @click="clearTerminal">清空</el-button>
          </div>
        </div>

        <el-alert
            v-if="queuePosition > 0"
            :title="`当前排队：第 ${queuePosition} 位，请稍候...`"
            type="warning"
            :closable="false"
            show-icon
            class="status-alert"
        />
        <el-alert
            v-if="warnMessage"
            :title="warnMessage"
            type="warning"
            :closable="false"
            show-icon
            class="status-alert"
        />
      </div>

      <!-- 终端快捷工具栏 —— 用于发送会被浏览器截获的组合键 -->
      <div v-if="status === 'connected'" class="shortcut-bar">
        <span class="shortcut-label">终端快捷键：</span>
        <el-button
            v-for="btn in shortcutButtons"
            :key="btn.label"
            size="small"
            @click="sendControlChar(btn.seq)"
        >{{ btn.label }}</el-button>
        <el-tooltip
            content="为防止浏览器截获组合键（如 Ctrl+W 关标签页），请点击按钮发送对应控制码"
            placement="top"
        >
          <el-icon class="shortcut-help"><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>

      <!-- 终端区域 -->
      <div class="terminal-section" :class="{ 'is-connecting': isConnecting }">
        <div ref="terminalEl" class="terminal-el"></div>
        <div v-if="isConnecting" class="connect-overlay" aria-hidden="true">
          <div class="connect-scanlines"></div>
          <div class="connect-grid"></div>
          <div class="connect-orbit">
            <span class="orbit-ring ring-a"></span>
            <span class="orbit-ring ring-b"></span>
            <span class="orbit-core"></span>
          </div>
          <div class="connect-matrix">
            <span v-for="n in 12" :key="n" class="matrix-col" :style="matrixColStyle(n)"></span>
          </div>
          <div class="connect-hud">
            <div class="hud-line">
              <span class="hud-dot"></span>
              {{ connectHudText }}
            </div>
            <div class="hud-bar">
              <span class="hud-bar-fill"></span>
            </div>
            <div class="hud-meta">CONTAINER · INIT · SECURE CHANNEL</div>
          </div>
        </div>
      </div>

      <!-- 使用说明：全屏时隐藏，把空间留给终端 -->
      <div v-show="!isFullscreen" class="info-section">
        <div class="info-title">使用说明</div>
        <ul class="info-list">
          <li>点击「连接」获取一个独立的 Linux（Ubuntu）容器</li>
          <li>最多支持 <strong>3</strong> 个并发会话，超出后自动排队等待</li>
          <li>会话有效期 <strong>10 分钟</strong>，到期前 5 分钟会收到提醒</li>
          <li>容器资源限制：1 CPU · 512 MB 内存 · 3 GB 存储</li>
          <li>断开连接后容器及其数据将被自动清除</li>
          <li>部分组合键（Ctrl+W / Ctrl+T / Ctrl+N / Ctrl+Q）会被浏览器截获，请使用终端上方的快捷键按钮</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script>
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { markRaw } from 'vue'
import { Connection, Close, Delete, QuestionFilled, FullScreen, ScaleToOriginal } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { USER_LOGOUT_SUCCESS_EVENT, USER_LOGIN_SUCCESS_EVENT } from '@/utils/auth-events'

export default {
  tdk: {
    title: 'Linux 在线终端',
    description: '在浏览器中运行真实的 Linux 容器，支持完整的终端交互',
    keywords: 'Linux, 在线终端, Ubuntu, Docker, Shell'
  },

  data () {
    return {
      Connection: markRaw(Connection),
      Close: markRaw(Close),
      Delete: markRaw(Delete),
      QuestionFilled: markRaw(QuestionFilled),
      FullScreen: markRaw(FullScreen),
      ScaleToOriginal: markRaw(ScaleToOriginal),
      ws: null,
      terminal: null,
      fitAddon: null,
      // disconnected | connecting | queued | connected
      status: 'disconnected',
      queuePosition: 0,
      warnMessage: '',
      countdownMessage: '',
      // 终端快捷键按钮（这些组合键被浏览器截获，无法通过键盘直接发送）
      shortcutButtons: [
        { label: 'Ctrl+W', seq: '\x17', desc: '删除前一个单词' },
        { label: 'Ctrl+U', seq: '\x15', desc: '删除光标前所有字符' },
        { label: 'Ctrl+K', seq: '\x0B', desc: '删除光标后所有字符' },
        { label: 'Ctrl+L', seq: '\x0C', desc: '清屏' },
        { label: 'Ctrl+D', seq: '\x04', desc: 'EOF / 退出' },
        { label: 'Ctrl+C', seq: '\x03', desc: 'SIGINT / 中断' }
      ],
      waitingLogin: false,
      isFullscreen: false
    }
  },

  computed: {
    statusClass () {
      return {
        disconnected: 'dot-gray',
        connecting: 'dot-yellow',
        queued: 'dot-yellow',
        connected: 'dot-green'
      }[this.status] || 'dot-gray'
    },
    statusText () {
      return {
        disconnected: '未连接',
        connecting: '连接中…',
        queued: '排队等待中…',
        connected: '已连接'
      }[this.status] || '未连接'
    },
    isConnecting () {
      return this.status === 'connecting' || this.status === 'queued'
    },
    connectHudText () {
      if (this.status === 'queued') {
        return this.queuePosition > 0
          ? `排队中 · 第 ${this.queuePosition} 位`
          : '排队等待中…'
      }
      return '正在建立安全通道…'
    },
    wsUrl () {
      const host = (import.meta.env.VITE_TOOL_HOST || 'http://localhost:8082')
        .replace('https://', 'wss://')
        .replace('http://', 'ws://')
      return host + '/container/run'
    }
  },

  mounted () {
    this._beforeUnload = this._beforeUnload.bind(this)
    this._onKeydown = this._onKeydown.bind(this)
    window.addEventListener('beforeunload', this._beforeUnload)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('keydown', this._onKeydown)
    window.addEventListener(USER_LOGOUT_SUCCESS_EVENT, () => {
      this.doDisconnect()
    })
    window.addEventListener(USER_LOGIN_SUCCESS_EVENT, () => {
      if (this.waitingLogin) {
        this.connect()
      }
      this.waitingLogin = false
    })
    this.initTerminal()
  },

  beforeUnmount () {
    window.removeEventListener('beforeunload', this._beforeUnload)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('keydown', this._onKeydown)
    this.exitFullscreen(true)
    this.doDisconnect()
    if (this.terminal) {
      if (this._imeHandler && this.terminal.textarea) {
        this.terminal.textarea.removeEventListener('compositionend', this._imeHandler)
      }
      // dispose fitAddon first to avoid "addon not loaded" error when terminal.dispose() iterates addons
      if (this.fitAddon) {
        try {
          this.fitAddon.dispose()
        } catch (e) { /* ignore */
        }
        this.fitAddon = null
      }
      try {
        this.terminal.dispose()
      } catch (e) { /* ignore */
      }
      this.terminal = null
    }
  },

  methods: {
    /* ── 终端初始化 ── */
    initTerminal () {
      this.terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        scrollback: 5000,
        theme: {
          background: '#1a1b1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          selectionBackground: '#264f78',
          black: '#1e1e1e',
          red: '#f44747',
          green: '#6a9955',
          yellow: '#d7ba7d',
          blue: '#569cd6',
          magenta: '#c586c0',
          cyan: '#4ec9b0',
          white: '#d4d4d4',
          brightBlack: '#808080',
          brightRed: '#f44747',
          brightGreen: '#b5cea8',
          brightYellow: '#dcdcaa',
          brightBlue: '#9cdcfe',
          brightMagenta: '#c586c0',
          brightCyan: '#4ec9b0',
          brightWhite: '#ffffff'
        }
      })
      this.fitAddon = new FitAddon()
      this.terminal.loadAddon(this.fitAddon)
      this.terminal.open(this.$refs.terminalEl)
      this.fitAddon.fit()

      this.terminal.writeln('\x1b[90m欢迎使用 Linux 在线终端，点击上方「连接」按钮开始。\x1b[0m')

      this.terminal.onData(data => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(data)
          return
        }
        // 未连接时按 Enter 触发连接；xterm 的 Enter 一般是 '\r'，少数环境可能是 '\n' 或 '\r\n'
        if (data === '\r' || data === '\n' || data === '\r\n') {
          this.connect()
        }
      })

      // xterm 不处理 IME 组合输入（中文/日文等），需手动监听 compositionend 补发
      this._imeHandler = (e) => {
        if (e.data && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(e.data)
        }
      }
      this.terminal.textarea.addEventListener('compositionend', this._imeHandler)
    },

    /**
     * 浏览器 beforeunload 事件：终端已连接时弹出确认，防止误关标签页
     */
    _beforeUnload (event) {
      if (this.status === 'connected') {
        event.preventDefault()
        // 兼容旧浏览器
        event.returnValue = '终端已连接，关闭标签页将断开连接并清除容器数据。确定要离开吗？'
        return event.returnValue
      }
    },

    /**
     * 通过 WebSocket 向终端发送控制字符
     */
    sendControlChar (seq) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(seq)
        this.terminal.focus()
      }
    },

    onResize () {
      if (this.fitAddon && this.terminal) this.fitAddon.fit()
    },

    matrixColStyle (n) {
      const delay = ((n * 0.37) % 2.4).toFixed(2)
      const duration = (1.8 + (n % 5) * 0.35).toFixed(2)
      const left = ((n - 1) * (100 / 12)).toFixed(2)
      return {
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }
    },

    _onKeydown (event) {
      if (event.key === 'Escape' && this.isFullscreen) {
        this.exitFullscreen()
      }
    },

    toggleFullscreen () {
      if (this.isFullscreen) {
        this.exitFullscreen()
      } else {
        this.enterFullscreen()
      }
    },

    enterFullscreen () {
      this.isFullscreen = true
      document.body.style.overflow = 'hidden'
      this.$nextTick(() => {
        this.onResize()
        if (this.terminal) this.terminal.focus()
      })
    },

    exitFullscreen (skipFit = false) {
      if (!this.isFullscreen) return
      this.isFullscreen = false
      document.body.style.overflow = ''
      if (!skipFit) {
        this.$nextTick(() => this.onResize())
      }
    },

    /* ── 连接 / 断开 ── */
    connect () {
      this.waitingLogin = true
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        this.$message.warning('请先登录后再使用 Linux 在线终端')
        userStore.setShowLoginDialog(true)
        return
      }

      if (this.ws) return
      this.status = 'connecting'
      this.queuePosition = 0
      this.warnMessage = ''

      const wsUrlWithToken = this.wsUrl + '?access_token=' + userStore.token
      this.ws = new WebSocket(wsUrlWithToken)

      this.ws.onmessage = (event) => {
        const data = event.data
        // 先尝试解析为控制消息
        if (typeof data === 'string' && data.trim().startsWith('{')) {
          try {
            const msg = JSON.parse(data.trim())
            if (msg.type) {
              this.handleControlMessage(msg)
              return
            }
          } catch (e) { /* fall through */
          }
        }
        // 普通终端输出
        this.terminal.write(data)
      }
      this.ws.onopen = () => {
        this.terminal.focus()
      }

      this.ws.onclose = (event) => {
        const wasConnected = this.status !== 'disconnected'
        this.status = 'disconnected'
        this.queuePosition = 0
        this.warnMessage = ''
        this.countdownMessage = ''
        this.ws = null
        if (wasConnected) {
          this.terminal.writeln('\r\n\x1b[31m[连接已断开]\x1b[0m')
        }
      }

      this.ws.onerror = () => {
        this.terminal.writeln('\r\n\x1b[31m[WebSocket 连接失败，请检查网络或稍后重试]\x1b[0m')
        this.status = 'disconnected'
        this.ws = null
      }
    },

    disconnect () {
      this.$confirm('断开连接后，容器及其所有数据将被清除，确定要断开吗？', '断开连接', {
        confirmButtonText: '确定断开',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.doDisconnect()
      }).catch(() => {
      })
    },

    doDisconnect () {
      if (this.ws) {
        this.ws.close()
        this.terminal.writeln('\x1b\r\n[32m[容器已断开]\x1b[0m\r\n')
        this.ws = null
      }
      this.status = 'disconnected'
      this.queuePosition = 0
      this.warnMessage = ''
      this.countdownMessage = ''
    },

    /* ── 控制消息处理 ── */
    handleControlMessage (msg) {
      switch (msg.type) {
        case 'connected':
          this.status = 'connected'
          this.queuePosition = 0
          this.terminal.writeln('\x1b\r\n[32m[容器已就绪，可以开始输入命令]\x1b[0m\r\n')
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send('\r')
          }
          break

        case 'queue':
          this.status = 'queued'
          this.queuePosition = msg.position || 0
          this.terminal.writeln(`\x1b[33m[排队中，当前位置：第 ${msg.position} 位]\x1b[0m`)
          break

        case 'countdown':
          this.countdownMessage = msg.message || `剩余时间：${msg.position} 秒`
          break

        case 'warn':
          this.warnMessage = msg.message || '会话即将超时'
          this.terminal.writeln(`\r\n\x1b[33m[警告] ${msg.message}\x1b[0m`)
          break

        case 'timeout':
          this.status = 'disconnected'
          this.queuePosition = 0
          this.ws = null
          this.terminal.writeln(`\r\n\x1b[31m[超时] ${msg.message || '会话已超时，连接关闭'}\x1b[0m`)
          break

        case 'error':
          this.status = 'disconnected'
          this.ws = null
          this.terminal.writeln(`\r\n\x1b[31m[错误] ${msg.message || '启动失败'}\x1b[0m`)
          break
      }
    },

    /* ── 清空终端 ── */
    clearTerminal () {
      if (this.terminal) this.terminal.clear()
    }
  }
}
</script>

<style scoped lang="scss">
.linux-tool {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-weight: 600;
    font-size: 1.05rem;
  }

  /* 状态栏 */
  .status-section {
    margin-bottom: 12px;
  }

  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .status-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-right {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .countdown-message {
    font-size: 14px;
    color: #959595;
  }

  .status-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;

    &.dot-gray {
      background: #909399;
    }

    &.dot-yellow {
      background: #e6a23c;
      animation: blink 1s infinite;
    }

    &.dot-green {
      background: #67c23a;
    }
  }

  .status-label {
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  .status-alert {
    margin-top: 12px;
  }

  /* 终端快捷键工具栏 */
  .shortcut-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: 6px;
    font-size: 13px;
    flex-wrap: wrap;

    .shortcut-label {
      color: var(--el-text-color-secondary);
      margin-right: 2px;
      white-space: nowrap;
    }

    .shortcut-help {
      margin-left: auto;
      color: var(--el-text-color-placeholder);
      cursor: help;
      font-size: 16px;
    }
  }

  /* 终端区域 */
  .terminal-section {
    position: relative;
    margin-bottom: 16px;
    border-radius: 8px;
    overflow: hidden;

    &.is-connecting .terminal-el {
      filter: brightness(0.55) saturate(1.2);
    }
  }

  .terminal-el {
    width: 100%;
    height: 520px;
    background: #1a1b1e;
    padding: 8px;
    box-sizing: border-box;
  }

  /* 连接中动态遮罩 */
  .connect-overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    pointer-events: none;
    overflow: hidden;
    background:
      radial-gradient(ellipse at center, rgba(10, 24, 40, 0.35) 0%, rgba(8, 12, 20, 0.78) 70%, rgba(5, 8, 14, 0.92) 100%);
  }

  .connect-scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent 2px,
      rgba(0, 255, 200, 0.03) 2px,
      rgba(0, 255, 200, 0.03) 4px
    );
    animation: scan-drift 6s linear infinite;
    mix-blend-mode: screen;
  }

  .connect-grid {
    position: absolute;
    inset: -20%;
    background-image:
      linear-gradient(rgba(64, 224, 208, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(64, 224, 208, 0.08) 1px, transparent 1px);
    background-size: 36px 36px;
    transform: perspective(500px) rotateX(55deg);
    transform-origin: center top;
    animation: grid-scroll 8s linear infinite;
    opacity: 0.55;
  }

  .connect-orbit {
    position: absolute;
    left: 50%;
    top: 42%;
    width: 120px;
    height: 120px;
    transform: translate(-50%, -50%);
  }

  .orbit-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1.5px solid transparent;

    &.ring-a {
      border-top-color: #40e0d0;
      border-right-color: rgba(64, 224, 208, 0.25);
      box-shadow: 0 0 18px rgba(64, 224, 208, 0.35);
      animation: orbit-spin 1.6s linear infinite;
    }

    &.ring-b {
      inset: 12px;
      border-bottom-color: #67c23a;
      border-left-color: rgba(103, 194, 58, 0.2);
      box-shadow: 0 0 14px rgba(103, 194, 58, 0.25);
      animation: orbit-spin 2.4s linear infinite reverse;
    }
  }

  .orbit-core {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 14px;
    height: 14px;
    margin: -7px 0 0 -7px;
    border-radius: 50%;
    background: radial-gradient(circle, #fff 0%, #40e0d0 45%, transparent 70%);
    box-shadow:
      0 0 12px #40e0d0,
      0 0 28px rgba(64, 224, 208, 0.6);
    animation: core-pulse 1.2s ease-in-out infinite;
  }

  .connect-matrix {
    position: absolute;
    inset: 0;
    overflow: hidden;
    opacity: 0.55;
  }

  .matrix-col {
    position: absolute;
    top: -120%;
    width: 8.33%;
    height: 120%;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11px;
    line-height: 1.15;
    color: #3dffc0;
    text-shadow: 0 0 6px rgba(61, 255, 192, 0.75);
    white-space: pre;
    animation-name: matrix-fall;
    animation-timing-function: linear;
    animation-iteration-count: infinite;

    &::before {
      content: '01A7F3C9E2B48D0156F9A3C7E0B2D48F\A 9E1C7A4F0B3D682E5C1A9F7B0D3E684C\A 2F8A1C5E9B0D473F6A2C8E1B5D907F3A\A 4C7E0B3D9F1A5C8E2B6D0F4A7C1E5B9\A 6D0F3A8C1E5B9D2F6A0C4E8B1D5F9A3\A 8B1D5F9A3C7E0B4D8F2A6C0E4B8D1F5';
    }
  }

  .connect-hud {
    position: absolute;
    left: 50%;
    top: 62%;
    transform: translateX(-50%);
    width: min(320px, 80%);
    text-align: center;
    color: #9ef5df;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }

  .hud-line {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    letter-spacing: 0.04em;
    text-shadow: 0 0 10px rgba(64, 224, 208, 0.55);
  }

  .hud-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #40e0d0;
    box-shadow: 0 0 8px #40e0d0;
    animation: blink 0.9s ease-in-out infinite;
  }

  .hud-bar {
    margin: 12px auto 8px;
    width: 100%;
    height: 3px;
    border-radius: 999px;
    background: rgba(64, 224, 208, 0.15);
    overflow: hidden;
  }

  .hud-bar-fill {
    display: block;
    width: 40%;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, transparent, #40e0d0, #67c23a, transparent);
    animation: hud-sweep 1.4s ease-in-out infinite;
  }

  .hud-meta {
    font-size: 10px;
    letter-spacing: 0.18em;
    color: rgba(158, 245, 223, 0.55);
  }

  /* 使用说明 */
  .info-section {
    padding-top: 4px;

    .info-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 8px;
    }

    .info-list {
      margin: 0;
      padding-left: 20px;
      line-height: 1.9;
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  /* 展开全屏：覆盖视口，终端区域自适应占满剩余高度 */
  &.is-fullscreen {
    position: fixed;
    inset: 0;
    z-index: 3000;
    max-width: none;
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 12px;
    background: var(--el-bg-color-page, #f5f7fa);
    box-sizing: border-box;

    .linux-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      border-radius: 8px;
    }

    :deep(.el-card__body) {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 12px 16px 16px;
      box-sizing: border-box;
    }

    .status-section,
    .shortcut-bar {
      flex-shrink: 0;
    }

    .terminal-section {
      flex: 1;
      min-height: 0;
      margin-bottom: 0;
      display: flex;
    }

    .terminal-el {
      flex: 1;
      height: auto !important;
      min-height: 0;
    }
  }
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

@keyframes orbit-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes core-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.35);
    opacity: 0.7;
  }
}

@keyframes matrix-fall {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  10% {
    opacity: 0.85;
  }
  90% {
    opacity: 0.85;
  }
  100% {
    transform: translateY(180%);
    opacity: 0;
  }
}

@keyframes hud-sweep {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(280%);
  }
}

@keyframes grid-scroll {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 0 72px;
  }
}

@keyframes scan-drift {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(8px);
  }
}
</style>
