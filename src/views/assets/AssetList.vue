<template>
  <div class="asset-container">
    <div class="asset-search-container">
      <div class="asset-search">
        <el-input autofocus clearable :prefix-icon="Search" placeholder="输入文本进行搜索，例如：睡觉的猫咪"
                  @change="load(true)" v-model="keywords"></el-input>
        <el-button @click="load(true)">提交</el-button>
      </div>
    </div>
    <div style="display: flex;justify-content: center">
      <div class="list asset-item-container" id="container-left" style="padding-top: 15px">
        <div v-for="(asset,index) in assets" :key="index" class="asset-items-box">
          <div style="display: flex;justify-content: center;align-items: center;padding-top: 3px">
            <el-image class="asset-items-image" fit="contain" preview-teleport
                      :preview-src-list="[asset.display_url]"
                      :src="asset.display_url + '?x-oss-process=style/gallery_thumbnail'"></el-image>
          </div>
          <div v-if="asset.score" class="asset-info">
            <span>余弦距离：{{ asset.score }}</span>
          </div>
          <div class="asset-info">
            <span :title="asset.name">{{ maxString(asset.name, 18) }}</span>
          </div>
          <div class="asset-info">
            <i class="fa fa-clock">{{ moment(asset.created_at).format("Y-M-D H:m") }}</i>
          </div>
        </div>
      </div>
    </div>
    <br>
    <div style="display: flex;justify-content: center">
      <el-pagination
          v-model:page-size="per_page"
          :page-sizes="[16, 32, 40, 48]"
          v-model:current-page="page"
          @size-change="load(true)"
          @current-change="load(false)"
          background
          :small="smallWindowSize"
          :layout="layout"
          :total="total"
      ></el-pagination>
    </div>
  </div>
</template>

<script>

import { getUrlParams, maxString, paginateLayouts, syncUrlPaginate } from '@/utils/helpers'
import moment from 'moment'
import assetsApi from '@/apis/assets'
import { Search } from '@element-plus/icons-vue'

export default {
  setup () {
    return {
      Search
    }
  },
  computed: {
    moment () {
      return moment
    }
  },
  mounted () {
    const paginateStyle = paginateLayouts()
    this.smallWindowSize = paginateStyle.smallWindowSize
    this.layout = paginateStyle.layout
    const urlParams = getUrlParams()
    if (urlParams.page) {
      this.page = parseInt(urlParams.page) || 1
    }
    if (urlParams.per_page) {
      this.per_page = parseInt(urlParams.per_page) || 32
    }
    if (urlParams.keywords) {
      this.keywords = urlParams.keywords
    }
    this.load()
  },
  watch: {
    per_page () {
      this.load(true)
    },
    keywords (val) {
      if (!val) {
        this.load(true)
      }
    }
  },
  methods: {
    maxString,
    load (resetPage = false) {
      if (resetPage) {
        this.page = 1
      }
      assetsApi.getAssets({
        page: this.page,
        per_page: this.per_page,
        keywords: this.keywords
      }).then((response) => {
        this.assets = response.data
        this.total = response.total
        let urlParams = {
          page: this.page,
          per_page: this.per_page,
          keywords: this.keywords
        }
        syncUrlPaginate(urlParams)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }
  },
  data () {
    return {
      total: null,
      page: 1,
      per_page: 32,
      keywords: null,
      assets: null,
      smallWindowSize: false,
      layout: ''
    }
  }
}
</script>
<style scoped lang="scss">
.asset-items-box {
  width: 100%;
  max-height: 300px;
  padding: 8px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, .9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform .2s ease, box-shadow .2s ease;
}

.asset-items-image {
  width: 100%;
  height: 220px;
  object-fit: contain;
  border-radius: 6px;
  background: #f7f9fb;
}

.asset-items-box:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(52, 152, 219, 0.4),
  0 0 30px rgba(52, 152, 219, 0.22),
  0 0 40px rgba(52, 152, 219, 0.06);
}

.asset-item-container {
  width: 95%;
  display: grid;
  grid-template-columns: repeat(auto-fill, 242px);
  justify-content: center;
  gap: 16px;
  margin: 10px;
  padding-top: 15px;
}

.asset-info {
  margin-top: 6px;
  font-size: .85em;
  color: #606266;
  text-align: center;
}

.asset-container {
  background-color: rgba(231, 239, 241, 0.38);
  padding-bottom: 10px;
  padding-top: 20px;
}

.asset-search-container {
  display: flex;
  justify-content: center;
}

.asset-search {
  width: 30%;
  display: flex;
}

@media screen and (max-aspect-ratio: 1/1) {
  .asset-search {
    width: 95%;
  }
}

@media (max-width: 768px) {
  .asset-item-container {
    width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .asset-items-image {
    height: 180px;
  }
}
</style>
