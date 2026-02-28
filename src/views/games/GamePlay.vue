<template>
  <div class="game-play-wrapper">
    <el-row :gutter="0" class="game-container">
      <!-- 左侧：键位说明 -->
      <el-col :xs="24" :sm="6" class="sidebar key-guide">
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
              <tr><td>开始</td><td>1</td></tr>
              <tr><td>选择</td><td>2</td></tr>
              <tr><td>向上</td><td>W</td></tr>
              <tr><td>向左</td><td>A</td></tr>
              <tr><td>向下</td><td>S</td></tr>
              <tr><td>向右</td><td>D</td></tr>
              <tr><td>A</td><td>J</td></tr>
              <tr><td>B</td><td>K</td></tr>
            </tbody>
          </table>
        </div>
      </el-col>

      <!-- 中间：游戏播放器 -->
      <el-col :xs="24" :sm="12" class="main-content">
        <div class="game-box">
          <div class="game-viewport">
            <nes-vue
              v-if="gameUrl"
              ref="nes"
              :url="gameUrl"
              label="Click to Start"
              :width="width"
              :height="height"
              debugger
              @fps="getFps"
              @success="onSuccess"
              @error="onError"
              @saved="onSaved"
              @loaded="onLoaded"
            />
            <div class="show-fps" v-if="gameUrl">
              FPS: {{ currentFPS }}
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
import { NesVue } from 'nes-vue'
import CommentArea from '@/components/CommentArea.vue'
import { useUserStore } from '@/store/user'
import { mapState } from 'pinia'

export default {
  name: 'GamePlay',
  components: {
    NesVue,
    CommentArea
  },
  data () {
    return {
      gameId: 0,
      gameUrl: '',
      currentFPS: '0',
      saveable: true,
      gameName: '',
      width: 600,
      height: 480
    }
  },
  computed: {
    ...mapState(useUserStore, ['user'])
  },
  mounted () {
    this.fetchGameDetail()
  },
  methods: {
    async fetchGameDetail () {
      const slug = this.$route.params.slug
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
        // this.$refs.nes.gameReset()
      }
    },
    stopGame () {
      this.saveable = true
      this.currentFPS = '0'
      if (this.$refs.nes) {
        // this.$refs.nes.gameStop()
      }
    },
    save () {
      if (this.$refs.nes) {
        // this.$refs.nes.save(this.gameUrl)
      }
    },
    load () {
      if (this.$refs.nes) {
        // this.$refs.nes.load(this.gameUrl)
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
  background-color: #faebd7; // antiquewhite
  padding: 0;
}

.game-container {
  max-width: 100%;
  margin: 0;
  display: flex;
}

.sidebar {
  background-color: #faebd7; // antiquewhite
  padding: 15px;
  display: flex;
  flex-direction: column;

  .sidebar-header {
    border-bottom: 1px solid #e0d5c1;
    margin-bottom: 15px;
    padding-bottom: 5px;

    h5 {
      margin: 0;
      font-size: 1.1rem;
      color: #5d4037;
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
      border: 1px solid #d7ccc8;
      padding: 8px;
      text-align: center;
      font-size: 0.9rem;
    }

    th {
      background-color: #efebe9;
      color: #4e342e;
    }

    td {
      background-color: #fff9f0;
    }
  }
}

.main-content {
  background-color: #faebd7; // antiquewhite
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: flex-start;

  .game-box {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .game-viewport {
    position: relative;
    max-width: 100%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    background: #000;
    line-height: 0;

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
    background-color: #faebd7;
    border-radius: 4px;
    padding: 10px;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .game-container {
    flex-direction: column;
  }

  .sidebar, .main-content {
    width: 100% !important;
  }

  .sidebar {
    min-height: 300px;
  }
}
</style>
