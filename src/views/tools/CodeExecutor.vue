<template>
  <div>
    <div class="executor-container">
      <div class="code-area">
        <code-area :isVim="isVim" id="code-area" :show-run="true" @executor_submit="executor_submit" type=1 :language="language" @executor_changes="executor_changes" :value="code"></code-area>
      </div>
      <div class="result-area">
        <code-area id="result-textarea" :show-run="false" type=2 :value="result"></code-area>
      </div>
    </div>
  </div>
</template>

<script>
import CodeArea from './CodeArea.vue'

export default {
  components: { CodeArea },
  props: {
    versions: {
      type: Array,
      default () {
        return []
      }
    },
    show_version: {
      type: Object,
      default () {
        return null
      }
    },
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
    }
  },
  data () {
    return {
      version: '',
      isVim: false
    }
  },
  methods: {
    executor_submit (event) {
      this.version = event
      this.$emit('exec', this.version)
    },
    executor_changes (code) {
      this.$emit('changes', code)
    },
    updateKeyMap (value) {
      this.isVim = value
    }
  },
  mounted () {
    this.version = this.show_version
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
}

.code-area {
  width: 50%;
}

.code-area > textarea {
  width: 100%;
  height: 100%;
}

.result-area {
  width: 50%;
}

.result-area > textarea {
  width: 100%;
  height: 100%;
  padding-left: 5px;
}

.executor-submit-btn {
  width: 150px;
}

.executor-tips {
  width: 20%;
}
:deep(.CodeMirror-scroll){
  padding-bottom: 0;
}
</style>
