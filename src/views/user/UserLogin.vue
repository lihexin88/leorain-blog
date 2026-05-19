<template>
  <div class="login-container" :class="{ 'is-dialog': isDialog }">
    <el-card class="login-card" :class="{ 'is-dialog': isDialog }">
      <template #header v-if="!isDialog">
        <div class="login-header">
          <h2>登录</h2>
        </div>
      </template>

      <div class="login-content" :class="{ 'is-dialog': isDialog }">
        <div class="login-animation-panel">
          <div class="login-animation-card">
            <AnimatedCharacters
                class="login-animation"
                :is-typing="isInputFocused"
                :password-visible="passwordVisible"
                :password-length="loginForm.password.length"
            />
            <div class="animation-copy">
              <h3>欢迎回来</h3>
              <p>登录后即可继续评论、留言和管理个人信息等。</p>
            </div>
          </div>
        </div>

        <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-position="top"
            class="login-form"
            @submit.prevent="handleLogin"
        >
          <el-form-item label="邮箱" prop="email">
            <el-input
                v-model="loginForm.email"
                placeholder="请输入邮箱"
                clearable
                class="login-input"
                autofocus
                @focus="isInputFocused = true"
                @blur="isInputFocused = false"
            >
              <template #prefix>
                <el-icon>
                  <Message/>
                </el-icon>
              </template>
            </el-input>
            <div class="form-tip">
              如果您在本站评论或者留言过，请点击下面的忘记密码，重置您的密码即可登录
            </div>
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
                v-model="loginForm.password"
                class="login-input"
                :type="passwordVisible ? 'text' : 'password'"
                placeholder="请输入密码"
            >
              <template #suffix>
                <el-icon style="cursor: pointer" @click="passwordVisible = !passwordVisible">
                  <ViewIcon v-if="!passwordVisible"/>
                  <HideIcon v-else/>
                </el-icon>
              </template>
              <template #prefix>
                <el-icon>
                  <Lock/>
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="remember">
            <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
          </el-form-item>

          <el-form-item label="验证码" required>
            <Validator ref="validatorRef"/>
          </el-form-item>

          <el-form-item>
            <el-button
                type="primary"
                class="login-button"
                :loading="loading"
                native-type="submit"
            >
              登录
            </el-button>
          </el-form-item>

          <div class="divider-container" v-if="authConfig.length > 2">
            <el-divider>or</el-divider>
          </div>

          <el-form-item v-if="authConfig">
            {{ authConfig }}
            <el-button @click="handleGithubLogin">
              <i class="fab fa-github"></i>&nbsp;GitHub 登录
            </el-button>
            <el-button @click="handleGiteeLogin">
              <i class="fab fa-gitee"></i>&nbsp;Gitee 登录
            </el-button>
          </el-form-item>

          <div class="login-footer">
            <el-link type="info" @click="handleResetPassword">忘记密码</el-link>
            <el-link type="primary" @click="handleRegister">立即注册</el-link>
          </div>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script>
import HumanValidator from '@/components/HumanValidator.vue'
import AnimatedCharacters from '@/components/AnimatedCharacters.vue'
import { useUserStore } from '@/store/user'
import authApi from '@/apis/auth.js'
import { mapActions } from 'pinia'
import { Message, Lock, View as ViewIcon, Hide as HideIcon } from '@element-plus/icons-vue'
import { triggerConfetti } from '@/utils/helpers'

export default {
  name: 'UserLogin',
  components: {
    Validator: HumanValidator,
    AnimatedCharacters,
    Lock,
    Message,
    ViewIcon,
    HideIcon
  },
  props: {
    isDialog: {
      type: Boolean,
      default: false
    }
  },
  setup () {
    return {
      Message,
      Lock,
      ViewIcon,
      HideIcon
    }
  },
  data () {
    return {
      isInputFocused: false,
      passwordVisible: false,
      loginForm: {
        email: '',
        password: '',
        remember: false
      },
      loginRules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ]
      },
      loading: false,
      authConfig: []
    }
  },
  methods: {
    ...mapActions(useUserStore, ['login', 'setShowLoginDialog']),
    async handleLogin () {
      // 表单预验证
      await this.$refs.loginFormRef.validate(async (valid) => {
        if (!valid) return

        const validator = this.$refs.validatorRef
        if (!validator.validateResult) {
          this.$message.error('请输入验证码结果')
          return
        }

        if (validator.timeRemain === 0) {
          this.$message.warning('验证码已过期，请点击刷新后重试')
          return
        }

        this.loading = true
        try {
          const payload = {
            ...this.loginForm,
            validate_key: validator.validateKey,
            validate_result: validator.validateResult
          }
          await this.login(payload)
          triggerConfetti()
          this.$message.success('登录成功')
          if (this.isDialog) {
            this.setShowLoginDialog(false)
          } else {
            this.$router.push('/')
          }
        } catch (error) {
          console.error(error)
          const msg = error.response?.data?.message || '登录失败，请检查账号密码或验证码'
          this.$message.error(msg)
          // 登录失败通常需要刷新验证码
          if (this.$refs.validatorRef) {
            this.$refs.validatorRef.getImageData()
          }
        } finally {
          this.loading = false
        }
      })
    },
    handleGithubLogin () {
      window.location.href = this.authConfig.github.auth_url
    },
    handleGiteeLogin () {
      window.location.href = this.authConfig.gitee.auth_url
    },
    handleRegister () {
      if (this.isDialog) {
        this.setShowLoginDialog(false)
      }
      this.$router.push('/register')
    },
    handleResetPassword () {
      if (this.isDialog) {
        this.setShowLoginDialog(false)
      }
      this.$router.push('/password/reset')
    },
    getAuthConfig () {
      authApi.getConfig().then(res => {
        this.authConfig = res
      })
    }
  },
  mounted () {
    this.getAuthConfig()
  }
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 50px;

  &.is-dialog {
    padding-top: 0;
  }
}

.login-card {
  width: 100%;
  max-width: 920px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &.is-dialog {
    max-width: 100%;
    border: none;
    box-shadow: none;
    border-radius: 0;
  }

  :deep(.el-card__header) {
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.el-card__body) {
    padding: 0;
  }
}

.login-content {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  align-items: stretch;
}

.login-animation-panel {
}

.login-animation-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 20px;
}

.login-animation {
  width: 100%;
}

.animation-copy {
  h3 {
    margin: 0 0 10px;
    font-size: 24px;
    color: #303133;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: #606266;
  }
}

.login-form {
  padding: 28px 32px 32px;
}

.login-header {
  h2 {
    margin: 0;
    font-size: 24px;
    color: #303133;
    font-weight: 600;
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-top: 4px;
}

.login-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
}

.divider-container {
  margin: 20px 0;
}

.github-button {
  width: 100%;
  background-color: #24292e;
  border-color: #24292e;
  color: #fff;

  &:hover, &:focus {
    background-color: #444d56;
    border-color: #444d56;
    color: #fff;
  }
}

.login-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

/* 响应式调整 */
@include mobile {
  .login-container {
    padding: 20px;
    align-items: center;
  }

  .login-card {
    max-width: 100%;
    box-shadow: none;
    border: none;
  }

  .login-content {
    grid-template-columns: 1fr;
  }

  .login-animation-panel {
    border-right: none;
    border-bottom: 1px solid #ebeef5;
  }

  .login-form {
    padding: 24px 20px 28px;
  }
  .login-input {
    :deep(.el-input__inner) {
      font-size: 16px;
    }
  }
}
</style>
