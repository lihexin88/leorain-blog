import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useArticleStore = defineStore('articleApi', () => {
  const articles = ref([])
  const total = ref(0)
  const page = ref(1)
  const per_page = ref(22)

  function setArticles(newArticles) {
    articles.value = newArticles
  }

  function setTotal(newTotal) {
    total.value = newTotal
  }

  function setPage(newPage) {
    page.value = newPage
  }

  function setPerPage(newPerPage) {
    per_page.value = newPerPage
  }

  return { articles, total, page, per_page, setArticles, setTotal, setPage, setPerPage }
})

export const useAppStore = defineStore('app', () => {
  const isLoading = ref(false)

  function setLoading(loading) {
    isLoading.value = loading
  }

  return { isLoading, setLoading }
})
