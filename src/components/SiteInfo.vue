<template>
  <div>
    <div class="settings-bar">
      <el-button circle :type="button_type" :class="{ 'stats-flash': isStatsFlashing }" @click="switch_show_settings">
        <span class="fa fa-gamepad"></span>
        {{ stats.online }}
      </el-button>
    </div>
    <el-drawer v-model="show_settings_draw" direction="rtl" :with-header="false" :size="360">
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
                         :percentage="stats.load_average / stats.cpu_num * 100"></el-progress>
          </div>
          <div>
            内存用量:
            <el-progress :text-inside="true" :stroke-width="26" :percentage="stats.memory_usage"></el-progress>
          </div>
          <div>
            磁盘用量:
            <el-progress :text-inside="true" :stroke-width="26" :percentage="stats.disk_usage"></el-progress>
          </div>
          <div>
            交换分区:
            <el-progress :text-inside="true" :stroke-width="26" :percentage="stats.swap_usage"></el-progress>
          </div>
          <div>
            启动时间: {{ getHumanReadableDate(stats.uptime * 1000) }} s
          </div>
          <div>
            实时qps: {{ stats.qps }}
          </div>
          <div>
            最大qps: {{ stats.max_qps }}
          </div>
          <div>
            启动后访客: {{ stats.count }}
          </div>
          <div>
            今日访客: {{ stats.today_count }}
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
      }
    }
  },
  methods: {
    getHumanReadableDate,
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
      this.stompClient.onStompError = (frame) => {
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
    }
  },
  beforeCreate () {
    let showVisitor = localStorage.getItem('visitor_switch')
    this.show_visitor = showVisitor === 'true'
  },
  beforeMount () {
    if (this.show_visitor) {
      this.connectWebSocket()
    }
  },
  beforeUnmount () {
    if (this.statsFlashTimer) {
      clearTimeout(this.statsFlashTimer)
    }
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
  width: 60px;
  height: 40px;
  bottom: 50px;
  right: 20px;
  position: fixed;
  z-index: 1000;
}

.stats-flash {
  animation: stats-flash .4s ease;
}

@keyframes stats-flash {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(64, 158, 255, 0);
  }
  50% {
    transform: scale(1.18);
    box-shadow: 0 0 12px rgba(64, 158, 255, .65);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(64, 158, 255, 0);
  }
}
</style>
