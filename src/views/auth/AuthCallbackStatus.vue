<script setup>
import { Check, Close, Loading } from '@element-plus/icons-vue'

defineProps({
  activeStep: {
    type: Number,
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
})

defineEmits(['back-login', 'back-home'])
</script>

<template>
  <div class="auth-callback-page">
    <el-card class="auth-card" shadow="always">
      <div class="auth-hero" :class="`is-${status}`">
        <div class="auth-orbit">
          <div class="auth-orbit-ring"></div>
          <div class="auth-orbit-ring is-reverse"></div>
          <div class="auth-icon-wrap">
            <el-icon v-if="status === 'processing'" class="auth-icon is-loading">
              <Loading />
            </el-icon>
            <el-icon v-else-if="status === 'success'" class="auth-icon">
              <Check />
            </el-icon>
            <el-icon v-else class="auth-icon">
              <Close />
            </el-icon>
          </div>
        </div>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>

      <el-steps :active="activeStep" finish-status="success" align-center class="auth-steps">
        <el-step title="接收授权" :description="`读取 ${provider} 回调参数`" />
        <el-step title="校验身份" :description="`连接 ${provider} 授权服务`" />
        <el-step title="同步账号" description="写入登录状态与用户信息" />
      </el-steps>

      <div v-if="status === 'processing'" class="auth-progress">
        <div class="auth-progress-bar"></div>
      </div>

      <div v-if="status === 'error'" class="auth-actions">
        <el-button type="primary" @click="$emit('back-login')">返回登录</el-button>
        <el-button @click="$emit('back-home')">回到首页</el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.auth-callback-page {
  min-height: 72vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.auth-card {
  width: min(720px, 100%);
  border: 0;
  border-radius: 24px;
  overflow: hidden;
}

.auth-hero {
  text-align: center;
  padding: 28px 24px 20px;

  h2 {
    margin: 18px 0 10px;
    color: #1f2937;
    font-size: 26px;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 15px;
  }

  &.is-success .auth-icon-wrap {
    color: #22c55e;
    background: #ecfdf5;
    box-shadow: 0 16px 40px rgb(34 197 94 / 22%);
  }

  &.is-error .auth-icon-wrap {
    color: #ef4444;
    background: #fef2f2;
    box-shadow: 0 16px 40px rgb(239 68 68 / 20%);
  }
}

.auth-orbit {
  position: relative;
  width: 132px;
  height: 132px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-orbit-ring {
  position: absolute;
  inset: 8px;
  border: 1px dashed rgb(64 158 255 / 46%);
  border-radius: 50%;
  animation: auth-rotate 7s linear infinite;

  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 22px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #409eff;
    box-shadow: 0 0 18px rgb(64 158 255 / 70%);
  }

  &.is-reverse {
    inset: 20px;
    animation-direction: reverse;
    animation-duration: 5s;
    opacity: 0.65;
  }
}

.auth-icon-wrap {
  position: relative;
  z-index: 1;
  width: 78px;
  height: 78px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  background: #eef6ff;
  border-radius: 26px;
  box-shadow: 0 18px 42px rgb(64 158 255 / 24%);
}

.auth-icon {
  font-size: 38px;

  &.is-loading {
    animation: auth-spin 1.1s linear infinite;
  }
}

.auth-steps {
  margin: 24px 0 20px;
}

.auth-progress {
  height: 4px;
  overflow: hidden;
  background: #e5edf8;
  border-radius: 999px;
}

.auth-progress-bar {
  width: 42%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, #409eff, transparent);
  animation: auth-progress 1.35s ease-in-out infinite;
}

.auth-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

@keyframes auth-rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes auth-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes auth-progress {
  from {
    transform: translateX(-110%);
  }

  to {
    transform: translateX(250%);
  }
}
</style>
