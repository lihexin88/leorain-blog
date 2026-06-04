<template>
  <div class="reset-container">
    <el-card class="reset-card">
      <template #header>
        <div class="reset-header">
          <h2>找回密码</h2>
        </div>
      </template>

      <div class="reset-content">
        <div class="reset-animation-panel">
          <div class="reset-animation-card">
            <AnimatedCharacters
                :is-typing="isInputFocused"
                :password-visible="false"
                :password-length="0"
            />
            <div class="animation-copy">
              <h3>忘记密码了？</h3>
              <p>输入您注册时使用的邮箱，我们会向您发送一封重置密码的邮件。</p>
            </div>
          </div>
        </div>

        <el-form
            ref="resetFormRef"
            :model="resetForm"
            :rules="resetRules"
            label-position="top"
            class="reset-form"
            @submit.prevent="handleSendEmail"
        >
          <el-form-item label="邮箱" prop="email">
            <el-input
                v-model="resetForm.email"
                placeholder="请输入注册邮箱"
                clearable
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
              我们会向该邮箱发送一封包含重置链接的邮件，请注意查收（链接 30 分钟内有效）。
            </div>
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
              发送重置邮件
            </el-button>
          </el-form-item>

          <div class="reset-footer">
            <el-link type="info" @click="goToLogin">返回登录</el-link>
            <el-link type="primary" @click="goToRegister">立即注册</el-link>
          </div>
        </el-form>
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
import { Message } from '@element-plus/icons-vue'

export default {
  name: 'PasswordResetRequest',
  components: {
    Validator: HumanValidator,
    AnimatedCharacters,
    Message
  },
  setup () {
    return {
      Message
    }
  },
  data () {
    return {
      isInputFocused: false,
      resetForm: {
        email: ''
      },
      resetRules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
        ]
      },
      loading: false
    }
  },
  methods: {
    ...mapActions(useUserStore, ['setShowLoginDialog']),
    async handleSendEmail () {
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
            ...this.resetForm,
            validate_key: validator.validateKey,
            validate_result: validator.validateResult
          }
          await authApi.sendResetPasswordEmail(payload)
          this.$message.success('重置密码邮件已发送，请前往邮箱查收')
        } catch (error) {
          console.error(error)
          const msg = error.response?.data?.message || '发送失败，请检查邮箱或验证码'
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
    goToRegister () {
      this.$router.push('/register')
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
}

.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-top: 4px;
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
}
</style>
