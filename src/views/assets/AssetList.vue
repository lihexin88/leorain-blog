<template>
  <div class="asset-container">
    <div class="asset-search-container">
      <div class="asset-search">
        <el-input autofocus clearable :prefix-icon="Search" placeholder="输入文本进行搜索，例如：睡觉的猫咪"
                  @change="load(true)" v-model="keywords"></el-input>
        <el-button @click="load(true)">搜索</el-button>
        <el-button type="primary" @click="openUploadDialog">上传</el-button>
      </div>
    </div>

    <div class="asset-layout">
      <div class="asset-main">
        <div class="list asset-item-container" id="container-left">
          <div v-for="(asset,index) in assets" :key="index" class="asset-items-box">
            <el-button
              v-if="isVideoAsset(asset) && Number(asset.has_asr) === 0"
              class="asset-asr-btn"
              size="small"
              type="primary"
              @click="handleAssetAsr(asset)"
            >
              识别
            </el-button>
            <div style="display: flex;justify-content: center;align-items: center;padding-top: 3px">
              <el-image class="asset-items-image" fit="contain" preview-teleported v-if="asset.type === 1"
                        :preview-src-list="[asset.display_url]"
                        :src="asset.display_url + '?x-oss-process=style/gallery_thumbnail'"></el-image>
              <div v-else class="asset-video-wrapper" @click="openAssetPreview(asset)">
                <video :src="asset.display_url" width="100%"></video>
                <div class="asset-video-mask">点击播放</div>
              </div>
            </div>
            <div v-if="asset.score" class="asset-info">
              <span>余弦距离：{{ asset.score }}</span>
            </div>
            <div class="asset-info">
              <span :title="asset.name">{{ maxString(asset.name, 18) }}</span>
            </div>
            <div class="asset-info">
              <i class="fa fa-clock">{{ moment(asset.created_at).format("Y-M-D H:m") }}</i>
            </div>
          </div>
        </div>

        <div class="asset-pagination">
          <el-pagination
              v-model:page-size="per_page"
              :page-sizes="[16, 32, 40, 48]"
              v-model:current-page="page"
              @size-change="load(true)"
              @current-change="load(false)"
              background
              :small="smallWindowSize"
              :layout="layout"
              :total="total"
          ></el-pagination>
        </div>
      </div>

      <div class="asset-sidebar" v-if="asrList.length">
        <el-tabs v-model="activeTab" class="asset-tabs">
          <el-tab-pane label="ASR 列表" name="asr">
            <div class="asr-tab-content">
              <el-table
                v-if="asrList.length"
                :data="asrList"
                stripe
                :row-key="getAsrRowKey"
                class="asr-table"
              >
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
                <el-table-column label="全文" min-width="220" show-overflow-tooltip>
                  <template v-slot="scope">
                    {{ scope.row.full_text || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100" fixed="right">
                  <template v-slot="scope">
                    <el-button type="primary" link @click="copyToClipboard(scope.row.full_text)">复制</el-button>
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
                  @current-change="loadAsrList"
                ></el-pagination>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <el-dialog v-model="uploadDialogVisible" title="上传资源" width="520px">
      <el-upload
        ref="assetUploadRef"
        action="#"
        drag
        :limit="1"
        :auto-upload="false"
        :file-list="uploadFileList"
        :http-request="handleUploadRequest"
        :on-change="handleUploadChange"
        :on-remove="handleUploadRemove"
      >
        <el-icon><Plus /></el-icon>
        <div class="el-upload__text">拖拽文件到这里，或 <em>点击上传</em></div>
      </el-upload>
      <el-progress
        v-if="uploadLoading || uploadProgress > 0"
        :percentage="uploadProgress"
        :stroke-width="10"
        class="asset-upload-progress"
      ></el-progress>
      <template #footer>
        <span>
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="uploadLoading" @click="submitUpload">开始上传</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="previewDialogVisible" :title="previewAsset?.name || '视频预览'" width="70%">
      <video
          ref="videoPlayer"
        v-if="previewAsset"
        :src="previewAsset.display_url"
        controls
        autoplay
        style="width: 100%; max-height: 70vh"
      ></video>
    </el-dialog>
  </div>
</template>

<script>

import { getUrlParams, maxString, paginateLayouts, syncUrlPaginate } from '@/utils/helpers'
import moment from 'moment'
import assetsApi from '@/apis/assets'
import api from '@/apis/base'
import { Search, Plus } from '@element-plus/icons-vue'
import AsrMediaPlayer from '@/components/AsrMediaPlayer.vue'

export default {
  components: {
    AsrMediaPlayer
  },
  beforeUnmount () {
    this.stopAsrPolling()
  },
  setup () {
    return {
      Search,
      Plus
    }
  },
  computed: {
    moment () {
      return moment
    }
  },
  mounted () {
    const paginateStyle = paginateLayouts()
    this.smallWindowSize = paginateStyle.smallWindowSize
    this.layout = paginateStyle.layout
    const urlParams = getUrlParams()
    if (urlParams.page) {
      this.page = parseInt(urlParams.page) || 1
    }
    if (urlParams.per_page) {
      this.per_page = parseInt(urlParams.per_page) || 32
    }
    if (urlParams.keywords) {
      this.keywords = urlParams.keywords
    }
    this.load()
    this.loadAsrList()
  },
  watch: {
    per_page () {
      this.load(true)
    },
    keywords (val) {
      if (!val) {
        this.load(true)
      }
    },
    previewDialogVisible (val) {
      if (!val) {
        this.$refs.videoPlayer.pause()
      }
    }
  },
  methods: {
    maxString,
    formatDate (value) {
      return value ? moment(value).format('Y-M-D H:m') : '-'
    },
    getAsrStatusText (status) {
      const statusMap = {
        1: '识别中',
        2: '成功',
        3: '失败'
      }
      return statusMap[status] || '未知'
    },
    getAsrStatusType (status) {
      const statusMap = {
        1: 'warning',
        2: 'success',
        3: 'danger'
      }
      return statusMap[status] || 'info'
    },
    getAsrRowKey (row) {
      return `${row.asset_id || 'asset'}-${row.id || 'id'}-${row.created_at || 'time'}`
    },
    parseAsrResult (value) {
      if (!value) {
        return {
          full_text: '',
          words: []
        }
      }
      if (typeof value === 'object') {
        return {
          full_text: value.full_text || '',
          words: Array.isArray(value.words) ? value.words : []
        }
      }
      try {
        const parsed = JSON.parse(value)
        return {
          full_text: parsed.full_text || '',
          words: Array.isArray(parsed.words) ? parsed.words : []
        }
      } catch (e) {
        return {
          full_text: '',
          words: []
        }
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
    copyToClipboard (text) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text || '').then(() => {
          this.$message.success('复制成功!')
        }).catch(err => {
          this.$message.error('复制失败: ' + err)
        })
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
    openUploadDialog () {
      this.uploadDialogVisible = true
    },
    handleUploadChange (file, fileList) {
      this.uploadFileList = fileList.slice(-1)
    },
    handleUploadRemove (file, fileList) {
      this.uploadFileList = fileList
    },
    submitUpload () {
      if (!this.uploadFileList.length) {
        this.$message.error('请先选择文件')
        return
      }
      this.$refs.assetUploadRef.submit()
    },
    ensureDefaultDir () {
      if (this.defaultDirAssetId) {
        return Promise.resolve(this.defaultDirAssetId)
      }
      return assetsApi.getDefaultDir().then((response) => {
        this.defaultDirAssetId = response?.data?.asset_id
        return this.defaultDirAssetId
      })
    },
    uploadToOss (file, uploadUrl) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl, true)
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            this.uploadProgress = Math.min(99, Math.round((event.loaded / event.total) * 100))
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            this.uploadProgress = 100
            resolve()
          } else {
            reject(new Error('上传失败'))
          }
        }
        xhr.onerror = () => reject(new Error('上传失败'))
        xhr.setRequestHeader('Content-Type', '')
        xhr.send(file)
      })
    },
    getFileType (file) {
      const type = file.type || ''
      if (type.startsWith('image/')) {
        return 1
      }
      if (type.startsWith('video/')) {
        return 2
      }
      if (type.startsWith('audio/')) {
        return 3
      }
      return 5
    },
    async handleUploadRequest ({ file }) {
      try {
        this.uploadLoading = true
        this.uploadProgress = 0
        const dirId = await this.ensureDefaultDir()
        if (!dirId) {
          throw new Error('未获取到默认目录')
        }
        const response = await assetsApi.getUploadUrl(file.name)
        const fileUrl = response?.url?.url
        const fileObject = response?.url?.object
        if (!fileUrl || !fileObject) {
          throw new Error('未获取到上传签名')
        }
        await this.uploadToOss(file, fileUrl)
        await assetsApi.createAsset({
          type: this.getFileType(file),
          name: file.name,
          url: fileObject,
          dir_id: dirId,
          use_vector: false
        })
        this.$message.success('上传成功')
        this.uploadDialogVisible = false
        this.uploadFileList = []
        this.$refs.assetUploadRef?.clearFiles()
        this.load(true)
      } catch (err) {
        this.$message.error(err?.message || '上传失败')
      } finally {
        this.uploadLoading = false
        if (this.uploadDialogVisible) {
          this.uploadProgress = 0
        }
      }
    },
    stopAsrPolling () {
      if (this.asrPollingTimer) {
        clearTimeout(this.asrPollingTimer)
        this.asrPollingTimer = null
      }
      this.asrPollingCount = 0
    },
    pollAsrDetail (recordId) {
      this.stopAsrPolling()
      const poll = async () => {
        this.asrPollingCount += 1
        try {
          const response = await assetsApi.getAsrDetail(recordId)
          const status = Number(response?.data?.status ?? response?.status)
          if (status !== 1) {
            this.stopAsrPolling()
            this.load()
            this.loadAsrList()
            return
          }
          if (this.asrPollingCount >= 100) {
            this.stopAsrPolling()
            this.$message.warning('识别轮询超时')
            return
          }
          this.asrPollingTimer = setTimeout(poll, 1000)
        } catch (err) {
          this.stopAsrPolling()
          this.$message.error(err?.message || '获取识别状态失败')
        }
      }
      this.asrPollingTimer = setTimeout(poll, 1000)
    },
    handleAssetAsr (asset) {
      assetsApi.assetAsr({
        asset_id: asset.asset_id
      }).then((response) => {
        const recordId = response?.data?.record_id ?? response?.record_id
        this.loadAsrList()
        this.$message.success('识别任务已提交')
        if (recordId) {
          this.pollAsrDetail(recordId)
          return
        }
        this.load()
        this.loadAsrList()
      }).catch(err => {
        this.$message.error(err?.message || '提交识别失败')
      })
    },
    isVideoAsset (asset) {
      return String(asset?.type) !== '1'
    },
    openAssetPreview (asset) {
      this.previewAsset = asset
      this.previewDialogVisible = true
    },
    load (resetPage = false) {
      if (resetPage) {
        this.page = 1
      }
      assetsApi.getAssets({
        page: this.page,
        per_page: this.per_page,
        keywords: this.keywords
      }).then((response) => {
        this.assets = response.data
        this.total = response.total
        let urlParams = {
          page: this.page,
          per_page: this.per_page,
          keywords: this.keywords
        }
        syncUrlPaginate(urlParams)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    },
    loadAsrList () {
      api.get('/asr_list', {
        params: {
          page: this.asrPage
        }
      }).then((response) => {
        this.asrList = Array.isArray(response?.data) ? response.data.map(item => this.parseAsrItem(item)) : []
        this.asrTotal = response?.total || 0
        this.asrPerPage = Number(response?.per_page) || 15
        this.asrPage = Number(response?.current_page) || 1
      }).catch(() => {
        this.asrList = []
        this.asrTotal = 0
      })
    }
  },
  data () {
    return {
      total: null,
      page: 1,
      per_page: 32,
      keywords: null,
      assets: null,
      previewAsset: null,
      previewDialogVisible: false,
      uploadDialogVisible: false,
      uploadFileList: [],
      uploadLoading: false,
      uploadProgress: 0,
      defaultDirAssetId: null,
      asrList: [],
      activeTab: 'asr',
      asrPage: 1,
      asrPerPage: 15,
      asrTotal: 0,
      asrPollingTimer: null,
      asrPollingCount: 0,
      smallWindowSize: false,
      layout: ''
    }
  }
}
</script>
<style scoped lang="scss">
.asset-container {
  background-color: rgba(231, 239, 241, 0.38);
  padding: 20px 16px 10px;
}

.asset-search-container {
  display: flex;
  justify-content: center;
}

.asset-search {
  width: 30%;
  display: flex;
  gap: 8px;
}

.asset-layout {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-top: 20px;
}

.asset-main {
  flex: 1;
  min-width: 0;
}

.asset-sidebar {
  width: 1080px;
  flex-shrink: 0;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, .9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.asset-tabs {
  width: 100%;
}

.asset-item-container {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, 242px);
  justify-content: center;
  gap: 16px;
}

.asset-items-box {
  position: relative;
  width: 100%;
  max-height: 300px;
  padding: 8px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, .9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform .2s ease, box-shadow .2s ease;
}

.asset-asr-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}

.asset-video-wrapper {
  position: relative;
  width: 100%;
  cursor: pointer;
}

.asset-video-wrapper video {
  display: block;
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 6px;
  background: #000;
}

.asset-video-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
}

.asset-items-image {
  width: 100%;
  height: 220px;
  object-fit: contain;
  border-radius: 6px;
  background: #f7f9fb;
}

.asset-items-box:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(52, 152, 219, 0.4),
  0 0 30px rgba(52, 152, 219, 0.22),
  0 0 40px rgba(52, 152, 219, 0.06);
}

.asset-info {
  margin-top: 6px;
  font-size: .85em;
  color: #606266;
  text-align: center;
}

.asset-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.asr-tab-content {
  min-height: 200px;
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

.asset-upload-progress {
  margin-top: 16px;
}

@media screen and (max-aspect-ratio: 1/1) {
  .asset-search {
    width: 95%;
  }
}

@media (max-width: 1024px) {
  .asset-layout {
    flex-direction: column;
  }

  .asset-sidebar {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .asset-item-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .asset-items-image {
    height: 180px;
  }
}
</style>
