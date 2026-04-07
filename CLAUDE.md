# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

```bash
npm run dev       # 開発サーバー起動 (http://localhost:5173)
npm run build     # 本番ビルド (tsc + vite build)
npm run lint      # ESLint 実行
npm run preview   # ビルド結果のプレビュー
```

## 技術スタック

- **React 19** + **TypeScript**
- **Vite 8** — ビルドツール・開発サーバー
- **Supabase** — 認証・DB・Storage
- **ESLint** (eslint-plugin-react-hooks, eslint-plugin-react-refresh)
- **GitHub Pages** — ホスティング（ハッシュベースルーティング `#/view/:token`）

## アーキテクチャ

```
src/
  main.tsx                        # エントリーポイント。hash で ViewPage か App か分岐
  App.tsx                         # ルートコンポーネント（認証・地図一覧・設定）
  types.ts                        # 共通型定義（TravelRecord, MapMeta など）
  index.css                       # グローバルスタイル（html/body/root overflow:hidden）
  App.css                         # App・地図一覧のスタイル

  lib/
    supabase.ts                   # Supabaseクライアント
    postApi.ts                    # 投稿CRUD・ピン留めAPI（RPC経由）
    viewApi.ts                    # 閲覧専用API（get_public_view RPC）

  hooks/
    useAuth.ts                    # 認証（signIn/signUp/signOut/deleteAccount）
    useProfile.ts                 # ユーザー名・メール・パスワード変更
    useMaps.ts                    # 地図一覧の取得・作成・参加・削除
    useViewSettings.ts            # 閲覧専用モードON/OFF・トークン再発行
    useZoomPan.ts                 # ホイール・ピンチ・ドラッグによるズームパン

  components/
    CopyButton.tsx                # SVGアイコンのコピーボタン
    PhotoGrid.tsx                 # 投稿内画像グリッド（最大2行）+ ギャラリーモーダル
    EditPostModal.tsx             # 投稿編集モーダル

  pages/
    LoginPage.tsx                 # ログイン・サインアップ
    MapList.tsx                   # 地図一覧（作成・参加・削除・設定）
    AccountSettings.tsx           # アカウント設定モーダル（名前/メール/PW変更・退会）
    ViewSettingsPanel.tsx         # 閲覧専用共有設定パネル

    domestic/
      index.tsx                   # 国内地図ページ
      domestic.css                # 国内・海外共通スタイル
      components/
        JapanMap.tsx              # SVG日本地図
        PrefectureModal.tsx       # 都道府県モーダル（投稿一覧・追加・ピン留め）
      hooks/
        useTravel.ts              # 国内投稿の取得・追加・削除・ピン留め

    overseas/
      index.tsx                   # 海外地図ページ
      overseas.css                # 海外固有スタイル
      components/
        WorldMap.tsx              # SVG世界地図
        CountryModal.tsx          # 国モーダル（投稿一覧・追加・ピン留め）
      hooks/
        useWorldTravel.ts         # 海外投稿の取得・追加・削除・ピン留め

    view/
      ViewPage.tsx                # 閲覧専用ページ（ログイン不要）
      ViewRecordModal.tsx         # 閲覧専用モーダル（読み取り専用）

public/                           # Viteがそのまま配信するファイル
index.html                        # HTMLエントリーポイント
vite.config.ts                    # Vite設定
```

## Supabase テーブル構成

| テーブル | 概要 |
|---|---|
| `maps` | 地図。`owner_id`, `share_id`, `type`, `public_view_enabled`, `view_token` |
| `map_members` | 地図メンバー（owner + join したユーザー） |
| `posts` | 投稿本体。`user_id`, `location_id`, `body`, `pinned_at` |
| `post_maps` | 投稿と地図の多対多 |
| `post_photos` | 投稿に紐づく画像の `storage_path` |
| `profiles` | ユーザーのプロフィール（`username`）。auth.users の INSERT トリガーで自動作成 |

## 主要 RPC 関数

| 関数 | 概要 |
|---|---|
| `get_my_maps` | 自分が参加している地図一覧を返す |
| `get_posts_for_map(p_map_id)` | 地図に属する投稿一覧（`pinned_at` 含む） |
| `create_post_with_maps` | 投稿作成と `post_maps` への紐づけを一括実行 |
| `remove_post_from_map` | 投稿を地図から外す（孤立したら投稿ごと削除） |
| `update_post_body` | 投稿本文の更新（作成者のみ） |
| `update_post_maps` | 投稿の紐づき地図を更新 |
| `pin_post(p_map_id, p_post_id)` | 投稿をピン留め（マップオーナーのみ） |
| `unpin_post(p_map_id, p_post_id)` | ピン留め解除（マップオーナーのみ） |
| `set_public_view` | 閲覧専用モードのON/OFF |
| `regenerate_view_token` | 閲覧URLのトークン再発行 |
| `get_public_view(p_token)` | 閲覧専用ページ用データ取得（認証不要） |

## 重要な実装メモ

- **ルーティング**: React Router 未使用。`window.location.hash` で `#/view/:token` を判定して `main.tsx` で分岐
- **ズームパン**: `useZoomPan.ts` でホイール・ピンチ・ドラッグを統合管理。タップ時の click 発火を妨げないよう `touchstart`（1本指）は `preventDefault()` しない
- **ピン留めソート**: ピン留め順（`pinned_at ASC`）→ 新着順（`created_at DESC`）。フロント・閲覧モード両方で同じ順序
- **マップ名**: 最大15文字（フロントでバリデーション）
- **スクロール制御**: `html/body/#root` は `overflow: hidden`。スクロール可能な領域は地図モーダル内のみ
- **写真グリッド**: `window.matchMedia` でカラム数を検知し、最大2行まで表示。超過分は「すべて見る」ボタン
