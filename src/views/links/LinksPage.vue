<template>
  <div class="links-body">
    <div style="display: flex;justify-content: center;padding-top: 20px">
      <el-card>
        <parse content="**友链申请规则**
- 博客内容应遵循合法、健康、积极向上的原则，禁止包含政治敏感、暴力、色情等内容。
- 博客内容应保持一定的原创性和更新频率，避免长期不更新。
- 站点SEO友好，设计风格应简洁、整洁、易于阅读，页面响应时间不宜过长
- 请添加本站友链
  - 站点名称：leorain
  - 描述：一个对技术和生活充满热爱的文艺型技术青年
  - 头像：https://www.leorain.cn/images/logo.png
  - 网址：https://www.leorain.cn
- 申请友链请[留言](/guestbook)
"></parse>
      </el-card>
    </div>
    <div style="display: flex;justify-content: center;padding-top: 10px">
      <div class="links-container">
        <div class="links-item-div" v-for="(link,index) in links" :key="index">
          <div style="position: relative" @click="openLink(link.link,link.id)">
            <el-card body-style="padding-left: 5px;" class="links-item">
              <div class="links-item-container">
                <div class="links-item-left">
                  <!--                  left bar-->
                  <el-avatar :src="link.image"></el-avatar>
                </div>
                <div class="links-item-right">
                  <!--                  right bar-->
                  <div>
                    <b>站点名称：</b>
                    {{ link.name }}
                  </div>
                  <div>
                    <b>
                      链接：
                    </b>
                    <el-link :title="link.link" type="primary">{{ maxString(link.link, 30) }}</el-link>
                  </div>
                  <div :title="link.description">
                    <b>
                      描述：
                    </b>
                    {{ maxString(link.description, 32) }}
                  </div>
                  <div>
                    <b>
                      加入时间：
                    </b>
                    {{ moment(link.created_at).format("YYYY-MM-DD") }}
                  </div>
                  <div>
                    <b>
                      点击次数：
                    </b>
                    {{ link.clicks }}
                  </div>
                  <div>
                    <b>
                      上次抓取时间：
                    </b>
                    <span v-if="link.last_visited">
                      {{ moment(link.last_visited).format("YYYY-MM-DD HH:mm:ss") }}
                    </span>
                    <span v-else>
                      未抓取
                    </span>
                  </div>
                  <div>
                    <b>
                      响应时间：
                    </b>
                    {{ link.response_time }}ms
                  </div>
                </div>
              </div>
            </el-card>
          </div>
          <div class="links-item-div-tips" @click="preview(link)">预览</div>
        </div>
      </div>
    </div>
    <el-dialog
      v-model="show_preview"
      class="preview-dialog"
      style="width: 70%;height: 60%"
      @cancel="show_preview = false"
    >
      <template v-slot:header>
        <div style="position: relative;display: flex;justify-content: center;width: 100%">
          <div title="新窗口打开" style="position: absolute;left: 10px;cursor: pointer"
               @click="openLink(preview_link.link,preview_link.id)">
            <el-link>新窗口打开<i class="fa fa-external-link-alt"></i></el-link>
          </div>
          <div style="position: absolute;top: 0">
            友链-
            <el-link :href="preview_link.link"><b>{{ preview_link.name }}</b></el-link>
            -预览
          </div>
          <div style="position: absolute;top: 0;right: 10px;cursor: pointer" @click="show_preview=false">
            <i class="fas fa-times-circle"></i>
          </div>
        </div>
      </template>
      <div style="width: 100%;height: 100%">
        <iframe style="width: 100%;height: 100%;border: none;border-radius: 5px" :src="preview_link.link"></iframe>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import moment from 'moment'
import parse from '@/components/MarkdownParse.vue'
import { linkApi } from '@/apis'
import { maxString } from '@/utils/helpers'

export default {
  tdk () {
    return {
      title: 'leorain-友情链接',
      description: 'leorain 友链'
    }
  },
  components: { parse },
  computed: {
    moment () {
      return moment
    }
  },
  data () {
    return {
      links: null,
      show_preview: false,
      preview_link: {}
    }
  },
  watch: {
    per_page () {
      this.load()
    }
  },
  mounted () {
    this.load()
  },
  methods: {
    maxString,
    preview (link) {
      // 迁移到 apis/link.js 统一管理
      linkApi.visitLink(link.id).catch(() => {})
      this.show_preview = true
      this.preview_link = link
    },
    load () {
      linkApi.getLinks().then((response) => {
        this.links = response
      })
    },
    openLink (url, id) {
      // 迁移到 apis/link.js 统一管理
      linkApi.visitLink(id).catch(() => {})
      window.open(url)
    }
  }
}
</script>
<style scoped lang="scss">
.links-body {
  background-image: url("https://images.leorain.cn/icons/assets/links-body-background.jpg");
  background-position: center;
  background-size: cover;
  padding-bottom: 10px;
  background-attachment: fixed;
}

.links-container {
  display: grid;
  gap: 10px;
  margin: 0 100px;
  padding-bottom: 10px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  // 响应式列数控制：最多5列，最少2列
  @media screen and (max-width: 1400px) {
    margin: 0 10px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media screen and (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @media screen and (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.links-item-div {
  position: relative;
  width: 100%;
  font-size: .85em;
  background-image: url("https://images.leorain.cn/icons/assets/links-item-background-image.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

.links-item-div-tips {
  position: absolute;
  top: 15%;
  right: 5%;
  width: 30px;
  height: 20px;
  text-align: center;
  cursor: pointer;
  background-color: #dfd1d1;
  border-radius: 3px;
  color: grey;
  z-index: 10;
}

.links-item-div-tips:hover {
  background-color: #a69e9e;
  color: white;
}

.links-item {
  background: transparent;
  cursor: pointer;
  box-shadow: none !important;
  border: none !important;
}

@media screen and (max-aspect-ratio: .9/1) {
  .links-item {
    width: 95%;
  }
  .links-container {
    width: 95%;
  }
}

.links-item-container {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
}

.links-item-left {
  margin: 5px;
}

.links-item-right {
  margin: 5px;
}

/* 让预览弹窗内的 iframe 充满 el-dialog 的 body */
:deep(.preview-dialog .el-dialog) {
  display: flex;
  flex-direction: column;
  /* 与行内 style 的高度一致，确保可用空间固定 */
  height: 60vh;
}

:deep(.preview-dialog .el-dialog__body) {
  flex: 1 1 auto;
  padding: 20px;
  overflow: hidden; /* 防止内部滚动条影响布局 */
  height: 100%;
}

::v-deep .modal-dialog {
  max-width: 70% !important;
  @media screen and (max-aspect-ratio: 1/1) {
    max-width: 95% !important;
  }
  height: 80% !important;
}

::v-deep .modal-content {
  height: 100% !important;
}

</style>
