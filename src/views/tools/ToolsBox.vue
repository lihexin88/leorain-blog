<template>
  <div class="tool-container">
    <router-view />
  </div>
</template>

<script>

export default {
  props: {},
  data () {
    return {
      items: []
    }
  },
  methods: {
  },
  mounted () {
  }
}
</script>
<style scoped lang="scss">
.tool-container {
  min-height: calc(100vh - 150px);
}
</style>
