<script>
import * as echarts from 'echarts'
import moment from 'moment'
import { InfoFilled } from '@element-plus/icons-vue'
import topic from '@/apis/topic'

const TOPIC_SLUG = 'color-vision'

export default {
  components: {
    InfoFilled
  },
  tdk: {
    title: '色觉测试 - 在线训练',
    description: '在线色觉辨识测试，通过渐进颜色矩阵测试颜色分辨能力',
    keywords: '色觉测试, 颜色辨识, 色彩分辨, 在线测试'
  },
  data () {
    return {
      state: 'ready',
      gridSize: 2,
      correctCount: 0,
      targetIndex: 0,
      wrongIndex: null,
      baseColor: '',
      differentColor: '',
      finalScore: null,
      submitting: false,
      remainingSeconds: 15,
      questionDeadline: null,
      questionTimeout: null,
      countdownInterval: null,
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
    cellCount () {
      return this.gridSize * this.gridSize
    },
    matrixStyle () {
      return {
        gridTemplateColumns: `repeat(${this.gridSize}, 1fr)`
      }
    },
    hasScores () {
      return this.userScores.length > 0
    },
    statusText () {
      if (this.state === 'ready') {
        return '点击开始后，找出颜色不同的方块'
      }
      if (this.state === 'result') {
        return `测试结束，本次成绩：${this.finalScore} × ${this.finalScore}`
      }
      return `找出颜色不同的方块 · 当前等级 ${this.correctCount} / 2 · 剩余 ${this.remainingSeconds} 秒`
    }
  },
  methods: {
    moment,
    generateMatrix () {
      const hue = Math.floor(Math.random() * 360)
      const saturation = 58 + Math.floor(Math.random() * 18)
      const lightness = 42 + Math.floor(Math.random() * 17)
      const difference = Math.max(2.5, 11 - (this.gridSize - 2) * 0.8)
      const direction = lightness + difference <= 68 ? 1 : -1

      this.baseColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
      this.differentColor = `hsl(${hue}, ${saturation}%, ${lightness + difference * direction}%)`
      this.targetIndex = Math.floor(Math.random() * this.cellCount)
      this.startQuestionTimer()
    },
    startQuestionTimer () {
      this.clearQuestionTimer()
      this.remainingSeconds = 15
      this.questionDeadline = performance.now() + 15000
      this.countdownInterval = setInterval(() => {
        this.remainingSeconds = Math.max(0, Math.ceil((this.questionDeadline - performance.now()) / 1000))
      }, 200)
      this.questionTimeout = setTimeout(() => {
        this.remainingSeconds = 0
        this.finishTest()
      }, 15000)
    },
    clearQuestionTimer () {
      if (this.questionTimeout) {
        clearTimeout(this.questionTimeout)
        this.questionTimeout = null
      }
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval)
        this.countdownInterval = null
      }
      this.questionDeadline = null
    },
    getCellColor (index) {
      return index === this.targetIndex ? this.differentColor : this.baseColor
    },
    getCellClass (index) {
      if (this.state !== 'result') {
        return null
      }
      if (index === this.targetIndex) {
        return 'color-cell--correct'
      }
      if (this.wrongIndex !== null && index === this.wrongIndex) {
        return 'color-cell--wrong'
      }
      return null
    },
    clickCell (index) {
      if (this.state !== 'playing' || this.submitting) {
        return
      }

      if (index !== this.targetIndex) {
        this.wrongIndex = index
        this.finishTest()
        return
      }

      this.correctCount += 1
      if (this.correctCount >= 2) {
        this.gridSize += 1
        this.correctCount = 0
      }
      this.generateMatrix()
    },
    async finishTest () {
      if (this.state !== 'playing' || this.submitting) {
        return
      }

      this.state = 'result'
      this.clearQuestionTimer()
      this.finalScore = this.gridSize
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
    start () {
      this.state = 'playing'
      this.wrongIndex = null
      this.generateMatrix()
    },
    restart () {
      this.clearQuestionTimer()
      this.state = 'playing'
      this.gridSize = 2
      this.correctCount = 0
      this.wrongIndex = null
      this.finalScore = null
      this.submitting = false
      this.generateMatrix()
    },
    async getAnswers () {
      const data = await topic.getAnswers(TOPIC_SLUG)
      this.userScoreRecords = data
      this.userScores = data.map(item => Number(item.answer)).filter(Number.isFinite)
      this.$nextTick(() => {
        this.generateRanking()
      })
    },
    async getTopic () {
      const data = await topic.getTopicDetail(TOPIC_SLUG)
      this.questionId = data.questions[0].id
      this.topicDescription = data.description
    },
    getUserInfo () {
      this.getAnswers()
    },
    generateRanking () {
      const chartElement = this.$refs.rankingListEcharts || this.$refs.rankingListEchartsMobile
      if (!chartElement) {
        return
      }

      if (!this.hasScores) {
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
          text: '色觉测试成绩分布',
          subtext: `统计数量 ${this.userScores.length} · 平均成绩 ${average.toFixed(1)} × ${average.toFixed(1)}`,
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: params => {
            const item = params[0]
            return `${item.axisValue} × ${item.axisValue}<br/>人数：${item.value}`
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
          name: '矩阵宽度',
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
    this.isPortrait = window.matchMedia('(orientation: portrait)').matches
    if (this.isPortrait) {
      this.dialogWidth = '100%'
    }
    this.getUserInfo()
    this.getTopic()
    window.addEventListener('resize', this.resizeChart)
  },
  beforeUnmount () {
    this.clearQuestionTimer()
    window.removeEventListener('resize', this.resizeChart)
    this.disposeCharts()
  }
}
</script>

<template>
  <div class="main-box">
    <div class="color-vision-container">
      <div class="play-box">
        <el-card class="play-card">
          <template v-slot:header>
            <div class="display-area">
              <span class="title">
                色觉测试
                <el-tooltip :content="topicDescription">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </span>
              <span class="level">{{ gridSize }} × {{ gridSize }}</span>
            </div>
          </template>
          <div class="status-text">{{ statusText }}</div>
          <div class="matrix-wrap">
            <el-button v-if="state === 'ready'" class="start-button" type="primary" size="large" @click="start">
              开始
            </el-button>
            <div
              v-else
              :class="['color-matrix', state === 'result' && 'color-matrix--finished']"
              :style="matrixStyle"
            >
              <button
                v-for="index in cellCount"
                :key="index"
                type="button"
                :class="['color-cell', getCellClass(index - 1)]"
                :aria-label="`颜色方块 ${index}`"
                :style="{ backgroundColor: getCellColor(index - 1) }"
                @click="clickCell(index - 1)"
              ></button>
            </div>
          </div>
          <div class="opt-area">
            <el-button v-if="state === 'result'" type="primary" :loading="submitting" @click="restart">
              重新开始
            </el-button>
            <el-button v-if="isPortrait" @click="openStatsDialog">统计</el-button>
          </div>
        </el-card>
      </div>
      <div v-if="!isPortrait" class="ranking-list draggable-test">
        <el-card class="ranking-list-echarts-card">
          <el-tabs class="ranking-tabs">
            <el-tab-pane label="结果统计">
              <div v-show="hasScores" ref="rankingListEcharts" class="ranking-list-echarts"></div>
              <div v-if="!hasScores" class="ranking-list-echarts ranking-list-echarts-empty">
                数据不足，测试后显示
              </div>
            </el-tab-pane>
            <el-tab-pane label="历史记录">
              <div class="history-list">
                <div v-if="!userScoreRecords.length" class="history-list-empty">暂无记录</div>
                <div v-for="record in userScoreRecords" :key="record.id" class="history-item">
                  <span class="history-item-user">{{ record.user?.name || '匿名' }}</span>
                  <span class="history-item-score">{{ record.answer }} × {{ record.answer }}</span>
                  <span class="history-item-time">{{ moment(record.created_at).format('YYYY-MM-DD HH:mm') }}</span>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>
    <el-dialog v-model="showStatsDialog" title="测试统计" :width="dialogWidth" class="stats-dialog">
      <el-tabs class="ranking-tabs">
        <el-tab-pane label="结果统计">
          <div v-show="hasScores" ref="rankingListEchartsMobile" class="ranking-list-echarts"></div>
          <div v-if="!hasScores" class="ranking-list-echarts-empty">数据不足，测试后显示</div>
        </el-tab-pane>
        <el-tab-pane label="历史记录">
          <div class="history-list">
            <div v-if="!userScoreRecords.length" class="history-list-empty">暂无记录</div>
            <div v-for="record in userScoreRecords" :key="record.id" class="history-item">
              <span class="history-item-user">{{ record.user?.name || '匿名' }}</span>
              <span class="history-item-score">{{ record.answer }} × {{ record.answer }}</span>
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
  @include mobile{
    padding-top: 4px;
  }

  .color-vision-container {
    display: flex;
    gap: 12px;
    width: 100%;

    @media screen and (max-aspect-ratio: 1/1) {
      width: 100%;
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
        gap: 16px;
        font-size: 16px;

        .title {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .level {
          color: #409eff;
          font-weight: bold;
        }
      }

      .status-text {
        min-height: 22px;
        margin-bottom: 4px;
        color: #606266;
        text-align: center;
      }

      .matrix-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        min-height: 280px;
        padding: 8px 0 12px;

        .start-button {
          min-width: 120px;
        }

        @media screen and (max-aspect-ratio: 1/1) {
          min-height: 220px;
          padding: 8px 0;
        }
      }

      .color-matrix {
        display: grid;
        gap: clamp(2px, 0.7vw, 6px);
        width: min(360px, 100%);
        max-width: 100%;
        aspect-ratio: 1 / 1;
        padding: 6px;
        border-radius: 12px;
        background-color: #f2f3f5;

        @media screen and (max-aspect-ratio: 1/1) {
          width: min(78vw, 360px);
        }

        &--finished {
          pointer-events: none;
        }
      }

      .color-cell {
        position: relative;
        min-width: 0;
        padding: 0;
        border: 0;
        border-radius: clamp(2px, 0.6vw, 8px);
        cursor: pointer;
        transition:
          transform 0.08s ease,
          filter 0.12s ease,
          box-shadow 0.15s ease;

        &:hover {
          filter: brightness(1.04);
        }

        &:active {
          transform: scale(0.94);
        }

        &:focus-visible {
          outline: 3px solid #409eff;
          outline-offset: 2px;
        }

        &--correct {
          box-shadow:
            0 0 0 3px #67c23a,
            0 0 0 5px rgba(103, 194, 58, 0.28);
          z-index: 1;
        }

        &--wrong {
          box-shadow:
            0 0 0 3px #f56c6c,
            0 0 0 5px rgba(245, 108, 108, 0.28);
          z-index: 1;
        }
      }

      .opt-area {
        display: flex;
        justify-content: center;
        gap: 8px;
        min-height: 32px;
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
