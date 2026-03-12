<template>
  <div class="guestbook-form">
    <div style="display: flex;justify-content: flex-end;flex-wrap: wrap">
      <user-form ref="userForm" v-if="!this.userAuthorized"></user-form>
      <div style="display: flex;justify-content: flex-end;align-items: center">
        <div style="padding: 0 10px">
          <el-popover
              placement="top"
              width="160"
              trigger="manual"
              v-model="show_replace_tip"
          >
            <p>检测到已输入内容，是否替换为友链格式？</p>
            <div style="text-align: right; margin: 0">
              <el-button size="small" type="info" @click="show_replace_tip = false">取消</el-button>
              <el-button type="primary" size="small" @click="generate_link_text">确定</el-button>
            </div>
            <template v-slot:reference>
              <el-button @click="check_input_value">友链</el-button>
            </template>
          </el-popover>
        </div>
        <div style="padding:0 10px">
          <el-button type="primary" @click="submit">提交</el-button>
        </div>
      </div>
    </div>
    <el-card body-style="padding:3px">
      <div class="guestbook-input">
        <textarea :id="editor_id"></textarea>
      </div>
    </el-card>
  </div>
</template>

<script>
import SimpleMDE from 'simplemde/dist/simplemde.min'
import { marked } from 'marked'
import emojione from 'emojione'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import 'simplemde/dist/simplemde.min.css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/mdn-like.css'
import UserForm from '@/components/UserForm.vue'
import { guestbookApi } from '@/apis'

export default {
  name: 'GuestbookForm',
  props: {
    guestbook: {
      type: Object,
      default: null
    }
  },
  components: { UserForm },
  data () {
    return {
      simplemde: null,
      content: null,
      show_replace_tip: false,
      editor_id: 'editor' + Math.random().toString(36).substr(2),
      link_text: '- 站点名称:\n' +
          '- 一句话描述:\n' +
          '- 头像:\n' +
          '- 网址:',
      user: {
        avatar: null,
        name: null
      },
      userAuthorized: true
    }
  },
  mounted () {
    // 生成唯一的编辑器id
    this.simplemde = new SimpleMDE({
      element: document.getElementById(this.editor_id),
      placeholder: '# markdown..',
      autoDownloadFontAwesome: false,
      forceSync: true,
      autoRefresh: true,
      lineNumbers: false,
      theme: 'mdn-like',
      previewRender (plainText, preview) {
        preview.className += ' markdown'
        marked.setOptions({
          highlight: (code) => {
            return hljs.highlightAuto(code).value
          },
          sanitize: true
        })
        return emojione.toImage(marked(plainText))
      },
      toolbar: [
        'bold', 'italic', '|',
        'quote', 'code', 'table', '|',
        'preview', 'side-by-side', 'fullscreen', '|',
        'link', 'guide'
      ]
    })
    this.userAuthorized = localStorage.getItem('user') !== null
  },
  methods: {
    check_input_value () {
      if (this.simplemde.value() !== '') {
        this.show_replace_tip = true
      } else {
        this.show_replace_tip = false
        this.generate_link_text()
      }
    },
    generate_link_text () {
      this.simplemde.value(this.link_text)
      this.show_replace_tip = false
    },
    do_submit (apiMethod, body) {
      apiMethod(body).then((response) => {
        if (this.guestbook) {
          if (this.guestbook.children === undefined) {
            this.guestbook.children = []
          }
          this.guestbook.children.push({
            ...response.data
          })
        }
        // 关闭输入框
        this.$emit('replay', null)
        this.simplemde.value('')
        this.$message.success('提交成功')
      }).catch(() => {
        this.$message.error('提交失败')
      })
    },
    submit () {
      if (this.userAuthorized) {
        this.do_submit(guestbookApi.createAuthorizedGuestbook, {
          content: this.simplemde.value(),
          parent_id: this.guestbook?.id
        })
      } else {
        this.$refs.userForm.validateData()
        this.$refs.userForm.saveGuestInfo()
        const guestInfo = this.$refs.userForm.guest
        this.do_submit(guestbookApi.createGuestbook, {
          content: this.simplemde.value(),
          nickname: guestInfo.name,
          email: guestInfo.email,
          website: guestInfo.website,
          parent_id: this.guestbook?.id
        })
      }
    }
  }
}
</script>
<style scoped>
.guestbook-form {
  width: 100%;
}

.guestbook-input {
  border: grey dashed 1px;
  padding: 5px;
}

:deep(.editor-toolbar.fullscreen) {
  z-index: 15 !important;
  margin-top: 40px;
}

:deep(.CodeMirror-scroll) {
  margin-top: 25px;
}

:deep(.editor-preview-side) {
  margin-top: 25px;
}
</style>
