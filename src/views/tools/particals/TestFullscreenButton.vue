<script>
import { markRaw } from 'vue'
import { FullScreen, ScaleToOriginal } from '@element-plus/icons-vue'

export default {
  name: 'TestFullscreenButton',
  props: {
    isFullscreen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle'],
  data () {
    return {
      FullScreenIcon: markRaw(FullScreen),
      ScaleToOriginalIcon: markRaw(ScaleToOriginal)
    }
  }
}
</script>

<template>
  <el-tooltip :content="isFullscreen ? '退出全屏 (Esc)' : '内容区全屏'" placement="top">
    <el-button
      class="test-fullscreen-btn"
      :icon="isFullscreen ? ScaleToOriginalIcon : FullScreenIcon"
      circle
      size="small"
      aria-label="切换内容区全屏"
      @click.stop="$emit('toggle')"
    />
  </el-tooltip>
</template>
