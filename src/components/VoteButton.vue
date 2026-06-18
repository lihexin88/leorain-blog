<template>
  <span class="vote-button">
    <button class="vote-btn" :disabled="voting" :aria-label="item.is_up_voted ? '取消赞' : '赞'" @click="upVote(item.id)">
      <i :class="item.is_up_voted ? 'fas fa-thumbs-up text-success' : 'far fa-thumbs-up'"></i>
      <small v-if="item.vote_count > 0">{{ item.vote_count }}</small>
    </button>
    <button v-if="show_down_vote" class="vote-btn" :disabled="voting" :aria-label="item.is_down_voted ? '取消踩' : '踩'" @click="downVote(item.id)">
      <i :class="item.is_down_voted ? 'fas fa-thumbs-down text-danger' : 'far fa-thumbs-down'"></i>
    </button>
  </span>
</template>

<script>
import { useUserStore } from '@/store/user'
import { mapActions } from 'pinia'

export default {
  props: {
    item: {
      type: Object,
      default () {
        return {}
      }
    },
    show_down_vote: {
      type: Boolean,
      default: false
    },
    api: {
      type: String,
      default: 'comments'
    }
  },
  data () {
    return {
      voting: false
    }
  },
  methods: {
    ...mapActions(useUserStore, ['setShowLoginDialog']),
    upVote (id) {
      this.toggleVote(id, 'up')
    },
    downVote (id) {
      this.toggleVote(id, 'down')
    },
    toggleVote (id, type) {
      if (this.voting) return
      this.voting = true
      let url = this.api + '/vote/' + type
      let upType = 'is_up_voted'
      let downType = 'is_down_voted'
      let checkType = type == 'up' ? downType : upType
      let votingType = type == 'up' ? upType : downType

      this.$http.post(url, { id })
        .then(() => {
          if (this.item[checkType]) {
            this.item[upType] = !this.item[upType]
            this.item[downType] = !this.item[downType]
            type == 'up' ? this.item.vote_count++ : this.item.vote_count--
          } else {
            this.item[votingType] = !this.item[votingType]
            if (type == 'up') this.item[upType] ? this.item.vote_count++ : this.item.vote_count--
          }
        }).catch((response) => {
          if (response.status == 401) {
            this.setShowLoginDialog(true)
          }
        }).finally(() => {
          this.voting = false
        })
    }
  }
}
</script>

<style scoped>
.vote-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: inherit;
}
.vote-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.vote-btn:hover:not(:disabled) {
  background: rgba(0,0,0,0.05);
}
</style>
