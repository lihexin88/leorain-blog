<template>
  <div>
    <div class="ue-toolbar">
      <label class="ue-label">语言：</label>
      <el-select v-model="selectedLangKey" @change="onLangChange" class="ue-select">
        <el-option v-for="(cfg, key) in effectiveLanguages" :key="key" :value="key">
          {{ cfg.label }}
        </el-option>
      </el-select>

      <label class="ue-label" v-if="selectedLangKey !== 'html'">版本：</label>
      <el-select v-model="currentVersion" class="ue-select" v-if="selectedLangKey !== 'html'">
        <el-option v-for="v in versions" :key="v.version" :value="v.version">{{ v.name }}</el-option>
      </el-select>
    </div>

    <executor
      :code="code"
      :language="language"
      :result="result"
      ref="executor"
      :is-html="selectedLangKey === 'html'"
      @exec="exec"
      @changes="changes"
    />
  </div>
</template>

<script>
import CodeExecutor from './CodeExecutor.vue'
import { useUserStore } from '@/store/user'
import { mapActions } from 'pinia'
import Swal from 'sweetalert2'
import { executeCode, getExecuteResult } from '@/apis/code-executor'
// 为多语言模式预加载常见语言的 CodeMirror 语法
import 'codemirror/mode/php/php'
import 'codemirror/mode/python/python'
import 'codemirror/mode/go/go'
import 'codemirror/mode/clike/clike'
import 'codemirror/mode/htmlmixed/htmlmixed'

export default {
  name: 'UniversalExecutor',
  components: { Executor: CodeExecutor },
  tdk () {
    const map = {
      php: {
        title: '在线 PHP 运行工具',
        description: '在线运行 PHP 代码，支持 PHP 8.2，浏览器即开即用。',
        keywords: 'PHP 在线运行, PHP 在线编译, PHP 8.2, 在线代码执行'
      },
      golang: {
        title: '在线 Go 运行工具',
        description: '在线运行 Go 代码，支持 Go 1.20，浏览器即开即用。',
        keywords: 'Go 在线运行, Golang 在线编译, Go 1.20, 在线代码执行'
      },
      java: {
        title: '在线 Java 运行工具',
        description: '在线运行 Java 代码，支持 OpenJDK 17,浏览器即开即用。',
        keywords: 'Java 在线运行, Java 在线编译, OpenJDK 17, 在线代码执行'
      },
      clang: {
        title: '在线 C 运行工具',
        description: '在线运行 C 代码,支持 GCC 11,浏览器即开即用。',
        keywords: 'C 在线运行, C 在线编译, GCC, 在线代码执行'
      },
      cpp: {
        title: '在线 C++ 运行工具',
        description: '在线运行 C++ 代码,支持 g++,浏览器即开即用。',
        keywords: 'C++ 在线运行, C++ 在线编译, g++, 在线代码执行'
      },
      python: {
        title: '在线 Python 运行工具',
        description: '在线运行 Python 代码,支持 Python 3.10,浏览器即开即用。',
        keywords: 'Python 在线运行, Python 在线编译, Python 3.10, 在线代码执行'
      },
      html: {
        title: '在线 HTML 预览工具',
        description: '在线编写并实时预览 HTML 代码,浏览器即开即用。',
        keywords: 'HTML 在线预览, HTML 在线编辑, 在线代码执行'
      }
    }
    return map[this.selectedLangKey] || {
      title: '在线代码运行工具',
      description: '在线运行多语言代码,浏览器即开即用。',
      keywords: '在线代码运行, 在线编译, 多语言'
    }
  },
  props: {
    initialCode: {
      type: String,
      default: ''
    },
    // 可自定义语言配置映射：{ key: { label, endpoint, mime, versions:[], defaultVersion:{}, sample:'' } }
    languagesConfig: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      code: this.initialCode,
      result: '',
      recordId: null,
      language: '',
      versions: [],
      currentVersion: null,
      // 多语言模式内部状态
      selectedLangKey: 'php',
      internalLanguages: {
        php: {
          label: 'PHP',
          endpoint: 'php',
          mime: 'php',
          versions: [
            { version: 82, name: '8.2' }
          ],
          defaultVersion: { version: 82, name: '8.2' }
        },
        golang: {
          label: 'Go',
          endpoint: 'golang',
          mime: 'text/x-go',
          versions: [
            { version: 120, name: '1.20' }
          ],
          defaultVersion: { version: 120, name: '1.20' }
        },
        java: {
          label: 'Java',
          endpoint: 'java',
          mime: 'text/x-java',
          versions: [
            { version: 17, name: 'openjdk:17' }
          ],
          defaultVersion: { version: 17, name: 'openjdk:17' }
        },
        clang: {
          label: 'C',
          endpoint: 'clang',
          mime: 'text/x-csrc',
          versions: [{ version: 11, name: 'gcc 11' }],
          defaultVersion: { version: 11, name: 'gcc 11' }
        },
        cpp: {
          label: 'C++',
          endpoint: 'cpp',
          mime: 'text/x-c++src',
          versions: [{ version: 11, name: 'g++' }],
          defaultVersion: { version: 11, name: 'g++' }
        },
        python: {
          label: 'Python',
          endpoint: 'python',
          mime: 'python',
          versions: [
            { version: 310, name: '3.10' }
          ],
          defaultVersion: { version: 310, name: '3.10' }
        },
        html: {
          label: 'HTML',
          endpoint: 'html',
          mime: 'text/html',
          versions: [],
          defaultVersion: null
        }
      }
    }
  },
  computed: {
    // 统一访问语言配置
    effectiveLanguages () {
      return this.languagesConfig || this.internalLanguages
    }
  },
  beforeMount () {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code !== null && code !== undefined && code !== '') {
      this.code = code
    }
    const lang = params.get('language')
    this.bootstrapMulti(lang)
  },
  methods: {
    show_it (event) {
      console.log(event)
    },
    ...mapActions(useUserStore, ['setShowLoginDialog']),
    changes (code) {
      this.code = code
      if (this.selectedLangKey === 'html') {
        this.result = code
      }
    },
    exec (executorObj) {
      if (this.selectedLangKey === 'html') {
        return
      }
      // normalize selected version
      const ver = this.currentVersion.version
      const ep = this.effectiveLanguages[this.selectedLangKey].endpoint
      executeCode(ep, executorObj.code, ver).then((response) => {
        if (response.record_id) {
          this.result = '运行中...'
          this.recordId = response.record_id
          let time = 1
          const intervalId = setInterval(async () => {
            await getExecuteResult(this.recordId).then((intervalResponse) => {
              const data = intervalResponse && intervalResponse.data && intervalResponse.data
              const status = data && data.status
              this.result = data.output || ''
              if (status === 3) {
                this.$message.success('执行成功')
                clearInterval(intervalId)
              } else if (status === 4) {
                this.$message.error('运行失败')
                clearInterval(intervalId)
              } else {
                time++
              }
              if (time > 30) {
                this.$message.error('运行超时')
                clearInterval(intervalId)
              }
            }).catch(() => {
              // polling error, stop and notify
              this.$message.error('获取结果失败')
            })
          }, 1000)
        } else {
          this.result = ''
          this.$message.error('运行失败')
        }
      }).catch((e) => {
        if (e && e.status === 401) {
          Swal.fire({
            title: 'auth.unauthorized',
            text: 'auth.unauthorized',
            icon: 'error',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            animation: true
          }).then((result) => {
            if (result.isConfirmed) {
              this.setShowLoginDialog(true)
            }
          })
        }
        this.result = ''
        this.$message.error('运行失败')
      })
    },
    onLangChange () {
      const cfg = this.effectiveLanguages[this.selectedLangKey]
      this.language = cfg.mime
      this.versions = cfg.versions
      this.currentVersion = cfg.defaultVersion
      this.code = ''
      this.result = ''

      // Update URL with language parameter
      const url = new URL(window.location)
      url.searchParams.set('language', this.selectedLangKey)
      window.history.pushState({}, '', url)
    },
    bootstrapMulti (langFromUrl) {
      // 应用自定义配置（如传入）
      if (this.languagesConfig) {
        this.internalLanguages = this.languagesConfig
      }

      const keys = Object.keys(this.effectiveLanguages)
      if (langFromUrl && keys.includes(langFromUrl)) {
        this.selectedLangKey = langFromUrl
      } else {
        // 默认选择第一个 key
        this.selectedLangKey = keys[0]
      }
      this.onLangChange()
    }
  }
}
</script>

<style scoped lang="scss">
.ue-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 0 10px;
}
.ue-label {
  color: #666;
}
.ue-select {
  width: 200px;
  padding: 4px 6px;
}
</style>
