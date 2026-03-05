<template>
  <el-menu
      :default-active="activeIndex"
      class="nav-el-menu"
      mode="horizontal"
      :router="true"
      :ellipsis="false"
      @select="handleSelect"
  >
    <el-menu-item index="/">
      <el-icon class="menu-icon"><House /></el-icon>
      <span>首页</span>
    </el-menu-item>

    <!-- 移动端折叠菜单 -->
    <el-sub-menu index="more" class="mobile-more-menu">
      <template #title>
        <el-icon class="menu-icon"><MoreFilled /></el-icon>
        <span>更多</span>
      </template>
      <el-sub-menu index="/tools-mobile">
        <template #title>
          <el-icon class="menu-icon"><Operation /></el-icon>
          <span>工具箱</span>
        </template>
        <el-menu-item index="/tools/timestamp">
          <el-icon class="menu-icon"><Clock /></el-icon>
          <span>时间戳转换</span>
        </el-menu-item>
        <el-menu-item index="/tools/radix">
          <el-icon class="menu-icon"><Coin /></el-icon>
          <span>进制转换</span>
        </el-menu-item>
        <el-menu-item index="/tools/json">
          <el-icon class="menu-icon"><Document /></el-icon>
          <span>JSON格式化</span>
        </el-menu-item>
        <el-menu-item index="/tools/php">
          <el-icon class="menu-icon"><Notebook /></el-icon>
          <span>PHP在线运行</span>
        </el-menu-item>
        <el-menu-item index="/tools/java">
          <el-icon class="menu-icon"><Grid /></el-icon>
          <span>JAVA在线运行</span>
        </el-menu-item>
        <el-menu-item index="/tools/python">
          <el-icon class="menu-icon"><DataLine /></el-icon>
          <span>PYTHON在线运行</span>
        </el-menu-item>
        <el-menu-item index="/tools/golang">
          <el-icon class="menu-icon"><Crop /></el-icon>
          <span>GO在线运行</span>
        </el-menu-item>
        <el-menu-item index="/tools/clang">
          <el-icon class="menu-icon"><VideoPlay /></el-icon>
          <span>C在线运行</span>
        </el-menu-item>
        <el-menu-item index="/tools/cpp">
          <el-icon class="menu-icon"><Share /></el-icon>
          <span>C++在线运行</span>
        </el-menu-item>
        <el-menu-item index="/tools/draw">
          <el-icon class="menu-icon"><EditPen /></el-icon>
          <span>在线同步绘画</span>
        </el-menu-item>
        <el-menu-item index="/tools/clipboard">
          <el-icon class="menu-icon"><Timer /></el-icon>
          <span>在线剪切板</span>
        </el-menu-item>
        <el-menu-item index="/tools/schulte">
          <el-icon class="menu-icon"><Grid /></el-icon>
          <span>舒尔特表格测试</span>
        </el-menu-item>
        <el-menu-item index="/tools/cpu">
          <el-icon class="menu-icon"><DataLine /></el-icon>
          <span>CPU运行模拟</span>
        </el-menu-item>
        <el-menu-item index="/tools/lottery">
          <el-icon class="menu-icon"><Trophy /></el-icon>
          <span>我很幸运</span>
        </el-menu-item>
        <el-menu-item index="/tools/fish">
          <el-icon class="menu-icon"><Trophy /></el-icon>
          <span>鱼乐一下</span>
        </el-menu-item>
        <el-menu-item index="/tools/media">
          <el-icon class="menu-icon"><Picture /></el-icon>
          <span>媒体处理工具</span>
        </el-menu-item>
      </el-sub-menu>
      <el-menu-item index="/assets">
        <el-icon class="menu-icon"><Search /></el-icon>
        <span>向量检索</span>
      </el-menu-item>
      <el-menu-item index="/topics">
        <el-icon class="menu-icon"><EditPen /></el-icon>
        <span>测验</span>
      </el-menu-item>
      <el-menu-item index="/guestbook">
        <el-icon class="menu-icon"><ChatLineRound /></el-icon>
        <span>留言板</span>
      </el-menu-item>
      <el-menu-item index="/games">
        <el-icon class="menu-icon"><Trophy /></el-icon>
        <span>童年游戏</span>
      </el-menu-item>
      <el-menu-item index="/links">
        <el-icon class="menu-icon"><LinkIcon /></el-icon>
        <span>友情链接</span>
      </el-menu-item>
      <el-menu-item index="/discussion">
        <el-icon class="menu-icon"><ChatDotRound /></el-icon>
        <span>讨论</span>
      </el-menu-item>
      </el-sub-menu>

    <el-sub-menu index="/tools" class="desktop-menu">
      <template #title>
        <el-icon class="menu-icon"><Operation /></el-icon>
        <span>工具箱</span>
      </template>
      <el-menu-item index="/tools/timestamp">
        <el-icon class="menu-icon"><Clock /></el-icon>
        <span>时间戳转换</span>
      </el-menu-item>
      <el-menu-item index="/tools/radix">
        <el-icon class="menu-icon"><Coin /></el-icon>
        <span>进制转换</span>
      </el-menu-item>
      <el-menu-item index="/tools/json">
        <el-icon class="menu-icon"><Document /></el-icon>
        <span>JSON格式化</span>
      </el-menu-item>
      <el-menu-item index="/tools/php">
        <el-icon class="menu-icon"><Notebook /></el-icon>
        <span>PHP在线运行</span>
      </el-menu-item>
      <el-menu-item index="/tools/java">
        <el-icon class="menu-icon"><Grid /></el-icon>
        <span>JAVA在线运行</span>
      </el-menu-item>
      <el-menu-item index="/tools/python">
        <el-icon class="menu-icon"><DataLine /></el-icon>
        <span>PYTHON在线运行</span>
      </el-menu-item>
      <el-menu-item index="/tools/golang">
        <el-icon class="menu-icon"><Crop /></el-icon>
        <span>GO在线运行</span>
      </el-menu-item>
      <el-menu-item index="/tools/clang">
        <el-icon class="menu-icon"><VideoPlay /></el-icon>
        <span>C在线运行</span>
      </el-menu-item>
      <el-menu-item index="/tools/cpp">
        <el-icon class="menu-icon"><Share /></el-icon>
        <span>C++在线运行</span>
      </el-menu-item>
      <el-menu-item index="/tools/draw">
        <el-icon class="menu-icon"><Grids /></el-icon>
        <span>在线同步绘画</span>
      </el-menu-item>
      <el-menu-item index="/tools/clipboard">
        <el-icon class="menu-icon"><Timer /></el-icon>
        <span>在线剪切板</span>
      </el-menu-item>
      <el-menu-item index="/tools/schulte">
        <el-icon class="menu-icon"><Grid /></el-icon>
        <span>舒尔特表格测试</span>
      </el-menu-item>
      <el-menu-item index="/tools/cpu">
        <el-icon class="menu-icon"><DataLine /></el-icon>
        <span>CPU运行模拟</span>
      </el-menu-item>
      <el-menu-item index="/tools/lottery">
        <el-icon class="menu-icon"><Trophy /></el-icon>
        <span>我很幸运</span>
      </el-menu-item>
      <el-menu-item index="/tools/fish">
        <el-icon class="menu-icon"><Fish /></el-icon>
        <span>鱼乐一下</span>
      </el-menu-item>
      <el-menu-item index="/tools/media">
        <el-icon class="menu-icon"><Picture /></el-icon>
        <span>媒体处理工具</span>
      </el-menu-item>
    </el-sub-menu>
    <el-menu-item index="/assets" class="desktop-menu">
      <el-icon class="menu-icon"><Search /></el-icon>
      <span>向量检索</span>
    </el-menu-item>
    <el-menu-item index="/topics" class="desktop-menu">
      <el-icon class="menu-icon"><EditPen /></el-icon>
      <span>测验</span>
    </el-menu-item>
    <el-menu-item index="/guestbook" class="desktop-menu">
      <el-icon class="menu-icon"><ChatLineRound /></el-icon>
      <span>留言板</span>
    </el-menu-item>
    <el-menu-item index="/games" class="desktop-menu">
      <el-icon class="menu-icon"><Gamepad /></el-icon>
      <span>童年游戏</span>
    </el-menu-item>
    <el-menu-item index="/links" class="desktop-menu">
      <el-icon class="menu-icon"><LinkIcon /></el-icon>
      <span>友情链接</span>
    </el-menu-item>
    <el-menu-item index="/discussion" class="desktop-menu">
      <el-icon class="menu-icon"><ChatDotRound /></el-icon>
      <span>讨论</span>
    </el-menu-item>

    <div class="flex-grow"></div>

    <div class="user-menu-container">
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="el-dropdown-link">
          <template v-if="isLoggedIn">
            <el-avatar shape="square" :size="40" :src="userAvatar" class="user-avatar" />
          </template>
          <template v-else>
            <el-icon :size="24"><User /></el-icon>
          </template>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <template v-if="!isLoggedIn">
              <el-dropdown-item command="/login">登录</el-dropdown-item>
              <el-dropdown-item command="/register">注册</el-dropdown-item>
            </template>
            <template v-else>
              <el-dropdown-item command="/user/profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="/dashboard">面板</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </template>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-menu>
</template>

<script>
import { useUserStore } from '@/store/user'
import { mapState, mapActions } from 'pinia'
import { User, MoreFilled, Operation, House, Search, EditPen, ChatLineRound, Link as LinkIcon, ChatDotRound, Clock, Coin, Document, Notebook, Grid, DataLine, Crop, VideoPlay, Share, Timer, Trophy, Picture } from '@element-plus/icons-vue'

export default {
  name: 'NavBar',
  components: {
    User,
    MoreFilled,
    Operation,
    House,
    Search,
    EditPen,
    ChatLineRound,
    LinkIcon,
    ChatDotRound,
    Clock,
    Coin,
    Document,
    Notebook,
    Grid,
    DataLine,
    Crop,
    VideoPlay,
    Share,
    Timer,
    Trophy
  },
  data () {
    return {
      activeIndex: this.$route.path
    }
  },
  computed: {
    ...mapState(useUserStore, ['user', 'isLoggedIn']),
    userAvatar () {
      return this.user?.avatar || 'https://images.leorain.cn/avatar/default_avatar.png'
    }
  },
  methods: {
    ...mapActions(useUserStore, ['logout', 'setShowLoginDialog']),
    handleSelect (key) {
      this.activeIndex = key
    },
    handleCommand (command) {
      if (command === 'logout') {
        this.handleLogout()
      } else if (command === '/login') {
        this.setShowLoginDialog(true)
      } else {
        this.$router.push(command)
      }
    },
    handleLogout () {
      this.logout()
      this.setShowLoginDialog(true)
    }
  },
  watch: {
    '$route' (to) {
      this.activeIndex = to.path
    }
  }
}
</script>

<style scoped lang="scss">
.nav-el-menu {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px) saturate(180%);
  display: flex;
  align-items: center;
}

.mobile-more-menu {
  display: none;
}

@media (max-width: 767px) {
  .desktop-menu {
    display: none !important;
  }
  .mobile-more-menu {
    display: block !important;
  }
}

.flex-grow {
  flex-grow: 1;
}

.user-menu-container {
  margin-left: 20px;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 10px;
  outline: none;

  @media (min-width: 768px) {
    margin-right: 20px;
  }
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  outline: none;
}

.user-avatar {
  border: 1px solid #eee;
}

.menu-icon {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  object-fit: contain;
}
</style>
