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
- **ESLint** (eslint-plugin-react-hooks, eslint-plugin-react-refresh)

## アーキテクチャ

```
src/
  main.tsx       # エントリーポイント — ReactDOM.createRoot
  App.tsx        # ルートコンポーネント
  assets/        # 静的アセット
public/          # Viteがそのまま配信するファイル
index.html       # HTMLエントリーポイント
vite.config.ts   # Vite設定
```

TypeScriptの設定は `tsconfig.app.json`（src配下）と `tsconfig.node.json`（vite.config.ts等のNode環境）に分かれている。
