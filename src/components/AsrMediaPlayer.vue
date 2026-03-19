<template>
  <div class="asr-media-player">
    <div v-if="mediaKind !== 'unsupported' && src" class="asr-media-wrapper">
      <audio
        v-if="mediaKind === 'audio'"
        ref="mediaRef"
        :src="src"
        controls
        class="asr-media"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleTimeUpdate"
        @seeked="handleTimeUpdate"
      ></audio>
      <video
        v-else
        ref="mediaRef"
        :src="src"
        controls
        class="asr-media"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleTimeUpdate"
        @seeked="handleTimeUpdate"
      ></video>
    </div>
    <el-empty v-else description="暂不支持预览该资源"></el-empty>

    <div class="asr-full-text-box">
      <div class="asr-section-title">全文文案</div>
      <div ref="fullTextRef" class="asr-full-text" @scroll="handleTextScroll">
        <template v-if="words.length">
          <span
            v-for="(word, index) in words"
            :key="`${index}-${word.start}-${word.end}`"
            :ref="el => setWordRef(el, index)"
            class="asr-full-text-word"
            :class="{ active: index === activeWordIndex }"
            :title="`${formatTimestamp(word.start)} - ${formatTimestamp(word.end)}`"
            @click="seekTo(word.start)"
          >{{ word.text }}</span>
        </template>
        <template v-else>
          {{ fullText || '-' }}
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AsrMediaPlayer',
  props: {
    src: {
      type: String,
      default: ''
    },
    assetType: {
      type: [String, Number],
      default: null
    },
    words: {
      type: Array,
      default: () => []
    },
    fullText: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      currentMs: 0,
      wordRefs: {},
      autoScrollEnabled: true,
      manualScrollTimer: null
    }
  },
  computed: {
    mediaKind () {
      const assetType = String(this.assetType ?? '')
      const source = this.src || ''
      const audioRegex = /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i
      const videoRegex = /\.(mp4|webm|mov|mkv|avi|rmvb|ogg)(\?.*)?$/i

      if (assetType === '3' || audioRegex.test(source)) {
        return 'audio'
      }
      if (assetType === '2' || videoRegex.test(source)) {
        return 'video'
      }
      return 'unsupported'
    },
    activeWordIndex () {
      return this.words.findIndex(word => this.currentMs >= Number(word.start || 0) && this.currentMs < Number(word.end || 0))
    }
  },
  watch: {
    activeWordIndex () {
      this.scrollActiveWordIntoView()
    }
  },
  methods: {
    handleMediaPlay () {
      this.autoScrollEnabled = true
      this.scrollActiveWordIntoView()
    },
    handleTimeUpdate () {
      const currentTime = this.$refs.mediaRef?.currentTime || 0
      this.currentMs = currentTime * 1000
    },
    handleTextScroll () {
      this.autoScrollEnabled = false
      clearTimeout(this.manualScrollTimer)
      this.manualScrollTimer = setTimeout(() => {
        if (!this.$refs.mediaRef?.paused) {
          this.autoScrollEnabled = true
          this.scrollActiveWordIntoView()
        }
      }, 1500)
    },
    setWordRef (el, index) {
      if (el) {
        this.wordRefs[index] = el
      }
    },
    scrollActiveWordIntoView () {
      if (!this.autoScrollEnabled || this.activeWordIndex < 0) {
        return
      }
      this.$nextTick(() => {
        const wordsList = this.$refs.fullTextRef
        const activeEl = this.wordRefs[this.activeWordIndex]
        if (!wordsList || !activeEl) {
          return
        }

        const listTop = wordsList.scrollTop
        const listHeight = wordsList.clientHeight
        const itemTop = activeEl.offsetTop
        const itemHeight = activeEl.offsetHeight
        const itemBottom = itemTop + itemHeight
        const visibleTop = listTop
        const visibleBottom = listTop + listHeight
        const threshold = Math.max(itemHeight * 1.5, 36)
        const nearTop = itemTop - visibleTop < threshold
        const nearBottom = visibleBottom - itemBottom < threshold

        if (nearTop || nearBottom) {
          const targetTop = Math.max(itemTop - listHeight * 0.35, 0)
          wordsList.scrollTo({
            top: targetTop,
            behavior: 'smooth'
          })
        }
      })
    },
    seekTo (start) {
      if (!this.$refs.mediaRef) {
        return
      }
      this.$refs.mediaRef.currentTime = Number(start || 0) / 1000
      this.autoScrollEnabled = true
      this.handleTimeUpdate()
    },
    formatTimestamp (ms) {
      const totalSeconds = Math.floor(Number(ms || 0) / 1000)
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
      const seconds = String(totalSeconds % 60).padStart(2, '0')
      return `${minutes}:${seconds}`
    }
  },
  mounted () {
    this.$refs.mediaRef?.addEventListener('play', this.handleMediaPlay)
  },
  beforeUnmount () {
    clearTimeout(this.manualScrollTimer)
    this.$refs.mediaRef?.removeEventListener('play', this.handleMediaPlay)
  }
}
</script>

<style scoped lang="scss">
.asr-media-player {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.asr-media-wrapper {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.asr-media {
  width: 100%;
  max-height: 420px;
  display: block;
}

.asr-full-text-box {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #f8fafc;
}

.asr-section-title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.asr-full-text {
  max-height: 260px;
  overflow-y: auto;
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  scroll-behavior: smooth;
}

.asr-full-text-word {
  padding: 0 2px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color .2s ease, color .2s ease;
}

.asr-full-text-word.active {
  background: #dbeafe;
  color: #1d4ed8;
}
</style>
