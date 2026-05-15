<template>
  <div class="json-executor">
    <div class="json-panel raw-panel">
      <div class="panel-header">
        <span class="panel-title">原始数据</span>
      </div>
      <div class="editor-wrap">
        <textarea ref="rawEditor"></textarea>
      </div>
    </div>

    <div class="json-panel formatted-panel">
      <div class="panel-header">
        <div class="panel-info">
          <span class="panel-title">格式化结果</span>
          <span v-if="errorMessage" class="parse-error">{{ errorMessage }}</span>
        </div>
        <div class="panel-actions">
          <el-button size="small" type="primary" plain @click="compressJson">压缩</el-button>
          <el-button size="small" type="primary" plain @click="escapeJson">转义</el-button>
          <el-button size="small" type="primary" plain @click="unescapeJson">去除转义</el-button>
          <el-button size="small" type="primary" plain @click="foldAllJsonFolds">全部折叠</el-button>
          <el-button size="small" type="primary" plain @click="unfoldAllJsonFolds">全部展开</el-button>
        </div>
      </div>
      <div class="editor-wrap">
        <textarea ref="formattedEditor"></textarea>
      </div>
    </div>
  </div>
</template>

<script>
import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/mdn-like.css'
import 'codemirror/mode/javascript/javascript'

export default {
  data () {
    return {
      rawEditor: null,
      formattedEditor: null,
      rawValue: '',
      formattedValue: '',
      errorMessage: '',
      updatingFromRaw: false,
      updatingFromFormatted: false,
      updatingFoldDisplay: false,
      foldRanges: {},
      foldedLines: {},
      displayLineToOriginalLine: [],
      renderedFoldMarkerLines: {},
      foldRefreshTimer: null,
      foldRenderTimer: null,
      editorRefreshTimer: null,
      delayedEditorRefreshTimer: null
    }
  },
  mounted () {
    this.initEditors()
  },
  activated () {
    this.refreshCodeMirrorEditors()
  },
  beforeUnmount () {
    clearTimeout(this.foldRefreshTimer)
    clearTimeout(this.foldRenderTimer)
    clearTimeout(this.editorRefreshTimer)
    clearTimeout(this.delayedEditorRefreshTimer)
    this.clearJsonFolds()
    this.rawEditor?.toTextArea()
    this.formattedEditor?.toTextArea()
  },
  methods: {
    initEditors () {
      this.rawEditor = CodeMirror.fromTextArea(this.$refs.rawEditor, {
        lineNumbers: true,
        lineWrapping: true,
        mode: 'application/json',
        theme: 'mdn-like'
      })

      this.formattedEditor = CodeMirror.fromTextArea(this.$refs.formattedEditor, {
        lineNumbers: true,
        lineWrapping: true,
        mode: 'application/json',
        theme: 'mdn-like',
        gutters: ['CodeMirror-linenumbers', 'json-fold-gutter'],
        extraKeys: {
          'Ctrl-Q': cm => this.toggleJsonFold(cm.getCursor().line)
        }
      })

      this.rawEditor.on('changes', () => {
        if (this.updatingFromFormatted) return
        this.handleRawChanges(this.rawEditor.getValue())
      })

      this.formattedEditor.on('changes', () => {
        if (this.updatingFromRaw || this.updatingFoldDisplay) return
        this.foldedLines = {}
        this.handleFormattedChanges(this.formattedEditor.getValue())
      })

      this.formattedEditor.on('beforeChange', (cm, change) => {
        if (!this.hasActiveFolds() || this.updatingFromRaw || this.updatingFoldDisplay) return

        change.cancel()
        this.unfoldAllJsonFolds()
      })

      this.formattedEditor.on('viewportChange', () => {
        this.scheduleJsonFoldRender()
      })

      this.formattedEditor.on('gutterClick', (cm, line, gutter, event) => {
        if (gutter !== 'json-fold-gutter') return
        event?.preventDefault()
        this.toggleJsonFold(line)
      })

      this.rawEditor.setValue(this.rawValue)
      this.formattedEditor.setValue(this.formattedValue)
      this.rebuildJsonFoldRanges(this.formattedValue)
      this.applyFormattedDisplayValue()
      this.refreshCodeMirrorEditors()
    },
    handleRawChanges (value) {
      this.rawValue = value

      if (!value.trim()) {
        this.errorMessage = ''
        this.setFormattedValue('')
        return
      }

      const parsed = this.parseInputJson(value)
      if (!parsed.valid) {
        this.errorMessage = this.formatError(parsed.error)
        return
      }

      this.errorMessage = ''
      this.setFormattedValue(JSON.stringify(parsed.value, null, 2))
    },
    handleFormattedChanges (value) {
      this.formattedValue = value

      if (!value.trim()) {
        this.errorMessage = ''
        this.setRawValue('')
        return
      }

      const parsed = this.parseInputJson(value)
      if (!parsed.valid) {
        this.errorMessage = this.formatError(parsed.error)
        return
      }

      this.errorMessage = ''
      const formatted = JSON.stringify(parsed.value, null, 2)
      this.setRawValue(formatted)
      this.formattedValue = value
      this.rebuildJsonFoldRanges(value)
      this.applyFormattedDisplayValue()
    },
    parseInputJson (value) {
      try {
        return {
          valid: true,
          value: this.parseNestedJsonValue(JSON.parse(value))
        }
      } catch (firstError) {
        if (!this.hasJsonEscape(value)) {
          return {
            valid: false,
            error: firstError
          }
        }

        try {
          const unescapedValue = JSON.parse(this.wrapAsEscapedJsonString(value))
          return {
            valid: true,
            value: this.parseNestedJsonValue(unescapedValue)
          }
        } catch (secondError) {
          return {
            valid: false,
            error: firstError
          }
        }
      }
    },
    parseNestedJsonValue (value) {
      if (typeof value !== 'string') return value

      const trimmedValue = value.trim()
      if (!trimmedValue.startsWith('{') && !trimmedValue.startsWith('[')) return value

      try {
        return JSON.parse(trimmedValue)
      } catch (e) {
        return value
      }
    },
    hasJsonEscape (value) {
      return /\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4})/.test(value)
    },
    wrapAsEscapedJsonString (value) {
      return '"' + value.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"'
    },
    setRawValue (value) {
      if (this.rawEditor && this.rawEditor.getValue() !== value) {
        this.updatingFromFormatted = true
        this.rawEditor.setValue(value)
        this.updatingFromFormatted = false
        this.scheduleEditorRefresh()
      }
      this.rawValue = value
    },
    setFormattedValue (value) {
      this.formattedValue = value
      this.foldedLines = {}
      this.rebuildJsonFoldRanges(value)
      this.applyFormattedDisplayValue()
    },
    applyValueToBothEditors (value) {
      this.errorMessage = ''
      this.setRawValue(value)
      this.setFormattedValue(value)
    },
    getParsedLeftJson () {
      const parsed = this.parseInputJson(this.rawValue)
      if (!parsed.valid) {
        this.$message.error('左侧内容不是有效的 JSON')
        return undefined
      }
      return parsed.value
    },
    compressJson () {
      const parsedValue = this.getParsedLeftJson()
      if (typeof parsedValue === 'undefined') return

      const compressed = JSON.stringify(parsedValue)
      this.applyValueToBothEditors(compressed)
    },
    escapeJson () {
      const parsedValue = this.getParsedLeftJson()
      if (typeof parsedValue === 'undefined') return

      const formatted = JSON.stringify(parsedValue, null, 2)
      const escaped = JSON.stringify(formatted)
      this.applyValueToBothEditors(escaped)
    },
    unescapeJson () {
      const parsed = this.parseInputJson(this.rawValue)
      if (!parsed.valid) {
        this.$message.error('左侧内容不是有效的 JSON 字符串')
        return
      }

      const formatted = JSON.stringify(parsed.value, null, 2)
      this.applyValueToBothEditors(formatted)
    },
    formatError (error) {
      return error?.message ? 'JSON 解析失败: ' + error.message : 'JSON 解析失败'
    },
    scheduleJsonFoldRender () {
      clearTimeout(this.foldRenderTimer)
      this.foldRenderTimer = setTimeout(() => {
        this.renderVisibleFoldMarkers()
      }, 60)
    },
    scheduleEditorRefresh () {
      clearTimeout(this.editorRefreshTimer)
      this.editorRefreshTimer = setTimeout(() => {
        this.refreshCodeMirrorEditors()
      }, 0)
    },
    refreshCodeMirrorEditors () {
      this.$nextTick(() => {
        const refreshEditors = () => {
          this.rawEditor?.refresh()
          this.formattedEditor?.refresh()
          this.scheduleJsonFoldRender()
        }

        window.requestAnimationFrame(() => {
          refreshEditors()
          clearTimeout(this.delayedEditorRefreshTimer)
          this.delayedEditorRefreshTimer = setTimeout(refreshEditors, 120)
        })
      })
    },
    rebuildJsonFoldRanges (value) {
      this.foldRanges = this.buildJsonFoldRanges(value)
      this.renderVisibleFoldMarkers()
    },
    buildJsonFoldRanges (value) {
      const ranges = {}
      const stack = []
      let line = 0
      let ch = 0
      let inString = false
      let escaping = false

      for (let i = 0; i < value.length; i++) {
        const current = value[i]

        if (current === '\n') {
          line++
          ch = 0
          escaping = false
          continue
        }

        if (inString) {
          if (escaping) {
            escaping = false
          } else if (current === '\\') {
            escaping = true
          } else if (current === '"') {
            inString = false
          }
          ch++
          continue
        }

        if (current === '"') {
          inString = true
        } else if (current === '{' || current === '[') {
          stack.push({
            char: current,
            line,
            ch
          })
        } else if (current === '}' || current === ']') {
          const start = stack.pop()
          if (start && this.isMatchingJsonBracket(start.char, current) && start.line < line) {
            ranges[start.line] = {
              from: CodeMirror.Pos(start.line, start.ch + 1),
              to: CodeMirror.Pos(line, ch),
              parentLine: stack.length ? stack[stack.length - 1].line : null
            }
          }
        }

        ch++
      }

      return ranges
    },
    isMatchingJsonBracket (open, close) {
      return (open === '{' && close === '}') || (open === '[' && close === ']')
    },
    toggleJsonFold (line) {
      if (!this.formattedEditor) return

      const originalLine = this.displayLineToOriginalLine[line]
      if (typeof originalLine === 'undefined' || !this.foldRanges[originalLine]) return

      if (this.foldedLines[originalLine]) {
        this.unfoldJsonFold(originalLine)
        return
      }

      this.foldJsonFold(originalLine)
    },
    foldJsonFold (line) {
      if (!this.formattedEditor || !this.foldRanges[line]) return
      this.foldedLines[line] = true
      this.applyFormattedDisplayValue()
    },
    unfoldJsonFold (line) {
      delete this.foldedLines[line]
      this.applyFormattedDisplayValue()
    },
    isDescendantFoldLine (line, ancestorLine) {
      let parentLine = this.foldRanges[line]?.parentLine

      while (parentLine !== null && typeof parentLine !== 'undefined') {
        if (parentLine === ancestorLine) return true
        parentLine = this.foldRanges[parentLine]?.parentLine
      }

      return false
    },
    hasFoldedAncestor (line) {
      let parentLine = this.foldRanges[line]?.parentLine

      while (parentLine !== null && typeof parentLine !== 'undefined') {
        if (this.foldedLines[parentLine]) return true
        parentLine = this.foldRanges[parentLine]?.parentLine
      }

      return false
    },
    foldAllJsonFolds () {
      this.foldedLines = {}

      Object.keys(this.foldRanges).forEach(line => {
        this.foldedLines[line] = true
      })

      this.applyFormattedDisplayValue()
    },
    unfoldAllJsonFolds () {
      this.foldedLines = {}
      this.applyFormattedDisplayValue()
    },
    applyFormattedDisplayValue () {
      if (!this.formattedEditor) return

      const displayValue = this.buildFormattedDisplayValue()
      if (this.formattedEditor.getValue() !== displayValue) {
        this.updatingFoldDisplay = true
        this.formattedEditor.setValue(displayValue)
        this.updatingFoldDisplay = false
      }
      this.renderVisibleFoldMarkers()
      this.scheduleEditorRefresh()
    },
    buildFormattedDisplayValue () {
      const lines = this.formattedValue ? this.formattedValue.split('\n') : []
      const displayLines = []
      const displayLineToOriginalLine = []

      for (let line = 0; line < lines.length; line++) {
        const range = this.foldRanges[line]

        displayLines.push(this.foldedLines[line] && range ? this.getFoldedLineText(line, lines) : lines[line])
        displayLineToOriginalLine.push(line)

        if (this.foldedLines[line] && range) {
          line = range.to.line
        }
      }

      this.displayLineToOriginalLine = displayLineToOriginalLine
      return displayLines.join('\n')
    },
    getFoldedLineText (line, lines) {
      const range = this.foldRanges[line]
      const openLineText = lines[line] || ''
      const closeLineText = lines[range.to.line] || ''
      const closeText = closeLineText.slice(range.to.ch).trimEnd()
      return openLineText.slice(0, range.from.ch) + ' ... ' + closeText
    },
    hasActiveFolds () {
      return Object.keys(this.foldedLines).length > 0
    },
    renderVisibleFoldMarkers () {
      if (!this.formattedEditor) return

      this.clearRenderedFoldMarkers()
      const viewport = this.getBufferedViewport()

      for (let line = viewport.from; line <= viewport.to; line++) {
        const originalLine = this.displayLineToOriginalLine[line]
        if (typeof originalLine !== 'undefined' && this.foldRanges[originalLine]) {
          this.setJsonFoldMarker(line, Boolean(this.foldedLines[originalLine]))
        }
      }
    },
    getBufferedViewport () {
      if (!this.formattedEditor) return { from: 0, to: 0 }

      const viewport = this.formattedEditor.getViewport()
      return {
        from: Math.max(this.formattedEditor.firstLine(), viewport.from - 30),
        to: Math.min(this.formattedEditor.lastLine(), viewport.to + 30)
      }
    },
    setJsonFoldMarker (line, folded) {
      if (!this.formattedEditor) return

      const marker = document.createElement('button')
      marker.type = 'button'
      marker.className = folded ? 'json-fold-marker is-folded' : 'json-fold-marker'
      marker.textContent = folded ? '+' : '-'
      marker.setAttribute('aria-label', folded ? '展开 JSON 节点' : '折叠 JSON 节点')
      marker.addEventListener('mousedown', event => {
        event.preventDefault()
        event.stopPropagation()
        this.toggleJsonFold(line)
      })

      this.formattedEditor.setGutterMarker(line, 'json-fold-gutter', marker)
      this.renderedFoldMarkerLines[line] = true
    },
    clearRenderedFoldMarkers () {
      if (!this.formattedEditor) return

      Object.keys(this.renderedFoldMarkerLines).forEach(line => {
        this.formattedEditor.setGutterMarker(Number(line), 'json-fold-gutter', null)
      })
      this.renderedFoldMarkerLines = {}
    },
    clearJsonFolds () {
      if (!this.formattedEditor) return
      this.clearRenderedFoldMarkers()
    }
  }
}
</script>

<style scoped lang="scss">
.json-executor {
  display: flex;
  gap: 10px;
  height: 86vh;
}

.json-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 50%;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 6px 10px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-title {
  flex: 0 0 auto;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.panel-info {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.parse-error {
  overflow: hidden;
  color: #f56c6c;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 0 0 auto;
  gap: 6px;
}

.panel-actions :deep(.el-button) {
  margin-left: 0;
}

.editor-wrap {
  flex: 1;
  min-height: 0;
}

.editor-wrap > textarea {
  width: 100%;
  height: 100%;
}

:deep(.CodeMirror) {
  height: 100%;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 14px;
}

:deep(.CodeMirror-scroll) {
  padding-bottom: 0;
}

:deep(.json-fold-gutter) {
  width: 18px;
}

:deep(.json-fold-marker) {
  display: block;
  width: 14px;
  height: 14px;
  margin: 2px auto 0;
  padding: 0;
  border: 1px solid #c0c4cc;
  border-radius: 2px;
  background: #fff;
  color: #606266;
  cursor: pointer;
  font-size: 12px;
  line-height: 11px;
}

:deep(.json-fold-marker:hover) {
  border-color: #409eff;
  color: #409eff;
}

:deep(.json-fold-marker.is-folded) {
  border-color: #409eff;
  color: #409eff;
}

@media (max-width: 900px) {
  .json-executor {
    flex-direction: column;
    height: auto;
  }

  .json-panel {
    width: 100%;
    height: 48vh;
  }
}
</style>
