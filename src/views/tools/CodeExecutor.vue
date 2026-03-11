<template>
  <div>
    <div class="executor-container">
      <div class="code-area">
        <code-area ref="codeInput" :isVim="isVim" id="code-area" :show-run="true" @executor_submit="executor_submit" type=1 :language="language" @executor_changes="executor_changes" :value="code"></code-area>
      </div>
      <div class="result-area">
        <code-area v-if="!isHtml" id="result-textarea" :show-run="false" type=2 :value="result"></code-area>
        <div v-else class="preview-container">
          <iframe ref="previewIframe" class="preview-iframe"></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CodeArea from './CodeArea.vue'

export default {
  components: { CodeArea },
  props: {
    code: {
      type: String,
      default () {
        return ''
      }
    },
    result: {
      type: String,
      default () {
        return ''
      }
    },
    language: {
      type: String,
      default () {
        return 'text'
      }
    },
    isHtml: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      isVim: false
    }
  },
  watch: {
    result (newVal) {
      if (this.isHtml) {
        this.updatePreview(newVal)
      }
    },
    isHtml (newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.updatePreview(this.result)
        })
      }
    }
  },
  methods: {
    updatePreview (code) {
      const iframe = this.$refs.previewIframe
      if (iframe) {
        const doc = iframe.contentDocument || iframe.contentWindow.document
        doc.open()
        doc.write(code)
        doc.close()
      }
    },
    executor_submit () {
      this.$emit('exec', {
        code: this.code
      })
    },
    executor_changes (code) {
      this.$emit('changes', code)
    },
    updateKeyMap (value) {
      this.isVim = value
    }
  },
  mounted () {
  }
}
</script>

<style scoped lang="scss">

.executor-title {
  margin-top: 10px;
  display: flex;
  margin-bottom: 10px;
}

.executor-container {
  display: flex;
  height: 80vh;
}

.code-area {
  width: 50%;
  display: flex;
}

.result-area {
  width: 50%;
  padding-left: 5px;
  display: flex;
}

.executor-submit-btn {
  width: 150px;
}

.executor-tips {
  width: 20%;
}
.preview-container {
  width: 100%;
  height: 100%;
  background: white;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

:deep(.CodeMirror-scroll){
  padding-bottom: 0;
}
</style>
