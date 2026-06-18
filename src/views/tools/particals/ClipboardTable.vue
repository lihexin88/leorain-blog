<script>
import moment from 'moment'
import { maxString, paginateLayouts } from '@/utils/helpers'
import { clipboardApi } from '@/apis'
import { USER_LOGIN_SUCCESS_EVENT } from '@/utils/auth-events'

export default {
  data () {
    return {
      clipboardData: [],
      search_text: '',
      page: 1,
      page_size: 10,
      total: 0,
      show_popup: false,
      smallWindowSize: false,
      layout: '',
      showContentDialog: false,
      currentContent: '',
      currentClipboard: {
        id: null,
        content: null,
        star: null,
        type: 1,
        file: null
      },
      loading: false,
      submitting: false
    }
  },
  props: {
    data_source_type: {
      type: String,
      default: 'public'
    }
  },
  methods: {
    maxString,
    moment,
    removeClipboard () {
      this.currentClipboard.content = null
      this.currentClipboard.type = 1
      this.currentClipboard.star = null
      this.currentClipboard.id = null
      this.currentClipboard.file = null
    },
    uploadToOss (file, uploadUrl) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl, true)
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
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
    async handleCopy (row) {
      const content = row.content
      if (row.type === 2) {
        await this.copyImageToClipboard(content)
      } else {
        navigator.clipboard.writeText(content).then(() => {
          this.$message({
            message: '已复制',
            type: 'success'
          })
        }).catch(() => {
          this.$message({
            message: '复制失败',
            type: 'error'
          })
        })
      }
    },
    getList () {
      this.loading = true
      const params = {
        page: this.page,
        page_size: this.page_size,
        search_text: this.search_text,
        data_source_type: this.getDateSourceInfo().id
      }
      clipboardApi.getList(this.data_source_type, params)
        .then((res) => {
          // base.js 已将 axios 的 response.data 直接返回，这里的 res 即为后端响应体
          this.clipboardData = (res && res.data) ? res.data : []
          this.clipboardData.forEach(item => {
            item.created_at = moment(item.created_at).format('MM-DD HH:mm')
          })
          this.total = res?.meta?.pagination?.total || 0
          this.page = res?.meta?.pagination?.current_page || this.page
        })
        .catch(err => {
          this.$message({
            type: 'error',
            message: err?.message || '加载失败'
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    async copyImageToClipboard (base64Data) {
      try {
        // 将 Base64 转为 Blob
        const blob = await fetch(base64Data).then(res => res.blob())

        // 创建 ClipboardItem 对象
        const clipboardItem = new ClipboardItem({
          [blob.type]: blob
        })

        // 写入剪切板
        await navigator.clipboard.write([clipboardItem])
        console.log('图片已复制到剪切板！')
      } catch (err) {
        console.error('复制失败:', err)
      }
    },
    async submit () {
      if (this.submitting) return
      this.submitting = true
      let postData = {
        data_source_type: this.getDateSourceInfo().id
      }
      if (!this.currentClipboard.id) {
        // 创建时需要传 type
        postData.type = this.currentClipboard.type
      }
      if (this.currentClipboard.star !== null) {
        postData.star = this.currentClipboard.star
      }

      const isNonText = this.currentClipboard.type !== 1
      const hasFile = !!this.currentClipboard.file

      try {
        if (isNonText && hasFile) {
          // 非文本类型：先把文件上传到 OSS，再用 object 作为 content 提交
          const file = this.currentClipboard.file
          const response = await clipboardApi.getUploadUrl(file.name || `clipboard_${Date.now()}`)
          const uploadUrl = response?.url?.url
          const uploadObject = response?.url?.object
          if (!uploadUrl || !uploadObject) {
            throw new Error('未获取到上传签名')
          }
          await this.uploadToOss(file, uploadUrl)
          postData.content = uploadObject
        } else if (this.currentClipboard.content !== null) {
          if (this.currentClipboard.content.length > 10485760) {
            this.$message({
              message: '图片太大',
              type: 'error'
            })
            return
          }
          postData.content = this.currentClipboard.content
        }

        const req = this.currentClipboard.id
          ? clipboardApi.update(this.data_source_type, this.currentClipboard.id, postData)
          : clipboardApi.create(this.data_source_type, postData)

        await req
        this.$message({
          type: 'success',
          message: 'success'
        })
        this.show_popup = false
        this.getList()
      } catch (err) {
        this.$message({
          type: 'error',
          message: err?.message || '操作失败'
        })
      } finally {
        this.submitting = false
      }
    },
    async handlePaste (event) {
      event.preventDefault()
      const clipboardData = event.clipboardData || window.clipboardData
      if (!clipboardData) return
      const firstItem = clipboardData.items[0]
      if (firstItem.type.startsWith('image/')) {
        this.currentClipboard.type = 2
        const imageContent = firstItem.getAsFile()
        this.currentClipboard.file = imageContent
        this.fileToBase64(imageContent)
      } else if (firstItem.type.startsWith('text/')) {
        this.currentClipboard.type = 1
        this.currentClipboard.file = null
        this.currentClipboard.content = clipboardData.getData('text/plain')
      } else {
        // 其他非文本文件：保存原始文件，预览暂用文件名
        this.currentClipboard.type = 2
        const file = firstItem.getAsFile()
        this.currentClipboard.file = file
        if (file && file.type.startsWith('image/')) {
          this.fileToBase64(file)
        } else {
          this.currentClipboard.content = file ? file.name : ''
        }
      }
    },
    // 将File对象转为Base64
    fileToBase64 (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.currentClipboard.content = e.target.result // 结果类似 "data:image/png;base64,iVBORw0KGgo..."
      }
      reader.readAsDataURL(file) // 关键方法
    },
    getDateSourceInfo () {
      switch (this.data_source_type) {
        case 'public':
          return {
            id: 1,
            name: '公共'
          }
        case 'private':
          return {
            id: 2,
            name: '个人'
          }
      }
    },
    deleteClipboard (row) {
      this.$confirm('确认删除吗？').then(() => {
        clipboardApi.remove(this.data_source_type, row.id).then(() => {
          this.$message({
            type: 'success',
            message: '删除成功'
          })
        }).finally(() => {
          this.getList()
        })
      }).catch(() => {

      })
    },
    showUpdate (row) {
      this.show_popup = true
      this.currentClipboard.id = row.id
      this.currentClipboard.content = row.content
    },
    star (row) {
      this.currentClipboard.id = row.id
      this.currentClipboard.star = !row.star
      console.log(this.currentClipboard)
      this.submit()
    },
    showCreate () {
      this.show_popup = true
      this.currentClipboard.id = null
      this.currentClipboard.content = null
      this.currentClipboard.file = null
      this.currentClipboard.type = 1
    },
    showContent (content) {
      this.currentContent = content || ''
      this.showContentDialog = true
    },
    truncateLines (str, linesCount) {
      const regex = /\r\n|\n|\r/g
      let count = 0
      let lastIndex = 0
      let match

      while ((match = regex.exec(str)) !== null) {
        count++
        if (count === linesCount) {
          lastIndex = match.index + match[0].length // 截断到第五个换行符末尾
          break
        }
      }

      if (count < linesCount) return str // 行数不足直接返回

      const truncated = str.substring(0, lastIndex)
      const remaining = str.substring(lastIndex)
      return truncated + (remaining ? '...' : '') // 仅当有剩余内容时加 ...
    },
    countLineBreaks (str) {
      const matches = str.match(/\r\n|\n|\r/g)
      return matches ? matches.length : 0
    }
  },
  mounted () {
    window.addEventListener(USER_LOGIN_SUCCESS_EVENT, () => {
      // 登录成功后刷新当前列表
      this.getList()
    })
    const paginateStyle = paginateLayouts()
    this.smallWindowSize = paginateStyle.smallWindowSize
    this.layout = paginateStyle.layout
    this.getList()
  },
  watch: {
    page_size () {
      this.getList()
    },
    'currentClipboard.content': function (newValue) {
      if (newValue == null && this.currentClipboard.type !== 1) {
        this.currentClipboard.type = 1
        this.currentClipboard.content = newValue
      }
    }
  }
}
</script>

<template>
  <div>
    <div class="clipboard-table-search-input">
      <!--      输入框-->
      <el-input id="search_text_input" clearable v-model="search_text"></el-input>
      <el-button @click="getList">搜索</el-button>
      <el-button @click="showCreate">新增</el-button>
    </div>
    <el-dialog v-model="show_popup"
               show-footer
               large
               force
               @confirm="submit"
               @cancel="show_popup = false"
               :title="'新增-'+this.getDateSourceInfo().name"
    >
      <div>
        <div v-if="currentClipboard.type === 1">
          <el-input
              type="textarea"
              :autosize="{ minRows: 2}"
              placeholder="请输入内容，或者直接粘贴。支持文字图片"
              clearable
              @paste="handlePaste"
              v-model="currentClipboard.content"></el-input>
        </div>
        <div v-if="currentClipboard.type === 2" style="display: flex;justify-content: start;flex-wrap: nowrap">
          <div style="display: flex">
            <el-image :src="currentClipboard.content" v-if="currentClipboard.content"></el-image>
          </div>
          <div style="display: flex;align-items: start;justify-content: center;padding-left: 10px">
            <i @click="removeClipboard" class="el-icon-circle-close" style="cursor: pointer"></i>
          </div>
        </div>
      </div>
      <template v-slot:footer>
        <div>
          <el-button @click="show_popup = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog
      v-model="showContentDialog"
      title="内容详情"
      width="720px"
      :close-on-click-modal="false"
    >
      <pre class="clipboard-table-content-dialog">{{ currentContent }}</pre>
      <template v-slot:footer>
        <div>
          <el-button type="primary" @click="showContentDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
    <!--      表格-->
    <div>
      <el-table
          :data="clipboardData"
          v-loading="loading"
          row-key="id"
      >
        <el-table-column
            width="24px"
        >
          <template v-slot="scope">
            <div @click="star(scope.row)" @keydown.enter="star(scope.row)" role="button" tabindex="0" class="clipboard-table-column-star">
              <i v-if="scope.row.star" class="el-icon-star-on"></i>
              <i v-else class="el-icon-star-off"></i>
            </div>
          </template>
        </el-table-column>
        <el-table-column
            prop="id"
            label="id"
            width="50px"
        >
        </el-table-column>
        <el-table-column
            label="内容"
        >
          <template v-slot="scope">
            <div v-if="scope.row?.type === 2">
              <el-image
                :preview-src-list="[scope.row?.content]"
                style="max-width: 200px"
                preview-teleported
                :z-index="3000"
                crossorigin="anonymous"
                :src="scope.row.content+ '?x-oss-process=style/gallery_thumbnail'"
              ></el-image>
            </div>
            <div v-else-if="scope.row?.type === 1">
              <div
                style="cursor: pointer;display: inline-block"
                @click="showContent(scope.row?.content)"
              >
                <pre class="clipboard-table-column-content"
                     v-if="countLineBreaks(scope.row?.content) > 5">{{ truncateLines(scope.row?.content, 5) }}</pre>
                <pre class="clipboard-table-column-content"
                     v-else-if="scope.row?.content.length > 300">{{ maxString(scope.row?.content, 300) }}</pre>
                <pre v-else class="clipboard-table-column-content">{{ scope.row?.content }}</pre>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
            prop="created_at"
            label="时间"
            width="95px"
        >
        </el-table-column>
        <el-table-column
            label="action"
            width="100px"
        >
          <template v-slot="scope">
            <div class="clipboard-table-options">
              <div class="clipboard-table-options-button">
                <el-button @click="handleCopy(scope.row)">复制</el-button>
              </div>
              <div v-if="scope.row.type === 1" class="clipboard-table-options-button">
                <el-button @click="showUpdate(scope.row)">编辑</el-button>
              </div>
              <div class="clipboard-table-options-button">
                <el-button @click="deleteClipboard(scope.row)" type="warning">删除</el-button>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!--      分页-->
    <div>
      <div style="display: flex;justify-content: center;padding-top: 5px">
        <el-pagination
            v-model:page-size="page_size"
            :page-sizes="[10, 20, 30, 40, 50]"
            v-model:current-page="page"
            @current-change="getList"
            background
            :small="smallWindowSize"
            :layout="layout"
            :total="total"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.clipboard-table-search-input {
  margin-bottom: 10px;
  display: flex;
  justify-content: flex-start;
}

.clipboard-table-options {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.clipboard-table-column-content {
  max-height: 200px;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
}

.clipboard-table-column-content:hover {
  background-color: rgba(255, 255, 255, 0.91) !important;
  color: #1e1e1e !important;
}

.clipboard-table-options-button {
  padding-bottom: 5px;
}

.clipboard-table-column-star {
  display: flex;
  justify-content: center;
  margin-left: 5px;
  cursor: pointer;
}

.clipboard-table-content-dialog {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 60vh;
  overflow: auto;
}
</style>
