# コミットメッセージを提案する

未コミットの変更を調べ、このリポジトリの規約に沿ったコミットメッセージ案を出す。**まだコミットしない**（ユーザーが明示するまで `git commit` しない）。

## 手順

1. リポジトリルートで次を並行実行する（読み取りのみ）:
   - `git status`
   - `git diff`（unstaged）
   - `git diff --cached`（staged）
   - `git log -8 --oneline`（既存の口調・type の付け方）
2. staged と unstaged の両方を見る。どちらも無ければ「提案する差分が無い」と報告して終わる。
3. 差分の意図を要約する。無関係な変更が混ざっている場合は、**分割したコミット案**も出す。
4. `@docs/commit-message.md` の規約に従い、メッセージを **2〜3 案**出す（推奨 1 つを明示する）。
5. **subject / body は必ず日本語**。英語のみの案は出さない。
6. 日本語を書く前に **yomiyasu スキルを読む**（`@yomiyasu`）。差分の事実だけを、yomiyasu の方針（意味の保持・情報を足さない・常体の説明・比喩やコピー調を避ける）で書く。yomiyasu の「変えたところ」などの推敲報告欄は出さない。
7. コミット前フォーマットを忘れないよう、次を短く添える:

   - `docker compose run --rm web npm run format`
   - （`web` 起動中なら）`docker compose exec -T web npm run format`

## 出力フォーマット

次の見出しで返す（余計な前置きは不要）:

### 変更の要約

- （箇条書き。何がどう変わったか）

### 推奨メッセージ

```
（1 行目。必要なら空行＋本文）
```

### 代替案

```
（案 B）
```

```
（案 C。無ければ省略可）
```

### 分割の提案

- 1 コミットでよい場合は「分割不要」
- 分割する場合は、各コミットに含めるパス／意図とメッセージ案

### コミット前チェック

- format コマンド（上記）
- まだコミットしていないこと

## メッセージ規約（要約）

正本は `docs/commit-message.md`。要点のみ:

- 形式: `type(scope): subject`（Conventional Commits）
- type: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`
- scope 例: `board` `elevation` `scale` `store` `compose` `pages` `cursor` `docs`（不明なら省略）
- **subject / body は必ず日本語**（yomiyasu 準拠）。type / scope のみ英語。句点なし。1 行目は 72 文字以内目安
- 「なぜ」は本文へ。1 コミット 1 意図。差分にない効果・感想を足さない
