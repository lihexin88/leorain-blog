<template>
  <universal-executor
    language="text/x-go"
    endpoint="golang"
    :versions="versions"
    :defaultVersion="version"
    :initialCode="code"
  />
  </template>

<script>
import 'codemirror/mode/go/go'
import UniversalExecutor from './UniversalExecutor.vue'

export default {
  name: 'GOLANGExecutor',
  components: {
    UniversalExecutor
  },
  props: {},
  data () {
    return {
      code: `package main

import (
    "fmt"
    "runtime"
)

func main() {
    fmt.Printf("Go version: %s\\n", runtime.Version())
}
      `,
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
  methods: {}
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
