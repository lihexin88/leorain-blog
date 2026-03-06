<template>
  <universal-executor
    language="text/x-java"
    endpoint="java"
    :versions="versions"
    :defaultVersion="version"
    :initialCode="code"
  />
</template>

<script>
import 'codemirror/mode/clike/clike'
import UniversalExecutor from './UniversalExecutor.vue'

export default {
  name: 'JAVAExecutor',
  components: {
    UniversalExecutor
  },
  props: {},
  data () {
    return {
      code: `public class Main {
    public static void main(String[] args) {
        String jdkVersion = System.getProperty("java.version");
        System.out.println("jdk version: " + jdkVersion);
    }
}`,
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
