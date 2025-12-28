<script>
import Modal from "../../particals/Modal.vue";
import moment from "moment";
import {max_string, paginate_layouts} from "../../../../configApi/helper";

export default {
  components: {Modal},
  data() {
    return {
      clipboardData: [],
      search_text: "",
      page: 1,
      page_size: 10,
      total: 0,
      show_popup: false,
      smallWindowSize: false,
      layout: '',
      currentClipboard: {
        id: null,
        content: null,
        star: null,
        type: 1,
      },
      loading: false,
    }
  },
  props: {
    data_source_type: {
      type: String,
      default: "public"
    },
  },
  methods: {
    max_string,
    moment,
    removeClipboard() {
      this.currentClipboard.content = null
      this.currentClipboard.type = 1
      this.currentClipboard.star = null
      this.currentClipboard.id = null
    },
    async handleCopy(row) {
      const content = row.content
      if (row.type === 2) {
        await this.copyImageToClipboard(content)
      } else {
        navigator.clipboard.writeText(content).then(() => {
          this.$message({
            message: "已复制",
            type: "success"
          });
        }).catch(err => {
          this.$message({
            message: "复制失败",
            type: "error"
          });
        })
      }
    },
    getList() {
      this.loading = true
      let listUrl = ''
      switch (this.data_source_type) {
        case 'public':
          listUrl = '/frontend/clipboard'
          break
        case 'private':
          listUrl = '/frontend/clipboard-authorized'
          break
      }
      this.$http.get(listUrl, {
        params: {
          page: this.page,
          page_size: this.page_size,
          search_text: this.search_text,
          data_source_type: this.getDateSourceInfo().id
        }
      }).then((response) => {
        this.clipboardData = []
        this.clipboardData = response.data.data
        this.clipboardData.forEach(item => {
          item.created_at = moment(item.created_at).format('MM-DD HH:mm')
        })
        this.total = response.data.meta.pagination.total
        this.page = response.data.meta.pagination.current_page
      }).catch(err => {
        this.$message({
          type: 'error',
          message: err.response.message,
        })
      }).finally(() => {
        this.loading = false
      })
    },
    async copyImageToClipboard(base64Data) {
      try {
        // 将 Base64 转为 Blob
        const blob = await fetch(base64Data).then(res => res.blob());

        // 创建 ClipboardItem 对象
        const clipboardItem = new ClipboardItem({
          [blob.type]: blob
        });

        // 写入剪切板
        await navigator.clipboard.write([clipboardItem]);
        console.log('图片已复制到剪切板！');
      } catch (err) {
        console.error('复制失败:', err);
      }
    },
    submit() {
      let url = ''
      switch (this.data_source_type) {
        case 'public':
          url = '/frontend/clipboard'
          break
        case 'private':
          url = '/frontend/clipboard-authorized'
          break
      }
      let method = 'post'
      let postData = {
        data_source_type: this.getDateSourceInfo().id
      }
      if (this.currentClipboard.id) {
        url += '/' + this.currentClipboard.id
        method = 'patch'
      } else {
        postData.type = this.currentClipboard.type
      }
      if (this.currentClipboard.content !== null) {
        if (this.currentClipboard.content.length > 10485760) {
          this.$message({
            message: "图片太大",
            type: "error"
          })
          return
        }
        postData.content = this.currentClipboard.content
      }
      if (this.currentClipboard.star !== null) {
        postData.star = this.currentClipboard.star
      }
      this.$http[method](url, postData).then((response) => {
        this.$message({
          type: 'success',
          message: 'success',
        })
        this.show_popup = false
        this.getList()
      }).catch(err => {
        this.$message({
          type: 'error',
          message: err.message,
        })
      })
    },
    async handlePaste(event) {
      event.preventDefault()
      const clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData) return;
      const firstItem = clipboardData.items[0]
      if (firstItem.type.startsWith('image/')) {
        this.currentClipboard.type = 2
        const imageContent = firstItem.getAsFile()
        this.fileToBase64(imageContent)
      } else if (firstItem.type.startsWith('text/')) {
        this.currentClipboard.type = 1
        this.currentClipboard.content = clipboardData.getData("text/plain")
      }
    },
    // 将File对象转为Base64
    fileToBase64(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentClipboard.content = e.target.result; // 结果类似 "data:image/png;base64,iVBORw0KGgo..."
      };
      reader.readAsDataURL(file); // 关键方法
    },
    getDateSourceInfo() {
      switch (this.data_source_type) {
        case 'public':
          return {
            id: 1,
            name: "公共"
          }
        case 'private':
          return {
            id: 2,
            name: "个人"
          }
      }
    },
    deleteClipboard(row) {
      this.$confirm("确认删除吗？").then((a) => {
        let url = ''
        switch (this.data_source_type) {
          case 'public':
            url = '/frontend/clipboard/' + row.id
            break
          case 'private':
            url = '/frontend/clipboard-authorized/' + row.id
            break
        }
        this.$http.delete(url).then(res => {
          this.$message({
            type: 'success',
            message: '删除成功'
          })
        }).finally(() => {
          this.getList()
        })
      }).catch(() => {

      })
    },
    showUpdate(row) {
      this.show_popup = true
      this.currentClipboard.id = row.id
      this.currentClipboard.content = row.content
    },
    star(row) {
      this.currentClipboard.id = row.id
      this.currentClipboard.star = !row.star
      console.log(this.currentClipboard)
      this.submit()
    },
    showCreate() {
      this.show_popup = true
      this.currentClipboard.id = null
      this.currentClipboard.content = null
    },
    truncateLines(str, linesCount) {
      const regex = /\r\n|\n|\r/g;
      let count = 0;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(str)) !== null) {
        count++;
        if (count === linesCount) {
          lastIndex = match.index + match[0].length; // 截断到第五个换行符末尾
          break;
        }
      }

      if (count < linesCount) return str; // 行数不足直接返回

      const truncated = str.substring(0, lastIndex);
      const remaining = str.substring(lastIndex);
      return truncated + (remaining ? '...' : ''); // 仅当有剩余内容时加 ...
    },
    countLineBreaks(str) {
      const matches = str.match(/\r\n|\n|\r/g);
      return matches ? matches.length : 0;
    }
  },
  mounted() {
    const paginateStyle = paginate_layouts()
    this.smallWindowSize = paginateStyle.smallWindowSize
    this.layout = paginateStyle.layout
    this.getList()
  },
  watch: {
    page_size() {
      this.getList()
    },
    'currentClipboard.content': function (newValue) {
      if (newValue == null && this.currentClipboard.type !== 1) {
        this.currentClipboard.type = 1
        this.currentClipboard.content = newValue
      }
    }
  }
}
</script>

<template>
  <div>
    <div class="clipboard-table-search-input">
      <!--      输入框-->
      <el-input id="search_text_input" clearable v-model="search_text"></el-input>
      <el-button @click="getList">搜索</el-button>
      <el-button @click="showCreate">新增</el-button>
    </div>
    <modal :show="show_popup"
           show-footer
           large
           force
           @confirm="submit"
           @cancel="show_popup = false"
           :title="'新增-'+this.getDateSourceInfo().name"
    >
      <div>
        <div v-if="currentClipboard.type === 1">
          <el-input
              type="textarea"
              :autosize="{ minRows: 2}"
              placeholder="请输入内容，或者直接粘贴。支持文字图片"
              clearable
              @paste.native="handlePaste"
              v-model="currentClipboard.content"></el-input>
        </div>
        <div v-if="currentClipboard.type === 2" style="display: flex;justify-content: start;flex-wrap: nowrap">
          <div style="display: flex">
            <el-image :src="currentClipboard.content" v-if="currentClipboard.content"></el-image>
          </div>
          <div style="display: flex;align-items: start;justify-content: center;padding-left: 10px">
            <i @click="removeClipboard" class="el-icon-circle-close" style="cursor: pointer"></i>
          </div>
        </div>
      </div>
    </modal>
    <!--      表格-->
    <div>
      <el-table
          :data="clipboardData"
          v-loading="loading"
          row-key="id"
      >
        <el-table-column
            width="24px"
        >
          <template slot-scope="scope">
            <div @click="star(scope.row)" class="clipboard-table-column-star">
              <i v-if="scope.row.star" class="el-icon-star-on"></i>
              <i v-else class="el-icon-star-off"></i>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="id"
          label="id"
          width="50px"
        >
        </el-table-column>
        <el-table-column
            label="内容"
        >
          <template slot-scope="scope">
            <div v-if="scope.row?.type === 2">
              <el-image :preview-src-list="[scope.row?.content]" style="max-width: 200px"
                        :src="scope.row?.content"></el-image>
            </div>
            <div v-else-if="scope.row?.type === 1">
              <el-popover trigger="click" :content="scope.row?.content" >
                <pre>{{ scope.row?.content }}</pre>
                <div slot="reference" style="cursor: pointer;display: inline-block">
                  <pre class="clipboard-table-column-content"
                       v-if="countLineBreaks(scope.row?.content) > 5">{{ truncateLines(scope.row?.content, 5) }}</pre>
                  <pre class="clipboard-table-column-content"
                       v-else-if="scope.row?.content.length > 300">{{ max_string(scope.row?.content, 300) }}</pre>
                  <pre v-else class="clipboard-table-column-content">{{ scope.row?.content }}</pre>
                </div>
              </el-popover>
            </div>
          </template>
        </el-table-column>
        <el-table-column
            prop="created_at"
            label="时间"
            width="95px"
        >
        </el-table-column>
        <el-table-column
            label="action"
            width="100px"
        >
          <template slot-scope="scope">
            <div class="clipboard-table-options">
              <div class="clipboard-table-options-button">
                <el-button @click="handleCopy(scope.row)" size="mini">复制</el-button>
              </div>
              <div v-if="scope.row.type === 1" class="clipboard-table-options-button">
                <el-button size="mini" @click="showUpdate(scope.row)">编辑</el-button>
              </div>
              <div class="clipboard-table-options-button">
                <el-button @click="deleteClipboard(scope.row)" type="warning" size="mini">删除</el-button>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!--      分页-->
    <div>
      <div style="display: flex;justify-content: center;padding-top: 5px">
        <el-pagination
            :page-size.sync="page_size"
            :page-sizes="[10, 20, 30, 40, 50]"
            :current-page.sync="page"
            @current-change="getList"
            background
            :small="smallWindowSize"
            :layout="layout"
            :total="total"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.clipboard-table-search-input {
  margin-bottom: 10px;
  display: flex;
  justify-content: flex-start;
}

.clipboard-table-options {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.clipboard-table-column-content {
  max-height: 200px;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
}

.clipboard-table-column-content:hover {
  background-color: rgba(255, 255, 255, 0.91) !important;
  color: #1e1e1e !important;
}

.clipboard-table-options-button {
  padding-bottom: 5px;
}

.clipboard-table-column-star {
  display: flex;
  justify-content: center;
  margin-left: 5px;
  cursor: pointer;
}
</style>
