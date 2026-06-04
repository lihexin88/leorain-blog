<template>
  <div class="reset-container">
    <el-card class="reset-card">
      <template #header>
        <div class="reset-header">
          <h2>重置密码</h2>
        </div>
      </template>

      <div class="reset-content">
        <div class="reset-animation-panel">
          <div class="reset-animation-card">
            <AnimatedCharacters
                :is-typing="isInputFocused"
                :password-visible="passwordVisible"
                :password-length="resetForm.password.length"
            />
            <div class="animation-copy">
              <h3>设置新密码</h3>
              <p>请为您的账户设置一个新密码，重置成功后将自动登录。</p>
            </div>
          </div>
        </div>

        <el-form
            v-if="hasToken"
            ref="resetFormRef"
            :model="resetForm"
            :rules="resetRules"
            label-position="top"
            class="reset-form"
            @submit.prevent="handleResetPassword"
        >
          <el-form-item label="新密码" prop="password">
            <el-input
                v-model="resetForm.password"
                class="reset-input"
                :type="passwordVisible ? 'text' : 'password'"
                placeholder="请输入新密码"
                autofocus
                @focus="isInputFocused = true"
                @blur="isInputFocused = false"
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

          <el-form-item label="确认密码" prop="password_confirmation">
            <el-input
                v-model="resetForm.password_confirmation"
                class="reset-input"
                :type="passwordVisible ? 'text' : 'password'"
                placeholder="请再次输入新密码"
                @focus="isInputFocused = true"
                @blur="isInputFocused = false"
            >
              <template #prefix>
                <el-icon>
                  <Lock/>
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="验证码" required>
            <Validator ref="validatorRef"/>
          </el-form-item>

          <el-form-item>
            <el-button
                type="primary"
                class="reset-button"
                :loading="loading"
                native-type="submit"
            >
              确认重置
            </el-button>
          </el-form-item>

          <div class="reset-footer">
            <el-link type="info" @click="goToLogin">返回登录</el-link>
            <el-link type="primary" @click="goToResetRequest">重新申请</el-link>
          </div>
        </el-form>

        <div v-else class="reset-form invalid-token">
          <el-result
              icon="warning"
              title="无效的链接"
              sub-title="未检测到重置令牌，请重新申请重置密码邮件。"
          >
            <template #extra>
              <el-button type="primary" @click="goToResetRequest">前往申请</el-button>
              <el-button @click="goToLogin">返回登录</el-button>
            </template>
          </el-result>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import HumanValidator from '@/components/HumanValidator.vue'
import AnimatedCharacters from '@/components/AnimatedCharacters.vue'
import authApi from '@/apis/auth'
import { useUserStore } from '@/store/user'
import { mapActions } from 'pinia'
import { Lock, View as ViewIcon, Hide as HideIcon } from '@element-plus/icons-vue'
import { triggerConfetti } from '@/utils/helpers'

export default {
  name: 'PasswordReset',
  components: {
    Validator: HumanValidator,
    AnimatedCharacters,
    Lock,
    ViewIcon,
    HideIcon
  },
  setup () {
    return {
      Lock,
      ViewIcon,
      HideIcon
    }
  },
  data () {
    const validateConfirmPassword = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else if (value !== this.resetForm.password) {
        callback(new Error('两次输入密码不一致!'))
      } else {
        callback()
      }
    }
    return {
      isInputFocused: false,
      passwordVisible: false,
      resetForm: {
        password: '',
        password_confirmation: ''
      },
      resetRules: {
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ],
        password_confirmation: [
          { required: true, validator: validateConfirmPassword, trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  computed: {
    token () {
      return this.$route.query.token || ''
    },
    hasToken () {
      return !!this.token
    }
  },
  methods: {
    ...mapActions(useUserStore, ['fetchUserInfo', 'setShowLoginDialog']),
    async handleResetPassword () {
      await this.$refs.resetFormRef.validate(async (valid) => {
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
            token: this.token,
            password: this.resetForm.password,
            password_confirmation: this.resetForm.password_confirmation,
            validate_key: validator.validateKey,
            validate_result: validator.validateResult
          }
          const res = await authApi.resetPassword(payload)
          const accessToken = res.access_token || res.token || res.data?.access_token
          if (accessToken) {
            localStorage.setItem('token', accessToken)
            const userStore = useUserStore()
            userStore.token = accessToken
            try {
              await this.fetchUserInfo()
            } catch (e) {
              console.error('fetchUserInfo after reset failed:', e)
            }
          }
          triggerConfetti()
          this.$message.success('密码重置成功')
          this.$router.push('/')
        } catch (error) {
          console.error(error)
          const msg = error.response?.data?.message || '重置失败，请检查链接是否有效或验证码'
          this.$message.error(msg)
          if (this.$refs.validatorRef) {
            this.$refs.validatorRef.getImageData()
          }
        } finally {
          this.loading = false
        }
      })
    },
    goToLogin () {
      this.$router.push('/')
      this.setShowLoginDialog(true)
    },
    goToResetRequest () {
      this.$router.push('/password/reset')
    }
  }
}
</script>

<style scoped lang="scss">
.reset-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 50px;
  padding-bottom: 50px;
}

.reset-card {
  width: 100%;
  max-width: 920px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  :deep(.el-card__header) {
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.el-card__body) {
    padding: 0;
  }
}

.reset-content {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  align-items: stretch;
}

.reset-animation-panel {
  border-right: 1px solid #ebeef5;
}

.reset-animation-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 20px;
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
    padding: 0 24px;
  }
}

.reset-header {
  h2 {
    margin: 0;
    font-size: 24px;
    color: #303133;
    font-weight: 600;
  }
}

.reset-form {
  padding: 28px 32px 32px;

  &.invalid-token {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.reset-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
}

.reset-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

@include mobile {
  .reset-container {
    padding: 20px;
  }

  .reset-card {
    max-width: 100%;
    box-shadow: none;
    border: none;
  }

  .reset-content {
    grid-template-columns: 1fr;
  }

  .reset-animation-panel {
    border-right: none;
    border-bottom: 1px solid #ebeef5;
  }

  .reset-form {
    padding: 24px 20px 28px;
  }

  .reset-input {
    :deep(.el-input__inner) {
      font-size: 16px;
    }
  }
}
</style>
