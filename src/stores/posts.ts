import { defineStore } from 'pinia'

export const usePostsStore = defineStore('posts', {
  state: () => ({
    posts: [] as any[],
    favoritePosts: [] as any[],
  }),
  actions: {
    reset () {
      this.posts = []
    },
  },
  persist: true,
})
