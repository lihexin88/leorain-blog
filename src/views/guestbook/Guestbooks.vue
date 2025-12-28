<template>
  <div>
    <div class="guestbook-description-box">
      <div style="display: flex;justify-content: center">
        <!--        留言板介绍，包括友链申请规则-->
        <div class="guestbook-description-content">
          <el-card class="guestbook-description-card">
            <template v-slot:header>
              <div style="display: flex;justify-content: center">留言板说明</div>
            </template>
            <div>
              欢迎来到leorain的站点！🎉无论你是想为本站献上宝贵的建议，还是想申请友链，统统都可以在这里留言！我们特别期待你的声音。😊
              大胆地说出你的想法，让我们一起打造一个更棒的站点吧！如果你是来申请友链的朋友，请按照格式哦，保证我们能第一时间看到并回复你~💌
              留言开始吧，别害羞！🌟
            </div>
            <div>
              <parse content="**友链申请规则**
- 博客内容应遵循合法、健康、积极向上的原则，禁止包含政治敏感、暴力、色情等内容。
- 博客内容应保持一定的原创性和更新频率，避免长期不更新。
- 站点SEO友好，设计风格应简洁、整洁、易于阅读，页面响应时间不宜过长
- 请添加本站友链
  - 站点名称：leorain
  - 描述：一个对技术和生活充满热爱的文艺型技术青年
  - 头像：https://www.leorain.cn/images/logo.png
  - 网址：https://www.leorain.cn
*点击->留言->生成友链申请*
"></parse>
            </div>
            <div style="display: flex;justify-content: center">
              <el-button @click="switch_show_form">留言</el-button>
            </div>
          </el-card>
        </div>
      </div>
      <el-dialog :large="true" :show="isReplayActive" @cancel="activeId = null">
        <template v-slot:title>
          <div>留言板</div>
        </template>
        <guestbook-form @replay="setActiveId" :guestbook="null"></guestbook-form>
      </el-dialog>
    </div>
    <div style="margin: 10px;display: flex;justify-content: center">
      <!--    详细对话模块-->
      <div class="guestbook-area">
        <guestbook-tree ref="GuestbookTree" v-for="guestbook in guestbooks" @replay="handleReplay" :activeId="activeId"
                        :key="guestbook.id"
                        :guestbook="guestbook"/>
        <div style="display: flex;justify-content: center">
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

export default {
  components: { GuestbookTree, GuestbookForm, Parse },
  data () {
    return {
      activeId: null,
      show_link: false,
      total: null,
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
      if (this.activeId === this.nodeReplayId) {
        // 刷新页面
        this.load()
      }
      this.activeId = id
      this.$refs.GuestbookTree.show_guestbook()
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
      this.$http.get('/frontend/guestbooks', {
        params: {
          page: this.page,
          per_page: this.per_page
        }
      }).then((response) => {
        this.guestbooks = response.data.data
        this.total = response.data.total
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
      this.$http.get('/frontend/user/info').then((response) => {
        localStorage.setItem('user', JSON.stringify(response.data))
      }).catch(() => {
        localStorage.removeItem('user')
      })
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
  background-color: rgba(255, 255, 255, .2);
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

::v-deep .modal-header {
  padding: 5px !important;
}

@media screen and (max-aspect-ratio: 1/1) {
  ::v-deep .modal-body {
    padding: 5px;
  }
}

</style>
