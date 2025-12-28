<template>
  <el-menu
    :default-active="activeIndex"
    class="el-menu-demo"
    mode="horizontal"
    :router="true"
    @select="handleSelect"
  >
    <el-menu-item index="/">首页</el-menu-item>
    <el-menu-item index="/tools">工具箱</el-menu-item>
    <el-menu-item index="/vector-search">向量检索</el-menu-item>
    <el-menu-item index="/quiz">测验</el-menu-item>
    <el-menu-item index="/guestbook">留言板</el-menu-item>
    <el-menu-item index="/childhood-games">童年游戏</el-menu-item>
    <el-menu-item index="/links">友情链接</el-menu-item>
    <el-menu-item index="/categories">所有分类</el-menu-item>
    <el-menu-item index="/discussion">讨论</el-menu-item>
  </el-menu>
</template>

<script>
export default {
  name: 'NavBar',
  data() {
    return {
      activeIndex: this.$route.path
    }
  },
  methods: {
    handleSelect(key) {
      this.activeIndex = key
    }
  },
  watch: {
    '$route'(to) {
      this.activeIndex = to.path
    }
  }
}
</script>

<style scoped>
.el-menu-demo {
  margin-bottom: 20px;
}
</style>
