<template>
  <div class="upload-container">
    <div class="upload-div">
      <el-upload
          action="#"
          list-type="picture-card"
          :http-request="upload"
          ref="upload"
          :limit=1
          type="file"
          :file-list="fileList"
          :auto-upload="false">
        <div class="upload-item">
          <i slot="default" class="el-icon-plus"></i>
          <div slot="file" slot-scope="{file}">
            <img
                class="el-upload-list__item-thumbnail"
                :src="file.url" alt=""
            >
            <span class="el-upload-list__item-actions">
               <span
                   class="el-upload-list__item-preview"
                   @click="handlePictureCardPreview(file)"
               >
                 <i class="el-icon-zoom-in"></i>
               </span>
            <span
                v-if="!disabled"
                class="el-upload-list__item-delete"
                @click="handleDownload(file)"
            >
            <i class="el-icon-download"></i>
             </span>
             <span
                 v-if="!disabled"
                 class="el-upload-list__item-delete"
                 @click="handleRemove(file)"
             >
            <i class="el-icon-delete"></i>
             </span>
          </span>
          </div>
        </div>
      </el-upload>
    </div>
    <div class="upload-submit-button">
      <el-button @click="submit()">提交</el-button>
    </div>
    <el-dialog v-model:visible="dialogVisible">
      <img width="100%" :src="dialogImageUrl" alt="">
    </el-dialog>
  </div>
</template>

<script>
import { uploadFile } from '../../../plugins/file/upload'
import { get_url_params } from '../../../configApi/helper'

export default {
  data () {
    return {
      file: null,
      fileList: [],
      dialogVisible: false,
      dialogImageUrl: null,
      disabled: false,
      token: null
    }
  },
  props: {},
  methods: {
    handleDownload () {

    },
    handleRemove () {

    },
    handlePictureCardPreview (file) {
      this.dialogImageUrl = file.url
      this.dialogVisible = true
    },
    upload ({ file }) {
      if (!this.token) {
        this.$message.error('未认证')
        return
      }
      uploadFile(file, file.name, this.token).then((response) => {
        this.$http.post('frontend/file/mobile_upload/patch_result', {
          status: 3,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileUrl: response.url,
          token: this.token
        })
      })
    },
    submit () {
      this.$refs.upload.submit()
    }
  },
  mounted () {
    const urlParams = get_url_params()
    if (!urlParams.token) {
      this.$message.error('未认证')
      return
    }
    this.token = urlParams.token
    this.$http.post('frontend/file/mobile_upload/patch_result', {
      status: 2,
      token: this.token
    })
  }
}
</script>
<style scoped lang="scss">
.upload-div {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-container {
  padding-top: 20px;
}

.upload-submit-button {
  padding-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.upload-item {
  height: 200px;
}
</style>
