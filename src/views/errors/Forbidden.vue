<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-code">403</div>
      <div class="error-title">访问被拒绝</div>
      <div class="error-description">
        抱歉，您没有权限访问此页面。请检查您的登录状态或联系管理员。
      </div>
      <div class="error-actions">
        <el-button type="primary" @click="goHome" size="large">
          返回首页
        </el-button>
        <el-button @click="goBack" size="large">
          返回上一页
        </el-button>
      </div>
      <div class="error-illustration">
        <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gradient403" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="250" cy="250" r="200" fill="url(#gradient403)" opacity="0.1"/>
          <path d="M250 150 L250 350" stroke="url(#gradient403)" stroke-width="20" stroke-linecap="round"/>
          <path d="M150 250 L350 250" stroke="url(#gradient403)" stroke-width="20" stroke-linecap="round"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Forbidden',
  methods: {
    goHome () {
      this.$router.push('/')
    },
    goBack () {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped lang="scss">
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.error-content {
  text-align: center;
  max-width: 600px;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
  line-height: 1;
}

.error-title {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
}

.error-description {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
}

.error-illustration {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;

  svg {
    width: 100%;
    height: auto;
    animation: float 3s ease-in-out infinite;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@media screen and (max-width: 768px) {
  .error-code {
    font-size: 80px;
  }

  .error-title {
    font-size: 24px;
  }

  .error-description {
    font-size: 14px;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .error-illustration {
    max-width: 300px;
  }
}
</style>
