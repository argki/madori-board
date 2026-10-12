import type { ScaleCalibration } from '../types/project'

export type Point = { x: number; y: number }

export function distancePx(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** 第 2 点を始点から水平または垂直にスナップする（長い軸を採用） */
export function snapAxisAligned(from: Point, to: Point): Point {
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)
  if (dx >= dy) {
    return { x: to.x, y: from.y }
  }
  return { x: from.x, y: to.y }
}

/** 基準線のピクセル長と実寸から mmPerPixel を求める */
export function mmPerPixelFromReference(
  a: Point,
  b: Point,
  lengthMm: number,
): number | null {
  if (!(lengthMm > 0)) return null
  const px = distancePx(a, b)
  if (!(px > 0)) return null
  return lengthMm / px
}

export function createScaleCalibration(
  a: Point,
  b: Point,
  lengthMm: number,
): ScaleCalibration | null {
  const mmPerPixel = mmPerPixelFromReference(a, b, lengthMm)
  if (mmPerPixel === null) return null
  return {
    mmPerPixel,
    reference: {
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      lengthMm,
    },
  }
}

export function pxToMm(px: number, mmPerPixel: number): number {
  return px * mmPerPixel
}

export function mmToPx(mm: number, mmPerPixel: number): number {
  return mm / mmPerPixel
}

const MIN_OBJECT_SIZE_PX = 20

/**
 * 旧縮尺での mm 寸法を保つため、新縮尺向けにピクセル幅・高さを換算する。
 * 位置（x, y）は図面上の配置のままにする。
 */
export function resizeKeepingMm(
  size: { width: number; height: number },
  previousMmPerPixel: number,
  nextMmPerPixel: number,
): { width: number; height: number } {
  if (!(previousMmPerPixel > 0) || !(nextMmPerPixel > 0)) {
    return size
  }
  const factor = previousMmPerPixel / nextMmPerPixel
  return {
    width: Math.max(MIN_OBJECT_SIZE_PX, size.width * factor),
    height: Math.max(MIN_OBJECT_SIZE_PX, size.height * factor),
  }
}

/** 表示用。小数第 1 位まで */
export function formatMm(mm: number): string {
  if (!Number.isFinite(mm)) return ''
  return (Math.round(mm * 10) / 10).toFixed(1)
}

export const SCALE_PRESETS: ReadonlyArray<{ label: string; lengthMm: number }> =
  [
    { label: '室内ドア開口（目安 750 mm）', lengthMm: 750 },
    { label: '半間（目安 910 mm）', lengthMm: 910 },
    { label: 'UB 短辺（目安 1200 mm）', lengthMm: 1200 },
    { label: 'UB 長辺（目安 1600 mm）', lengthMm: 1600 },
  ]
