<template>
  <div class="video-memory">
    <el-card class="video-memory-card" shadow="never">
      <div v-loading="loading" class="video-memory-body">
        <div v-if="hasVideo" class="video-memory-content">
          <div class="video-memory-header">
            <div class="video-memory-title">第 {{ videoInfo.num }} 集</div>
            <div class="video-memory-actions">
              <el-button size="small" :disabled="loading" @click="episodeDialogVisible = true">
                选集
              </el-button>
              <el-button
                type="primary"
                size="small"
                :disabled="!hasNext || loading"
                @click="playNextEpisode"
              >
                下一集
              </el-button>
            </div>
          </div>
          <div class="video-memory-player">
            <video
              ref="videoRef"
              :src="videoInfo.m3u8_url"
              controls
              playsinline
              class="video-memory-media"
              @loadedmetadata="seekToDefaultPosition"
              @timeupdate="savePlaybackProgress"
              @ended="handleVideoEnded"
            ></video>
          </div>
        </div>
        <el-empty v-else :description="errorMessage || '暂无视频'"></el-empty>
      </div>
    </el-card>

    <el-dialog
      v-model="episodeDialogVisible"
      title="选集"
      width="640px"
      append-to-body
      :style="{ width: 'min(640px, calc(100vw - 32px))' }"
    >
      <div class="episode-grid">
        <el-button
          v-for="episode in episodeOptions"
          :key="episode"
          size="small"
          :type="videoInfo.num === episode ? 'primary' : 'default'"
          @click="selectEpisode(episode)"
        >
          第 {{ episode }} 集
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import videoMemoryApi from '@/apis/videoMemory'

const defaultVideoInfo = () => ({
  next: null,
  num: null,
  m3u8_url: ''
})

const DEFAULT_SEEK_TIME = 100
const TOTAL_EPISODES = 81
const VIDEO_NUM_STORAGE_KEY = 'wlwz_video_memory_num'
const VIDEO_PROGRESS_STORAGE_KEY = 'wlwz_video_memory_progress'
const PROGRESS_SAVE_INTERVAL = 10

export default {
  name: 'VideoMemory',
  data () {
    return {
      loading: false,
      errorMessage: '',
      episodeDialogVisible: false,
      videoInfo: defaultVideoInfo(),
      lastSavedTime: 0
    }
  },
  computed: {
    hasVideo () {
      return Boolean(this.videoInfo.m3u8_url)
    },
    hasNext () {
      return this.videoInfo.next !== null && this.videoInfo.next !== undefined
    },
    episodeOptions () {
      return Array.from({ length: TOTAL_EPISODES }, (_, index) => index + 1)
    }
  },
  methods: {
    async getVideoMemory (num) {
      localStorage.setItem(VIDEO_NUM_STORAGE_KEY, num)
      this.loading = true
      this.errorMessage = ''
      try {
        const response = await videoMemoryApi.getVideoMemory(num)
        if (!response?.m3u8_url) {
          this.videoInfo = defaultVideoInfo()
          this.errorMessage = '暂无可播放视频'
          return
        }
        this.videoInfo = {
          next: response.next ?? null,
          num: response.num,
          m3u8_url: response.m3u8_url
        }
        this.lastSavedTime = this.getSavedPlaybackProgress()
      } catch (error) {
        console.error('获取视频失败:', error)
        this.videoInfo = defaultVideoInfo()
        this.errorMessage = '视频加载失败'
      } finally {
        this.loading = false
      }
    },
    getSavedPlaybackProgress () {
      const savedTime = Number(localStorage.getItem(VIDEO_PROGRESS_STORAGE_KEY))
      return Number.isFinite(savedTime) && savedTime >= 0 ? savedTime : 0
    },
    clearPlaybackProgress () {
      localStorage.removeItem(VIDEO_PROGRESS_STORAGE_KEY)
      this.lastSavedTime = 0
    },
    savePlaybackProgress (force = false) {
      const video = this.$refs.videoRef
      if (!video) {
        return
      }
      const currentTime = Number(video.currentTime || 0)
      if (!Number.isFinite(currentTime) || currentTime < 0) {
        return
      }
      if (!force && (video.paused || video.ended || currentTime - this.lastSavedTime < PROGRESS_SAVE_INTERVAL)) {
        return
      }
      localStorage.setItem(VIDEO_PROGRESS_STORAGE_KEY, String(currentTime))
      this.lastSavedTime = currentTime
    },
    seekToDefaultPosition () {
      const video = this.$refs.videoRef
      if (!video) {
        return
      }
      const duration = Number(video.duration)
      const maxSeekTime = Number.isFinite(duration) && duration > 1 ? duration - 1 : DEFAULT_SEEK_TIME
      const savedTime = this.getSavedPlaybackProgress()
      const targetTime = savedTime > 0 ? Math.min(savedTime, maxSeekTime) : Math.min(DEFAULT_SEEK_TIME, Number.isFinite(duration) ? duration : DEFAULT_SEEK_TIME)
      video.currentTime = Math.max(targetTime, 0)
      this.lastSavedTime = savedTime > 0 ? savedTime : 0
    },
    handleVideoEnded () {
      this.clearPlaybackProgress()
      if (!this.hasNext) {
        return
      }
      this.getVideoMemory(this.videoInfo.next)
    },
    playNextEpisode () {
      if (!this.hasNext) {
        return
      }
      this.clearPlaybackProgress()
      this.getVideoMemory(this.videoInfo.next)
    },
    selectEpisode (episode) {
      this.episodeDialogVisible = false
      this.clearPlaybackProgress()
      this.getVideoMemory(episode)
    }
  },
  mounted () {
    const num = localStorage.getItem(VIDEO_NUM_STORAGE_KEY) || 1
    this.getVideoMemory(num)
  },
  beforeUnmount () {
    this.savePlaybackProgress(true)
  }
}
</script>

<style scoped lang="scss">
.video-memory-card {
  border: none;
}

.video-memory-body {
  min-height: 240px;
}

.video-memory-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-memory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.video-memory-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-memory-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.video-memory-player {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-memory-media {
  width: 100%;
  max-height: 420px;
  display: block;
}

.episode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 12px;
}

@media (max-width: 768px) {
  .episode-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
}
</style>
