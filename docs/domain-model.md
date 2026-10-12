# ドメインモデル

## Project

| フィールド | 型                            | 説明                                     |
| ---------- | ----------------------------- | ---------------------------------------- |
| version    | number                        | スキーマ版（初期は 1）                   |
| background | `{ name, dataUrl }` 等        | 間取り画像。ファイル保存時に埋め込める形 |
| scale      | ScaleCalibration              | 平面の縮尺校正結果                       |
| objects    | BoardObject[]                 | 平面上の矩形                             |
| viewport   | `{ scale, offsetX, offsetY }` | 表示用（任意）                           |

ブラウザへの自動保存はしない。ユーザー操作によるファイルの download / upload のみとする。  
ファイル形式は JSON（版 `version: 1`）。実装は `src/lib/projectFile.ts`。

## ScaleCalibration

| フィールド | 型                             | 説明                                 |
| ---------- | ------------------------------ | ------------------------------------ |
| mmPerPixel | number                         | 1 ピクセルあたりの mm                |
| reference  | `{ x1, y1, x2, y2, lengthMm }` | 校正に使った基準線（任意・再編集用） |

未校正時は寸法入力を無効にするか、校正を促す。

## BoardObject（平面）

| フィールド   | 型             | 説明                                                       |
| ------------ | -------------- | ---------------------------------------------------------- |
| id           | string         | UUID 等                                                    |
| x, y         | number         | 論理座標（左上、ピクセル）                                 |
| width        | number         | 幅（平面上の一辺、ピクセル）。UI では mm                   |
| height       | number         | 奥行き（平面上のもう一辺、ピクセル）。UI では mm           |
| objectHeight | number         | 高さ（立面の縦、ピクセル）。UI では mm。立面枠の高さに使う |
| rotation     | number         | 度（任意、初期 0）。90 度刻み                              |
| label        | string         | 名称（任意）                                               |
| elevation    | ElevationScene | 立面                                                       |

立面キャンバスの枠は、幅 `width` × 高さ `objectHeight` の矩形として描く。

## ElevationScene（立面）

平面矩形に紐づく立面キャンバス。**背景画像は使わない**。立面では縮尺校正を行わず、寸法（mm）は平面の `scale` を参照する。枠の大きさは親の平面オブジェクトの幅×高さ（`width` × `objectHeight`）。

| フィールド | 型                | 説明                                                    |
| ---------- | ----------------- | ------------------------------------------------------- |
| background | 任意              | 互換のため型には残す。UI では設定・表示しない           |
| scale      | ScaleCalibration  | 互換のため型には残す。UI では校正せず、平面の縮尺を使う |
| objects    | ElevationObject[] | 立面上の矩形（幅・高さ）                                |

## ElevationObject

| フィールド          | 型     | 説明               |
| ------------------- | ------ | ------------------ |
| id                  | string | UUID 等            |
| x, y, width, height | number | 平面と同趣旨       |
| label               | string | 任意（棚段名など） |

実装時は `src/types/` に TypeScript 型として定義し、この表と同期する。
