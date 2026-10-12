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
  width: number
  height: number
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

export const emptyProject = (): Project => ({
  version: 1,
  objects: [],
})
