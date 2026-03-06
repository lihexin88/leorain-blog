<template>
  <universal-executor
    language="python"
    endpoint="python"
    :versions="versions"
    :defaultVersion="version"
    :initialCode="code"
  />
</template>

<script>
import 'codemirror/mode/python/python'
import UniversalExecutor from './UniversalExecutor.vue'

export default {
  name: 'PYTHONExecutor',
  components: {
    UniversalExecutor
  },
  props: {},
  data () {
    return {
      code: `from platform import python_version
print(python_version())`,
      versions: [
        {
          version: 27,
          name: '2.7'
        },
        {
          version: 36,
          name: '3.6'
        },
        {
          version: 38,
          name: '3.8'
        },
        {
          version: 310,
          name: '3.10'
        }
      ],
      version: {
        version: 38,
        name: '3.8'
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
