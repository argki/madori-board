# madori-board

間取り画像を背景に矩形を配置し、立面を編集する Web アプリ（GitHub Pages 公開予定）。

仕様の正本: [docs/architecture.md](docs/architecture.md) / [AGENTS.md](AGENTS.md)

## ローカル起動（Docker Compose）

```bash
docker compose up --build
```

ブラウザで http://localhost:5173/madori-board/

本番ビルド相当の確認:

```bash
docker compose --profile preview up --build
```

http://localhost:4173/madori-board/

## フォーマット（コミット前）

```bash
docker compose run --rm web npm run format
```

## ホストで直接動かす場合

```bash
npm ci
npm run dev
```
