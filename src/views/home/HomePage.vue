<template>
  <div class="home-container">
    <div class="container home-layout">
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
  position: relative;
  @include tablet {
    padding: 0;
  }
}

.home-layout {
  display: flex;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.main-content {
  width: 70%;

  @include tablet {
    width: 100%;
  }
}

.sidebar {
  width: 30%;
  padding-left: 20px;
  padding-right: 100px;

  @include tablet {
    width: 100%;
    padding-left: 0;
    padding-right: 0;
    margin-top: 10px;
  }
}
</style>
