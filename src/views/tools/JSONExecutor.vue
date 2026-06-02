<template>
  <div ref="container" class="json-executor">
    <section class="json-panel" :style="{ width: leftWidth + '%' }">
      <div class="panel-toolbar">
        <el-tooltip content="Ctrl + S" placement="bottom" :show-after="300">
          <el-button size="small" type="primary" @click="formatSourceText">格式化</el-button>
        </el-tooltip>
        <el-tooltip content="Ctrl + Shift + Z" placement="bottom" :show-after="300">
          <el-button size="small" @click="compressSourceText">压缩</el-button>
        </el-tooltip>
        <el-button size="small" @click="escapeJson">转义</el-button>
      </div>
      <div class="editor-wrap">
        <div ref="sourceEditor" class="full-height"></div>
      </div>
    </section>

    <div
      class="json-resizer"
      :class="{ 'is-dragging': isDragging }"
      @mousedown="startResize"
    ></div>

    <section class="json-panel result-panel" :style="{ width: 100 - leftWidth + '%' }">
      <div class="editor-wrap">
        <div ref="resultEditor" class="full-height"></div>
      </div>
      <div v-if="largeResultMode" class="large-data-message">
        大数据模式：已关闭右侧折叠栏以降低卡顿。
      </div>
      <div v-if="jsonError" class="error-message">{{ jsonError }}</div>
    </section>
  </div>
</template>

<script>
import { createJSONEditor } from 'vanilla-jsoneditor'

const CHANGE_DEBOUNCE_TIME = 300
const LARGE_CHANGE_DEBOUNCE_TIME = 700
const LARGE_TEXT_LENGTH = 300000
const LARGE_LINE_COUNT = 5000
const SOURCE_STORAGE_KEY = 'json-executor-source-text'

export default {
  tdk: {
    title: '在线 JSON 编辑工具',
    description: '在线 JSON 格式化、压缩、转义、去除转义,支持大数据量,浏览器即开即用。',
    keywords: 'JSON 在线编辑, JSON 格式化, JSON 压缩, JSON 转义, 在线工具'
  },
  data () {
    return {
      sourceEditorInstance: null,
      resultEditorInstance: null,
      sourceText: '',
      resultText: '',
      jsonError: '',
      syncing: false,
      sourceChangeTimer: null,
      resultChangeTimer: null,
      foldGutterEnabled: true,
      largeResultMode: false,
      leftWidth: 50,
      isDragging: false
    }
  },
  mounted () {
    this.initEditors()
    window.addEventListener('keydown', this.handleKeyDown, true)
  },
  beforeUnmount () {
    this.clearPendingSync()
    this.stopResize()
    window.removeEventListener('keydown', this.handleKeyDown, true)
    if (this.sourceEditorInstance) {
      this.sourceEditorInstance.destroy()
    }
    if (this.resultEditorInstance) {
      this.resultEditorInstance.destroy()
    }
  },
  methods: {
    handleKeyDown (event) {
      if (!(event.ctrlKey || event.metaKey)) return
      if (!this.$refs.container || !this.$refs.container.contains(event.target)) return

      const key = event.key.toLowerCase()
      if (key === 's' && !event.shiftKey) {
        event.preventDefault()
        event.stopPropagation()
        this.formatSourceText()
        return
      }
      if (key === 'z' && event.shiftKey) {
        event.preventDefault()
        event.stopPropagation()
        this.compressSourceText()
      }
    },
    formatSourceText () {
      this.clearPendingSync()
      const text = this.getSourceValue().trim()
      if (!text) {
        this.updateBothEditors('', '')
        return
      }

      const parsed = this.parseJsonText(text)
      if (!parsed.valid) {
        this.jsonError = parsed.message
        this.showMessage('error', parsed.message)
        return
      }

      const formattedText = this.stringifyJson(parsed.value, 2)
      this.updateBothEditors(formattedText, formattedText)
      this.showMessage('success', '已格式化')
    },
    compressSourceText () {
      this.clearPendingSync()
      const text = this.getSourceValue().trim()
      if (!text) {
        this.updateBothEditors('', '')
        return
      }

      const parsed = this.parseJsonText(text)
      if (!parsed.valid) {
        this.jsonError = parsed.message
        this.showMessage('error', parsed.message)
        return
      }

      const compressedText = this.stringifyJson(parsed.value)
      const formattedText = this.stringifyJson(parsed.value, 2)
      this.updateBothEditors(compressedText, formattedText)
      this.showMessage('success', '已压缩')
    },
    startResize (event) {
      event.preventDefault()
      this.isDragging = true
      document.addEventListener('mousemove', this.handleResize)
      document.addEventListener('mouseup', this.stopResize)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    handleResize (event) {
      if (!this.isDragging || !this.$refs.container) return
      const rect = this.$refs.container.getBoundingClientRect()
      const offset = event.clientX - rect.left
      const percent = (offset / rect.width) * 100
      this.leftWidth = Math.min(80, Math.max(20, percent))
    },
    stopResize () {
      if (!this.isDragging) return
      this.isDragging = false
      document.removeEventListener('mousemove', this.handleResize)
      document.removeEventListener('mouseup', this.stopResize)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    },
    initEditors () {
      const storedSourceText = localStorage.getItem(SOURCE_STORAGE_KEY) || ''

      this.sourceEditorInstance = createJSONEditor({
        target: this.$refs.sourceEditor,
        props: {
          mode: 'text',
          mainMenuBar: false,
          statusBar: false,
          askToFormat: false,
          onChange: (content, previousContent, { source }) => {
            if (source === 'set' || this.syncing) return
            this.handleSourceChange(content)
          }
        }
      })

      this.resultEditorInstance = createJSONEditor({
        target: this.$refs.resultEditor,
        props: {
          mode: 'tree',
          mainMenuBar: true,
          statusBar: true,
          onChange: (content, previousContent, { source }) => {
            if (source === 'set' || this.syncing) return
            this.handleResultChange(content)
          }
        }
      })

      if (storedSourceText) {
        this.sourceText = storedSourceText
        this.setEditorValue(this.sourceEditorInstance, storedSourceText)
        this.formatFromSource()
        this.selectAllSourceText()
      }
    },
    handleSourceChange (content) {
      this.scheduleSourceFormat(content)
    },
    handleResultChange (content) {
      this.scheduleResultSync(content)
    },
    selectAllSourceText () {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!this.sourceEditorInstance) {
            return
          }
          try {
            const text = this.getSourceValue()
            if (!text.length) {
              return
            }
            this.sourceEditorInstance.focus()
            this.sourceEditorInstance.select({
              type: 'text',
              ranges: [
                {
                  anchor: 0,
                  head: text.length
                }
              ],
              main: 0
            })
          } catch (e) {
            // 编辑器内部状态尚未就绪时忽略选择错误
          }
        })
      })
    },
    scheduleSourceFormat (content) {
      window.clearTimeout(this.sourceChangeTimer)

      const text = content.text || (content.json ? JSON.stringify(content.json) : '')
      if (!text.trim()) {
        this.sourceText = ''
        this.saveSourceText()
        this.formatFromSource()
        return
      }

      this.sourceChangeTimer = window.setTimeout(() => {
        this.sourceText = text
        this.saveSourceText()
        this.formatFromSource()
      }, this.getEditorDebounceTime(text))
    },
    scheduleResultSync (content) {
      window.clearTimeout(this.resultChangeTimer)
      this.resultChangeTimer = window.setTimeout(() => {
        this.resultText = content.text || (content.json ? JSON.stringify(content.json, null, 2) : '')
        this.syncSourceFromResult()
      }, this.getEditorDebounceTime(this.resultText))
    },
    syncSourceFromResult () {
      this.setEditorValue(this.sourceEditorInstance, this.resultText)
      this.sourceText = this.resultText
      this.saveSourceText()
      this.validateResultText()
    },
    formatFromSource () {
      this.sourceText = this.getSourceValue()
      const rawText = this.sourceText.trim()
      if (!rawText) {
        this.jsonError = ''
        this.resultText = ''
        this.setEditorValue(this.resultEditorInstance, '')
        return
      }

      const parsed = this.parseJsonText(rawText)
      if (!parsed.valid) {
        this.jsonError = parsed.message
        return
      }

      this.jsonError = ''
      this.resultText = this.stringifyJson(parsed.value, 2)
      this.setEditorValue(this.resultEditorInstance, this.resultText)
    },
    validateResultText () {
      const text = this.resultText.trim()
      if (!text) {
        this.jsonError = ''
        return
      }

      const parsed = this.parseJsonText(text)
      this.jsonError = parsed.valid ? '' : parsed.message
    },
    clearJson () {
      this.clearPendingSync()
      this.updateBothEditors('', '')
    },
    unfoldAllResult () {
      if (!this.resultEditorInstance) {
        return
      }
      this.resultEditorInstance.expand(() => true)
    },
    escapeJson () {
      this.clearPendingSync()
      const text = this.getSourceValue()
      if (!text) {
        this.showMessage('warning', '请输入内容')
        return
      }

      const escapedText = this.escapeText(text)
      const parsed = this.parseJsonText(text)
      const resultText = parsed.valid ? this.stringifyJson(parsed.value, 2) : ''
      this.updateBothEditors(escapedText, resultText)
      this.showMessage('success', '已转义')
    },
    parseCurrentSource () {
      const text = this.getSourceValue().trim()
      if (!text) {
        this.jsonError = ''
        this.showMessage('warning', '请输入 JSON 数据')
        return null
      }

      const parsed = this.parseJsonText(text)
      if (!parsed.valid) {
        this.jsonError = parsed.message
        this.showMessage('error', parsed.message)
        return null
      }

      return parsed
    },
    parseJsonText (text) {
      const directResult = this.tryParse(text)
      if (directResult.valid) {
        return this.parseNestedJsonString(directResult.value)
      }

      const unescapedText = this.unescapeText(text)
      if (unescapedText !== text) {
        const unescapedResult = this.tryParse(unescapedText)
        if (unescapedResult.valid) {
          return this.parseNestedJsonString(unescapedResult.value)
        }
      }

      return directResult
    },
    parseNestedJsonString (value) {
      if (typeof value !== 'string') {
        return {
          valid: true,
          value
        }
      }

      const trimmedValue = value.trim()
      if (!this.looksLikeJson(trimmedValue)) {
        return {
          valid: true,
          value
        }
      }

      const nestedResult = this.tryParse(trimmedValue)
      return nestedResult.valid
        ? nestedResult
        : {
            valid: true,
            value
          }
    },
    tryParse (text) {
      try {
        return {
          valid: true,
          value: JSON.parse(text)
        }
      } catch (error) {
        return {
          valid: false,
          message: `JSON 解析错误：${error.message}`
        }
      }
    },
    stringifyJson (value, space = 0) {
      return JSON.stringify(value, null, space)
    },
    looksLikeJson (text) {
      return /^[[{]/.test(text) || /^-?\d/.test(text) || /^(true|false|null)($|\s)/.test(text)
    },
    escapeText (text) {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/"/g, '\\"')
    },
    unescapeText (text) {
      try {
        const parsed = JSON.parse(text)
        if (typeof parsed === 'string') {
          return parsed
        }
      } catch (error) {
        // 不是完整 JSON 字符串时，按普通转义文本处理。
      }

      return text
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"')
        .replace(/\\t/g, '\t')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
    },
    updateBothEditors (sourceText, resultText) {
      this.sourceText = sourceText
      this.resultText = resultText
      this.jsonError = ''
      this.saveSourceText()
      this.setEditorValue(this.sourceEditorInstance, sourceText)
      this.setEditorValue(this.resultEditorInstance, resultText)
    },
    saveSourceText () {
      localStorage.setItem(SOURCE_STORAGE_KEY, this.sourceText)
    },
    setEditorValue (editor, value) {
      if (!editor) {
        return
      }

      let content
      if (editor === this.sourceEditorInstance) {
        content = { text: value }
      } else {
        try {
          const json = JSON.parse(value)
          content = { json }
        } catch (e) {
          content = { text: value }
        }
      }

      this.syncing = true
      try {
        editor.set(content)
      } finally {
        this.syncing = false
      }
    },
    clearPendingSync () {
      window.clearTimeout(this.sourceChangeTimer)
      window.clearTimeout(this.resultChangeTimer)
      this.sourceChangeTimer = null
      this.resultChangeTimer = null
    },
    getEditorDebounceTime (text) {
      if (typeof text !== 'string') {
        return CHANGE_DEBOUNCE_TIME
      }

      return text.length > LARGE_TEXT_LENGTH
        ? LARGE_CHANGE_DEBOUNCE_TIME
        : CHANGE_DEBOUNCE_TIME
    },
    isLargeText (text) {
      return text.length > LARGE_TEXT_LENGTH || this.hasMoreLinesThan(text, LARGE_LINE_COUNT)
    },
    hasMoreLinesThan (text, limit) {
      let lineCount = 1
      for (let index = 0; index < text.length; index++) {
        if (text.charCodeAt(index) === 10) {
          lineCount++
        }
        if (lineCount > limit) {
          return true
        }
      }
      return false
    },
    getSourceValue () {
      if (!this.sourceEditorInstance) return this.sourceText
      const content = this.sourceEditorInstance.get()
      if (typeof content.text === 'string') return content.text
      if (content.json !== undefined) return JSON.stringify(content.json, null, 2)
      return ''
    },
    getResultValue () {
      if (!this.resultEditorInstance) return this.resultText
      const content = this.resultEditorInstance.get()
      return content.text || (content.json ? JSON.stringify(content.json, null, 2) : '')
    },
    showMessage (type, message) {
      if (this.$message && this.$message[type]) {
        this.$message[type](message)
      }
    }
  }
}
</script>

<style scoped lang="scss">
.json-executor {
  display: flex;
  align-items: stretch;
  gap: 0;
  height: 86vh;
  padding: 8px;
  box-sizing: border-box;
}

.json-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--theme-primary-light-7);
  border-radius: 6px;
  background: var(--theme-primary-light-9);
  overflow: hidden;
}

.panel-toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--theme-primary-light-7);
  background: var(--theme-primary-light-9);
}

[data-theme='dark'] .panel-toolbar {
  border-bottom-color: var(--theme-el-border-color);
  background: var(--theme-el-bg-color-overlay);
}

.json-panel :deep(.jse-main) {
  --jse-theme-color: var(--theme-accent-color);
  --jse-theme-color-highlight: var(--theme-primary-light-3);
  --jse-panel-background: var(--theme-primary-light-9);
  --jse-panel-border: var(--theme-primary-light-7);
  --jse-main-border: var(--theme-primary-light-7);
  --jse-selection-background-color: var(--theme-primary-light-7);
  --jse-selection-background-inactive-color: var(--theme-primary-light-8);
  --jse-hover-background-color: var(--theme-primary-light-8);
  --jse-active-line-background-color: var(--theme-primary-light-9);
  --jse-context-menu-background: var(--theme-accent-color);
  --jse-context-menu-background-highlight: var(--theme-primary-light-3);
  --jse-context-menu-pointer-background: var(--theme-primary-dark-2);
  --jse-context-menu-pointer-background-highlight: var(--theme-accent-color);
  --jse-button-primary-background: var(--theme-accent-color);
  --jse-button-primary-background-highlight: var(--theme-primary-light-3);
  --jse-key-color: var(--theme-primary-dark-2);
  --jse-value-color-string: var(--theme-accent-color);
  --jse-delimiter-color: var(--muted-text-color);
  --jse-tag-background: var(--theme-primary-light-8);
  --jse-tag-color: var(--theme-primary-dark-2);
  --jse-input-border-focus: var(--theme-accent-color);
}

.json-panel :deep(.cm-editor) {
  .cm-scroller > .cm-selectionLayer {
    z-index: 2;
  }

  .cm-content ::selection,
  .cm-line ::selection,
  .cm-line::selection {
    background-color: var(--theme-primary-light-5) !important;
  }
}

[data-theme='dark'] .json-panel :deep(.cm-editor) {
  .cm-content ::selection,
  .cm-line ::selection,
  .cm-line::selection {
    background-color: var(--theme-primary-dark-2) !important;
  }
}

[data-theme='dark'] .json-panel {
  border-color: var(--theme-el-border-color);
  background: var(--theme-el-bg-color-overlay);
}

[data-theme='dark'] .json-panel :deep(.jse-main) {
  --jse-panel-background: var(--theme-el-bg-color-overlay);
  --jse-panel-border: var(--theme-el-border-color);
  --jse-main-border: var(--theme-el-border-color);
  --jse-background-color: var(--theme-el-bg-color-overlay);
  --jse-text-color: var(--text-color);
  --jse-text-color-inverse: var(--theme-el-bg-color);
  --jse-text-readonly: var(--muted-text-color);
  --jse-panel-color: var(--text-color);
  --jse-panel-color-readonly: var(--muted-text-color);
  --jse-controls-background: var(--theme-el-fill-color);
  --jse-controls-color: var(--text-color);
  --jse-controls-color-readonly: var(--muted-text-color);
  --jse-input-background: var(--theme-el-fill-color);
  --jse-input-background-readonly: var(--theme-el-fill-color-lighter);
  --jse-input-border: var(--theme-el-border-color);
  --jse-selection-background-color: var(--theme-primary-dark-2);
  --jse-selection-background-inactive-color: var(--theme-el-fill-color-lighter);
  --jse-hover-background-color: var(--theme-el-fill-color-light);
  --jse-active-line-background-color: var(--theme-el-fill-color);
  --jse-key-color: var(--theme-primary-light-5);
  --jse-value-color-string: var(--theme-primary-light-3);
  --jse-value-color-number: #f59e0b;
  --jse-value-color-boolean: #f472b6;
  --jse-value-color-null: var(--muted-text-color);
  --jse-delimiter-color: var(--muted-text-color);
  --jse-tag-background: var(--theme-el-fill-color-lighter);
  --jse-tag-color: var(--text-color);
}

.json-resizer {
  flex: 0 0 6px;
  margin: 0 1px;
  cursor: col-resize;
  background: #c0c4cc;
  border-radius: 3px;
  transition: background 0.2s;
  position: relative;

  &:hover,
  &.is-dragging {
    background: #409eff;
  }

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 32px;
    background: #c0c4cc;
    border-radius: 1px;
    transform: translate(-50%, -50%);
  }

  &:hover::before,
  &.is-dragging::before {
    background: #fff;
  }
}

.panel-header {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
  box-sizing: border-box;
}

.panel-title {
  line-height: 20px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.panel-subtitle {
  margin-top: 2px;
  line-height: 18px;
  font-size: 12px;
  color: #909399;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.panel-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.status-text {
  flex: 0 0 auto;
  font-size: 12px;
  color: #67c23a;
}

.status-error {
  color: #f56c6c;
}

.editor-wrap {
  min-height: 0;
  flex: 1;
}

.error-message {
  flex: 0 0 auto;
  padding: 8px 12px;
  border-top: 1px solid #fde2e2;
  background: #fef0f0;
  line-height: 18px;
  font-size: 12px;
  color: #f56c6c;
}

.large-data-message {
  flex: 0 0 auto;
  padding: 8px 12px;
  border-top: 1px solid #f3e7c6;
  background: #fdf6ec;
  line-height: 18px;
  font-size: 12px;
  color: #b88230;
}

.full-height {
  height: 100%;
}

:deep(.jse-main) {
  height: 100%;
  font-size: 14px;
}

@media (max-width: 900px) {
  .json-executor {
    flex-direction: column;
    height: auto;
  }

  .json-panel {
    min-height: 420px;
    width: 100% !important;
  }

  .json-resizer {
    display: none;
  }

  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .panel-actions {
    justify-content: flex-start;
  }
}
</style>
