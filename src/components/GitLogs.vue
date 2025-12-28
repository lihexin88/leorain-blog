<template>
  <div>
    <div>
      <el-card class="info-div-card">
        <div style="border-radius: 5px">
          <el-table :data="git_logs_first_page" row-class-name="git-logs-table" header-row-class-name="git-logs-table">
            <el-table-column prop="comment" label="提交记录"></el-table-column>
            <el-table-column prop="hots" label="热度" :width="100"></el-table-column>
          </el-table>
          <div v-if="total > 20" style="display: flex;justify-content: flex-end;padding-top: 10px;align-items: center">
            <a @click="show_history_list" class="fas info-category pointer-style">查看更多</a>
          </div>
        </div>
      </el-card>
    </div>
    <div>
      <el-dialog :show="show" large @cancel="show = false">
        <template slot="title">git提交日志</template>
        <div style="border-radius: 5px;">
          <el-table :data="git_logs" style="width: 100%;border-radius: 5px;height: 600px;overflow-y: auto"
                    v-infinite-scroll="loadMore" :v-infinite-scroll-disabled="!loading" infinite-scroll-distance="50">
            <el-table-column prop="comment" label="提交记录"></el-table-column>
          </el-table>
        </div>
        <div style="text-align: center;background-color: #efefef;padding: 5px" v-if="page === this.last_page">到底啦 ~.~
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import moment from 'moment/moment'
import debounce from 'lodash/debounce'
import {gitLogApi} from "@/apis";

export default {
  components: {},
  data() {
    return {
      page: 1,
      git_logs: [],
      show: false,
      git_logs_first_page: [],
      total: null,
      loading: false,
      last_page: 0
    }
  },
  methods: {
    show_history_list() {
      this.show = true
      this.page = 1
      this.get_git_log()
    },
    loadMore: debounce(function () {
      this.page++
      this.get_git_log()
    }, 500),
    get_git_log() {
      this.loading = true
      gitLogApi.getGitLogs({
          page: this.page
      }).then((response) => {
        console.log(response)
        if (this.page === 1) {
          this.git_logs = response.data
        } else {
          response.data.forEach((item) => {
            this.git_logs.push(item)
          })
        }
        this.git_logs.forEach((item) => {
          item.datetime = moment(item.datetime).format('YYYY-MM-DD HH:mm')
        })
      })
      this.loading = false
    },
    get_git_log_first_page() {
      gitLogApi.getGitLogs(
          {
            page: 1,
            per_page: 10
          }).then((response) => {
        this.git_logs_first_page = response.data
        this.total = response.total
        this.last_page = response.last_page
        this.git_logs_first_page.forEach((item) => {
          item.datetime = moment(item.datetime).format('YYYY-MM-DD HH:mm')
        })
      })
    }
  },
  mounted() {
    this.get_git_log_first_page()
  }
}
</script>
<style scoped lang="scss">
.info-div-card {
  background: transparent;

  :deep(.git-logs-table) {
    width: 100%;
    border-radius: 5px;
    background: linear-gradient(135deg, rgba(217, 214, 217, 0.55) 0%, rgba(173, 216, 230, 0.55) 50%, rgba(255, 182, 193, 0.55) 100%);
  }

  :deep(.el-table th.el-table__cell) {
    background-color: transparent;
  }
}
</style>
