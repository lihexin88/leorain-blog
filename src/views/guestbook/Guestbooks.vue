<template>
  <div>
    <div class="guestbook-description-box">
      <div style="display: flex;justify-content: center">
        <div class="guestbook-description-content">
          <el-card class="guestbook-description-card">
            <template v-slot:header>
              <div class="description-header">🌟 留言板说明</div>
            </template>
            <div class="description-text">
              欢迎来到leorain的站点！🎉无论你是想为本站献上宝贵的建议，还是想申请友链，统统都可以在这里留言！我们特别期待你的声音。😊
              大胆地说出你的想法，让我们一起打造一个更棒的站点吧！如果你是来申请友链的朋友，请按照格式哦，保证我们能第一时间看到并回复你~💌
              留言开始吧，别害羞！🌟
            </div>
            <div>
              <parse class="links-description" content="**友链申请规则**
- 博客内容应遵循合法、健康、积极向上的原则，禁止包含政治敏感、暴力、色情等内容。
- 博客内容应保持一定的原创性和更新频率，避免长期不更新。
- 站点SEO友好，设计风格应简洁、整洁、易于阅读，页面响应时间不宜过长
- 请添加本站友链
  - 站点名称：leorain
  - 描述：一个对技术和生活充满热爱的文艺型技术青年
  - 头像：https://www.leorain.cn/images/logo.png
  - 网址：https://www.leorain.cn
  - 订阅：https://frontend.leorain.cn/rss
*点击->留言->生成友链申请*
"></parse>
            </div>
            <div style="display: flex;justify-content: center;margin-top: 8px;">
              <el-button type="primary" round @click="switch_show_form">✏️ 留言</el-button>
            </div>
          </el-card>
        </div>
      </div>
      <el-dialog :large="true" v-model="isReplayActive" @cancel="activeId = null">
        <template v-slot:header>
          <div>留言板</div>
        </template>
        <guestbook-form @replay="setActiveId" @created="handleCreated" :guestbook="null"></guestbook-form>
      </el-dialog>
    </div>
    <div style="margin: 10px;display: flex;justify-content: center">
      <div class="guestbook-area">
        <transition-group name="gb-list" tag="div">
          <guestbook-tree v-for="guestbook in guestbooks" @replay="handleReplay" @deleted="handleDeleted"
                          :activeId="activeId" :key="guestbook.id" :guestbook="guestbook"/>
        </transition-group>
        <div class="pagination-area">
          <el-pagination
              v-model:page-size="per_page"
              :page-sizes="[10, 20, 30, 50]"
              v-model:current-page="page"
              @current-change="load"
              background
              :small="smallWindowSize"
              :layout="layout"
              :total="total"
          ></el-pagination>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import GuestbookForm from './GuestbookForm.vue'
import Parse from '@/components/MarkdownParse.vue'
import GuestbookTree from './GuestbookTree.vue'
import { guestbookApi } from '@/apis'

export default {
  components: { GuestbookTree, GuestbookForm, Parse },
  data () {
    return {
      activeId: null,
      show_link: false,
      total: 0,
      per_page: 10,
      page: 1,
      smallWindowSize: false,
      layout: 'prev, pager, next, sizes, total',
      show_form: false,
      nodeReplayId: 'replay_' + Math.random().toString(36).substr(2),
      guestbooks: []
    }
  },
  methods: {
    setActiveId (id) {
      this.activeId = id
    },
    handleCreated () {
      this.page = 1
      this.load()
      this.activeId = null
    },
    handleDeleted (id) {
      this.guestbooks = this.guestbooks.filter(g => g.id !== id)
      this.total = Math.max(0, this.total - 1)
    },
    switch_show_form () {
      this.activeId = this.activeId === this.nodeReplayId ? null : this.nodeReplayId
    },
    handleReplay (id) {
      if (this.activeId === id) {
        this.activeId = null
        return
      }
      this.activeId = id
    },
    load () {
      // 加载数据
      guestbookApi.getGuestbooks({
        page: this.page,
        per_page: this.per_page
      }).then((response) => {
        this.guestbooks = response.data
        this.total = response.total
      })
    }
  },
  mounted () {
    const params = new URLSearchParams(window.location.search)
    const page = parseInt(params.get('page'))
    if (page) {
      this.page = page
    } else {
      this.page = 1
    }
    // 如果是竖屏，设置windowSize为6
    if (window.matchMedia('(orientation: portrait)').matches) {
      this.smallWindowSize = true
      this.layout = 'prev, pager, next'
    }
    // 查询当前页面
    this.load()
    if (!localStorage.getItem('user')) {
      // 尝试获取用户信息，并存储在localstorage中
      // this.$http.get('/frontend/user/info').then((response) => {
      //   localStorage.setItem('user', JSON.stringify(response.data))
      // }).catch(() => {
      //   localStorage.removeItem('user')
      // })
    }
    this.activeId = 'no_one_active'
  },
  computed: {
    isReplayActive () {
      return this.activeId === this.nodeReplayId
    }
  }
}
</script>
<style scoped lang="scss">
.guestbook-area {
  width: 60%;
  @media screen and (max-aspect-ratio: .9/1) {
    width: 95%;
  }
}

::v-deep .el-card {
  border: 0;
}

.guestbook-description-box {
  padding-top: 15px;
}

.guestbook-description-card {
  width: 100%;
  background-color: rgba(255, 255, 255, .18);
  backdrop-filter: blur(6px);
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.description-header {
  display: flex;
  justify-content: center;
  font-size: 1.1em;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.description-text {
  line-height: 1.7;
  opacity: 0.9;
  margin-bottom: 6px;
}

.guestbook-create-new {
  display: flex;
  width: 30%;
  justify-content: center;
  padding: 5px;
  @media screen and (max-aspect-ratio: .9/1) {
    width: 94%;
  }
}

.guestbook-description-content {
  width: 40%;
  background-color: rgba(255, 255, 255, 0.15);
  @media screen and (max-aspect-ratio: .9/1) {
    width: 95%;
  }
  display: flex;
  justify-content: center;
  position: relative;
  background-size: cover;
  border-radius: 12px;
  overflow: hidden;
}

.guestbook-description-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  filter: blur(2px);
  background-image: url("https://images.leorain.cn/icons/assets/guestbook-background-image.jpg");
  z-index: -1;
}

.pagination-area {
  display: flex;
  justify-content: center;
  padding: 16px 0 8px;
}

/* 顶层列表进出动效 */
.gb-list-enter-active {
  animation: gb-list-in 0.4s ease;
}

.gb-list-leave-active {
  animation: gb-list-out 0.3s ease forwards;
}

.gb-list-move {
  transition: transform 0.35s ease;
}

@keyframes gb-list-in {
  from {
    opacity: 0;
    transform: translateY(-14px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes gb-list-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-14px) scale(0.98);
  }
}

::v-deep .modal-header {
  padding: 5px !important;
}

@media screen and (max-aspect-ratio: 1/1) {
  ::v-deep .modal-body {
    padding: 5px;
  }
}
.links-description{
  :deep(.markdown){
    background: transparent;
  }
}
</style>
