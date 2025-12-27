<template>
  <executor :code="code" language="text/x-java" :versions="versions" :show_version="version" :result="result"
            @exec="exec" @changes="changes"></executor>
</template>

<script>
import "codemirror/mode/clike/clike";
import ExecutorHeaders from "./ExecutorHeaders.vue";
import Executor from "./Executor.vue";
import {result} from "lodash/object";

export default {
  components: {
    Executor,
    ExecutorHeaders
  },
  props: {},
  data() {
    return {
      formated: false,
      result: "",
      code: ``,
      recordId: null,
      versions: [{
        version: 10,
        name: "1.0"
      }],
      version: {
        version: 10,
        name: "1.0"
      },
    }
  },
  methods: {
    changes(code) {
      this.code = code
      try {
        this.result = JSON.stringify(JSON.parse(this.code), null, 2);
        this.code = result.toString()
      }catch (e) {

      }
    },
    exec() {
      if (!this.formated){
        console.log('格式化')
        // 格式化
        try {
          this.result = JSON.stringify(JSON.parse(this.code), null, 2);
          this.formated = true
        }catch (e) {
          console.log(e)
        }
      }else{
        // 压缩
        console.log('压缩')
        try {
          this.result = JSON.stringify(JSON.parse(this.code), null, 2);
          this.result = this.result.replace(/\s+/g, "").replace(/,\}/g, "}").replace(/,\]/g, "]")
          this.formated = false
        }catch (e) {
          console.log(e)
        }
      }
    },
  },
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
