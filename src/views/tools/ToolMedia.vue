<script>
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

export default {
  name: 'ToolMedia',
  data () {
    return {
      loaded: false,
      loading: false,
      file: null,
      originalFile: null, // Store the original uploaded file
      fileType: '', // 'image' or 'video'
      fileName: '',
      targetFormat: '',
      quality: 80,
      videoBitrate: '2000k',
      videoResolution: 'source', // 'source', '1920x1080', '1280x720', '854x480'
      processing: false,
      progress: 0,
      previewUrl: '',
      outputUrl: '',
      outputFileName: '',
      originalInfo: null,
      processedInfo: null,
      currentTaskId: 0,
      formats: {
        image: ['jpg', 'png', 'webp', 'bmp'],
        video: ['mp4', 'avi', 'mov', 'mkv', 'gif']
      },
      resolutions: [
        { label: '原始分辨率', value: 'source' },
        { label: '1080P', value: '1920x1080' },
        { label: '720P', value: '1280x720' },
        { label: '480P', value: '854x480' }
      ],
      cropper: null,
      isCropping: false,
      isDrawing: false,
      editDialogVisible: false,
      editMode: '', // 'crop' or 'draw'
      canvas: null,
      ctx: null,
      drawingPencil: {
        isDrawing: false,
        lastX: 0,
        lastY: 0,
        color: '#ff0000',
        size: 1.5
      }
    }
  },
  computed: {
    isImage () {
      return this.fileType === 'image'
    },
    isVideo () {
      return this.fileType === 'video'
    },
    isModified () {
      return this.originalFile && this.file !== this.originalFile
    },
    editDialogTitle () {
      return this.editMode === 'crop' ? '图片裁剪' : '图片绘画'
    }
  },
  beforeUnmount () {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl)
    }
    if (this.outputUrl) {
      URL.revokeObjectURL(this.outputUrl)
    }
    this.destroyCropper()
  },
  methods: {
    async loadFFmpeg () {
      if (this.ffmpeg) return
      this.loading = true
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'
      const ffmpeg = new FFmpeg()
      this.ffmpeg = ffmpeg
      ffmpeg.on('log', ({ message }) => {
        console.log(message)
      })
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      })
      this.loaded = true
      this.loading = false
    },
    formatSize (bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    formatDuration (seconds) {
      if (!seconds) return ''
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = Math.floor(seconds % 60)
      return [h, m, s].map(v => v < 10 ? '0' + v : v).filter((v, i) => v !== '00' || i > 0).join(':')
    },
    formatBitrate (bps) {
      if (!bps) return ''
      if (bps >= 1000000) {
        return (bps / 1000000).toFixed(2) + ' Mbps'
      }
      return (bps / 1000).toFixed(0) + ' Kbps'
    },
    async getMediaMetadata (url, type) {
      return new Promise((resolve) => {
        if (type === 'image') {
          const img = new Image()
          img.onload = () => {
            resolve({
              width: img.width,
              height: img.height
            })
          }
          img.onerror = () => resolve(null)
          img.src = url
        } else if (type === 'video') {
          const video = document.createElement('video')
          video.onloadedmetadata = () => {
            resolve({
              width: video.videoWidth,
              height: video.videoHeight,
              duration: video.duration
            })
          }
          video.onerror = () => resolve(null)
          video.src = url
        } else {
          resolve(null)
        }
      })
    },
    async handleFileChange (event) {
      const file = event.target.files[0]
      if (!file) return
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl)
      }
      this.closeEditDialog()
      this.originalFile = file
      this.file = file
      this.fileName = file.name
      this.outputUrl = ''
      this.progress = 0
      this.originalInfo = null
      this.processedInfo = null
      if (file.type.startsWith('image/')) {
        this.fileType = 'image'
        this.targetFormat = 'jpg'
        this.previewUrl = URL.createObjectURL(file)
      } else if (file.type.startsWith('video/')) {
        this.fileType = 'video'
        this.targetFormat = 'mp4'
        this.previewUrl = URL.createObjectURL(file)
      } else {
        this.$message.error('不支持的文件格式')
        this.file = null
        this.originalFile = null
        this.previewUrl = ''
        return
      }
      this.originalInfo = {
        size: file.size,
        type: file.type
      }
      const meta = await this.getMediaMetadata(this.previewUrl, this.fileType)
      if (meta) {
        this.originalInfo.width = meta.width
        this.originalInfo.height = meta.height
        if (meta.duration) {
          this.originalInfo.duration = meta.duration
          const bitrate = (file.size * 8) / meta.duration
          this.originalInfo.bitrate = bitrate
          const suggestedBitrateKbps = Math.floor((bitrate / 1000) * 0.8)
          this.videoBitrate = `${suggestedBitrateKbps}k`
        }
      }
    },
    async restoreOriginal () {
      if (!this.originalFile) return
      this.file = this.originalFile
      this.fileName = this.originalFile.name
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl)
      }
      this.previewUrl = URL.createObjectURL(this.file)
      this.closeEditDialog()
      this.originalInfo.size = this.file.size
      const meta = await this.getMediaMetadata(this.previewUrl, 'image')
      if (meta) {
        this.originalInfo.width = meta.width
        this.originalInfo.height = meta.height
      }
    },
    openEditDialog (mode) {
      this.editMode = mode
      this.editDialogVisible = true
      this.$nextTick(() => {
        if (mode === 'crop') {
          this.initCropper()
        } else if (mode === 'draw') {
          this.initDrawing()
        }
      })
    },
    closeEditDialog () {
      if (this.editMode === 'crop') {
        this.destroyCropper()
      } else if (this.editMode === 'draw') {
        this.cancelDrawing()
      }
      this.editDialogVisible = false
      this.editMode = ''
    },
    initCropper () {
      const image = this.$refs.editImage
      if (image) {
        this.cropper = new Cropper(image, {
          viewMode: 1,
          autoCropArea: 0.8,
          responsive: true,
          background: false,
          zoomable: true,
          movable: true
        })
      }
    },
    destroyCropper () {
      if (this.cropper) {
        this.cropper.destroy()
        this.cropper = null
      }
    },
    confirmCrop () {
      if (!this.cropper) return
      const canvas = this.cropper.getCroppedCanvas()
      canvas.toBlob(async (blob) => {
        const newFile = new File([blob], 'cropped_' + this.file.name, { type: blob.type })
        this.file = newFile
        this.fileName = newFile.name
        if (this.previewUrl) {
          URL.revokeObjectURL(this.previewUrl)
        }
        this.previewUrl = URL.createObjectURL(newFile)
        this.closeEditDialog()
        this.originalInfo.size = newFile.size
        const meta = await this.getMediaMetadata(this.previewUrl, 'image')
        if (meta) {
          this.originalInfo.width = meta.width
          this.originalInfo.height = meta.height
        }
      }, this.file.type)
    },
    initDrawing () {
      this.canvas = this.$refs.drawingCanvas
      this.ctx = this.canvas.getContext('2d')
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        this.canvas.width = img.width
        this.canvas.height = img.height
        this.ctx.drawImage(img, 0, 0)
        this.addCanvasListeners()
      }
      img.src = this.previewUrl
    },
    clearCanvas () {
      if (!this.ctx || !this.canvas) return
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.drawImage(img, 0, 0)
      }
      img.src = this.previewUrl
    },
    addCanvasListeners () {
      this.canvas.addEventListener('mousedown', this.startDrawing)
      this.canvas.addEventListener('mousemove', this.draw)
      this.canvas.addEventListener('mouseup', this.stopDrawing)
      this.canvas.addEventListener('mouseout', this.stopDrawing)
    },
    removeCanvasListeners () {
      if (!this.canvas) return
      this.canvas.removeEventListener('mousedown', this.startDrawing)
      this.canvas.removeEventListener('mousemove', this.draw)
      this.canvas.removeEventListener('mouseup', this.stopDrawing)
      this.canvas.removeEventListener('mouseout', this.stopDrawing)
    },
    getScaledCoords (e) {
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
    },
    startDrawing (e) {
      this.drawingPencil.isDrawing = true
      const { x, y } = this.getScaledCoords(e)
      this.drawingPencil.lastX = x
      this.drawingPencil.lastY = y
    },
    draw (e) {
      if (!this.drawingPencil.isDrawing) return
      const { x, y } = this.getScaledCoords(e)
      this.ctx.beginPath()
      this.ctx.moveTo(this.drawingPencil.lastX, this.drawingPencil.lastY)
      this.ctx.lineTo(x, y)
      this.ctx.strokeStyle = this.drawingPencil.color
      this.ctx.lineWidth = this.drawingPencil.size
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'
      this.ctx.stroke()
      this.drawingPencil.lastX = x
      this.drawingPencil.lastY = y
    },
    stopDrawing () {
      this.drawingPencil.isDrawing = false
    },
    confirmDrawing () {
      this.canvas.toBlob(async (blob) => {
        const newFile = new File([blob], 'drawn_' + this.file.name, { type: blob.type })
        this.file = newFile
        this.fileName = newFile.name
        if (this.previewUrl) {
          URL.revokeObjectURL(this.previewUrl)
        }
        this.previewUrl = URL.createObjectURL(newFile)
        this.closeEditDialog()
        this.originalInfo.size = newFile.size
        const meta = await this.getMediaMetadata(this.previewUrl, 'image')
        if (meta) {
          this.originalInfo.width = meta.width
          this.originalInfo.height = meta.height
        }
      }, this.file.type)
    },
    cancelDrawing () {
      this.removeCanvasListeners()
      this.canvas = null
      this.ctx = null
    },
    async processMedia () {
      if (!this.loaded) {
        await this.loadFFmpeg()
      }
      this.processing = true
      this.progress = 0
      this.currentTaskId++
      const taskId = this.currentTaskId
      const onProgress = ({ progress }) => {
        if (taskId !== this.currentTaskId) return
        this.progress = Math.round(progress * 100)
      }
      this.ffmpeg.on('progress', onProgress)
      const { ffmpeg, file, targetFormat, fileType } = this
      const timestamp = Date.now()
      const inputExtension = file.name.split('.').pop()
      const inputName = `input_${timestamp}.${inputExtension}`
      const outputName = `output_${timestamp}.${targetFormat}`
      try {
        const fileData = await fetchFile(file)
        await ffmpeg.writeFile(inputName, fileData)
        let args = ['-threads', '1', '-i', inputName]
        if (fileType === 'image') {
          const q = parseInt(this.quality) || 80
          if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
            args.push('-q:v', Math.floor((100 - q) / 5) + 2)
          } else if (targetFormat === 'png') {
            args.push('-c:v', 'png')
            args.push('-compression_level', Math.max(0, Math.min(9, Math.floor((100 - q) / 11))))
          } else if (targetFormat === 'webp') {
            args.push('-q:v', q)
          }
        } else if (fileType === 'video') {
          if (this.videoResolution !== 'source') {
            const res = this.videoResolution.split('x')
            args.push('-vf', `scale=${res[0]}:${res[1]}:force_original_aspect_ratio=decrease,pad=${res[0]}:${res[1]}:(ow-iw)/2:(oh-ih)/2,format=yuv420p`)
          }
          args.push('-b:v', this.videoBitrate)
          args.push('-preset', 'ultrafast')
          if (targetFormat === 'mp4') {
            if (this.videoResolution === 'source') {
              args.push('-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2,format=yuv420p')
            }
            args.push('-c:a', 'aac', '-strict', 'experimental')
          }
        }
        args.push(outputName)
        const finalArgs = args.map(arg => String(arg))
        const result = await ffmpeg.exec(finalArgs)
        if (result !== 0) {
          throw new Error(`FFmpeg 执行失败，退出代码: ${result}`)
        }
        this.progress = 100
        const list = await ffmpeg.listDir('.')
        const filesInDir = list.map(item => item.name)
        if (!filesInDir.includes(outputName)) {
          throw new Error('输出文件生成失败，请检查设置是否正确')
        }
        const data = await ffmpeg.readFile(outputName)
        let mimeType = `${fileType}/${targetFormat}`
        if (targetFormat === 'jpg' || targetFormat === 'jpeg') mimeType = 'image/jpeg'
        else if (targetFormat === 'png') mimeType = 'image/png'
        else if (targetFormat === 'webp') mimeType = 'image/webp'
        else if (targetFormat === 'mp4') mimeType = 'video/mp4'
        else if (targetFormat === 'gif') mimeType = 'image/gif'
        if (this.outputUrl) {
          URL.revokeObjectURL(this.outputUrl)
        }
        this.outputUrl = URL.createObjectURL(new Blob([data.buffer], { type: mimeType }))
        this.outputFileName = `processed_${this.fileName.split('.')[0]}.${targetFormat}`
        this.processedInfo = {
          size: data.length,
          type: mimeType
        }
        const outMeta = await this.getMediaMetadata(this.outputUrl, fileType)
        if (outMeta) {
          this.processedInfo.width = outMeta.width
          this.processedInfo.height = outMeta.height
          if (outMeta.duration) {
            this.processedInfo.duration = outMeta.duration
            const bitrate = (data.length * 8) / outMeta.duration
            this.processedInfo.bitrate = bitrate
          }
        }
        this.$message.success('处理完成！')
        try {
          const currentList = await ffmpeg.listDir('.')
          const currentFiles = currentList.map(item => item.name)
          if (currentFiles.includes(inputName)) {
            await ffmpeg.deleteFile(inputName)
          }
          if (currentFiles.includes(outputName)) {
            await ffmpeg.deleteFile(outputName)
          }
        } catch (e) {
          console.warn('Cleanup after process failed:', e)
        }
      } catch (error) {
        console.error('FFmpeg process error:', error)
        if (error.message && error.message.includes('memory access out of bounds')) {
          this.$message.error('文件过大或内存不足，请尝试压缩率更低或分辨率更小的选项')
        } else {
          this.$message.error('处理过程中发生错误: ' + (error.message || '未知错误'))
        }
      } finally {
        if (this.ffmpeg) {
          this.ffmpeg.off('progress', onProgress)
        }
        this.processing = false
      }
    },
    downloadOutput () {
      const link = document.createElement('a')
      link.href = this.outputUrl
      link.download = this.outputFileName
      link.click()
    }
  }
}
</script>

<template>
  <div class="tool-media-container">
    <el-card class="box-card">
      <template v-slot:header>
        <div class="clearfix">
          <span>媒体处理工具 (图片/视频)</span>
        </div>
      </template>

      <div class="upload-section">
        <input type="file" ref="fileInput" @change="handleFileChange" style="display: none" accept="image/*,video/*">
        <el-button type="primary" size="small" @click="$refs.fileInput.click()">选择图片或视频</el-button>
        <span v-if="file" class="file-info">
          已选择: {{ fileName }} ({{ formatSize(file.size) }})
        </span>
        <div class="note-section">
          <i class="el-icon-info"></i> 提示：所有处理均在您的浏览器本地完成，不会上传到服务器，保护您的隐私。
        </div>
      </div>

      <div class="main-layout">
        <div class="left-panel">
          <div v-if="previewUrl" class="preview-section section-box">
            <el-divider content-position="left">素材预览</el-divider>
            <div v-if="originalInfo" class="media-info-tags">
              <el-tag size="small" type="info">大小: {{ formatSize(originalInfo.size) }}</el-tag>
              <el-tag v-if="originalInfo.width" size="small" type="info">分辨率: {{
                  originalInfo.width
                }}x{{ originalInfo.height }}
              </el-tag>
              <el-tag v-if="originalInfo.duration" size="small" type="info">时长:
                {{ formatDuration(originalInfo.duration) }}
              </el-tag>
              <el-tag v-if="originalInfo.bitrate" size="small" type="info">码率: {{
                  formatBitrate(originalInfo.bitrate)
                }}
              </el-tag>
            </div>
            <div class="preview-container">
              <img v-if="isImage" :src="previewUrl" class="preview-media">
              <video v-if="isVideo" :src="previewUrl" controls class="preview-media"></video>
            </div>
            <div v-if="isImage" class="image-actions">
              <el-button size="small" icon="el-icon-crop" @click="openEditDialog('crop')">裁切</el-button>
              <el-button size="small" icon="el-icon-edit" @click="openEditDialog('draw')">画笔</el-button>
              <el-button v-if="isModified" size="small" icon="el-icon-refresh-left" @click="restoreOriginal">恢复原图
              </el-button>
            </div>
          </div>

          <div v-if="file" class="options-section section-box">
            <el-divider content-position="left">处理选项</el-divider>
            <el-form label-width="100px">
              <el-form-item label="目标格式">
                <el-select v-model="targetFormat" placeholder="请选择格式" size="small">
                  <el-option
                      v-for="fmt in formats[fileType]"
                      :key="fmt"
                      :label="fmt.toUpperCase()"
                      :value="fmt"
                  ></el-option>
                </el-select>
              </el-form-item>
              <template v-if="isImage">
                <el-form-item label="质量 (压缩)">
                  <el-slider v-model="quality" :min="1" :max="100"></el-slider>
                  <span class="hint">1-100, 数值越高越清晰</span>
                </el-form-item>
              </template>
              <template v-if="isVideo">
                <el-form-item label="分辨率">
                  <el-select v-model="videoResolution" size="small">
                    <el-option
                        v-for="res in resolutions"
                        :key="res.value"
                        :label="res.label"
                        :value="res.value"
                    ></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="视频码率">
                  <el-input v-model="videoBitrate" placeholder="例如: 2000k, 1M" size="small"
                            style="max-width: 200px;"></el-input>
                  <span class="hint">较低的码率会减小文件体积但降低画画质</span>
                </el-form-item>
              </template>
              <el-form-item>
                <el-button
                    type="success"
                    size="small"
                    @click="processMedia"
                    :loading="processing || loading"
                    :disabled="!file"
                >
                  {{ processing ? '处理中...' : (loading ? '加载引擎中...' : '开始处理') }}
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <div class="right-panel">
          <div v-if="outputUrl" class="result-section section-box">
            <el-divider content-position="left">处理结果</el-divider>
            <div v-if="processedInfo" class="media-info-tags">
              <el-tag size="small" type="success">大小: {{ formatSize(processedInfo.size) }}</el-tag>
              <el-tag v-if="processedInfo.width" size="small" type="success">分辨率: {{
                  processedInfo.width
                }}x{{ processedInfo.height }}
              </el-tag>
              <el-tag v-if="processedInfo.duration" size="small" type="success">时长:
                {{ formatDuration(processedInfo.duration) }}
              </el-tag>
              <el-tag v-if="processedInfo.bitrate" size="small" type="success">码率:
                {{ formatBitrate(processedInfo.bitrate) }}
              </el-tag>
            </div>
            <div class="result-actions">
              <div class="preview-container">
                <img v-if="isImage" :src="outputUrl" class="preview-media">
                <video v-if="isVideo" :src="outputUrl" controls class="preview-media"></video>
              </div>
              <el-button type="primary" size="small" @click="downloadOutput" style="margin-bottom: 10px;">
                下载处理后的文件
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="processing || progress > 0" class="progress-section">
        <el-divider content-position="left">处理进度</el-divider>
        <el-progress :text-inside="true" :stroke-width="20" :percentage="progress"
                     :status="progress === 100 ? 'success' : ''"></el-progress>
        <p v-if="processing" class="progress-hint">正在处理，请稍候... (大文件可能需要较长时间)</p>
      </div>
    </el-card>

    <!-- Edit Dialog -->
    <el-dialog
        :title="editDialogTitle"
        v-model:visible="editDialogVisible"
        width="90%"
        :before-close="closeEditDialog"
        custom-class="edit-dialog"
        append-to-body
    >
      <div class="edit-dialog-content">
        <div class="edit-image-container">
          <img v-if="editMode === 'crop'" ref="editImage" :src="previewUrl" style="max-width: 100%;">
          <canvas v-if="editMode === 'draw'" ref="drawingCanvas" class="edit-canvas"></canvas>
        </div>
      </div>
      <template v-slot:footer>
<span class="dialog-footer">
        <div v-if="editMode === 'crop'" class="crop-actions-dialog">
          <el-button size="small" icon="el-icon-zoom-in" @click="cropper && cropper.zoom(0.1)">放大</el-button>
          <el-button size="small" icon="el-icon-zoom-out" @click="cropper && cropper.zoom(-0.1)">缩小</el-button>
          <el-button size="small" @click="cropper && cropper.reset()">重置</el-button>
          <el-button type="primary" size="small" @click="confirmCrop">确认裁切</el-button>
          <el-button size="small" @click="closeEditDialog">取消</el-button>
        </div>
        <div v-if="editMode === 'draw'" class="drawing-actions-dialog">
          <div class="drawing-toolbar">
            <el-color-picker v-model="drawingPencil.color" size="mini"></el-color-picker>
            <el-slider v-model="drawingPencil.size" :min="1" :max="10" :step="0.01"
                       style="width: 150px; margin: 0 15px;"></el-slider>
          </div>
          <el-button type="primary" size="small" @click="confirmDrawing">确认绘画</el-button>
          <el-button size="small" @click="clearCanvas">清空</el-button>
          <el-button size="small" @click="closeEditDialog">取消</el-button>
        </div>
      </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.tool-media-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  :deep(.el-card__body) {
    padding: 5px 20px
  }
}

.main-layout {
  display: flex;
  gap: 30px;
  align-items: flex-start;

  @media screen and (max-width: 992px) {
    flex-direction: column;
    gap: 20px;
  }
}

.left-panel, .right-panel {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.section-box {
  margin-bottom: 25px;
}

.upload-section {
  text-align: left;
  margin-bottom: 20px;
  padding: 10px 15px;
  border: 1px dashed #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.file-info {
  margin-left: 15px;
  color: #606266;
  font-size: 13px;
}

.preview-section {
  text-align: center;
}

.media-info-tags {
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.options-section {
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }
}

.progress-section {
  text-align: center;
}

.progress-hint {
  margin-top: 10px;
  font-size: 13px;
  color: #909399;
}

.result-section {
  text-align: center;
}

.preview-container {
  margin-top: 15px;
  max-width: 100%;

  .preview-media {
    max-width: 100%;
    max-height: 300px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
}

.hint {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.note-section {
  margin-top: 10px;
  padding: 15px;
  background-color: #f4f4f5;
  border-radius: 4px;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}

.image-actions {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

:deep(.edit-dialog) {
  .el-dialog__body {
    padding: 10px 20px;
  }
}

.edit-dialog-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  background-color: #f0f2f5;
  overflow: hidden;
}

.edit-image-container {
  max-width: 100%;
  max-height: 60vh;
  display: flex;
  justify-content: center;
  align-items: center;

  img, .edit-canvas {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
  align-items: center;

  .crop-actions-dialog, .drawing-actions-dialog {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .drawing-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}
</style>
