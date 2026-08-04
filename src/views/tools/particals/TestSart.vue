<script>
import * as echarts from 'echarts'
import { mapState, mapActions } from 'pinia'
import { useUserStore } from '@/store/user'
import moment from 'moment'
import topic from '@/apis/topic'
import { InfoFilled } from '@element-plus/icons-vue'

const TOPIC_SLUG = 'sart'
const NO_GO_DIGIT = 3
/** 数字出现节奏 / 透明度衰减时长（毫秒） */
const INTERVAL_MS = 1000
/** 开始前倒计时秒数 */
const COUNTDOWN_SECONDS = 3

export default {
  components: {
    InfoFilled
  },
  tdk: {
    title: '持续注意力测试 - 在线训练',
    description: 'SART 持续注意力测试，数字以固定节奏出现，除 3 以外均需快速点击',
    keywords: 'SART, 持续注意力, 专注力测试, 在线测试'
  },
  data () {
    return {
      // idle | countdown | playing | result
      state: 'idle',
      currentDigit: null,
      digitVisible: false,
      digitKey: 0,
      costTime: 0,
      finalScore: null,
      endReason: '',
      clickedThisTrial: false,
      startTime: null,
      costTimer: null,
      countdownValue: COUNTDOWN_SECONDS,
      countdownTimer: null,
      trialTimer: null,
      submitting: false,
      questionId: null,
      userScores: [],
      userScoreRecords: [],
      showUnauthorized: false,
      dialogWidth: '30%',
      isPortrait: false,
      showStatsDialog: false,
      topicDescription: ''
    }
  },
  computed: {
    ...mapState(useUserStore, ['isLoggedIn']),
    hasEnoughScores () {
      return this.userScores.length >= 2
    },
    displayDuration () {
      const ms = this.state === 'result' ? this.finalScore : this.costTime
      return ((ms || 0) / 1000).toFixed(3)
    },
    statusText () {
      if (this.state === 'idle') {
        return '点击开始测试：看到非 3 数字请快速点击，看到 3 请不要点'
      }
      if (this.state === 'countdown') {
        return '准备开始，请集中注意力'
      }
      if (this.state === 'playing') {
        return `进行中 · 已持续 ${this.displayDuration} 秒`
      }
      if (this.endReason === 'commission') {
        return `测试结束：点到了数字 3 · 持续 ${this.displayDuration} 秒`
      }
      if (this.endReason === 'omission') {
        return `测试结束：单次超时未点击 · 持续 ${this.displayDuration} 秒`
      }
      return `测试结束 · 持续 ${this.displayDuration} 秒`
    },
    playBoxText () {
      if (this.state === 'idle') {
        return '点击开始'
      }
      if (this.state === 'countdown') {
        return String(this.countdownValue)
      }
      if (this.state === 'result') {
        return `${this.displayDuration} 秒`
      }
      if (this.digitVisible && this.currentDigit !== null) {
        return String(this.currentDigit)
      }
      return ''
    }
  },
  methods: {
    moment,
    ...mapActions(useUserStore, ['setShowLoginDialog']),
    nextDigit () {
      return Math.floor(Math.random() * 9) + 1
    },
    clearTimers () {
      if (this.trialTimer) {
        clearTimeout(this.trialTimer)
        this.trialTimer = null
      }
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer)
        this.countdownTimer = null
      }
      if (this.costTimer) {
        clearInterval(this.costTimer)
        this.costTimer = null
      }
    },
    start () {
      if (this.state === 'countdown' || this.state === 'playing' || this.submitting) {
        return
      }
      this.clearTimers()
      this.state = 'countdown'
      this.countdownValue = COUNTDOWN_SECONDS
      this.costTime = 0
      this.finalScore = null
      this.endReason = ''
      this.clickedThisTrial = false
      this.currentDigit = null
      this.digitVisible = false
      this.startTime = null

      this.countdownTimer = setInterval(() => {
        if (this.countdownValue <= 1) {
          clearInterval(this.countdownTimer)
          this.countdownTimer = null
          this.beginPlaying()
          return
        }
        this.countdownValue -= 1
      }, 1000)
    },
    beginPlaying () {
      this.state = 'playing'
      this.startTime = performance.now()
      this.costTime = 0
      this.costTimer = setInterval(() => {
        this.costTime = Math.round(performance.now() - this.startTime)
      }, 16)
      this.showNextTrial()
    },
    showNextTrial () {
      if (this.state !== 'playing') {
        return
      }

      this.clickedThisTrial = false
      this.currentDigit = this.nextDigit()
      this.digitKey += 1
      this.digitVisible = true

      this.trialTimer = setTimeout(() => {
        this.trialTimer = null
        this.resolveTrial()
      }, INTERVAL_MS)
    },
    resolveTrial () {
      if (this.state !== 'playing') {
        return
      }

      const isNoGo = this.currentDigit === NO_GO_DIGIT

      if (isNoGo) {
        if (this.clickedThisTrial) {
          this.finishTest('commission')
          return
        }
        this.digitVisible = false
        this.showNextTrial()
        return
      }

      if (!this.clickedThisTrial) {
        this.finishTest('omission')
        return
      }

      this.digitVisible = false
      this.showNextTrial()
    },
    handleClick () {
      if (this.state === 'idle' || this.state === 'result') {
        this.start()
        return
      }

      if (this.state === 'countdown') {
        return
      }

      if (this.state !== 'playing' || !this.digitVisible || this.clickedThisTrial) {
        return
      }

      if (this.currentDigit === NO_GO_DIGIT) {
        this.finishTest('commission')
        return
      }

      this.clickedThisTrial = true
      this.digitVisible = false
    },
    async finishTest (reason) {
      if (this.state !== 'playing' || this.submitting) {
        return
      }

      const duration = this.startTime ? Math.round(performance.now() - this.startTime) : this.costTime
      this.clearTimers()
      this.state = 'result'
      this.endReason = reason
      this.costTime = duration
      this.finalScore = duration
      this.digitVisible = false
      this.submitting = true

      try {
        await topic.submitTopicAnswers(TOPIC_SLUG, [
          {
            question_id: this.questionId,
            answer: this.finalScore
          }
        ])
        await this.getAnswers()
      } finally {
        this.submitting = false
      }
    },
    restart () {
      this.clearTimers()
      this.state = 'idle'
      this.currentDigit = null
      this.digitVisible = false
      this.costTime = 0
      this.finalScore = null
      this.endReason = ''
      this.clickedThisTrial = false
      this.startTime = null
      this.countdownValue = COUNTDOWN_SECONDS
      this.submitting = false
    },
    getAnswers () {
      return topic.getAnswers(TOPIC_SLUG).then(data => {
        this.userScoreRecords = data
        this.userScores = data.map(item => Number(item.answer)).filter(Number.isFinite)
        this.$nextTick(() => {
          this.generateRanking()
        })
      })
    },
    getTopic () {
      topic.getTopicDetail(TOPIC_SLUG).then(data => {
        this.questionId = data.questions[0].id
        this.topicDescription = data.description
      })
    },
    getUserInfo () {
      this.getAnswers()
      if (!this.isLoggedIn) {
        this.showUnauthorized = true
      }
    },
    gotoLogin () {
      this.showUnauthorized = false
      this.setShowLoginDialog(true)
    },
    generateRanking () {
      const chartElement = this.$refs.rankingListEcharts || this.$refs.rankingListEchartsMobile
      if (!chartElement) {
        return
      }

      if (!this.hasEnoughScores) {
        const chart = echarts.getInstanceByDom(chartElement)
        if (chart) {
          chart.dispose()
        }
        return
      }

      const mean = this.mean(this.userScores)
      const std = this.standardDeviation(this.userScores, mean)
      const effectiveStd = std || Math.max(mean * 0.05, 1)
      const minAnswer = Math.min(...this.userScores)
      const maxAnswer = Math.max(...this.userScores)
      const minX = Math.max(0, Math.min(minAnswer, mean - effectiveStd * 3))
      const maxX = Math.max(maxAnswer, mean + effectiveStd * 3)
      const step = (maxX - minX) / 120 || 1
      const distributionData = Array.from({ length: 121 }, (item, index) => {
        const x = minX + step * index
        return [x, this.normalDensity(x, mean, effectiveStd)]
      })
      const sampleData = this.userScores.map(answer => [answer, this.normalDensity(answer, mean, effectiveStd)])

      const option = {
        title: {
          text: '持续注意力成绩正态分布拟合',
          subtext: `统计数量 ${this.userScores.length} · 均值 ${(mean / 1000).toFixed(3)} 秒`,
          left: 'center'
        },
        legend: {
          top: 55,
          data: ['拟合曲线', '答题样本']
        },
        grid: {
          top: 92,
          right: 28,
          bottom: 54,
          left: 72
        },
        tooltip: {
          trigger: 'item',
          formatter: params => {
            const [answer, density] = params.value
            return `${params.seriesName}<br/>持续时长：${(answer / 1000).toFixed(3)} 秒<br/>概率密度：${density.toExponential(3)}`
          }
        },
        xAxis: {
          type: 'value',
          name: '持续时长（秒）',
          nameLocation: 'middle',
          nameGap: 34,
          min: minX,
          max: maxX,
          axisLabel: {
            formatter: value => (value / 1000).toFixed(1)
          },
          splitLine: {
            show: false
          }
        },
        yAxis: {
          type: 'value',
          name: '概率密度',
          min: 0,
          axisLabel: {
            formatter: value => value.toExponential(1)
          },
          splitLine: {
            lineStyle: {
              color: '#e5e7eb'
            }
          }
        },
        series: [
          {
            name: '拟合曲线',
            type: 'line',
            data: distributionData,
            smooth: true,
            showSymbol: false,
            lineStyle: {
              color: '#2563eb',
              width: 2
            }
          },
          {
            name: '答题样本',
            type: 'scatter',
            data: sampleData,
            symbolSize: 9,
            itemStyle: {
              color: '#dc2626',
              borderColor: '#ffffff',
              borderWidth: 2
            },
            emphasis: {
              focus: 'series',
              scale: 1.5
            }
          }
        ]
      }

      this.$nextTick(() => {
        let chart = echarts.getInstanceByDom(chartElement)
        if (!chart || chart.isDisposed()) {
          chart = echarts.init(chartElement)
        }
        chart.setOption(option, true)
        chart.resize()
      })
    },
    openStatsDialog () {
      this.showStatsDialog = true
      this.$nextTick(() => {
        this.generateRanking()
      })
    },
    mean (values) {
      return values.reduce((sum, value) => sum + value, 0) / values.length
    },
    standardDeviation (values, mean) {
      const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length
      return Math.sqrt(variance)
    },
    normalDensity (value, mean, std) {
      const exponent = -Math.pow(value - mean, 2) / (2 * Math.pow(std, 2))
      return Math.exp(exponent) / (std * Math.sqrt(2 * Math.PI))
    },
    resizeChart () {
      const elements = [this.$refs.rankingListEcharts, this.$refs.rankingListEchartsMobile].filter(Boolean)
      elements.forEach(element => {
        const chart = echarts.getInstanceByDom(element)
        if (chart) {
          chart.resize()
        }
      })
    },
    disposeCharts () {
      const elements = [this.$refs.rankingListEcharts, this.$refs.rankingListEchartsMobile].filter(Boolean)
      elements.forEach(element => {
        const chart = echarts.getInstanceByDom(element)
        if (chart) {
          chart.dispose()
        }
      })
    }
  },
  mounted () {
    this.getUserInfo()
    this.getTopic()
    this.isPortrait = window.matchMedia('(orientation: portrait)').matches
    if (this.isPortrait) {
      this.dialogWidth = '100%'
    }
    window.addEventListener('resize', this.resizeChart)
  },
  beforeUnmount () {
    this.clearTimers()
    window.removeEventListener('resize', this.resizeChart)
    this.disposeCharts()
  }
}
</script>

<template>
  <div class="main-box">
    <div class="sart-container">
      <div class="play-box">
        <el-card class="play-card">
          <template v-slot:header>
            <div class="display-area">
              <span class="title">
                持续注意力测试
                <el-tooltip :content="topicDescription">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </span>
              <span>
                <span>用时：</span>
                <span class="score-value">{{ displayDuration }}</span>
                <span> 秒</span>
              </span>
            </div>
          </template>

          <div class="status-area">
            <div class="status-text">{{ statusText }}</div>
          </div>

          <div class="sart-area">
            <div
              ref="sartBox"
              :class="['sart-box', `sart-box--${state}`]"
              @click="handleClick"
            >
              <span
                v-if="state === 'playing' && digitVisible"
                :key="digitKey"
                class="sart-box-text sart-digit"
              >
                {{ currentDigit }}
              </span>
              <span v-else class="sart-box-text">{{ playBoxText }}</span>
            </div>
          </div>

          <div class="opt-area">
            <el-button type="primary" :loading="submitting" @click="restart">重新开始</el-button>
            <el-button v-if="isPortrait" @click="openStatsDialog">统计</el-button>
          </div>
        </el-card>
      </div>

      <div v-if="!isPortrait" class="ranking-list draggable-test">
        <el-card class="ranking-list-echarts-card">
          <el-tabs class="ranking-tabs">
            <el-tab-pane label="结果统计">
              <div
                v-show="hasEnoughScores"
                ref="rankingListEcharts"
                class="ranking-list-echarts"
              ></div>
              <div v-if="!hasEnoughScores" class="ranking-list-echarts ranking-list-echarts-empty">
                数据不足，测试后显示
              </div>
            </el-tab-pane>
            <el-tab-pane label="历史记录">
              <div class="history-list">
                <div v-if="!userScoreRecords.length" class="history-list-empty">暂无记录</div>
                <div v-for="record in userScoreRecords" :key="record.id" class="history-item">
                  <span class="history-item-user">{{ record.user?.name || '匿名' }}</span>
                  <span class="history-item-score">{{ (Number(record.answer) / 1000).toFixed(3) }} 秒</span>
                  <span class="history-item-time">{{ moment(record.created_at).format('YYYY-MM-DD HH:mm') }}</span>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>

    <el-dialog
      v-model="showUnauthorized"
      title="确认登录？"
      ref="unauthorizedDialog"
      :width="dialogWidth"
      class="unauthorized-dialog"
    >
      <span>登录后可以参与排名，确认登录吗？</span>
      <template v-slot:footer>
        <span class="dialog-footer">
          <el-button @click="showUnauthorized = false">取 消</el-button>
          <el-button type="primary" @click="gotoLogin">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showStatsDialog" title="训练统计" :width="dialogWidth" class="stats-dialog">
      <el-tabs class="ranking-tabs">
        <el-tab-pane label="结果统计">
          <div v-show="hasEnoughScores" ref="rankingListEchartsMobile" class="ranking-list-echarts"></div>
          <div v-if="!hasEnoughScores" class="ranking-list-echarts-empty">数据不足，测试后显示</div>
        </el-tab-pane>
        <el-tab-pane label="历史记录">
          <div class="history-list">
            <div v-if="!userScoreRecords.length" class="history-list-empty">暂无记录</div>
            <div v-for="record in userScoreRecords" :key="record.id" class="history-item">
              <span class="history-item-user">{{ record.user?.name || '匿名' }}</span>
              <span class="history-item-score">{{ (Number(record.answer) / 1000).toFixed(3) }} 秒</span>
              <span class="history-item-time">{{ moment(record.created_at).format('YYYY-MM-DD HH:mm') }}</span>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.main-box {
  display: flex;
  justify-content: center;
  padding-top: 50px;

  @include mobile {
    padding-top: 10px;
  }

  .sart-container {
    display: flex;
    width: 80%;

    @media screen and (max-aspect-ratio: 1/1) {
      width: 98%;
    }

    .title {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .play-box {
      display: flex;
      justify-content: center;

      @include mobile {
        width: 100%;
      }

      .play-card {
        width: 100%;
      }

      .display-area {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 18px;

        .score-value {
          display: inline-block;
          min-width: 40px;
          color: #409eff;
          font-weight: bold;
          text-align: center;
        }
      }

      .status-area {
        min-height: 40px;
        padding: 0 8px 8px;
        text-align: center;
      }

      .status-text {
        color: #606266;
        line-height: 1.5;
      }

      .sart-area {
        display: flex;
        justify-content: center;
        min-width: 620px;
        padding: 12px 0 20px;

        @media screen and (max-aspect-ratio: 1/1) {
          min-width: 0;
        }
      }

      .sart-box {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 400px;
        border-radius: 12px;
        cursor: pointer;
        user-select: none;
        transition:
          background-color 0.15s ease,
          border-color 0.15s ease,
          transform 0.1s ease;

        @media screen and (max-aspect-ratio: 1/1) {
          height: 240px;
        }

        &:active {
          transform: scale(0.97);
        }

        .sart-box-text {
          font-size: clamp(48px, 9vw, 96px);
          font-weight: bold;
          letter-spacing: 0.06em;
          text-align: center;
          line-height: 1.2;
        }

        .sart-digit {
          animation: sartDigitFade 0.8s linear forwards;
        }

        @keyframes sartDigitFade {
          from {
            opacity: 1;
          }
          to {
            opacity: 0.1;
          }
        }

        &--idle {
          background-color: #ffffff;
          border: 3px solid #dcdfe6;

          .sart-box-text {
            color: #606266;
            font-size: 28px;
            letter-spacing: 0;
          }
        }

        &--countdown {
          background-color: #ecf5ff;
          border: 3px solid #409eff;

          .sart-box-text {
            color: #409eff;
            font-size: clamp(64px, 12vw, 120px);
          }
        }

        &--playing {
          background-color: #f5f7fa;
          border: 3px solid #dcdfe6;

          .sart-box-text {
            color: #303133;
          }
        }

        &--result {
          background-color: #409eff;
          border: 3px solid #409eff;

          .sart-box-text {
            color: #ffffff;
            font-size: 42px;
            letter-spacing: 0;
          }
        }
      }

      .opt-area {
        display: flex;
        justify-content: center;
        gap: 12px;
        padding-top: 12px;
      }
    }

    .ranking-list {
      display: flex;
      justify-content: center;
      width: 80%;

      .ranking-list-echarts-card {
        display: flex;
        justify-content: center;
        width: 80%;

        @media screen and (max-aspect-ratio: 1/1) {
          width: 100%;
        }

        .ranking-tabs {
          width: 100%;
        }

        .ranking-list-echarts {
          width: 100%;
          height: 400px;
        }

        .ranking-list-echarts-empty {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .history-list {
          width: 100%;
          max-height: 400px;
          overflow-y: auto;
        }
      }
    }
  }
}

.history-list-empty {
  padding: 40px 0;
  color: #909399;
  text-align: center;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;

  &:last-child {
    border-bottom: none;
  }

  .history-item-user {
    min-width: 80px;
    font-weight: 500;
  }

  .history-item-score {
    color: #409eff;
    font-weight: bold;
    white-space: nowrap;
  }

  .history-item-time {
    color: #909399;
    font-size: 13px;
    white-space: nowrap;
  }
}
</style>

<style lang="scss">
.stats-dialog {
  .ranking-tabs {
    width: 100%;
  }

  .ranking-list-echarts {
    width: 100%;
    height: 400px;
  }

  .ranking-list-echarts-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #909399;
  }

  .history-list {
    width: 100%;
    max-height: 400px;
    overflow-y: auto;
  }
}
</style>
