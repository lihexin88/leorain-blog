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
  height: 100%;
}
</style>
