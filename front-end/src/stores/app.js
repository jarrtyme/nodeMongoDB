import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    title: '官网项目',
    version: '1.0.0'
  }),
  getters: {
    appInfo: (state) => `${state.title} v${state.version}`
  },
  actions: {
    setTitle(title) {
      this.title = title
    }
  }
})
