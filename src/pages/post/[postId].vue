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
      ) {{ viewContents ? viewContents.title?.rendered : '投稿' }}
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
        v-html="viewContents ? viewContents.content?.rendered : ''"
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
            @click="openURL(`https://twitter.com/intent/tweet?text=${viewContents.title?.rendered} ${viewContents.link}`)"
          )
          v-btn(
            icon="mdi-share-variant"
            size="x-large"
            color="rgb(var(--v-theme-primary))"
            @click="share(viewContents.link, viewContents.title.rendered)"
          )
    .ma-16
v-dialog(
  v-model="loading"
  hide-overlay
  persistent
)
  v-card(
    style="background: transparent; box-shadow: none;"
  )
    v-card-text(
      style="display: flex; flex-direction: column; align-items: center; gap: 16px;"
    )
      v-progress-circular(
        indeterminate
        size="64"
        width="4"
        color="rgb(var(--v-theme-primary))"
      )
      p 読み込み中...
</template>

<script lang="ts">
  import { Browser } from '@capacitor/browser'
  import { CapacitorHttp } from '@capacitor/core'
  import { Share } from '@capacitor/share'
  // @ts-ignore
  import mixins from '@/mixins/mixins'
  import { usePostsStore } from '@/stores/posts'
  import { useSettingsStore } from '@/stores/settings'

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
        return (this.$route.params as any).postId as string
      },
    },
    watch: {
      viewContents () {
        this.$nextTick(() => {
          this.setupPostContentLinkHandlers()
        })
      },
      postId (newPostId, oldPostId) {
        // 投稿IDが変わったら新しい投稿を読み込む
        if (newPostId !== oldPostId) {
          this.loadPost()
        }
      },
    },
    async mounted () {
      // postIdをもとに投稿を読み込む
      const postId = this.postId
      console.log(postId)

      let found = false
      let cnt = 0
      for (const post of this.posts.posts) {
        if (post.id.toString() === postId) {
          console.log('あった！')
          found = true
          this.viewContents = this.posts.posts[cnt]
          console.log(this.viewContents)
          break
        }
        cnt++
      }
      if (!found) {
        console.log('なかった！')
        this.loading = true
        await this.loadPost()
        this.loading = false
      }
      /*
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
        */
    },
    methods: {
      /** 投稿を読み込む */
      async loadPost () {
        try {
          this.loading = true
          const url = `${this.env.VUE_APP_WORDPRESS_HOST}/wp-json/wp/v2/posts/${this.postId}?_embed`
          console.log('Loading post from URL:', url)
          const response = await CapacitorHttp.get({
            url: url,
            method: 'GET',
          })
          this.viewContents = response.data
          console.log('Post loaded:', response.data)
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
        for (const link of Array.from(links)) {
          // 元のクリックイベントを無効化
          link.addEventListener('click', e => {
            e.preventDefault()

            const href = link.getAttribute('href')
            if (!href) return

            try {
              const url = new URL(href, this.blogHost)

              // 同じドメイン内のリンクの場合
              if (url.hostname === blogUrl.hostname) {
                // アンカーリンクのチェック
                if (url.hash) {
                  /** 今いるページがWebだった場合のURLを取得 */
                  const currentUrl = this.viewContents.link

                  /** ブログのホストとジャンプ先のURLのパスを組み合わせて、今いるページがWeb上でどのURLになるかを算出 */
                  const jumpToPath = `${this.env.VUE_APP_WORDPRESS_HOST}${url.pathname}`

                  // 同じページ内のアンカーへのジャンプ
                  if (jumpToPath === currentUrl) {
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
        }
      },

      /**
       * 内部リンクを処理する
       * @param url リンク先のURL
       */
      async handleInternalLink (url: URL) {
        this.loading = true
        try {
          // パスから投稿を探す
          const path = url.pathname
          const pathParts = path.split('/').filter(Boolean)
          const apiUrl = `${this.env.VUE_APP_WORDPRESS_HOST}/wp-json/wp/v2/posts?slug=${pathParts.at(-1)}&_embed`

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
              }, 0)
            }
          } else {
            // 投稿が見つからない場合はブラウザで開く
            Browser.open({ url: url.toString() })
          }
        } catch (error) {
          console.error('Failed to handle internal link:', error)
          Browser.open({ url: url.toString() })
        }
        this.loading = false
      },

      /**
       * アンカーにスクロールする
       * @param hash アンカーのハッシュ（#を含む）
       */
      scrollToAnchor (hash: string) {
        const targetId = hash.slice(1) // #を除去
        // eslint-disable-next-line unicorn/prefer-query-selector
        const targetElement = document.getElementById(targetId)
        if (targetElement) {
          // スクロール可能なコンテナ（v-card-text）を取得
          const scrollContainer = document.querySelector('.v-card-text')
          if (scrollContainer) {
            // ターゲット要素の位置を取得
            const containerRect = scrollContainer.getBoundingClientRect()
            const targetRect = targetElement.getBoundingClientRect()

            // 現在のスクロール位置からの相対位置を計算
            // ヘッダー分のオフセット（約16px）を追加して、ヘッダーの下にコンテンツが見えるようにする
            const headerOffset = 16
            const scrollTop = scrollContainer.scrollTop + (targetRect.top - containerRect.top) - headerOffset

            // スムーズスクロール
            scrollContainer.scrollTo({
              top: scrollTop,
              behavior: 'smooth',
            })
          } else {
            // フォールバック：通常のscrollIntoView
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      },

      /** サムネイルを選択 */
      selectThumbnail (post: any) {
        if (post._embedded && post._embedded['wp:featuredmedia']) {
          return post._embedded['wp:featuredmedia'][0].source_url
        }
        return '/thumbnail.jpg' // デフォルトのサムネイル画像
      },

      /** URLを開く */
      openURL (url: string) {
        Browser.open({ url })
      },
    },
  }
</script>

<style lang="scss">
.top-android-15-or-higher {
  height: 30px;
}

iframe {
  max-width: 100%;
  aspect-ratio: 16 / 9;
  height: auto;
  border-radius: 8px;
  margin: 8px 0;
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

  img {
    width: 100%!important;
    min-width: 100%!important;
    max-width: 100%!important;
    height: auto;
    aspect-ratio: 16/9;
    border-radius: 8px;
    margin: 8px 0;
    cursor: pointer;
  }
  .ez-toc-counter {
    margin: 16px;
  }
  .wp-block-gallery {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    .wp-block-image {
      flex: 1;
      min-width: 33%;
    }
  }
  .wp-block-visual-link-preview-link {
    border-radius: 8px;
    border: solid 1px rgba(var(--v-theme-on-surface), 0.3);
    padding: 8px;
    margin: 8px 0;
    display: flex;
    position: relative;
    cursor: pointer;
    a {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    .vlp-link-image{
      border-radius: 8px;
      width: 120px;
      height: 100%;
      object-fit: cover;
      margin-right: 8px;
      img {
        border-radius: 8px;
        width: 120px;
        height: 100%;
        object-fit: cover;
        margin-right: 8px;
      }
    }
    .vlp-layout-zone-main {
      .vlp-link-title {
        font-size: 1.1em;
        font-weight: bold;
        margin-bottom: 4px;
      }
      .vlp-link-summary {
        font-size: 0.9em;
        color: rgba(var(--v-theme-on-surface), 0.7);
      }
    }
  }
  a {
    color: rgb(var(--v-theme-primary));
  }
  .wp-block-heading {
    margin: 16px 0 8px 0;
  }
  table {
    border-collapse: collapse;
    margin: 16px 0;
    width: max-content;
    th, td {
      border: 1px solid rgba(var(--v-theme-on-surface), 0.3);
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: rgba(var(--v-theme-primary), 0.1);
    }
  }
  button.lightbox-trigger {
    display: none;
  }
  figure.wp-block-table {
    max-width: 100%;
    width: 100%;
    overflow-x: auto;
  }
  figure.wp-block-gallery {
    overflow-y: hidden;
    figure.wp-block-image {
      min-height: 8em;
      min-width: 12em;
      img {
        aspect-ratio: 16/9;
        height: 100%;
        max-width: unset !important;
        margin: 0;
      }
      button {
        display: none;
      }
    }
  }
}

#ez-toc-container {
  .ez-toc-title {
    font-size: 1.5em;
    font-weight: bold;
    margin: 16px 0 8px 0;
  }
  .ez-toc-cssicon-toggle-label {
    display: none;
  }
  input[type="checkbox"] {
    display: none;
  }
  .ez-toc-list-level-3 {
    padding-left: 1.5em;
  }
}

h2 {
  scroll-margin: 80px; /* アンカーリンクでスクロールしたときの余白 */
}
</style>
