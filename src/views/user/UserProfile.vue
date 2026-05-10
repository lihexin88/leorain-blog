<template>
  <div class="user-profile-container">
    <div class="user-header-jumbotron" v-if="userInfo">
      <el-row :gutter="20" justify="center" align="middle" class="container">
        <el-col :xs="24" :sm="6" class="text-center">
          <el-avatar :size="120" :src="userInfo.avatar || defaultAvatar" class="profile-avatar" shape="circle" fit="cover" :class="{ clickable: isMyProfile }" @click="isMyProfile && $refs.avatarInput.click()" />
          <input v-if="isMyProfile" ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarUpload" />
        </el-col>
        <el-col :xs="24" :sm="10" class="profile-content">
          <h1 class="nickname">昵称: {{ userInfo.nickname || userInfo.name }}</h1>
          <p class="description">简介: {{ userInfo.description || '暂无简介' }}</p>
          <div class="website">
            网址: <el-link v-if="userInfo.website" :href="userInfo.website" target="_blank" type="primary">{{ userInfo.website }}</el-link>
            <span v-else>暂无</span>
          </div>
          <div class="actions" v-if="isMyProfile">
            <el-button type="info" size="small" @click="handleEditProfile">编辑资料</el-button>
          </div>
          <div class="social-links">
            <el-link v-if="userInfo.github_name" :href="'https://github.com/' + userInfo.github_name" target="_blank" class="social-icon">
              <i class="fab fa-github"></i>
            </el-link>
          </div>
        </el-col>
        <el-col :xs="24" :sm="8" class="profile-stats">
          <el-row :gutter="10" class="text-center">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ userInfo.followings_count || 0 }}</div>
                <div class="stat-label">关注</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ discussions_count || 0 }}</div>
                <div class="stat-label">讨论</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ comments_count || 0 }}</div>
                <div class="stat-label">评论</div>
              </div>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="20" class="container content-row">
      <el-col :xs="24" :md="12">
        <el-card class="box-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近评论</span>
            </div>
          </template>
          <div v-if="comments && comments.length" class="comment-list">
            <div v-for="comment in comments" :key="comment.id" class="list-item">
              <div class="item-title">
                <router-link :to="getCommentableLink(comment)">
                  {{ comment.commentable?.title || '未知内容' }}
                </router-link>
                <span class="meta"> in {{ comment.created_at_human }}</span>
              </div>
              <markdown-parse :content="renderComment(comment)"></markdown-parse>
            </div>
          </div>
          <div v-else class="nothing">暂无数据</div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card class="box-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近讨论</span>
            </div>
          </template>
          <div v-if="discussions && discussions.length" class="discussion-list">
            <div v-for="discussion in discussions" :key="discussion.id" class="list-item">
              <router-link :to="'/discussion/' + discussion.id">
                {{ discussion.title }}
              </router-link>
              <span class="meta"> in {{ discussion.created_at_human }}</span>
            </div>
          </div>
          <div v-else class="nothing">暂无数据</div>
        </el-card>

        <div v-if="isMyProfile" class="user-items-wrapper">
          <UserItems />
        </div>
      </el-col>
    </el-row>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑资料"
      append-to-body
      :style="{ width: 'min(520px, calc(100vw - 32px))' }"
    >
      <el-form label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="editForm.name" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="网站">
          <el-input v-model="editForm.website" placeholder="请输入网站地址" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="editForm.description" type="textarea" :rows="4" placeholder="请输入简介" />
        </el-form-item>
        <el-form-item label="邮件通知">
          <el-switch
            v-model="editForm.email_notify_enabled"
            active-value="yes"
            inactive-value="no"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="editSubmitting" @click="submitEditProfile">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user'
import { mapState, mapActions } from 'pinia'
import userApi from '@/apis/user'
import { uploadToOss } from '@/utils/oss-file'
import UserItems from '@/components/UserItems.vue'
import MarkdownParse from '@/components/MarkdownParse.vue'

export default {
  name: 'UserProfile',
  components: {
    MarkdownParse,
    UserItems
  },
  data () {
    return {
      userInfo: null,
      comments: [],
      discussions: [],
      discussions_count: 0,
      comments_count: 0,
      defaultAvatar: 'https://images.leorain.cn/avatar/default_avatar.png',
      editDialogVisible: false,
      editSubmitting: false,
      editForm: {
        name: '',
        nickname: '',
        website: '',
        description: '',
        email_notify_enabled: 'no'
      }
    }
  },
  computed: {
    ...mapState(useUserStore, ['user', 'isLoggedIn']),
    uid () {
      return this.$route.query.uid || this.user?.uid
    },
    isMyProfile () {
      return this.user && String(this.user.uid) === String(this.uid)
    }
  },
  mounted () {
    if (!this.uid) {
      this.setShowLoginDialog(true)
      this.$router.push('/')
      return
    }
    this.fetchData()
  },
  methods: {
    ...mapActions(useUserStore, ['setShowLoginDialog', 'fetchUserInfo']),
    async fetchData () {
      if (!this.uid) return
      try {
        const response = await userApi.getUserByUid(this.uid)
        const data = response.data || response
        this.userInfo = data.user
        this.comments = data.comments || []
        this.discussions = data.discussions || []
        this.discussions_count = data.discussions_count || 0
        this.comments_count = data.comments_count || 0
      } catch (error) {
        console.error('Fetch user profile error:', error)
        // 如果是访问自己的 profile 且接口报错，尝试从 store 中读取基本信息
        if (this.isMyProfile) {
          this.userInfo = this.user
        } else {
          this.$message.error('获取用户信息失败')
        }
      }
    },
    handleEditProfile () {
      const profile = this.userInfo || this.user || {}
      this.editForm = {
        name: profile.name || '',
        nickname: profile.nickname || '',
        website: profile.website || '',
        description: profile.description || '',
        email_notify_enabled: profile.email_notify_enabled === 'yes' ? 'yes' : 'no'
      }
      this.editDialogVisible = true
    },
    async handleAvatarUpload (e) {
      const file = e.target.files[0]
      if (!file) return
      try {
        const res = await userApi.getUploadUrl(file.name)
        const url = res.url
        await uploadToOss(file, url.url)
        await userApi.updateUserInfo({ avatar: url.object })
        this.$message.success('头像更新成功')
        await Promise.all([this.fetchData(), this.fetchUserInfo()])
      } catch (error) {
        this.$message.error('头像上传失败')
      } finally {
        e.target.value = ''
      }
    },
    async submitEditProfile () {
      this.editSubmitting = true
      try {
        const response = await userApi.updateUserInfo(this.editForm)
        const message = response?.message || response?.data?.message || '资料更新成功'
        this.$message.success(message)
        this.editDialogVisible = false
        await Promise.all([
          this.fetchData(),
          this.fetchUserInfo()
        ])
      } catch (error) {
        const message = error?.response?.data?.message || error?.response?.data?.messages?.[0] || '资料更新失败'
        this.$message.error(message)
      } finally {
        this.editSubmitting = false
      }
    },
    getCommentableLink (comment) {
      if (comment.commentable_type === 'articles') {
        return `/article/${comment.commentable?.slug}`
      }
      return `/discussion/${comment.commentable_id}`
    },
    renderComment (comment) {
      try {
        const content = JSON.parse(comment.content)
        return content.html || comment.raw
      } catch (e) {
        return comment.content
      }
    }
  },
  watch: {
    uid: {
      handler () {
        this.fetchData()
      }
    }
  }
}
</script>

<style scoped lang="scss">
.user-profile-container {
  min-height: calc(100vh - 60px);
}

.user-header-jumbotron {
  color: white;
  padding: 60px 0;
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
  align-items: center;

  .container {
    width: 100%;
    max-width: 1140px;
    margin: 0 auto;
  }
}

.profile-avatar {
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow: visible !important;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: -6px;
    left: -6px;
    right: -6px;
    bottom: -6px;
    border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: #409eff;
    border-right-color: #67c23a;
    opacity: 0;
    transition: opacity 0.3s ease;
    animation: none;
    pointer-events: none;
  }

  &:hover::after {
    opacity: 1;
    animation: spin-border 1s linear infinite;
  }

  &.clickable {
    cursor: pointer;
  }
}
/* 穿透到 el-avatar 内部，找到 img 标签 */
.profile-avatar :deep(img) {
  /* 强制图片本身变成圆形 */
  border-radius: 50%;
  /* 理论上这就够了，因为 img 标签本身变圆了，就不需要容器剪裁了 */
}

@keyframes spin-border {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.profile-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 24px;
  border-radius: 16px;
  color: var(--text-color);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(10px);

  .nickname {
    margin: 0 0 10px;
    font-size: 28px;
    font-weight: 600;
  }

  .description {
    font-size: 16px;
    opacity: 0.9;
    margin-bottom: 10px;
  }

  .website {
    margin-bottom: 15px;
    .el-link {
      color: #fff;
      text-decoration: underline;
      &:hover {
        opacity: 0.8;
      }
    }
  }

  .actions {
    margin-bottom: 15px;
  }

  .social-links {
    display: flex;
    justify-content: center;
  }

  .social-icon {
    font-size: 24px;
    color: white;
    margin-right: 15px;
  }
}

.profile-stats {
  .stat-item {
    padding: 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;

    .stat-value {
      font-size: 24px;
      font-weight: bold;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.8;
    }
  }
}

.content-row {
  max-width: 1140px;
  margin: 0 auto !important;
  padding-bottom: 50px;
}

.box-card {
  margin-bottom: 20px;
  border-radius: 8px;

  .card-header {
    font-weight: bold;
    color: #303133;
  }
}

.list-item {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;

  &:last-child {
    border-bottom: none;
  }

  .item-title {
    margin-bottom: 5px;
    a {
      color: #409eff;
      text-decoration: none;
      font-weight: 500;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .meta {
    font-size: 12px;
    color: #909399;
  }

  .item-content {
    font-size: 14px;
    color: #606266;
    margin-top: 5px;
    background: #f8f9fa;
    padding: 8px;
    border-radius: 4px;
  }
}

.nothing {
  text-align: center;
  padding: 30px;
  color: #909399;
}

.user-items-wrapper {
  margin-top: 20px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .user-header-jumbotron {
    padding: 30px 20px;
    text-align: center;
  }

  .profile-content {
    margin-top: 20px;
    align-items: center;

    .social-links {
      justify-content: center;
    }

    .social-icon {
      margin: 0 7px;
    }
  }

  .profile-stats {
    margin-top: 20px;
  }

  .content-row {
    padding: 0 10px;
  }
}
</style>
