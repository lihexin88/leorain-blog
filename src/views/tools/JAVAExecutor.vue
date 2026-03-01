<template>
  <executor :code="code" language="text/x-java" :versions="versions" :show_version="version" :result="result"
                      @exec="exec" @changes="changes"></executor>
</template>

<script>
import 'codemirror/mode/clike/clike'
import Swal from 'sweetalert2'
import ExecutorHeaders from './ExecutorHeaders.vue'
import CodeExecutor from './CodeExecutor.vue'
import { useUserStore } from '@/store/user'
import { mapActions } from 'pinia'

export default {
  components: {
    Executor: CodeExecutor,
    ExecutorHeaders
  },
  props: {},
  beforeMount () {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      this.code = code
    }
  },
  data () {
    return {
      result: '',
      code: `public class Main {
    public static void main(String[] args) {
        String jdkVersion = System.getProperty("java.version");
        System.out.println("jdk version: " + jdkVersion);
    }
}`,
      recordId: null,
      versions: [
        {
          version: 8,
          name: 'openjdk:8'
        },
        {
          version: 11,
          name: 'openjdk:11'
        },
        {
          version: 17,
          name: 'openjdk:17'
        }
      ],
      version: {
        version: 17,
        name: 'openjdk:17'
      }
    }
  },
  methods: {
    ...mapActions(useUserStore, ['setShowLoginDialog']),
    changes (code) {
      this.code = code
    },
    exec (version) {
      this.$http.post('exec/java', {
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
                this.$message.success('执行成功')
                this.result = intervalResponse.data.data.output
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
            })
          }, 1000)
        } else {
          this.result = ''
          this.$message.error('运行失败')
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
              this.setShowLoginDialog(true)
            }
          })
        }
        this.result = ''
        this.$message.error('运行失败')
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
