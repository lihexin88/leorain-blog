<template>
  <el-menu
      :default-active="activeIndex"
      class="nav-el-menu"
      mode="horizontal"
      :router="true"
      :ellipsis="false"
      menu-trigger="click"
      @select="handleSelect"
  >
    <el-menu-item index="/">
      <img src="/images/logo.png" class="menu-icon"/>
      <span>首页</span>
    </el-menu-item>

    <!-- 移动端折叠菜单 -->
    <el-sub-menu index="more" class="mobile-more-menu">
      <template #title>
        <el-icon class="menu-icon">
          <MoreFilled/>
        </el-icon>
        <span>更多</span>
      </template>
      <el-sub-menu index="/tools-mobile">
        <template #title>
          <el-icon class="menu-icon">
            <Operation/>
          </el-icon>
          <span>工具箱</span>
        </template>
        <el-menu-item v-for="(tool,index) in tools" :key="index" :index="tool.href">
          <img :src="tool.image" class="menu-icon"/>
          <span>{{ tool.text }}</span>
        </el-menu-item>
      </el-sub-menu>
      <el-menu-item index="/assets">
        <el-icon class="menu-icon">
          <Search/>
        </el-icon>
        <span>智能媒体</span>
      </el-menu-item>
      <el-menu-item index="/topics">
        <el-icon class="menu-icon">
          <EditPen/>
        </el-icon>
        <span>测验</span>
      </el-menu-item>
      <el-menu-item index="/guestbook">
        <el-icon class="menu-icon">
          <ChatLineRound/>
        </el-icon>
        <span>留言板</span>
      </el-menu-item>
      <el-menu-item index="/games">
        <el-icon class="menu-icon">
          <Trophy/>
        </el-icon>
        <span>童年游戏</span>
      </el-menu-item>
      <el-menu-item index="/links">
        <el-icon class="menu-icon">
          <LinkIcon/>
        </el-icon>
        <span>友情链接</span>
      </el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="/tools" class="desktop-menu">
      <template #title>
        <el-icon class="menu-icon">
          <Operation/>
        </el-icon>
        <span>工具箱</span>
      </template>
      <el-menu-item v-for="(tool,index) in tools" :key="index" :index="tool.href">
        <img :src="tool.image" class="menu-icon"/>
        <span>{{ tool.text }}</span>
      </el-menu-item>
    </el-sub-menu>
    <el-menu-item index="/assets" class="desktop-menu">
      <el-icon class="menu-icon">
        <Search/>
      </el-icon>
      <span>智能媒体</span>
    </el-menu-item>
    <el-menu-item index="/topics" class="desktop-menu">
      <el-icon class="menu-icon">
        <EditPen/>
      </el-icon>
      <span>测验</span>
    </el-menu-item>
    <el-menu-item index="/guestbook" class="desktop-menu">
      <el-icon class="menu-icon">
        <ChatLineRound/>
      </el-icon>
      <span>留言板</span>
    </el-menu-item>
    <el-menu-item index="/games" class="desktop-menu">
      <el-icon class="menu-icon">
        <Sugar/>
      </el-icon>
      <span>童年游戏</span>
    </el-menu-item>
    <el-menu-item index="/links" class="desktop-menu">
      <el-icon class="menu-icon">
        <LinkIcon/>
      </el-icon>
      <span>友情链接</span>
    </el-menu-item>

    <div class="flex-grow"></div>

    <div class="user-menu-container">
      <el-icon class="login-icon" v-if="!isLoggedIn" @click="setShowLoginDialog(true)" :size="36">
        <User/>
      </el-icon>
      <el-dropdown v-else trigger="click" @command="handleCommand">
        <div class="el-dropdown-link">
          <el-avatar shape="square" :size="50" :src="userAvatar" class="user-avatar"/>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="/user/profile">个人中心</el-dropdown-item>
            <el-dropdown-item command="https://frontend.leorain.cn/dashboard">面板</el-dropdown-item>
            <el-dropdown-item command="clear-cache">清除缓存</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-menu>
</template>

<script>
import { useUserStore } from '@/store/user'
import { mapState, mapActions } from 'pinia'
import responseApi from '@/apis/response'
import {
  User,
  MoreFilled,
  Operation,
  Search,
  EditPen,
  ChatLineRound,
  Link as LinkIcon,
  Trophy,
  Sugar
} from '@element-plus/icons-vue'

export default {
  name: 'NavBar',
  components: {
    Sugar,
    User,
    MoreFilled,
    Operation,
    Search,
    EditPen,
    ChatLineRound,
    LinkIcon,
    Trophy
  },
  data () {
    return {
      activeIndex: this.$route.path,
      tools: [{
        text: '时间戳转换',
        description: '时间戳转换工具，提供当前时间戳和时间字符串转换功能',
        href: '/tools/timestamp',
        image: 'https://images.leorain.cn/icons/tools/tool_timestamp.png'
      },
      {
        text: '进制转换',
        description: '十进制 二进制 八进制 十六进制等自动转换',
        href: '/tools/radix',
        image: 'https://images.leorain.cn/icons/tools/tool_radix.png'
      },
      {
        text: 'json格式化',
        description: 'json字符串格式化与压缩',
        href: '/tools/json',
        image: 'https://images.leorain.cn/icons/tools/tool_json_format.png'
      },
      {
        text: '代码在线运行',
        description: '代码在线运行工具',
        href: '/tools/code',
        image: 'https://images.leorain.cn/icons/tools/tool_cpp.png'
      },
      {
        text: '在线同步绘画',
        description: '在线协作作图工具',
        href: '/tools/draw',
        image: 'https://images.leorain.cn/icons/tools/tool_draw.png'
      },
      {
        text: '在线剪切板',
        description: '在线同步剪切板',
        href: '/tools/clipboard',
        image: 'https://images.leorain.cn/icons/tools/tool_clipboard.png'
      },
      {
        text: '舒尔特表格测试',
        description: '舒尔特表格测试',
        href: '/tools/schulte',
        image: 'https://images.leorain.cn/icons/tools/tool_table_number.png'
      },
      {
        text: 'CPU运行模拟',
        description: 'CPU运行过程模拟',
        href: '/tools/cpu',
        image: 'https://images.leorain.cn/icons/tools/tool_cpu.png'
      },
      {
        text: '我很幸运',
        description: '模拟',
        href: '/tools/lottery',
        image: 'https://images.leorain.cn/icons/tools/tool_lucky.png'
      },
      {
        text: '媒体处理',
        description: '在线处理图片视频，格式转换，压缩等',
        href: '/tools/media',
        image: 'https://images.leorain.cn/icons/tools/tool_picture.png'
      },
      {
        text: '开发工具箱',
        description: 'URL, Base64, MD5, Unicode, 大小写转换',
        href: '/tools/coder',
        image: 'https://images.leorain.cn/icons/tools/tool_cpp.png'
      },
      {
        text: '鱼乐一下',
        description: '钓鱼小游戏',
        href: '/tools/fish',
        image: 'https://images.leorain.cn/icons/tools/tool_fish.png'
      },
      {
        text: 'Linux 在线终端',
        description: '在浏览器中运行真实的 Linux 容器，支持完整终端交互',
        href: '/tools/linux',
        image: 'https://images.leorain.cn/icons/tools/tool_cpp.png'
      },
      {
        text: 'SBTI 人格测试',
        description: '娱乐向 SBTI 人格测试与维度分析',
        href: '/tools/sbti',
        image: '/images/logo.png'
      }
      ]
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
      } else if (command === 'clear-cache') {
        // 调用清除缓存接口（迁移到 apis/response.js）
        responseApi.clearCache()
          .then(() => {
            this.$message.success('缓存已清除')
            this.$router.go(0)
          })
          .catch((err) => {
            const msg = err?.message || err?.response?.data?.message || '未知错误'
            this.$message.error('清除失败：' + msg)
          })
      } else if (command === '/login') {
        this.setShowLoginDialog(true)
      } else if (command.startsWith('http://') || command.startsWith('https://')) {
        // 处理外部链接
        window.open(command, '_blank')
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
  transition: all .3s ease-in-out;
  &:hover {
    border-color: #409eff;
    scale: 1.05;
  }
}

.menu-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  object-fit: contain;
}
.login-icon {
  cursor: pointer;
  &:hover{
    color: #409eff;
  }
}
</style>
