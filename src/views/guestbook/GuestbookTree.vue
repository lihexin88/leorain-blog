<template>
  <div style="padding-top: 3px;padding-left: 2px" @mouseover="show_replay=true" @mouseleave="!deletePopconfirmVisible && (show_replay=false)">
    <el-card body-style="padding: 2px 0 0 6px;" class="box-card">
      <div class="card-body">
        <div>
          <div class="card-title-area">
            <div class="guestbook-heading-tips">
              <el-link :href="`/user/profile?uid=`+guestbook.user.uid">
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
            <div class="pointer-style guestbook-heading-tips" style="padding: 2px;" v-if="user && show_replay">
              <el-popconfirm title="确定要删除这条留言吗？" @confirm="deleteThisGuestbook" v-model:visible="deletePopconfirmVisible">
                <template #reference>
                  <el-button class="card-replay-button" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
          <div class="card-content-area">
            <div style="width: 95%">
              <markdown-parse :content="guestbook.content"></markdown-parse>
            </div>
          </div>
          <div v-show="isReplayActive">
            <el-card>
              <guestbook-form :guestbook="guestbook" @replay="setActiveId"></guestbook-form>
            </el-card>
          </div>
        </div>
        <div v-if="hasChildren">
          <transition-group name="gb-item" tag="div">
            <guestbook-tree v-for="children in guestbook.children" @replay="setActiveId" @deleted="removeChild"
                            :activeId="activeId" :key="children.id" :guestbook="children"/>
          </transition-group>
        </div>
      </div>
    </el-card>
  </div>
</template>
<script>
import GuestbookForm from './GuestbookForm.vue'
import moment from 'moment'
import { getFriendlyDate } from '@/utils/helpers'
import MarkdownParse from '@/components/MarkdownParse.vue'
import { guestbookApi } from '@/apis'
import { mapState } from 'pinia'
import { useUserStore } from '@/store/user'

export default {
  name: 'GuestbookTree',
  components: { GuestbookForm, MarkdownParse },
  props: {
    guestbook: {
      type: Object,
      default: () => ({})
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
      guestbookApi.getGuestbookDetail(this.guestbook.id).then(response => {
        this.guestbook.children = []
        response.forEach(item => {
          this.guestbook.children.push(item)
        })
      })
    },
    get_avatar (guestbook) {
      if (guestbook?.user?.avatar) {
        return guestbook.user.avatar
      } else {
        return this.avatar + guestbook.user.email_hash
      }
    },
    deleteThisGuestbook () {
      guestbookApi.deleteGuestbook(this.guestbook.id).then(() => {
        this.$emit('deleted', this.guestbook.id)
      })
    },
    removeChild (id) {
      this.guestbook.children = this.guestbook.children.filter(c => c.id !== id)
    }
  },
  mounted () {
    if (this.guestbook.descendants_count > 0) {
      this.show_guestbook()
    }
  },
  data () {
    return {
      nodeReplayId: 'replay_' + Math.random().toString(36).substr(2),
      avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=',
      show_replay: false,
      deletePopconfirmVisible: false
    }
  },
  computed: {
    ...mapState(useUserStore, ['user']),
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
  background: linear-gradient(90deg, rgba(0, 247, 222, 0.08), rgba(0, 247, 222, 0.03));
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(0, 247, 222, 0.1);
  border-radius: 4px 4px 0 0;
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
  justify-content: center;
}

.guestbook-heading-tips {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-right: 15px;
  font-size: .9em;
}

.box-card {
  transition: box-shadow 0.3s ease, transform 0.25s ease;
  border-radius: 6px;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 247, 222, 0.15), 0 2px 8px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }
}

/* 子列表进出动效 */
.gb-item-enter-active {
  animation: gb-slide-in 0.35s ease;
}

.gb-item-leave-active {
  animation: gb-slide-out 0.25s ease forwards;
}

.gb-item-move {
  transition: transform 0.3s ease;
}

@keyframes gb-slide-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes gb-slide-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}
</style>
