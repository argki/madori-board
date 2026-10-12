# madori-board — Agent 向け指示

## プロダクト

間取り（平面）画像を背景に、PowerPoint 風に矩形オブジェクトを配置・編集する Web アプリ。矩形をダブルクリックすると立面編集を開く。公開は GitHub Pages（`argki/madori-board`、想定 URL: `https://argki.github.io/madori-board/`）。

### 必須の振る舞い

- **平面図**: 背景画像の上に矩形を配置（選択・ドラッグ・リサイズ）
- **立面図**: 平面と同様に、背景（または空キャンバス）の上に矩形を配置できる
- **寸法入力**: 平面・立面のどちらも、オブジェクトの寸法を数値入力できる（単位は mm を基本とする）
- **縮尺校正**: 背景図面の縮尺を、ユーザーが測って設定できる（後述）
- **進む / 戻る**: Undo / Redo ができる
- **永続化**: 編集結果は **ファイルとしてダウンロード**（およびファイルからの読込）する。**ブラウザには保存しない**（`localStorage` / `IndexedDB` / 自動クラウド保存は使わない）
- **ローカル確認**: `compose.yml`（Docker Compose）で動作確認できる構成を前提とする

### 縮尺校正（背景図面）

賃貸の募集間取り図は、縮尺が正確でないことが多い。大東建託（いい部屋ネット）の用語説明でも、間取り図は寸法・縮尺を必ずしも正確に表さず、部屋の広さやレイアウト確認が主目的とされている。

そのため本アプリは「図面に書いてある縮尺表記を信じる」のではなく、次を第一とする。

1. ユーザーが図面上で **2 点を指定**し、その区間の **実寸（mm）を入力**して、ピクセル ↔ mm を決める（基準線校正）
2. 基準は **できるだけ長い区間**を取る（短いと誤差が拡大する）
3. 図に寸法が無いときの **補助プリセット**（目安。最終はユーザー入力）:
   - 室内ドア開口: おおよそ 700〜800 mm（よく使う目安として 750 mm 前後）
   - ユニットバス型番: 例 `1216` → 1200 × 1600 mm
   - 木造で半間モジュールが見える場合: 半間 ≈ 910 mm（物件による）
   - 帖数表記からの一辺推定は **検算用**に留め、基準の第一候補にしない（江戸間・中京間・団地間などで 1 帖の大きさが違う）

**2015 年頃の大東建託賃貸の募集図を想定した前提（調査メモ）:**

- 掲載間取りはレイアウト把握用で、図面上に信頼できる縮尺バーや一貫した寸法線があるとは限らない
- 専有面積・各室帖数は物件情報側にあり、図そのものの mm 精度は保証されない
- 実装は「基準線校正 + 上記プリセット」を用意し、UI 上で「概算であり現地実測を優先する」旨を短く示す

詳細な型・画面は `@docs/architecture.md` と `@docs/domain-model.md` を正本とする。

## 技術方針

依存は **基本的に latest**（導入時点の現行安定版）。導入時にバージョンを再確認し、確定内容は docs に書く。推測だけで別系統へ乗り換えない。

### 採用決定（調査済み）

| 項目 | 採用 | 理由 |
|------|------|------|
| ローカル実行 | **`compose.yml` + Vite 開発サーバ**（HMR） | API が無い静的アプリでは nginx は不要。本番相当の確認は Compose の **`preview` プロファイル**で `vite preview` を使う（公開先は GitHub Pages なので自前 nginx と揃える意味が薄い） |
| UI | **`bootstrap`（CSS）+ `react-bootstrap`（安定版 2.x 系）** | React 向けの定番。モーダル等を Bootstrap の JS プラグインではなく React コンポーネントで扱う。React 19 向け修正も 2.x に入っている。3.x は安定版が出てから検討 |
| 状態 + Undo/Redo | **`zustand` + `zundo`（`temporal` ミドルウェア）** | Zustand 向け Undo の事実上の定番。履歴は `partialize` でドキュメント状態に限定し、ズーム等の一時 UI は履歴から外してよい |
| キャンバス | **Konva / react-konva** | 矩形・Transformer・背景 Image に適合。未導入なら Fabric へ切り替えない |
| ビルド | **Vite + React + TypeScript** | 現行のフロント標準。Pages の `base: '/madori-board/'` と相性がよい |

### Compose の具体方針

- サービス名は **`web`**（デフォルト）。Node イメージ上で `npm run dev`（`vite --host 0.0.0.0`）。ポート `5173`
- ソースは bind mount。`node_modules` はコンテナ側ボリュームでホストと分離（ネイティブバイナリずれ防止）
- macOS Docker ではファイル監視に polling（`server.watch.usePolling` 等）を用意する
- `profiles: [preview]` などで本番ビルドの静的配信確認を任意実行できるようにする
- 開発用と本番用のイメージ関心事は分ける（dev は HMR、Pages 用は CI の `npm run build`）

### フォーマットとコミット

コミットする変更は、**必ずフォーマットしたうえで**コミットする。フォーマットは **ホストの `node_modules` ではなく Docker（Compose）経由**で行う（実行環境を揃えるため）。

| 用途 | コマンド（想定） |
|------|------------------|
| リポジトリ全体を整形（コミット前） | `docker compose run --rm web npm run format` |
| `web` が起動中なら同じ処理 | `docker compose exec -T web npm run format` |
| 整形結果の確認のみ | `docker compose run --rm web npm run format:check` |

- `package.json` に `format` / `format:check` を用意する（Prettier。導入時に最新安定版）
- Agent がコミットする場合も、**先に上記の format を成功させてから** `git commit` する
- Cursor Hooks: 編集後は起動中の `web` に対して単ファイル整形を試みる。`git commit` 前は format 実施を確認する（`.cursor/hooks/`）

### 前提・制約

| 項目 | 方針 |
|------|------|
| 公開 | 静的フロントのみ（初期は API なし）。GitHub Pages |
| データ | JSON 等の **ファイル download / upload** のみ。ブラウザ永続化はしない |
| スタイル | Bootstrap のユーティリティ・コンポーネント優先。カスタム CSS は最小限。独自デザインシステムは作らない |

### リポジトリ構成（目標）

```
compose.yml              # ローカル動作確認の前提（dev + preview プロファイル）
Dockerfile               # Compose 用（必要なら Dockerfile.dev に分離可）
src/features/board/      # 平面キャンバス・矩形・寸法・縮尺校正
src/features/elevation/  # 立面キャンバス（平面と同様の矩形操作）
src/stores/              # Zustand + zundo
src/types/               # ドメイン型
src/lib/                 # ファイル I/O、座標・縮尺変換
.cursor/hooks/           # 編集後整形・コミット前確認・破壊的 git のガード
```

## 開発上の約束

- 変更は最小 diff。依頼外のリファクタや依存追加をしない
- git commit / push はユーザーが明示したときだけ。コミット前は Docker 経由で format する（上記）
- 仕様の正本は `docs/`。ルール（`.cursor/rules`）は要約と参照のみ
- Cursor の使い方は `@docs/cursor/README.md` を参照


## Cursor 設定の置き場

| 種類 | パス |
|------|------|
| Project Rules | `.cursor/rules/*.mdc` |
| Project Skills | `.cursor/skills/*/SKILL.md` |
| Commands | `.cursor/commands/*.md`（例: `/suggest-commit-message`） |
| Hooks | `.cursor/hooks.json`, `.cursor/hooks/*` |
| 使い方ドキュメント | `docs/cursor/README.md` |
| コミットメッセージ規約 | `docs/commit-message.md` |
