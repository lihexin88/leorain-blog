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
      <ScrollProgress style="z-index: 1"/>
      <NavBar/>
    </header>

    <main class="body">
      <site-info/>
      <!-- 子组件将在这里渲染 -->
      <router-view></router-view>
    </main>

    <footer class="footer">
      <!-- Footer内容 -->
      <footerBar />
    </footer>

    <!-- 登录弹窗 -->
    <el-dialog
      v-model="userStore.showLoginDialog"
      title="登录"
      width="450px"
      :append-to-body="true"
      destroy-on-close
      class="login-dialog"
    >
      <UserLogin :is-dialog="true" />
    </el-dialog>
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue'
import ScrollProgress from '@/components/ScrollProgress.vue'
import { useConfigStore } from '@/store/config'
import { useUserStore } from '@/store/user'
import FooterBar from '@/components/FooterBar.vue'
import SiteInfo from '@/components/SiteInfo.vue'
import UserLogin from '@/views/user/UserLogin.vue'

export default {
  name: 'MainPage',
  components: {
    FooterBar,
    NavBar,
    ScrollProgress,
    UserLogin,
    SiteInfo
  },
  setup () {
    const configStore = useConfigStore()
    const userStore = useUserStore()

    // 判断URL是否为视频
    const isVideo = (url) => {
      if (!url) return false
      const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov']
      const extension = url.split('.').pop().toLowerCase()
      return videoExtensions.includes(extension)
    }

    return {
      configStore,
      userStore,
      isVideo
    }
  },
  mounted () {
    this.configStore.fetchConfigs()

    // 检查登录状态：如果 token 存在且用户信息为空，尝试获取用户信息
    if (this.userStore.token && !this.userStore.user) {
      this.userStore.fetchUserInfo().catch(() => {
        // 如果获取用户信息失败（比如 token 过期），清除本地存储并重置状态
        this.userStore.logout()
      })
    }
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
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  max-width: 100vw;
  overflow-x: hidden;
}

.header h1 {
  margin: 0 0 0.5rem 0;
}

/* 移除了旧的导航样式，现在使用 Element Plus 的样式 */

.body {
  flex: 1;
  margin-top: 40px; /* 为固定头部留出空间 */
  height: 100%;
}

.footer {
  background-color: rgba(248, 249, 250, 0.7);
  backdrop-filter: blur(8px) saturate(180%);
  padding: 1rem;
  text-align: center;
}

:deep(.login-dialog) {
  border-radius: 8px;
  overflow: hidden;

  .el-dialog__header {
    margin-right: 0;
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
    text-align: center;

    .el-dialog__title {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }

  .el-dialog__body {
    padding: 20px;
  }

  .login-container {
    padding-top: 0;
  }

  .login-card {
    border: none;
    box-shadow: none;
    max-width: 100%;

    .el-card__body {
      padding: 0;
    }
  }
}
</style>
