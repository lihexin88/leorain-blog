<template>
  <executor :code="code" language="text/x-go" :versions="versions" :show_version="version" :result="result"
            @exec="exec" @changes="changes"></executor>
</template>

<script>
import 'codemirror/mode/go/go'
import ExecutorHeaders from './ExecutorHeaders.vue'
import CodeExecutor from './CodeExecutor.vue'
import { result } from 'lodash/object'
import Swal from 'sweetalert2'

export default {
  components: {
    Executor: CodeExecutor,
    ExecutorHeaders
  },
  beforeMount () {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      this.code = code
    }
  },
  props: {},
  data () {
    return {
      formated: false,
      result: '',
      code: `package main

import (
    "fmt"
    "runtime"
)

func main() {
    fmt.Printf("Go version: %s\\n", runtime.Version())
}
      `,
      recordId: null,
      versions: [
        {
          version: 118,
          name: '1.18'
        },
        {
          version: 119,
          name: '1.19'
        },
        {
          version: 120,
          name: '1.20'
        }
      ],
      version: {
        version: 120,
        name: '1.20'
      }
    }
  },
  methods: {
    changes (code) {
      this.code = code
      try {
        this.result = JSON.stringify(JSON.parse(this.code), null, 2)
        this.code = result.toString()
      } catch (e) {

      }
    },
    exec (version) {
      this.$http.post('exec/golang', {
        code: this.code,
        version: version.version
      }).then((response) => {
        if (response.status === 200) {
          this.result = '运行中...'
          this.recordId = response.data.record_id
          let time = 1
          const intervalId = setInterval(async () => {
            await this.$http.post('exec/get_result', {
              record_id: this.recordId
            }).then((intervalResponse) => {
              let status = intervalResponse.data.data.status
              if (status === 3) {
                toastr.success('执行成功')
                this.result = intervalResponse.data.data.output
                clearInterval(intervalId)
              } else if (status === 4) {
                toastr.error('运行失败')
                this.result = ''
                clearInterval(intervalId)
              } else {
                time++
              }
              if (time > 30) {
                toastr.error('运行超时')
                this.result = ''
                clearInterval(intervalId)
              }
            })
          }, 1000)
        } else {
          this.result = ''
          toastr.error('运行失败')
        }
      }).catch((e) => {
        if (e.status === 401) {
          Swal.fire({
            title: 'auth.unauthorized',
            text: 'auth.unauthorized',
            icon: 'error',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            animation: true
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = '/login'
            }
          })
        }
        this.result = ''
        toastr.error('运行失败')
      })
    }
  }
}
</script>
<style scoped lang="scss">

.executor-container {
  display: flex;
  height: 85vh;
}

.executor-title {
  margin-top: 30px;
  display: flex;
  margin-bottom: 10px;
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

</style>
