# ドメインモデル

## Project

| フィールド | 型                            | 説明                                     |
| ---------- | ----------------------------- | ---------------------------------------- |
| version    | number                        | スキーマ版（初期は 1）                   |
| background | `{ name, dataUrl }` 等        | 間取り画像。ファイル保存時に埋め込める形 |
| scale      | ScaleCalibration              | 平面の縮尺校正結果                       |
| objects    | BoardObject[]                 | 平面上の矩形                             |
| viewport   | `{ scale, offsetX, offsetY }` | 表示用（任意）                           |

ブラウザへの自動保存はしない。ユーザー操作によるファイル download / upload のみ。  
ファイル形式は JSON（版 `version: 1`）。実装は `src/lib/projectFile.ts`。

## ScaleCalibration

| フィールド | 型                             | 説明                                 |
| ---------- | ------------------------------ | ------------------------------------ |
| mmPerPixel | number                         | 1 ピクセルあたりの mm                |
| reference  | `{ x1, y1, x2, y2, lengthMm }` | 校正に使った基準線（任意・再編集用） |

未校正時は寸法入力を無効にするか、校正を促す。

## BoardObject（平面）

| フィールド    | 型             | 説明                                          |
| ------------- | -------------- | --------------------------------------------- |
| id            | string         | UUID 等                                       |
| x, y          | number         | 論理座標（左上、ピクセル）                    |
| width, height | number         | 論理サイズ（ピクセル）。UI では mm 表示・入力 |
| rotation      | number         | 度（任意、初期 0）                            |
| label         | string         | 任意                                          |
| elevation     | ElevationScene | 立面                                          |

## ElevationScene（立面）

平面と同様のキャンバス。

| フィールド | 型                | 説明                         |
| ---------- | ----------------- | ---------------------------- |
| background | 任意              | 立面用背景画像（無くても可） |
| scale      | ScaleCalibration  | 立面用縮尺（平面と別管理可） |
| objects    | ElevationObject[] | 立面上の矩形                 |

## ElevationObject

| フィールド          | 型     | 説明               |
| ------------------- | ------ | ------------------ |
| id                  | string | UUID 等            |
| x, y, width, height | number | 平面と同趣旨       |
| label               | string | 任意（棚段名など） |

実装時は `src/types/` に TypeScript 型として定義し、この表と同期する。
