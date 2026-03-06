<template>
  <universal-executor
    language="text/x-c++src"
    endpoint="cpp"
    :versions="versions"
    :defaultVersion="version"
    :initialCode="code"
  />
</template>

<script>
import 'codemirror/mode/clike/clike'
import UniversalExecutor from './UniversalExecutor.vue'

export default {
  name: 'CPPExecutor',
  components: {
    UniversalExecutor
  },
  props: {},
  data () {
    return {
      code: `#include <iostream>

int main() {
    std::cout << "GCC version: "
              << __GNUC__ << "."
              << __GNUC_MINOR__ << "."
              << __GNUC_PATCHLEVEL__ << std::endl;
    return 0;
}
`,
      versions: [
        {
          version: 11,
          name: 'g++'
        }
      ],
      version: {
        version: 11,
        name: 'g++'
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
