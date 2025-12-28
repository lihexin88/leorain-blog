<template>
  <executor :code="code" language="php" :versions="versions" :show_version="version" :result="result"
                      @exec="exec" @changes="changes"></executor>
</template>

<script>
import 'codemirror/mode/php/php'

import Executor from './Executor.vue'

export default {
  components: {
    Executor
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
      autocomplete: false,
      result: '',
      code: '<?php\nphpinfo();',
      recordId: null,
      versions: [
        {
          version: 56,
          name: '5.6'
        },
        {
          version: 70,
          name: '7.0'
        },
        {
          version: 72,
          name: '7.2'
        },
        {
          version: 74,
          name: '7.4'
        },
        {
          version: 80,
          name: '8.0'
        },
        {
          version: 82,
          name: '8.2'
        }
      ],
      version: {
        version: 74,
        name: '7.4'
      }
    }
  },
  methods: {
    changes (code) {
      this.code = code
    },
    exec (version) {
      this.$http.post('exec/php', {
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

</style>
