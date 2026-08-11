<script>
import * as echarts from 'echarts'
import moment from 'moment'
import topic from '@/apis/topic'
import { InfoFilled } from '@element-plus/icons-vue'
import testFullscreen from './mixins/testFullscreen'

export default {
  components: {
    InfoFilled
  },
  mixins: [testFullscreen],
  tdk: {
    title: '反应速度测试 - 在线训练',
    description: '在线反应速度测试工具，测试你的反应时间',
    keywords: '反应速度, 反应时间测试, 在线测试'
  },
  data () {
    return {
      // 状态: idle | waiting | ready | result | tooEarly
      state: 'idle',
      reactionTime: 0,
      delayTimeout: null,
      tooEarlyTimeout: null,
      // turnGreen 双重 rAF 的句柄 + 代数，必须可取消，否则快速点击会读到过期 startTime
      turnGreenRafId: null,
      turnGreenSeq: 0,
      displayRafId: null,
      startTime: null,
      // 标记是否已完成反应（防止 ready 状态下重复触发）
      reacted: false,
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
    stateText () {
      const map = {
        idle: '点击开始，等待变绿后点击',
        waiting: '等待绿色出现...',
        ready: '点击！',
        tooEarly: '太早了！请等待绿色出现',
        result: `${this.reactionTime} 毫秒 - 点击重新测试`
      }
      return map[this.state]
    }
  },
  methods: {
    moment,
    /**
     * 原生 mousedown 事件处理（捕获阶段绑定，最小延迟）
     * 当 state='ready' 时，在事件处理的第一行就捕获 performance.now()，
     * 确保 Vue 响应式系统、DOM 更新等不影响计时精度。
     */
    onBoxMouseDown () {
      // 第一时间捕获时间戳，不做任何其他操作
      const now = performance.now()

      switch (this.state) {
        case 'idle':
          this.startWaiting()
          break
        case 'waiting':
          this.tooEarly()
          break
        case 'ready': {
          if (this.reacted || this.startTime == null) return
          this.reacted = true
          this.cancelTurnGreenRaf()
          this.stopDisplayLoop()
          // 用最早捕获的时间戳计算反应时间
          this.reactionTime = Math.max(0, Math.round(now - this.startTime))
          this.state = 'result'
          this.submitReaction()
          break
        }
        case 'tooEarly':
          this.startWaiting()
          break
        case 'result':
          this.reset()
          this.startWaiting()
          break
      }
    },
    startWaiting () {
      this.clearAllTimers()
      this.state = 'waiting'
      this.reactionTime = 0
      this.startTime = null
      this.reacted = false

      // 随机 1~3 秒延迟
      const delay = 1000 + Math.random() * 2000
      this.delayTimeout = setTimeout(() => {
        this.delayTimeout = null
        this.turnGreen()
      }, delay)
    },
    turnGreen () {
      this.cancelTurnGreenRaf()
      this.stopDisplayLoop()
      this.reacted = false
      // 同步写入新起点，避免 state=ready 后、双重 rAF 完成前点击读到上一轮 startTime
      this.startTime = performance.now()
      this.state = 'ready'
      // 双重 requestAnimationFrame：绿色实际绘制到屏幕后再校准计时起点
      // 第一帧：浏览器计算布局并提交渲染
      // 第二帧：确保上一帧已实际绘制完成
      const seq = this.turnGreenSeq
      this.turnGreenRafId = requestAnimationFrame(() => {
        // 外层已取消时不再挂内层，避免只 cancel 了一个 id 仍漏执行
        if (seq !== this.turnGreenSeq) return
        this.turnGreenRafId = requestAnimationFrame(() => {
          this.turnGreenRafId = null
          if (seq !== this.turnGreenSeq) return
          // 若期间已点击/重置，丢弃过期回调，防止写回错误 startTime
          if (this.state !== 'ready' || this.reacted) return
          this.startTime = performance.now()
          this.startDisplayLoop()
        })
      })
    },
    /**
     * 用 requestAnimationFrame 驱动显示更新，替代 setInterval
     * rAF 与显示器刷新率同步（通常 60Hz），完全不会阻塞事件循环
     */
    startDisplayLoop () {
      this.stopDisplayLoop()
      const tick = () => {
        if (this.state !== 'ready' || this.reacted || this.startTime == null) return
        this.reactionTime = Math.max(0, Math.round(performance.now() - this.startTime))
        this.displayRafId = requestAnimationFrame(tick)
      }
      this.displayRafId = requestAnimationFrame(tick)
    },
    stopDisplayLoop () {
      if (this.displayRafId != null) {
        cancelAnimationFrame(this.displayRafId)
        this.displayRafId = null
      }
    },
    cancelTurnGreenRaf () {
      this.turnGreenSeq += 1
      if (this.turnGreenRafId != null) {
        cancelAnimationFrame(this.turnGreenRafId)
        this.turnGreenRafId = null
      }
    },
    clearTooEarlyTimeout () {
      if (this.tooEarlyTimeout != null) {
        clearTimeout(this.tooEarlyTimeout)
        this.tooEarlyTimeout = null
      }
    },
    clearAllTimers () {
      this.clearDelayTimeout()
      this.clearTooEarlyTimeout()
      this.cancelTurnGreenRaf()
      this.stopDisplayLoop()
    },
    tooEarly () {
      this.clearAllTimers()
      this.startTime = null
      this.state = 'tooEarly'
      // 1.5秒后自动恢复
      this.tooEarlyTimeout = setTimeout(() => {
        this.tooEarlyTimeout = null
        if (this.state === 'tooEarly') {
          this.reset()
        }
      }, 1500)
    },
    reset () {
      this.clearAllTimers()
      this.state = 'idle'
      this.reactionTime = 0
      this.startTime = null
      this.reacted = false
    },
    clearDelayTimeout () {
      if (this.delayTimeout != null) {
        clearTimeout(this.delayTimeout)
        this.delayTimeout = null
      }
    },
    submitReaction () {
      if (this.reactionTime > 1000) {
        this.$message.warning({
          message: '误差太大，不参与排名'
        })
      }
      topic
        .submitTopicAnswers('reaction', [
          {
            question_id: this.questionId,
            answer: this.reactionTime
          }
        ])
        .then(() => {
          this.getAnswers()
        })
    },
    getAnswers () {
      topic.getAnswers('reaction').then(data => {
        this.userScoreRecords = data
        this.userScores = data.map(item => Number(item.answer)).filter(Number.isFinite)
        this.generateRanking()
      })
    },
    getTopic () {
      topic.getTopicDetail('reaction').then(data => {
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

      const mean = this.mean(this.userScores)
      const std = this.standardDeviation(this.userScores, mean)
      const effectiveStd = std || Math.max(mean * 0.05, 1)
      const minAnswer = Math.min(...this.userScores)
      const maxAnswer = Math.max(...this.userScores)
      const minX = Math.max(0, Math.min(minAnswer, mean - effectiveStd * 3))
      const maxX = Math.max(maxAnswer, mean + effectiveStd * 3)
      const step = (maxX - minX) / 120
      const distributionData = Array.from({ length: 121 }, (item, index) => {
        const x = minX + step * index
        return [x, this.normalDensity(x, mean, effectiveStd)]
      })
      const sampleData = this.userScores.map(answer => [answer, this.normalDensity(answer, mean, effectiveStd)])

      const option = {
        title: {
          text: '反应时间正态分布拟合',
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
            return `${params.seriesName}<br/>反应时间：${(answer / 1000).toFixed(3)} 秒<br/>概率密度：${density.toExponential(3)}`
          }
        },
        xAxis: {
          type: 'value',
          name: '反应时间（秒）',
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
    }
  },
  mounted () {
    // 使用原生 addEventListener 捕获阶段绑定 mousedown，绕过 Vue 事件系统开销
    // 捕获阶段 (true) 确保在事件冒泡前就拿到时间戳
    this.$nextTick(() => {
      const box = this.$refs.reactionBox
      if (box) {
        box.addEventListener('mousedown', this.onBoxMouseDown, true)
      }
    })

    this.getUserInfo()
    this.getTopic()
    this.isPortrait = window.matchMedia('(orientation: portrait)').matches
    if (this.isPortrait) {
      this.dialogWidth = '100%'
    }
  },
  beforeUnmount () {
    // 清理所有定时器和事件监听
    this.clearAllTimers()
    const box = this.$refs.reactionBox
    if (box) {
      box.removeEventListener('mousedown', this.onBoxMouseDown, true)
    }
  }
}
</script>

<template>
  <div class="main-box" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="reaction-container">
      <div class="play-box">
        <el-card class="play-card">
          <template v-slot:header>
            <div class="display-area">
              <span class="title">
                反应时间测试
                <el-tooltip :content="topicDescription">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </span>
              <div class="display-meta">
                <span>
                  <span>反应时间：</span><span style="min-width: 70px">{{ reactionTime }}</span
                  ><span>毫秒</span>
                </span>
                <test-fullscreen-button :is-fullscreen="isFullscreen" @toggle="toggleFullscreen" />
              </div>
            </div>
          </template>
          <div class="reaction-area">
            <div ref="reactionBox" :class="['reaction-box', `reaction-box--${state}`]">
              <span class="reaction-box-text">{{ stateText }}</span>
            </div>
          </div>
          <div class="opt-area">
            <el-button v-if="state !== 'idle'" @click="reset"> 重新开始 </el-button>
            <el-button v-if="isPortrait" type="primary" @click="openStatsDialog"> 统计 </el-button>
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
                id="ranking-list-echarts"
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
                  <span class="history-item-score">{{ record.answer }} 毫秒</span>
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
              <span class="history-item-score">{{ record.answer }} 毫秒</span>
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
  @include mobile{
    padding-top: 4px;
  }

  .reaction-container {
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
        font-size: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .reaction-area {
        display: flex;
        justify-content: center;
        padding: 8px 0;
        min-width: 0;
        @include mobile{
          width: 100%;
        }

        .reaction-box {
          width: 100%;
          height: 280px;
          border-radius: 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition:
            background-color 0.15s ease,
            transform 0.1s ease;
          user-select: none;

          @media screen and (max-aspect-ratio: 1/1) {
            width: 100%;
            height: 200px;
          }

          &:active {
            transform: scale(0.97);
          }

          .reaction-box-text {
            font-size: 22px;
            font-weight: bold;
            text-align: center;
            padding: 0 16px;
            @media screen and (max-aspect-ratio: 1/1) {
              font-size: 18px;
            }
          }

          // idle: 白色背景
          &--idle {
            background-color: #ffffff;
            border: 2px solid #dcdfe6;
            .reaction-box-text {
              color: #606266;
            }
          }

          // waiting: 红色背景
          &--waiting {
            background-color: #f56c6c;
            border: 2px solid #f56c6c;
            .reaction-box-text {
              color: #ffffff;
            }
          }

          // ready: 绿色背景
          &--ready {
            background-color: #67c23a;
            border: 2px solid #67c23a;
            .reaction-box-text {
              color: #ffffff;
              font-size: 28px;
              @media screen and (max-aspect-ratio: 1/1) {
                font-size: 24px;
              }
            }
          }

          // tooEarly: 橙色背景
          &--tooEarly {
            background-color: #e6a23c;
            border: 2px solid #e6a23c;
            .reaction-box-text {
              color: #ffffff;
            }
          }

          // result: 蓝色背景
          &--result {
            background-color: #409eff;
            border: 2px solid #409eff;
            .reaction-box-text {
              color: #ffffff;
            }
          }
        }
      }

      .opt-area {
        display: flex;
        justify-content: center;
        gap: 8px;
        padding-top: 10px;
      }
    }

    .ranking-list {
      display: flex;
      flex: 1;
      justify-content: stretch;
      min-width: 260px;
      width: auto;
      .ranking-list-echarts-card {
        width: 100%;
        @media screen and (max-aspect-ratio: 1/1) {
          width: 100%;
        }
        display: flex;
        justify-content: center;
        .ranking-tabs {
          width: 100%;
        }
        .ranking-list-echarts {
          width: 100%;
          height: 320px;
        }
        .ranking-list-echarts-empty {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 180px;
        }
        .history-list {
          width: 100%;
          max-height: 320px;
          overflow-y: auto;
          .history-list-empty {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 24px 0;
            color: #909399;
          }
          .history-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px;
            border-bottom: 1px solid #ebeef5;
            &:last-child {
              border-bottom: none;
            }
            .history-item-user {
              font-weight: 500;
              min-width: 80px;
            }
            .history-item-score {
              color: #409eff;
              font-weight: bold;
            }
            .history-item-time {
              color: #909399;
              font-size: 13px;
            }
          }
        }
      }
    }
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
    justify-content: center;
    align-items: center;
    height: 160px;
    color: #909399;
  }
  .history-list {
    width: 100%;
    max-height: 320px;
    overflow-y: auto;
    .history-list-empty {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px 0;
      color: #909399;
    }
    .history-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border-bottom: 1px solid #ebeef5;
      &:last-child {
        border-bottom: none;
      }
      .history-item-user {
        font-weight: 500;
        min-width: 80px;
      }
      .history-item-score {
        color: #409eff;
        font-weight: bold;
      }
      .history-item-time {
        color: #909399;
        font-size: 13px;
      }
    }
  }
}
</style>
