<template>
  <div id="article-comment-area" class="container">
    <div class="row comment">
      <div class="col-md-8 offset-md-2">
        <h5>{{ title }}</h5>
        <div :class="nullClass" v-if="comments.length == this.commentsCount" class="heading">
          <a href="javascript:;" @click="commentLoad()">
            <i class="fas fa-plus">&nbsp;&nbsp;&nbsp;&nbsp; load more comments</i>
          </a>
        </div>
      </div>
      <div :class="contentWrapperClass">
        <div :class="nullClass" v-if="comments.length == 0">{{ nullText }}</div>
        <div class="media" v-for="(comment, index) in comments" :key="index" v-else>
          <div class="media-left mr-3" v-if="comment.user_id != null">
            <a :href="'/user/' + comment.username">
              <el-image class="media-object rounded-circle" :src="comment.avatar"></el-image>
            </a>
          </div>
          <div class="media-left mr-3" v-else>
            <span>
              <el-image class="media-object rounded-circle" :src="comment.avatar"></el-image>
            </span>
          </div>
          <div class="media-body box-body">
            <div class="comment-heading">
              <div class="comment-heading-tips-container">
                <div class="comment-heading-tips" v-if="comment.user_id != null">
                  <i class="fas fa-user"></i><a :href="'/user/' + comment.username">{{ comment.username }}</a>
                </div>
                <div class="comment-heading-tips" v-else>
                  <i class="fas fa-user"></i><span><em>游客</em></span>
                </div>
                <div class="comment-heading-tips comment-heading-tips-week">
                  <i class="fas fa-clock"></i>{{ comment.created_at }}
                </div>
                <div class="comment-heading-tips comment-heading-tips-week" v-if="comment.visitor">
                  <i class="fa fa-map-marker-alt"></i>{{ comment.visitor?.country ?? null }}
                </div>
                <div class="comment-heading-tips comment-heading-tips-week" v-if="comment.visitor">
                  <i class="fa fa-globe"></i>{{ comment.visitor?.user_agent ?? null }}
                </div>
                <div class="comment-heading-tips">
                  <span class="float-right operate">
                     <vote-button v-if="username !== comment.username" :item="comment"></vote-button>
                     <a href="javascript:;" @click="commentDelete(index, comment.id)"
                        v-if="username === comment.username">
                       <i class="fas fa-trash-alt"></i>
                     </a>
                     <a href="javascript:;" @click="reply(comment.username)"><i class="fas fa-share"></i></a>
                  </span>
                </div>
              </div>
            </div>
            <div class="comment-body markdown" :class="comment.is_down_voted ? 'downvoted' : ''"
                 v-html="comment.content_html"></div>
          </div>
        </div>
        <form class="form mt-4" style="margin-top: 30px;" @submit.prevent="comment" v-if="canComment">
          <div class="form-group row comment-submit-area">
            <user-form ref="userForm" v-if="!this.userInfo"></user-form>
            <label v-if="user_id" class="col-sm-2 col-form-label own-avatar">
              <a :href="'/user/' + username">
                <el-avatar alt="user avatar" width="60" class="avatar rounded-circle"
                           :src="login_user_avatar"></el-avatar>
              </a>
            </label>
            <div class="col-sm-10 comment-area">
              <div style="background-color: aliceblue;border-radius: 3px">
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
            </div>
          </div>
          <div class="form-group row">
            <div class="col-sm-12">
              <button type="submit" :disabled="isSubmiting" class="btn btn-success float-right">
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import emojione from 'emojione'
import VoteButton from '@/components/VoteButton.vue'
import { marked } from 'marked'
import SimpleMDE from 'simplemde'

import 'vue-emoji-mart-sort/css/emoji-mart.css'
import { Picker } from 'vue-emoji-mart-sort'

import { emojiToImage } from '@/services/customEmoji'
import UserForm from './UserForm.vue'
import { commentApi } from '@/apis'

export default {
  components: { UserForm, VoteButton, Picker },
  props: {
    contentWrapperClass: {
      type: String,
      default () {
        return 'col-md-8 offset-md-2'
      }
    },
    user: {
      type: String,
      default () {
        return null
      }
    },
    title: {
      type: String,
      default () {
        return ''
      }
    },
    username: {
      type: String,
      default () {
        return ''
      }
    },
    user_id: {
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
      type: String,
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
      login_user_avatar: this.userAvatar,
      userInfo: null
    }
  },
  async mounted () {
    this.simplemde = new SimpleMDE({
      element: document.getElementById('comment_textarea_id'),
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
        'link', 'guide', '|', {
          name: 'emoji',
          action: () => {
            this.show_emoji_picker = !this.show_emoji_picker
          },
          className: 'fa fa-smile',
          title: 'emoji'
        }
      ]
    })
    commentApi.getComments({
      commentable_id: this.commentableId,
      commentable_type: this.commentableType,
      commentsCount: this.commentsCount
    }).then((response) => {
      response.data.data.forEach((data) => {
        data.content_html = this.parse(data.content_raw)
        if (!data.avatar || data.avatar === '/images/default.png') {
          data.avatar = 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + data.user_email_hash
        }

        return data
      })
      this.comments = response.data.data
    })

    if (this.login_user_avatar === '') {
      this.login_user_avatar = 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + this.emailHash
    }
    if (this.user !== '') {
      this.userInfo = JSON.parse(this.user)
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
      if (!this.user_id) {
        if (!this.$refs.userForm.validateData()) {
          return
        }
        data.name = this.$refs.userForm.guest.name
        data.email = this.$refs.userForm.guest.email
        data.website = this.$refs.userForm.guest.website
        this.$refs.userForm.saveGuestInfo()
      }

      this.isSubmiting = true

      this.$http.post('comments', data)
        .then((response) => {
          let comment = null
          comment = response.data.data
          comment.content_html = this.parse(comment.content_raw)

          this.comments.push(comment)
          this.content = ''
          this.simplemde.value('')
          this.isSubmiting = false
        }).catch(({ response }) => {
          this.isSubmiting = false
          const errors = response.data.errors
          let errorMessage = ''
          for (const key in errors) {
            errors[key].forEach((value) => {
              errorMessage += value + ','
            })
          }
        })
    },
    reply (name) {
      $('#content').focus()
      this.simplemde.value('@' + name + ' ')
    },
    commentDelete (index, id) {
    },
    commentLoad () {
      const url = 'commentable/' + this.commentableId + '/comment'
      this.$http.get(url, {
        params: {
          commentable_type: this.commentableType,
          commentsCount: this.commentsCount + 1
        }
      }).then((response) => {
        response.data.data.forEach((data) => {
          data.content_html = this.parse(data.content_raw)
          return data
        })
        this.comments = response.data.data
        this.commentsCount += 1
      }).then((response) => {
      })
    },
    parse (html) {
      html = emojiToImage(html)
      marked.setOptions({
        highlight: (code) => {
          return hljs.highlightAuto(code).value
        }
      })
      return emojione.toImage(marked(html))
    }
  },
  watch: {
  }
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
}

.comment-heading-tips:last-child {
  margin-left: auto;
  padding-right: 0;
  display: flex;
  align-items: flex-end;
}

.comment-heading {
  padding: 10px 10px;
  background: #ECF0F1;

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

@media screen and (max-aspect-ratio: 1/1) {
  .comment-area {
    flex: none;
    max-width: 100%;
  }
}

.comment-submit-area {
  display: flex;
  justify-content: right;
}

</style>
