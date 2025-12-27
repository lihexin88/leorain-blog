<template>
  <div style="padding-top: 3px;padding-left: 2px" @mouseover="show_replay=true" @mouseleave="show_replay=false">
    <el-card body-style="padding: 2px 0 0 6px;" class="box-card">
      <div class="card-body">
        <div>
          <div class="card-title-area">
            <div class="guestbook-heading-tips">
              <el-link :href="`/user/`+guestbook.user.name">
                <el-avatar :src="get_avatar(guestbook)"></el-avatar>&nbsp;{{ guestbook.user.name??'-' }}
              </el-link>
            </div>
            <div class="guestbook-heading-tips" :title="guestbook.created_at">
              <i class="el-icon-time"></i> {{
                getFriendlyDate(moment(guestbook.created_at).format("YYYY-MM-DD HH:mm:ss"))
              }}
            </div>
            <div class="guestbook-heading-tips" v-if="guestbook.visitor">
              <i class="fa fa-map-marker-alt"></i>{{ guestbook.visitor?.country ?? null }}
            </div>
            <div class="guestbook-heading-tips" v-if="guestbook.visitor">
              <i class="fa fa-globe"></i>{{ guestbook.visitor?.user_agent ?? null }}
            </div>
            <div class="pointer-style guestbook-heading-tips" style="padding: 2px;" v-show="show_replay">
              <el-button class="card-replay-button" type="success" @click="showThisReplay">回复</el-button>
            </div>
          </div>
          <div class="card-content-area">
            <div style="width: 95%">
              <parse :content="guestbook.content"></parse>
            </div>
          </div>
          <div v-show="isReplayActive">
            <el-card>
              <guestbook-form :guestbook="guestbook" @replay="setActiveId"></guestbook-form>
            </el-card>
          </div>
        </div>
        <div v-if="hasChildren">
          <guestbook-tree v-for="children in guestbook.children" @replay="setActiveId" :activeId="activeId"
                          :key="children.id" :guestbook="children"/>
          <div v-if="guestbook.descendants_count > 1 && !show_all" class="pointer-style" @click="show_guestbook">... 展开
          </div>
          <div v-if="show_all" class="pointer-style" @click="hide_guestbook">折叠^</div>
        </div>
      </div>
    </el-card>
  </div>
</template>
<script>
import GuestbookForm from './GuestbookForm.vue'
import moment from 'moment'
import { getFriendlyDate } from '../../../config/helper'

export default {
  name: 'GuestbookTree',
  components: { GuestbookForm },
  props: {
    guestbook: {
      type: Object,
      default: {}
    },
    activeId: {
      type: String,
      default: ''
    }
  },
  methods: {
    getFriendlyDate,
    showThisReplay () {
      this.$emit('replay', this.nodeReplayId)
    },
    setActiveId (id) {
      this.$emit('replay', id)
    },
    show_guestbook () {
      this.$http.get('frontend/guestbooks/' + this.guestbook.id).then(response => {
        this.guestbook.children = []
        response.data.forEach(item => {
          this.guestbook.children.push(item)
        })
        this.show_all = true
      })
    },
    hide_guestbook () {
      // 点击折叠
      this.show_all = false
      this.guestbook.children = this.guestbook.children.slice(0, 1)
      if (this.guestbook.children.length > 0) {
        this.guestbook.children[0].children = []
      }
    },
    get_avatar (guestbook) {
      if (guestbook?.user?.avatar) {
        return guestbook.user.avatar
      } else {
        return this.avatar + guestbook.user.email_hash
      }
    }
  },
  data () {
    return {
      nodeReplayId: 'replay_' + Math.random().toString(36).substr(2),
      show_all: false,
      avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=',
      show_replay: false
    }
  },
  computed: {
    moment () {
      return moment
    },
    hasChildren () {
      return this.guestbook.children && this.guestbook.children.length > 0
    },
    isReplayActive () {
      return this.activeId === this.nodeReplayId
    }
  }
}
</script>

<style scoped lang="scss">
.card-body {
  padding: 0 !important;
  border: 0;
}

.card-title-area {
  background-color: #00f7de14;
  display: flex;
  align-items: center;
}

.card-content-area {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.card-replay-button {
  height: 20px;
  display: flex;
  align-items: center;
  width: 36px;
  padding: 2px;
  justify-content: center
}

.guestbook-heading-tips {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-right: 15px;
  font-size: .9em;
}
</style>
