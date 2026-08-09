<template>
  <div v-if="hasContent" class="asset-sidebar">
    <el-tabs v-model="activeTab" class="asset-tabs">
      <el-tab-pane label="ASR 列表" name="asr">
        <div class="asr-tab-content">
          <div class="asr-search-bar">
            <el-tag v-if="currentAsrAsset" closable @close="clearFilter">{{ currentAsrAsset.name }}</el-tag>
            <el-input
              v-model="asrKeywords"
              clearable
              style="width: 280px"
              :prefix-icon="Search"
              placeholder="搜索 ASR 全文"
              @change="loadList(true)"
              @clear="loadList(true)"
            ></el-input>
            <el-button type="primary" @click="loadList(true)">搜索</el-button>
          </div>

          <el-table v-if="asrList.length" :data="asrList" stripe :row-key="getAsrRowKey" class="asr-table">
            <el-table-column type="expand" width="60">
              <template v-slot="scope">
                <div class="asr-expand-content">
                  <AsrMediaPlayer
                    :src="scope.row.asset_display_url"
                    :asset-type="scope.row.asset_type"
                    :words="scope.row.words"
                    :full-text="scope.row.full_text"
                  ></AsrMediaPlayer>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="封面" width="130">
              <template v-slot="scope">
                <div style="display: flex; justify-content: center; align-items: center">
                  <el-image
                    v-if="scope.row.asset?.type === 2"
                    style="width: 100px; height: 75px; border-radius: 4px"
                    fit="cover"
                    :src="getVideoSnapshotUrl(scope.row.asset_display_url)"
                    :preview-src-list="[getVideoSnapshotUrl(scope.row.asset_display_url)]"
                    preview-teleported
                  ></el-image>
                  <span v-else>-</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="资源名称" min-width="220">
              <template v-slot="scope">
                <span :title="scope.row.asset_name">{{ scope.row.asset_name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template v-slot="scope">
                <el-tag :type="getAsrStatusType(scope.row.status)">{{ scope.row.status_text }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="180">
              <template v-slot="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column
              label="全文"
              min-width="220"
              :show-overflow-tooltip="{
                popperOptions: { modifiers: [{ name: 'computeStyles', options: { adaptive: false } }] },
                popperClass: 'asr-fulltext-tooltip'
              }"
            >
              <template v-slot="scope">
                {{ scope.row.full_text || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template v-slot="scope">
                <el-button type="success" link @click="copyToClipboard(scope.row.full_text)">复制</el-button>
                <el-button type="danger" link @click="deleteAsr(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无数据"></el-empty>

          <div v-if="asrTotal" class="asr-pagination">
            <el-pagination
              v-model:current-page="asrPage"
              :page-size="asrPerPage"
              layout="prev, pager, next"
              :total="asrTotal"
              @current-change="loadList()"
            ></el-pagination>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import api from '@/apis/base'
import moment from 'moment'
import AsrMediaPlayer from '@/components/AsrMediaPlayer.vue'
import { Search } from '@element-plus/icons-vue'

export default {
  name: 'AsrTabContent',
  components: { AsrMediaPlayer },
  setup () {
    return { Search }
  },
  expose: ['loadList', 'filterByAsset', 'clearFilter'],
  data () {
    return {
      asrList: [],
      activeTab: 'asr',
      asrPage: 1,
      asrPerPage: 15,
      asrTotal: 0,
      asrKeywords: '',
      currentAsrAsset: null
    }
  },
  computed: {
    hasContent () {
      return this.asrList.length > 0 || !!this.currentAsrAsset || !!this.asrKeywords
    }
  },
  methods: {
    // ---- 对外 API ----
    loadList (resetPage = false) {
      if (resetPage) {
        this.asrPage = 1
      }
      api
        .get('/asr_list', {
          params: {
            page: this.asrPage,
            asset_id: this.currentAsrAsset?.asset_id,
            keywords: this.asrKeywords
          }
        })
        .then(response => {
          this.asrList = Array.isArray(response?.data) ? response.data.map(item => this.parseAsrItem(item)) : []
          this.asrTotal = response.meta.pagination?.total || 0
          this.asrPerPage = Number(response.meta.pagination?.per_page) || 15
          this.asrPage = Number(response.meta.pagination?.current_page) || 1
        })
        .catch(() => {
          this.asrList = []
          this.asrTotal = 0
        })
    },
    filterByAsset (asset) {
      this.currentAsrAsset = asset
      this.asrPage = 1
      this.loadList(true)
    },
    clearFilter () {
      this.currentAsrAsset = null
      this.loadList()
    },

    // ---- 内部工具 ----
    formatDate (value) {
      return value ? moment(value).format('Y-M-D H:m') : '-'
    },
    getAsrStatusText (status) {
      const statusMap = { 1: '识别中', 2: '成功', 3: '失败' }
      return statusMap[status] || '未知'
    },
    getAsrStatusType (status) {
      const statusMap = { 1: 'warning', 2: 'success', 3: 'danger' }
      return statusMap[status] || 'info'
    },
    getAsrRowKey (row) {
      return `${row.asset_id || 'asset'}-${row.id || 'id'}-${row.created_at || 'time'}`
    },
    parseAsrResult (value) {
      if (!value) return { full_text: '', words: [] }
      if (typeof value === 'object') {
        return { full_text: value.full_text || '', words: Array.isArray(value.words) ? value.words : [] }
      }
      try {
        const parsed = JSON.parse(value)
        return { full_text: parsed.full_text || '', words: Array.isArray(parsed.words) ? parsed.words : [] }
      } catch (e) {
        return { full_text: '', words: [] }
      }
    },
    parseAsrItem (item) {
      const parsedAsrResult = this.parseAsrResult(item.asr_result)
      return {
        ...item,
        parsed_asr_result: parsedAsrResult,
        full_text: parsedAsrResult.full_text,
        words: parsedAsrResult.words,
        asset_name: item.asset?.name || '-',
        asset_display_url: item.asset?.display_url || '',
        asset_type: item.asset?.type,
        status_text: this.getAsrStatusText(item.status)
      }
    },
    getVideoSnapshotUrl (url) {
      if (!url) return ''
      const process = 'x-oss-process=video/snapshot,t_0,f_jpg,w_400,h_0,m_fast'
      return url.includes('?') ? `${url}&${process}` : `${url}?${process}`
    },
    copyToClipboard (text) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text || '')
          .then(() => { this.$message.success('复制成功!') })
          .catch(err => { this.$message.error('复制失败: ' + err) })
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = text || ''
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          this.$message.success('复制成功!')
        } catch (err) {
          this.$message.error('复制失败: ' + err)
        }
        document.body.removeChild(textArea)
      }
    },
    deleteAsr (row) {
      this.$confirm('确认删除吗？')
        .then(() => {
          api.delete('/asr/' + row.id)
            .then(() => { this.$message.success('删除成功') })
            .finally(() => { this.loadList() })
        })
        .catch(() => {})
    }
  }
}
</script>

<style scoped>
.asr-tab-content {
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.asr-search-bar {
  align-self: flex-end;
}

.asr-table {
  width: 100%;
}

.asr-expand-content {
  padding: 8px;
}

.asr-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>

<style>
.asr-fulltext-tooltip {
  max-width: 400px !important;
}
</style>
