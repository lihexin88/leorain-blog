<script>

import anime from 'animejs'
import * as echarts from 'echarts'
import { mapState } from 'pinia'
import { useUserStore } from '@/store/user'
import schulteApi from '@/apis/schulte'

export default {
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
      chart: null,
      showUnauthorized: false
    }
  },
  computed: {
    ...mapState(useUserStore, ['isLoggedIn'])
  },
  methods: {
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
        schulteApi.submitAnswer({
          question_id: this.questionId,
          answer: this.costTime
        }).then(() => {
          this.getSchultAnswers()
        })
        return true
      }
      this.playNext = next
    },
    getSchultAnswers () {
      schulteApi.getAnswers().then((data) => {
        this.userScores = data.map((item) => {
          return parseInt(item.answer)
        })
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
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] // 交换元素
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
    },
    reset () {
      this.clearCostTimeInterval()
      this.getRandomArr()
      this.succeed = false
      this.playNext = 1
    },
    gotoLogin () {
      window.location.href = '/login'
    },
    getTopic () {
      schulteApi.getTopic().then((data) => {
        this.questionId = data.questions[0].id
      })
    },
    getUserInfo () {
      this.getSchultAnswers()
      if (this.isLoggedIn) {
        this.unauthorized = false
        this.showUnauthorized = false
      } else {
        this.unauthorized = true
        this.showUnauthorized = true
      }
    },
    generateRanking () {
      if (this.userScores.length < 2) {
        this.$refs.rankingListEcharts.innerText = '数据不足，测试后显示'
        return
      }
      this.chart = echarts.init(this.$refs.rankingListEcharts)

      const mean = this.mean(this.userScores)
      const std = this.std(this.userScores, mean)

      // 正态分布曲线数据
      const minX = Math.min(...this.userScores)
      const maxX = Math.max(...this.userScores)
      const normalData = []
      for (let x = minX * 0.8; x <= maxX * 1.2; x += (maxX - minX) / 100) {
        const y = this.normalDistribution(x, mean, std)
        normalData.push([x, y])
      }

      // 散点数据
      const scatterData = this.userScores.map(score => [score, this.normalDistribution(score, mean, std)])

      const option = {
        title: {
          text: '总统计',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'value',
          name: '耗时(毫秒)'
        },
        yAxis: {
          type: 'value',
          name: ''
        },
        series: [
          {
            name: '完成耗时',
            type: 'line',
            data: normalData,
            smooth: false,
            lineStyle: {
              color: '#3b82f6',
              width: 2
            },
            showSymbol: false
          },
          {
            name: '样本散点',
            type: 'scatter',
            data: scatterData,
            symbolSize: 8,
            itemStyle: {
              color: '#ef4444'
            }
          }
        ]
      }

      this.chart.setOption(option)
    },

    // 均值
    mean (arr) {
      return arr.reduce((a, b) => a + b, 0) / arr.length
    },

    // 标准差
    std (arr, mean) {
      const squareDiffs = arr.map(x => Math.pow(x - mean, 2))
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / arr.length
      return Math.sqrt(avgSquareDiff)
    },

    // 正态分布函数
    normalDistribution (x, mean, std) {
      const coeff = 1 / (std * Math.sqrt(2 * Math.PI))
      const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(std, 2))
      return coeff * Math.exp(exponent) * 10000
    }

  },
  mounted () {
    this.getRandomArr()
    this.getUserInfo()
    this.getTopic()
    if (window.matchMedia('(orientation: portrait)').matches) {
      this.$refs.unauthorizedDialog.style.width = '100%'
    }
  }
}
</script>

<template>
  <div class="main-box">
    <div class="schulte-container">
      <div class="play-box">
        <el-card>
          <div class="display-area">
            <span>用时：</span><span style="min-width: 70px">{{ costTime / 1000 }}</span><span>秒</span>
          </div>
          <div class="play-area">
            <div ref="animatedElement" class="play-item-container">
              <div :class="['play-item',]" @click="clickBox(cur.val,cur.next)" v-for="(cur,index) in shuffledArray"
                   :key="index">
                <el-button :class="['item-button', wrongIndex === cur.val && 'wrong-item-button']"
                           :style="{ color:  getRandomColor(cur.val)}">
                  {{ cur.val }}
                </el-button>
              </div>
            </div>
          </div>
          <div class="opt-area">
            <el-button v-if="timer" @click="stop">
              停止
            </el-button>
            <el-button v-else disabled>
              -
            </el-button>
            <el-button @click="reset"> 重新开始</el-button>
          </div>
        </el-card>
      </div>
      <div class="ranking-list draggable-test">
        <el-card class="ranking-list-echarts-card">
          <div ref="rankingListEcharts" id="ranking-list-echarts" class="ranking-list-echarts">
          </div>
        </el-card>
      </div>
    </div>
    <transition>
      <el-dialog v-model="succeed" >
        恭喜完成！耗时：{{ costTime / 1000 }} 秒
      </el-dialog>
    </transition>
    <el-dialog
      v-model="showUnauthorized"
      title="确认登录？"
      ref="unauthorizedDialog"
      width="30%"
      class="unauthorized-dialog"
    >
      <span>登录后可以参与排名，确认登录吗？</span>
      <template v-slot:footer>
<span  class="dialog-footer">
        <el-button @click="showUnauthorized = false">取 消</el-button>
        <el-button type="primary" @click="gotoLogin">确 定</el-button>
      </span>
</template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.main-box {
  display: flex;
  justify-content: center;
  padding-top: 50px;

  .schulte-container {
    width: 80%;
    @media screen and (max-aspect-ratio: 1/1) {
      width: 98%;
    }

    .play-box {
      display: flex;
      justify-content: center;

      .play-area {
        min-width: 768px;
        @media screen and (max-aspect-ratio: 1/1) {
          min-width: 100%;
        }
        width: 50%;
        display: flex;
        justify-content: center;

        .play-item-container {
          display: flex;
          flex-wrap: wrap;
          width: 505px;

          .play-item {
            cursor: pointer;
            width: 20%;
            aspect-ratio: 1/1;
            border-radius: 3px;

            .item-button {
              margin: 0;
              width: 100%;
              height: 100%;
              font-size: 36px;
              display: flex;
              justify-content: center;
              align-items: center;
              @media screen and (max-aspect-ratio: 1/1) {
                transition: font-size ease-in-out 1s;
                font-size: 2.85em;
              }
              font-weight: bold;
              font-family: 'Font Awesome 5 Free';
            }

            .wrong-item-button {
              animation: showWrongBackground .3s;
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
        font-size: 18px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .opt-area {
        display: flex;
        justify-content: center;
        padding-top: 20px;
      }
    }

    .ranking-list {
      display: flex;
      justify-content: center;
      padding-top: 20px;
      .ranking-list-echarts-card {
        width: 80%;
        @media screen and (max-aspect-ratio: 1/1) {
          width: 100%;
        }
        display: flex;
        justify-content: center;
        .ranking-list-echarts {
          width: 100%;
          height: 400px;
          aspect-ratio: 16/9;
          display: flex;
          justify-content: center;
          @media screen and (max-aspect-ratio: 1/1) {
            width: 100vw;
          }
        }
      }
    }
  }
}
</style>
