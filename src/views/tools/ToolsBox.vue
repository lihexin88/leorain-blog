<script>
import ToolString from '@/views/tools/ToolString.vue'
import ToolMedia from '@/views/tools/ToolMedia.vue'
import ToolLinux from '@/views/tools/ToolLinux.vue'
import ToolRadix from '@/views/tools/ToolRadix.vue'

export default {
  components: { ToolRadix, ToolLinux, ToolMedia, ToolString }
}
</script>

<template>
  <div class="tools-box">
    <div class="tools-grid">
      <div class="tool-panel">
        <tool-string />
      </div>
      <div class="tool-panel">
        <tool-linux />
      </div>
      <div class="tool-panel">
        <tool-media />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tools-box {
  margin: 0 auto;
  padding: 16px 20px 24px;
  box-sizing: border-box;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.tool-panel {
  min-width: 0;
  height: 100%;
  box-sizing: border-box;

  // 统一四个工具在工具箱中的外层容器样式（各自独立页面仍保留原样式）
  :deep(.tool-coder),
  :deep(.linux-tool),
  :deep(.tool-media-container),
  :deep(.radix-converter-container) {
    max-width: none;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  // 统一卡片外观
  :deep(.el-card) {
    height: 100%;
    border-radius: 8px;
  }

  :deep(.el-card__header) {
    padding: 12px 16px;
    font-weight: 600;
    font-size: 1.05rem;
  }

  :deep(.el-card__body) {
    padding: 16px;
  }

  :deep(.linux-tool .terminal-el) {
    height: 360px;
  }

  // 媒体工具：半宽时改为单列，避免拥挤
  :deep(.tool-media-container .main-layout) {
    flex-direction: column;
    gap: 16px;
  }

  :deep(.tool-media-container .feature-list) {
    font-size: 13px;
    line-height: 1.6;
  }

  // 进制工具：半宽时功能区改为单列
  :deep(.radix-converter-container .radix-sections) {
    grid-template-columns: 1fr;
  }
}

@include tablet {
  .tools-box {
    padding: 12px 12px 20px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@include mobile {
  .tools-box {
    padding: 10px 8px 16px;
  }

  .tool-panel {
    :deep(.el-card__header),
    :deep(.el-card__body) {
      padding: 12px;
    }

    :deep(.linux-tool .terminal-el) {
      height: 280px;
    }
  }
}
</style>
