<script>
import anime from 'animejs'
import * as echarts from 'echarts'
import { mapState, mapActions } from 'pinia'
import { useUserStore } from '@/store/user'
import moment from 'moment'
import topic from '@/apis/topic'
import { InfoFilled } from '@element-plus/icons-vue'
export default {
  components: {
    InfoFilled
  },
  tdk: {
    title: '舒尔特方格 - 在线训练',
    description: '在线舒尔特方格训练工具，提升专注力和视觉广度',
    keywords: '舒尔特方格, 专注力训练, 视觉训练'
  },
  data () {
    return {
      items: [
        {
          val: 1,
          next: 2
        },
        {
          val: 2,
          next: 3
        },
        {
          val: 3,
          next: 4
        },
        {
          val: 4,
          next: 5
        },
        {
          val: 5,
          next: 6
        },
        {
          val: 6,
          next: 7
        },
        {
          val: 7,
          next: 8
        },
        {
          val: 8,
          next: 9
        },
        {
          val: 9,
          next: 10
        },
        {
          val: 10,
          next: 11
        },
        {
          val: 11,
          next: 12
        },
        {
          val: 12,
          next: 13
        },
        {
          val: 13,
          next: 14
        },
        {
          val: 14,
          next: 15
        },
        {
          val: 15,
          next: 16
        },
        {
          val: 16,
          next: 17
        },
        {
          val: 17,
          next: 18
        },
        {
          val: 18,
          next: 19
        },
        {
          val: 19,
          next: 20
        },
        {
          val: 20,
          next: 21
        },
        {
          val: 21,
          next: 22
        },
        {
          val: 22,
          next: 23
        },
        {
          val: 23,
          next: 24
        },
        {
          val: 24,
          next: 25
        },
        {
          val: 25,
          next: null
        }
      ],
      playNext: 1,
      shuffledArray: [],
      costTime: 0,
      timer: null,
      wrongIndex: null,
      succeed: false,
      lastIndex: null,
      startTime: null,
      unauthorized: false,
      questionId: null,
      userScores: [],
      userScoreRecords: [],
      showUnauthorized: false,
      dialogWidth: '30%',
      resetting: false,
      eliminateEnabled: false,
      isPortrait: false,
      showStatsDialog: false,
      topicDescription: ''
    }
  },
  computed: {
    ...mapState(useUserStore, ['isLoggedIn']),
    hasEnoughScores () {
      return this.userScores.length >= 2
    }
  },
  methods: {
    moment,
    ...mapActions(useUserStore, ['setShowLoginDialog']),
    stop () {
      this.clearCostTimeInterval()
      this.playNext = 1
      this.succeed = false
    },
    getRandomColor (num) {
      // 使用数字作为随机种子
      const hue = (num * 137.508) % 360 // 黄金角近似值，分布均匀
      return `hsl(${hue}, 70%, 50%)`
    },
    clickBox (cur, next) {
      if (cur !== this.playNext) {
        this.wrongIndex = cur
        setTimeout(() => {
          this.wrongIndex = null
        }, 300)
        return false
      }
      if (!this.timer) {
        this.setCostTimeInterval()
      }
      if (cur === this.lastIndex) {
        // 结束
        this.stop()
        this.succeed = true
        // 上报
        topic
          .submitTopicAnswers('schulte', [
            {
              question_id: this.questionId,
              answer: this.costTime
            }
          ])
          .then(() => {
            this.getAnswers()
          })
        return true
      }
      this.playNext = next
    },
    getAnswers () {
      topic.getAnswers('schulte').then(data => {
        this.userScoreRecords = data
        this.userScores = data.map(item => Number(item.answer)).filter(Number.isFinite)
        this.generateRanking()
      })
    },
    clearCostTimeInterval () {
      clearInterval(this.timer)
      this.timer = null
    },
    setCostTimeInterval () {
      if (!this.timer) {
        this.startTime = performance.now()
        this.costTime = 0
        this.timer = setInterval(() => {
          this.costTime = Math.round(performance.now() - this.startTime)
        }, 16)
      }
    },
    getRandomArr (length = 0) {
      let shuffled
      if (length) {
        shuffled = [...this.items].slice(0, length) // 创建副本，不修改原数组
      } else {
        shuffled = [...this.items] // 创建副本，不修改原数组
      }
      this.lastIndex = shuffled[shuffled.length - 1].val
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] // 交换元素
      }
      const animeTimeline = anime.timeline({
        duration: 800,
        easing: 'easeInOutSine'
      })
      animeTimeline.add({
        targets: this.$refs.animatedElement,
        scale: 0,
        rotate: '+=1turn',
        easing: 'easeOutSine',
        duration: 300
      })
      this.shuffledArray = shuffled
      animeTimeline.add({
        targets: this.$refs.animatedElement,
        scale: 1,
        translateX: 0,
        rotate: '+=1turn',
        easing: 'easeInOutQuad',
        duration: 600
      })
      return animeTimeline.finished
    },
    async reset () {
      if (this.resetting) {
        return false
      }
      this.resetting = true
      try {
        this.clearCostTimeInterval()
        await this.getRandomArr()
        this.succeed = false
        this.playNext = 1
      } finally {
        this.resetting = false
      }
    },
    gotoLogin () {
      this.showUnauthorized = false
      this.setShowLoginDialog(true)
    },
    getTopic () {
      topic.getTopicDetail('schulte').then(data => {
        this.questionId = data.questions[0].id
        this.topicDescription = data.description
      })
    },
    getUserInfo () {
      this.getAnswers()
      if (this.isLoggedIn) {
        this.unauthorized = false
        this.showUnauthorized = false
      } else {
        this.unauthorized = true
        this.showUnauthorized = true
      }
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
          text: '训练耗时正态分布拟合',
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
            return `${params.seriesName}<br/>耗时：${(answer / 1000).toFixed(3)} 秒<br/>概率密度：${density.toExponential(3)}`
          }
        },
        xAxis: {
          type: 'value',
          name: '完成耗时（秒）',
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
    this.getRandomArr()
    this.getUserInfo()
    this.getTopic()
    this.isPortrait = window.matchMedia('(orientation: portrait)').matches
    if (this.isPortrait) {
      this.dialogWidth = '100%'
    }
  }
}
</script>

<template>
  <div class="main-box">
    <div class="schulte-container">
      <div class="play-box">
        <el-card class="play-card">
          <template v-slot:header>
            <div class="display-area">
              <span class="title">
                舒尔特表格测试
                <el-tooltip :content="topicDescription">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </span>
              <span>
                <span>用时：</span><span style="min-width: 70px">{{ costTime / 1000 }}</span
                ><span>秒</span>
              </span>
            </div>
          </template>
          <div class="play-area">
            <div ref="animatedElement" class="play-item-container">
              <div
                :class="['play-item']"
                @click="clickBox(cur.val, cur.next)"
                v-for="cur in shuffledArray"
                :key="cur.val"
              >
                <el-button
                  :class="['item-button', wrongIndex === cur.val && 'wrong-item-button']"
                  :style="{ color: getRandomColor(cur.val) }"
                >
                  <span :class="['item-value', eliminateEnabled && cur.val < playNext && 'eliminated-item-value']">
                    {{ cur.val }}
                  </span>
                </el-button>
              </div>
            </div>
          </div>
          <div class="opt-area">
            <el-button :disabled="timer === null" @click="stop"> 停止 </el-button>
            <el-button>{{ playNext }}</el-button>
            <el-button :disabled="resetting" @click="reset"> 重新开始</el-button>
            <el-button
              :type="eliminateEnabled ? 'primary' : 'default'"
              :aria-pressed="eliminateEnabled"
              @click="eliminateEnabled = !eliminateEnabled"
            >
              消除
            </el-button>
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
                  <span class="history-item-score">{{ (Number(record.answer) / 1000).toFixed(3) }} 秒</span>
                  <span class="history-item-time">{{ moment(record.created_at).format('YYYY-MM-DD HH:mm') }}</span>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>
    <el-dialog v-model="succeed"> 恭喜完成！耗时：{{ costTime / 1000 }} 秒 </el-dialog>
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
  padding-top: 12px;
  @include mobile {
    padding-top: 4px;
  }

  .schulte-container {
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

      .play-area {
        display: flex;
        justify-content: center;
        width: 100%;
        min-width: 0;
        @media screen and (max-aspect-ratio: 1/1) {
          width: 100%;
        }

        .play-item-container {
          display: flex;
          flex-wrap: wrap;
          width: min(420px, 100%);

          .play-item {
            cursor: pointer;
            width: 20%;
            aspect-ratio: 1/1;
            border-radius: 3px;
            transition: transform 0.1s ease-out;

            &:active {
              transform: scale(0.95);
            }

            .item-button {
              margin: 0;
              width: 100%;
              height: 100%;
              font-size: 30px;
              display: flex;
              justify-content: center;
              align-items: center;
              @media screen and (max-aspect-ratio: 1/1) {
                transition: font-size ease-in-out 1s;
                font-size: 2.4em;
              }
              font-weight: bold;
              font-family: 'Font Awesome 5 Free';

              .item-value {
                transition: opacity 0.35s ease;
              }

              .eliminated-item-value {
                opacity: 0;
              }
            }

            .wrong-item-button {
              animation: showWrongBackground 0.3s;
            }

            @keyframes showWrongBackground {
              0% {
                background-color: transparent;
              }
              10% {
                background-color: #ffa2c6;
              }
              100% {
                background-color: transparent;
              }
            }
          }

          .play-item:hover {
            background-color: transparent;
          }
        }
      }

      .display-area {
        font-size: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .opt-area {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
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
          @media screen and (max-aspect-ratio: 1/1) {
            width: 100%;
          }
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
