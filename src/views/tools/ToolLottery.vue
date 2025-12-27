<template>
  <div class="lottery-container-light">
    <vue-particles
      color="#a0a0a0"
      :particleOpacity="0.4"
      :particlesNumber="60"
      shapeType="circle"
      :particleSize="3"
      linesColor="#c0c0c0"
      :linesWidth="1"
      :lineLinked="true"
      :lineOpacity="0.3"
      :linesDistance="150"
      :moveSpeed="2"
      :hoverEffect="true"
      hoverMode="bubble"
      :clickEffect="true"
      clickMode="repulse"
    >
    </vue-particles>

    <el-row type="flex" justify="center" class="content-row">
      <el-col :xs="24" :sm="22" :md="20" :lg="18" class="main-col">
        <el-row :gutter="20">
          <!-- Left Column: Lottery Game -->
          <el-col :xs="24" :sm="24" :md="12">
            <el-card shadow="hover" class="lottery-card">
              <!-- Card Header -->
              <div slot="header" class="card-header">
                <el-button
                  type="primary"
                  class="start-button"
                  @click="startNewGame"
                  :disabled="!selectedCategory || loading"
                  :loading="loading"
                  round
                >
                  {{ loading ? '加载中...' : '开始新游戏' }}
                </el-button>
              </div>

              <!-- Card Body -->
              <div>
                <!-- User Score -->
                <div class="user-score">
                  当前积分: <strong>{{ userScore }}</strong>
                </div>

                <!-- 1. 分类选择 -->
                <div class="category-selector">
                  <h5 class="text-center mb-3">请选择彩票类型</h5>
                  <div
                    v-for="category in categories"
                    :key="category.id"
                    class="category-item"
                    :class="{ active: selectedCategory && selectedCategory.id === category.id }"
                    @click="selectCategory(category)"
                  >
                    <div class="category-info">
                      <strong>{{ category.name }}</strong>
                      <small class="d-block text-muted">{{ category.description }}</small>
                    </div>
                    <div class="category-count">
                      {{ category.remain_count }} / {{ category.lotteries_count }}
                    </div>
                  </div>
                </div>

                <!-- 2. 免责声明 -->
                <el-alert
                  title="郑重声明"
                  type="warning"
                  description="本模块所有功能仅为纯粹的娱乐、前端技术演示及学习研究用途。所有“奖金”均为虚拟数字，无任何实际价值，不可兑换、提现或用于任何形式的真实交易。本站不提供任何与金钱、数字货币相关的购买、兑换或赌博服务。请勿沉迷，理性娱乐。"
                  :closable="false"
                  show-icon
                  class="mt-4"
                >
                </el-alert>

                <!-- 5. 积分变化记录 -->
                <div v-if="scoreLogs.length > 0" class="score-logs-container mt-4">
                  <h5 class="text-center mb-3">积分变化记录</h5>
                  <div
                    class="timeline-wrapper"
                    v-infinite-scroll="loadMoreScores"
                    :infinite-scroll-disabled="scoreLogLoading || !scoreLogMeta || scoreLogMeta.current_page >= scoreLogMeta.total_pages"
                    infinite-scroll-distance="10"
                  >
                    <el-timeline>
                      <el-timeline-item
                        v-for="log in scoreLogs"
                        :key="log.id"
                        :timestamp="log.created_at"
                        placement="top"
                      >
                        <el-card>
                          <p>
                            {{ log.change_type_text }}:
                            <span :class="log.value_type === 'increment' ? 'text-success' : 'text-danger'">
                              {{ log.value_type === 'increment' ? '+' : '-' }}{{ log.change_score }}
                            </span>
                          </p>
                        </el-card>
                      </el-timeline-item>
                    </el-timeline>
                    <p v-if="scoreLogLoading" class="text-center">加载中...</p>
                    <p v-if="!scoreLogLoading && scoreLogMeta && scoreLogMeta.current_page >= scoreLogMeta.total_pages" class="text-center">没有更多了</p>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- Right Column: Lottery Records -->
          <el-col :xs="24" :sm="24" :md="12">
            <el-card shadow="hover" class="records-card">
              <div slot="header" class="card-header">
                <span>我的获取记录</span>
              </div>
              <el-table :data="userLotteries" style="width: 100%" v-loading="lotteryRecordsLoading">
                <el-table-column prop="id" label="ID" width="80"></el-table-column>
                <el-table-column prop="created_at" label="获取时间"></el-table-column>
                <el-table-column label="名称">
                  <template slot-scope="scope">
                    {{ scope.row.origin.data.name }}
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="80">
                  <template slot-scope="scope">
                    <el-button v-if="scope.row.status === 1" type="primary" size="mini" @click="openExistingLottery(scope.row)">刮开</el-button>
                    <span v-else>{{ scope.row.status_display }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <el-pagination
                v-if="userLotteriesMeta"
                background
                layout="prev, pager, next"
                :total="userLotteriesMeta.total"
                :page-size="userLotteriesMeta.per_page"
                :current-page.sync="lotteryCurrentPage"
                @current-change="handleLotteryPageChange"
                class="mt-4 text-center">
              </el-pagination>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <!-- Lottery Scratch Modal -->
    <el-dialog :visible.sync="lotteryModalVisible" width="80%" max-width="600px" :before-close="handleCloseModal" title="刮刮乐" custom-class="lottery-dialog">
      <div v-if="modalTicket" class="lottery-ticket-wrapper" :style="{ backgroundImage: `url(${categoryBackgroundImage})` }">
        <div class="overlay"></div>
        <transition-group
          name="lottery-spot"
          tag="div"
          class="lottery-ticket"
          @mousedown.native="handleScratchStart"
          @mousemove.native="handleScratchMove"
          @mouseup.native="handleScratchEnd"
          @mouseleave.native="handleScratchEnd"
          @touchstart.native.prevent="handleScratchStart"
          @touchmove.native.prevent="handleScratchMove"
          @touchend.native="handleScratchEnd"
        >
          <div v-for="(spot, index) in modalTicket.spots" :key="modalTicket.id + '-' + index" class="scratch-spot-container">
            <div class="prize-area">
              <span class="symbol">{{ spot.symbol }}</span>
              <span class="prize">￥{{ spot.prize }}</span>
            </div>
            <canvas
              @dblclick="revealSpot(index)"
              :ref="el => setCanvasRef(el, index)"
              width="120"
              height="60"
            ></canvas>
          </div>
        </transition-group>
      </div>
      <div v-if="modalTicket" class="card-footer-custom">
        <h4>总奖金: <span class="text-success font-weight-bold">￥{{ totalWinnings }}</span></h4>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import confetti from 'canvas-confetti'
import Vue from 'vue'
import VueParticles from 'vue-particles'

Vue.use(VueParticles)

export default {
  data () {
    return {
      categories: [],
      selectedCategory: null,
      modalTicket: null,
      lotteryModalVisible: false,
      currentLotteryUserItemId: null, // To store the user_item id for redemption
      totalWinnings: 0,
      isScratching: false,
      canvasRefs: [],
      revealedCount: 0,
      loading: false,
      userScore: 0,
      scoreLogs: [],
      scoreLogMeta: null,
      scoreLogLoading: false,
      userLotteries: [],
      userLotteriesMeta: null,
      lotteryRecordsLoading: false,
      lotteryCurrentPage: 1
    }
  },
  computed: {
    categoryBackgroundImage () {
      if (this.modalTicket && this.modalTicket.category) {
        return this.modalTicket.category.image
      }
      return this.selectedCategory ? this.selectedCategory.image : ''
    }
  },
  methods: {
    fetchUserLotteries (page = 1) {
      this.lotteryRecordsLoading = true
      this.$http.get('frontend/user-items', {
        params: {
          type: 'lottery',
          include: 'origin',
          page
        }
      }).then(response => {
        this.userLotteries = response.data.data
        this.userLotteriesMeta = response.data.meta.pagination
        this.lotteryCurrentPage = page
      }).catch(error => {
        this.$message.error('获取记录失败')
        console.error(error)
      }).finally(() => {
        this.lotteryRecordsLoading = false
      })
    },
    handleLotteryPageChange (newPage) {
      this.fetchUserLotteries(newPage)
    },
    setCanvasRef (el, index) {
      if (el) this.canvasRefs[index] = el
    },
    async fetchCategories () {
      this.loading = true
      try {
        const response = await this.$http.get('/frontend/lottery-categories')
        this.categories = response.data
      } catch (error) {
        this.$message.error('获取彩票分类失败！')
      } finally {
        this.loading = false
      }
    },
    async fetchUserScore () {
      try {
        const response = await this.$http.get('/frontend/user/score')
        this.userScore = response.data.score
      } catch (error) {
        if (error.status === 401) {
          this.openLogin()
        }
        // Silently fail or show a non-intrusive message
        console.error('Failed to fetch user score:', error)
      }
    },
    async fetchScoreLogs () {
      if (this.scoreLogLoading) return
      this.scoreLogLoading = true
      try {
        const response = await this.$http.get('/frontend/user/score-log', {
          params: {
            include: 'origin'
          }
        })
        this.scoreLogs = response.data.data
        this.scoreLogMeta = response.data.meta.pagination
      } catch (error) {
        console.error('Failed to fetch score logs:', error)
      } finally {
        this.scoreLogLoading = false
      }
    },
    async loadMoreScores () {
      if (this.scoreLogLoading || !this.scoreLogMeta || this.scoreLogMeta.current_page >= this.scoreLogMeta.total_pages) {
        return
      }
      this.scoreLogLoading = true
      try {
        const nextPage = this.scoreLogMeta.current_page + 1
        const response = await this.$http.get('/frontend/user/score-log', {
          params: {
            page: nextPage,
            include: 'origin'
          }
        })
        this.scoreLogs = this.scoreLogs.concat(response.data.data)
        this.scoreLogMeta = response.data.meta.pagination
      } catch (error) {
        console.error('Failed to load more score logs:', error)
      } finally {
        this.scoreLogLoading = false
      }
    },
    selectCategory (category) {
      this.selectedCategory = category
    },
    openLogin () {
      this.$confirm('您需要登录后才能访问，是否跳转到登录页面？', '请登录', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        window.location.href = '/login'
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消'
        })
      })
    },
    startNewGame () {
      if (!this.selectedCategory) {
        this.$message.warning('请先选择一个彩票类型')
        return
      }
      this.loading = true
      this.modalTicket = null

      this.$http.get(`/frontend/lottery-categories/${this.selectedCategory.id}/draw`, {
        params: { include: 'origin.data.category' }
      }).then((response) => {
        const userItem = response.data.data
        this.currentLotteryUserItemId = userItem.id
        this.modalTicket = userItem.origin.data
        this.totalWinnings = 0
        this.revealedCount = 0
        this.canvasRefs = []
        this.lotteryModalVisible = true
        this.$nextTick(() => this.initializeCanvases())
        this.fetchUserScore() // Refresh score after getting a new ticket
        this.fetchScoreLogs()
        this.fetchCategories()
        this.fetchUserLotteries(this.lotteryCurrentPage) // Refresh lottery list
      }).catch((error) => {
        if (error.response.status === 401) {
          this.openLogin()
        } else if (error.response.status === 400) {
          console.log(error)
          this.$message.error(error.response.data.messages[0] || '无法获取新的彩票，可能已经全部被抽取！')
        } else if (error.response.status === 429) {
          this.$message.error('请求太快了，请稍后再试！')
        } else {
          console.log(error.response.data.messages)
          this.$message.error(error.response.data.messages[0] || '无法获取新的彩票，可能已经全部被抽取！')
          console.error('Failed to draw a new lottery ticket:', error)
        }
      }).finally(() => {
        this.loading = false
      })
    },
    openExistingLottery (userItem) {
      this.lotteryRecordsLoading = true
      this.$http.get(`frontend/user-items/${userItem.id}`, {
        params: { include: 'origin.data.category' }
      }).then(response => {
        const fullUserItem = response.data.data
        this.currentLotteryUserItemId = fullUserItem.id
        this.modalTicket = fullUserItem.origin.data
        this.selectedCategory = this.modalTicket.category
        this.totalWinnings = 0
        this.revealedCount = 0
        this.canvasRefs = []
        this.lotteryModalVisible = true
        this.$nextTick(() => this.initializeCanvases())
      }).catch(error => {
        this.$message.error('打开彩票失败')
        console.error(error)
      }).finally(() => {
        this.lotteryRecordsLoading = false
      })
    },
    redeemTicket () {
      if (!this.currentLotteryUserItemId) return
      this.$http.post(`frontend/user-items/${this.currentLotteryUserItemId}`)
        .then(response => {
          this.$message.success('兑换成功!')
          this.fetchUserScore()
          this.fetchScoreLogs()
          this.fetchUserLotteries(this.lotteryCurrentPage)
        })
        .catch(error => {
          this.$message.error(error.response.data.messages[0] || '兑换失败')
          console.error(error)
        })
    },
    handleCloseModal () {
      this.lotteryModalVisible = false
      this.modalTicket = null
      this.currentLotteryUserItemId = null
      this.totalWinnings = 0
      this.revealedCount = 0
      this.canvasRefs = []
    },
    initializeCanvases () {
      if (this.modalTicket && this.modalTicket.spots) {
        this.modalTicket.spots.forEach((spot, index) => {
          const canvas = this.canvasRefs[index]
          if (canvas) {
            const ctx = canvas.getContext('2d')
            spot.context = ctx
            ctx.fillStyle = '#B0BEC5'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            spot.revealed = false // Ensure revealed status is reset
          }
        })
      }
    },
    handleScratchStart (event) {
      this.isScratching = true
      this.handleScratchMove(event)
    },
    handleScratchMove (event) {
      if (!this.isScratching || !this.modalTicket) return
      const pos = this.getEventPosition(event)
      for (let i = 0; i < this.canvasRefs.length; i++) {
        const canvas = this.canvasRefs[i]
        if (!canvas) continue
        const rect = canvas.getBoundingClientRect()
        if (pos.x >= rect.left && pos.x <= rect.right && pos.y >= rect.top && pos.y <= rect.bottom) {
          const spot = this.modalTicket.spots[i]
          if (spot.revealed) continue
          const localX = pos.x - rect.left
          const localY = pos.y - rect.top
          this.drawScratch(i, localX, localY)
          break
        }
      }
    },
    handleScratchEnd () {
      if (!this.isScratching) return
      this.isScratching = false
      this.modalTicket.spots.forEach((spot, index) => {
        if (!spot.revealed) this.checkReveal(index)
      })
    },
    getEventPosition (event) {
      if (event.touches && event.touches[0]) {
        return { x: event.touches[0].clientX, y: event.touches[0].clientY }
      }
      return { x: event.clientX, y: event.clientY }
    },
    drawScratch (index, x, y) {
      const spot = this.modalTicket.spots[index]
      const ctx = spot.context
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(x, y, 12, 0, 2 * Math.PI)
      ctx.fill()
    },
    checkReveal (index) {
      if (!this.modalTicket || this.modalTicket.spots[index].revealed) return
      const spot = this.modalTicket.spots[index]
      const canvas = this.canvasRefs[index]
      const imageData = spot.context.getImageData(0, 0, canvas.width, canvas.height)
      let transparentPixels = 0
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] === 0) transparentPixels++
      }
      if ((transparentPixels / (canvas.width * canvas.height)) > 0.5) {
        this.revealSpot(index)
      }
    },
    revealSpot (index) {
      if (!this.modalTicket || this.modalTicket.spots[index].revealed) return
      const spot = this.modalTicket.spots[index]
      spot.revealed = true
      this.revealedCount++
      spot.context.clearRect(0, 0, this.canvasRefs[index].width, this.canvasRefs[index].height)
      this.calculateWinnings()
      if (this.revealedCount === this.modalTicket.spots.length) {
        this.redeemTicket()
      }
    },
    calculateWinnings () {
      let winnings = 0
      this.modalTicket.spots.forEach(spot => {
        if (spot.revealed && spot.is_win) {
          winnings += spot.symbol === '囍' ? spot.prize * 2 : spot.prize
        }
      })
      if (winnings > this.totalWinnings) this.triggerConfetti()
      this.totalWinnings = winnings
    },
    triggerConfetti () {
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }
      function randomInRange (min, max) { return Math.random() * (max - min) + min }
      const interval = setInterval(function () {
        const particleCount = 50
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }))
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }))
      }, 250)
      setTimeout(() => clearInterval(interval), 2000)
    }
  },
  mounted () {
    this.fetchCategories()
    this.fetchUserScore()
    this.fetchScoreLogs()
    this.fetchUserLotteries()
  }
}
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

.lottery-container-light {
  position: relative;
  background-color: #f4f7f6;
  font-family: 'Orbitron', sans-serif;
  color: #333;
  min-height: 100vh;
  padding-top: 20px;
  padding-bottom: 20px;
}

#particles-js {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
}

.content-row {
  position: relative;
  z-index: 2;
}

.main-col {
  padding-left: 10px !important;
  padding-right: 10px !important;
}

.lottery-card, .records-card {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 15px;
  transition: all 0.3s ease;
}

.card-header {
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 15px;
  font-size: 1.2rem;
  font-weight: bold;
  color: #409EFF;
}

.start-button {
  font-size: 1.1rem;
  font-weight: bold;
  transition: all 0.3s ease;

  &:hover, &:focus {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  }
}

.user-score {
  text-align: right;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: #555;
  strong {
    color: #409EFF;
  }
}

.category-selector {
  h5 {
    color: #333;
    font-weight: bold;
  }
}

.category-item {
  padding: 10px 15px;
  border: 1px solid #DCDFE6;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;

  &:hover {
    border-color: #409EFF;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  &.active {
    background-color: #409EFF;
    color: #fff;
    border-color: #409EFF;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    .text-muted {
      color: #f0f0f0 !important;
    }
  }
}

.lottery-ticket-wrapper {
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  padding: 20px;
  overflow: hidden;
  border: 1px solid #eee;
  position: relative;
}

.overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(255, 255, 255, 0.75);
  z-index: 1;
}

.lottery-ticket {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 15px;
  justify-items: center;
  cursor: crosshair;
  user-select: none;
}

.scratch-spot-container {
  position: relative;
  width: 120px; height: 60px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px dashed #999;
  background-color: #fff;
}

.prize-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;

  .symbol { color: #E91E63; font-weight: bold; }
  .prize { color: #4CAF50; font-weight: bold; }
}

.scratch-spot-container canvas {
  position: absolute;
  top: 0;
  left: 0;
  touch-action: none;
}

.card-footer-custom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
  margin-top: 20px;
  h4 {
    color: #333;
  }
  .text-success {
    color: #67C23A;
  }
}

.score-logs-container {
  h5 {
    color: #333;
    font-weight: bold;
  }
}

.timeline-wrapper {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

::v-deep .el-timeline-item__timestamp {
  color: #666;
}

::v-deep .lottery-dialog .el-dialog__body {
  padding: 10px 20px 30px 20px;
}

@media (max-width: 991px) {
  .records-card {
    margin-top: 1.5rem;
  }
}
</style>
