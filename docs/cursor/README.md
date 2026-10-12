# Cursor 開発設定の使い方（madori-board）

リポジトリに入れた Cursor 設定の使い方を、このファイルにまとめる。設定本体はリポジトリ直下と `.cursor/` にある。

## 場面別の使い分け

チャットや作業の場面ごとに、どれを使うかを示す。

| 場面                                             | 使うもの                     | あなたがすること                                                |
| ------------------------------------------------ | ---------------------------- | --------------------------------------------------------------- |
| Agent に実装や修正を頼む（いつもの開発）         | `AGENTS.md` と Rules（自動） | 特になし。仕様が絡むなら `@docs/architecture.md` を添付する     |
| プロジェクト方針を Agent に明示したい            | `AGENTS.md`                  | チャットで `@AGENTS.md` を付ける                                |
| キャンバス・立面・Pages まわりのコードを触る     | Rules（`.mdc`）              | 普段は自動。足りなければ該当ファイルを開くか、ルールを `@` する |
| 矩形オブジェクト追加を、決まった手順で進めたい   | Skills                       | `@add-board-object` を付ける                                    |
| GitHub Pages のデプロイ設定を Agent に頼む       | Skills                       | `@add-github-pages-deploy` を付ける                             |
| コード整形や危険な git 操作の確認を自動化したい  | Hooks                        | 設定済みなら自動。動かないときだけ「Hooks」節を見る             |
| チーム共通の開発方針を文書に足したい             | Rules または `AGENTS.md`     | 全体方針は `AGENTS.md`。ファイル種別ごとは `.mdc`               |
| 何度も同じ手順の作業をスキルにしたい             | Skills                       | `.cursor/skills/<名前>/SKILL.md` を追加する                     |
| ファイル保存後などに、必ずスクリプトを走らせたい | Hooks                        | `.cursor/hooks.json` にイベントを追加する                       |
| 定型プロンプトを短く呼びたい                     | Commands                     | チャット入力で `/` → コマンド名を選ぶ（例: 次の区切り実装）     |

## 役割の使い分け

| 種類      | 役割               | いつ効くか                         | パス                        |
| --------- | ------------------ | ---------------------------------- | --------------------------- |
| AGENTS.md | プロジェクトの説明 | ほぼ常時（自動）                   | `AGENTS.md`                 |
| Rules     | 守るべき短いルール | 常時、または対象ファイルを触るとき | `.cursor/rules/*.mdc`       |
| Skills    | 作業の手順         | `/` や `@` で呼ぶ（確実）          | `.cursor/skills/*/SKILL.md` |
| Commands  | 短い定型プロンプト | 入力欄で `/コマンド名`             | `.cursor/commands/*.md`     |
| Hooks     | 自動スクリプト     | ファイル編集後・シェル実行前など   | `.cursor/hooks.json`        |

- 方針や約束 → AGENTS.md / Rules
- 「この順でやって」→ Skills
- 「この文言で頼む」→ Commands
- LLM に任せずスクリプトで必ず実行する → Hooks

## 設定ファイルの場所

```
AGENTS.md
.cursor/
  rules/*.mdc
  skills/*/SKILL.md
  commands/*.md
  hooks.json
  hooks/*.sh
docs/
  architecture.md    # 仕様の正本（Agent 用）
  domain-model.md
  commit-message.md  # コミットメッセージ規約
```

## AGENTS.md

ルートの Markdown。プロダクト概要、Pages 前提、ディレクトリ方針、開発の約束を書く。

- 普段は Cursor が自動で読むので操作は不要
- 方針を明示したいときは `@AGENTS.md`
- 詳細仕様は `docs/architecture.md` に置き、ここは要約とリンクに留める
- `CLAUDE.md` と内容を二重に書かない

コードベースが大きくなったら、`src/features/elevation/AGENTS.md` のようにサブフォルダにも置ける。その配下の作業では、そちらの指示が優先される。

## Rules（`.cursor/rules/*.mdc`）

| ファイル               | いつ付くか                                      |
| ---------------------- | ----------------------------------------------- |
| `project.mdc`          | 常時                                            |
| `typescript-react.mdc` | `*.ts` / `*.tsx` を扱うとき                     |
| `canvas-board.mdc`     | `src/features/board/**` または `elevation/**`   |
| `github-pages.mdc`     | `vite.config.*` / `.github/**` / `package.json` |

手動で付けるときは `@project` のようにルール名を `@` する。

編集時の注意:

- 1 ファイル 1 テーマにする。長い仕様は `docs/` に書き、ルールから `@docs/...` で参照する
- 拡張子は `.mdc` にする（`.md` だけではルールとして無視される）
- 追加するときは `/create-rule` を使うか、`.cursor/rules/名前.mdc` を作成し、Customize → Rules で確認する
- Tab（インライン補完）には効かない。Agent チャット向け

公式: [Rules](https://cursor.com/docs/context/rules)

## Skills（`.cursor/skills/`）

| 呼び方                     | 用途                                         |
| -------------------------- | -------------------------------------------- |
| `@add-board-object`        | 矩形オブジェクト追加（型・store・UI の整合） |
| `@add-github-pages-deploy` | Vite `base` と Actions で Pages 公開         |

ドラフトでは `disable-model-invocation: true` のため、確実に使うときは必ず `@` する。

新規スキルの追加手順:

1. `.cursor/skills/my-skill/SKILL.md` を作成する
2. frontmatter に `name`（小文字・ハイフン）と `description`（何をするかと、いつ使うか）を書く
3. 本文に番号付き手順と「やらないこと」を書く
4. 上の表に 1 行追加する

個人用は `~/.cursor/skills/`。`~/.cursor/skills-cursor/` には置かない（Cursor 組み込み用）。

公式: [Agent Skills](https://cursor.com/docs/context/skills)

## Commands（`.cursor/commands/`）

チャット入力で `/` を押し、コマンドを選ぶと、その Markdown がプロンプトとして使われる。

| コマンド                        | 用途                                                                       |
| ------------------------------- | -------------------------------------------------------------------------- |
| `/suggest-commit-message`       | 未コミット差分を見てコミットメッセージ案を出す（コミットはしない）         |
| `/implement-next-commit-slice`  | AGENTS に沿い、次のコミット区切りまで実装する（コミットはしない）         |

新規コマンド: `.cursor/commands/名前.md` を追加する。本文に手順と出力形式を書く。規約の正本がある場合は `@docs/...` を参照する。

コミットメッセージの規約: `@docs/commit-message.md`

## Hooks（`.cursor/hooks.json`）

イベントでスクリプトを必ず実行する。Rules と違い、モデルが無視できない。

| いつ            | スクリプト                 | 何をするか                                                                  |
| --------------- | -------------------------- | --------------------------------------------------------------------------- |
| ファイル編集後  | `post-edit-format.sh`      | Compose の `web` が起動中なら、編集ファイルをコンテナ内 Prettier で整形する |
| `git commit` 前 | `before-git-commit.sh`     | コミット前の Docker 経由 format を確認する（未実施なら ask）                |
| シェル実行前    | `guard-destructive-git.sh` | force push / hard reset / clean -f なら確認する                             |

方針の正本は `@AGENTS.md` の「フォーマットとコミット」。コミット前の全体整形は次のとおり。

```bash
docker compose run --rm web npm run format
# web 起動中
docker compose exec -T web npm run format
```

前提:

- JSON の読み取りは `python3`（なければ `jq`）。どちらも無いとキー取得できず allow / no-op
- `compose.yml` や `web` 未起動時、編集後整形はスキップする（コミット前の全体 format は `run --rm` で実行する）
- clone 後に権限が落ちていたら: `chmod +x .cursor/hooks/*.sh`

確認手順:

1. Cursor を開き直すか、`hooks.json` を保存する
2. Customize → Hooks、または Hooks 出力チャンネルでエラーがないか見る
3. `docker compose up` 後に Agent にファイル編集させ、整形されるか確認する
4. `git commit` で確認ダイアログが出るか試す
5. 破壊的な git コマンドで確認が出るか試す

無効化する場合は、`hooks.json` から該当エントリを削るか、スクリプト先頭で `exit 0` する。

公式: [Hooks](https://cursor.com/docs/agent/hooks)

## 最初の確認（一度だけ）

1. Customize → Rules で `.mdc` が並んでいるか見る
2. チャットで `@AGENTS.md` と `@docs/architecture.md` を付け、簡単な実装を頼んでみる
3. 定型作業なら `@add-board-object` を付ける
4. Hooks を使うなら、上の確認手順を一度通す
