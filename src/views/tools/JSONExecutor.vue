<template>
  <div class="json-executor">
    <section class="json-panel">
      <div class="editor-wrap">
        <div ref="sourceEditor" class="full-height"></div>
      </div>
    </section>

    <section class="json-panel result-panel">
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
import { JSONEditor } from 'vanilla-jsoneditor'

const CHANGE_DEBOUNCE_TIME = 300
const LARGE_CHANGE_DEBOUNCE_TIME = 700
const LARGE_TEXT_LENGTH = 300000
const LARGE_LINE_COUNT = 5000

export default {
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
      largeResultMode: false
    }
  },
  mounted () {
    this.initEditors()
  },
  beforeUnmount () {
    this.clearPendingSync()
    if (this.sourceEditorInstance) {
      this.sourceEditorInstance.destroy()
    }
    if (this.resultEditorInstance) {
      this.resultEditorInstance.destroy()
    }
  },
  methods: {
    initEditors () {
      this.sourceEditorInstance = new JSONEditor({
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

      this.resultEditorInstance = new JSONEditor({
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
    },
    handleSourceChange (content) {
      this.scheduleSourceFormat(content)
    },
    handleResultChange (content) {
      this.scheduleResultSync(content)
    },
    scheduleSourceFormat (content) {
      window.clearTimeout(this.sourceChangeTimer)

      const text = content.text || (content.json ? JSON.stringify(content.json) : '')
      if (!text.trim()) {
        this.sourceText = ''
        this.formatFromSource()
        return
      }

      this.sourceChangeTimer = window.setTimeout(() => {
        this.sourceText = text
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
      const parsed = this.parseCurrentSource()
      if (!parsed) {
        return
      }

      const formattedText = this.stringifyJson(parsed.value, 2)
      const escapedText = this.escapeText(formattedText)
      this.updateBothEditors(escapedText, formattedText)
      this.showMessage('success', '已转义')
    },
    unescapeJson () {
      this.clearPendingSync()
      const sourceText = this.getSourceValue().trim()
      if (!sourceText) {
        this.updateBothEditors('', '')
        return
      }

      const unescapedText = this.unescapeText(sourceText)
      const parsed = this.parseJsonText(unescapedText)
      if (!parsed.valid) {
        this.updateBothEditors(unescapedText, '')
        this.jsonError = parsed.message
        this.showMessage('error', parsed.message)
        return
      }

      const formattedText = this.stringifyJson(parsed.value, 2)
      this.updateBothEditors(formattedText, formattedText)
      this.showMessage('success', '已去除转义')
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
      this.setEditorValue(this.sourceEditorInstance, sourceText)
      this.setEditorValue(this.resultEditorInstance, resultText)
    },
    setEditorValue (editor, value) {
      if (!editor) {
        return
      }

      let content
      try {
        const json = JSON.parse(value)
        content = { json }
      } catch (e) {
        content = { text: value }
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
      return content.text || (content.json ? JSON.stringify(content.json) : '')
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  height: 86vh;
  padding: 8px;
  box-sizing: border-box;
}

.json-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
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
    grid-template-columns: 1fr;
    height: auto;
  }

  .json-panel {
    min-height: 420px;
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
