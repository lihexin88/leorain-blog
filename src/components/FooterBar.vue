<script>
import ImageWithTimeout from './ImageWithTimeout.vue'

export default {
  components: {
    ImageWithTimeout
  }
}
</script>

<template>
  <div class="copy-right text-center footer-padding">
    <div class="ali-report-wrap">
      <span class="footer-link-text-color" style="pointer-events: none;">
        © 2021. Powered by leorain
      </span>
      ·
      <el-link class="footer-link-text-color" href="https://beian.miit.gov.cn/" target="_blank">
        浙ICP备19033456号-2
      </el-link>
    </div>
    <div class="ali-report-wrap">
      <div style="display: flex;justify-content: center">
        <div class="footer-org">
          <el-tooltip class="footer-links" content="或许很多年以后，我们写下的博客就像那只“春秋蝉”，将我们记忆带回以前的那个时候。">
            <el-link target="_blank" underline="hover" href="https://jiuchan.org">
              <image-with-timeout class="footer-link-image" error_alt="揪蝉"
                                  img_src="https://images.leorain.cn/links/4703257df55a194d1b66a9525533885d/2025/03/08/738956418727542784.png">
              </image-with-timeout>
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" content="boke.lu · 博客收录展示平台~">
            <el-link target="_blank" underline="hover" href="https://boke.lu">
              <image-with-timeout class="footer-link-image" error_alt="博客录"
                                  img_src="https://boke.lu/博客录logo四版加宽版1-70k.png">
                <template v-slot:error>
                  <div class="image-slot">
                  </div>
                </template>
              </image-with-timeout>
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" content="尝试链接几乎所有的中文博客">
            <el-link target="_blank" underline="hover" href="https://boke.lu">
              <image-with-timeout class="footer-link-image" error_alt="中文博客列表导航项目"
                                  img_src="https://zhblogs.ohyee.cc">
              </image-with-timeout>
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" content="一个精致的，带社交元素的个人网站发布平台，博客收录网站">
            <el-link target="_blank" underline="hover" href="https://storeweb.cn">
              个站商店
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" content="BlogFinder - 发现优秀的个人博客">
            <el-link target="_blank" underline="hover" href="https://bf.zzxworld.com/">
              <image-with-timeout class="footer-link-image" error_alt="BlogFinder"
                                  img_src="https://bf.zzxworld.com/images/logo-v2.png">
              </image-with-timeout>
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" content="博客说 · 个人博客站点聚合！">
            <el-link
                style="background-image: linear-gradient(to right, #14100f, #d55b5b, #4d14e6);
                       -webkit-background-clip: text;-webkit-text-fill-color: transparent;"
                target="_blank" underline="hover" href="https://blogtalk.org">
              博客说
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" content="致敬还在写博客的我们">
            <el-link target="_blank" underline="hover" href="https://blogscn.fun">
              <image-with-timeout class="footer-link-image" error_alt="笔墨迹"
                                  img_src="https://photo.xiangming.site/img/blogscn.png">
              </image-with-timeout>
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" content="一个人的寂寞，一群人的狂欢。">
            <el-link target="_blank" underline="hover" href="https://www.foreverblog.cn">
              十年之约
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" >
            <template #content>
              致敬每一个坚持写博客的人。Salute to every blogger.在茫茫比特流之中，能遇见你，真是幸运！It's really lucky to meet you in the vast Bitstream!
            </template>
            <el-link target="_blank" underline="hover" href="https://ourblo.gs">
              <image-with-timeout class="footer-link-image" error_alt="OurBlogs"
                                  img_src="https://ourblo.gs/usr/uploads/2024/02/654341101.jpg">
              </image-with-timeout>
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" content="异次元之旅-跃迁-我们一起去萌站成员的星球旅行吧！">
            <el-link target="_blank" underline="hover" href="https://travel.moe/go.html">
              <image-with-timeout class="footer-link-image" error_alt="异次元之旅"
                                  img_src="https://travel.moe/images/logo/default-dark.png">
              </image-with-timeout>
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" content="开往-友链接力">
            <el-link target="_blank" underline="hover" href="https://www.travellings.cn/go.html">
              <image-with-timeout class="footer-link-image" error_alt="开往-友链接力"
                                  img_src="https://www.travellings.cn/assets/logo.gif">
              </image-with-timeout>
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" content="空间穿梭-随机访问BlogsClub成员博客">
            <el-link target="_blank" underline="hover" href="https://www.blogsclub.org/go">
              <image-with-timeout class="footer-link-image" error_alt="空间穿梭"
                                  img_src="https://www.blogsclub.org/images/shuttle_1.png">
              </image-with-timeout>
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" content="茶备案 - 展示您独一无二的身份">
            <el-link target="_blank" underline="hover" href="https://icp.redcha.cn/beian/ICP-2025080067.html">
              茶ICP备2025080067号
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" content="萌国ICP备案">
            <el-link target="_blank" underline="hover" href="https://icp.gov.moe/?keyword=20255585">
              萌ICP备20255585号
            </el-link>
          </el-tooltip>
          <el-tooltip class="footer-links" content="一个开源、高度可定制化的虚拟ICP备案系统，为爱好者提供一个可爱的社区互动平台。">
            <el-link target="_blank" underline="hover" href="https://icp.6uu.us/query.php?icp_number=%E5%85%83-16016">
              元ICP备16016号
            </el-link>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.footer-links{
  display: flex;
  align-items: center;
}
</style>
