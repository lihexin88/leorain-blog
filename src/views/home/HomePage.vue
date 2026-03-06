<template>
  <div class="home-container">
    <div class="container" style="display: flex; flex-wrap: wrap;">
      <div class="main-content">
        <ArticleList />
      </div>
      <div class="sidebar">
        <HomeInfo />
      </div>
    </div>
  </div>
</template>

<script>
import ArticleList from './ArticleList.vue'
import HomeInfo from './HomeInfo.vue'

export default {
  name: 'HomePage',
  components: {
    ArticleList,
    HomeInfo
  }
}
</script>

<style scoped lang="scss">
.home-container {
  padding: 20px 0;
}

.main-content {
  width: 70%;

  @media screen and (max-width: 992px) {
    width: 100%;
  }
}

.sidebar {
  width: 30%;
  padding-left: 20px;
  padding-right: 100px;

  @media screen and (max-width: 992px) {
    width: 100%;
    padding-left: 0;
    margin-top: 20px;
  }
}
</style>
