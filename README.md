# WordPress Viewer

WordPressのブログ記事を閲覧するためのモバイルアプリケーション

<img src="./public/icon.png" width="256px" alt="アイコン">

[最新版ダウンロード](https://raw.githubusercontent.com/jikantoki/wordpress-viewer/refs/heads/main/app-release.apk)

## 概要

このアプリケーションは、WordPress REST APIを利用してブログ記事を閲覧するためのネイティブAndroidアプリです。Vue 3とCapacitorを使用して開発されており、モダンなUI/UXを提供します。

### 主な特徴

- **WordPress REST API統合**: 任意のWordPressサイトと接続可能
- **ネイティブアプリ体験**: Capacitorによるネイティブアプリとして動作
- **高速な記事閲覧**: 最適化されたレンダリングとキャッシング
- **ディープリンク対応**: 外部リンクからの直接記事表示
- **レスポンシブデザイン**: Vuetifyによる美しいマテリアルデザイン

## 機能一覧

### 実装済み機能

- ✅ **記事一覧表示**: 最新記事の一覧表示（カード表示/コンパクト表示の切り替え可能）
- ✅ **記事詳細表示**: 記事本文、サムネイル画像、シェア機能
- ✅ **カテゴリフィルタ**: カテゴリ別の記事絞り込み
- ✅ **記事検索**: タイトルや本文からの検索
- ✅ **画像拡大表示**: 記事内の画像をタップして拡大表示
- ✅ **シェア機能**: TwitterやネイティブShare APIを使った記事共有
- ✅ **ディープリンク**: 外部URLからアプリ内記事への直接遷移
- ✅ **オフライン対応**: Piniaによる状態管理とキャッシング
- ✅ **ダークモード**: ライト/ダークテーマの切り替え
- ✅ **表示設定**: リスト表示形式のカスタマイズ

### 今後実装予定の機能

- 🔲 **ログイン機能**: WordPressユーザー認証
- 🔲 **ブックマーク機能**: お気に入り記事の保存と管理
- 🔲 **コメント機能**: 記事へのコメント投稿と閲覧
- 🔲 **プッシュ通知**: 新着記事の通知
- 🔲 **オフライン閲覧**: 記事の完全オフライン保存

## 技術スタック

### フロントエンド

- **Vue 3**: プログレッシブJavaScriptフレームワーク
- **Vuetify 3**: マテリアルデザインコンポーネントライブラリ
- **TypeScript**: 型安全な開発環境
- **Pinia**: Vue 3公式推奨の状態管理ライブラリ
- **Vue Router**: SPAルーティング

### ビルドツール

- **Vite**: 高速な開発サーバーとビルドツール
- **Capacitor**: ネイティブアプリ化フレームワーク

### テンプレートエンジン・スタイリング

- **Pug**: HTML テンプレートエンジン
- **SASS**: CSS プリプロセッサ

## プロジェクト構成

```
wordpress-viewer/
├── src/
│   ├── pages/           # ページコンポーネント（ルーティング）
│   │   ├── index.vue           # トップページ（記事一覧）
│   │   ├── post/
│   │   │   └── [postId].vue    # 記事詳細ページ
│   │   ├── about.vue           # アプリについて
│   │   ├── settings/           # 設定ページ群
│   │   └── ...
│   ├── components/      # 再利用可能なコンポーネント
│   │   └── common/             # 共通コンポーネント
│   ├── stores/          # Pinia ストア（状態管理）
│   │   ├── posts.ts            # 記事データ管理
│   │   ├── settings.ts         # アプリ設定
│   │   └── myProfile.ts        # ユーザープロフィール
│   ├── router/          # Vue Router設定
│   │   └── index.ts            # ルーティング定義
│   ├── mixins/          # Vue mixins
│   ├── js/              # ユーティリティ関数
│   ├── styles/          # グローバルスタイル
│   └── App.vue          # ルートコンポーネント
├── android/             # Android ネイティブプロジェクト
├── public/              # 静的ファイル
├── capacitor.config.ts  # Capacitor設定
└── vite.config.mts      # Vite設定
```

## ルーティングの仕組み

このアプリケーションは`unplugin-vue-router`を使用した自動ルーティングを採用しています。

### ルート定義

`src/pages/` ディレクトリ内のファイル構造が自動的にルートに変換されます：

| ファイルパス | ルート | 説明 |
|------------|--------|------|
| `pages/index.vue` | `/` | トップページ（記事一覧） |
| `pages/post/[postId].vue` | `/post/:postId` | 記事詳細ページ（動的ルート） |
| `pages/about.vue` | `/about` | アプリについて |
| `pages/settings/index.vue` | `/settings` | 設定トップ |
| `pages/settings/profile.vue` | `/settings/profile` | プロフィール設定 |

### ディープリンク対応

外部URLからアプリを起動できるディープリンク機能を実装しています（`src/router/index.ts`）：

1. **アプリ内ルート形式**: `/post/:postId` または `/user/:userId` 形式でアプリ内の該当ページに遷移
2. **WordPress記事URL形式**: `https://{WORDPRESS_HOST}/category/post-slug` 形式の場合、スラッグから記事IDを取得して記事詳細ページに遷移
3. **フォールバック**: 記事が見つからない場合は外部ブラウザで開く

### ページ遷移の流れ

1. **記事一覧 → 記事詳細**
   - ユーザーが記事をタップ
   - Piniaストアに記事データを保存
   - `/post/:postId` に遷移
   - 記事詳細ページで WordPress REST API から完全な記事データを取得

2. **カテゴリフィルタ**
   - カテゴリチップをタップ
   - 同じページ内でフィルタリング条件を更新
   - WordPress REST API に `categories` パラメータを追加してリクエスト

## 環境設定

### 必要な環境

- Node.js (v18以上推奨)
- npm, yarn, または pnpm
- Android Studio (Androidアプリビルド時)
- PHP Composer (PHP機能使用時、オプション)

### 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下の内容を記述してください：

```env
# WordPress サーバーのURL（必須）
VUE_APP_WORDPRESS_HOST=https://blog.caramelos.xyz

# WebPush用の公開鍵・秘密鍵（オプション、今後の機能で使用）
VUE_APP_WEBPUSH_PUBLICKEY=your-public-key
VUE_APP_WEBPUSH_PRIVATEKEY=your-private-key

# API設定（オプション、将来の機能拡張用）
VUE_APP_API_ID=default
VUE_APP_API_TOKEN=your-api-token
VUE_APP_API_ACCESSKEY=your-access-key
VUE_APP_API_HOST=your-api-host
```

### テスト用設定

開発・テスト時は以下の設定を使用できます：

```env
# エノキ電気ニュースのURL（デモ用）
VUE_APP_WORDPRESS_HOST=https://blog.caramelos.xyz
```


## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/jikantoki/wordpress-viewer.git
cd wordpress-viewer
```

### 2. 依存パッケージのインストール

```bash
# npmの場合
npm install

# yarnの場合
yarn install

# pnpmの場合
pnpm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、WordPressサーバーのURLを設定：

```env
VUE_APP_WORDPRESS_HOST=https://your-wordpress-site.com
```

### 4. 開発サーバーの起動

```bash
# npmの場合
npm run dev

# yarnの場合
yarn dev

# pnpmの場合
pnpm dev
```

ブラウザで `http://localhost:3000` にアクセスしてアプリケーションを確認できます。

## ビルドと実行

### Webアプリとしてビルド

```bash
# 本番用ビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

ビルド成果物は `dist/` ディレクトリに出力されます。

### Androidアプリとしてビルド

#### 前提条件
- Android Studio がインストールされていること
- Android SDK が設定されていること

#### ビルド手順

1. **Webアプリをビルド**
```bash
npm run build
```

2. **Capacitorで同期**
```bash
npx cap sync android
```

3. **Android Studioで開く**
```bash
npx cap open android
```

4. Android Studioでビルドして実行

#### リリースビルド（APK/AAB）

Android Studioから:
1. `Build` > `Generate Signed Bundle / APK` を選択
2. キーストアを設定（初回のみ）
3. `release` ビルドバリアントを選択
4. APKまたはAAB形式を選択してビルド

## 開発ガイド

### コード品質チェック

```bash
# ESLintによるコードチェック
npm run lint

# TypeScript型チェック
npm run type-check
```

### ディレクトリ別の役割

- **`src/pages/`**: ページコンポーネント。ファイル名がそのままルートになります
- **`src/components/`**: 再利用可能なVueコンポーネント
- **`src/stores/`**: Piniaストア。アプリケーション全体の状態を管理
- **`src/router/`**: ルーティング設定とディープリンク処理
- **`src/mixins/`**: Vue mixins。複数のコンポーネントで共有するロジック
- **`src/styles/`**: グローバルSCSS/SASSファイル

### 新しいページの追加方法

1. `src/pages/` に新しい `.vue` ファイルを作成
2. ファイル名がルートパスになります
   - 例: `src/pages/news.vue` → `/news`
   - 動的ルート: `src/pages/category/[id].vue` → `/category/:id`

### WordPress REST APIの利用

記事データを取得する例：

```typescript
const response = await CapacitorHttp.get({
  url: `${env.VUE_APP_WORDPRESS_HOST}/wp-json/wp/v2/posts?_embed`,
})
const posts = response.data
```

`_embed` パラメータを付けることで、カテゴリ情報やアイキャッチ画像などの関連データも取得できます。

## WordPress 側の設定

### 必要な設定

このアプリを使用するには、WordPress側で REST API が有効になっている必要があります。
WordPress 4.7以降ではデフォルトで有効化されています。

### CORS設定（必要に応じて）

異なるドメインからアクセスする場合、WordPress側でCORS設定が必要な場合があります。
`.htaccess` または `wp-config.php` に以下を追加：

```php
// wp-config.php に追加
header("Access-Control-Allow-Origin: *");
```

または、プラグイン「REST API Enabler」などを使用してCORSを有効化できます。

## トラブルシューティング

### 記事が表示されない

- `.env` ファイルの `VUE_APP_WORDPRESS_HOST` が正しく設定されているか確認
- WordPress REST API が有効になっているか確認
  - ブラウザで `https://your-site.com/wp-json/wp/v2/posts` にアクセスして記事データが返ってくるか確認
- ネットワーク接続を確認

### ビルドエラーが発生する

```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install

# キャッシュをクリア
npm run build -- --force
```

### Androidビルドエラー

- Android Studio と Android SDK が最新版か確認
- `npx cap sync android` を実行して同期
- Android Studioで `File` > `Invalidate Caches / Restart` を実行

## カスタマイズ

### アプリ名・アイコンの変更

- **アプリ名**: `capacitor.config.ts` の `appName` を変更
- **アプリID**: `capacitor.config.ts` の `appId` を変更
- **アイコン**: `public/icon.png` を差し替えて `npx capacitor-assets generate` を実行

### テーマカラーの変更

`src/styles/settings.scss` または Vuetify設定ファイルでテーマカラーをカスタマイズできます。

## ライセンス

NOLICENSED - ご自由にお使いください

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 開発者

エノキ電気

## 参考リンク

- [Vue 3 公式ドキュメント](https://ja.vuejs.org/)
- [Vuetify 3 公式ドキュメント](https://vuetifyjs.com/)
- [Capacitor 公式ドキュメント](https://capacitorjs.com/)
- [WordPress REST API ハンドブック](https://developer.wordpress.org/rest-api/)
- [Pinia 公式ドキュメント](https://pinia.vuejs.org/)

---

&copy; 2019-2026 エノキ電気
