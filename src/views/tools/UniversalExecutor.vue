<template>
  <div>
    <!-- 多语言切换区域（仅在 multi 模式显示） -->
    <div v-if="multi" class="ue-toolbar">
      <label class="ue-label">语言：</label>
      <select v-model="selectedLangKey" @change="onLangChange" class="ue-select">
        <option v-for="(cfg, key) in effectiveLanguages" :key="key" :value="key">
          {{ cfg.label }}
        </option>
      </select>

      <label class="ue-label">版本：</label>
      <select v-model="currentVersion" class="ue-select">
        <option v-for="v in versions" :key="v.version" :value="v">{{ v.name }}</option>
      </select>
    </div>

    <executor
      :code="code"
      :language="language"
      :versions="versions"
      :show_version="currentVersion"
      :result="result"
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
// 为多语言模式预加载常见语言的 CodeMirror 语法
import 'codemirror/mode/php/php'
import 'codemirror/mode/python/python'
import 'codemirror/mode/go/go'
import 'codemirror/mode/clike/clike'

export default {
  name: 'UniversalExecutor',
  components: { Executor: CodeExecutor },
  props: {
    language: {
      type: String,
      default: 'text'
    },
    endpoint: {
      // endpoint suffix, e.g. 'php', 'golang', 'java'
      type: String,
      required: false
    },
    versions: {
      type: Array,
      default () {
        return []
      }
    },
    defaultVersion: {
      type: Object,
      default () {
        return null
      }
    },
    initialCode: {
      type: String,
      default: ''
    },
    // 开启多语言模式：内部选择语言与版本
    multi: {
      type: Boolean,
      default: false
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
      currentVersion: this.defaultVersion,
      // 多语言模式内部状态
      selectedLangKey: 'php',
      internalLanguages: {
        php: {
          label: 'PHP',
          endpoint: 'php',
          mime: 'php',
          versions: [
            { version: 56, name: '5.6' },
            { version: 70, name: '7.0' },
            { version: 72, name: '7.2' },
            { version: 74, name: '7.4' },
            { version: 80, name: '8.0' },
            { version: 82, name: '8.2' }
          ],
          defaultVersion: { version: 74, name: '7.4' },
          sample: ''
        },
        golang: {
          label: 'Go',
          endpoint: 'golang',
          mime: 'text/x-go',
          versions: [
            { version: 118, name: '1.18' },
            { version: 119, name: '1.19' },
            { version: 120, name: '1.20' }
          ],
          defaultVersion: { version: 120, name: '1.20' },
          sample: `package main

import (
    "fmt"
    "runtime"
)

func main() {
    fmt.Printf("Go version: %s\n", runtime.Version())
}`
        },
        java: {
          label: 'Java',
          endpoint: 'java',
          mime: 'text/x-java',
          versions: [
            { version: 8, name: 'openjdk:8' },
            { version: 11, name: 'openjdk:11' },
            { version: 17, name: 'openjdk:17' }
          ],
          defaultVersion: { version: 17, name: 'openjdk:17' },
          sample: `public class Main {
    public static void main(String[] args) {
        String jdkVersion = System.getProperty("java.version");
        System.out.println("jdk version: " + jdkVersion);
    }
}`
        },
        clang: {
          label: 'C',
          endpoint: 'clang',
          mime: 'text/x-csrc',
          versions: [{ version: 11, name: 'gcc 11' }],
          defaultVersion: { version: 11, name: 'gcc 11' },
          sample: `#include <stdio.h>

int main() {
    system("gcc --version");
    return 0;
}`
        },
        cpp: {
          label: 'C++',
          endpoint: 'cpp',
          mime: 'text/x-c++src',
          versions: [{ version: 11, name: 'g++' }],
          defaultVersion: { version: 11, name: 'g++' },
          sample: `#include <iostream>

int main() {
    std::cout << "GCC version: "
              << __GNUC__ << "."
              << __GNUC_MINOR__ << "."
              << __GNUC_PATCHLEVEL__ << std::endl;
    return 0;
}`
        },
        python: {
          label: 'Python',
          endpoint: 'python',
          mime: 'python',
          versions: [
            { version: 27, name: '2.7' },
            { version: 36, name: '3.6' },
            { version: 38, name: '3.8' },
            { version: 310, name: '3.10' }
          ],
          defaultVersion: { version: 38, name: '3.8' },
          sample: `from platform import python_version
print(python_version())`
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
    if (this.multi) {
      this.bootstrapMulti()
    }
  },
  methods: {
    ...mapActions(useUserStore, ['setShowLoginDialog']),
    changes (code) {
      this.code = code
    },
    exec (version) {
      // normalize selected version
      const ver = version && (version.version !== undefined ? version.version : version)
      const ep = this.multi ? this.effectiveLanguages[this.selectedLangKey].endpoint : this.endpoint
      this.$http.post(`exec/${ep}`, {
        code: this.code,
        version: ver
      }).then((response) => {
        if (response.status === 200) {
          this.result = '运行中...'
          this.recordId = response.data.record_id
          let time = 1
          const intervalId = setInterval(async () => {
            await this.$http.post('exec/get_result', {
              record_id: this.recordId
            }).then((intervalResponse) => {
              const data = intervalResponse && intervalResponse.data && intervalResponse.data.data
              const status = data && data.status
              if (status === 3) {
                this.$message.success('执行成功')
                this.result = data.output
                clearInterval(intervalId)
              } else if (status === 4) {
                this.$message.error('运行失败')
                this.result = ''
                clearInterval(intervalId)
              } else {
                time++
              }
              if (time > 30) {
                this.$message.error('运行超时')
                this.result = ''
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
      // 仅当用户未通过 URL 指定 code 时，切换语言时写入示例
      if (!new URLSearchParams(window.location.search).get('code')) {
        this.code = cfg.sample || ''
      }
    },
    bootstrapMulti () {
      // 应用自定义配置（如传入）
      if (this.languagesConfig) {
        this.internalLanguages = this.languagesConfig
      }
      // 默认选择第一个 key
      const firstKey = Object.keys(this.internalLanguages)[0]
      this.selectedLangKey = firstKey
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
  margin-bottom: 10px;
}
.ue-label {
  color: #666;
}
.ue-select {
  padding: 4px 6px;
}
</style>
