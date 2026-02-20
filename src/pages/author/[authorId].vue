<template lang="pug">
v-card(style="width: 100%; height: 100%;")
  v-card-actions
    v-btn(
      icon="mdi-arrow-left"
      @click="$router.back()"
    )
    p.ml-2(style="font-size: 1.3em;") 投稿者情報
    v-spacer
  v-card-text(style="height: -webkit-fill-available; overflow-y: auto;")
    .author-profile(v-if="authorData")
      .avatar-section(
        style="display: flex; flex-direction: column; align-items: center; padding: 2em 0 1em;"
      )
        img(
          :src="authorData.avatar_urls && authorData.avatar_urls['96'] ? authorData.avatar_urls['96'] : '/account_default.jpg'"
          onerror="this.src='/account_default.jpg'"
          style="border-radius: 9999px; width: 6em; height: 6em; object-fit: cover;"
        )
        p.mt-4(style="font-size: 1.3em; font-weight: bold;") {{ authorData.name }}
        p.mt-1(style="opacity: 0.7;") @{{ authorData.slug }}
      .description-section.mx-4.mb-4(v-if="authorData.description")
        p(style="line-height: 1.7;") {{ authorData.description }}
      v-progress-circular(
        v-if="loading"
        indeterminate
        style="display: block; margin: 4em auto;"
      )
    .loading-section(v-else-if="loading" style="display: flex; justify-content: center; padding: 4em;")
      v-progress-circular(indeterminate)
    .error-section(v-else style="text-align: center; padding: 4em;")
      p 投稿者情報を取得できませんでした。
</template>

<script lang="ts">
  import { CapacitorHttp } from '@capacitor/core'
  // @ts-ignore
  import mixins from '@/mixins/mixins'

  export default {
    mixins: [mixins],
    data () {
      return {
        /** 投稿者データ */
        authorData: null as any,
        /** ローディング中フラグ */
        loading: false,
      }
    },
    computed: {
      authorId (): string {
        return (this.$route.params as any).authorId as string
      },
    },
    async mounted () {
      await this.loadAuthor()
    },
    methods: {
      /** 投稿者情報を取得 */
      async loadAuthor () {
        this.loading = true
        try {
          const url = `${this.env.VUE_APP_WORDPRESS_HOST}/wp-json/wp/v2/users/${this.authorId}`
          const response = await CapacitorHttp.get({
            url: url,
            method: 'GET',
          })
          this.authorData = response.data
        } catch (error) {
          console.error('Failed to load author:', error)
        } finally {
          this.loading = false
        }
      },
    },
  }
</script>
