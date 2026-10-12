# コミットメッセージ規約（madori-board）

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/ja/v1.0.0/) を採用する。Qiita / Zenn でも同規約が紹介されている。

## 形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

- `type` と `: ` のあとの `subject` は必須
- `scope`・`body`・`footer` は任意
- 破壊的変更は `type(scope)!: subject` の `!`、またはフッター `BREAKING CHANGE: ...`

## type（使うもの）

| type       | 使うとき                                   |
| ---------- | ------------------------------------------ |
| `feat`     | ユーザー向けの機能追加                     |
| `fix`      | バグ修正                                   |
| `docs`     | ドキュメントのみ                           |
| `style`    | 見た目・フォーマットのみ（意味は変えない） |
| `refactor` | 動作を変えない構造の整理                   |
| `perf`     | 性能改善                                   |
| `test`     | テストの追加・修正                         |
| `build`    | ビルド・依存関係                           |
| `ci`       | CI 設定                                    |
| `chore`    | 上記以外の雑務（ツール設定など）           |
| `revert`   | 取り消し                                   |

## scope（任意・このリポジトリ向け）

変更の中心が分かる短い英単語。例: `board`, `elevation`, `scale`, `store`, `compose`, `pages`, `cursor`, `docs`

不明なら scope は省略してよい。

## subject（1 行目の要約）

- **subject と body は必ず日本語**にする（英語のみの subject / body は不可）
- 日本語は **yomiyasu スキルに準じて**書く（後述）
- `type` / `scope` は英語のまま（Conventional Commits の識別子）
- 固有名詞・API 名・ファイルパス・コマンドはそのまま英語で書いてよい（例: `Prettier`, `compose.yml`）
- **何をしたか**が分かる命令・要約（「〜を追加」「〜を修正」）。「〜した」の完了報告調だけにしない
- 文末に句点（。．.）を付けない
- **1 行目全体は 72 文字以内**を目安とする。可能なら subject 部分は短く保つ
- 「なぜ」が必要なときは本文へ回す。1 行目に理由を詰め込まない

良い例:

```
feat(board): 矩形のドラッグ移動を追加
fix(scale): 基準線が未設定のとき寸法入力を無効化
docs(cursor): Commands の使い方を追記
```

避ける例:

```
update
修正
いろいろ直した
feat: コードを変更
feat(board): add rectangle drag
feat: Update docs
feat(board): ドラッグ体験をシームレスに向上
```

## body / footer

- 本文が必要なときだけ、1 行空けて **日本語**で書く（背景、制約、代替案）。文体も yomiyasu に準じる
- Issue 参照は `Refs: #123` などフッターでよい（トークンは英語、説明が続く場合は日本語）
- `BREAKING CHANGE:` の説明文も日本語にする
- 1 コミットに **意図が複数**あるときは、メッセージ案とあわせて分割案を出す

## 日本語と yomiyasu

subject / body の日本語は、エージェントスキル **yomiyasu**（`yomiyasu` / `@yomiyasu`）の方針に合わせて書く。提案・コミット時はスキルを読み、次を守る。

| 観点         | コミットメッセージでの扱い                                             |
| ------------ | ---------------------------------------------------------------------- |
| 意味の保持   | 差分が示した変更だけを書く。やっていない改善や意図を足さない           |
| 情報の不増補 | 推測の動機・効果・感情を本文に足さない                                 |
| 立場・文末   | 変更内容の説明（常体）。勧めの「しましょう」やコピー調にしない         |
| 主述         | 誰が何をしたか／何がどうなったかが追える短い句にする                   |
| 比喩・装飾   | 「シームレスに向上」「体験を磨く」など曖昧・大げさな言い回しを使わない |
| 出力形式     | yomiyasu の「変えたところ」欄は出さない。コミット提案の体裁だけ返す    |

コミットメッセージの形式（type / scope / 長さ）はこのファイルが優先する。日本語の自然さ・正確さは yomiyasu が優先する。

## このリポジトリの運用

- コミット前に `docker compose run --rm web npm run format`（または起動中は `exec -T`）を成功させる（`@AGENTS.md`）
- git commit / push はユーザーが明示したときだけ実行する
