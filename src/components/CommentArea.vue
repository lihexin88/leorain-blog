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
        <div class="media" v-for="(comment, index) in comments" :key="index" v-else>
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
                <div class="comment-heading-tips">
                     <vote-button v-if="user?.uid !== comment.uid" :item="comment"></vote-button>
                       <el-icon
                           v-if="user?.uid === comment.uid"
                           @click="commentDelete(index, comment.id)"
                       ><Delete/></el-icon>
                       <el-icon @click="reply(comment.username, comment.uid)"><Share/></el-icon>
                </div>
              </div>
            </div>
            <div class="comment-body markdown" :class="comment.is_down_voted ? 'downvoted' : ''"
                 v-html="comment.content_html"></div>
          </div>
        </div>
        <el-form class="mt-4" style="margin-top: 30px;" @submit.prevent="comment" v-if="canComment">
          <el-row :gutter="20" class="comment-submit-area">
            <el-col :span="2" class="own-avatar">
              <user-form ref="userForm" v-if="!isLoggedIn" @update="onUserFormUpdate"></user-form>
              <el-avatar v-else alt="user avatar" :size="60" class="avatar rounded-circle"
                         :src="currentUserAvatar"></el-avatar>
            </el-col>
            <el-col :span="22" class="comment-area">
              <div class="comment-editor-wrapper">
                <Picker v-if="show_emoji_picker && custom_emojis.length > 0"
                        :per-line="16"
                        ref="picker"
                        set="apple"
                        title="emoji"
                        :include="['recent','custom','people','food','activity','travel','objects','flags']"
                        :showSearch="true"
                        :showPreview="false"
                        :custom="custom_emojis"
                        :onItemClick="addEmoji"
                />
                <textarea id="comment_textarea_id" placeholder="Markdown"></textarea>
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
import 'simplemde/dist/simplemde.min.css'

import 'vue-emoji-mart-sort/css/emoji-mart.css'
import { Picker } from 'vue-emoji-mart-sort'

import { emojiI18n, emojiToImage, getEmojiData } from '@/services/customEmoji'
import UserForm from './UserForm.vue'
import { commentApi } from '@/apis'
import { Plus, User, Clock, Location, Delete, Share, ChromeFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { mapState } from 'pinia'
import MD5 from 'crypto-js/md5'

export default {
  components: { ChromeFilled, UserForm, VoteButton, Picker, Plus, User, Clock, Location, Delete, Share },
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
      guestInfo: null
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
            this.show_emoji_picker = !this.show_emoji_picker
          },
          className: 'el-icon-chat-line-round',
          title: 'emoji'
        }
      ]
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
    addEmoji (emoji) {
      this.simplemde.value(this.simplemde.value() + emoji.colons)
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
          this.simplemde.value('')
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
    reply (name, uid) {
      $('#content').focus()
      this.simplemde.value('@' + uid + ' ')
      this.simplemde.codemirror.focus()
      this.simplemde.codemirror.setCursor(this.simplemde.codemirror.lineCount(), 0)
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
}

.comment-heading-tips-week {
  font-size: .9em;
}

.comment-heading-tips-container {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  align-content: center;
  margin-left: 10px;
}

.comment-heading-tips:last-child {
  margin-left: auto;
  padding-right: 0;
  display: flex;
  align-items: flex-end;
}

.comment-heading {
  padding: 3px;
  background: #ECF0F1;
  display: flex;
  align-content: center;

  a {
    color: #7F8C8D;
  }
}

::v-deep .editor-toolbar.fullscreen {
  z-index: 15 !important;
  margin-top: 40px;
}

::v-deep .CodeMirror-scroll {
  margin-top: 25px;
}

::v-deep .editor-preview-side {
  margin-top: 25px;
}

::v-deep div[data-name="Custom"] ~ * span {
  width: 96px !important;
  height: 96px !important;
  background-repeat: no-repeat;
  background-position: center;
}

::v-deep .emoji-mart-preview {
  height: 128px !important;
}

::v-deep .emoji-mart-preview-emoji .emoji-mart-emoji {
  height: 128px !important;
}

::v-deep .emoji-mart-preview-emoji span span {
  height: 96px !important;
  width: 96px !important;
}

::v-deep .emoji-mart-preview-data {
  padding-left: 96px;
}

::v-deep .emoji-mart-scroll {
  height: 280px;
}

.comment-editor-wrapper {
  background-color: aliceblue;
  border-radius: 3px;
  border: 1px solid #dcdfe6;
}

.comment-editor-wrapper :deep(.editor-toolbar) {
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  border: none;
  border-bottom: 1px solid #dcdfe6;
  background-color: #fff;
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

@media screen and (max-width: 768px) {
  .own-avatar {
    display: none;
  }

  .comment-area {
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 100% !important;
  }
}

</style>
