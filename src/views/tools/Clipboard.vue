<template>
  <div class="clipboard-box">
    <div class="clipboard-content-box">
      <el-tabs v-model="data_source_type">
        <!--      公共剪切板-->
        <el-tab-pane label="公共剪切板" name="public">
          <clipboard-table data_source_type="public"></clipboard-table>
        </el-tab-pane>
        <!--      个人剪切板-->
        <el-tab-pane label="个人剪切板" name="private">
          <clipboard-table data_source_type="private"></clipboard-table>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div class="clipboard-info-box">
      <!--      信息区域-->
      <div style="text-align: center">
        <h4>
          在线剪切板同步
        </h4>
      </div>
      <div>
        <el-divider>
          版块设计初衷
        </el-divider>
        解决手机和电脑剪切板同步问题。某些设备无法安装例如：微信、飞书等工具，或者当前没有安装。需要同步一些简单的文字信息。
      </div>
      <div>
        <el-divider>功能介绍</el-divider>
        <parse content="
1. 功能分为【公共剪切板】和【个人剪切板】两个版块
2. 公共剪切板可以随意添加和删除
3. 个人剪切板只能<font style='color: red'>**个人**</font>添加和删除
4. 每个版块最多支持 50 个剪切板内容
5. 重复新增的剪切板内容，会删除之前相同内容的条目
6. 内容支持文字、图片
"></parse>
      </div>
      <div>
        <el-divider>tips</el-divider>
        <i>公共剪切板注意隐私安全</i>
      </div>
      <div>
        <el-divider>开发相关</el-divider>
        <parse content="
- 开发耗时:第一版迭代约5小时
- 期待开发内容:
    - 各平台可直接运行的命令行工具
"></parse>
      </div>
    </div>
  </div>
</template>
<script>

import ClipboardTable from './particals/ClipboardTable.vue'

export default {
  components: { ClipboardTable },
  data () {
    return {
      data_source_type: 'public'
    }
  }
}
</script>
<style scoped>
.clipboard-box {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  background: rgba(249, 249, 251, .5);
  justify-content: center;
}

.clipboard-info-box {
  width: 20%;
  min-height: 100vh;
  background: rgba(249, 249, 251, 1);
  border-right: 1px solid #e7eaec;
  padding: 20px 10px 10px 10px;
  opacity: 1 !important;
}

.clipboard-content-box {
  width: 60%;
  min-height: 100vh;
  background: rgba(249, 249, 251, 1);
  border-right: 1px solid #e7eaec;
  padding: 20px 10px 10px 10px;
}

@media screen and (max-aspect-ratio: .7/1) {
  .clipboard-content-box {
    width: 100%;
    min-height: 0;
  }

  .clipboard-info-box {
    width: 100%;
    min-height: 0;
  }
}
</style>
