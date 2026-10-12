---
name: add-board-object
description: 間取りボードに矩形オブジェクトを追加するときの型・store・UI の整合チェック。ボードオブジェクト、Konva 矩形、store 追加、立面の空データ初期化を行う。ユーザーが矩形追加・新規オブジェクト・board object と言ったときに使う。
disable-model-invocation: true
---

# ボードオブジェクト追加

## 前提

- `@docs/domain-model.md` の `BoardObject` / `ElevationScene` に従う
- 単一の正は store（`src/stores/`）。キャンバスは store の投影

## 手順

1. `src/types/` に型がなければ `BoardObject` を定義する（または既存を拡張する）
2. store に `addObject(partial)` を追加する。`id` は `crypto.randomUUID()` 等
3. 新規オブジェクトの `elevation` は空の初期値（例: `{ objects: [] }`）
4. `src/features/board/` に矩形ノードコンポーネントを追加または更新する。選択・ドラッグ・Transformer を壊さない
5. 選択中に「立面を編集」から立面 UI を開けることを確認する
6. 変更後、該当ファイルだけ lint する（プロジェクトに script があれば `npm run lint`）

## やらないこと

- 依頼外の立面 UI の全面作り直し
- 座標系の変更（必要ならユーザーに確認する）
