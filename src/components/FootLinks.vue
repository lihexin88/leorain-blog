<script>
import ImageWithTimeout from './ImageWithTimeout.vue'

export default {
  components: {
    ImageWithTimeout
  },
  data () {
    return {
      links: [
        {
          tooltip: '或许很多年以后，我们写下的博客就像那只“春秋蝉”，将我们记忆带回以前的那个时候。',
          href: 'https://jiuchan.org',
          alt: '揪蝉',
          img: 'https://images.leorain.cn/links/4703257df55a194d1b66a9525533885d/2025/03/08/738956418727542784.png'
        },
        {
          tooltip: 'boke.lu · 博客收录展示平台~',
          href: 'https://boke.lu',
          alt: '博客录',
          img: 'https://boke.lu/博客录logo四版加宽版1-70k.png'
        },
        {
          tooltip: '尝试链接几乎所有的中文博客',
          href: 'https://boke.lu',
          alt: '中文博客列表导航项目',
          img: 'https://zhblogs.ohyee.cc'
        },
        {
          tooltip: '一个精致的，带社交元素的个人网站发布平台，博客收录网站',
          href: 'https://storeweb.cn',
          text: '个站商店'
        },
        {
          tooltip: 'BlogFinder - 发现优秀的个人博客',
          href: 'https://bf.zzxworld.com/',
          alt: 'BlogFinder',
          img: 'https://bf.zzxworld.com/images/logo-v2.png'
        },
        {
          tooltip: '博客说 · 个人博客站点聚合！',
          href: 'https://blogtalk.org',
          text: '博客说',
          textStyle: {
            backgroundImage: 'linear-gradient(to right, #14100f, #d55b5b, #4d14e6)',
            webkitBackgroundClip: 'text',
            webkitTextFillColor: 'transparent'
          }
        },
        {
          tooltip: '致敬还在写博客的我们',
          href: 'https://blogscn.fun',
          alt: '笔墨迹',
          img: 'https://photo.xiangming.site/img/blogscn.png'
        },
        {
          tooltip: '一个人的寂寞，一群人的狂欢。',
          href: 'https://www.foreverblog.cn',
          text: '十年之约'
        },
        {
          tooltipHtml:
            "致敬每一个坚持写博客的人。Salute to every blogger.在茫茫比特流之中，能遇见你，真是幸运！It's really lucky to meet you in the vast Bitstream!",
          href: 'https://ourblo.gs',
          alt: 'OurBlogs',
          img: 'https://ourblo.gs/usr/uploads/2024/02/654341101.jpg'
        },
        {
          tooltip: '异次元之旅-跃迁-我们一起去萌站成员的星球旅行吧！',
          href: 'https://travel.moe/go.html',
          alt: '异次元之旅',
          img: 'https://travel.moe/images/logo/default-dark.png'
        },
        {
          tooltip: '开往-友链接力',
          href: 'https://www.travellings.cn/go.html',
          alt: '开往-友链接力',
          img: 'https://www.travellings.cn/assets/logo.gif'
        },
        {
          tooltip: '空间穿梭-随机访问BlogsClub成员博客',
          href: 'https://www.blogsclub.org/go',
          alt: '空间穿梭',
          img: 'https://www.blogsclub.org/images/shuttle_1.png'
        },
        {
          tooltip: '茶备案 - 展示您独一无二的身份',
          href: 'https://icp.redcha.cn/beian/ICP-2025080067.html',
          text: '茶ICP备2025080067号'
        },
        {
          tooltip: '萌国ICP备案',
          href: 'https://icp.gov.moe/?keyword=20255585',
          text: '萌ICP备20255585号'
        },
        {
          tooltip: '一个开源、高度可定制化的虚拟ICP备案系统，为爱好者提供一个可爱的社区互动平台。',
          href: 'https://icp.6uu.us/query.php?icp_number=%E5%85%83-16016',
          text: '元ICP备16016号'
        }
      ]
    }
  }
}
</script>

<template>
  <div class="footer-org">
    <el-tooltip
      v-for="(link, index) in links"
      :key="index"
      class="footer-links"
      :content="link.tooltip || link.tooltipHtml"
    >
      <el-link target="_blank" underline="hover" :href="link.href" :style="link.textStyle">
        <image-with-timeout v-if="link.img" class="footer-link-image" :error_alt="link.alt" :img_src="link.img" />
        <template v-else>{{ link.text }}</template>
      </el-link>
    </el-tooltip>
  </div>
</template>

<style scoped lang="scss">
.footer-org {
  gap: 5px;
}

.footer-links {
  display: flex;
  align-items: center;
}
</style>
