<template>
  <div>
    <div class="settings-bar">
      <div
        class="site-info-lines"
        @click="handleSettingsClick"
        @touchend.prevent="handleSettingsTouch"
        :class="{ 'stats-flash': isStatsFlashing }"
      >
        <div class="mini-progress">online: {{ formatNumber(stats.online) }}</div>
        <div class="mini-progress">
          <span>cpu:</span>
          <el-progress :percentage="parseFloat(formatNumber(stats.cpu_num ? (stats.load_average / stats.cpu_num * 100) : 0),2)" :stroke-width="3" :text-inside="false" :show-text="false"></el-progress>
        </div>
        <div class="mini-progress">
          <span>mem:</span>
          <el-progress :percentage="parseFloat(formatNumber(stats.memory_usage))" :stroke-width="3" :text-inside="false" :show-text="false"></el-progress>
        </div>
      </div>
    </div>
    <el-drawer v-model="show_settings_draw" class="site-info-drawer" direction="rtl" :with-header="false" :size="360" :lock-scroll="false">
      <div class="settings-container">
        <div>
          <el-divider>
            站点信息
          </el-divider>
        </div>
        <div>
          <span>同步访客</span>
          <el-switch v-model="show_visitor"></el-switch>
          <span>访客列表</span>
          <el-switch v-model="show_request_log"></el-switch>
          <el-divider></el-divider>
        </div>
        <div v-if="show_request_log">
          <request-logs></request-logs>
          <el-divider></el-divider>
        </div>
        <div>
          <div>
            系统负载:
            <el-progress :text-inside="true" :stroke-width="26"
                         :percentage="stats.load_average / stats.cpu_num * 100" :format="formatProgress"></el-progress>
          </div>
          <div>
            内存用量:
            <el-progress :text-inside="true" :stroke-width="26" :percentage="stats.memory_usage" :format="formatProgress"></el-progress>
          </div>
          <div>
            磁盘用量:
            <el-progress :text-inside="true" :stroke-width="26" :percentage="stats.disk_usage" :format="formatProgress"></el-progress>
          </div>
          <div>
            交换分区:
            <el-progress :text-inside="true" :stroke-width="26" :percentage="stats.swap_usage" :format="formatProgress"></el-progress>
          </div>
          <div>
            启动时间: {{ getHumanReadableDate(stats.uptime * 1000) }} s
          </div>
          <div>
            在线人数: {{ formatNumber(stats.online) }}
          </div>
          <div>
            实时qps: {{ formatNumber(stats.qps) }}
          </div>
          <div>
            最大qps: {{ formatNumber(stats.max_qps) }}
          </div>
          <div>
            启动后访客: {{ formatNumber(stats.count) }}
          </div>
          <div>
            今日访客: {{ formatNumber(stats.today_count) }}
          </div>
        </div>
        <div>
          <el-divider> 主题颜色 </el-divider>
          <div class="theme-picker">
            <div v-for="theme in themes" :key="theme.id" class="theme-item">
              <div
                class="theme-swatch"
                :class="{ selected: currentTheme === theme.id, 'system-theme-swatch': theme.id === 'system' }"
                :style="getThemeSwatchStyle(theme)"
                :title="theme.label"
                @click="handleThemeClick(theme.id, $event)"
              ></div>
              <div>{{ theme.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import moment from 'moment'
import { getHumanReadableDate } from '@/utils/helpers'
import RequestLogs from '@/components/RequestLogs.vue'
import { useConfigStore } from '@/store/config'

export default {
  props: {
    duration: {
      type: Number,
      default: 500
    }
  },
  components: { RequestLogs },
  data () {
    return {
      show_request_log: false,
      show_settings_draw: false,
      tool_access_token: null,
      show_visitor: true,
      messages: [],
      button_type: 'info',
      isStatsFlashing: false,
      statsFlashTimer: null,
      lastSettingsTouchAt: 0,
      connection_retried: 0,
      stats: {
        load_average: 0,
        disk_usage: 0,
        memory_usage: 0,
        swap_usage: 0,
        uptime: 0,
        qps: 0,
        max_qps: 0,
        count: 0,
        cpu_num: 1,
        today_count: 0,
        online: 0
      },
      // theme state
      currentTheme: 'white',
      themes: [
        { id: 'system', label: '系统' },
        { id: 'pink', label: '粉色' },
        { id: 'purple', label: '紫色' },
        { id: 'white', label: '白色' },
        { id: 'orange', label: '桔色' },
        { id: 'blue', label: '蓝色' },
        { id: 'green', label: '绿色' },
        { id: 'red', label: '红色' },
        { id: 'cyan', label: '青色' },
        { id: 'dark', label: '暗黑' }
      ],
      themeColors: {
        pink: '#f472b6',
        purple: '#7c3aed',
        white: '#ffffff',
        orange: '#f59e0b',
        blue: '#3b82f6',
        green: '#10b981',
        red: '#ef4444',
        cyan: '#06b6d4',
        dark: '#1e293b'
      },
      systemThemeQuery: null,
      systemThemeChangeHandler: null
    }
  },
  methods: {
    getHumanReadableDate,
    formatNumber (value) {
      if (value === null || value === undefined || value === '') return value
      const n = Number(value)
      if (Number.isNaN(n)) return value
      if (Number.isInteger(n)) return n
      return n.toFixed(2)
    },
    formatProgress (percent) {
      if (percent === null || percent === undefined || percent === '') return ''
      const n = Number(percent)
      if (Number.isNaN(n)) return String(percent) + '%'
      if (Number.isInteger(n)) return String(n) + '%'
      return n.toFixed(2) + '%'
    },
    handleSettingsTouch () {
      this.lastSettingsTouchAt = Date.now()
      this.switch_show_settings()
    },
    handleSettingsClick () {
      if (Date.now() - this.lastSettingsTouchAt < 700) return
      this.switch_show_settings()
    },
    switch_show_settings () {
      this.show_settings_draw = !this.show_settings_draw
    },
    flashStatsButton () {
      this.isStatsFlashing = false
      if (this.statsFlashTimer) {
        clearTimeout(this.statsFlashTimer)
        this.statsFlashTimer = null
      }
      requestAnimationFrame(() => {
        this.isStatsFlashing = true
        this.statsFlashTimer = setTimeout(() => {
          this.isStatsFlashing = false
          this.statsFlashTimer = null
        }, 200)
      })
    },
    async connectWebSocket () {
      // const accessToken = await this.$accessToken(1)
      // if (accessToken === false) {
      //   this.show_visitor = false
      //   // toastr.error("获取Access token失败")
      //   return false
      // }
      // this.tool_access_token = accessToken
      this.tool_access_token = 'null'
      const configStore = useConfigStore()
      // 1. 创建 SockJS 连接
      const socket = new SockJS(process.env.DRAW_WS_HOST + '/info?access_token=' + this.tool_access_token) // WebSocket 端点

      // 2. 创建 STOMP 客户端
      this.stompClient = new Client({
        webSocketFactory: () => socket, // 连接 SockJS
        reconnectDelay: 1000, // 断线重连间隔时间
        heartbeatIncoming: 1000,
        heartbeatOutgoing: 1000
      })

      // 3. 连接 WebSocket
      this.stompClient.onConnect = () => {
        configStore.showSiteInfo = true
        this.connection_retried = 0
        this.button_type = 'success'
        this.stompClient.subscribe('/info/visitors', (message) => {
          this.flashStatsButton()
          const visitor = message.body.split('-')
          this.messages.unshift({
            time: moment().format('HH:mm:ss'),
            city: visitor[0],
            country: visitor[1]
          })
          if (this.messages.length > 10) {
            this.messages.pop()
          }
        })
        // 模拟用户访问
        this.stompClient.subscribe('/info/visitors/location', (message) => {
          this.flashStatsButton()
          const visitor = message.body.split('-')
          this.messages.unshift({
            time: moment().format('HH:mm:ss'),
            city: visitor[0],
            country: visitor[1]
          })
          if (this.messages.length > 10) {
            this.messages.pop()
          }
        })
        // 订阅服务端的频道 "/topic/timestamp"
        this.stompClient.subscribe('/info/stats', (message) => {
          this.flashStatsButton()
          const stats = message.body.split('-')
          this.stats.disk_usage = stats[0] * 100
          this.stats.memory_usage = stats[1] * 100
          this.stats.load_average = stats[2]
          this.stats.swap_usage = stats[3] * 100
          this.stats.uptime = stats[4]
          this.stats.qps = stats[5]
          this.stats.max_qps = stats[6]
          this.stats.count = stats[7]
          this.stats.cpu_num = stats[8]
          this.stats.today_count = stats[9]
          this.stats.online = stats[10]
        })
      }

      // 4. 错误处理
      this.stompClient.onStompError = () => {
        console.log('错误')
      }
      this.stompClient.onWebSocketClose = (frame) => {
        configStore.showSiteInfo = false
        if (frame.code === 2000) {
          this.$accessToken(2)
          this.button_type = 'info'
          console.error('链接已断开')
          return
        }
        if (!this.show_visitor) {
          return
        }
        setTimeout(() => {
          console.error('断线重连中')
          this.connection_retried++
          if (this.connection_retried > 3) {
            this.connection_retried = 0
            return
          }
          this.connectWebSocket()
        }, 2000)
      }
      this.stompClient.onDisconnect = () => {
        this.button_type = 'info'
        console.error('链接已断开')
      }

      this.stompClient.activate() // 激活连接
    },
    setTheme (theme) {
      this.applyTheme(theme)
    },
    getThemeSwatchStyle (theme) {
      if (theme.id === 'system') return {}
      const style = {
        background: this.themeColors[theme.id]
      }
      if (theme.id === 'white') {
        style.border = '1px solid #ddd'
      }
      return style
    },
    resolveTheme (theme) {
      if (theme !== 'system') return theme
      const query = this.systemThemeQuery || (window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null)
      return query && query.matches ? 'dark' : 'white'
    },
    isSupportedTheme (theme) {
      return this.themes.some(item => item.id === theme)
    },
    getRippleColor (theme) {
      const resolvedTheme = this.resolveTheme(theme)
      return this.themeColors[theme] || this.themeColors[resolvedTheme] || '#000000'
    },
    handleThemeClick (theme, e) {
      try {
        const color = this.getRippleColor(theme)
        const ripple = document.createElement('div')
        const x = e.clientX
        const y = e.clientY
        ripple.className = 'theme-ripple'
        ripple.style.left = x + 'px'
        ripple.style.top = y + 'px'
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        const cx = x
        const cy = y
        const distances = [
          Math.hypot(cx - 0, cy - 0),
          Math.hypot(cx - vw, cy - 0),
          Math.hypot(cx - 0, cy - vh),
          Math.hypot(cx - vw, cy - vh)
        ]
        const maxDist = Math.max(...distances)
        const diameter = Math.ceil(maxDist * 2)
        ripple.style.width = diameter + 'px'
        ripple.style.height = diameter + 'px'
        const alpha = this.resolveTheme(theme) === 'white' ? 0.16 : 0.28
        ripple.style.background = this.hexToRgba(color, alpha)
        ripple.style.transform = 'translate(-50%, -50%) scale(0)'
        ripple.style.opacity = '1'
        ripple.style.position = 'fixed'
        ripple.style.pointerEvents = 'none'
        ripple.style.zIndex = '2000'
        ripple.style.transition = 'transform 0.9s cubic-bezier(0.2,0.8,0.2,1), opacity 0.9s ease'
        document.body.appendChild(ripple)
        this.applyTheme(theme)
        requestAnimationFrame(() => {
          ripple.style.transform = 'translate(-50%, -50%) scale(1)'
          ripple.style.opacity = '0'
        })
        setTimeout(() => {
          ripple.remove()
        }, 900)
      } catch (err) {
        console.error(err)
        this.applyTheme(theme)
      }
    },

    hexToRgba (hex, alpha) {
      const c = hex.replace('#', '')
      const num = parseInt(c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c, 16)
      const r = (num >> 16) & 255
      const g = (num >> 8) & 255
      const b = num & 255
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    },
    applyTheme (theme) {
      if (!theme) return
      try {
        const selectedTheme = this.isSupportedTheme(theme) ? theme : 'white'
        document.documentElement.setAttribute('data-theme', this.resolveTheme(selectedTheme))
        this.currentTheme = selectedTheme
        localStorage.setItem('site_theme', selectedTheme)
      } catch (e) {
        console.error('设置主题失败', e)
      }
    },
    setupSystemThemeListener () {
      if (!window.matchMedia) return
      this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.systemThemeChangeHandler = () => {
        if (this.currentTheme === 'system') {
          document.documentElement.setAttribute('data-theme', this.resolveTheme('system'))
        }
      }
      if (this.systemThemeQuery.addEventListener) {
        this.systemThemeQuery.addEventListener('change', this.systemThemeChangeHandler)
      } else {
        this.systemThemeQuery.addListener(this.systemThemeChangeHandler)
      }
    },
    removeSystemThemeListener () {
      if (!this.systemThemeQuery || !this.systemThemeChangeHandler) return
      if (this.systemThemeQuery.removeEventListener) {
        this.systemThemeQuery.removeEventListener('change', this.systemThemeChangeHandler)
      } else {
        this.systemThemeQuery.removeListener(this.systemThemeChangeHandler)
      }
    }
  },
  beforeMount () {
    try {
      this.setupSystemThemeListener()
      this.applyTheme(localStorage.getItem('site_theme') || 'white')
    } catch (e) {
      this.applyTheme('white')
    }

    if (this.show_visitor) {
      this.connectWebSocket()
    }
  },
  beforeUnmount () {
    if (this.statsFlashTimer) {
      clearTimeout(this.statsFlashTimer)
    }
    this.removeSystemThemeListener()
  },
  watch: {
    show_visitor (newValue) {
      if (newValue) {
        this.connectWebSocket()
      } else {
        if (this.stompClient) {
          this.stompClient.deactivate()
        }
      }
    }
  }
}
</script>
<style scoped lang="scss">
.visitor-display-area {
  height: 200px;
  overflow-y: hidden;
  opacity: .5;
}

.settings-container {
  padding: 10px;
  width: 320px;
}

.settings-bar {
  display: flex;
  justify-content: space-between;
  bottom: 50px;
  right: 20px;
  position: fixed;
  z-index: 1000;
  .site-info-lines{
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 10px;
    border-radius: 5px;
    background-color: rgba(255, 255, 255, 1);
    backdrop-filter: blur(10px);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    .mini-progress{
      font-size: 10px;
      :deep(.el-progress__text){
        span{
          font-size: 10px;
        }
      }
    }
  }
}

.stats-flash {
  animation: stats-flash .4s ease;
}

@keyframes stats-flash {
  0% {
    box-shadow: 0 0 0 rgba(64, 158, 255, 0);
  }
  50% {
    box-shadow: 0 0 12px rgba(64, 158, 255, .65);
  }
  100% {
    box-shadow: 0 0 0 rgba(64, 158, 255, 0);
  }
}

.theme-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 4px;
  align-items: center;
}

.theme-swatch {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
  border: 2px solid transparent;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.theme-swatch.system-theme-swatch {
  background: linear-gradient(135deg, #ffffff 0 50%, #1e293b 50% 100%);
  border: 1px solid #cbd5e1;
}

.theme-swatch:hover {
  transform: translateY(-2px) scale(1.03);
}

.theme-swatch.selected {
  border-color: var(--el-color-primary, #409eff);
  box-shadow: 0 0 0 2px var(--el-color-primary, #409eff), 0 6px 18px rgba(0,0,0,0.18);
  transform: translateY(-2px) scale(1.08);
  transition: all 0.18s ease;
}
:deep(.el-progress-bar__innerText){
  color: #000000;
}

</style>
<style lang="scss">
.site-info-drawer,
.site-info-drawer .el-drawer__body {
  background-color: var(--header-bg, rgba(255, 255, 255, 0.15))!important;
  backdrop-filter: blur(12px) saturate(180%);
  color: var(--text-color, #111827);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.theme-ripple {
  position: fixed;
  border-radius: 50%;
  transform-origin: center center;
  pointer-events: none;
  will-change: transform, opacity;
  box-shadow: 0 10px 40px rgba(0,0,0,0.12);
}
</style>
