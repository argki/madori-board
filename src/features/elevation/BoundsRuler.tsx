import { Group, Line, Text } from 'react-konva'
import { formatMm, mmToPx, pxToMm } from '../../lib/scale'

type Size = { width: number; height: number }

type BoundsRulerProps = {
  width: number
  height: number
  mmPerPixel: number
  /** 表示倍率。目盛間隔と見た目の長さを画面上で揃える */
  viewScale: number
}

const NICE_MM = [
  1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000,
] as const

const LABEL_FONT_FAMILY =
  'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif'

/** 枠外目盛・ラベルが収まるよう、フィット計算に足す余白（コンテンツ座標） */
export function boundsRulerContentPad(frame: Size): number {
  return Math.max(56, Math.min(frame.width, frame.height) * 0.12)
}

/** 画面上おおよそ 40px ごとに小目盛が来るよう mm 刻みを選ぶ */
function chooseTickSteps(
  mmPerPixel: number,
  viewScale: number,
): { minorMm: number; majorMm: number } {
  const mmPerScreenPx = mmPerPixel / Math.max(viewScale, 0.001)
  const targetMinorMm = mmPerScreenPx * 40
  let minorMm: number = NICE_MM[0]
  for (const candidate of NICE_MM) {
    minorMm = candidate
    if (candidate >= targetMinorMm) break
  }
  const majorMm = minorMm * (minorMm === 25 || minorMm === 250 ? 4 : 5)
  return { minorMm, majorMm }
}

function buildTickValues(lengthMm: number, stepMm: number): number[] {
  if (!(lengthMm > 0) || !(stepMm > 0)) return [0]
  const values: number[] = []
  const count = Math.floor(lengthMm / stepMm + 1e-6)
  for (let i = 0; i <= count; i += 1) {
    values.push(i * stepMm)
  }
  const end = Math.round(lengthMm)
  if (Math.abs(values[values.length - 1] - end) > 0.5) {
    values.push(end)
  }
  return values
}

function isMajorMm(mm: number, lengthMm: number, majorMm: number): boolean {
  const roundedLength = Math.round(lengthMm)
  if (Math.abs(mm) < 1e-6 || Math.abs(mm - roundedLength) < 1e-6) return true
  const mod = ((mm % majorMm) + majorMm) % majorMm
  return mod < 1e-6 || Math.abs(mod - majorMm) < 1e-6
}

/**
 * 立面枠の外側四方に定規目盛を描く。
 * 縦は床（枠下端）を 0 mm、横は左端を 0 mm とする。
 */
export function BoundsRuler({
  width,
  height,
  mmPerPixel,
  viewScale,
}: BoundsRulerProps) {
  if (!(width > 0) || !(height > 0) || !(mmPerPixel > 0) || !(viewScale > 0)) {
    return null
  }

  const { minorMm, majorMm } = chooseTickSteps(mmPerPixel, viewScale)
  const widthMm = pxToMm(width, mmPerPixel)
  const heightMm = pxToMm(height, mmPerPixel)
  const minorTicksX = buildTickValues(widthMm, minorMm)
  const minorTicksY = buildTickValues(heightMm, minorMm)

  const inv = 1 / viewScale
  const minorLen = 6 * inv
  const majorLen = 11 * inv
  const fontSize = Math.max(9 * inv, 4 * inv)
  const labelBand = 28 * inv
  const labelGap = 2 * inv
  const stroke = '#6c757d'
  const labelFill = '#495057'

  /** 床からの高さ mm → コンテンツ y（上が 0） */
  const yFromFloorMm = (mm: number) => height - mmToPx(mm, mmPerPixel)
  const xFromLeftMm = (mm: number) => mmToPx(mm, mmPerPixel)

  return (
    <Group listening={false}>
      {minorTicksX.map((mm) => {
        const x = xFromLeftMm(mm)
        const major = isMajorMm(mm, widthMm, majorMm)
        const len = major ? majorLen : minorLen
        const label = major ? formatMm(mm) : null
        return (
          <Group key={`x-${mm}`}>
            <Line
              points={[x, 0, x, -len]}
              stroke={stroke}
              strokeWidth={1}
              strokeScaleEnabled={false}
            />
            <Line
              points={[x, height, x, height + len]}
              stroke={stroke}
              strokeWidth={1}
              strokeScaleEnabled={false}
            />
            {label ? (
              <>
                <Text
                  x={x - labelBand / 2}
                  y={-len - labelGap - fontSize}
                  width={labelBand}
                  text={label}
                  fontSize={fontSize}
                  fontFamily={LABEL_FONT_FAMILY}
                  fill={labelFill}
                  align="center"
                />
                <Text
                  x={x - labelBand / 2}
                  y={height + len + labelGap}
                  width={labelBand}
                  text={label}
                  fontSize={fontSize}
                  fontFamily={LABEL_FONT_FAMILY}
                  fill={labelFill}
                  align="center"
                />
              </>
            ) : null}
          </Group>
        )
      })}
      {minorTicksY.map((mm) => {
        const y = yFromFloorMm(mm)
        const major = isMajorMm(mm, heightMm, majorMm)
        const len = major ? majorLen : minorLen
        const label = major ? formatMm(mm) : null
        return (
          <Group key={`y-${mm}`}>
            <Line
              points={[0, y, -len, y]}
              stroke={stroke}
              strokeWidth={1}
              strokeScaleEnabled={false}
            />
            <Line
              points={[width, y, width + len, y]}
              stroke={stroke}
              strokeWidth={1}
              strokeScaleEnabled={false}
            />
            {label ? (
              <>
                <Text
                  x={-len - labelGap - labelBand}
                  y={y - fontSize / 2}
                  width={labelBand}
                  text={label}
                  fontSize={fontSize}
                  fontFamily={LABEL_FONT_FAMILY}
                  fill={labelFill}
                  align="right"
                />
                <Text
                  x={width + len + labelGap}
                  y={y - fontSize / 2}
                  width={labelBand}
                  text={label}
                  fontSize={fontSize}
                  fontFamily={LABEL_FONT_FAMILY}
                  fill={labelFill}
                  align="left"
                />
              </>
            ) : null}
          </Group>
        )
      })}
    </Group>
  )
}
