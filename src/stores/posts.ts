import { defineStore } from 'pinia'

export const usePostsStore = defineStore('posts', {
  state: () => ({
    posts: [] as any[],
    favoritePosts: [] as any[],
    currentPost: null as any,
  }),
  actions: {
    reset () {
      this.posts = []
    },
    setCurrentPost (post: any) {
      this.currentPost = post
    },
  },
  persist: true,
})
