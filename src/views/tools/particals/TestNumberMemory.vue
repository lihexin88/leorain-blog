<script>
import * as echarts from 'echarts'
import { mapActions, mapState } from 'pinia'
import moment from 'moment'
import { InfoFilled } from '@element-plus/icons-vue'
import topic from '@/apis/topic'
import { useUserStore } from '@/store/user'

const TOPIC_SLUG = 'number-memory'
const DISPLAY_DURATION = 300
const MAX_ROUND_ATTEMPTS = 3
const REQUIRED_CORRECT_COUNT = 2

export default {
  components: {
    InfoFilled
  },
  tdk: {
    title: '数字记忆测试 - 在线训练',
    description: '在线数字瞬时记忆测试，通过逐级增长的数字串测试记忆能力',
    keywords: '数字记忆, 瞬时记忆, 记忆力测试, 在线测试'
  },
  data () {
    return {
      state: 'idle',
      numberLength: 4,
      correctCount: 0,
      roundSlots: MAX_ROUND_ATTEMPTS,
      roundResults: [],
      currentNumber: '',
      userAnswer: '',
      wrongAnswer: '',
      failedNumber: '',
      finalScore: null,
      displayTimeout: null,
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
    hasScores () {
      return this.userScores.length > 0
    },
    statusText () {
      if (this.state === 'idle') {
        return `准备测试 · 当前长度 ${this.numberLength} 位`
      }
      if (this.state === 'showing') {
        return `请记住这串数字 · 当前长度 ${this.numberLength} 位`
      }
      if (this.state === 'answering') {
        return `请输入刚才的数字 · 当前长度 ${this.numberLength} 位`
      }
      return `测试结束，本次成绩：记住 ${this.finalScore} 位数字`
    }
  },
  methods: {
    moment,
    ...mapActions(useUserStore, ['setShowLoginDialog']),
    generateNumber () {
      return Array.from({ length: this.numberLength }, () => Math.floor(Math.random() * 10)).join('')
    },
    startQuestion () {
      this.clearDisplayTimeout()
      this.userAnswer = ''
      this.currentNumber = this.generateNumber()
      this.state = 'showing'
      this.displayTimeout = setTimeout(() => {
        this.state = 'answering'
        this.displayTimeout = null
        this.$nextTick(() => {
          this.$refs.answerInput?.focus()
        })
      }, DISPLAY_DURATION)
    },
    clearDisplayTimeout () {
      if (this.displayTimeout) {
        clearTimeout(this.displayTimeout)
        this.displayTimeout = null
      }
    },
    handleAnswerInput (value) {
      this.userAnswer = value.replace(/\D/g, '').slice(0, this.numberLength)
    },
    submitAnswer () {
      if (this.state !== 'answering' || this.submitting || !this.userAnswer) {
        return
      }

      if (this.userAnswer !== this.currentNumber) {
        this.wrongAnswer = this.userAnswer
        this.failedNumber = this.currentNumber
        this.roundResults.push('failed')
        this.resolveRound()
        return
      }

      this.roundResults.push('success')
      this.correctCount += 1
      this.resolveRound()
    },
    resolveRound () {
      if (this.roundResults.length < MAX_ROUND_ATTEMPTS) {
        this.state = 'idle'
        return
      }

      if (this.correctCount >= REQUIRED_CORRECT_COUNT) {
        this.numberLength += 1
        this.correctCount = 0
        this.roundResults = []
        this.wrongAnswer = ''
        this.failedNumber = ''
        this.state = 'idle'
        return
      }

      this.finishTest()
    },
    getRoundDotStatus (index) {
      return this.roundResults[index] || 'pending'
    },
    async finishTest () {
      if (this.state !== 'answering' || this.submitting) {
        return
      }

      this.clearDisplayTimeout()
      this.state = 'result'
      this.finalScore = this.numberLength
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
      this.clearDisplayTimeout()
      this.state = 'idle'
      this.numberLength = 4
      this.correctCount = 0
      this.roundResults = []
      this.currentNumber = ''
      this.userAnswer = ''
      this.wrongAnswer = ''
      this.failedNumber = ''
      this.finalScore = null
      this.submitting = false
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
          text: '数字记忆成绩分布',
          subtext: `统计数量 ${this.userScores.length} · 平均成绩 ${average.toFixed(1)} 位`,
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: params => {
            const item = params[0]
            return `${item.axisValue} 位数字<br/>人数：${item.value}`
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
          name: '数字长度',
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
    this.clearDisplayTimeout()
    window.removeEventListener('resize', this.resizeChart)
    this.disposeCharts()
  }
}
</script>

<template>
  <div class="main-box">
    <div class="number-memory-container">
      <div class="play-box">
        <el-card class="play-card">
          <template v-slot:header>
            <div class="display-area">
              <span class="title">
                数字记忆
                <el-tooltip :content="topicDescription">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </span>
              <span class="level">{{ numberLength }} 位</span>
            </div>
          </template>

          <div class="status-area">
            <div class="status-text">{{ statusText }}</div>
            <div v-if="state !== 'result'" class="round-progress" aria-label="本轮测试结果">
              <span
                v-for="index in roundSlots"
                :key="index"
                :class="['round-dot', `round-dot--${getRoundDotStatus(index - 1)}`]"
              ></span>
            </div>
          </div>
          <div class="memory-area">
            <div class="number-area">
              <div v-if="state === 'showing'" class="number-display" aria-live="polite">
                {{ currentNumber }}
              </div>
              <el-button v-else-if="state === 'idle'" type="primary" size="large" @click="startQuestion">
                点击开始
              </el-button>
              <div v-else-if="state === 'result'" class="result-area">
                <div class="result-title">正确答案：{{ failedNumber || currentNumber }}</div>
                <div class="result-answer">你的答案：{{ wrongAnswer || '未输入' }}</div>
              </div>
            </div>
            <div class="input-area">
              <form v-if="state === 'answering'" class="answer-form" @submit.prevent="submitAnswer">
                <el-input
                  ref="answerInput"
                  :model-value="userAnswer"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  :maxlength="numberLength"
                  placeholder="输入刚才看到的数字"
                  size="large"
                  @input="handleAnswerInput"
                />
                <el-button type="primary" native-type="submit" :disabled="!userAnswer">确认</el-button>
              </form>
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
                  <span class="history-item-score">记住 {{ record.answer }} 位</span>
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
              <span class="history-item-score">记住 {{ record.answer }} 位</span>
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

  .number-memory-container {
    display: flex;
    width: 80%;

    @media screen and (max-aspect-ratio: 1/1) {
      width: 98%;
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
        gap: 24px;
        font-size: 18px;

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

      .status-area {
        min-height: 54px;
        text-align: center;
      }

      .status-text {
        min-height: 24px;
        color: #606266;
      }

      .round-progress {
        display: flex;
        justify-content: center;
        gap: 10px;
        padding-top: 10px;
      }

      .round-dot {
        width: 12px;
        height: 12px;
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

      .memory-area {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: center;
        min-width: 620px;
        height: 400px;
        padding: 20px;

        @media screen and (max-aspect-ratio: 1/1) {
          min-width: 0;
          height: 260px;
          padding: 16px 0;
        }
      }

      .number-area,
      .input-area {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }

      .number-area {
        flex: 1;
        min-height: 160px;
      }

      .input-area {
        min-height: 72px;
      }

      .number-display {
        max-width: 100%;
        overflow-wrap: anywhere;
        color: #303133;
        font-size: clamp(42px, 7vw, 76px);
        font-weight: bold;
        letter-spacing: 0.12em;
        line-height: 1.25;
        text-align: center;
      }

      .answer-form {
        display: flex;
        align-items: center;
        gap: 12px;
        width: min(500px, 100%);

        :deep(.el-input__inner) {
          font-size: 22px;
          letter-spacing: 0.08em;
          text-align: center;
        }

        .el-button {
          align-self: center;
        }
      }

      .result-area {
        color: #303133;
        text-align: center;

        .result-title {
          margin-bottom: 12px;
          font-size: 26px;
          font-weight: bold;
          overflow-wrap: anywhere;
        }

        .result-answer {
          color: #f56c6c;
          font-size: 20px;
          overflow-wrap: anywhere;
        }
      }

      .opt-area {
        display: flex;
        justify-content: center;
        gap: 12px;
        min-height: 32px;
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
