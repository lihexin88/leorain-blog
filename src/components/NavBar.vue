<template>
  <el-menu
      :default-active="activeIndex"
      class="nav-el-menu"
      mode="horizontal"
      :router="true"
      :ellipsis="false"
      @select="handleSelect"
  >
    <el-menu-item index="/">首页</el-menu-item>
    <el-sub-menu index="/tools">
      <template #title>工具箱</template>
      <el-menu-item index="/tools/timestamp">
        <img src="https://images.leorain.cn/icons/tools/tool_timestamp.png" class="menu-icon" />
        <span>时间戳转换</span>
      </el-menu-item>
      <el-menu-item index="/tools/radix">
        <img src="https://images.leorain.cn/icons/tools/tool_radix.png" class="menu-icon" />
        <span>进制转换</span>
      </el-menu-item>
      <el-menu-item index="/tools/json">
        <img src="https://images.leorain.cn/icons/tools/tool_json_format.png" class="menu-icon" />
        <span>JSON格式化</span>
      </el-menu-item>
      <el-menu-item index="/tools/php">
        <img src="https://images.leorain.cn/icons/tools/tool_php.png" class="menu-icon" />
        <span>PHP在线运行</span>
      </el-menu-item>
      <el-menu-item index="/tools/java">
        <img src="https://images.leorain.cn/icons/tools/tool_java.png" class="menu-icon" />
        <span>JAVA在线运行</span>
      </el-menu-item>
      <el-menu-item index="/tools/python">
        <img src="https://images.leorain.cn/icons/tools/tool_python.png" class="menu-icon" />
        <span>PYTHON在线运行</span>
      </el-menu-item>
      <el-menu-item index="/tools/golang">
        <img src="https://images.leorain.cn/icons/tools/tool_golang.png" class="menu-icon" />
        <span>GO在线运行</span>
      </el-menu-item>
      <el-menu-item index="/tools/clang">
        <img src="https://images.leorain.cn/icons/tools/tool_clang.png" class="menu-icon" />
        <span>C在线运行</span>
      </el-menu-item>
      <el-menu-item index="/tools/cpp">
        <img src="https://images.leorain.cn/icons/tools/tool_cpp.png" class="menu-icon" />
        <span>C++在线运行</span>
      </el-menu-item>
      <el-menu-item index="/tools/draw">
        <img src="https://images.leorain.cn/icons/tools/tool_draw.png" class="menu-icon" />
        <span>在线同步绘画</span>
      </el-menu-item>
      <el-menu-item index="/tools/clipboard">
        <img src="https://images.leorain.cn/icons/tools/tool_clipboard.png" class="menu-icon" />
        <span>在线剪切板</span>
      </el-menu-item>
      <el-menu-item index="/tools/schulte">
        <img src="https://images.leorain.cn/icons/tools/tool_table_number.png" class="menu-icon" />
        <span>舒尔特表格测试</span>
      </el-menu-item>
      <el-menu-item index="/tools/cpu">
        <img src="https://images.leorain.cn/icons/tools/tool_cpu.png" class="menu-icon" />
        <span>CPU运行模拟</span>
      </el-menu-item>
      <el-menu-item index="/tools/lottery">
        <img src="https://images.leorain.cn/icons/tools/tool_lucky.png" class="menu-icon" />
        <span>我很幸运</span>
      </el-menu-item>
      <el-menu-item index="/tools/fish">
        <img src="https://images.leorain.cn/icons/tools/tool_fish.png" class="menu-icon" />
        <span>鱼乐一下</span>
      </el-menu-item>
    </el-sub-menu>
    <el-menu-item index="/assets">向量检索</el-menu-item>
    <el-menu-item index="/quiz">测验</el-menu-item>
    <el-menu-item index="/guestbook">留言板</el-menu-item>
    <el-menu-item index="/games">童年游戏</el-menu-item>
    <el-menu-item index="/links">友情链接</el-menu-item>
    <el-menu-item index="/categories">所有分类</el-menu-item>
    <el-menu-item index="/discussion">讨论</el-menu-item>

    <div class="flex-grow"></div>

    <div class="user-menu-container">
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="el-dropdown-link">
          <template v-if="isLoggedIn">
            <el-avatar :size="30" :src="userAvatar" class="user-avatar" />
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
import { User } from '@element-plus/icons-vue'

export default {
  name: 'NavBar',
  components: {
    User
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
    ...mapActions(useUserStore, ['logout']),
    handleSelect (key) {
      this.activeIndex = key
    },
    handleCommand (command) {
      if (command === 'logout') {
        this.handleLogout()
      } else {
        this.$router.push(command)
      }
    },
    handleLogout () {
      this.logout()
      this.$router.push('/login')
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
