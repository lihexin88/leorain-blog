<template>
  <UniversalExecutor
    language="php"
    endpoint="php"
    :versions="versions"
    :defaultVersion="version"
    :initialCode="code"
  ></UniversalExecutor>
</template>

<script>
import 'codemirror/mode/php/php'

import UniversalExecutor from './UniversalExecutor.vue'

export default {
  name: 'PHPExecutor',
  components: {
    UniversalExecutor
  },
  props: {},
  data () {
    return {
      code: '',
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
  }
}
</script>
<style scoped lang="scss">

</style>
