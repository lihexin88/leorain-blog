<template>
  <div class="shared-asset-container">
    <div v-if="loading" style="text-align:center;padding:60px 0;">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    <div v-else-if="error" style="text-align:center;padding:60px 0;">
      <el-empty :description="error"></el-empty>
    </div>
    <div v-else-if="asset" class="shared-asset-card">
      <AssetCover :asset="asset" :preview="false" @preview="openPreview" />
      <div class="shared-asset-info">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="名称">{{ asset.name }}</el-descriptions-item>
          <el-descriptions-item label="大小">{{ humanFilesize(asset.size) }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ typeLabel(asset.type) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(asset.created_at) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <el-dialog v-model="previewVisible" title="预览" style="max-width: 100%;width: 720px" destroy-on-close>
      <div v-if="previewAsset" style="display:flex;justify-content:center;">
        <video v-if="previewAsset.type === 2" :src="previewAsset.display_url" controls controlslist="nodownload" @contextmenu.prevent style="max-width:100%;max-height:480px;"></video>
        <audio v-else-if="previewAsset.type === 3" :src="previewAsset.display_url" controls controlslist="nodownload"></audio>
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
  margin: 40px auto;
  padding: 0 16px;
}

.shared-asset-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
}

.shared-asset-info {
  margin-top: 16px;
}
:deep(.el-empty__description){
  p{
    color: white;
    font-size: 24px;
    line-height: 24px;
    font-weight: 600;
  }
}
</style>
