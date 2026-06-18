<template>
  <div class="executor-header">
    <div class="executor-header-box">
      <div v-for="(executor,index) in executors" class="executor-header-item" :key="executor">
        <el-button plain :type="is_current(executor.language)" @click="open_page(executor.url)">{{ executor.name }}
        </el-button>
      </div>
      <div class="executor-header-item">
        <el-button type="primary" @click="header_submit">&nbsp;运行&nbsp;</el-button>
      </div>
      <div class="executor-header-item">
      <span style="text-align: center;align-content: center">
      version:
      </span>
        <div class="executor-header-version">
          <el-select
              v-model="version"
              :options="versions"
              :multiple="false"
              :searchable="false"
              placeholder="选择版本"
              label="name"
              track-by="name"
          ></el-select>
        </div>
      </div>
      <div class="executor-header-item">
        <span title="Ctrl+Space自动补全" @click="show_tips=!show_tips"
              class="fa fa-question-circle fa-mouse-pointer align-content-center"></span>
      </div>
      <div class="executor-header-item">
        <el-switch
            v-model="isVim"
            @change="$emit('updateKeyMap',isVim)"
            active-text="vim"
            inactive-text="normal"
        >
        </el-switch>
      </div>
    </div>
  </div>
</template>
<script>

export default {
  components: {},
  props: {
    versions: {
      type: Array,
      default () {
        return []
      }
    },
    show_version: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  data () {
    return {
      version: {},
      language: '',
      isVim: false,
      show_tips: false,
      executors: [
        {
          language: 'json',
          url: '/tools/json',
          name: 'JSON'
        },
        {
          language: 'php',
          url: '/tools/php',
          name: 'PHP'
        },
        {
          language: 'java',
          url: '/tools/java',
          name: 'JAVA'
        },
        {
          language: 'clang',
          url: '/tools/clang',
          name: 'CLANG'
        },
        {
          language: 'cpp',
          url: '/tools/cpp',
          name: 'CPP'
        },
        {
          language: 'golang',
          url: '/tools/golang',
          name: 'GOLANG'
        },
        {
          language: 'python',
          url: '/tools/python',
          name: 'python'
        }
      ]
    }
  },
  methods: {
    header_submit () {
      if (this.version === null || Object.keys(this.version).length === 0) {
        this.$message.error('未选择版本')
        return
      }
      this.$emit('executor-submit', this.version)
    },
    is_current (language) {
      if (language === this.language) {
        return 'info'
      } else {
        return 'primary'
      }
    },
    open_page (location) {
      window.location.href = location
    }
  },
  mounted () {
    this.version = this.show_version
    const url = window.location.href.split('/')
    const urlSize = url.length
    this.language = url[urlSize - 1].split('?')[0]
  }
}
</script>

<style scoped lang="scss">

:deep( .el-switch__label) {
  position: absolute;
  display: none;
  color: #fff;
}

/*打开时文字位置设置*/
::v-deep .el-switch__label--right {
  z-index: 1;
  right: 20px;
}

/*关闭时文字位置设置*/
::v-deep .el-switch__label--left {
  z-index: 1;
  left: 20px;
}

/*显示文字*/
::v-deep .el-switch__label.is-active {
  display: block;
}

::v-deep .el-switch .el-switch__core,
.el-switch .el-switch__label {
  width: 55px;
}

.executor-tips {
  display: flex;
}

.executor-header-box {
  width: 100%;
  display: flex;
  margin: 10px;
  flex-wrap: wrap;
}

.executor-header {

}

.executor-version {
  position: relative;
  width: 10%;
}

.executor-header-item {
  display: flex;
  margin-left: 10px;
  align-items: center;
}

.executor-header-version {
  width: 200px;
  margin-left: 10px;
}

.executor-submit {
  position: relative;
  width: 10%;
}

.executor-submit > div {
  margin-left: 5px;
}

.executor-tips-item {
  width: 200px;
}
</style>
