<script>
import * as echarts from 'echarts'
import moment from 'moment'
import topic from '@/apis/topic'
import { InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import testFullscreen from './mixins/testFullscreen'

const TOPIC_SLUG = 'guess-word'

const GIVE_UP_QUOTES = [
  '“只要功夫深，铁杵磨成针。”——祝穆',
  '“常常是最后一把钥匙打开了门。”',
  '“不要失去信心，只要坚持不懈，就终会有成果的。”——钱学森'
]

export default {
  components: {
    InfoFilled
  },
  mixins: [testFullscreen],
  tdk: {
    title: '猜词语游戏 - 在线训练',
    description: '猜词语游戏，根据词语长度与相似度提示，逐步猜出目标词语',
    keywords: '猜词语, 词语相似度, 语义游戏, 在线游戏'
  },
  data () {
    return {
      // idle | playing | expired
      state: 'idle',
      index: null,
      length: 0,
      ttl: 0,
      remaining: 0,
      inputWord: '',
      loading: false,
      submitting: false,
      // 记录：{ index: [{ guess, guess_word, similarity }] }
      recordsMap: {},
      countdownTimer: null,
      solved: false,
      revealing: false,
      answerInfo: null,
      lastGuessWord: '',
      words: [],
      showWordsDialog: false,
      giveUpCount: 0,
      userScores: [],
      userScoreRecords: [],
      dialogWidth: '30%',
      isPortrait: false,
      showStatsDialog: false
    }
  },
  computed: {
    hasEnoughScores () {
      return this.userScores.length >= 2
    },
    wordsDialogWidth () {
      return this.isPortrait ? '90%' : '50%'
    },
    records () {
      if (this.index === null) {
        return []
      }
      return this.recordsMap[this.index] || []
    },
    sortedRecords () {
      return [...this.records].sort((a, b) => b.similarity - a.similarity)
    },
    remainingText () {
      const total = Math.max(0, this.remaining)
      const minutes = Math.floor(total / 60)
      const seconds = total % 60
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    },
    statusText () {
      if (this.state === 'idle') {
        return '点击开始，系统会随机生成一个待猜词语'
      }
      if (this.state === 'expired') {
        return '本轮已过期，请重新开始'
      }
      if (this.solved) {
        return '恭喜你，已经猜中！'
      }
      return `词语长度：${this.length} 字 · 剩余时间：${this.remainingText}`
    }
  },
  methods: {
    moment,
    formatSimilarity (similarity) {
      return `${(Number(similarity) * 100).toFixed(2)}%`
    },
    clearTimers () {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer)
        this.countdownTimer = null
      }
    },
    startCountdown () {
      this.clearTimers()
      this.countdownTimer = setInterval(() => {
        if (this.remaining <= 1) {
          this.remaining = 0
          this.clearTimers()
          this.state = 'expired'
          return
        }
        this.remaining -= 1
      }, 1000)
    },
    async start () {
      if (this.loading) {
        return
      }
      this.loading = true
      this.clearTimers()
      this.solved = false
      this.answerInfo = null
      this.lastGuessWord = ''
      this.giveUpCount = 0
      this.inputWord = ''
      try {
        const data = await topic.getSimilarQuestion()
        this.index = data.index
        this.length = data.length
        this.words = Array.isArray(data.words) ? data.words : []
        this.ttl = data.ttl
        this.remaining = data.ttl
        this.state = 'playing'
        if (!this.recordsMap[this.index]) {
          this.recordsMap[this.index] = []
        }
        this.startCountdown()
      } finally {
        this.loading = false
      }
    },
    async submitGuess () {
      if (this.state !== 'playing' || this.solved || this.submitting) {
        return
      }
      const word = this.inputWord.trim()
      if (!word) {
        ElMessage.warning('请输入要猜的词语')
        return
      }
      this.submitting = true
      try {
        const data = await topic.guessWord(this.index, word)
        const record = {
          guess: data.guess,
          guess_word: data.guess_word,
          similarity: Number(data.similarity)
        }
        if (!this.recordsMap[this.index]) {
          this.recordsMap[this.index] = []
        }
        this.recordsMap[this.index].push(record)
        this.lastGuessWord = record.guess_word
        this.inputWord = ''
        if (Number(data.status) === 1) {
          this.solved = true
          this.clearTimers()
          ElMessage.success('恭喜你，猜中了！')
        }
      } finally {
        this.submitting = false
      }
    },
    restart () {
      this.clearTimers()
      this.start()
    },
    async giveUp () {
      if (this.index === null || this.revealing) {
        return
      }
      if (this.giveUpCount < 2) {
        this.giveUpCount += 1
        const quote = GIVE_UP_QUOTES[Math.floor(Math.random() * GIVE_UP_QUOTES.length)]
        ElMessage({
          message: `${this.giveUpCount}/3 ${quote}`,
          type: 'info',
          duration: 3000,
          offset: 420
        })
        return
      }
      this.giveUpCount += 1
      this.revealing = true
      try {
        const data = await topic.guessGetAnswers(this.index)
        this.answerInfo = {
          guess: data.guess,
          word: data.word
        }
        this.solved = true
        this.clearTimers()
      } finally {
        this.revealing = false
      }
    },
    openWordsDialog () {
      this.showWordsDialog = true
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
          text: '猜词语成绩分布',
          subtext: `统计数量 ${this.userScores.length} · 平均猜测次数 ${average.toFixed(1)}`,
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: params => {
            const item = params[0]
            return `猜测次数 ${item.axisValue}<br/>人数：${item.value}`
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
          name: '猜测次数',
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
  <div class="main-box" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="guess-container">
      <div class="play-box">
        <el-card class="play-card">
          <template v-slot:header>
            <div class="display-area">
              <span class="title">
                猜词语游戏
                <el-tooltip content="根据相似度提示，逐步猜出目标词语，相似度越高越接近答案">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </span>
              <div class="display-meta">
                <span v-if="state === 'playing' || state === 'expired'">
                  <span>剩余：</span>
                  <span class="score-value">{{ remainingText }}</span>
                </span>
                <test-fullscreen-button :is-fullscreen="isFullscreen" @toggle="toggleFullscreen" />
              </div>
            </div>
          </template>

          <div class="status-area">
            <div class="status-text">{{ statusText }}</div>
          </div>

          <div v-if="state === 'idle'" class="start-area">
            <el-button type="primary" :loading="loading" @click="start">开始游戏</el-button>
          </div>

          <template v-else>
            <div class="guess-input-area">
              <el-input
                v-model="inputWord"
                :disabled="state !== 'playing' || solved"
                placeholder="随便输入一个词语试试..."
                @keyup.enter="submitGuess"
              />
              <el-button
                type="primary"
                :loading="submitting"
                :disabled="state !== 'playing' || solved"
                @click="submitGuess"
              >
                确定
              </el-button>
              <el-button
                :disabled="state !== 'playing' || solved || !words.length"
                @click="openWordsDialog"
              >
                参考
              </el-button>
            </div>

            <div class="records-area">
              <div v-if="!sortedRecords.length" class="records-empty">
                还没有猜测记录，输入词语开始吧
              </div>
              <div
                v-for="(record, idx) in sortedRecords"
                :key="idx"
                class="record-item"
                :class="{ 'record-item-latest': record.guess_word === lastGuessWord }"
              >
                <span class="record-word">{{ record.guess_word }}</span>
                <div class="record-bar">
                  <div
                    class="record-bar-inner"
                    :style="{ width: formatSimilarity(record.similarity) }"
                  ></div>
                </div>
                <span class="record-similarity">{{ formatSimilarity(record.similarity) }}</span>
              </div>
            </div>

            <div v-if="answerInfo" class="answer-area">
              正确答案：<span class="answer-word">{{ answerInfo.word }}</span>
              <span class="answer-guess">（共猜了 {{ answerInfo.guess }} 次）</span>
            </div>

            <div class="opt-area">
              <el-button type="primary" :loading="loading" @click="restart">重新开始</el-button>
              <el-button
                type="warning"
                :loading="revealing"
                :disabled="state !== 'playing' || solved"
                @click="giveUp"
              >
                猜不出来<span v-if="giveUpCount > 0 && giveUpCount < 3">（{{ giveUpCount }}/3）</span>
              </el-button>
              <el-button v-if="isPortrait" @click="openStatsDialog">统计</el-button>
            </div>
          </template>
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
                  <span class="history-item-score">猜测 {{ record.answer }} 次</span>
                  <span class="history-item-time">{{ moment(record.created_at).format('YYYY-MM-DD HH:mm') }}</span>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>

    <el-dialog v-model="showWordsDialog" title="参考词语" :width="wordsDialogWidth" class="words-dialog">
      <div class="words-list">
        <el-tag v-for="(w, i) in words" :key="i" class="words-tag">{{ w }}</el-tag>
      </div>
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
              <span class="history-item-score">猜测 {{ record.answer }} 次</span>
              <span class="history-item-time">{{ moment(record.created_at).format('YYYY-MM-DD HH:mm') }}</span>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@import './test-fullscreen.scss';

.main-box {
  display: flex;
  justify-content: center;
  padding-top: 12px;

  @include mobile {
    padding-top: 4px;
  }

  .guess-container {
    display: flex;
    gap: 12px;
    width: 100%;

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

      @media screen and (max-aspect-ratio: 1/1) {
        flex: 1 1 auto;
      }

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
          min-width: 48px;
          color: #409eff;
          font-weight: bold;
          text-align: center;
        }
      }

      .status-area {
        min-height: 32px;
        padding: 0 4px 4px;
        text-align: center;
      }

      .status-text {
        color: #606266;
        font-size: 13px;
        line-height: 1.4;
      }

      .start-area {
        display: flex;
        justify-content: center;
        padding: 24px 0;
      }

      .guess-input-area {
        display: flex;
        gap: 8px;
        padding: 8px 0 12px;
      }
    }
  }
}

.words-dialog {
  .words-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .words-tag {
      font-size: 14px;
    }
  }
}

.main-box {
  .guess-container {
    .play-box {

      .records-area {
        max-height: 320px;
        overflow-y: auto;
      }

      .records-empty {
        padding: 24px 0;
        color: #909399;
        text-align: center;
      }

      .record-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 4px;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        &.record-item-latest {
          background: #ecf5ff;
          border-radius: 4px;

          .record-word {
            color: #409eff;
            font-weight: bold;
          }
        }

        .record-word {
          min-width: 72px;
          font-weight: 500;
        }

        .record-bar {
          flex: 1;
          height: 10px;
          border-radius: 5px;
          background: #f0f2f5;
          overflow: hidden;

          .record-bar-inner {
            height: 100%;
            border-radius: 5px;
            background: linear-gradient(90deg, #67c23a, #409eff);
            transition: width 0.3s ease;
          }
        }

        .record-similarity {
          min-width: 68px;
          color: #409eff;
          font-weight: bold;
          text-align: right;
          white-space: nowrap;
        }
      }

      .answer-area {
        padding: 12px 0 0;
        text-align: center;
        color: #303133;

        .answer-word {
          color: #67c23a;
          font-weight: bold;
          font-size: 18px;
        }

        .answer-guess {
          color: #909399;
          font-size: 13px;
        }
      }

      .opt-area {
        display: flex;
        justify-content: center;
        gap: 8px;
        padding-top: 12px;
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
