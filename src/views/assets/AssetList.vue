<template>
  <div class="asset-container">
    <div class="asset-search-container">
      <div class="asset-header">
        <div class="header-breadcrumb">
          文件路径：
          <el-breadcrumb separator=">" v-if="(fullPath && fullPath.length)">
            <el-breadcrumb-item
                v-for="(item, index) in (fullPath || [])"
                :key="item?.asset_id || index"
            >
              <el-link :disabled="index === fullPath.length - 1 && fullPath.length !== 1" class="asset-breadcrumb-link"
                       href="#"
                       @click.prevent="onBreadcrumbClick(item)">
                {{ item?.name }}
              </el-link>
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <el-input autofocus clearable style="width: 300px" :prefix-icon="Search"
                  placeholder="输入文本进行搜索，例如：睡觉的猫咪"
                  @change="load(true)" v-model="keywords"></el-input>
        <el-button @click="fileNameSearch()">文件名搜索</el-button>
        <el-button @click="vectorSearch()">语义搜索</el-button>
        <el-button type="primary" @click="openUploadDialog">上传</el-button>
        <el-button type="primary" @click="openDirCreateDialog">创建目录</el-button>
      </div>
    </div>

    <div class="asset-layout">
      <div class="asset-main">
        <div class="list asset-item-container" id="container-left">
          <div v-for="(asset,index) in assets" :key="index" class="asset-items-box"
               draggable="true"
               @dragstart="onDragStart($event, asset)"
               @dragover.prevent="onDragOver($event, asset)"
               @dragleave="onDragLeave($event)"
               @drop.prevent="onDrop($event, asset)"
          >
            <el-button
                v-if="isVideoAsset(asset) && user?.id === asset.uid"
                class="asset-asr-btn"
                size="small"
                type="primary"
                @click="handleAssetAsr(asset)"
            >
              <span v-if="asset.has_asr">已识别</span>
              <span v-else>识别</span>
            </el-button>
            <!-- 右键菜单：重命名 / 删除 -->
            <el-dropdown
                trigger="contextmenu"
                @command="onAssetMenuCommand($event, asset)"
                style="display: block; width: 100%"
            >
              <div class="asset-cover-wrapper"
                   style="display: flex;justify-content: center;align-items: center;padding-top: 3px;width: 100%">
                <div class="asset-share-btn" v-if="asset.type !== 4" @click.stop="openShareDialog(asset)">
                  <el-icon>
                    <Share/>
                  </el-icon>
                </div>
                <AssetCover style="width: 100%" :asset="asset" @preview="openAssetPreview" @open-dir="openAssetDir" />
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="move" divided>移动</el-dropdown-item>
                  <el-dropdown-item command="rename" divided>重命名</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <div class="asset-info-wrapper">
              <div v-if="asset.score" class="asset-info">
                <span>余弦距离：{{ asset.score }}</span>
              </div>
              <div class="asset-info">
                <span :title="asset.name">{{ maxString(asset.name, 18) }}</span>
              </div>
              <div class="asset-info">
              <span class="asset-info-time">
                <Clock style="width: 18px"/>
                {{ formatDate(asset.created_at) }}
              </span>
                <span v-if="asset.type !== 4" class="asset-info-size">
                <Files style="width: 18px"/>
                {{ humanFilesize(asset.size) }}
              </span>
              </div>
            </div>
          </div>
        </div>

        <el-empty v-if="assets?.length === 0">暂无数据</el-empty>
        <div class="asset-pagination">
          <el-pagination
              v-model:page-size="per_page"
              :page-sizes="[15, 30, 45, 50]"
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

      <div class="asset-sidebar" v-if="showAsrSidebar">
        <el-tabs v-model="activeTab" class="asset-tabs">
          <el-tab-pane label="ASR 列表" name="asr">
            <div class="asr-tab-content">
              <div class="asr-search-bar">
                <el-tag v-if="currentAsrAsset" closable @close="clearAsrAssetIdAndSearch">{{ currentAsrAsset.name }}</el-tag>
                <el-input
                    v-model="asrKeywords"
                    clearable
                    style="width: 280px"
                    :prefix-icon="Search"
                    placeholder="搜索 ASR 全文"
                    @change="loadAsrList(true)"
                    @clear="loadAsrList(true)"
                ></el-input>
                <el-button type="primary" @click="loadAsrList(true)">搜索</el-button>
              </div>
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
                <el-table-column label="封面" width="130">
                  <template v-slot="scope">
                    <div style="display: flex;justify-content: center;align-items: center">
                      <el-image
                        v-if="scope.row.asset.type === 2"
                        style="width: 100px; height: 75px; border-radius: 4px;"
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
                <el-table-column label="全文" min-width="220" :show-overflow-tooltip="{ popperOptions: { modifiers: [{ name: 'computeStyles', options: { adaptive: false } }] }, popperClass: 'asr-fulltext-tooltip' }">
                  <template v-slot="scope">
                    {{ scope.row.full_text || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="140" fixed="right">
                  <template v-slot="scope">
                    <el-button type="primary" link @click="copyToClipboard(scope.row.full_text)">复制</el-button>
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
                    @current-change="loadAsrList()"
                ></el-pagination>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <el-dialog v-model="shareDialogVisible" title="分享" width="680px">
      <div v-if="shareAsset" style="margin-bottom: 16px;">
        <div style="display:flex;justify-content:center;margin-bottom:12px;">
          <el-image v-if="shareAsset.type === 1" style="max-height:180px;max-width:100%;border-radius:6px;"
                    fit="contain" :src="shareAsset.display_url + '?x-oss-process=style/gallery_thumbnail'"></el-image>
          <el-image v-else-if="shareAsset.type === 2" style="max-height:180px;max-width:100%;border-radius:6px;"
                    fit="contain" :src="getVideoSnapshotUrl(shareAsset.display_url)"></el-image>
          <div v-else-if="shareAsset.type === 3" style="font-size:48px;color:#409eff;">
            <el-icon>
              <Microphone/>
            </el-icon>
          </div>
          <div v-else-if="shareAsset.type === 4" style="font-size:48px;color:#409eff;">
            <el-icon>
              <Folder/>
            </el-icon>
          </div>
        </div>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="名称">{{ shareAsset.name }}</el-descriptions-item>
          <el-descriptions-item label="大小">{{ humanFilesize(shareAsset.size) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(shareAsset.created_at) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-form :inline="true" style="margin-top:12px;">
        <el-form-item label="有效期">
          <el-input v-model.number="shareExpireValue" placeholder="输入数字" style="width:120px;"
                    :disabled="shareExpireType === 4"></el-input>
        </el-form-item>
        <el-form-item>
          <el-select v-model="shareExpireType" style="width:120px;">
            <el-option label="分钟" :value="1"></el-option>
            <el-option label="小时" :value="2"></el-option>
            <el-option label="天" :value="3"></el-option>
            <el-option label="永久" :value="4"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="shareSubmitting" @click="submitShare">分享</el-button>
        </el-form-item>
      </el-form>
      <div v-if="shareResultUrl" style="margin-top:12px;">
        <el-input readonly :model-value="shareResultUrl">
          <template #append>
            <el-button @click="copyToClipboard(shareResultUrl)">复制</el-button>
          </template>
        </el-input>
      </div>
    </el-dialog>

    <el-dialog v-model="showCreatDirDialog">
      <el-input v-model="creatDirName"></el-input>
      <template #footer>
        <el-button @click="showCreatDirDialog = false">取消</el-button>
        <el-button type="primary" @click="createDir">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="uploadDialogVisible" title="上传资源" width="520px">
      <el-upload
          ref="assetUploadRef"
          action="#"
          drag
          accept="image/*,video/*,audio/*"
          multiple
          :limit="20"
          :auto-upload="false"
          :file-list="uploadFileList"
          :http-request="handleUploadRequest"
          :on-change="handleUploadChange"
          :on-remove="handleUploadRemove"
      >
        <el-icon>
          <Plus/>
        </el-icon>
        <div class="el-upload__text">拖拽图片、视频或音频到这里，或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">仅支持图片、视频和音频，大小不超过 100MB</div>
        </template>
      </el-upload>
      <el-progress
          v-if="uploadLoading || uploadProgress > 0"
          :percentage="uploadProgress"
          :stroke-width="10"
          class="asset-upload-progress"
      ></el-progress>
      <div v-if="uploadLoading && uploadStatusText" class="asset-upload-status">{{ uploadStatusText }}</div>
      <template #footer>
        <span>
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="uploadLoading" @click="submitUpload">开始上传</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="previewDialogVisible" :title="previewAsset?.name || '资源预览'" width="70%">
      <video
          ref="videoPlayer"
          v-if="previewAsset && previewAsset.type === 2"
          :src="previewAsset.display_url"
          controls
          autoplay
          style="width: 100%; max-height: 70vh"
      ></video>
      <audio
          ref="audioPlayer"
          v-else-if="previewAsset && previewAsset.type === 3"
          :src="previewAsset.display_url"
          controls
          autoplay
          style="width: 100%"
      ></audio>
    </el-dialog>
    <!-- 移动到目录弹窗 -->
    <el-dialog v-model="moveDialogVisible" title="移动到目录" width="480px" :close-on-click-modal="false">
      <div class="move-dir-tree">
        <div v-if="!moveDirTree.length" style="color:#999;text-align:center;padding:20px">暂无目录</div>
        <template v-else>
          <div v-for="dir in moveDirTree" :key="dir.asset_id">
            <div
                class="move-dir-item"
                :class="{ 'move-dir-selected': moveSelectedDirId === dir.asset_id }"
                @click="moveSelectedDirId = dir.asset_id"
            >
              <el-icon>
                <Folder/>
              </el-icon>
              <span style="flex:1;margin-left:6px">{{ dir.name }}</span>
              <el-button link type="primary" size="small" @click.stop="loadSubDirs(dir)">{{
                  dir.expanded ? '−' : '+'
                }}
              </el-button>
            </div>
            <div v-if="dir.expanded && dir.children" style="padding-left:20px">
              <div v-for="sub in dir.children" :key="sub.asset_id">
                <div
                    class="move-dir-item"
                    :class="{ 'move-dir-selected': moveSelectedDirId === sub.asset_id }"
                    @click="moveSelectedDirId = sub.asset_id"
                >
                  <el-icon>
                    <Folder/>
                  </el-icon>
                  <span style="flex:1;margin-left:6px">{{ sub.name }}</span>
                  <el-button link type="primary" size="small" @click.stop="loadSubDirs(sub)">{{
                      sub.expanded ? '−' : '+'
                    }}
                  </el-button>
                </div>
                <div v-if="sub.expanded && sub.children" style="padding-left:20px">
                  <div v-for="sub2 in sub.children" :key="sub2.asset_id">
                    <div
                        class="move-dir-item"
                        :class="{ 'move-dir-selected': moveSelectedDirId === sub2.asset_id }"
                        @click="moveSelectedDirId = sub2.asset_id"
                    >
                      <el-icon>
                        <Folder/>
                      </el-icon>
                      <span style="flex:1;margin-left:6px">{{ sub2.name }}</span>
                      <el-button link type="primary" size="small" @click.stop="loadSubDirs(sub2)">
                        {{ sub2.expanded ? '−' : '+' }}
                      </el-button>
                    </div>
                    <div v-if="sub2.expanded && sub2.children" style="padding-left:20px">
                      <div v-for="sub3 in sub2.children" :key="sub3.asset_id"
                           class="move-dir-item"
                           :class="{ 'move-dir-selected': moveSelectedDirId === sub3.asset_id }"
                           @click="moveSelectedDirId = sub3.asset_id"
                      >
                        <el-icon>
                          <Folder/>
                        </el-icon>
                        <span style="flex:1;margin-left:6px">{{ sub3.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button @click="moveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="moveSubmitting" @click="submitMove">确定</el-button>
      </template>
    </el-dialog>
    <!-- 重命名弹窗 -->
    <el-dialog
        v-model="renameDialogVisible"
        title="重命名"
        width="420px"
        :close-on-click-modal="false"
    >
      <el-form @submit.prevent>
        <el-form-item label="名称" label-width="60px">
          <el-input v-model="renameForm.name" :placeholder="currentActionAsset?.name || '输入新名称'"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="renameDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="renameSubmitting" @click="submitRename">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>

import { markRaw } from 'vue'
import { mapState } from 'pinia'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { useUserStore } from '@/store/user'
import {
  getUrlParams, humanFilesize,
  maxString,
  paginateLayouts,
  syncUrlPaginate
} from '@/utils/helpers'
import moment from 'moment'
import assetsApi from '@/apis/assets'
import api from '@/apis/base'
import { Search, Plus, Microphone, Folder, ArrowRight, Clock, Files, Share } from '@element-plus/icons-vue'
import AsrMediaPlayer from '@/components/AsrMediaPlayer.vue'
import AssetCover from '@/components/AssetCover.vue'
import { USER_LOGIN_SUCCESS_EVENT } from '@/utils/auth-events'

export default {
  components: {
    Files,
    Clock,
    Folder,
    Microphone,
    AsrMediaPlayer,
    Share,
    AssetCover
  },
  beforeUnmount () {
    this.stopAsrPolling()
  },
  setup () {
    return {
      Search,
      Plus,
      Microphone,
      Share
    }
  },
  computed: {
    ArrowRight () {
      return ArrowRight
    },
    ...mapState(useUserStore, ['user']),
    moment () {
      return moment
    },
    showAsrSidebar () {
      return this.asrList.length > 0 || !!this.currentAsrAssetId || !!this.asrKeywords
    }
  },
  async mounted () {
    window.addEventListener(USER_LOGIN_SUCCESS_EVENT, () => {
      // 登录成功后加载数据
      this.load()
      this.loadAsrList()
      if (!this.dirId) {
        this.ensureDefaultDir().then(dirId => {
          this.dirId = dirId
          this.loadDirPath(this.dirId)
        })
      } else {
        this.loadDirPath(this.dirId)
      }
    })
    const paginateStyle = paginateLayouts()
    this.smallWindowSize = paginateStyle.smallWindowSize
    this.layout = paginateStyle.layout
    const urlParams = getUrlParams()
    this.dirId = urlParams.dir_id || await this.ensureDefaultDir()
    this.loadDirPath(this.dirId)
    if (urlParams.page) {
      this.page = parseInt(urlParams.page) || 1
    }
    if (urlParams.per_page) {
      this.per_page = parseInt(urlParams.per_page) || 30
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
        this.$refs.videoPlayer?.pause()
        this.$refs.audioPlayer?.pause()
      }
    }
  },
  methods: {
    humanFilesize,
    maxString,
    openShareDialog (asset) {
      this.shareAsset = asset
      this.shareExpireType = 1
      this.shareExpireValue = 1
      this.shareResultUrl = ''
      this.shareDialogVisible = true
    },
    async submitShare () {
      if (this.shareExpireType !== 4 && (!this.shareExpireValue || this.shareExpireValue <= 0)) {
        this.$message.warning('请输入有效的数字')
        return
      }
      this.shareSubmitting = true
      try {
        const res = await api.get(`asset_get_share_url/${this.shareAsset.asset_id}`, {
          params: {
            expire_type: this.shareExpireType,
            expire_value: this.shareExpireType === 4 ? 0 : this.shareExpireValue
          }
        })
        this.shareResultUrl = res.data?.url || res.url || res.data || ''
        this.copyToClipboard(this.shareResultUrl)
        this.$message.success('分享链接已生成,已复制到剪贴板')
      } catch (err) {
        this.$message.error(err?.message || '获取分享链接失败')
      } finally {
        this.shareSubmitting = false
      }
    },
    onDragStart (e, asset) {
      this.dragAsset = asset
      e.dataTransfer.effectAllowed = 'move'
    },
    onDragOver (e, asset) {
      if (asset.type === 4 && this.dragAsset && this.dragAsset.asset_id !== asset.asset_id) {
        e.dataTransfer.dropEffect = 'move'
        e.currentTarget.classList.add('drag-over')
      }
    },
    onDragLeave (e) {
      e.currentTarget.classList.remove('drag-over')
    },
    async onDrop (e, targetAsset) {
      e.currentTarget.classList.remove('drag-over')
      const sourceAsset = this.dragAsset
      this.dragAsset = null
      if (!sourceAsset || !targetAsset) return
      if (sourceAsset.asset_id === targetAsset.asset_id) return
      if (targetAsset.type !== 4) return
      try {
        await this.$confirm(
            `是否将 「${sourceAsset.name}」 移动到 「${targetAsset.name}」？`,
            '移动确认',
            { type: 'info' }
        )
      } catch {
        return
      }
      try {
        await assetsApi.updateAsset(sourceAsset.asset_id, { dir_id: targetAsset.asset_id })
        this.$message.success('移动成功')
        this.load()
      } catch (err) {
        this.$message.error(err?.message || '移动失败')
      }
    },
    onAssetMenuCommand (command, asset) {
      if (command === 'rename') {
        this.openRenameDialog(asset)
      } else if (command === 'delete') {
        this.confirmDeleteAsset(asset)
      } else if (command === 'move') {
        this.openMoveDialog(asset)
      }
    },
    openMoveDialog (asset) {
      this.currentActionAsset = asset
      this.moveDialogVisible = true
      this.moveDirTree = []
      this.moveSelectedDirId = null
      this.moveSubmitting = false
      assetsApi.assetDirs(0).then(res => {
        this.moveDirTree = (res?.data || []).filter(d => d.asset_id !== asset.asset_id).map(d => ({
          ...d,
          children: null,
          expanded: false
        }))
      }).catch(() => {
        this.$message.error('加载目录失败')
      })
    },
    async loadSubDirs (dir) {
      if (dir.children && dir.children.length) {
        dir.expanded = !dir.expanded
        return
      }
      try {
        const res = await assetsApi.assetDirs(dir.asset_id)
        const movingAssetId = this.currentActionAsset?.asset_id
        dir.children = (res?.data || []).filter(d => d.asset_id !== movingAssetId).map(d => ({
          ...d,
          children: null,
          expanded: false
        }))
        dir.expanded = true
      } catch {
        this.$message.error('加载子目录失败')
      }
    },
    async submitMove () {
      if (!this.moveSelectedDirId) {
        this.$message.warning('请选择目标目录')
        return
      }
      const asset = this.currentActionAsset
      if (!asset) return
      this.moveSubmitting = true
      try {
        await assetsApi.updateAsset(asset.asset_id, { dir_id: this.moveSelectedDirId })
        this.$message.success('移动成功')
        this.moveDialogVisible = false
        this.load()
      } catch (e) {
        this.$message.error(e?.message || '移动失败')
      } finally {
        this.moveSubmitting = false
      }
    },
    openRenameDialog (asset) {
      this.currentActionAsset = asset
      this.renameForm.name = asset?.name || ''
      this.renameDialogVisible = true
    },
    async submitRename () {
      if (!this.currentActionAsset) return
      const asset = this.currentActionAsset
      const payload = {
        name: this.renameForm.name?.trim() || asset.name,
        dir_id: asset.dir_id || this.dirId
      }
      this.renameSubmitting = true
      try {
        await assetsApi.updateAsset(asset.asset_id, payload)
        this.$message.success('重命名成功')
        this.renameDialogVisible = false
        // 刷新列表或本地更新名称
        if (Array.isArray(this.assets)) {
          const target = this.assets.find(a => (a.asset_id) === (asset.asset_id))
          if (target) target.name = payload.name
        }
      } catch (e) {
        this.$message.error(e?.message || '重命名失败')
      } finally {
        this.renameSubmitting = false
      }
    },
    async confirmDeleteAsset (asset) {
      try {
        await this.$confirm(`确定删除该素材：${asset?.name}？`, '删除确认', { type: 'warning' })
      } catch (e) {
        return
      }
      try {
        await assetsApi.deleteAsset(asset.asset_id)
        this.$message.success('删除成功')
        // 从本地列表移除
        if (Array.isArray(this.assets)) {
          this.assets = this.assets.filter(a => (a.asset_id) !== (asset.asset_id))
        } else {
          this.load(true)
        }
      } catch (e) {
        this.$message.error(e?.message || '删除失败')
      }
    },
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
    getVideoSnapshotUrl (url) {
      if (!url) {
        return ''
      }
      const process = 'x-oss-process=video/snapshot,t_0,f_jpg,w_400,h_0,m_fast'
      return url.includes('?') ? `${url}&${process}` : `${url}?${process}`
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
    deleteAsr (row) {
      this.$confirm('确认删除吗？').then(() => {
        api.delete('/asr/' + row.id).then(() => {
          this.$message.success('删除成功')
        }).finally(() => {
          this.loadAsrList()
        })
      }).catch(() => {
      })
    },
    openUploadDialog () {
      this.uploadDialogVisible = true
    },
    validateUploadFile (file) {
      const isAllowedType = (file.type || '').startsWith('image/') || (file.type || '').startsWith('video/') || (file.type || '').startsWith('audio/')
      if (!isAllowedType) {
        this.$message.error('仅支持上传图片、视频和音频')
        return false
      }
      const isAllowedSize = file.size <= 100 * 1024 * 1024
      if (!isAllowedSize) {
        this.$message.error('上传文件大小不能超过 100MB')
        return false
      }
      return true
    },
    handleUploadChange (file, fileList) {
      // 过滤不合法的文件，但保留其余合法项
      const validList = []
      for (const f of fileList) {
        if (this.validateUploadFile(f.raw || f)) {
          validList.push(f)
        }
      }
      if (validList.length !== fileList.length) {
        this.$message.error('部分文件不符合要求，已自动忽略')
      }
      this.uploadFileList = validList
    },
    handleUploadRemove (file, fileList) {
      this.uploadFileList = fileList
    },
    submitUpload () {
      if (!this.uploadFileList.length) {
        this.$message.error('请先选择文件')
        return
      }
      // 全量校验一次
      const invalid = this.uploadFileList.find(f => !this.validateUploadFile(f.raw || f))
      if (invalid) {
        this.$message.error('存在不符合要求的文件，请移除后重试')
        return
      }
      this.uploadTotal = this.uploadFileList.length
      this.uploadSuccessCount = 0
      this.uploadFailCount = 0
      this.uploadingCount = 0
      this.uploadLoading = true
      this.uploadProgress = 0
      this.uploadStatusText = '准备上传'
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
    async loadFFmpeg () {
      if (this.ffmpegLoaded && this.ffmpeg) {
        return this.ffmpeg
      }
      if (!this.ffmpeg) {
        this.ffmpeg = markRaw(new FFmpeg())
      }
      if (!this.ffmpegLoadPromise) {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'
        this.ffmpegLoadPromise = this.ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
        }).then(() => {
          this.ffmpegLoaded = true
          return this.ffmpeg
        }).catch((error) => {
          this.ffmpegLoadPromise = null
          throw error
        })
      }
      return this.ffmpegLoadPromise
    },
    async getVideoCodec (file) {
      await this.loadFFmpeg()
      const timestamp = Date.now()
      const inputExtension = file.name.split('.').pop() || 'mp4'
      const inputName = `codec_input_${timestamp}.${inputExtension}`
      let codec = ''
      const onLog = ({ message }) => {
        const normalizedMessage = String(message || '').toLowerCase()
        if (!codec && normalizedMessage.includes('video:')) {
          if (normalizedMessage.includes('hevc')) {
            codec = 'hevc'
          } else if (normalizedMessage.includes('h265')) {
            codec = 'h265'
          } else if (normalizedMessage.includes('h264')) {
            codec = 'h264'
          }
        }
      }
      try {
        this.ffmpeg.on('log', onLog)
        const fileData = await fetchFile(file)
        await this.ffmpeg.writeFile(inputName, fileData)
        await this.ffmpeg.exec(['-i', inputName, '-f', 'null', '-'])
        return codec
      } finally {
        this.ffmpeg.off('log', onLog)
        try {
          const currentList = await this.ffmpeg.listDir('.')
          const currentFiles = currentList.map(item => item.name)
          if (currentFiles.includes(inputName)) {
            await this.ffmpeg.deleteFile(inputName)
          }
        } catch (e) {
          console.warn('Cleanup after codec detect failed:', e)
        }
      }
    },
    isH265Codec (codec) {
      const normalizedCodec = String(codec || '').toLowerCase()
      return normalizedCodec.includes('hev1') || normalizedCodec.includes('hvc1') || normalizedCodec.includes('hevc') || normalizedCodec.includes('h265')
    },
    async convertH265ToH264 (file) {
      await this.loadFFmpeg()
      this.uploadStatusText = '转码中'
      this.uploadProgress = 5
      const timestamp = Date.now()
      const inputExtension = file.name.split('.').pop() || 'mp4'
      const outputExtension = 'mp4'
      const inputName = `upload_input_${timestamp}.${inputExtension}`
      const outputName = `upload_output_${timestamp}.${outputExtension}`
      try {
        const fileData = await fetchFile(file)
        await this.ffmpeg.writeFile(inputName, fileData)
        const result = await this.ffmpeg.exec([
          '-threads', '1',
          '-i', inputName,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-c:a', 'aac',
          '-strict', 'experimental',
          '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2,format=yuv420p',
          outputName
        ])
        this.uploadProgress = 55
        if (result !== 0) {
          throw new Error(`FFmpeg 执行失败，退出代码: ${result}`)
        }
        const data = await this.ffmpeg.readFile(outputName)
        this.uploadProgress = 65
        const fileName = file.name.replace(/\.[^.]+$/, '') + '.mp4'
        return new File([data.buffer], fileName, { type: 'video/mp4' })
      } finally {
        try {
          const currentList = await this.ffmpeg.listDir('.')
          const currentFiles = currentList.map(item => item.name)
          if (currentFiles.includes(inputName)) {
            await this.ffmpeg.deleteFile(inputName)
          }
          if (currentFiles.includes(outputName)) {
            await this.ffmpeg.deleteFile(outputName)
          }
        } catch (e) {
          console.warn('Cleanup after upload convert failed:', e)
        }
      }
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
      this.uploadingCount += 1
      const currentIndex = (this.uploadSuccessCount + this.uploadFailCount + 1)
      try {
        this.uploadLoading = true
        this.uploadProgress = 0
        this.uploadStatusText = `准备中（${currentIndex}/${this.uploadTotal || this.uploadFileList.length || 1}）`
        let uploadFile = file
        if ((file.type || '').startsWith('video/')) {
          try {
            // const codec = await this.getVideoCodec(file)
            // if (this.isH265Codec(codec)) {
            //   this.$message.info('检测到 H.265 视频，正在转换为 H.264...')
            //   uploadFile = await this.convertH265ToH264(file)
            // }
          } catch (e) {
            console.log(e)
          }
        }
        if (!this.dirId) {
          const dirId = await this.ensureDefaultDir()
          if (!dirId) {
            throw new Error('未获取到默认目录')
          }
          this.dirId = dirId
        }
        const response = await assetsApi.getUploadUrl(uploadFile.name)
        this.uploadStatusText = `上传中（${currentIndex}/${this.uploadTotal || this.uploadFileList.length || 1}）`
        this.uploadProgress = Math.max(this.uploadProgress, 70)
        const fileUrl = response?.url?.url
        const fileObject = response?.url?.object
        if (!fileUrl || !fileObject) {
          throw new Error('未获取到上传签名')
        }
        await this.uploadToOss(uploadFile, fileUrl)
        await assetsApi.createAsset({
          type: this.getFileType(uploadFile),
          name: uploadFile.name,
          url: fileObject,
          dir_id: this.dirId,
          use_vector: false
        })
        this.uploadStatusText = `上传完成（${currentIndex}/${this.uploadTotal || this.uploadFileList.length || 1}）`
        this.uploadSuccessCount += 1
      } catch (err) {
        this.uploadStatusText = `上传失败（${currentIndex}/${this.uploadTotal || this.uploadFileList.length || 1}）`
        this.uploadFailCount += 1
        console.error(err)
      } finally {
        this.uploadingCount -= 1
        // 全部完成后做收尾
        if (this.uploadingCount === 0) {
          this.uploadLoading = false
          this.uploadProgress = 0
          const success = this.uploadSuccessCount
          const fail = this.uploadFailCount
          // 清理并关闭
          this.uploadDialogVisible = false
          this.$refs.assetUploadRef?.clearFiles()
          this.uploadFileList = []
          this.uploadStatusText = ''
          // 刷新列表
          this.load(true)
          // 汇总提示
          if (fail === 0) {
            this.$message.success(`全部上传成功（${success}/${this.uploadTotal || success}）`)
          } else if (success === 0) {
            this.$message.error('上传全部失败，请重试')
          } else {
            this.$message.warning(`部分上传成功：成功 ${success} 个，失败 ${fail} 个`)
          }
          // 重置统计
          this.uploadTotal = 0
          this.uploadSuccessCount = 0
          this.uploadFailCount = 0
        }
      }
    },
    createDir () {
      assetsApi.createAsset({
        type: 4,
        name: this.creatDirName,
        url: '',
        dir_id: this.dirId,
        use_vector: false
      }).then((res) => {
        this.dirId = res.data.asset_id
        this.showCreatDirDialog = false
        this.$message.success('创建成功')
        this.load(true)
      }).catch(() => {
        this.$message.error('创建目录失败，请重试')
      })
    },
    loadDirPath (assetId) {
      assetsApi.getAssetDetail(assetId).then((res) => {
        const data = res?.data
        if (data?.fullPath) {
          // 期望的数据结构：{ data: [{ asset_id, name }, ...] }
          this.fullPath = data.fullPath.data
          this.fullPath.push({
            asset_id: assetId,
            name: data.name
          })
        }
      })
    },
    getAssetDetail (assetId) {
      assetsApi.getAssetDetail(assetId).then((res) => {
        return res
      })
    },
    openDirCreateDialog () {
      this.showCreatDirDialog = true
      this.creatDirName = ''
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
      if (Number(asset?.has_asr) === 1) {
        this.currentAsrAsset = asset
        this.asrPage = 1
        this.loadAsrList(true)
        return
      }
      assetsApi.assetAsr({
        asset_id: asset.asset_id
      }).then((response) => {
        const recordId = response?.data?.record_id ?? response?.record_id
        this.loadAsrList(true)
        this.$message.success('识别任务已提交')
        if (recordId) {
          this.pollAsrDetail(recordId)
          return
        }
        this.load()
        this.loadAsrList(true)
      }).catch(err => {
        this.$message.error(err?.message || '提交识别失败')
      })
    },
    isVideoAsset (asset) {
      return ['2', '3'].includes(String(asset?.type))
    },
    openAssetPreview (asset) {
      this.previewAsset = asset
      this.previewDialogVisible = true
    },
    onBreadcrumbClick (item) {
      const dirId = item?.asset_id
      if (!dirId) return
      // 重置到指定需求的查询条件并加载
      this.page = 1
      this.keywords = null
      this.per_page = 30
      this.isVectorSearch = 0
      this.dirId = dirId
      this.load(true)
      this.loadDirPath(dirId)
    },
    openAssetDir (asset) {
      this.dirId = asset.asset_id
      this.load(true)
      this.loadDirPath(this.dirId)
    },
    fileNameSearch () {
      this.isVectorSearch = 0
      this.load(true)
    },
    vectorSearch () {
      this.isVectorSearch = 1
      this.load(true)
    },
    load (resetPage = false) {
      if (resetPage) {
        this.page = 1
      }
      assetsApi.getAssets({
        page: this.page,
        per_page: this.per_page,
        keywords: this.keywords,
        dir_id: this.dirId,
        is_vector_search: this.isVectorSearch,
        owner: 'mine'
      }).then((response) => {
        this.assets = response.data
        this.total = response.total
        let urlParams = {
          page: this.page,
          per_page: this.per_page,
          keywords: this.keywords,
          is_vector_search: this.isVectorSearch
        }
        if (this.dirId) {
          urlParams.dir_id = this.dirId
        }
        syncUrlPaginate(urlParams)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    },
    clearAsrAssetIdAndSearch () {
      this.currentAsrAsset = null
      this.loadAsrList()
    },
    loadAsrList (resetPage = false) {
      if (resetPage) {
        this.asrPage = 1
      }
      api.get('/asr_list', {
        params: {
          page: this.asrPage,
          asset_id: this.currentAsrAsset?.asset_id,
          keywords: this.asrKeywords
        }
      }).then((response) => {
        this.asrList = Array.isArray(response?.data) ? response.data.map(item => this.parseAsrItem(item)) : []
        this.asrTotal = response.meta.pagination?.total || 0
        this.asrPerPage = Number(response.meta.pagination?.per_page) || 15
        this.asrPage = Number(response.meta.pagination?.current_page) || 1
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
      per_page: 30,
      keywords: null,
      assets: null,
      previewAsset: null,
      previewDialogVisible: false,
      uploadDialogVisible: false,
      uploadFileList: [],
      uploadLoading: false,
      uploadProgress: 0,
      uploadStatusText: '',
      // 批量上传统计
      uploadingCount: 0,
      uploadTotal: 0,
      uploadSuccessCount: 0,
      uploadFailCount: 0,
      defaultDirAssetId: null,
      ffmpeg: null,
      ffmpegLoadPromise: null,
      ffmpegLoaded: false,
      asrList: [],
      activeTab: 'asr',
      asrPage: 1,
      asrPerPage: 15,
      asrTotal: 0,
      asrKeywords: '',
      currentAsrAsset: null,
      asrPollingTimer: null,
      asrPollingCount: 0,
      smallWindowSize: false,
      layout: '',
      dirId: null,
      isVectorSearch: 0,
      showCreatDirDialog: false,
      creatDirName: '',
      fullPath: [],
      // 右键菜单-重命名相关
      renameDialogVisible: false,
      renameSubmitting: false,
      renameForm: {
        name: ''
      },
      currentActionAsset: null,
      dragAsset: null,
      dirTree: [],
      moveDialogVisible: false,
      moveDirTree: [],
      moveSelectedDirId: null,
      moveSubmitting: false,
      shareDialogVisible: false,
      shareAsset: null,
      shareExpireType: 1,
      shareExpireValue: 1,
      shareSubmitting: false,
      shareResultUrl: ''
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

.asset-header {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;

  .header-breadcrumb {
    background-color: aliceblue;
    padding: 0 10px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    /* 靠左对齐：占据可用空间把后续元素“推”到右侧/中部 */
    margin-right: auto;
  }
}

/* 移动端：面包屑独占一行 */
@media (max-width: 768px) {
  .asset-header {
    justify-content: flex-start;
  }
  .asset-header .header-breadcrumb {
    flex: 0 0 100%;
  }
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
  min-height: 80vh;
  @media screen and (max-aspect-ratio: 1/1) {
    min-height: 0;
  }
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
  display: flex;
  flex-direction: column;
}

.asset-info-wrapper {
  margin-top: auto;
}

.asset-asr-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}

.asset-video-wrapper,
.asset-audio-wrapper {
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

.asset-audio-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 220px;
  font-size: 64px;
  color: #409eff;
  border-radius: 6px;
  background: #f7f9fb;
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

  &:hover {
    transition: background-color .3s ease;
    background: rgba(0, 0, 0, 0.1);
  }
}

.asset-items-image {
  width: 100%;
  height: 220px;
  object-fit: contain;
  border-radius: 6px;
  background: #f7f9fb;
}

.asset-cover-wrapper {
  position: relative;
}

.asset-share-btn {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 10;
  width: 28px;
  height: 28px;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  cursor: pointer;
  color: #409eff;
  font-size: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition: background 0.2s;

  &:hover {
    background: #409eff;
    color: #fff;
  }
}

.asset-items-box:hover .asset-share-btn {
  display: flex;
}

.asset-items-box:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(52, 152, 219, 0.4),
  0 0 30px rgba(52, 152, 219, 0.22),
  0 0 40px rgba(52, 152, 219, 0.06);
}

.asset-items-box.drag-over {
  outline: 2px dashed #409eff;
  outline-offset: -2px;
  background: rgba(64, 158, 255, 0.08);
}

.asset-info {
  margin-top: 6px;
  font-size: .85em;
  color: #606266;
  display: flex;
  justify-content: center;
  gap: 5px;
  align-items: center;

  .asset-info-time {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .asset-info-size {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.asset-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

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

.asset-upload-progress {
  margin-top: 16px;
}

.asset-upload-status {
  margin-top: 8px;
  text-align: center;
  font-size: 14px;
  color: #606266;
}

@media screen and (max-aspect-ratio: 1/1) {
  .asset-header {
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

.asset-breadcrumb-link {
  cursor: pointer;
}

.move-dir-tree {
  max-height: 400px;
  overflow-y: auto;
}

.move-dir-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 2px;

  &:hover {
    background: #f0f7ff;
  }
}

.move-dir-selected {
  background: #e6f0ff;
  outline: 1px solid #409eff;
}
</style>

<style>
.asr-fulltext-tooltip {
  max-width: 400px !important;
}
</style>
