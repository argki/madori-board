---
name: add-github-pages-deploy
description: madori-board を GitHub Pages（argki.github.io/madori-board）向けに Vite base と Actions ワークフローを設定する。Pages デプロイ、github pages、base パス設定の依頼時に使う。
disable-model-invocation: true
---

# GitHub Pages デプロイ設定

## 確認

- リモート: `argki/madori-board`
- 公開 URL: `https://argki.github.io/madori-board/`
- Vite `base`: `'/madori-board/'`

## 手順

1. `vite.config.ts` に `base: '/madori-board/'` を設定する
2. `public/.nojekyll` を追加する（空ファイル可）
3. `.github/workflows/deploy.yml` を作成する（`main` push → `npm ci` → `npm run build` → Pages artifact）
4. GitHub リポジトリ Settings → Pages → Source: **GitHub Actions**
5. ローカルで `npm run build` と `npm run preview -- --base /madori-board/` でアセットパスを確認する

## ルーティング

- 初期は Hash Router を推奨する（404 設定不要）
- Browser Router を使う場合は `404.html` フォールバックをドキュメント化する

ルール参照: `.cursor/rules/github-pages.mdc`
