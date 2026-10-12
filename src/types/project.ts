/** ドメイン型。詳細は docs/domain-model.md */

export type ScaleCalibration = {
  mmPerPixel: number
  reference?: {
    x1: number
    y1: number
    x2: number
    y2: number
    lengthMm: number
  }
}

export type ElevationObject = {
  id: string
  x: number
  y: number
  width: number
  height: number
  label?: string
}

export type ElevationScene = {
  background?: { name: string; dataUrl: string }
  scale?: ScaleCalibration
  objects: ElevationObject[]
}

export type BoardObject = {
  id: string
  x: number
  y: number
  /** 幅（平面上）。UI では mm */
  width: number
  /** 奥行き（平面上）。UI では mm */
  height: number
  /**
   * 高さ（立面の縦方向）。UI では mm。
   * 立面キャンバスの枠の高さに使う。
   */
  objectHeight: number
  rotation?: number
  label?: string
  elevation: ElevationScene
}

export type Project = {
  version: number
  background?: { name: string; dataUrl: string }
  scale?: ScaleCalibration
  objects: BoardObject[]
  viewport?: { scale: number; offsetX: number; offsetY: number }
}

/** 高さ（立面の縦）の既定ピクセル。旧 JSON に objectHeight が無いときも使う */
export const DEFAULT_OBJECT_HEIGHT = 200

export const emptyProject = (): Project => ({
  version: 1,
  objects: [],
})
