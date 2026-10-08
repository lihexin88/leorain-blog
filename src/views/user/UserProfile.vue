<template>
  <div class="user-profile-container">
    <!-- 顶部资料卡 -->
    <section class="profile-hero">
      <div class="profile-hero-bg" aria-hidden="true"></div>
      <div class="profile-hero-inner container">
        <div class="profile-card">
          <div class="profile-main">
            <div class="avatar-wrap" :class="{ clickable: isMyProfile }" @click="isMyProfile && $refs.avatarInput.click()">
              <el-avatar
                :size="112"
                :src="userInfo.avatar || defaultAvatar"
                class="profile-avatar"
                shape="circle"
                fit="cover"
              />
              <span v-if="isMyProfile" class="avatar-edit-hint">
                <i class="fas fa-camera"></i>
              </span>
              <input
                v-if="isMyProfile"
                ref="avatarInput"
                type="file"
                accept="image/*"
                class="avatar-input"
                @change="handleAvatarUpload"
              />
            </div>

            <div class="profile-info">
              <div class="name-row">
                <h1 class="nickname">{{ userInfo.nickname || userInfo.name || '未命名用户' }}</h1>
                <el-button
                  v-if="isMyProfile"
                  class="edit-btn"
                  type="primary"
                  size="small"
                  round
                  @click="handleEditProfile"
                >
                  <i class="fas fa-pen"></i>
                  编辑资料
                </el-button>
              </div>

              <p class="description">{{ userInfo.description || '这个人不懒，只是还没有写简介～' }}</p>

              <div class="profile-meta">
                <div class="meta-item" v-if="userInfo.website">
                  <i class="fas fa-link"></i>
                  <el-link :href="normalizedWebsite" target="_blank" type="primary" :underline="false">
                    {{ userInfo.website }}
                  </el-link>
                </div>
                <div class="meta-item muted" v-else>
                  <i class="fas fa-link"></i>
                  <span>暂无网站</span>
                </div>

                <span class="meta-dot" aria-hidden="true" v-if="userInfo.created_at"></span>

                <div class="meta-item" v-if="userInfo.created_at">
                  <i class="fas fa-calendar-alt"></i>
                  <time :datetime="userInfo.created_at">
                    {{ moment(userInfo.created_at).format('YYYY年MM月DD日') }} 加入
                  </time>
                </div>
              </div>

              <div class="oauth-row">
                <el-link
                  v-for="item in oauthProviderItems"
                  :key="item.provider"
                  :href="item.href"
                  :target="item.href ? '_blank' : '_self'"
                  underline="never"
                  class="oauth-chip"
                  :class="{ bound: item.bound, unbound: !item.bound, 'is-clickable': !!item.href }"
                >
                  <i :class="item.icon"></i>
                  <span>{{ item.bound ? (item.name || item.label) : item.label }}</span>
                </el-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 内容区 -->
    <section class="profile-body container">
      <el-row :gutter="20">
        <el-col :xs="24" :md="12">
          <el-card class="box-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="card-header-icon comments"><i class="fas fa-comments"></i></span>
                <span>最近评论</span>
              </div>
            </template>
            <div v-if="comments && comments.length" class="activity-list">
              <div v-for="comment in comments" :key="comment.id" class="activity-item">
                <div class="activity-title">
                  <router-link :to="getCommentableLink(comment)">
                    {{ comment.commentable?.title || '未知内容' }}
                  </router-link>
                  <span class="activity-time">{{ comment.created_at_human }}</span>
                </div>
                <div class="activity-content">
                  <markdown-parse @click="openSource(comment)" class="clickable" :content="renderComment(comment)"></markdown-parse>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="fas fa-comment-slash"></i>
              <p>暂无评论</p>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card class="box-card" shadow="hover" v-if="false">
            <template #header>
              <div class="card-header">
                <span class="card-header-icon discussions"><i class="fas fa-fire"></i></span>
                <span>最近讨论</span>
              </div>
            </template>
            <div v-if="discussions && discussions.length" class="activity-list">
              <div v-for="discussion in discussions" :key="discussion.id" class="activity-item discussion-item">
                <router-link class="discussion-link" :to="'/discussion/' + discussion.id">
                  <i class="fas fa-hashtag"></i>
                  <span class="discussion-title">{{ discussion.title }}</span>
                </router-link>
                <span class="activity-time">{{ discussion.created_at_human }}</span>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="fas fa-inbox"></i>
              <p>暂无讨论</p>
            </div>
          </el-card>

          <div v-if="isMyProfile" class="user-items-wrapper">
            <UserItems />
          </div>
        </el-col>
      </el-row>
    </section>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑资料"
      append-to-body
      class="edit-profile-dialog"
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
          <el-input v-model="editForm.website" placeholder="请输入网站地址，如 www.example.com" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="editForm.description" type="textarea" :rows="4" placeholder="介绍一下自己吧" />
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
import authApi from '@/apis/auth'
import { uploadToOss } from '@/utils/oss-file'
import UserItems from '@/components/UserItems.vue'
import MarkdownParse from '@/components/MarkdownParse.vue'
import moment from 'moment'

export default {
  name: 'UserProfile',
  components: {
    MarkdownParse,
    UserItems
  },
  data () {
    return {
      userInfo: {},
      comments: [],
      discussions: [],
      discussions_count: 0,
      comments_count: 0,
      defaultAvatar: 'https://images.leorain.cn/avatar/default_avatar.png',
      editDialogVisible: false,
      editSubmitting: false,
      authConfig: {},
      oauthProviders: [
        { provider: 'github', label: 'GitHub', icon: 'fab fa-github' },
        { provider: 'gitee', label: 'Gitee', icon: 'fab fa-gitee' },
        { provider: 'linuxdo', label: 'LinuxDo', icon: 'fab fa-linuxdo' }
      ],
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
    },
    oauthAccounts () {
      return Array.isArray(this.userInfo?.oauth) ? this.userInfo.oauth : []
    },
    oauthProviderItems () {
      return this.oauthProviders.map(provider => {
        const account = this.oauthAccounts.find(item => item.provider === provider.provider)
        return {
          ...provider,
          account,
          bound: Boolean(account),
          name: account?.nickname || account?.name || account?.provider_user_id,
          href: account?.url || this.authConfig?.[provider.provider]?.auth_url || null
        }
      })
    },
    normalizedWebsite () {
      const url = this.userInfo?.website
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      return '//' + url
    }
  },
  mounted () {
    if (!this.uid) {
      this.setShowLoginDialog(true)
      this.$router.push('/')
      return
    }
    this.fetchData()
    this.getAuthConfig()
  },
  methods: {
    moment,
    ...mapActions(useUserStore, ['setShowLoginDialog', 'fetchUserInfo']),
    getAuthConfig () {
      authApi.getConfig().then(res => {
        this.authConfig = res
      })
    },
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
    },
    openSource (comment) {
      const url = this.getCommentableLink(comment) + '#comment_id_' + comment.id
      window.open(url, '_blank')
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
  padding-bottom: 48px;
}

.container {
  width: 100%;
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 20px;
}

/* ========== Hero ========== */
.profile-hero {
  position: relative;
  padding: 48px 0 36px;
  margin-bottom: 8px;
  overflow: hidden;
}

.profile-hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 20%, color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 28%, transparent), transparent 60%),
    radial-gradient(ellipse 70% 50% at 85% 30%, color-mix(in srgb, var(--theme-primary-light-3, #51bef1) 22%, transparent), transparent 55%),
    linear-gradient(180deg, color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 8%, transparent) 0%, transparent 100%);
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.18) 1px, transparent 0);
    background-size: 28px 28px;
    opacity: 0.35;
    mask-image: linear-gradient(180deg, #000 30%, transparent 100%);
  }
}

.profile-hero-inner {
  position: relative;
  z-index: 1;
}

.profile-card {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 28px 32px;
  border-radius: 20px;
  background: var(--article-item-bg, rgba(255, 255, 255, 0.92));
  border: 1px solid var(--article-border, rgba(0, 0, 0, 0.06));
  box-shadow: var(
    --article-box-shadow,
    0 10px 30px rgba(0, 0, 0, 0.06),
    0 16px 34px rgba(15, 23, 42, 0.06)
  );
  backdrop-filter: blur(12px);
  color: var(--card-text-color, var(--text-color, #111827));
}

.profile-main {
  display: flex;
  align-items: flex-start;
  gap: 28px;
}

/* Avatar */
.avatar-wrap {
  position: relative;
  flex-shrink: 0;
  width: 112px;
  height: 112px;
  border-radius: 50%;

  &.clickable {
    cursor: pointer;

    &:hover {
      .avatar-edit-hint {
        opacity: 1;
      }

      .profile-avatar {
        transform: scale(1.02);
      }
    }
  }
}

.profile-avatar {
  border: 3px solid color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 45%, #fff);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 12%, transparent),
    0 8px 24px rgba(0, 0, 0, 0.12);
  transition: transform 0.25s ease;
  overflow: hidden !important;
}

.profile-avatar :deep(img) {
  border-radius: 50%;
}

.avatar-edit-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.45);
  color: #fff;
  font-size: 20px;
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.avatar-input {
  display: none;
}

/* Info */
.profile-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.nickname {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--card-text-color, var(--text-color, #111827));
}

.edit-btn {
  i {
    margin-right: 6px;
  }
}

.description {
  margin: 0;
  max-width: 48em;
  font-size: 15px;
  line-height: 1.65;
  color: var(--muted-text-color, #6b7280);
  word-break: break-word;
}

/* 网站 / 加入时间 —— 同一行扁平 meta */
.profile-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  font-size: 13px;
  color: var(--muted-text-color, #6b7280);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  line-height: 1.4;

  i {
    flex-shrink: 0;
    width: 14px;
    text-align: center;
    font-size: 12px;
    color: var(--theme-accent-color, #0ea5e9);
    opacity: 0.85;
  }

  &.muted {
    color: var(--muted-text-color, #9ca3af);

    i {
      color: currentColor;
      opacity: 0.7;
    }
  }

  time {
    font-variant-numeric: tabular-nums;
  }

  :deep(.el-link) {
    font-size: 13px;
    font-weight: 500;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.meta-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.35;
  flex-shrink: 0;
}

/* 三方账号 —— 简洁 chip，去掉标题文案 */
.oauth-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.oauth-chip {
  display: inline-flex !important;
  align-items: center;
  gap: 6px;
  max-width: 160px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1.4;
  border: 1px solid transparent;
  text-decoration: none !important;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;

  :deep(.el-link__inner) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  i {
    flex-shrink: 0;
    font-size: 13px;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.bound {
    color: var(--card-text-color, var(--text-color, #111827)) !important;
    background: color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 10%, transparent);
    border-color: color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 18%, transparent);

    i {
      color: var(--theme-accent-color, #0ea5e9);
    }
  }

  &.unbound {
    color: var(--muted-text-color, #9ca3af) !important;
    background: color-mix(in srgb, var(--muted-text-color, #9ca3af) 8%, transparent);
    border-color: color-mix(in srgb, var(--muted-text-color, #9ca3af) 16%, transparent);
    opacity: 0.85;
  }

  &.is-clickable:hover {
    opacity: 1;
    background: color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 14%, transparent);
    border-color: color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 28%, transparent);
  }
}

/* Stats */
.profile-stats {
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  gap: 8px;
  padding: 16px 8px 4px;
  border-top: 1px solid var(--article-border, rgba(0, 0, 0, 0.06));
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 8px 12px;
  border-radius: 12px;
  transition: background 0.2s ease;

  &:hover {
    background: color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 6%, transparent);
  }
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--theme-accent-color, #0ea5e9);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  margin-top: 4px;
  font-size: 13px;
  color: var(--muted-text-color, #6b7280);
}

.stat-divider {
  width: 1px;
  align-self: stretch;
  margin: 8px 0;
  background: var(--article-border, rgba(0, 0, 0, 0.08));
}

/* ========== Body cards ========== */
.profile-body {
  padding-top: 12px;
  padding-bottom: 24px;
}

.box-card {
  margin-bottom: 20px;
  border-radius: 16px !important;
  border: 1px solid var(--article-border, rgba(0, 0, 0, 0.06)) !important;
  background: var(--article-item-bg, #fff) !important;
  box-shadow: var(--article-box-shadow, 0 8px 24px rgba(0, 0, 0, 0.05)) !important;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--article-border, rgba(0, 0, 0, 0.06));
    background: color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 4%, transparent);
  }

  :deep(.el-card__body) {
    padding: 8px 12px 12px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 15px;
  color: var(--card-text-color, var(--text-color, #303133));
}

.card-header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 13px;
  color: #fff;

  &.comments {
    background: linear-gradient(135deg, #0ea5e9, #6366f1);
  }

  &.discussions {
    background: linear-gradient(135deg, #f59e0b, #ef4444);
  }
}

.activity-list {
  display: flex;
  flex-direction: column;
}

.activity-item {
  padding: 14px 12px;
  border-bottom: 1px solid var(--article-border, #ebeef5);
  border-radius: 10px;
  transition: background 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 5%, transparent);
  }
}

.activity-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;

  a {
    color: var(--theme-accent-color, #409eff);
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    line-height: 1.4;
    word-break: break-word;

    &:hover {
      text-decoration: underline;
    }
  }
}

.activity-time {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--muted-text-color, #909399);
  white-space: nowrap;
}

.activity-content {
  font-size: 14px;
  color: var(--text-color, #606266);
  line-height: 1.55;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--theme-el-fill-color-light, #f5f7fa);
  border: 1px solid var(--article-border, transparent);
  overflow: hidden;

  :deep(p) {
    margin: 0 0 0.4em;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 6px;
  }
}

.discussion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.discussion-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--theme-accent-color, #409eff);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;

  i {
    flex-shrink: 0;
    opacity: 0.7;
    font-size: 12px;
  }

  .discussion-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    text-decoration: underline;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 16px;
  color: var(--muted-text-color, #909399);

  i {
    font-size: 28px;
    opacity: 0.45;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.user-items-wrapper {
  margin-top: 4px;
  transition: all 0.3s ease-in-out;
}

/* ========== Responsive ========== */
@include mobile {
  .profile-hero {
    padding: 24px 0 16px;
  }

  .container {
    padding: 0 12px;
  }

  .profile-card {
    padding: 20px 16px;
    border-radius: 16px;
  }

  .profile-main {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }

  .profile-info {
    align-items: center;
    width: 100%;
  }

  .name-row {
    justify-content: center;
    flex-direction: column;
  }

  .nickname {
    font-size: 24px;
  }

  .profile-meta,
  .oauth-row {
    justify-content: center;
  }

  .profile-stats {
    padding-top: 12px;
  }

  .stat-value {
    font-size: 22px;
  }

  .activity-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .discussion-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .discussion-link .discussion-title {
    white-space: normal;
  }
}
</style>
