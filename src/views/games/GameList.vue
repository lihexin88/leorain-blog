<script>
import api from '@/apis/base'
import { getFriendlyDate, maxString, syncUrlPaginate } from '@/utils/helpers'
import { VideoPlay, ChatLineRound, Clock } from '@element-plus/icons-vue'

export default {
  tdk () {
    return {
      title: '童年NES游戏模拟器 - 经典红白机游戏在线玩',
      description: '重温童年回忆，在线免费玩经典NES红白机游戏。收录超级马里奥、魂斗罗、坦克大战等数百款经典游戏，无需下载，即点即玩，支持存档读档，完美还原童年游戏体验。',
      keywords: 'NES游戏模拟器,红白机游戏,FC游戏,童年游戏,超级马里奥,魂斗罗,坦克大战,在线游戏,怀旧游戏,经典游戏'
    }
  },
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
        current_page: 1,
        per_page: 12,
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
            page_size: this.pagination.per_page
          }
        })
        if (response.data) {
          this.games = response.data
          this.pagination = response.meta.pagination
          if (this.pagination.current_page === 1) {
            syncUrlPaginate({
              current_page: null,
              per_page: null
            })
          } else {
            syncUrlPaginate({
              current_page: this.pagination.current_page,
              per_page: this.pagination.per_page
            })
          }
        } else {
          this.games = response.data
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
          <img :src="game.cover_image" :alt="game.name" class="image"/>
        </div>
        <div class="game-info">
          <div class="game-title" :title="game.name">
            {{ maxString(game.name, 24) }}
          </div>
          <div class="game-meta">
            <span><el-icon><VideoPlay/></el-icon> {{ game.played }}</span>
            <span><el-icon><ChatLineRound/></el-icon> {{ game.comment_count || 0 }}</span>
            <span><el-icon><Clock/></el-icon> {{ getFriendlyDate(game.created_at) }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <div class="pagination-container">
      <el-pagination
          v-model:current-page="pagination.current_page"
          :page-size="pagination.per_page"
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
