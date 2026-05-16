<template>
  <div class="json-executor">
    <section class="json-panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">原始数据</div>
          <div class="panel-subtitle">输入 JSON 或转义后的 JSON 字符串</div>
        </div>
        <span class="status-text" :class="{ 'status-error': jsonError }">
          {{ jsonError ? '解析失败' : '已同步' }}
        </span>
      </div>
      <div class="editor-wrap">
        <textarea ref="sourceEditor"></textarea>
      </div>
    </section>

    <section class="json-panel result-panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">格式化结果</div>
          <div class="panel-subtitle">点击行号旁箭头折叠或展开节点</div>
        </div>
        <div class="panel-actions">
          <el-button size="small" @click="compressJson">压缩</el-button>
          <el-button size="small" @click="escapeJson">转义</el-button>
          <el-button size="small" @click="unescapeJson">去除转义</el-button>
        </div>
      </div>
      <div class="editor-wrap">
        <textarea ref="resultEditor"></textarea>
      </div>
      <div v-if="largeResultMode" class="large-data-message">
        大数据模式：已关闭右侧折叠栏以降低卡顿。
      </div>
      <div v-if="jsonError" class="error-message">{{ jsonError }}</div>
    </section>
  </div>
</template>

<script>
import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/mdn-like.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/fold/foldcode'
import 'codemirror/addon/fold/foldgutter'
import 'codemirror/addon/fold/brace-fold'
import 'codemirror/addon/fold/foldgutter.css'

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
      this.sourceEditorInstance.off('changes', this.handleSourceChange)
      this.sourceEditorInstance.toTextArea()
    }
    if (this.resultEditorInstance) {
      this.resultEditorInstance.off('changes', this.handleResultChange)
      this.resultEditorInstance.toTextArea()
    }
  },
  methods: {
    initEditors () {
      const commonOptions = {
        lineNumbers: true,
        mode: 'application/json',
        theme: 'mdn-like',
        tabSize: 2,
        matchBrackets: true,
        lineWrapping: false,
        viewportMargin: 20,
        workTime: 80,
        workDelay: 120,
        maxHighlightLength: 10000
      }

      this.sourceEditorInstance = CodeMirror.fromTextArea(this.$refs.sourceEditor, commonOptions)
      this.resultEditorInstance = CodeMirror.fromTextArea(this.$refs.resultEditor, {
        ...commonOptions,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        extraKeys: {
          'Ctrl-Q': cm => cm.foldCode(cm.getCursor())
        }
      })

      this.sourceEditorInstance.on('changes', this.handleSourceChange)
      this.resultEditorInstance.on('changes', this.handleResultChange)
    },
    handleSourceChange (editor) {
      if (this.syncing) {
        return
      }

      this.scheduleSourceFormat(editor)
    },
    handleResultChange (editor) {
      if (this.syncing) {
        return
      }

      this.scheduleResultSync(editor)
    },
    scheduleSourceFormat (editor) {
      window.clearTimeout(this.sourceChangeTimer)

      if (editor.lineCount() === 1 && !editor.getLine(0).trim()) {
        this.sourceText = ''
        this.formatFromSource()
        return
      }

      this.sourceChangeTimer = window.setTimeout(() => {
        this.sourceText = this.getSourceValue()
        this.formatFromSource()
      }, this.getEditorDebounceTime(editor))
    },
    scheduleResultSync (editor) {
      window.clearTimeout(this.resultChangeTimer)
      this.resultChangeTimer = window.setTimeout(() => {
        this.resultText = this.getResultValue()
        this.syncSourceFromResult()
      }, this.getEditorDebounceTime(editor))
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
    compressJson () {
      this.clearPendingSync()
      const parsed = this.parseCurrentSource()
      if (!parsed) {
        return
      }

      const compactText = this.stringifyJson(parsed.value)
      const formattedText = this.stringifyJson(parsed.value, 2)
      this.updateBothEditors(compactText, formattedText)
      this.showMessage('success', '已压缩')
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
      return nestedResult.valid ? nestedResult : {
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
        .replace(/\\r/g, '\r')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    },
    updateBothEditors (sourceText, resultText) {
      this.sourceText = sourceText
      this.resultText = resultText
      this.jsonError = ''
      this.setEditorValue(this.sourceEditorInstance, sourceText)
      this.setEditorValue(this.resultEditorInstance, resultText)
    },
    setEditorValue (editor, value) {
      if (!editor || editor.getValue() === value) {
        return
      }

      this.syncing = true
      try {
        if (editor === this.resultEditorInstance) {
          this.replaceResultDocument(value)
        } else {
          editor.setValue(value)
        }
      } finally {
        this.syncing = false
      }
    },
    replaceResultDocument (value) {
      const enableFoldGutter = !this.isLargeText(value)

      if (!enableFoldGutter) {
        this.setResultFoldGutter(false)
      }

      this.clearFoldMarkers(this.resultEditorInstance)
      this.resultEditorInstance.swapDoc(new CodeMirror.Doc(value, this.resultEditorInstance.getOption('mode')))
      this.resultEditorInstance.clearHistory()

      if (enableFoldGutter) {
        this.setResultFoldGutter(true)
      }

      this.largeResultMode = !enableFoldGutter
    },
    setResultFoldGutter (enabled) {
      if (!this.resultEditorInstance || this.foldGutterEnabled === enabled) {
        return
      }

      this.clearFoldMarkers(this.resultEditorInstance)
      this.resultEditorInstance.setOption('foldGutter', enabled)
      this.resultEditorInstance.setOption(
        'gutters',
        enabled ? ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'] : ['CodeMirror-linenumbers']
      )
      this.foldGutterEnabled = enabled
    },
    clearFoldMarkers (editor) {
      if (!editor || typeof editor.getAllMarks !== 'function') {
        return
      }

      editor.operation(() => {
        editor.getAllMarks().forEach(marker => {
          if (!marker.__isFold) {
            return
          }

          try {
            marker.clear()
          } catch (error) {
            // 大文本整体替换时 CodeMirror 的旧折叠标记可能已经失效，忽略后用新 Doc 重建。
          }
        })
      })
    },
    clearPendingSync () {
      window.clearTimeout(this.sourceChangeTimer)
      window.clearTimeout(this.resultChangeTimer)
      this.sourceChangeTimer = null
      this.resultChangeTimer = null
    },
    getEditorDebounceTime (editor) {
      if (!editor) {
        return CHANGE_DEBOUNCE_TIME
      }

      const firstLineLength = editor.lineCount() === 1 ? editor.getLine(0).length : 0
      return editor.lineCount() > LARGE_LINE_COUNT || firstLineLength > LARGE_TEXT_LENGTH
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
      return this.sourceEditorInstance ? this.sourceEditorInstance.getValue() : this.sourceText
    },
    getResultValue () {
      return this.resultEditorInstance ? this.resultEditorInstance.getValue() : this.resultText
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

:deep(.CodeMirror) {
  height: 100%;
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 13px;
}

:deep(.CodeMirror-scroll) {
  min-height: 100%;
}

:deep(.CodeMirror-foldgutter) {
  width: 16px;
}

:deep(.CodeMirror-foldmarker) {
  pointer-events: none;
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
