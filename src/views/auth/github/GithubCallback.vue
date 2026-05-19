<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthCallbackStatus from '@/views/auth/AuthCallbackStatus.vue'
import { useOauthStore } from '@/store/oauth'

const route = useRoute()
const router = useRouter()
const oauthStore = useOauthStore()
const activeStep = ref(0)
const authStatus = ref('processing')
const errorMessage = ref('')
let progressTimer = null

const statusTitle = computed(() => {
  if (authStatus.value === 'success') {
    return 'GitHub 认证成功'
  }
  if (authStatus.value === 'error') {
    return 'GitHub 认证失败'
  }
  return '正在进行 GitHub 认证'
})

const statusDescription = computed(() => {
  if (authStatus.value === 'success') {
    return '账号信息已同步，正在为你跳转到首页。'
  }
  if (authStatus.value === 'error') {
    return errorMessage.value || '认证过程中出现异常，请返回登录页后重试。'
  }
  return '请稍候，我们正在校验授权信息并同步你的账号。'
})

const startProgress = () => {
  activeStep.value = 1
  progressTimer = window.setInterval(() => {
    if (activeStep.value < 2) {
      activeStep.value += 1
    }
  }, 900)
}

const stopProgress = () => {
  if (progressTimer) {
    window.clearInterval(progressTimer)
    progressTimer = null
  }
}

const backToLogin = () => {
  router.push('/login')
}

const backToHome = () => {
  router.push('/')
}

onMounted(async () => {
  const code = route.query.code
  if (!code) {
    authStatus.value = 'error'
    errorMessage.value = '缺少 GitHub 授权参数，请重新发起登录。'
    return
  }

  startProgress()
  try {
    await oauthStore.loginWithGithub(code)
    stopProgress()
    authStatus.value = 'success'
    activeStep.value = 3
    window.setTimeout(() => {
      router.push('/')
    }, 800)
  } catch (error) {
    stopProgress()
    authStatus.value = 'error'
    errorMessage.value = 'GitHub 登录失败，请稍后重试。'
    console.error('GitHub login failed:', error)
  }
})

onBeforeUnmount(() => {
  stopProgress()
})
</script>

<template>
  <AuthCallbackStatus
    provider="GitHub"
    :active-step="activeStep"
    :status="authStatus"
    :title="statusTitle"
    :description="statusDescription"
    @back-login="backToLogin"
    @back-home="backToHome"
  />
</template>
