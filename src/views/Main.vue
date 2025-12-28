<template>
  <div class="main-container">
    <!-- 背景图片/视频 -->
    <div v-if="configStore.backgroundImage" class="background-container">
      <!-- 判断是视频还是图片 -->
      <video
          v-if="isVideo(configStore.backgroundImage)"
          class="background-video"
          autoplay
          loop
          muted
          playsinline
      >
        <source :src="configStore.backgroundImage" type="video/mp4">
        您的浏览器不支持视频标签。
      </video>
      <img
          v-else
          class="background-image"
          :src="configStore.backgroundImage"
          alt="背景图片"
      >
    </div>

    <header class="header">
      <!-- Header内容 -->
      <NavBar/>
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
import { useConfigStore } from '@/store/config'

export default {
  name: 'MainPage',
  components: {
    NavBar
  },
  setup () {
    const configStore = useConfigStore()

    // 判断URL是否为视频
    const isVideo = (url) => {
      if (!url) return false
      const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov']
      const extension = url.split('.').pop().toLowerCase()
      return videoExtensions.includes(extension)
    }

    return {
      configStore,
      isVideo
    }
  },
  mounted () {
    this.configStore.fetchConfigs()
  }
}
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}

.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.background-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header {
}

.header h1 {
  margin: 0 0 0.5rem 0;
}

/* 移除了旧的导航样式，现在使用 Element Plus 的样式 */

.body {
  flex: 1;
}

.footer {
  background-color: rgba(248, 249, 250, 0.43);
  padding: 1rem;
  text-align: center;
}
</style>
