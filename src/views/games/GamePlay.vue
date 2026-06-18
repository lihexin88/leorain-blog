<template>
  <div class="game-play-wrapper">
    <el-row :gutter="0" class="game-container">
      <!-- 左侧：键位说明 -->
      <el-col v-if="!isMobile" :xs="24" :sm="6" class="sidebar key-guide">
        <div class="sidebar-header">
          <h5>键位说明</h5>
        </div>
        <div class="guide-content">
          <table class="key-table">
            <thead>
            <tr>
              <th>功能</th>
              <th>按键</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td>开始</td>
              <td>1</td>
            </tr>
            <tr>
              <td>选择</td>
              <td>2</td>
            </tr>
            <tr>
              <td>向上</td>
              <td>W</td>
            </tr>
            <tr>
              <td>向左</td>
              <td>A</td>
            </tr>
            <tr>
              <td>向下</td>
              <td>S</td>
            </tr>
            <tr>
              <td>向右</td>
              <td>D</td>
            </tr>
            <tr>
              <td>A</td>
              <td>J</td>
            </tr>
            <tr>
              <td>B</td>
              <td>K</td>
            </tr>
            </tbody>
          </table>
        </div>
      </el-col>

      <!-- 中间：游戏播放器 -->
      <el-col :xs="24" :sm="12" class="main-content">
        <div class="game-box">
          <div class="game-viewport">
            <nes-player
                v-if="gameUrl"
                ref="nes"
                :url="gameUrl"
                label="Click to Start"
                :width="width"
                :height="height"
                @fps="getFps"
                @success="onSuccess"
                @error="onError"
                @saved="onSaved"
                @loaded="onLoaded"
            />
            <div class="show-fps" v-if="gameUrl && currentFPS !== '0'">
              FPS: {{ currentFPS }}
            </div>
          </div>

          <!-- 移动端虚拟游戏按钮 -->
          <div class="game-buttons" v-if="isMobile">
            <div class="game-buttons-row">
              <div class="dpad">
                <button class="game-btn dpad-btn dpad-up" @touchstart.prevent="pressBtn('up')" @touchend.prevent="releaseBtn('up')" @mousedown.prevent="pressBtn('up')" @mouseup.prevent="releaseBtn('up')">
                  <span class="dpad-arrow">▲</span>
                </button>
                <div class="dpad-middle">
                  <button class="game-btn dpad-btn dpad-left" @touchstart.prevent="pressBtn('left')" @touchend.prevent="releaseBtn('left')" @mousedown.prevent="pressBtn('left')" @mouseup.prevent="releaseBtn('left')">
                    <span class="dpad-arrow">◀</span>
                  </button>
                  <div class="dpad-center"></div>
                  <button class="game-btn dpad-btn dpad-right" @touchstart.prevent="pressBtn('right')" @touchend.prevent="releaseBtn('right')" @mousedown.prevent="pressBtn('right')" @mouseup.prevent="releaseBtn('right')">
                    <span class="dpad-arrow">▶</span>
                  </button>
                </div>
                <button class="game-btn dpad-btn dpad-down" @touchstart.prevent="pressBtn('down')" @touchend.prevent="releaseBtn('down')" @mousedown.prevent="pressBtn('down')" @mouseup.prevent="releaseBtn('down')">
                  <span class="dpad-arrow">▼</span>
                </button>
              </div>
              <div class="action-buttons">
                <div class="action-top">
                  <button class="game-btn action-btn btn-select" @touchstart.prevent="pressBtn('select')" @touchend.prevent="releaseBtn('select')" @mousedown.prevent="pressBtn('select')" @mouseup.prevent="releaseBtn('select')">Select</button>
                  <button class="game-btn action-btn btn-start" @touchstart.prevent="pressBtn('start')" @touchend.prevent="releaseBtn('start')" @mousedown.prevent="pressBtn('start')" @mouseup.prevent="releaseBtn('start')">Start</button>
                </div>
                <div class="action-bottom">
                  <button class="game-btn action-btn btn-b" @touchstart.prevent="pressBtn('b')" @touchend.prevent="releaseBtn('b')" @mousedown.prevent="pressBtn('b')" @mouseup.prevent="releaseBtn('b')">B</button>
                  <button class="game-btn action-btn btn-a" @touchstart.prevent="pressBtn('a')" @touchend.prevent="releaseBtn('a')" @mousedown.prevent="pressBtn('a')" @mouseup.prevent="releaseBtn('a')">A</button>
                </div>
              </div>
            </div>
          </div>

          <div class="game-controls">
            <el-button-group>
              <el-button @click="resetGame">Reset</el-button>
              <el-button @click="stopGame">Stop</el-button>
              <el-button :disabled="saveable" @click="save">Save</el-button>
              <el-button :disabled="saveable" @click="load">Load</el-button>
            </el-button-group>
          </div>
        </div>
      </el-col>

      <!-- 右侧：评论区 -->
      <el-col :xs="24" :sm="6" class="sidebar comment-section">
        <div class="sidebar-header">
          <h5>评论 (Comments)</h5>
        </div>
        <div class="comment-container">
          <comment-area
              v-if="gameId"
              :commentable-id="gameId"
              commentable-type="games"
              :user-avatar="user?.avatar"
              :can-comment="true"
              content-wrapper-class="col-12"
          />
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import api from '@/apis/base'
import NesPlayer from '@/components/NesPlayer.vue'
import CommentArea from '@/components/CommentArea.vue'
import { useUserStore } from '@/store/user'
import { mapState } from 'pinia'

export default {
  name: 'GamePlay',
  components: {
    NesPlayer,
    CommentArea
  },
  props: {
    slug: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      gameId: 0,
      gameUrl: '',
      currentFPS: '0',
      saveable: true,
      gameName: '',
      width: 0,
      height: 0,
      isMobile: false
    }
  },
  computed: {
    ...mapState(useUserStore, ['user'])
  },
  mounted () {
    this.isMobile = window.innerWidth <= 768
    this.fetchGameDetail()
    // 等待渲染后测量一次
    this.$nextTick(() => {
      this.updateViewportSize()
    })
    // 监听窗口尺寸变化
    window.addEventListener('resize', this.updateViewportSize, { passive: true })
  },
  beforeUnmount () {
    window.removeEventListener('resize', this.updateViewportSize)
  },
  watch: {
    slug (newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        this.currentFPS = '0'
        this.saveable = true
        this.fetchGameDetail()
      }
    }
  },
  methods: {
    pressBtn (name) {
      if (this.$refs.nes) this.$refs.nes.pressButton(name)
    },
    releaseBtn (name) {
      if (this.$refs.nes) this.$refs.nes.releaseButton(name)
    },
    updateViewportSize () {
      // 找到视口容器（中间区域可用宽度）
      const el = this.$el.querySelector('.game-viewport')
      if (!el) return
      const w = Math.floor(el.clientWidth || 0)
      if (!w) return
      const h = Math.floor(w * 3 / 4) // 4:3 比例
      if (w !== this.width || h !== this.height) {
        this.width = w
        this.height = h
      }
    },
    async fetchGameDetail () {
      const slug = this.slug
      this.gameUrl = ''
      try {
        const response = await api.get(`/games/${slug}`)
        const data = response.data
        this.gameId = data.id
        this.gameUrl = data.url || data.rom_url
        this.gameName = data.name
      } catch (error) {
        console.error('Failed to fetch game detail:', error)
      }
    },
    getFps (fps) {
      this.currentFPS = fps.toFixed(2)
    },
    resetGame () {
      if (this.$refs.nes) {
        this.$refs.nes.reset()
      }
    },
    stopGame () {
      this.saveable = true
      this.currentFPS = '0'
      if (this.$refs.nes) {
        this.$refs.nes.stop()
      }
    },
    save () {
      if (this.$refs.nes) {
        this.$refs.nes.save(this.gameUrl)
      }
    },
    load () {
      if (this.$refs.nes) {
        this.$refs.nes.load(this.gameUrl)
      }
    },
    onSuccess () {
      this.saveable = false
      console.log('Load successful')
    },
    onError (error) {
      console.log(error)
    },
    onSaved ({ id }) {
      console.log(id + ' saved')
    },
    onLoaded ({ id }) {
      console.log(id + ' loaded')
    }
  }
}
</script>
<style scoped lang="scss">
.game-play-wrapper {
  width: 100%;
  min-height: calc(100vh - 60px);
  background-color: var(--header-bg, rgba(255, 255, 255, 0.9));
  padding: 0;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.game-container {
  max-width: 100%;
  margin: 0;
  display: flex;
}

.sidebar {
  background-color: var(--article-item-bg, rgba(255, 255, 255, 0.81));
  padding: 15px;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease;

  .sidebar-header {
    border-bottom: 1px solid var(--article-border, rgba(0, 0, 0, 0.06));
    margin-bottom: 15px;
    padding-bottom: 5px;

    h5 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--card-text-color, #111827);
    }
  }
}

.key-guide {
  .guide-content {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .key-table {
    width: 80%;
    border-collapse: collapse;
    margin-top: 10px;

    th, td {
      border: 1px solid var(--el-border-color-light, #e4e7ed);
      padding: 8px;
      text-align: center;
      font-size: 0.9rem;
      color: var(--text-color, #111827);
    }

    th {
      background-color: var(--el-fill-color-light, #f5f7fa);
      color: var(--card-text-color, #111827);
    }

    td {
      background-color: var(--el-fill-color-blank, #ffffff);
    }
  }
}

.main-content {
  background-color: var(--header-bg, rgba(255, 255, 255, 0.9));
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: stretch;
  transition: background-color 0.3s ease;

  .game-box {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .game-viewport {
    position: relative;
    width: 100%;
    max-width: 100%;
    box-shadow: var(--article-box-shadow, 0 4px 15px rgba(0, 0, 0, 0.2));
    background: #000;
    line-height: 0;
    border-radius: 4px;
    overflow: hidden;

    .show-fps {
      position: absolute;
      top: 10px;
      left: 10px;
      color: #00ff00;
      font-family: monospace;
      font-size: 12px;
      text-shadow: 1px 1px 2px #000;
      z-index: 10;
    }
  }

  .game-controls {
    margin-top: 20px;
    width: 100%;
    display: flex;
    justify-content: center;

    .el-button {
      padding: 10px 20px;
    }
  }
}

.comment-section {
  .comment-container {
    flex: 1;
    overflow-y: auto;
    background-color: var(--article-item-bg, rgba(255, 255, 255, 0.81));
    border-radius: 4px;
    padding: 10px;
    transition: background-color 0.3s ease;
  }
}

/* 响应式调整 */
@include mobile {
  .game-container {
    flex-direction: column;
  }

  .sidebar, .main-content {
    width: 100% !important;
  }

  .sidebar {
    min-height: 300px;
  }

  .game-viewport {
    width: 100%;
  }

  .game-buttons {
    display: flex;
    justify-content: center;
    margin-top: 12px;
    padding: 10px 0;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
  }

  .game-buttons-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 400px;
    gap: 24px;
  }

  .dpad {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .dpad-middle {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .dpad-center {
    width: 40px;
    height: 40px;
    background: var(--el-fill-color-light, #f5f7fa);
    border-radius: 4px;
  }

  .dpad-btn {
    width: 40px;
    height: 40px;
    background: var(--el-fill-color, #e5e6eb);
    border: 1px solid var(--el-border-color, #dcdfe6);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color, #333);
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.1s;

    &:active {
      background: var(--el-color-primary-light-5, #b3d8ff);
    }
  }

  .dpad-arrow {
    pointer-events: none;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .action-top {
    display: flex;
    gap: 12px;
  }

  .action-bottom {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--el-fill-color, #e5e6eb);
    border: 1px solid var(--el-border-color, #dcdfe6);
    color: var(--text-color, #333);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.1s;

    &:active {
      background: var(--el-color-primary-light-5, #b3d8ff);
    }
  }

  .btn-a, .btn-b {
    width: 56px;
    height: 56px;
    font-size: 15px;
  }

  .btn-start, .btn-select {
    width: 56px;
    height: 28px;
    border-radius: 14px;
    font-size: 11px;
  }
}
</style>
