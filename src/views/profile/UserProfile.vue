<template>
  <div class="user-profile-container">
    <h2>个人中心</h2>
    <div class="profile-content">
      <p>这里是个人中心页面的内容。</p>
      <!-- 可以在这里添加更多内容 -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserProfile',
  data() {
    return {
      // 数据属性
    };
  },
  methods: {
    // 方法
  }
};
</script>

<style scoped>
.user-profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-content {
  margin-top: 2rem;
}
</style>
