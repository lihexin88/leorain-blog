<template>
  <universal-executor
    language="text/x-csrc"
    endpoint="clang"
    :versions="versions"
    :defaultVersion="version"
    :initialCode="code"
  />
</template>

<script>
import 'codemirror/mode/clike/clike'
import UniversalExecutor from './UniversalExecutor.vue'

export default {
  name: 'CLANGExecutor',
  components: {
    UniversalExecutor
  },
  props: {},
  data () {
    return {
      code: `#include <stdio.h>

int main() {
    system("gcc --version");

    return 0;
}
      `,
      versions: [
        {
          version: 11,
          name: 'gcc 11'
        }
      ],
      version: {
        version: 11,
        name: 'gcc 11'
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
