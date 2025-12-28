<template>
  <div class="guest-input-form">
    <div>
      <div style="padding-right: 5px;cursor: pointer" @click="sampleAvatar = !sampleAvatar">
        <el-avatar shape="circle" :size="60" :src="avatar"></el-avatar>
      </div>
    </div>
    <div :show="!sampleAvatar">
      <modal :show="!sampleAvatar" @cancel="sampleAvatar = !sampleAvatar">
        <div slot="title" style="font-size: .9em;"><i>访客信息</i></div>
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
        <div slot="footer">
          <el-button @click="saveGuestInfo">确认</el-button>
        </div>
      </modal>
    </div>
  </div>
</template>

<script>
import MD5 from "crypto-js/md5";
import Modal from "./Modal.vue";

export default {
  components: {Modal},
  props: {},
  data() {
    return {
      guest: {
        avatar: this.guestAvatarPrefix,
        name: null,
        email: null,
        website: null,
      },
      guestAvatarPrefix: "https://api.dicebear.com/9.x/adventurer/svg?seed=",
      sampleAvatar: true
    }
  },
  mounted() {
    if (!this.user?.uid) {
      let guestCache = this.getGuestInfo()
      if (guestCache === undefined) {
        return
      }
      this.guest = guestCache
      if (this.guest === undefined) {
        return
      }
      if (this.guest.name === null || this.guest.email === null) {
        this.sampleAvatar = false
      }
    }
  },
  methods: {
    saveGuestInfo() {
      localStorage.setItem('guest_info', JSON.stringify({
        nickname: this.guest.name,
        email: this.guest.email,
        website: this.guest.website
      }))
      this.sampleAvatar = true
    },
    validateData() {
      if (!this.guest?.name) {
        toastr.error("用户名不能为空")
        this.sampleAvatar = false
        return false
      }
      if (!this.guest?.email) {
        toastr.error("邮箱不能为空")
        this.sampleAvatar = false
        return false
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(this.guest.email)) {
          this.sampleAvatar = false
          toastr.error("邮箱格式不正确")
          return false
        }
      }
      return true
    },
    getGuestInfo() {
      const guestInfo = localStorage.getItem('guest_info')
      if (guestInfo === null) {
        return
      }
      let guestObject = null
      if (guestInfo) {
        guestObject = JSON.parse(guestInfo)
      }
      if (guestObject == null) {
        return
      }
      this.guest.name = guestObject.nickname
      this.guest.email = guestObject.email
      this.guest.website = guestObject.website
      return this.guest
    },
  },
  computed: {
    avatar() {
      return this.guestAvatarPrefix + MD5(this.guest?.email).toString()
    }
  },
  watch: {}
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