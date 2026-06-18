<template>
  <div class="guest-input-form">
    <div>
      <div style="padding-right: 5px;cursor: pointer" role="button" tabindex="0" @click="openDialog" @keydown.enter="openDialog">
        <el-avatar shape="circle" :size="40" :src="avatar"></el-avatar>
      </div>
    </div>
    <el-dialog v-model="dialogVisible"
               v-if="isDialogOwner"
               class="guest-dialog"
               width="400px"
               :align-center="true"
               :append-to-body="true"
               @mousemove="handleMouseMove"
               @mouseleave="handleMouseLeave">
      <template v-slot:header>
        <div class="guest-dialog-header">
          <span class="header-title">访客信息</span>
          <span class="header-subtitle">Guest Info</span>
        </div>
      </template>
      <div class="guest-dialog-body" :style="tiltStyle">
        <div class="avatar-wrapper">
          <el-avatar shape="circle" :size="80" :src="avatar" class="guest-avatar"></el-avatar>
          <div class="avatar-decoration"></div>
        </div>
        <el-form ref="guestFormRef" :model="guest" :rules="guestRules" label-position="top" class="guest-input-box">
          <el-form-item label="昵称" prop="name">
            <el-input v-model="guest.name" :clearable="true" placeholder="如何称呼您？"></el-input>
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input type="email" v-model="guest.email" :clearable="true"
                      placeholder="用于接收回复通知"></el-input>
          </el-form-item>
          <el-form-item label="网址">
            <el-input v-model="guest.website" :clearable="true" placeholder="您的博客或个人主页 (选填)"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template v-slot:footer>
        <div class="guest-dialog-footer">
          <el-button class="confirm-btn" :loading="saving" @click="saveGuestInfo">开启交流</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import MD5 from 'crypto-js/md5'
import debounce from 'lodash/debounce'
import { useUserStore } from '@/store/user'

export default {
  components: {},
  props: {},
  data () {
    return {
      guest: {
        name: null,
        email: null,
        website: null
      },
      guestRules: {
        name: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
        email: [
          { required: true, message: '邮箱不能为空', trigger: 'blur' },
          { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
        ]
      },
      avatar: '',
      guestAvatarPrefix: 'https://api.dicebear.com/9.x/adventurer/svg?seed=',
      // pinia
      userStore: null,
      // 唯一实例标识，用于确保全局仅渲染一个弹窗
      instanceId: Math.random().toString(36).slice(2),
      debouncedUpdateAvatar: null,
      saving: false,
      tiltStyle: {
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
      }
    }
  },
  watch: {
    'guest.email': {
      handler (val) {
        if (!this.avatar || this.avatar === this.guestAvatarPrefix + MD5('').toString()) {
          this.updateAvatar(val)
        } else {
          this.debouncedUpdateAvatar(val)
        }
      },
      immediate: true
    },
    // 监听对话框显隐，关闭时释放拥有者
    dialogVisible (val) {
      if (!val && this.userStore && this.isDialogOwner) {
        this.userStore.unregisterLoginDialogOwner(this.instanceId)
      }
    }
  },
  computed: {
    // 和 el-dialog v-model 双向绑定，映射到 pinia store
    dialogVisible: {
      get () {
        return this.userStore ? this.userStore.showGuestDialog : false
      },
      set (val) {
        if (!this.userStore) this.userStore = useUserStore()
        this.userStore.setShowGuestDialog(val)
      }
    },
    // 兼容旧版 CommentArea 等组件的调用
    showDialog: {
      get () {
        return this.dialogVisible
      },
      set (val) {
        this.dialogVisible = val
      }
    },
    // 仅拥有者实例才渲染弹窗
    isDialogOwner () {
      return this.userStore && this.userStore.loginDialogOwnerId === this.instanceId
    }
  },
  created () {
    this.debouncedUpdateAvatar = debounce((val) => {
      this.updateAvatar(val)
    }, 1000)
  },
  mounted () {
    // 绑定 store
    this.userStore = useUserStore()
    this.loadGuestInfo()
    if (!this.guest.name || !this.guest.email) {
      // 需要展示弹窗时，走全局开关
      // this.userStore.setShowGuestDialog(true)
    }
    // 注册全局弹窗拥有者（仅首次注册）
    if (!this.userStore.loginDialogOwnerId) {
      if (this.userStore && typeof this.userStore.registerLoginDialogOwner === 'function') {
        this.userStore.registerLoginDialogOwner(this.instanceId)
      }
    }
  },
  beforeUnmount () {
    if (this.debouncedUpdateAvatar) {
      this.debouncedUpdateAvatar.cancel()
    }
    // 卸载时若为拥有者则释放
    if (this.userStore && this.userStore.loginDialogOwnerId === this.instanceId) {
      this.userStore.unregisterLoginDialogOwner(this.instanceId)
    }
  },
  methods: {
    openDialog () {
      if (!this.userStore) this.userStore = useUserStore()
      // 若当前无拥有者，抢占拥有者
      if (!this.userStore.loginDialogOwnerId) {
        if (this.userStore && typeof this.userStore.registerLoginDialogOwner === 'function') {
          this.userStore.registerLoginDialogOwner(this.instanceId)
        }
      }
      this.userStore.setShowGuestDialog(true)
    },
    updateAvatar (val) {
      this.avatar = this.guestAvatarPrefix + MD5(val || '').toString()
    },
    handleMouseMove (e) {
      const dialog = e.currentTarget.querySelector('.el-dialog')
      if (!dialog) return
      const rect = dialog.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = ((y - centerY) / centerY) * -10 // Max 10 degrees
      const rotateY = ((x - centerX) / centerX) * 10 // Max 10 degrees
      this.tiltStyle = {
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
      }
    },
    handleMouseLeave () {
      this.tiltStyle = {
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
      }
    },
    loadGuestInfo () {
      const guestInfo = localStorage.getItem('guest_info')
      if (guestInfo) {
        try {
          const guestObject = JSON.parse(guestInfo)
          this.guest.name = guestObject.nickname
          this.guest.email = guestObject.email
          this.guest.website = guestObject.website
        } catch (e) {
          console.error('Failed to parse guest_info', e)
        }
      }
    },
    saveGuestInfo () {
      if (this.saving) return
      this.$refs.guestFormRef?.validate().then(() => {
        this.saving = true
        localStorage.setItem('guest_info', JSON.stringify({
          nickname: this.guest.name,
          email: this.guest.email,
          website: this.guest.website
        }))
        if (this.userStore) {
          this.userStore.setShowGuestDialog(false)
        }
        this.$emit('update')
      }).catch(() => {
        // validation failed, inline errors shown
      }).finally(() => {
        this.saving = false
      })
    },
    validateData () {
      return this.$refs.guestFormRef?.validate().catch(() => false) || false
    },
  }
}
</script>
<style scoped lang="scss">

:deep(.guest-dialog) {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: none;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);

  .el-dialog__header {
    margin-right: 0;
    padding: 25px 25px 10px;
  }

  .el-dialog__body {
    padding: 10px 25px 20px;
    perspective: 1000px;
  }

  .el-dialog__footer {
    padding: 10px 25px 25px;
    text-align: center;
  }
}

.guest-dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;

  .header-title {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(45deg, #409EFF, #67C23A);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .header-subtitle {
    font-size: 0.8rem;
    color: #909399;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 4px;
  }
}

.guest-dialog-body {
  transition: transform 0.1s ease-out;
  transform-style: preserve-3d;
}

.avatar-wrapper {
  display: flex;
  justify-content: center;
  position: relative;
  margin-bottom: 25px;

  .guest-avatar {
    border: 4px solid #fff;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
    z-index: 2;

    &:hover {
      transform: scale(1.1) rotate(5deg);
    }
  }

  .avatar-decoration {
    position: absolute;
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(64, 158, 255, 0.2) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.2; }
  100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
}

.guest-input-form {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
}

.guest-input-box {
  display: flex;
  flex-direction: column;
  gap: 15px;

  :deep(.el-form-item__label) {
    font-size: 0.9rem;
    font-weight: 600;
    color: #606266;
    padding-left: 5px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 12px;
    background-color: #f5f7fa;
    box-shadow: none;
    border: 2px solid transparent;
    transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
    padding: 5px 15px;

    &.is-focus {
      background-color: #fff;
      border-color: #409EFF;
      box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.1);
    }
  }
}

.guest-dialog-footer {
  .confirm-btn {
    width: 100%;
    height: 45px;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(45deg, #409EFF, #007aff);
    border: none;
    box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3);
    transition: transform 0.3s, box-shadow 0.3s, background 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
      background: linear-gradient(45deg, #66b1ff, #409EFF);
    }

    &:active {
      transform: translateY(0);
    }
  }
}
</style>
