<script>
import api from '@/apis/base'
import { getFriendlyDate, maxString } from '@/utils/helpers'
import { VideoPlay, ChatLineRound, Clock } from '@element-plus/icons-vue'

export default {
  name: 'GameList',
  components: {
    VideoPlay,
    ChatLineRound,
    Clock
  },
  data () {
    return {
      games: [],
      loading: false,
      pagination: {
        currentPage: 1,
        pageSize: 12,
        total: 0
      }
    }
  },
  mounted () {
    this.fetchGames()
  },
  methods: {
    getFriendlyDate,
    maxString,
    async fetchGames (page = 1) {
      this.loading = true
      try {
        const response = await api.get('/games', {
          params: {
            page,
            page_size: this.pagination.pageSize
          }
        })
        if (response.data) {
          this.games = response.data
          this.pagination.currentPage = response.current_page
          this.pagination.total = response.total
        } else {
          this.games = response
        }
      } catch (error) {
        console.error('Failed to fetch games:', error)
      } finally {
        this.loading = false
      }
    },
    handlePageChange (page) {
      this.fetchGames(page)
    },
    goToGame (game) {
      this.$router.push({ name: 'GamePlay', params: { slug: game.slug } })
    }
  }
}
</script>

<template>
  <div class="game-list-container" v-loading="loading">
    <div class="game-grid">
      <el-card
        v-for="game in games"
        :key="game.id"
        class="game-card"
        :body-style="{ padding: '0px' }"
        @click="goToGame(game)"
      >
        <div class="game-cover">
          <img :src="game.cover_image" :alt="game.name" class="image" />
        </div>
        <div class="game-info">
          <div class="game-title" :title="game.name">
            {{ maxString(game.name, 24) }}
          </div>
          <div class="game-meta">
            <span><el-icon><VideoPlay /></el-icon> {{ game.played }}</span>
            <span><el-icon><ChatLineRound /></el-icon> {{ game.comments_count || 0 }}</span>
            <span><el-icon><Clock /></el-icon> {{ getFriendlyDate(game.created_at) }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        :page-size="pagination.pageSize"
        layout="prev, pager, next, total"
        :total="pagination.total"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.game-list-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .game-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .game-card {
    cursor: pointer;
    transition: transform 0.3s;
    border-radius: 8px;
    overflow: hidden;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .game-cover {
      width: 100%;
      height: 160px;
      overflow: hidden;
      background-color: #f5f7fa;

      .image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .game-info {
      padding: 12px;

      .game-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .game-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #909399;

        span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }
  }

  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
