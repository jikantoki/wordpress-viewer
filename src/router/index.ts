/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */
import type { URLOpenListenerEvent } from '@capacitor/app'

import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'

import { CapacitorHttp } from '@capacitor/core'
import { Toast } from '@capacitor/toast'
// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

/**
 * 投稿のスラッグからIDを取得する
 * @param slug 投稿のスラッグ
 * @returns 投稿ID、見つからなければnull
 */
async function getPostIdBySlug (slug: string): Promise<number | null> {
  try {
    const wordpressHost = import.meta.env.VUE_APP_WORDPRESS_HOST
    if (!wordpressHost) {
      console.error('VUE_APP_WORDPRESS_HOST is not defined')
      return null
    }

    const apiUrl = `${wordpressHost}/wp-json/wp/v2/posts?slug=${slug}&_embed`
    console.log('Fetching post by slug:', apiUrl)

    const response = await CapacitorHttp.get({
      url: apiUrl,
      method: 'GET',
    })

    if (response.data && response.data.length > 0) {
      const post = response.data[0]
      console.log('Found post:', post.id, post.title?.rendered)
      return post.id
    }

    console.log('Post not found for slug:', slug)
    return null
  } catch (error) {
    console.error('Error fetching post by slug:', error)
    return null
  }
}

// 特定のURLを開いたらこのアプリが立ち上がる設定
App.addListener('appUrlOpen', async function (event: URLOpenListenerEvent) {
  const url = new URL(event.url)
  const pathname = url.pathname
  const wordpressHost = import.meta.env.VUE_APP_WORDPRESS_HOST || ''

  console.log('Deep link opened:', event.url)
  console.log('Pathname:', pathname)

  // 既存のルート形式をそのまま処理
  if (pathname.startsWith('/user/')) {
    router.push(pathname)
  } else if (pathname.startsWith('/post/')) {
    router.push(pathname)
  } else if (pathname && pathname !== '/') {
    // 外部からのディープリンク対応
    // URL形式: https://${VUE_APP_WORDPRESS_HOST}/[categoryName]/[postSlug]
    // パスから最後の部分（スラッグ）を取得
    const pathParts = pathname.split('/').filter(Boolean)

    if (pathParts.length > 0) {
      // 最後の部分をスラッグとして扱う
      const slug = pathParts.at(-1)
      if (!slug) {
        // スラッグが取得できない場合はホームに遷移
        router.push('/')
        return
      }
      console.log('Extracted slug:', slug)

      // スラッグからpost IDを取得
      const postId = await getPostIdBySlug(slug)

      if (postId) {
        // 投稿ページに遷移
        router.push(`/post/${postId}`)
      } else {
        // 投稿が見つからない場合はブラウザで開く
        const fullUrl = wordpressHost ? `${wordpressHost}${pathname}` : event.url
        Browser.open({ url: fullUrl })
      }
    } else {
      // ルートパスの場合はホームに遷移
      router.push('/')
    }
  } else {
    Toast.show({ text: '対応する動作が見つかりませんでした。' })
  }
})

export default router
