<template>
  <div>
    <div v-if="imageType === 'image'">
      <el-image :style="{maxWidth: maxWidth,borderRadius: '5px',maxHeight: maxHeight}" @click="show = true"
                :src="image_thumbnail" :preview-src-list="[image_src]" :title="title" :alt="title"></el-image>
    </div>
    <div v-else-if="imageType === 'video'">
      <video style="max-width: 100%" :src="image_src" controls autoplay></video>
    </div>
  </div>
</template>
<script>

export default {
  components: {},
  props: {
    image_src: {
      type: String,
      default: null
    },
    title: {
      type: String,
      default: '图片'
    },
    alt: {
      type: String,
      default: '图片'
    },
    is_zoom: {
      type: Boolean,
      default: true
    },
    maxWidth: {
      type: String,
      default: '220px'
    },
    maxHeight: {
      type: String,
      default: '220px'
    }
  },
  data () {
    return {
      show: false,
      preview_images: [this.image_src],
      image_thumbnail: this.image_src + '?x-oss-process=articleApi-image'
    }
  },
  computed: {
    imageType () {
      const imageRegex = /\.(jpg|jpeg|png|gif|bmp|webp)$/i
      const videoRegex = /\.(mp4|avi|rmvb|ogg)$/i
      if (imageRegex.test(this.image_src)) {
        return 'image'
      } else if (videoRegex.test(this.image_src)) {
        return 'video'
      } else {
        return false
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>
