<template>
  <div class="video-memory">
    <el-card class="video-memory-card" shadow="never">
      <div v-loading="loading" class="video-memory-body">
        <div v-if="hasVideo" class="video-memory-content">
          <div class="video-memory-header">
            <div class="video-memory-title">第 {{ videoInfo.num }} 集</div>
            <el-button
              type="primary"
              size="small"
              :disabled="!hasNext || loading"
              @click="playNextEpisode"
            >
              下一集
            </el-button>
          </div>
          <div class="video-memory-player">
            <video
              ref="videoRef"
              :src="videoInfo.m3u8_url"
              controls
              playsinline
              class="video-memory-media"
              @loadedmetadata="seekToDefaultPosition"
            ></video>
          </div>
        </div>
        <el-empty v-else :description="errorMessage || '暂无视频'"></el-empty>
      </div>
    </el-card>
  </div>
</template>

<script>
import videoMemoryApi from '@/apis/videoMemory'

const defaultVideoInfo = () => ({
  next: null,
  num: null,
  m3u8_url: ''
})

const DEFAULT_SEEK_TIME = 90

export default {
  name: 'VideoMemory',
  data () {
    return {
      loading: false,
      errorMessage: '',
      videoInfo: defaultVideoInfo()
    }
  },
  computed: {
    hasVideo () {
      return Boolean(this.videoInfo.m3u8_url)
    },
    hasNext () {
      return this.videoInfo.next !== null && this.videoInfo.next !== undefined
    }
  },
  methods: {
    async getVideoMemory (num) {
      localStorage.setItem('wlwz_video_memory_num', num)
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
      } catch (error) {
        console.error('获取视频失败:', error)
        this.videoInfo = defaultVideoInfo()
        this.errorMessage = '视频加载失败'
      } finally {
        this.loading = false
      }
    },
    seekToDefaultPosition () {
      const video = this.$refs.videoRef
      if (!video) {
        return
      }
      video.currentTime = Math.min(DEFAULT_SEEK_TIME, Number(video.duration) || DEFAULT_SEEK_TIME)
    },
    playNextEpisode () {
      if (!this.hasNext) {
        return
      }
      this.getVideoMemory(this.videoInfo.next)
    }
  },
  mounted () {
    const num = localStorage.getItem('wlwz_video_memory_num') || 1
    this.getVideoMemory(num)
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
</style>
