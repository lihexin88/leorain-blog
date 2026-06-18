<template>
  <div id="article-comment-area" class="container">
    <div class="row comment">
      <div class="col-md-8 offset-md-2">
        <h5>{{ title }}</h5>
        <div :class="nullClass" v-if="comments.length == this.commentsCount" class="heading">
          <a href="javascript:;" @click="commentLoad()">
            <el-icon>
              <Plus/>
            </el-icon>&nbsp;&nbsp;&nbsp;&nbsp; load more comments
          </a>
        </div>
      </div>
      <div :class="contentWrapperClass">
        <div :class="nullClass" v-if="comments.length == 0">{{ nullText }}</div>
        <div class="media" v-for="(comment, index) in comments" :key="comment.id" v-else>
          <div class="media-body box-body">
            <div class="comment-heading">
              <div class="header-avatar" v-if="comment.user_id != null">
                <router-link :to="`/user/profile?uid=`+comment.uid">
                  <el-avatar :size="40" class="media-object rounded-circle" :src="comment.avatar"></el-avatar>
                </router-link>
              </div>
              <div class="header-avatar" v-else>
                <el-avatar :size="40" class="media-object rounded-circle" :src="comment.avatar"></el-avatar>
              </div>
              <div class="comment-heading-tips-container">
                <div class="comment-heading-tips" v-if="comment.user_id != null">
                  <el-icon>
                    <User/>
                  </el-icon>
                  <span>{{ comment.username }}</span>
                </div>
                <div class="comment-heading-tips" v-else>
                  <el-icon>
                    <User/>
                  </el-icon>
                  <span><em>游客</em></span>
                </div>
                <div class="comment-heading-tips comment-heading-tips-week">
                  <el-icon>
                    <Clock/>
                  </el-icon>
                  {{ comment.created_at }}
                </div>
                <div class="comment-heading-tips comment-heading-tips-week" v-if="comment.visitor">
                  <el-icon>
                    <Location/>
                  </el-icon>
                  {{ comment.visitor?.country ?? null }}
                </div>
                <div class="comment-heading-tips comment-heading-tips-week" v-if="comment.visitor">
                  <el-icon>
                    <ChromeFilled/>
                  </el-icon>
                  {{ comment.visitor?.user_agent ?? null }}
                </div>
                <div class="comment-heading-tips comment-heading-actions">
                  <vote-button v-if="user?.uid !== comment.uid" :item="comment"></vote-button>
                  <el-popconfirm
                      title="确认删除这条评论吗？"
                      confirm-button-text="确定"
                      cancel-button-text="取消"
                      @confirm="commentDelete(index, comment.id)"
                  >
                    <template #reference>
                      <el-icon class="pointer" v-if="user?.uid === comment.uid || user?.is_admin">
                        <Delete/>
                      </el-icon>
                    </template>
                  </el-popconfirm>
                  <el-icon class="pointer" @click="reply(comment.uid)">
                    <ChatDotRound/>
                  </el-icon>
                </div>
              </div>
            </div>
            <markdown-parse class="comment-content" v-if="comment.content_html" :class="comment.is_down_voted ? 'downvoted' : ''"
                            :content="comment.content_html"></markdown-parse>
          </div>
        </div>
        <el-form class="mt-4" style="margin-top: 30px;" @submit.prevent="comment" v-if="canComment">
          <el-row :gutter="20" class="comment-submit-area">
            <el-col :span="24" class="comment-area">
              <div class="comment-editor-wrapper" @click="handleCommentAreaClick">
                <div v-show="show_emoji_picker"
                     ref="emojiPickerContainer"
                     class="emoji-picker-container"
                     :style="{ left: emojiPickerPosition.left + 'px', top: emojiPickerPosition.top + 'px' }">
                </div>
                <textarea id="comment_textarea_id" placeholder="Markdown"></textarea>
              </div>
              <div class="user-avatar-in-toolbar">
                <user-form ref="userForm" v-if="!isLoggedIn" @update="onUserFormUpdate"></user-form>
                <el-avatar v-else alt="user avatar" :size="40" class="avatar rounded-circle"
                           :src="currentUserAvatar"></el-avatar>
              </div>
            </el-col>
          </el-row>
          <el-row class="mt-2">
            <el-col :span="24" class="text-right">
              <el-button type="success" :loading="isSubmiting" native-type="submit">
                提交
              </el-button>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import emojione from 'emojione'
import VoteButton from '@/components/VoteButton.vue'
import { marked } from 'marked'
import SimpleMDE from 'simplemde'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import 'simplemde/dist/simplemde.min.css'

import { Picker } from 'emoji-mart'
import { emojiI18n, emojiToImage, getEmojiData } from '@/services/customEmoji'
import UserForm from './UserForm.vue'
import { commentApi } from '@/apis'
import { Plus, User, Clock, Location, Delete, ChatDotRound, ChromeFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { mapState } from 'pinia'
import MD5 from 'crypto-js/md5'
import MarkdownParse from '@/components/MarkdownParse.vue'

export default {
  components: { MarkdownParse, ChromeFilled, UserForm, VoteButton, Plus, User, Clock, Location, Delete, ChatDotRound },
  props: {
    contentWrapperClass: {
      type: String,
      default () {
        return 'col-md-8 offset-md-2'
      }
    },
    title: {
      type: String,
      default () {
        return ''
      }
    },
    userAvatar: {
      type: String,
      default () {
        return null
      }
    },
    emailHash: {
      type: String,
      default () {
        return null
      }
    },
    commentableType: {
      type: String,
      default () {
        return 'articles'
      }
    },
    commentableId: {
      type: [String, Number],
      default () {
        return '0'
      }
    },
    canComment: {
      type: Boolean,
      default () {
        return false
      }
    },
    nullText: {
      type: String,
      default () {
        return 'Nothing...'
      }
    },
    nullClass: {
      type: String,
      default () {
        return 'none'
      }
    }
  },
  data () {
    return {
      comments: [],
      commentsCount: 500,
      content: '',
      guest_avatar: '',
      simplemde: null,
      isSubmiting: false,
      show_emoji_picker: false,
      custom_emojis: [],
      emojiI18n,
      login_user_avatar: this.userAvatar,
      guestInfo: null,
      emojiPickerPosition: { left: 0, top: 0 }
    }
  },
  async mounted () {
    // 表情包
    try {
      await getEmojiData().then((res) => {
        this.custom_emojis = res
        this.emojiI18n = emojiI18n
      })
    } catch (error) {
      this.custom_emojis = []
    }

    // 初始化表情选择器
    try {
      const emojiData = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data').then(res => res.json())
      this.emojiPicker = new Picker({
        parent: this.$refs.emojiPickerContainer,
        data: emojiData,
        onEmojiSelect: (emoji) => {
          this.addEmoji(emoji)
        },
        onClickOutside: () => {
        },
        custom: [
          {
            id: 'custom',
            name: emojiI18n.categories.custom,
            emojis: this.custom_emojis
          }
        ],
        locale: 'zh'
      })
    } catch (error) {
      console.error('Failed to load emoji data:', error)
      // 如果 CDN 加载失败，至少初始化一个只有自定义表情的 Picker
      this.emojiPicker = new Picker({
        parent: this.$refs.emojiPickerContainer,
        onEmojiSelect: (emoji) => {
          this.addEmoji(emoji)
        },
        custom: [
          {
            id: 'custom',
            name: emojiI18n.categories.custom,
            emojis: this.custom_emojis
          }
        ],
        locale: 'zh'
      })
    }

    this.simplemde = new SimpleMDE({
      element: document.getElementById('comment_textarea_id'),
      placeholder: '# markdown..',
      autoDownloadFontAwesome: true,
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
        'link', 'guide', '|', {
          name: 'emoji',
          action: () => {
            // 获取点击事件的目标元素
            const event = window.event
            if (event) {
              // 计算点击位置相对于编辑器容器的坐标
              const editorWrapper = this.$el.querySelector('.comment-editor-wrapper')
              const toolbarButton = event.target.closest('.fa-smile') || event.target.closest('button')

              if (editorWrapper && toolbarButton) {
                const wrapperRect = editorWrapper.getBoundingClientRect()
                const buttonRect = toolbarButton.getBoundingClientRect()

                // 检测是否为移动设备
                const isMobile = window.innerWidth <= 768

                // 设置 emoji picker 的位置
                if (isMobile) {
                  // 在移动设备上，emoji picker 位于中间
                  this.emojiPickerPosition = {
                    left: (wrapperRect.width - 300) / 2, // 假设 emoji picker 宽度为 300px
                    top: buttonRect.top - wrapperRect.top
                  }
                } else {
                  // 在桌面设备上，emoji picker 位于点击位置的正上方
                  this.emojiPickerPosition = {
                    left: buttonRect.left - wrapperRect.left,
                    top: buttonRect.top - wrapperRect.top
                  }
                }
              }
            }
            this.show_emoji_picker = !this.show_emoji_picker
          },
          className: 'far fa-smile',
          title: 'emoji'
        }
      ]
    })

    // Scroll editor into view on mobile when focused (avoids keyboard occlusion)
    this.simplemde.codemirror.on('focus', () => {
      this.$nextTick(() => {
        const editorEl = this.$el.querySelector('.comment-editor-wrapper')
        if (editorEl) {
          editorEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    })

    commentApi.getComments({
      commentable_id: this.commentableId,
      commentable_type: this.commentableType,
      commentsCount: this.commentsCount
    }).then(async (response) => {
      for (const data of response.data) {
        data.content_html = await emojiToImage(data.content_html)
        if (!data.avatar || data.avatar === '/images/default.png') {
          data.avatar = 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + data.user_email_hash
        }
      }
      this.comments = response.data
    })

    if (this.login_user_avatar === '') {
      this.login_user_avatar = 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + this.emailHash
    }

    const guestInfo = localStorage.getItem('guest_info')
    if (guestInfo) {
      this.guestInfo = JSON.parse(guestInfo)
    }
  },
  methods: {
    focusEditor (cursor) {
      const editor = this.simplemde?.codemirror

      if (!editor) {
        return
      }

      this.$nextTick(() => {
        requestAnimationFrame(() => {
          editor.focus()
          editor.setCursor(cursor)
        })
      })
    },
    replaceEditorValue (value, shouldFocus = false) {
      const editor = this.simplemde.codemirror
      const doc = editor.getDoc()
      const lastLine = doc.lastLine()

      doc.replaceRange(value, {
        line: doc.firstLine(),
        ch: 0
      }, {
        line: lastLine,
        ch: doc.getLine(lastLine).length
      })

      const cursor = doc.posFromIndex(value.length)
      editor.setCursor(cursor)

      if (shouldFocus) {
        this.focusEditor(cursor)
      }
    },
    addEmoji (emoji) {
      const emojiContent = emoji.native || `:${emoji.id}:`
      const editor = this.simplemde.codemirror

      editor.replaceSelection(emojiContent)
      this.focusEditor(editor.getCursor())
      this.show_emoji_picker = false
    },
    handleCommentAreaClick () {
      if (!this.isLoggedIn) {
        if (!this.$refs.userForm.validateData()) {
          this.$refs.userForm.showDialog = true
        }
      }
    },
    comment () {
      if (!this.simplemde.value()) {
        return
      }
      const data = {
        content: this.simplemde.value(),
        commentable_id: this.commentableId,
        commentable_type: this.commentableType
      }
      if (!this.isLoggedIn) {
        if (!this.$refs.userForm.validateData()) {
          this.$refs.userForm.showDialog = true
          return
        }
        data.name = this.$refs.userForm.guest.name
        data.email = this.$refs.userForm.guest.email
        data.website = this.$refs.userForm.guest.website
        this.$refs.userForm.saveGuestInfo()
        // 更新本地 guestInfo 状态以便头像显示
        const guestInfo = localStorage.getItem('guest_info')
        if (guestInfo) {
          this.guestInfo = JSON.parse(guestInfo)
        }
      }

      this.isSubmiting = true

      commentApi.createComment(data)
        .then(async (response) => {
          let comment = null
          comment = response.data
          comment.content_html = await emojiToImage(comment.content_html)

          this.comments.push(comment)
          this.content = ''
          this.replaceEditorValue('')
          this.isSubmiting = false
        }).catch(({ response }) => {
          this.isSubmiting = false
          const errors = response.data.errors
          for (const key in errors) {
            errors[key].forEach((value) => {
              this.$message.error(value)
              console.error(value)
            })
          }
        })
    },
    reply (uid) {
      this.replaceEditorValue('@' + uid + ' ', true)
    },
    commentDelete (index, id) {
      commentApi.deleteComment(id)
        .then(() => {
          this.comments.splice(index, 1)
        })
    },
    commentLoad () {
      commentApi.getComments({
        commentable_id: this.commentableId,
        commentable_type: this.commentableType,
        commentsCount: this.commentsCount + 1
      }).then(async (response) => {
        for (const data of response.data) {
          data.content_html = await emojiToImage(data.content_html)
        }
        this.comments = response.data
        this.commentsCount += 1
      })
    },
    onUserFormUpdate () {
      const guestInfo = localStorage.getItem('guest_info')
      if (guestInfo) {
        this.guestInfo = JSON.parse(guestInfo)
      }
    },
    async parse (html) {
      html = await emojiToImage(html)
      marked.setOptions({
        highlight: (code) => {
          return hljs.highlightAuto(code).value
        }
      })
      return emojione.toImage(marked(html))
    }
  },
  computed: {
    ...mapState(useUserStore, ['user', 'isLoggedIn']),
    currentUserAvatar () {
      if (this.isLoggedIn && this.user) {
        return this.user.avatar || 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + this.user.email_hash
      }
      if (this.guestInfo && this.guestInfo.email) {
        return 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + MD5(this.guestInfo.email).toString()
      }
      return 'https://api.dicebear.com/9.x/adventurer/svg?seed=default'
    }
  },
  watch: {}
}
</script>
<style scoped>
.comment-heading-tips {
  padding-right: 15px;
  color: var(--text-color);
}

.comment-heading-tips-week {
  font-size: .9em;
  display: flex;
  align-items: center;
  gap: 2px;
}

.comment-heading-tips-container {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  align-content: center;
  margin-left: 10px;
}

.comment-heading-actions{
  display: flex;
  align-items: center;
  gap: 5px;
}
.comment-heading-tips:last-child {
  margin-left: auto;
  padding-right: 0;
  display: flex;
  align-items: flex-end;
}

.comment-heading {
  padding: 8px;
  background: linear-gradient(135deg, var(--theme-el-fill-color), rgb(255 255 255 / .16));
  display: flex;
  align-content: center;
  align-items: center;
  border-radius: 999px;
  transition: box-shadow 0.3s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  a {
    color: #6366f1;
    display: flex;
  }
}
:deep(.comment-content){
  .markdown{
    margin: 0 25px 5px 25px;
    padding: 10px 0 10px 20px;
    background: linear-gradient(135deg, var(--theme-el-fill-color), rgb(255 255 255 / .16));
    border-radius: 0 0 5px 5px;
  }
}

::v-deep .editor-toolbar.fullscreen {
  z-index: 15 !important;
  margin-top: 40px;
}

::v-deep .CodeMirror-scroll {
  margin-top: 0;
}

::v-deep .CodeMirror-lines {
  padding-top: 25px;
}

::v-deep .editor-preview-side {
  padding-top: 25px;
}

.emoji-picker-container {
  position: absolute;
  transform: translateY(-100%);
  z-index: 1000;
}

.comment-editor-wrapper {
  background-color: aliceblue;
  border-radius: 3px;
  border: 1px solid #dcdfe6;
  position: relative;
}

.comment-area {
  position: relative;
}

.comment-editor-wrapper :deep(.editor-toolbar) {
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  border: none;
  border-bottom: 1px solid #dcdfe6;
  background-color: #fff;
  display: flex;
  align-items: center;
  height: 48px;
}

.user-avatar-in-toolbar {
  position: absolute;
  right: 10px;
  top: 5px;
  z-index: 100;
  display: flex;
  padding: 0 5px;
  align-items: center;
}

.comment-editor-wrapper :deep(.CodeMirror) {
  border: none;
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
  background-color: aliceblue;
  min-height: 150px;
}

.comment-editor-wrapper:focus-within {
  border-color: #409eff;
}

.text-right {
  display: flex;
  justify-content: flex-end;
}

@include mobile {
  .own-avatar {
    display: none;
  }

  .comment-area {
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 100% !important;
  }
}

.emoji-icon {
  &::before {
    content: '11';
  }
}

</style>
