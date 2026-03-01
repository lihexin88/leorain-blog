<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="register-header">
          <h2>注册</h2>
        </div>
      </template>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-position="top"
        @submit.prevent="handleRegister"
      >
        <el-form-item label="用户名" prop="name">
          <el-input
            v-model="registerForm.name"
            placeholder="请输入用户名"
            clearable
            autofocus
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
          <div class="form-tip">
            如果您在本站评论或者留言过，请在登录页面点击忘记密码，重置您的密码即可登录
          </div>
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            clearable
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="确认密码" prop="password_confirmation">
          <el-input
            v-model="registerForm.password_confirmation"
            type="password"
            placeholder="请再次输入密码"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="验证码" required>
          <Validator ref="validatorRef" />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="register-button"
            :loading="loading"
            native-type="submit"
          >
            注册
          </el-button>
        </el-form-item>

        <div class="register-footer">
          <span>已有账号？</span>
          <el-link type="primary" @click="goToLogin">立即登录</el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import Validator from '@/components/Validator.vue'
import authApi from '@/apis/auth'
import { User, Message, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { mapActions } from 'pinia'

export default {
  name: 'UserRegister',
  components: {
    Validator,
    User,
    Message,
    Lock
  },
  setup () {
    return {
      User,
      Message,
      Lock
    }
  },
  data () {
    const validateConfirmPassword = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else if (value !== this.registerForm.password) {
        callback(new Error('两次输入密码不一致!'))
      } else {
        callback()
      }
    }
    return {
      registerForm: {
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
      },
      registerRules: {
        name: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, message: '用户名长度不能少于3位', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
        ],
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
  methods: {
    ...mapActions(useUserStore, ['setShowLoginDialog']),
    async handleRegister () {
      await this.$refs.registerFormRef.validate(async (valid) => {
        if (!valid) return

        const validator = this.$refs.validatorRef
        if (!validator.validateResult) {
          this.$message.error('请输入验证码结果')
          return
        }

        this.loading = true
        try {
          const payload = {
            ...this.registerForm,
            validate_key: validator.validateKey,
            validate_result: validator.validateResult
          }
          await authApi.register(payload)
          this.$message.success('注册成功，请登录')
          this.$router.push('/')
          this.setShowLoginDialog(true)
        } catch (error) {
          console.error(error)
          const msg = error.response?.data?.message || '注册失败，请检查填写内容或验证码'
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
    }
  }
}
</script>

<style scoped lang="scss">
.register-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 50px;
  padding-bottom: 50px;
}

.register-card {
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  :deep(.el-card__header) {
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid #ebeef5;
  }
}

.register-header {
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

.register-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
}

.register-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 15px;
  font-size: 14px;
  color: #606266;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .register-container {
    padding: 20px;
  }

  .register-card {
    box-shadow: none;
    border: none;
  }
}
</style>
