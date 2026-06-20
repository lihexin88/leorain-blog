<template>
  <div class="video-memory">
    <el-card class="video-memory-card" shadow="never">
      <div v-loading="loading" class="video-memory-body">
        <div v-if="hasVideo" class="video-memory-content">
          <div class="video-memory-header">
            <div class="video-memory-title">第 {{ videoInfo.num }} 集</div>
            <div class="video-memory-actions">
              <el-button size="small" :disabled="loading" @click="episodeDialogVisible = true"> 选集 </el-button>
              <el-button type="primary" size="small" :disabled="!hasNext || loading" @click="playNextEpisode">
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
      <div class="random-image">
        <el-image
          title="随机图片"
          preview-teleported
          :alt="imageUrl"
          v-if="imageUrl"
          :preview-src-list="[imageUrl]"
          class="image-area"
          fit="cover"
          :src="imageUrl"
        ></el-image>
        <div v-else class="image-area image-area--empty">加载中...</div>
        <div class="image-info">
          <div class="image-info__title">随机图片</div>
          <div class="image-info__list">
            <div class="image-info__item">
              <el-icon class="image-info__icon"><Document /></el-icon>
              <span class="image-info__label">大小</span>
              <span class="image-info__value">{{ humanFilesize(imageSize) }}</span>
            </div>
            <div class="image-info__item">
              <el-icon class="image-info__icon"><PriceTag /></el-icon>
              <span class="image-info__label">标签</span>
              <span class="image-info__value">[开发中]</span>
            </div>
          </div>
          <div class="image-info__actions">
            <el-button size="small" @click="handleSaveImage">保存</el-button>
            <el-button size="small" type="primary" @click="getRandomImage">换一张</el-button>
          </div>
        </div>
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
import { Document, PriceTag } from '@element-plus/icons-vue'
import siteAssetsApi from '@/apis/siteAssets'
import { humanFilesize } from '@/utils/helpers'

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
  name: 'SiteAsset',
  components: { Document, PriceTag },
  data () {
    return {
      loading: false,
      errorMessage: '',
      episodeDialogVisible: false,
      videoInfo: defaultVideoInfo(),
      lastSavedTime: 0,
      imageUrl: null,
      imageSize: 0
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
    humanFilesize,
    async getVideoMemory (num) {
      localStorage.setItem(VIDEO_NUM_STORAGE_KEY, num)
      this.loading = true
      this.errorMessage = ''
      try {
        const response = await siteAssetsApi.getVideoMemory(num)
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
    getRandomImage () {
      siteAssetsApi.takeImage().then(res => {
        this.imageUrl = res.url
        this.imageSize = res.size
      })
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
      const targetTime =
        savedTime > 0
          ? Math.min(savedTime, maxSeekTime)
          : Math.min(DEFAULT_SEEK_TIME, Number.isFinite(duration) ? duration : DEFAULT_SEEK_TIME)
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
    },
    handleSaveImage () {
      if (!this.imageUrl) return
      const link = document.createElement('a')
      link.href = this.imageUrl
      link.download = ''
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  },
  mounted () {
    const num = localStorage.getItem(VIDEO_NUM_STORAGE_KEY) || 1
    this.getVideoMemory(num)
    this.getRandomImage()
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

@include mobile {
  .episode-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
}
.random-image {
  margin-top: 20px;
  display: flex;
  gap: 16px;
  height: 360px;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;

  .image-area {
    width: 55%;
    flex-shrink: 0;
    border-radius: 8px 0 0 8px;

    &--empty {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #c0c4cc;
      font-size: 14px;
      background: #f5f7fa;
    }
  }

  .image-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
    min-width: 0;
    overflow: hidden;

    &__title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      text-align: center;
      padding-bottom: 12px;
      border-bottom: 1px solid #ebeef5;
    }

    &__list {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 14px;
      padding: 16px 0;
    }

    &__item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      line-height: 1;
    }

    &__icon {
      font-size: 14px;
      color: #909399;
      flex-shrink: 0;
    }

    &__label {
      color: #909399;
      flex-shrink: 0;

      &::after {
        content: '：';
      }
    }

    &__value {
      color: #606266;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__actions {
      display: flex;
      justify-content: center;
      gap: 8px;
      padding-top: 16px;
      margin-top: auto;
      border-top: 1px solid #ebeef5;
    }
  }
}

@include mobile {
  .random-image {
    flex-direction: column;
    height: auto;

    .image-area {
      width: 100%;
      height: 220px;
      border-radius: 8px 8px 0 0;
    }

    .image-info {
      padding: 16px;
    }
  }
}
</style>
