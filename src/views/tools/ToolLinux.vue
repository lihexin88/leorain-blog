<template>
  <div class="linux-tool">
    <h1 class="main-title">Linux 在线终端</h1>

    <!-- 状态栏 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover" class="status-card">
          <div class="status-bar">
            <div class="status-left">
              <span :class="['status-dot', statusClass]"></span>
              <span class="status-label">{{ statusText }}</span>
            </div>
            <div v-if="countdownMessage">
              <span style="font-size: 14px; color: #959595;">
              {{ countdownMessage }}
              </span>
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
        </el-card>
      </el-col>
    </el-row>

    <!-- 终端区域 -->
    <el-row :gutter="20" class="terminal-row">
      <el-col :span="24">
        <el-card shadow="hover" class="terminal-card" body-style="padding: 0;">
          <div ref="terminalEl" class="terminal-el"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 使用说明 -->
    <el-row :gutter="20" class="info-row">
      <el-col :span="24">
        <el-card shadow="never" class="info-card">
          <template #header>
            <span>使用说明</span>
          </template>
          <ul class="info-list">
            <li>点击「连接」获取一个独立的 Linux（Ubuntu）容器</li>
            <li>最多支持 <strong>3</strong> 个并发会话，超出后自动排队等待</li>
            <li>会话有效期 <strong>10 分钟</strong>，到期前 5 分钟会收到提醒</li>
            <li>容器资源限制：1 CPU · 512 MB 内存 · 3 GB 存储</li>
            <li>断开连接后容器及其数据将被自动清除</li>
          </ul>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { markRaw } from 'vue'
import { Connection, Close, Delete } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { USER_LOGOUT_SUCCESS_EVENT } from '@/utils/auth-events'

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
      ws: null,
      terminal: null,
      fitAddon: null,
      // disconnected | connecting | queued | connected
      status: 'disconnected',
      queuePosition: 0,
      warnMessage: '',
      countdownMessage: ''
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
    wsUrl () {
      const host = (process.env.DRAW_WS_HOST || 'http://localhost:8082')
        .replace('https://', 'wss://')
        .replace('http://', 'ws://')
      return host + '/container/run'
    }
  },

  mounted () {
    window.addEventListener('resize', this.onResize)
    window.addEventListener(USER_LOGOUT_SUCCESS_EVENT, () => {
      this.doDisconnect()
    })
    this.initTerminal()
  },

  beforeUnmount () {
    window.removeEventListener('resize', this.onResize)
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

    onResize () {
      if (this.fitAddon && this.terminal) this.fitAddon.fit()
    },

    /* ── 连接 / 断开 ── */
    connect () {
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
  margin: 20px auto;
  padding: 0 20px;
  max-width: 1400px;

  .main-title {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--el-text-color-primary);
  }

  /* 状态栏 */
  .status-card {
    margin-bottom: 16px;
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

  /* 终端区域 */
  .terminal-row {
    margin-bottom: 16px;
  }

  .terminal-card {
    border-radius: 8px;
    overflow: hidden;
  }

  .terminal-el {
    width: 100%;
    height: 520px;
    background: #1a1b1e;
    padding: 8px;
    box-sizing: border-box;
  }

  /* 使用说明 */
  .info-row {
    margin-bottom: 16px;
  }

  .info-card {
    .info-list {
      margin: 0;
      padding-left: 20px;
      line-height: 2;
      font-size: 14px;
      color: var(--el-text-color-regular);
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
</style>
