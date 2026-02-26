<template>
  <div class="user-items-container">
    <el-card shadow="hover" class="records-card">
      <template v-slot:header>
<div  class="card-header">
        <span>我的物资</span>
      </div>
</template>
      <el-table :data="userItems" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="created_at" label="获取时间"></el-table-column>
        <el-table-column label="名称">
          <template v-slot="scope">
            {{ scope.row.origin.data.name }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template v-slot="scope">
            <el-tag size="small" :type="scope.row.type === 'lottery' ? 'warning' : 'success'">
              {{ scope.row.type === 'lottery' ? '刮刮乐' : '钓鱼' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template v-slot="scope">
            <template v-if="scope.row.status === 1">
              <el-button v-if="scope.row.type === 'lottery'" type="primary" size="mini"
                         @click="openExistingLottery(scope.row)">刮开
              </el-button>
              <el-button v-else-if="scope.row.type === 'fish'" type="success" size="mini"
                         @click="exchange(scope.row.id)">兑换
              </el-button>
            </template>
            <span v-else>{{ scope.row.status_display }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="pagination"
        background
        layout="prev, pager, next"
        :total="pagination.total"
        :page-size="pagination.per_page"
        v-model:current-page="currentPage"
        @current-change="handlePageChange"
        class="mt-4 text-center">
      </el-pagination>
    </el-card>

    <!-- Lottery Scratch Modal -->
    <el-dialog v-model="lotteryModalVisible" width="80%" max-width="600px" :before-close="handleCloseModal"
               title="刮刮乐" custom-class="lottery-dialog" @opened="onDialogOpened">
      <div v-if="modalTicket" class="lottery-ticket-wrapper"
           :style="{ backgroundImage: `url(${categoryBackgroundImage})` }">
        <div class="overlay"></div>
        <transition-group
          name="lottery-spot"
          tag="div"
          class="lottery-ticket"
          @mousedown="handleScratchStart"
          @mousemove="handleScratchMove"
          @mouseup="handleScratchEnd"
          @mouseleave="handleScratchEnd"
          @touchstart.prevent="handleScratchStart"
          @touchmove.prevent="handleScratchMove"
          @touchend="handleScratchEnd"
        >
          <div v-for="(spot, index) in modalTicket.spots" :key="modalTicket.id + '-' + index"
               class="scratch-spot-container">
            <div class="prize-area" v-show="canvasesInitialized">
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
import userApi from '@/apis/user'
export default {
  name: 'UserItems',
  props: {
    type: {
      type: String,
      default: 'all'
    }
  },
  data () {
    return {
      userItems: [],
      pagination: null,
      currentPage: 1,
      loading: false,
      lotteryModalVisible: false,
      modalTicket: null,
      currentLotteryUserItemId: null,
      totalWinnings: 0,
      revealedCount: 0,
      isScratching: false,
      canvasesInitialized: false,
      canvasRefs: []
    }
  },
  computed: {
    categoryBackgroundImage () {
      return this.modalTicket && this.modalTicket.category ? this.modalTicket.category.image : ''
    }
  },
  mounted () {
    this.fetchUserItems()
  },
  methods: {
    fetchUserItems (page = 1) {
      this.loading = true
      const params = {
        include: 'origin',
        page
      }
      if (this.type && this.type !== 'all') {
        params.type = this.type
      }
      userApi.getUserItems(params).then(response => {
        this.userItems = response.data
        this.pagination = response.meta.pagination
        this.currentPage = page
      }).catch(error => {
        this.$message.error('获取记录失败')
        console.error(error)
      }).finally(() => {
        this.loading = false
      })
    },
    handlePageChange (newPage) {
      this.fetchUserItems(newPage)
    },
    exchange (userItemId) {
      userApi.exchangeUserItem(userItemId)
        .then(() => {
          this.$message.success('兑换成功!')
          this.fetchUserItems(this.currentPage)
          // 如果父组件有刷新积分的方法可以emit
          this.$emit('after-exchange')
        })
        .catch(error => {
          this.$message.error(error.response.data.messages[0] || '兑换失败')
          console.error(error)
        })
    },
    openExistingLottery (userItem) {
      this.loading = true
      this.canvasesInitialized = false
      userApi.getUserItemDetail(userItem.id, { include: 'origin.data.category' }).then(response => {
        const fullUserItem = response.data
        this.currentLotteryUserItemId = fullUserItem.id
        this.modalTicket = fullUserItem.origin.data
        this.totalWinnings = 0
        this.revealedCount = 0
        this.canvasRefs = []
        this.lotteryModalVisible = true
      }).catch(error => {
        this.$message.error('打开彩票失败')
        console.error(error)
      }).finally(() => {
        this.loading = false
      })
    },
    onDialogOpened () {
      // 在对话框完全打开并渲染后再初始化 canvas，避免 refs 为空
      this.canvasesInitialized = false
      this.$nextTick(() => this.initializeCanvases())
    },
    handleCloseModal () {
      this.lotteryModalVisible = false
      this.modalTicket = null
      this.currentLotteryUserItemId = null
      this.totalWinnings = 0
      this.revealedCount = 0
      this.canvasRefs = []
      this.canvasesInitialized = false
    },
    setCanvasRef (el, index) {
      if (el) this.canvasRefs[index] = el
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
            spot.revealed = false
          }
        })
        this.canvasesInitialized = true
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
      if (this.modalTicket && this.modalTicket.spots) {
        this.modalTicket.spots.forEach((spot, index) => {
          if (!spot.revealed) this.checkReveal(index)
        })
      }
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
      this.totalWinnings = this.modalTicket.spots
        .filter(spot => spot.revealed)
        .reduce((sum, spot) => {
          let prize = 0
          if (spot.symbol === '喜') {
            prize = parseFloat(spot.prize)
          } else if (spot.symbol === '囍') {
            prize = parseFloat(spot.prize) * 2
          }
          if (prize > 0) {
            this.triggerConfetti()
          }
          return sum + prize
        }, 0)
        .toFixed(2)
    },
    triggerConfetti () {
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      function randomInRange (min, max) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(function () {
        const particleCount = 50
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }))
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }))
      }, 250)
      setTimeout(() => clearInterval(interval), 2000)
    },
    redeemTicket () {
      if (!this.currentLotteryUserItemId) return
      userApi.exchangeUserItem(this.currentLotteryUserItemId)
        .then(() => {
          this.$message.success('兑换成功!')
          this.fetchUserItems(this.currentPage)
          this.$emit('after-exchange')
        })
        .catch(error => {
          this.$message.error(error.response.data.messages[0] || '兑换失败')
          console.error(error)
        })
    }
  }
}
</script>

<style scoped>
.lottery-ticket-wrapper {
  position: relative;
  background-size: cover;
  background-position: center;
  padding: 20px;
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.3);
  z-index: 1;
}

.lottery-ticket {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  position: relative;
  z-index: 2;
}

.scratch-spot-container {
  position: relative;
  width: 120px;
  height: 60px;
  border: 2px solid #fff;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fff;
}

.prize-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.symbol {
  font-size: 18px;
  font-weight: bold;
}

.prize {
  font-size: 14px;
  color: #f56c6c;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  cursor: crosshair;
}

.card-footer-custom {
  margin-top: 20px;
  text-align: center;
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
}

.mt-4 {
  margin-top: 1rem;
}

.text-center {
  text-align: center;
}

.text-success {
  color: #67c23a;
}

.font-weight-bold {
  font-weight: bold;
}
</style>
