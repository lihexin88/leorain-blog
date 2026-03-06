<template>
  <div class="code">
    <div class="code-area">
      <textarea ref="code-area"></textarea>
      <div class="code-opt">
        <el-button class="code-copy" @click="copy" type="primary">复制</el-button>
        <el-button class="code-run" v-if="showRun" @click="submit" type="primary">运行</el-button>
      </div>
    </div>
  </div>
</template>

<script>

import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/addon/hint/show-hint'
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/hint/javascript-hint'
import 'codemirror/theme/mdn-like.css'
import 'codemirror/keymap/vim'

export default {
  props: {
    language: {
      type: String,
      default () {
        return 'javascript'
      }
    },
    value: {
      type: String,
      default: ''
    },
    showRun: {
      type: Boolean,
      default () {
        return true
      }
    },
    type: {
      type: String,
      default () {
        return '1'
      }
    },
    autocomplete: {
      type: Boolean,
      default () {
        return false
      }
    },
    isVim: {
      type: Boolean,
      default () {
        return true
      }
    }
  },
  data () {
    return {
      editor: null
    }
  },
  mounted () {
    const editorEm = this.$refs['code-area']
    this.editor = CodeMirror.fromTextArea(editorEm, {
      lineNumbers: true,
      lineWrapping: true,
      mode: this.language, // 支持多种语言
      theme: 'mdn-like',
      extraKeys: { 'Ctrl-Space': 'autocomplete' } // 快捷键触发自动补全
    })
    this.editor.getWrapperElement().style.flex = '1'
    this.editor.setValue(this.value)
    if (this.type === '1') {
      // 监听输入事件并同步到父组件
      this.editor.on('changes', () => {
        this.$emit('executor_changes', this.editor.getValue()) // 触发 input 事件
      })
      if (this.autocomplete) {
        // 监听输入事件并触发补全
        this.editor.on('changes', (cm) => {
          // 自动补全
          const cursor = cm.getCursor()
          const token = cm.getTokenAt(cursor)
          if (token.string.trim() !== '' && /^[a-zA-Z0-9_]+$/.test(token.string)) {
            CodeMirror.commands.autocomplete(cm)
          }
        })
      }
    } else {
      this.editor.options.disableInput = true
    }
  },
  watch: {
    value (newValue) {
      if (this.type === '2') {
        this.editor.setValue(newValue)
      }
    },
    isVim (isVim) {
      if (isVim) {
        this.$message.success('vim keymap enabled')
        this.editor.setOption('keyMap', 'vim')
      } else {
        this.$message.success('basic keymap enabled')
        this.editor.setOption('keyMap', 'basic')
      }
    }
  },
  methods: {
    copy () {
      navigator.clipboard.writeText(this.value).then(() => {
        this.$message.success('copied')
      }).catch(() => {
        this.$message.success('copy_failed')
      })
    },
    submit () {
      this.$emit('executor_submit', this.editor.getValue())
    }
  }
}
</script>
<style scoped lang="scss">
.code-area{
  display: flex;
  height: 100%;
}
.command-area{
  position: absolute;
  bottom: 0;
  left: 6px
}
.code {
  position: relative;
  width: 100%;
  height: 100%;
}

.code > textarea {
  width: 100%;
  height: 100%;
}
.code-opt {
  position: absolute;
  opacity: .5;
  right: 10px;
  top: 10px;
  z-index: 1;
}
:deep(.CodeMirror){
  height: 100%;
  flex: 1;
}
.code-copy {
}

.code-copy:hover {
  opacity: 1;
}

</style>
