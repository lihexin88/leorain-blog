<template>
  <div>
    <el-image v-if="loaded" :src="displaySrc" fit="contain" class="image-with-limit" />
    <div v-else-if="loading" class="image-with-limit image-slot">加载中...</div>
    <slot v-else name="error">
      <div class="image-with-limit image-slot">
        <i style="overflow-x: clip">{{ error_alt }}</i>
      </div>
    </slot>
  </div>
</template>

<script>
export default {
  props: {
    img_src: { type: String, required: true },
    timeout: { type: Number, default: 5000 },
    error_alt: { type: String, default: 'error' }
  },
  data () {
    return {
      displaySrc: '',
      blobUrl: '',
      loaded: false,
      loading: true,
      preloader: null,
      timer: null
    }
  },
  mounted () {
    this.loadImage(this.img_src, this.timeout)
  },
  beforeUnmount () {
    this.cleanup()
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl)
  },
  methods: {
    cleanup () {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
      if (this.preloader) {
        this.preloader.onload = null
        this.preloader.onerror = null
        this.preloader = null
      }
    },
    settle (src) {
      if (!this.loading) return
      this.cleanup()
      this.loading = false
      if (src) {
        this.displaySrc = src
        this.loaded = true
      }
    },
    // Use Image() preload rather than fetch — fetch on a cross-origin image without CORS
    // headers logs an uncatchable error in the console; <img> loads do not.
    loadImage (url, timeout) {
      this.timer = setTimeout(() => this.settle(null), timeout)
      const img = new Image()
      this.preloader = img
      img.onload = () => this.settle(url)
      img.onerror = () => this.settle(null)
      img.src = url
    }
  }
}
</script>

<style>
.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  max-height: 20px;
  max-width: 150px;
  color: #909399;
  padding: 3px;
  border-radius: 3px;
}

.image-with-limit {
  height: 25px;
  margin: 5px;
}
</style>
