<template>
  <div>
    <el-table :data="requestList" style="width: 100%;border-radius: 5px;overflow-y: auto"
    >
      <el-table-column
          prop="inc"
          label="序号"
          width="60"
      ></el-table-column>
      <el-table-column
          prop="locationName"
          label="位置"
      ></el-table-column>
      <el-table-column
          prop="date_time"
          label="时间"
          width="80"
      ></el-table-column>
    </el-table>
    <div style="display: flex;justify-content: center;padding-top: 20px">
      <el-pagination
          :page-size.sync="per_page"
          :page-sizes="[20, 32, 50]"
          :current-page.sync="page"
          @current-change="load"
          background
          :small="smallWindowSize"
          :layout="layout"
          :total="total"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
import {paginate_layouts} from "../../../configApi/helper";
import moment from "moment";

export default {
  components:{
    moment
  },
  methods: {
    load() {
      const url = process.env.DRAW_WS_HOST + "/request/log"
      this.$http.get(url, {
        params: {
          page: this.page,
          page_size: this.per_page
        }
      }).then((response) => {
        this.requestList = response.data.content
        this.requestList.forEach((requestLog) => {
          requestLog.date_time = moment(requestLog.requestTime).format("HH:mm:ss")
        })
        this.total = response.data.totalElements
      })
    }
  },
  data() {
    return {
      requestList: [],
      page: 1,
      per_page: 10,
      smallWindowSize: true,
      layout: 'prev, pager, next',
      total: null,
    }
  },
  mounted() {
    // 如果是竖屏，设置windowSize为6
    const paginateLayouts = paginate_layouts()
    this.load()
  }
}
</script>
<style scoped lang="scss">

</style>