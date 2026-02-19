<template lang="pug">
v-card(
  style="width: 100%; height: 100%;"
  :class="settings.hidden.isAndroid15OrHigher ? 'top-android-15-or-higher' : ''"
  )
  .top-android-15-or-higher(v-if="settings.hidden.isAndroid15OrHigher")
  v-card-actions
    v-btn(
      icon="mdi-arrow-left"
      @click="$router.back()"
    )
    p.ml-2(
      class="headline"
      style="font-size: 1.3em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
      ) {{ viewContents ? viewContents.title.rendered : '投稿' }}
    v-spacer
    v-btn(
      icon="mdi-reload"
      @click="reload()"
      :loading="loading"
    )
    v-btn(
      icon="mdi-open-in-new"
      @click="openInBrowser()"
    )
  v-card-text(style="height: -webkit-fill-available; overflow-y: auto;")
    .contents-wrap(
      style="width: 100%;"
    )
      .loading(
        style="border-top: solid 1px;"
      )
        v-progress-linear(
          indeterminate
          v-show="loading"
        )
      .thumbnail(
        v-if="viewContents"
      )
        img.mb-4(
          :src="selectThumbnail(viewContents)"
          style="width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 16px; cursor: pointer;"
          )
      .post-contents(
        v-html="viewContents ? viewContents.content.rendered : ''"
        style="width: 100%;"
        )
      .share-space(
        v-if="viewContents"
        style="display: flex; flex-direction: column; align-items: center;"
      )
        hr.my-8(
          style="width: 90%;"
        )
        h2 この記事をシェアする
        p.my-8 この記事がいいなと思ったら、是非シェアをお願いします！
        .share-btns(
          style="display: flex; gap: 16px;"
        )
          v-btn(
            icon="mdi-twitter"
            size="x-large"
            color="#1DA1F2"
            @click="openURL(`https://twitter.com/intent/tweet?text=${viewContents.title.rendered} ${viewContents.link}`)"
          )
          v-btn(
            icon="mdi-share-variant"
            size="x-large"
            color="rgb(var(--v-theme-primary))"
            @click="share(viewContents.link, viewContents.title.rendered)"
          )
    .ma-16
</template>

<script lang="ts">
  import { Browser } from '@capacitor/browser'
  import { CapacitorHttp } from '@capacitor/core'
  import { Share } from '@capacitor/share'
  // @ts-ignore
  import mixins from '@/mixins/mixins'
  import { usePostsStore } from '@/stores/posts'
  import { useSettingsStore } from '@/stores/settings'

  /**
   * アンカーリンクスクロールの遅延時間（ミリ秒）
   * 別記事に移動してからアンカー位置にスクロールする際、
   * DOM更新とレンダリングが完了するまでの待機時間。
   * 300msは記事コンテンツの読み込みとレンダリングに十分な時間。
   */
  const ANCHOR_SCROLL_DELAY = 300

  export default {
    mixins: [mixins],
    data () {
      return {
        /** 設定ストア */
        settings: useSettingsStore(),
        posts: usePostsStore(),
        /** 投稿内容 */
        viewContents: null as any,
        loading: false,
      }
    },
    computed: {
      /** WordPressのホストURL */
      blogHost (): string {
        return this.env?.VUE_APP_WORDPRESS_HOST
      },
      postId (): string {
        return this.$route.params.postId as string
      },
    },
    watch: {
      viewContents () {
        this.$nextTick(() => {
          this.setupPostContentLinkHandlers()
        })
      },
    },
    mounted () {
      // Piniaストアから投稿を取得
      if (this.posts.currentPost) {
        this.viewContents = this.posts.currentPost
      } else {
        // ストアにない場合は、投稿IDから取得を試みる
        this.loadPost()
      }
      this.$nextTick(() => {
        this.setupPostContentLinkHandlers()
      })
    },
    methods: {
      /** 投稿を読み込む */
      async loadPost () {
        try {
          this.loading = true
          const url = `${this.env.VUE_APP_WORDPRESS_HOST}/wp-json/wp/v2/posts/${this.postId}?_embed`
          const response = await CapacitorHttp.get({
            url: url,
            method: 'GET',
            params: {
              _embed: 'true',
            },
          })
          this.viewContents = response.data
          this.posts.setCurrentPost(response.data)
        } catch (error) {
          console.error('Failed to load post:', error)
        } finally {
          this.loading = false
        }
      },
      /** リロード */
      async reload () {
        await this.loadPost()
      },
      /** ブラウザで開く */
      openInBrowser () {
        if (this.viewContents && this.viewContents.link) {
          Browser.open({ url: this.viewContents.link })
        }
      },
      /** シェアダイアログ */
      async share (content: string, title = '') {
        await Share.share({
          url: content,
          title: title,
        })
      },
      /**
       * 投稿コンテンツ内のリンクにイベントハンドラを設定
       * 同じドメイン内のリンクはアプリ内で開き、外部リンクはブラウザで開く
       */
      setupPostContentLinkHandlers () {
        const postContents = document.querySelector('.post-contents')
        if (!postContents) return

        let blogUrl: URL
        try {
          blogUrl = new URL(this.blogHost)
        } catch (error) {
          console.error('Invalid blog host URL:', error)
          return
        }

        const links = postContents.querySelectorAll('a')
        links.forEach((link) => {
          // 元のクリックイベントを無効化
          link.addEventListener('click', (e) => {
            e.preventDefault()

            const href = link.getAttribute('href')
            if (!href) return

            try {
              const url = new URL(href, this.blogHost)

              // 同じドメイン内のリンクの場合
              if (url.hostname === blogUrl.hostname) {
                // アンカーリンクのチェック
                if (url.hash) {
                  // 同じページ内のアンカーへのジャンプ
                  if (url.pathname === window.location.pathname) {
                    this.scrollToAnchor(url.hash)
                  } else {
                    // 別記事へのアンカーリンク
                    // まず記事のパスから投稿IDを取得して遷移
                    this.handleInternalLink(url)
                  }
                } else {
                  // 通常の内部リンク
                  this.handleInternalLink(url)
                }
              } else {
                // 外部リンクはブラウザで開く
                Browser.open({ url: href })
              }
            } catch (error) {
              // URLのパースに失敗した場合はブラウザで開く
              console.error('Failed to parse URL:', error)
              Browser.open({ url: href })
            }
          })
        })
      },

      /**
       * 内部リンクを処理する
       * @param url リンク先のURL
       */
      async handleInternalLink (url: URL) {
        try {
          // パスから投稿を探す
          const path = url.pathname
          const apiUrl = `${this.env.VUE_APP_WORDPRESS_HOST}/wp-json/wp/v2/posts?slug=${path.split('/').filter(Boolean).pop()}&_embed`
          
          const response = await CapacitorHttp.get({
            url: apiUrl,
            method: 'GET',
          })

          if (response.data && response.data.length > 0) {
            const post = response.data[0]
            this.posts.setCurrentPost(post)
            // 投稿ページに遷移
            this.$router.push(`/post/${post.id}`)
            
            // アンカーがある場合は遅延してスクロール
            if (url.hash) {
              setTimeout(() => {
                this.scrollToAnchor(url.hash)
              }, ANCHOR_SCROLL_DELAY)
            }
          } else {
            // 投稿が見つからない場合はブラウザで開く
            Browser.open({ url: url.toString() })
          }
        } catch (error) {
          console.error('Failed to handle internal link:', error)
          Browser.open({ url: url.toString() })
        }
      },

      /**
       * アンカーにスクロールする
       * @param hash アンカーのハッシュ（#を含む）
       */
      scrollToAnchor (hash: string) {
        const targetId = hash.substring(1) // #を除去
        const targetElement = document.getElementById(targetId)
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' })
        }
      },

      /** サムネイルを選択 */
      selectThumbnail (post: any) {
        if (post._embedded && post._embedded['wp:featuredmedia']) {
          return post._embedded['wp:featuredmedia'][0].source_url
        }
        return '/no-image.png'
      },

      /** URLを開く */
      openURL (url: string) {
        Browser.open({ url })
      },
    },
  }
</script>

<style scoped lang="scss">
.top-android-15-or-higher {
  height: 30px;
}

.post-contents {
  ::v-deep(img) {
    max-width: 100%;
    height: auto;
  }
  
  ::v-deep(a) {
    color: rgb(var(--v-theme-primary));
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
