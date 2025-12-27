<template>
  <div class="main-container">
    <header class="header">
      <!-- Header内容 -->
      <NavBar />
    </header>

    <main class="body">
      <!-- 子组件将在这里渲染 -->
      <router-view></router-view>
    </main>

    <footer class="footer">
      <!-- Footer内容 -->
      <p>&copy; 2023 个人博客. All rights reserved.</p>
    </footer>
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue'

export default {
  name: 'Main',
  components: {
    NavBar
  }
}
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: #f8f9fa;
}

.header h1 {
  margin: 0 0 0.5rem 0;
}

/* 移除了旧的导航样式，现在使用 Element Plus 的样式 */

.body {
  flex: 1;
  padding: 2rem;
}

.footer {
  background-color: #f8f9fa;
  padding: 1rem;
  text-align: center;
  border-top: 1px solid #e9ecef;
}
</style>
