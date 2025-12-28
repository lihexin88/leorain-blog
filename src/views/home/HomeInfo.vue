<template>
  <div class="info-container">
    <div class="info-div">
      <el-divider>
        关于我
      </el-divider>
      <el-card class="info-div-card">
        <div>
          <div class="info-avatar">
            <el-avatar :size="70" shape="circle" src="/images/logo.png"></el-avatar>
          </div>
          <div style="display: flex;justify-content: flex-start;padding-top: 10px;align-items: center;flex-wrap: wrap">
            <div class="info-personal">手机: <b>18337565527</b></div>
            <div class="info-personal">邮箱:
              <el-link type="primary" href="mailto:1678822783@qq.com">1678822783@qq.com</el-link>
            </div>
            <div class="info-personal">
              <el-tooltip>
                <template #content>
                  <el-image style="width: 250px" :src="wechat.qr_code"></el-image>
                </template>
                <el-image style="width: 35px" :src="wechat.logo" alt="微信二维码"></el-image>
              </el-tooltip>
            </div>
          </div>
          <div v-if="configStore.config?.about_me">
            <parse :content="configStore.config.about_me"></parse>
          </div>
        </div>
      </el-card>
    </div>
    <div class="info-div">
      <el-divider>关于本站</el-divider>
      <el-card class="info-div-card">
        <div>
          <!--          info-->
          <h3 class="info-title">
            <span class="info-title-span" v-for="(char,index) in configStore.title" :key="index">{{ char }}</span>
          </h3>
          <h5 style="display: flex;justify-content: center">{{ configStore.description }}</h5>
        </div>
        <div v-if="configStore.quotaInfo" style="padding-bottom: 20px">
          <!--        quota-->
          <quotes :quotes_base_url="configStore.quotaInfo"></quotes>
        </div>
        <div>
          <!--        info-->
          <el-row :gutter="21">
            <el-col :span="4">
              <div>
                <el-statistic
                  group-separator=","
                  :precision="0"
                  :value="systemInfo.article_count"
                  title="文章"
                ></el-statistic>
              </div>
            </el-col>
            <el-col :span="4">
              <div>
                <el-statistic
                  group-separator=","
                  :precision="0"
                  :value="systemInfo.comment_count"
                  title="评论"
                ></el-statistic>
              </div>
            </el-col>
            <el-col :span="4">
              <div>
                <el-statistic
                  group-separator=","
                  :precision="0"
                  :value="systemInfo.guestbook_count"
                  title="留言"
                ></el-statistic>
              </div>
            </el-col>
            <el-col :span="4">
              <div>
                <el-statistic
                  group-separator=","
                  :precision="0"
                  :value="systemInfo.game_count"
                  title="游戏"
                ></el-statistic>
              </div>
            </el-col>
            <el-col :span="5">
              <div>
                <el-statistic
                  group-separator=","
                  :precision="0"
                  title="访问"
                  :value="systemInfo.visitor_count"
                >
                </el-statistic>
              </div>
            </el-col>
          </el-row>
          <div style="padding-top: 10px">
            运行时间: {{ served_time }}
          </div>
          <div>
            主要技术: {{ systemInfo.technologies }}
          </div>
        </div>
      </el-card>
    </div>
    <div class="info-div" v-if="weather.show && false" style="height: 100px;overflow: hidden">
      <el-divider>天气</el-divider>
      <el-card class="info-div-card">
        <div
          style="width: 100%; background-image: linear-gradient(to right, aliceblue, lightblue, greenyellow, orange, orangered);">
          <div id="weather_color_cursor" style="border: 2px solid wheat; width: 1.66%; margin-left: 2.93333%;">
          </div>
        </div>
        <div
          style="background-image: linear-gradient(to right, rgb(255, 255, 255), rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.2),
            rgba(255, 255, 255, 0)), url(https://images.leorain.cn/weather/2021/07/28/gmA6Jw3Jqp1RTKkhb9lZsIsDSrzgpvDgnHbyMvnD.jpg?x-oss-process=style/weather-background-img);">
          当前时间：{{ weather.current_time }}
          <hr class="weather_hr">
          温度：{{ weather.temperature }}℃; 体感：{{ weather.temperature_feels_like }}℃ - 冷🥶
          <hr class="weather_hr">
          天气：{{ weather.weather }}
          <hr class="weather_hr">
          <div v-if="weather.wind_speed !== 0">
            风向：{{ weather.wind_direction }} °;速度：{{ weather.wind_speed }}m/s
          </div>
          <div v-else>
            风向： 无风
          </div>
          <hr class="weather_hr">
        </div>
      </el-card>
    </div>
    <div class="info-div">
      <el-divider>
        标签云
      </el-divider>
      <el-card class="info-div-card">
        <el-tag class="el-tag pointer-style" @click="go_tag(tag.tag.id)" :key="index" type="success"
                v-for="(tag,index) in tags?.data">{{
            tag.tag.tag
          }}
        </el-tag>
        <a class="fas fa-chevron-right info-category pointer-style" v-if="tags?.total > 15" @click="go_tags">
          更多 </a>
      </el-card>
    </div>
    <div class="info-div">
      <el-divider>
        文章分类
      </el-divider>
      <el-card class="info-div-card">
        <a class="fas info-category pointer-style" @click="go_category(category.name)"
           v-for="(category,index) in categories?.data" :key="index">
          {{ category.name }}
        </a>
        <a class="fas fa-chevron-right info-category pointer-style" v-if="categories?.total > 15"
           @click="go_categories">
          更多 </a>
      </el-card>
    </div>
    <div v-if="false" class="info-div">
      <el-divider>
        归档
      </el-divider>
    </div>
    <div class="info-div">
      <el-divider>
        git log
      </el-divider>
      <git-logs></git-logs>
    </div>
    <div class="info-div">
      <el-divider>访客地图</el-divider>
      <visitor-map></visitor-map>
    </div>
    <div class="info-div">
      <el-card class="travel-div">
        <div style="font-size: .85em">
          <i class="fa fa-satellite"></i>旅行者1号已旅行 {{ distance }} 千米,约 {{ light_year_count }} 光年
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import GitLogs from '@/components/GitLogs.vue'
import VisitorMap from '@/components/VisitorMap.vue'
import Quotes from '@/components/Quotes.vue'
import anime from 'animejs'
import { getHumanReadableDate } from '@/utils/helpers'
import { categoryApi, systemInfoApi, tagApi } from '@/apis'
import { useConfigStore } from '@/store/config'

export default {
  components: {
    VisitorMap,
    GitLogs,
    Quotes
  },
  setup () {
    const configStore = useConfigStore()
    return {
      configStore
    }
  },
  data () {
    return {
      weather: {
        current_time: moment().format('YYYY-MM-DD HH:mm'),
        show: false,
        temperature: 0,
        temperature_feels_like: 0,
        weather: '',
        wind_speed: 0,
        wind_direction: '',
        features: []
      },
      tags: [],
      categories: [],
      wechat: {
        logo: 'https://images.leorain.cn/files/wechat.png',
        qr_code: 'https://images.leorain.cn/files/wechar_qr_code.png'
      },
      archive: null,
      systemInfo: {
        served_at: 0,
        technologies: null,
        article_count: 0,
        comment_count: 0,
        guestbook_count: 0,
        game_count: 0,
        visitor_count: 0
      },
      served_time: 0,
      launch_timestamp: 242312160,
      distance: 0,
      light_year_count: 0
    }
  },
  methods: {
    go_categories () {
      window.location.href = '/category'
    },
    go_tags () {
      window.location.href = '/tagApi'
    },
    go_tag (tag) {
      window.location.href = '/tagApi/' + tag
    },
    go_category (category) {
      window.location.href = '/category/' + category
    },
    async get_config () {
      try {
        this.$nextTick(() => {
          const titleAnime = anime.timeline({
            easing: 'easeOutExpo',
            duration: 750,
            loop: true
          })
          titleAnime.add({
            targets: '.info-title-span',
            translateY: [0, -10, 0],
            color: [
              { value: '#f27d7d' },
              { value: '#88f288' },
              { value: '#9c9cff' },
              { value: '#41416e' },
              { value: '#000000' }
            ],
            delay: anime.stagger(100)
          })
        })
      } catch (error) {
        console.error('获取配置信息失败:', error)
      }
    },
    get_tag_cloud () {
      tagApi.getTags().then((response) => {
        this.tags = response
      })
    },
    get_category () {
      categoryApi.getCategories().then((response) => {
        this.categories = response
      })
    },
    get_archive () {
    },
    get_system_info () {
      systemInfoApi.getSystemInfo().then((response) => {
        this.systemInfo = response
        this.setTimeInterval()
      })
    },
    setTimeInterval () {
      setInterval(() => {
        if (this.systemInfo.served_at !== null) {
          // 时间
          // 计算差值
          this.served_time = getHumanReadableDate(moment.now().valueOf() - this.systemInfo.served_at)
        }
      }, 1000)
      let nowTimestamp = moment().unix()
      setInterval(() => {
        this.distance = (nowTimestamp - this.launch_timestamp) * 17.062
        this.light_year_count = this.distance / 9460730472580.8
        nowTimestamp++
      }, 1000)
    }
  },
  mounted () {
    // this.get_weather()
    this.get_tag_cloud()
    this.get_category()
    this.get_archive()
    this.get_config()
    this.get_system_info()
  }
}
</script>
<style scoped lang="scss">
.info-container {
  padding: 10px 15px 0 15px;
  height: 100%;
}

.el-tag {
  margin: 2px;
}

.el-tag:hover {
  scale: 1.05;
  background-color: #d7f6f3;
}

.info-category {
  margin: 2px;
}

.info-div {
  margin-top: 10px;

  .info-title {
    display: flex;
    justify-content: center
  }
  .info-div-card {
    background: linear-gradient(135deg, rgba(217, 214, 217, 0.55) 0%, rgba(173, 216, 230, 0.55) 50%, rgba(255, 182, 193, 0.55) 100%);
  }

  @keyframes infoAvatarRotate {
    0% {
      transform: rotate(0);
      scale: 1.10;
    }
    100% {
      transform: rotate(360deg);
      scale: 1.00;
    }
  }
  .info-avatar {
    display: flex;
    justify-content: center;
    align-items: center;
    :deep(span > img:hover) {
      animation: infoAvatarRotate 2s infinite;
    }
  }
}

.info-personal {
  display: flex;
  justify-content: center;
  margin: 3px;
}

.travel-div {
  background-image: url('https://images.leorain.cn/web_static/star-warp.svg');
  background-size: 100% 100%;
  background-position: center;
  color: white;
}
</style>
