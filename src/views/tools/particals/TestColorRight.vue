<script>
import * as echarts from 'echarts'
import moment from 'moment'
import topic from '@/apis/topic'
import { InfoFilled } from '@element-plus/icons-vue'

const TOPIC_SLUG = 'color-right'
/** 单次题目反应时长 */
const TRIAL_MS = 1000
/** 总轮次 */
const TOTAL_ROUNDS = 20

const COLORS = [
  { id: 'black', name: '黑色', value: '#111111' },
  { id: 'white', name: '白色', value: '#f5f5f5' },
  { id: 'red', name: '红色', value: '#e74c3c' },
  { id: 'yellow', name: '黄色', value: '#f1c40f' },
  { id: 'green', name: '绿色', value: '#27ae60' },
  { id: 'purple', name: '紫色', value: '#9b59b6' },
  { id: 'blue', name: '蓝色', value: '#3498db' }
]

export default {
  components: {
    InfoFilled
  },
  tdk: {
    title: '颜色匹配测试 - 在线训练',
    description: '颜色与名称匹配反应测试，共 20 轮判断文字颜色与文字名称是否一致',
    keywords: '颜色匹配, 反应测试, 在线测试'
  },
  data () {
    return {
      // idle | waiting | playing | result
      state: 'idle',
      score: 0,
      finalScore: null,
      totalRounds: TOTAL_ROUNDS,
      roundResults: [],
      wordColor: null,
      inkColor: null,
      trialKey: 0,
      trialResolved: false,
      lastFeedback: '',
      nextButtonPos: { left: '50%', top: '50%' },
      nextButtonReady: false,
      nextButtonTimer: null,
      trialTimer: null,
      submitting: false,
      questionId: null,
      userScores: [],
      userScoreRecords: [],
      dialogWidth: '30%',
      isPortrait: false,
      showStatsDialog: false,
      topicDescription: ''
    }
  },
  computed: {
    hasEnoughScores () {
      return this.userScores.length >= 2
    },
    currentRound () {
      if (this.state === 'playing') {
        return this.roundResults.length + 1
      }
      return Math.min(this.roundResults.length + 1, TOTAL_ROUNDS)
    },
    isMatch () {
      return this.wordColor && this.inkColor && this.wordColor.id === this.inkColor.id
    },
    statusText () {
      if (this.state === 'idle') {
        return '共 20 轮 · 每轮 1 秒钟 · 文字颜色与名称一致时点击，不一致时等待 · 正确 +1，错误 -1'
      }
      if (this.state === 'waiting') {
        const tip = this.lastFeedback ? `${this.lastFeedback} · ` : ''
        return `${tip}第 ${this.currentRound} / ${TOTAL_ROUNDS} 轮 · 点击「下一个」继续`
      }
      if (this.state === 'playing') {
        return `第 ${this.currentRound} / ${TOTAL_ROUNDS} 轮 · 得分 ${this.score} · 文字颜色与名称一致请点击，不一致请等待`
      }
      return `测试结束，本次得分：${this.finalScore}`
    },
    playBoxText () {
      if (this.state === 'idle') {
        return '点击开始'
      }
      if (this.state === 'waiting') {
        return ''
      }
      if (this.state === 'result') {
        return `得分 ${this.finalScore}`
      }
      return this.wordColor?.name || ''
    },
    nextButtonStyle () {
      return {
        left: this.nextButtonPos.left,
        top: this.nextButtonPos.top
      }
    },
    playTextStyle () {
      if (this.state !== 'playing' || !this.inkColor) {
        return {}
      }
      return {
        color: this.inkColor.value
      }
    }
  },
  methods: {
    moment,
    pickColor () {
      return COLORS[Math.floor(Math.random() * COLORS.length)]
    },
    getRoundDotStatus (index) {
      return this.roundResults[index] || 'pending'
    },
    clearTimers () {
      if (this.trialTimer) {
        clearTimeout(this.trialTimer)
        this.trialTimer = null
      }
      if (this.nextButtonTimer) {
        clearTimeout(this.nextButtonTimer)
        this.nextButtonTimer = null
      }
    },
    placeNextButton () {
      this.nextButtonReady = false
      // 预留按钮尺寸边距，避免贴边或与上一点击点重合
      const left = 12 + Math.random() * 62
      const top = 18 + Math.random() * 52
      this.nextButtonPos = {
        left: `${left}%`,
        top: `${top}%`
      }
      this.nextButtonTimer = setTimeout(() => {
        this.nextButtonTimer = null
        this.nextButtonReady = true
      }, 280)
    },
    start () {
      if (this.state === 'waiting' || this.state === 'playing' || this.submitting) {
        return
      }
      this.clearTimers()
      this.score = 0
      this.finalScore = null
      this.roundResults = []
      this.wordColor = null
      this.inkColor = null
      this.lastFeedback = ''
      this.trialResolved = false
      this.nextButtonReady = false
      this.showNextTrial()
    },
    showNextTrial () {
      if (this.roundResults.length >= TOTAL_ROUNDS) {
        this.finishTest()
        return
      }

      this.nextButtonReady = false
      this.state = 'playing'
      this.wordColor = this.pickColor()
      if (Math.random() < 0.5) {
        this.inkColor = this.wordColor
      } else {
        let next = this.pickColor()
        while (next.id === this.wordColor.id) {
          next = this.pickColor()
        }
        this.inkColor = next
      }
      this.trialKey += 1
      this.trialResolved = false
      this.lastFeedback = ''

      this.trialTimer = setTimeout(() => {
        this.trialTimer = null
        this.resolveTrial('timeout')
      }, TRIAL_MS)
    },
    resolveTrial (reason) {
      if (this.state !== 'playing' || this.trialResolved) {
        return
      }

      this.trialResolved = true
      this.clearTimers()

      let success = false
      if (reason === 'click' && this.isMatch) {
        this.score += 1
        this.lastFeedback = '匹配 +1'
        success = true
      } else if (reason === 'timeout' && !this.isMatch) {
        this.score += 1
        this.lastFeedback = '正确跳过 +1'
        success = true
      } else {
        this.score -= 1
        this.lastFeedback = reason === 'timeout' ? '超时 -1' : '误点 -1'
      }

      this.roundResults.push(success ? 'success' : 'failed')
      this.wordColor = null
      this.inkColor = null

      if (this.roundResults.length >= TOTAL_ROUNDS) {
        this.finishTest()
        return
      }

      this.state = 'waiting'
      this.placeNextButton()
    },
    handleClick () {
      if (this.state === 'idle' || this.state === 'result') {
        this.start()
        return
      }
      // waiting 状态只能点「下一个」按钮，忽略面板空白处点击
      if (this.state === 'waiting') {
        return
      }
      if (this.state !== 'playing' || this.trialResolved) {
        return
      }
      this.resolveTrial('click')
    },
    handleNextClick (event) {
      event.stopPropagation()
      if (this.state !== 'waiting' || !this.nextButtonReady) {
        return
      }
      this.showNextTrial()
    },
    async finishTest () {
      if (this.submitting || this.state === 'result') {
        return
      }

      this.clearTimers()
      this.state = 'result'
      this.finalScore = this.score
      this.wordColor = null
      this.inkColor = null
      this.nextButtonReady = false
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
      this.score = 0
      this.finalScore = null
      this.roundResults = []
      this.wordColor = null
      this.inkColor = null
      this.lastFeedback = ''
      this.trialResolved = false
      this.nextButtonReady = false
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

      const scoreCounts = this.userScores.reduce((counts, score) => {
        counts[score] = (counts[score] || 0) + 1
        return counts
      }, {})
      const scores = Object.keys(scoreCounts).map(Number).sort((a, b) => a - b)
      const average = this.userScores.reduce((sum, score) => sum + score, 0) / this.userScores.length
      const option = {
        title: {
          text: '颜色匹配成绩分布',
          subtext: `统计数量 ${this.userScores.length} · 平均得分 ${average.toFixed(1)}`,
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: params => {
            const item = params[0]
            return `得分 ${item.axisValue}<br/>人数：${item.value}`
          }
        },
        grid: {
          top: 82,
          right: 28,
          bottom: 54,
          left: 58
        },
        xAxis: {
          type: 'category',
          name: '得分',
          nameLocation: 'middle',
          nameGap: 34,
          data: scores.map(String)
        },
        yAxis: {
          type: 'value',
          name: '人数',
          minInterval: 1
        },
        series: [
          {
            name: '成绩数量',
            type: 'bar',
            data: scores.map(score => scoreCounts[score]),
            barMaxWidth: 42,
            itemStyle: {
              color: '#409eff',
              borderRadius: [5, 5, 0, 0]
            }
          }
        ]
      }

      let chart = echarts.getInstanceByDom(chartElement)
      if (!chart || chart.isDisposed()) {
        chart = echarts.init(chartElement)
      }
      chart.setOption(option, true)
      chart.resize()
    },
    openStatsDialog () {
      this.showStatsDialog = true
      this.$nextTick(() => {
        this.generateRanking()
      })
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
    <div class="color-right-container">
      <div class="play-box">
        <el-card class="play-card">
          <template v-slot:header>
            <div class="display-area">
              <span class="title">
                颜色匹配
                <el-tooltip :content="topicDescription">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </span>
              <span>
                <span>得分：</span>
                <span class="score-value">{{ state === 'result' ? finalScore : score }}</span>
              </span>
            </div>
          </template>

          <div class="status-area">
            <div class="status-text">{{ statusText }}</div>
            <div class="round-progress" aria-label="20 轮答题结果">
              <span
                v-for="index in totalRounds"
                :key="index"
                :class="['round-dot', `round-dot--${getRoundDotStatus(index - 1)}`]"
              ></span>
            </div>
          </div>

          <div class="play-area">
            <div
              :key="trialKey"
              :class="[
                'play-panel',
                `play-panel--${state}`,
                { 'is-white-ink': state === 'playing' && inkColor?.id === 'white' }
              ]"
              @click="handleClick"
            >
              <span
                v-if="state !== 'waiting'"
                class="play-panel-text"
                :style="playTextStyle"
              >{{ playBoxText }}</span>
              <span v-if="state === 'playing'" class="trial-hint">点击判定</span>
              <button
                v-if="state === 'waiting'"
                type="button"
                class="next-button"
                :class="{ 'is-ready': nextButtonReady }"
                :style="nextButtonStyle"
                :disabled="!nextButtonReady"
                @click="handleNextClick"
              >
                下一个
              </button>
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
              <div v-show="hasEnoughScores" ref="rankingListEcharts" class="ranking-list-echarts"></div>
              <div v-if="!hasEnoughScores" class="ranking-list-echarts ranking-list-echarts-empty">
                数据不足，测试后显示
              </div>
            </el-tab-pane>
            <el-tab-pane label="历史记录">
              <div class="history-list">
                <div v-if="!userScoreRecords.length" class="history-list-empty">暂无记录</div>
                <div v-for="record in userScoreRecords" :key="record.id" class="history-item">
                  <span class="history-item-user">{{ record.user?.name || '匿名' }}</span>
                  <span class="history-item-score">得分 {{ record.answer }}</span>
                  <span class="history-item-time">{{ moment(record.created_at).format('YYYY-MM-DD HH:mm') }}</span>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>

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
              <span class="history-item-score">得分 {{ record.answer }}</span>
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
  padding-top: 12px;

  @include mobile {
    padding-top: 4px;
  }

  .color-right-container {
    display: flex;
    gap: 12px;
    width: 100%;

    @media screen and (max-aspect-ratio: 1/1) {
      width: 100%;
    }

    .title {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .play-box {
      display: flex;
      flex: 0 1 52%;
      justify-content: center;
      min-width: 0;

      @include mobile {
        width: 100%;
        flex: 1 1 auto;
      }

      .play-card {
        width: 100%;
      }

      .display-area {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 16px;

        .score-value {
          display: inline-block;
          min-width: 36px;
          color: #409eff;
          font-weight: bold;
          text-align: center;
        }
      }

      .status-area {
        min-height: 48px;
        padding: 0 4px 8px;
        text-align: center;
      }

      .status-text {
        color: #606266;
        font-size: 13px;
        line-height: 1.4;
      }

      .round-progress {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
        padding-top: 10px;
      }

      .round-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #c0c4cc;
        transition:
          background-color 0.2s ease,
          transform 0.2s ease;

        &--success {
          background-color: #67c23a;
          transform: scale(1.08);
        }

        &--failed {
          background-color: #f56c6c;
          transform: scale(1.08);
        }
      }

      .play-area {
        display: flex;
        justify-content: center;
        min-width: 0;
        padding: 8px 0 12px;
      }

      .play-panel {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        height: 280px;
        border-radius: 12px;
        cursor: pointer;
        user-select: none;
        transition:
          background-color 0.15s ease,
          border-color 0.15s ease,
          transform 0.1s ease;

        @media screen and (max-aspect-ratio: 1/1) {
          height: 200px;
        }

        &:active {
          transform: scale(0.97);
        }

        .play-panel-text {
          font-size: clamp(40px, 8vw, 72px);
          font-weight: bold;
          letter-spacing: 0.08em;
          line-height: 1.2;
          text-align: center;
        }

        .trial-hint {
          position: absolute;
          bottom: 16px;
          color: rgb(255 255 255 / 70%);
          font-size: 12px;
          letter-spacing: 0.08em;
          text-shadow: 0 1px 2px rgb(0 0 0 / 45%);
        }

        &--idle {
          background-color: #ffffff;
          border: 2px solid #dcdfe6;

          .play-panel-text {
            color: #606266;
            font-size: 24px;
            letter-spacing: 0;
          }
        }

        &--countdown {
          background-color: #ecf5ff;
          border: 2px solid #409eff;

          .play-panel-text {
            color: #409eff;
            font-size: clamp(56px, 10vw, 96px);
          }
        }

        &--waiting {
          position: relative;
          background-color: #f5f7fa;
          border: 2px dashed #c0c4cc;
          cursor: default;

          &:active {
            transform: none;
          }
        }

        .next-button {
          position: absolute;
          z-index: 2;
          transform: translate(-50%, -50%);
          min-width: 88px;
          height: 40px;
          padding: 0 16px;
          border: 0;
          border-radius: 999px;
          background: color-mix(in srgb, var(--el-color-primary) 55%, #93c5fd);
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.08em;
          cursor: not-allowed;
          opacity: 0.55;
          box-shadow: 0 4px 12px rgb(64 158 255 / 18%);
          transition:
            opacity 0.18s ease,
            transform 0.18s ease,
            background-color 0.18s ease,
            box-shadow 0.18s ease;
          -webkit-tap-highlight-color: transparent;

          &.is-ready {
            background: var(--el-color-primary, #409eff);
            cursor: pointer;
            opacity: 1;
            box-shadow: 0 6px 16px rgb(64 158 255 / 28%);

            &:hover {
              transform: translate(-50%, -50%) scale(1.04);
            }

            &:active {
              transform: translate(-50%, -50%) scale(0.96);
            }
          }
        }

        &--playing {
          background-color: #1f2937;
          border: 2px solid #374151;

          .play-panel-text {
            text-shadow: 0 1px 2px rgb(0 0 0 / 35%);
          }

          &.is-white-ink .play-panel-text {
            text-shadow:
              0 0 2px rgb(0 0 0 / 45%),
              0 1px 2px rgb(0 0 0 / 35%);
          }

          .trial-hint {
            color: rgb(255 255 255 / 45%);
            text-shadow: none;
          }
        }

        &--result {
          background-color: #409eff;
          border: 2px solid #409eff;

          .play-panel-text {
            color: #ffffff;
            font-size: 36px;
            letter-spacing: 0;
            text-shadow: none;
          }
        }
      }

      .opt-area {
        display: flex;
        justify-content: center;
        gap: 8px;
        padding-top: 8px;
      }
    }

    .ranking-list {
      display: flex;
      flex: 1;
      justify-content: stretch;
      min-width: 260px;
      width: auto;

      .ranking-list-echarts-card {
        display: flex;
        justify-content: center;
        width: 100%;

        .ranking-tabs {
          width: 100%;
        }

        .ranking-list-echarts {
          width: 100%;
          height: 320px;
        }

        .ranking-list-echarts-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 180px;
        }

        .history-list {
          width: 100%;
          max-height: 320px;
          overflow-y: auto;
        }
      }
    }
  }
}

.history-list-empty {
  padding: 24px 0;
  color: #909399;
  text-align: center;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
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
    height: 320px;
  }

  .ranking-list-echarts-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 160px;
    color: #909399;
  }

  .history-list {
    width: 100%;
    max-height: 320px;
    overflow-y: auto;
  }
}
</style>
