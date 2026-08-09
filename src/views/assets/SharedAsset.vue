<template>
  <div class="shared-asset-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="shared-asset-status">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <p class="shared-asset-status-text">加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="shared-asset-status">
      <el-empty class="shared-asset-error" :description="error"></el-empty>
    </div>

    <!-- 资源卡片 -->
    <div v-else-if="asset" class="shared-asset-card">
      <div class="shared-asset-header">
        <h2 class="shared-asset-title">{{ asset.name }}</h2>
        <el-tag :type="tagType(asset.type)" size="small" effect="light">{{ typeLabel(asset.type) }}</el-tag>
      </div>

      <AssetCover :asset="asset" :preview="false" @preview="openPreview" />

      <div class="shared-asset-info">
        <el-descriptions :column="1" border size="small" class="shared-asset-descriptions">
          <el-descriptions-item label="大小">{{ humanFilesize(asset.size) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(asset.created_at) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="预览" width="720px" class="shared-asset-dialog" destroy-on-close>
      <div v-if="previewAsset" class="shared-asset-preview-body">
        <video
          v-if="previewAsset.type === 2"
          :src="previewAsset.display_url"
          controls
          controlslist="nodownload"
          class="shared-asset-preview-video"
          @contextmenu.prevent
        ></video>
        <audio
          v-else-if="previewAsset.type === 3"
          :src="previewAsset.display_url"
          controls
          controlslist="nodownload"
          class="shared-asset-preview-audio"
        ></audio>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import api from '@/apis/base'
import AssetCover from '@/components/AssetCover.vue'
import { humanFilesize } from '@/utils/helpers'
import moment from 'moment'
import { Loading } from '@element-plus/icons-vue'

export default {
  name: 'SharedAsset',
  components: { AssetCover, Loading },
  data () {
    return {
      asset: null,
      loading: true,
      error: '',
      previewVisible: false,
      previewAsset: null
    }
  },
  async mounted () {
    document.addEventListener('keydown', this.blockDevTools)
    document.addEventListener('contextmenu', this.blockContextMenu)
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) {
      this.error = '缺少分享参数'
      this.loading = false
      return
    }
    try {
      const res = await api.get('asset_get_share_asset', { params: { code } })
      this.asset = res.data || res
    } catch (err) {
      console.log(err.response.data.messages.join('\n'))
      this.error = err?.response?.data?.messages?.join('\n') || err?.message || '获取分享资源失败'
    } finally {
      this.loading = false
    }
  },
  methods: {
    humanFilesize,
    formatDate (date) {
      if (!date) return '-'
      return moment(date).format('YYYY-MM-DD HH:mm:ss')
    },
    typeLabel (type) {
      const map = { 1: '图片', 2: '视频', 3: '音频', 4: '文件夹' }
      return map[type] || '未知'
    },
    tagType (type) {
      const map = { 1: 'primary', 2: 'success', 3: 'warning', 4: 'info' }
      return map[type] || 'info'
    },
    openPreview (asset) {
      this.previewAsset = asset
      this.previewVisible = true
    },
    blockDevTools (e) {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'U')) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    blockContextMenu (e) {
      e.preventDefault()
    }
  },
  beforeUnmount () {
    document.removeEventListener('keydown', this.blockDevTools)
    document.removeEventListener('contextmenu', this.blockContextMenu)
  }
}
</script>

<style scoped>
.shared-asset-container {
  max-width: 520px;
  margin: 48px auto;
  padding: 0 16px;
  animation: shared-asset-fade-in 0.35s ease both;
}

/* ---------- 资源卡片 ---------- */
.shared-asset-card {
  padding: 24px 24px 20px;
  background: var(--article-item-bg);
  border: 1px solid var(--article-border);
  border-radius: 14px;
  box-shadow: var(--article-box-shadow);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

@media (hover: hover) {
  .shared-asset-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05);
  }
}

/* 卡片头部：名称 + 类型标签 */
.shared-asset-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.shared-asset-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--card-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shared-asset-header :deep(.el-tag) {
  flex-shrink: 0;
}

/* 信息描述区 */
.shared-asset-info {
  margin-top: 20px;
}

.shared-asset-info :deep(.el-descriptions__body) {
  border-radius: 10px;
  overflow: hidden;
}

.shared-asset-info :deep(.el-descriptions__label) {
  font-weight: 500;
  color: var(--muted-text-color);
  white-space: nowrap;
}

/* ---------- 加载 / 错误状态 ---------- */
.shared-asset-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 64px 0;
}

.shared-asset-status .el-icon {
  color: var(--theme-accent-color);
}

.shared-asset-status-text {
  margin: 0;
  font-size: 15px;
  color: var(--muted-text-color);
}

.shared-asset-error :deep(.el-empty__description) p {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--card-text-color);
}

/* ---------- 预览弹窗 ---------- */
.shared-asset-preview-body {
  display: flex;
  justify-content: center;
}

.shared-asset-preview-video {
  max-width: 100%;
  max-height: 480px;
}

.shared-asset-preview-audio {
  width: 100%;
}

/* dialog 通过 teleport 渲染到 body，需用全局样式控制最大宽度 */
:global(.shared-asset-dialog) {
  max-width: calc(100vw - 32px);
}

@keyframes shared-asset-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
