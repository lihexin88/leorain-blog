<template>
  <div>
    <div>
      <el-card class="info-div-card">
        <div class="git-logs-box">
          <div class="git-logs-item" v-for="item in git_logs_first_page" :key="item.id">
            {{ item.comment }}
          </div>
        </div>
        <div v-if="total > 20" style="display: flex;justify-content: flex-end;padding-top: 10px;align-items: center">
          <a @click="show_history_list" class="fas info-category pointer-style">查看更多</a>
        </div>
      </el-card>
    </div>
    <div>
      <!-- Element Plus 兼容：使用 v-model 绑定可见性，使用 header 槽替代已废弃的 title 槽 -->
      <el-dialog v-model="show" width="60%" @close="show = false">
        <template #header>
          <span>git提交日志</span>
        </template>
        <div style="border-radius: 5px;">
          <el-table :data="git_logs" style="width: 100%;border-radius: 5px;height: 600px;overflow-y: auto"
                    v-infinite-scroll="loadMore" :infinite-scroll-disabled="loading" :infinite-scroll-distance="50">
            <el-table-column prop="comment" label="提交记录"></el-table-column>
          </el-table>
        </div>
        <template #footer>
          <div style="text-align: center;background-color: #efefef;padding: 5px" v-if="page === last_page">到底啦 ~.~</div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import moment from 'moment/moment'
import debounce from 'lodash/debounce'
import { gitLogApi } from '@/apis'

export default {
  components: {},
  data () {
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
    show_history_list () {
      this.show = true
      this.page = 1
      this.get_git_log()
    },
    loadMore: debounce(function () {
      this.page++
      this.get_git_log()
    }, 500),
    get_git_log () {
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
    get_git_log_first_page () {
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
  mounted () {
    this.get_git_log_first_page()
  }
}
</script>
<style scoped lang="scss">

.git-logs-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
  border-bottom: 1px solid #ccc;
}

// 对话框中的表格样式
:deep(.el-dialog) {
  .el-table {
    background: linear-gradient(135deg, rgba(217, 214, 217, 0.35) 0%, rgba(173, 216, 230, 0.35) 50%, rgba(255, 182, 193, 0.35) 100%);
  }

  .el-table th.el-table__cell {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .el-table td.el-table__cell {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
