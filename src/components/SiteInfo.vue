<template>
  <div>
    <div
      class="site-info-lines site-info-bar"
      :class="{ 'stats-flash': isStatsFlashing }"
      role="button"
      tabindex="0"
      :title="barTooltip"
      @dblclick.stop.prevent="switch_show_settings"
      @keydown.enter.prevent="switch_show_settings"
      @keydown.space.prevent="switch_show_settings"
    >
      <img
        v-if="currentTheme === 'genshin'"
        class="genshin-paimon"
        src="/images/genshin/paimon-sprite.webp"
        alt=""
        aria-hidden="true"
      />
      <div
        class="mini-stat mini-stat--action"
        role="button"
        tabindex="0"
        title="回到顶部"
        @click.stop="scrollToTop"
        @keydown.enter.stop.prevent="scrollToTop"
        @keydown.space.stop.prevent="scrollToTop"
      >
        <i class="mini-stat__icon fas fa-arrow-up" aria-hidden="true"></i>
        <span class="mini-stat__value">顶部</span>
      </div>
      <div class="mini-stat mini-stat--stat" :title="`在线 ${formatNumber(stats.online)}`">
        <i class="mini-stat__icon fas fa-user" aria-hidden="true"></i>
        <span class="mini-stat__value">{{ formatNumber(stats.online) }}</span>
      </div>
      <div class="mini-stat mini-stat--stat" :title="`CPU ${cpuUsage}%`">
        <i class="mini-stat__icon fas fa-microchip" aria-hidden="true"></i>
        <span class="mini-stat__value">{{ formatMiniProgress(cpuUsage) }}</span>
      </div>
      <div class="mini-stat mini-stat--stat" :title="`内存 ${memUsage}%`">
        <i class="mini-stat__icon fas fa-memory" aria-hidden="true"></i>
        <span class="mini-stat__value">{{ formatMiniProgress(memUsage) }}</span>
      </div>
      <div
        class="mini-stat mini-stat--action mini-stat--expand"
        role="button"
        tabindex="0"
        title="展开"
        @click.stop="switch_show_settings"
        @keydown.enter.stop.prevent="switch_show_settings"
        @keydown.space.stop.prevent="switch_show_settings"
      >
        <i class="mini-stat__icon fas fa-bars" aria-hidden="true"></i>
        <span class="mini-stat__value">展开</span>
      </div>
    </div>
    <el-drawer
      v-model="show_settings_draw"
      class="site-info-drawer"
      direction="rtl"
      :with-header="false"
      :size="360"
      :lock-scroll="false"
    >
      <div class="settings-container">
        <div>
          <el-divider> 站点信息 </el-divider>
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
            <el-progress
              :text-inside="true"
              :stroke-width="26"
              :percentage="(stats.load_average / stats.cpu_num) * 100"
              :format="formatProgress"
            ></el-progress>
          </div>
          <div>
            内存用量:
            <el-progress
              :text-inside="true"
              :stroke-width="26"
              :percentage="stats.memory_usage"
              :format="formatProgress"
            ></el-progress>
          </div>
          <div>
            磁盘用量:
            <el-progress
              :text-inside="true"
              :stroke-width="26"
              :percentage="stats.disk_usage"
              :format="formatProgress"
            ></el-progress>
          </div>
          <div>
            交换分区:
            <el-progress
              :text-inside="true"
              :stroke-width="26"
              :percentage="stats.swap_usage"
              :format="formatProgress"
            ></el-progress>
          </div>
          <div>启动时间: {{ getHumanReadableDate(stats.uptime * 1000) }} s</div>
          <div>在线人数: {{ formatNumber(stats.online) }}</div>
          <div>实时qps: {{ formatNumber(stats.qps) }}</div>
          <div>最大qps: {{ formatNumber(stats.max_qps) }}</div>
          <div>启动后访客: {{ formatNumber(stats.count) }}</div>
          <div>今日访客: {{ formatNumber(stats.today_count) }}</div>
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
import { useUserStore } from '@/store/user'

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
      show_visitor: true,
      messages: [],
      button_type: 'info',
      isStatsFlashing: false,
      statsFlashTimer: null,
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
      currentTheme: 'white',
      themes: [
        { id: 'system', label: '系统' },
        { id: 'white', label: '白色' },
        { id: 'dark', label: '暗黑' },
        { id: 'pixel-light', label: '像素' },
        { id: 'genshin', label: '原神' },
        { id: 'colorful', label: '彩色' }
      ],
      themeColors: {
        white: '#ffffff',
        dark: '#1e293b',
        'pixel-light': '#a3e635',
        genshin: '#d4a574',
        colorful: '#ff6b9d'
      },
      systemThemeQuery: null,
      systemThemeChangeHandler: null
    }
  },
  computed: {
    cpuUsage () {
      const cpuNum = Number(this.stats.cpu_num) || 1
      const load = Number(this.stats.load_average) || 0
      const pct = (load / cpuNum) * 100
      if (!Number.isFinite(pct)) return 0
      return Math.max(0, Math.min(100, Number(pct.toFixed(2))))
    },
    memUsage () {
      const pct = Number(this.stats.memory_usage) || 0
      if (!Number.isFinite(pct)) return 0
      return Math.max(0, Math.min(100, Number(pct.toFixed(2))))
    },
    barTooltip () {
      return `在线 ${this.formatNumber(this.stats.online)} · CPU ${this.cpuUsage}% · 内存 ${this.memUsage}%\n单击返回顶部，双击打开设置`
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
    formatMiniProgress (percent) {
      const n = Number(percent)
      if (!Number.isFinite(n)) return '0%'
      return `${Math.round(n)}%`
    },
    switch_show_settings () {
      this.show_settings_draw = !this.show_settings_draw
    },
    scrollToTop () {
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
      const userStore = useUserStore()
      const accessToken = userStore.token
      const configStore = useConfigStore()
      const socket = new SockJS(import.meta.env.VITE_TOOL_HOST + '/info?access_token=' + accessToken)

      this.stompClient = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 1000,
        heartbeatIncoming: 1000,
        heartbeatOutgoing: 1000
      })

      this.stompClient.onConnect = () => {
        configStore.showSiteInfo = true
        this.connection_retried = 0
        this.button_type = 'success'
        this.stompClient.subscribe('/info/visitors', message => {
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
        this.stompClient.subscribe('/info/visitors/location', message => {
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
        this.stompClient.subscribe('/info/stats', message => {
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

      this.stompClient.onStompError = () => {
        console.log('错误')
      }
      this.stompClient.onWebSocketClose = frame => {
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

      this.stompClient.activate()
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
      if (theme.id === 'genshin') {
        style.backgroundImage = "url('/images/genshin/paimon.webp')"
        style.backgroundSize = 'cover'
        style.backgroundPosition = 'center'
      }
      if (theme.id === 'colorful') {
        style.background = 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd)'
      }
      return style
    },
    resolveTheme (theme) {
      if (theme !== 'system') return theme
      const query =
        this.systemThemeQuery || (window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null)
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
      const num = parseInt(
        c.length === 3
          ? c
            .split('')
            .map(ch => ch + ch)
            .join('')
          : c,
        16
      )
      const r = (num >> 16) & 255
      const g = (num >> 8) & 255
      const b = num & 255
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    },
    applyTheme (theme) {
      if (!theme) return
      try {
        const selectedTheme = this.isSupportedTheme(theme) ? theme : 'white'
        const resolved = this.resolveTheme(selectedTheme)
        document.documentElement.setAttribute('data-theme', resolved)
        this.currentTheme = selectedTheme
        localStorage.setItem('site_theme', selectedTheme)
        this.togglePixelFont(resolved === 'pixel-light')
        this.toggleGenshinFont(resolved === 'genshin')
      } catch (e) {
        console.error('设置主题失败', e)
      }
    },
    togglePixelFont (enable) {
      const LINK_ID = 'pixel-font-link'
      const existing = document.getElementById(LINK_ID)
      if (enable) {
        if (existing) return
        const preconnect1 = document.createElement('link')
        preconnect1.rel = 'preconnect'
        preconnect1.href = 'https://fonts.googleapis.com'
        document.head.appendChild(preconnect1)
        const preconnect2 = document.createElement('link')
        preconnect2.rel = 'preconnect'
        preconnect2.href = 'https://fonts.gstatic.com'
        preconnect2.crossOrigin = ''
        document.head.appendChild(preconnect2)
        const link = document.createElement('link')
        link.id = LINK_ID
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap'
        document.head.appendChild(link)
      } else {
        if (existing) existing.remove()
      }
    },
    toggleGenshinFont (enable) {
      const LINK_ID = 'genshin-font-link'
      const existing = document.getElementById(LINK_ID)
      if (enable) {
        if (existing) return
        const preconnect1 = document.createElement('link')
        preconnect1.rel = 'preconnect'
        preconnect1.href = 'https://fonts.googleapis.com'
        document.head.appendChild(preconnect1)
        const preconnect2 = document.createElement('link')
        preconnect2.rel = 'preconnect'
        preconnect2.href = 'https://fonts.gstatic.com'
        preconnect2.crossOrigin = ''
        document.head.appendChild(preconnect2)
        const link = document.createElement('link')
        link.id = LINK_ID
        link.rel = 'stylesheet'
        link.href =
          'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&family=ZCOOL+XiaoWei&display=swap'
        document.head.appendChild(link)
      } else {
        if (existing) existing.remove()
      }
    },
    setupSystemThemeListener () {
      if (!window.matchMedia) return
      this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.systemThemeChangeHandler = () => {
        if (this.currentTheme === 'system') {
          const resolved = this.resolveTheme('system')
          document.documentElement.setAttribute('data-theme', resolved)
          this.togglePixelFont(resolved === 'pixel-light')
          this.toggleGenshinFont(resolved === 'genshin')
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
  opacity: 0.5;
}

.settings-container {
  padding: 10px;
  width: 320px;
}

:deep(.el-backtop.site-info-backtop) {
  z-index: 1000;
  width: auto !important;
  height: auto !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  animation: none !important;

  &::before,
  &::after {
    content: none !important;
    display: none !important;
  }

  i,
  .el-icon,
  .el-backtop__icon {
    display: none !important;
  }
}

.genshin-paimon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  object-fit: contain;
  pointer-events: none;
  animation: genshin-paimon-bob 3.5s ease-in-out infinite alternate;
}

.site-info-bar {
  position: fixed;
  right: 40px;
  bottom: 48px;
  z-index: 1000;
}

.site-info-lines {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--article-border, rgba(0, 0, 0, 0.08)) 85%, transparent);
  background: color-mix(in srgb, var(--header-bg, rgba(255, 255, 255, 0.9)) 90%, transparent);
  color: var(--text-color, #111827);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  box-shadow:
    0 4px 14px rgba(15, 23, 42, 0.1),
    0 1px 0 rgba(255, 255, 255, 0.3) inset;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow:
      0 6px 16px rgba(15, 23, 42, 0.14),
      0 1px 0 rgba(255, 255, 255, 0.35) inset;
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary, #409eff);
    outline-offset: 2px;
  }
}

.mini-stat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  line-height: 1;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.mini-stat--action {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:focus-visible {
    outline: 2px solid var(--el-color-primary, #409eff);
    outline-offset: 2px;
    border-radius: 6px;
  }
}

.mini-stat--expand {
  display: none;
}

@media (max-width: 768px) {
  .mini-stat--stat {
    display: none;
  }

  .mini-stat--expand {
    display: inline-flex;
  }
}

.mini-stat__icon {
  font-size: 10px;
  width: 11px;
  color: var(--muted-text-color, #6b7280);
  flex-shrink: 0;
  line-height: 1;
  text-align: center;
}

.mini-stat__value {
  color: var(--text-color, #111827);
  font-weight: 600;
  min-width: 0.9em;
}

.stats-flash {
  animation: stats-flash 0.4s ease;
}

@keyframes stats-flash {
  0% {
    box-shadow:
      0 4px 14px rgba(15, 23, 42, 0.1),
      0 0 0 0 color-mix(in srgb, var(--el-color-primary, #409eff) 0%, transparent);
  }
  45% {
    box-shadow:
      0 4px 14px rgba(15, 23, 42, 0.12),
      0 0 0 2px color-mix(in srgb, var(--el-color-primary, #409eff) 40%, transparent),
      0 0 12px color-mix(in srgb, var(--el-color-primary, #409eff) 50%, transparent);
  }
  100% {
    box-shadow:
      0 4px 14px rgba(15, 23, 42, 0.1),
      0 0 0 0 color-mix(in srgb, var(--el-color-primary, #409eff) 0%, transparent);
  }
}

@keyframes genshin-paimon-bob {
  0% {
    transform: translateY(0) rotate(-2deg);
  }
  100% {
    transform: translateY(-6px) rotate(2deg);
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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  border: 2px solid transparent;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
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
  box-shadow:
    0 0 0 2px var(--el-color-primary, #409eff),
    0 6px 18px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px) scale(1.08);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
:deep(.el-progress-bar__innerText) {
  color: #000000;
}
</style>
<style lang="scss">
.site-info-drawer,
.site-info-drawer .el-drawer__body {
  background-color: var(--header-bg, rgba(255, 255, 255, 0.15)) !important;
  backdrop-filter: blur(12px) saturate(180%);
  color: var(--text-color, #111827);
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

.theme-ripple {
  position: fixed;
  border-radius: 50%;
  transform-origin: center center;
  pointer-events: none;
  will-change: transform, opacity;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
}

html[data-theme='genshin'] .el-backtop.site-info-backtop,
html[data-theme='colorful'] .el-backtop.site-info-backtop {
  width: auto !important;
  height: auto !important;
  border-radius: 0 !important;
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  animation: none !important;

  &::after {
    display: none !important;
  }
}
</style>
