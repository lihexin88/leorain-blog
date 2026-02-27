<template>
  <div class="guest-input-form">
    <div>
      <div style="padding-right: 5px;cursor: pointer" @click="showDialog = true">
        <el-avatar shape="circle" :size="60" :src="avatar"></el-avatar>
      </div>
    </div>
    <el-dialog v-model="showDialog">
      <template v-slot:header>
        <div style="font-size: .9em;"><i>访客信息</i></div>
      </template>
      <div
          style="display: flex;justify-content:center;cursor: pointer;padding-bottom: 5px;padding-top: 5px;align-items: center">
        <el-avatar shape="circle" :size="60" :src="avatar"></el-avatar>
      </div>
      <div class="guest-input-box">
        <div class="guest-input">
          <div class="guest-input-tip">
            *昵称：
          </div>
          <el-input class="guest-input-item" v-model="guest.name" :clearable="true"
                    resize="horizontal" placeholder="用户名"></el-input>
        </div>
        <div class="guest-input">
          <div class="guest-input-tip">
            *邮箱：
          </div>
          <el-input class="guest-input-item" type="email" v-model="guest.email" :clearable="true"
                    placeholder="邮箱">
          </el-input>
        </div>
        <div class="guest-input">
          <div class="guest-input-tip">
            网址：
          </div>
          <el-input class="guest-input-item" v-model="guest.website" :clearable="true"
                    placeholder="网址(选填)"></el-input>
        </div>
      </div>
      <template v-slot:footer>
        <div>
          <el-button @click="saveGuestInfo">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import MD5 from 'crypto-js/md5'
import debounce from 'lodash/debounce'

export default {
  components: {},
  props: {},
  data () {
    return {
      guest: {
        name: null,
        email: null,
        website: null
      },
      avatar: '',
      guestAvatarPrefix: 'https://api.dicebear.com/9.x/adventurer/svg?seed=',
      showDialog: false,
      debouncedUpdateAvatar: null
    }
  },
  watch: {
    'guest.email': {
      handler (val) {
        if (!this.avatar || this.avatar === this.guestAvatarPrefix + MD5('').toString()) {
          this.updateAvatar(val)
        } else {
          this.debouncedUpdateAvatar(val)
        }
      },
      immediate: true
    }
  },
  created () {
    this.debouncedUpdateAvatar = debounce((val) => {
      this.updateAvatar(val)
    }, 1000)
  },
  mounted () {
    this.loadGuestInfo()
    if (!this.guest.name || !this.guest.email) {
      this.showDialog = true
    }
  },
  beforeUnmount () {
    if (this.debouncedUpdateAvatar) {
      this.debouncedUpdateAvatar.cancel()
    }
  },
  methods: {
    updateAvatar (val) {
      this.avatar = this.guestAvatarPrefix + MD5(val || '').toString()
    },
    loadGuestInfo () {
      const guestInfo = localStorage.getItem('guest_info')
      if (guestInfo) {
        try {
          const guestObject = JSON.parse(guestInfo)
          this.guest.name = guestObject.nickname
          this.guest.email = guestObject.email
          this.guest.website = guestObject.website
        } catch (e) {
          console.error('Failed to parse guest_info', e)
        }
      }
    },
    saveGuestInfo () {
      if (!this.validateData()) {
        return
      }
      localStorage.setItem('guest_info', JSON.stringify({
        nickname: this.guest.name,
        email: this.guest.email,
        website: this.guest.website
      }))
      this.showDialog = false
      this.$emit('update')
    },
    validateData () {
      if (!this.guest?.name) {
        this.$message.error('用户名不能为空')
        return false
      }
      if (!this.guest?.email) {
        this.$message.error('邮箱不能为空')
        return false
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(this.guest.email)) {
          this.$message.error('邮箱格式不正确')
          return false
        }
      }
      return true
    }
  }
}
</script>
<style scoped lang="scss">

.guest-input-form {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
}

.guest-input-box {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap
}

.guest-input {
  display: flex;
  width: 100%;
  align-items: center;
  padding-bottom: 10px;
}

.guest-input-tip {
  width: 15%;
}

.guest-input-item {
  width: 100%;
  padding: 5px;
}
</style>
