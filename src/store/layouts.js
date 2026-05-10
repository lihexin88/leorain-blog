import { defineStore } from 'pinia'

export const useLayoutsStore = defineStore('layouts', {
  state: () => ({
    isMobile: window.innerWidth / window.innerHeight <= 0.7
  })
})
