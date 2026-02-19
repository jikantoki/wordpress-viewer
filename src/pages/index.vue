<template lang="pug">
v-card(
  style="width: 100%; height: 100%;"
  :class="settings.hidden.isAndroid15OrHigher ? 'top-android-15-or-higher' : ''"
  )
  v-card-actions
    .ml-2(style="font-size: 1.3em; height: 4em; display: flex; align-items: center;")
      p エノキ電気ニュース
    v-spacer
  v-card-text.px-0(style="height: inherit; overflow-y: auto;")
    .flex(
      style="display: flex; align-items: center;"
    )
      .text-h5.mx-4 {{ selectedCategory ? selectedCategory.name : '最新記事' }}
      v-spacer
      v-btn(
        v-if="selectedCategory"
        icon="mdi-close"
        @click="clearCategoryFilter()"
        title="カテゴリフィルタをクリア"
      )
      v-btn(
        icon="mdi-reload"
        @click="reload()"
      )
      v-btn(
        icon="mdi-format-list-bulleted-square"
        v-show="settings.display.listType != 'compact'"
        @click="settings.display.listType = 'compact'"
      )
      v-btn(
        icon="mdi-view-grid"
        v-show="settings.display.listType != 'card'"
        @click="settings.display.listType = 'card'"
      )
    .loading(
      style="border-top: solid 1px;"
    )
      v-progress-linear(
        indeterminate
        v-show="loading"
      )
    p.not-contents.ma-12.text-h6(
      v-if="posts.posts.length == 0"
      style="text-align: center;"
      ) 記事が見つかりませんでした。
    v-list(v-if="settings.display.listType == 'card'")
      v-list-item.py-4.list-item(
        v-for="post in posts.posts"
        :key="post.id"
        @click="viewPost(post)"
        style="cursor: pointer;"
        )
        .avater-and-title.mb-2(
          style="display: flex; align-items: center; gap: 0.5em;"
          )
          //- 投稿者アバター
          //- img(
            :src="post._embedded.author[0].avatar_urls['96']"
            style="border-radius: 9999px; width: 3em; height: 3em;"
            )
          v-list-item-content
            p.text-h6(
              style="font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
            ) {{ post.title.rendered }}
            p.opacity05(
            ) 投稿日: {{ new Date(post.date).toLocaleDateString() }}
        p.description {{ post.excerpt.rendered.replace(/<[^>]+>/g, '').slice(0, 100) }}...
        .category.mt-2(
          v-if="post._embedded && post._embedded['wp:term'] && post._embedded['wp:term'][0] && post._embedded['wp:term'][0].length > 0"
          style="display: flex; flex-wrap: wrap; gap: 0.5em;"
          )
          v-chip(
            v-for="cat in post._embedded['wp:term'][0]"
            :key="cat.id"
            size="small"
            @click.stop="filterByCategory(cat)"
            style="cursor: pointer;"
            )
            | {{ cat.name }}
        img.mt-2(
          :src="selectThumbnail(post)"
          style="border-radius: 8px; width: 100%; aspect-ratio: 16/9; object-fit: cover;"
          )
    v-list(v-if="settings.display.listType == 'compact'")
      v-list-item.py-4.list-item(
        v-for="post in posts.posts"
        :key="post.id"
        @click="viewPost(post)"
        style="cursor: pointer;"
        )
        v-list-item-content
          img(
            :src="selectThumbnail(post)"
            style="border-radius: 8px; width: 6em; height: 4em; object-fit: cover; float: right; margin-left: 1em;"
            )
          .title-and-description
            p.text-h6(
              style="font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
            ) {{ post.title.rendered }}
            p.opacity05(
            ) 投稿日: {{ new Date(post.date).toLocaleDateString() }}
            p.description.mt-2(
              style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
            ) {{ post.excerpt.rendered.replace(/<[^>]+>/g, '').slice(0, 100) }}...
          .category.mt-2(
            v-if="post._embedded && post._embedded['wp:term'] && post._embedded['wp:term'][0] && post._embedded['wp:term'][0].length > 0"
            style="display: flex; flex-wrap: wrap; gap: 0.5em;"
            )
            v-chip(
              v-for="cat in post._embedded['wp:term'][0]"
              :key="cat.id"
              size="small"
              @click.stop="filterByCategory(cat)"
              style="cursor: pointer;"
              )
              | {{ cat.name }}
    //-- もっと見るボタン --
    .text-center.my-4
      v-btn(
        style="background-color: rgb(var(--v-theme-primary)); color: white;"
        @click="showmore"
        prepend-icon="mdi-arrow-down-circle-outline"
        :loading="loading"
        ) もっと見る
    .ma-16.pa-16
  //-- 下部のアクションバー --
  .action-bar
    .buttons
      .button(
        v-ripple
        @click="setCurrentPosition"
        )
        v-icon mdi-home
        p トップ
      .button(
        v-ripple
        @click="optionsDialog = true"
        style="opacity: 0.8;"
        )
        v-icon mdi-dots-vertical
        p その他
    .bottom-android-15-or-higher(v-if="settings.hidden.isAndroid15OrHigher")
  //-- 右下のボタン --
  //- .right-bottom-buttons
    .current-button
      v-btn(
        size="x-large"
        icon
        @click=""
        style="background-color: rgb(var(--v-theme-primary)); color: white"
        )
        v-icon mdi-crosshairs-gps
  //-- 左上の友達リストボタン --
  //- .left-top-buttons
    .top-android-15-or-higher(v-if="settings.hidden.isAndroid15OrHigher")
    .current-button
      v-btn(
        size="x-large"
        icon
        @click="$router.push('/friendlist')"
        style="background-color: rgb(var(--v-theme-primary)); color: white"
        )
        v-icon mdi-account-multiple
  //-- 右上のアカウントボタン --
  .right-top-buttons
    .top-android-15-or-higher(v-if="settings.hidden.isAndroid15OrHigher")
    .account-button
      .button(
        v-ripple
        @click="optionsDialog = true"
        style="cursor: pointer; border-radius: 9999px; height: 4em; width: 4em;"
        )
        img(
          loading="lazy"
          :src="myProfile && myProfile.icon ? myProfile.icon : '/account_default.jpg'"
          style="height: 4em; width: 4em; border-radius: 9999px; border: solid 2px #000;"
          onerror="this.src='/account_default.jpg'"
          )
    //- QRコードボタン
    //- .account-button.my-2
      v-btn(
        v-ripple
        @click="$router.push('/qrcode')"
        icon="mdi-qrcode-scan"
        color="rgb(var(--v-theme-primary)"
        size="x-large"
      )
  //-- 友達検索ダイアログ --
  v-dialog(
    v-model="searchFriendDialog"
  )
    v-card
      v-card-actions(
        style="width: 90vw;"
      )
        p.ml-2 検索
        v-spacer
        v-btn(
          text
          @click="searchFriendDialog = false"
          icon="mdi-close"
          )
      v-card-text
        v-text-field(
          label="キーワード"
          prepend-icon="mdi-magnify"
          v-model="searchFriendId"
          @keydown="searchFriendErrorMessage = ''"
          @keydown.enter="searchFriend(searchFriendId)"
        )
        p(
          style="height: 1em;"
        ) {{ searchFriendErrorMessage }}
      v-card-actions
        v-btn(
          @click="searchFriend(searchFriendId)"
          prepend-icon="mdi-magnify"
          style="background-color: rgb(var(--v-theme-primary));"
          :loading="searchFriendLoading"
        ) 検索
  //-- オプションダイアログ --
  v-dialog(
    v-model="optionsDialog"
    transition="dialog-bottom-transition"
    fullscreen
  )
    v-card
      .top-android-15-or-higher(v-if="settings.hidden.isAndroid15OrHigher")
      v-card-actions
        p.ml-2(class="headline" style="font-size: 1.3em") ようこそ
        v-spacer
        v-btn(
          text
          @click="optionsDialog = false"
          icon="mdi-close"
          )
      v-card-text
        .account-details(
          style="display: flex; flex-direction: column; align-items: center; gap: 1em; margin-bottom: 1em;"
        )
          .account-img
            img(
              :src="myProfile && myProfile.icon ? myProfile.icon : '/account_default.jpg'"
              style="height: 8em; width: 8em; border-radius: 9999px;"
              onerror="this.src='/account_default.jpg'"
              )
          .account-info(
            style="text-align: center;"
          )
            p(
              v-if="myProfile.userId && !myProfile.guest"
              style="font-size: 1.2em; margin: 0; padding: 0;"
              ) {{ myProfile.name ? myProfile.name : myProfile.userId }}
            p(
              v-else
              style="font-size: 1.2em; margin: 0; padding: 0;"
              ) ゲスト
            p(style="margin: 0; padding: 0;")
              | {{ myProfile.userId && !myProfile.guest ? `@${myProfile.userId}` : 'データは同期されていません' }}
            v-btn.my-2(
              v-if="myProfile.userId && !myProfile.guest"
              text
              @click="$router.push(`/user/${myProfile.userId}`)"
              append-icon="mdi-account-outline"
              style="background-color: rgb(var(--v-theme-primary));"
            ) プロフィールを表示
            //- v-btn.my-2(
              v-else
              text
              @click="$router.push('/login')"
              append-icon="mdi-login"
              style="background-color: rgb(var(--v-theme-primary)); color: white;"
              ) ログイン
        v-list.options-list
          v-list-item.item( @click="searchFriendDialog = true" )
            .icon-and-text
              v-icon mdi-magnify
              v-list-item-title 検索
          //- v-list-item.item( @click="$router.push('qrcode')" )
            .icon-and-text
              v-icon mdi-qrcode-scan
              v-list-item-title QRコードで友達を探す
          //- v-list-item.item(
            @click="$router.push('/friendlist')"
            v-show="myProfile && myProfile.userId"
            )
            .icon-and-text
              v-icon mdi-account-multiple
              v-list-item-title 友達リスト
          v-list-item.item( @click="$router.push('/settings')" )
            .icon-and-text
              v-icon mdi-cog
              v-list-item-title 設定
          v-list-item.item( @click="$router.push('/terms')" )
            .icon-and-text
              v-icon mdi-file-document-outline
              v-list-item-title 利用規約
          v-list-item.item( @click="openURL('https://enoki.xyz/privacy')" )
            .icon-and-text
              v-icon mdi-shield-lock-outline
              v-list-item-title プライバシーポリシー
          v-list-item.item( @click="$router.push('/about')" )
            .icon-and-text
              v-icon mdi-information
              v-list-item-title このアプリについて
          v-list-item.item( @click="openURL(env.VUE_APP_WORDPRESS_HOST)" )
            .icon-and-text
              v-icon mdi-open-in-new
              v-list-item-title エノキ電気ニュースを開く
          v-list-item.item( @click="share('https://play.google.com/store/apps/details?id=xyz.enoki.blog.caramelos&hl=ja', 'エノキ電気ニュース')" )
            .icon-and-text
              v-icon mdi-share-variant
              v-list-item-title このアプリを共有する
</template>

<script lang="ts">
  import { App } from '@capacitor/app'
  import { Browser } from '@capacitor/browser'
  import { CapacitorHttp } from '@capacitor/core'

  import { Share } from '@capacitor/share'
  import { Toast } from '@capacitor/toast'
  // @ts-ignore
  import mixins from '@/mixins/mixins'
  import { useMyProfileStore } from '@/stores/myProfile'
  import { usePostsStore } from '@/stores/posts'
  import { useSettingsStore } from '@/stores/settings'

  /**
   * WordPressカテゴリの型定義
   */
  interface WPCategory {
    id: number
    name: string
    slug?: string
  }

  export default {
    components: {},
    mixins: [mixins],
    data () {
      return {
        /** オプションダイアログの表示フラグ */
        optionsDialog: false,
        /** 自分のプロフィール */
        myProfile: useMyProfileStore(),
        /** 友達検索ダイアログ */
        searchFriendDialog: false,
        /** 検索するワード */
        searchFriendId: '',
        /** 友達検索中のローディング画面 */
        searchFriendLoading: false,
        /** 友達検索画面のエラー表示 */
        searchFriendErrorMessage: '',
        /** 環境変数 */
        env: null as any,
        /** 承認待ち友達リスト */
        acceptList: [] as any,
        /** 承認してほしい友達がいるダイアログ */
        acceptDialog: false,
        /** 友達リスト */
        friendList: [] as any[],
        /** 設定ストア */
        settings: useSettingsStore(),
        posts: usePostsStore(),
        reloadDialog: false,
        loading: false,
        /** 投稿内容 */
        viewContents: null as any,
        /** 選択中のカテゴリ */
        selectedCategory: null as WPCategory | null,
        /** 画像拡大ダイアログの表示フラグ */
        imageDialog: false,
        /** 選択された画像のURL */
        selectedImageUrl: '' as string,
        /** 選択された画像のalt属性 */
        selectedImageAlt: '' as string,
      }
    },
    computed: {
      /** WordPressのホストURL */
      blogHost (): string {
        return this.env?.VUE_APP_WORDPRESS_HOST
      },
    },
    watch: {
      /** ようこそ画面の表示状態を保存 */
      optionsDialog: {
        handler: async function (dialog: boolean) {
          localStorage.setItem('welcomeDialog', String(dialog))
        },
      },
    },
    async mounted () {
      // @ts-ignore
      this.env = import.meta.env as any

      setTimeout(async () => {
        // 情報取得
        // eslint-disable-next-line unicorn/no-array-sort
        const sortedList = this.posts.posts.sort((a: any, b: any) => {
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateB.getTime() - dateA.getTime()
        })
        const lastUpdated = sortedList[0]
        if (!lastUpdated) {
          await this.reload()
          return
        }
        const lastUpdatedTime = new Date(lastUpdated.date)
        const list = await this.loadNewList(lastUpdatedTime)
        // 取得に成功し、データがある場合のみ投稿リストの先頭に追加
        // (null = エラー、キャッシュを保持; 空配列 = 新しい投稿なし、更新しない)
        if (Array.isArray(list) && list.length > 0) {
          this.posts.posts = list.concat(this.posts.posts)
        }
      }, 10)

      /** ようこその復活 */
      const welcomeDialog = localStorage.getItem('welcomeDialog')
      if (welcomeDialog && welcomeDialog.toLowerCase() == 'true') {
        this.optionsDialog = true
      }

      /** ログイン情報 */
      if (this.myProfile.$state.guest == false) {
        setTimeout(async () => {
          const token = this.myProfile.userToken
          const profile: any = await this.getProfile(this.myProfile.userId ?? '')
          if (profile) {
            profile.userToken = token
            profile.guest = false
            this.myProfile = {
              ...this.myProfile,
              ...profile,
            }
          }
        }, 100)
      } else {
        this.myProfile.reset()
      }

      /** バックボタンのリスナーを追加 */
      App.addListener('backButton', () => {
        if (this.searchFriendDialog) {
          // 友達検索ダイアログを閉じる
          this.searchFriendDialog = false
        } else if (this.acceptDialog) {
          // 友達承認しろダイアログを閉じる
          this.acceptDialog = false
        } else if (this.optionsDialog) {
          /** オプションダイアログを閉じる */
          this.optionsDialog = false
        } else if (this.$route.path === '/') {
          /** ルートページならアプリを最小化 */
          App.minimizeApp()
          Toast.show({ text: 'アプリはバックグラウンドで実行されます' })
        } else {
          /** ルート以外のページなら1つ戻る */
          this.$router.back()
        }
      })

      // 承認していない友達リクエストがあったらポップアップを表示
      // const res: any = await this.sendAjaxWithAuth('/getMyFriendList.php', {
      //   id: this.myProfile.userId,
      //   token: this.myProfile.userToken,
      //   withLocation: true,
      // })
      // if (res && res.body) {
      //   const allFriendList: any[] = res.body.friendList
      //   this.acceptList = []
      //   if (allFriendList && allFriendList[0]) {
      //     for (const friend of allFriendList) {
      //       friend.friendProfile.userId = friend.friendRealId
      //       if (friend.status == 'request' && friend.fromUserId != res.body.mySecretId) {
      //         this.acceptList.push(friend.friendProfile)
      //       }
      //     }
      //   }
      // }
      // if (this.acceptList.length > 0 && history.length <= 2) {
      //   this.acceptDialog = true
      // }
    },
    unmounted () {
      App.removeAllListeners()
    },
    methods: {
      /** 秒比較 */
      diffSeconds (date: Date | null | undefined) {
        if (!date) {
          return 999_999
        }

        const now = new Date()
        /** 差分秒 */
        const diff = (now.getTime() - date.getTime()) / 1000
        return diff
      },
      /** 現在時刻と位置情報を最後に取得した時間を比較 */
      diffLastGetTime (date: Date | null | undefined) {
        if (!date) {
          return ''
        }
        /** 差分秒 */
        const diff = this.diffSeconds(date)
        if (diff < 30) {
          return 'たった今'
        } else if (diff < 60) {
          return `${Math.floor(diff)}秒前`
        } else if (diff < 60 * 60) {
          return `${Math.floor(diff / 60)}分前`
        } else if (diff < 60 * 60 * 24) {
          return `${Math.floor(diff / 60 / 60)}時間前`
        } else {
          return `${Math.floor(diff / 60 / 60 / 24)}日前`
        }
      },
      openGoogleMaps (latlng: [
        number, number,
      ]) {
        this.openURL(
          `https://www.google.com/maps/search/?api=1&query=${latlng[0]},${latlng[1]}`,
        )
      },
      /** URLをブラウザで開く */
      async openURL (url: string) {
        await Browser.open({ url: url })
      },
      /** 友達を検索 */
      async searchFriend (searchId: string) {
        searchId = searchId.replace('@', '')
        this.searchFriendLoading = true
        if (!searchId) {
          this.searchFriendErrorMessage = '検索するワードを入力してください'
          this.searchFriendLoading = false
          return
        }
        const userData = await this.getProfile(
          searchId,
          this.myProfile.userId,
          this.myProfile.userToken,
        )
        if (userData) {
          this.$router.push(`/user/${userData.userId}`)
        } else {
          this.searchFriendErrorMessage = '友達が見つかりませんでした'
          this.searchFriendLoading = false
          return
        }
        this.searchFriendLoading = false
      },
      /**
       * 2つのDateオブジェクトの差が10秒以内か判定する
       * @param {Date} date1 - 比較する1つ目の日付
       * @param {Date} date2 - 比較する2つ目の日付
       * @returns {boolean} 10秒以内ならtrue
       */
      isWithin10Seconds (date1: Date, date2: Date) {
        // 10秒 = 10000ミリ秒
        const diffInMilliseconds = Math.abs(date1.getTime() - date2.getTime())
        return diffInMilliseconds <= 10_000
      },
      /** サムネイル画像を選択 */
      selectThumbnail (post: any) {
        if (!post) {
          return '/thumbnail.jpg'
        }
        if (post.jetpack_featured_media_url) {
          return post.jetpack_featured_media_url
        } else if (post._embedded
          && post._embedded['wp:featuredmedia']
          && post._embedded['wp:featuredmedia'][0]) {
          return post._embedded['wp:featuredmedia'][0].source_url
        } else {
          return '/thumbnail.jpg'
        }
      },
      /**
       * 投稿リストを取得
       * @param start どこから取得するか
       * @param count いくつ取得するか
       */
      async loadList (start = 0, count = 10, dialogFlag = false) {
        if (dialogFlag) {
          this.reloadDialog = true
        }
        this.loading = true
        try {
          const params = new URLSearchParams({
            _embed: '1',
            per_page: count.toString(),
            offset: start.toString(),
          })
          if (this.selectedCategory) {
            params.append('categories', this.selectedCategory.id.toString())
          }
          const url = `${this.env.VUE_APP_WORDPRESS_HOST}/wp-json/wp/v2/posts?${params.toString()}`
          const response = await CapacitorHttp.get({
            url: url,
            method: 'GET',
          })
          const list = await response.data
          this.reloadDialog = false
          this.loading = false
          return list
        } catch (error) {
          console.error(error)
          this.reloadDialog = false
          this.loading = false
          alert(`投稿の取得に失敗しました。通信環境を確認してください。${JSON.stringify(error)}`)
          Toast.show({ text: '投稿の取得に失敗しました。通信環境を確認してください。' })
          return null
        }
      },
      /**
       * 新しい投稿リストを取得
       * @param lastUpdatedTime 最後に更新した時間
       */
      async loadNewList (lastUpdatedTime: Date) {
        try {
          this.loading = true
          const url = `${this.env.VUE_APP_WORDPRESS_HOST}/wp-json/wp/v2/posts?_embed&after=${lastUpdatedTime.toISOString()}`
          const response = await CapacitorHttp.get({
            url: url,
            method: 'GET',
          })
          const list = await response.data
          this.loading = false
          return list
        } catch (error) {
          console.error(error)
          this.loading = false
          alert(`投稿の取得に失敗しました。通信環境を確認してください。${JSON.stringify(error)}`)
          Toast.show({ text: '投稿の取得に失敗しました。通信環境を確認してください。' })
          return null
        }
      },
      /** 投稿リストをリロード */
      async reload () {
        const list = await this.loadList(0, 10)
        // データ取得に成功した場合のみ投稿リストを更新 (null = エラー、空配列 = 有効なレスポンス)
        if (Array.isArray(list)) {
          this.posts.reset()
          this.posts.posts = list
        }
      },
      /** もっと見る */
      async showmore () {
        const nowList = this.posts.posts
        const list = await this.loadList(this.posts.posts.length, 10)
        // 取得に成功し、データがある場合のみ投稿リストに追加
        // (null = エラー、キャッシュを保持; 空配列 = これ以上の投稿なし、更新しない)
        if (list && list.length > 0) {
          this.posts.posts = nowList.concat(list)
        } else {
          Toast.show({ text: '最後まで検索しました！' })
        }
      },
      /** カテゴリでフィルタリング */
      async filterByCategory (category: WPCategory) {
        this.selectedCategory = category
        await this.reload()
      },
      /** カテゴリフィルタをクリア */
      async clearCategoryFilter () {
        this.selectedCategory = null
        await this.reload()
      },
      /** シェアダイアログ */
      async share (content: string, title = '') {
        console.log(this.viewContents)
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
          console.error('Invalid WordPress host URL:', this.blogHost, error)
          return
        }

        const links = postContents.querySelectorAll('a')

        for (const link of Array.from(links)) {
          // すでにハンドラが設定されている場合はスキップ
          if (link.dataset.handlerSet === 'true') continue
          link.dataset.handlerSet = 'true'

          link.addEventListener('click', async event => {
            event.preventDefault()
            event.stopPropagation()

            const href = link.getAttribute('href')
            if (!href) return

            // アンカーリンク（#で始まる）の場合
            if (href.startsWith('#')) {
              this.handleAnchorLink(href)
              return
            }

            try {
              const linkUrl = new URL(href, this.blogHost)

              // 同じドメインかチェック
              // eslint-disable-next-line unicorn/prefer-ternary
              if (linkUrl.hostname === blogUrl.hostname) {
                // 同じドメイン内のリンク
                await this.handleSameDomainLink(linkUrl.href)
              } else {
                // 外部リンク
                await this.openURL(href)
              }
            } catch (error) {
              console.error('リンク処理エラー:', error)
              await this.openURL(href)
            }
          })
        }

        // 画像にクリックハンドラを設定
        const images = postContents.querySelectorAll('img')

        for (const img of Array.from(images)) {
          // すでにハンドラが設定されている場合はスキップ
          if (img.dataset.handlerSet === 'true') continue
          img.dataset.handlerSet = 'true'

          // 画像をクリック可能にするスタイル設定
          img.style.cursor = 'pointer'

          img.addEventListener('click', event => {
            event.preventDefault()
            event.stopPropagation()

            const src = img.getAttribute('src')
            const alt = img.getAttribute('alt') || ''
            if (src) {
              this.selectedImageUrl = src
              this.selectedImageAlt = alt
              this.imageDialog = true
            }
          })
        }
      },
      /**
       * アンカーリンクを処理してスムーズにスクロール
       * @param hash アンカー（例: #section-id）
       */
      handleAnchorLink (hash: string) {
        const targetId = hash.slice(1) // #を除去
        // eslint-disable-next-line unicorn/prefer-query-selector
        const targetElement = document.getElementById(targetId)

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
      },
      /**
       * 同じドメイン内のリンクを処理
       * @param url 完全なURL
       */
      async handleSameDomainLink (url: string) {
        try {
          const urlObj = new URL(url)

          // アンカー部分がある場合
          if (urlObj.hash) {
            // まず記事コンテンツを取得/表示してからスクロール
            const pathname = urlObj.pathname
            const currentPath = this.viewContents?.link ? new URL(this.viewContents.link).pathname : ''

            const isSameArticle = pathname === currentPath

            if (!isSameArticle) {
              // 別の記事へのアンカーリンク
              await this.loadAndViewPostByUrl(url)
              // 少し待ってからスクロール
              setTimeout(() => {
                this.handleAnchorLink(urlObj.hash)
              }, 0)
              return
            }
            // 同じ記事内のアンカーリンク
            this.handleAnchorLink(urlObj.hash)
          } else {
            // アンカーなしの同じドメインリンク
            await this.loadAndViewPostByUrl(url)
          }
        } catch (error) {
          console.error('同じドメインリンクの処理エラー:', error)
          Toast.show({ text: '記事の読み込みに失敗しました' })
        }
      },
      /**
       * URLから記事を読み込んで表示
       * @param url 記事のURL
       */
      async loadAndViewPostByUrl (url: string) {
        try {
          // まずローカルストアから同じURLの記事を探す
          const existingPost = this.posts.posts.find((p: any) => p.link === url)

          if (existingPost) {
            // ローカルに存在する場合はそれを表示
            this.viewContents = existingPost
            return
          }

          // ローカルに存在しない場合はAPIから取得
          // URLからスラッグを抽出（最後のパス部分）
          const urlObj = new URL(url)
          const pathParts = urlObj.pathname.split('/').filter(Boolean)
          const slug = pathParts.at(-1)

          if (!slug) {
            throw new Error(`Invalid URL: no slug found in ${url}`)
          }

          // WordPressのREST APIでスラッグから記事を検索
          const apiUrl = `${this.blogHost}/wp-json/wp/v2/posts?slug=${slug}`

          this.loading = true
          const response = await CapacitorHttp.get({
            url: apiUrl,
            method: 'GET',
          })

          if (response.data && response.data.length > 0) {
            const post = response.data[0]
            // ストアに追加
            this.posts.posts.unshift(post)
            // 表示
            this.viewContents = post
          } else {
            throw new Error('Post not found')
          }
        } catch (error) {
          console.error('記事の読み込みエラー:', error)
          Toast.show({ text: '記事の読み込みに失敗しました' })
        } finally {
          this.loading = false
        }
      },
      /** 投稿を表示 */
      async viewPost (post: any) {
        this.posts.setCurrentPost(post)
        this.$router.push(`/post/${post.id}`)
      },
    },
  }
</script>

<style lang="scss" scoped>
//scopedだとv-dialog内のスタイルが適用されないため外す
.right-bottom-buttons {
  position: fixed;
  right: 16px;
  bottom: calc(16px + 4em);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;

  .current-button {
    background-color: white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
}
.right-top-buttons {
  position: fixed;
  right: 16px;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;

  .account-button {
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
}
.left-top-buttons {
  position: fixed;
  left: 16px;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;

  .account-button {
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
}

.name-space {
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  -webkit-text-stroke: 2px black;
  paint-order: stroke;
  color: white;
  transition: all 1s;
}

.action-bar{
  position: fixed;
  bottom: 0;
  left: 0;
  background-color: rgb(var(--v-theme-surface));
  z-index: 500;
  width: 100%;
  align-items: center;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.3);
  .buttons{
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    height: 4em;
    .button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 6em;
      border-radius: 1em;
      height: 80%;
      cursor: pointer;
      color: rgb(var(--v-theme-on-surface));

      v-icon {
        font-size: 24px;
      }

      p {
        font-size: 10px;
        margin: 0;
        padding: 0;
      }
    }
  }
  .bottom-android-15-or-higher {
    width: 100%;
  }
}

.bottom-android-15-or-higher {
  height: 16px;
}
.top-android-15-or-higher {
  height: 40px;
}

.options-list {
  .item {
    padding : 12px 16px;
    border-radius: 12px!important;
    margin: 8px 0;
    cursor: pointer;
    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.1);
    }
    .icon-and-text {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 16px;
      v-icon {
        font-size: 24px;
      }
    }
  }
}

.detail-card-target {
  .info{
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1em;
    margin: 1em 0;
  }
}

.opacity05 {
  opacity: 0.7;
}

.list-item {
  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.1);
  }
}
</style>
