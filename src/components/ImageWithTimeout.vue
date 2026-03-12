<template>
  <div>
    <el-image
        :src="blobUrl"
        fit="contain"
        class="image-with-limit"
    >
      <template v-slot:placeholder>
        <div class="image-slot">
          加载中...
        </div>
      </template>
      <template v-slot:error>
        <div class="image-slot">
          <i style="overflow-x: clip">
            {{ error_alt }}
          </i>
        </div>
      </template>
    </el-image>
  </div>
</template>

<script>
export default {
  props: {
    img_src: { type: String, required: true }, // 图片真实地址
    timeout: { type: Number, default: 5000 }, // 超时时间 ms
    error_alt: { type: String, default: 'error' } // alt
  },
  data () {
    return {
      blobUrl: '',
      controller: null
    }
  },
  mounted () {
    this.loadImage(this.img_src, this.timeout)
  },
  beforeUnmount () {
    // 清理 Blob URL 避免内存泄漏
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl)
    }
    // 页面卸载时中止请求
    if (this.controller) {
      this.controller.abort()
    }
  },
  methods: {
    async loadImage (url, timeout) {
      this.controller = new AbortController()
      const signal = this.controller.signal

      // 超时定时器
      const timer = setTimeout(() => {
        this.controller.abort()
      }, timeout)

      try {
        const res = await fetch(url, { signal })
        // if (!res.ok) throw new Error("图片请求失败");
        const blob = await res.blob()
        this.blobUrl = URL.createObjectURL(blob)
      } catch (err) {
        // if (err.name === "AbortError") {
        //   console.warn("图片加载超时，已中止请求");
        // } else {
        //   console.error("图片加载失败:", err);
        // }
        this.blobUrl = '' // 触发 el-image error slot
      } finally {
        clearTimeout(timer)
      }
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
