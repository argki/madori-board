import type Konva from 'konva'
import { useEffect, useRef } from 'react'
import { Rect, Text, Transformer } from 'react-konva'

export type RectObject = {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  label?: string
}

export type RectAppearance = {
  fill: string
  stroke: string
  labelFill?: string
}

const DEFAULT_APPEARANCE: RectAppearance = {
  fill: 'rgba(13, 110, 253, 0.22)',
  stroke: '#0d6efd',
  labelFill: '#212529',
}

const LABEL_FONT_FAMILY =
  'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif'

const ROTATION_SNAPS = [0, 90, 180, 270]

/** 回転角を 90 度刻みに丸める（0 / 90 / 180 / 270） */
function snapRotationToRightAngle(degrees: number): number {
  const normalized = ((degrees % 360) + 360) % 360
  const snapped = Math.round(normalized / 90) * 90
  return snapped === 360 ? 0 : snapped
}

const LABEL_FONT_MIN = 3
const LABEL_FONT_MAX = 14
const LABEL_LINE_HEIGHT = 1.15

/**
 * 名称が矩形内に収まるようフォントを決める。
 * 短い辺の上限を守りつつ、文字数に応じて下限（3px）まで小さくする。
 * 拡大表示すれば読める前提で、省略より表示を優先する。
 */
function labelFontSizeForRect(
  width: number,
  height: number,
  text: string,
): number {
  const shorter = Math.min(width, height)
  const maxSize = Math.min(
    LABEL_FONT_MAX,
    Math.max(LABEL_FONT_MIN, Math.floor(shorter * 0.28)),
  )
  const padding = 2
  const availW = Math.max(1, width - padding * 2)
  const availH = Math.max(1, height - padding * 2)
  const charCount = Math.max(1, Array.from(text).length)

  for (let size = maxSize; size >= LABEL_FONT_MIN; size -= 1) {
    const cols = Math.max(1, Math.floor(availW / size))
    const rows = Math.max(1, Math.floor(availH / (size * LABEL_LINE_HEIGHT)))
    if (cols * rows >= charCount) return size
  }
  return LABEL_FONT_MIN
}

type RectObjectNodeProps = {
  object: RectObject
  selected: boolean
  listening?: boolean
  rotateEnabled?: boolean
  appearance?: RectAppearance
  onSelect: () => void
  onChange: (patch: Partial<RectObject>) => void
}

export function RectObjectNode({
  object,
  selected,
  listening = true,
  rotateEnabled = true,
  appearance = DEFAULT_APPEARANCE,
  onSelect,
  onChange,
}: RectObjectNodeProps) {
  const shapeRef = useRef<Konva.Rect>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const label = object.label?.trim()
  const labelFontSize = label
    ? labelFontSizeForRect(object.width, object.height, label)
    : LABEL_FONT_MIN
  const labelPadding = Math.max(1, Math.round(labelFontSize * 0.2))

  useEffect(() => {
    const transformer = transformerRef.current
    const shape = shapeRef.current
    if (!transformer) return
    if (selected && shape) {
      transformer.nodes([shape])
    } else {
      transformer.nodes([])
    }
    transformer.getLayer()?.batchDraw()
  }, [selected])

  return (
    <>
      <Rect
        ref={shapeRef}
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        rotation={object.rotation ?? 0}
        fill={appearance.fill}
        stroke={appearance.stroke}
        strokeWidth={2}
        strokeScaleEnabled={false}
        listening={listening}
        draggable={listening}
        onPointerDown={(event) => {
          event.cancelBubble = true
        }}
        onMouseDown={(event) => {
          event.cancelBubble = true
        }}
        onTouchStart={(event) => {
          event.cancelBubble = true
        }}
        onClick={(event) => {
          event.cancelBubble = true
          onSelect()
        }}
        onTap={(event) => {
          event.cancelBubble = true
          onSelect()
        }}
        onDragEnd={(event) => {
          onChange({
            x: event.target.x(),
            y: event.target.y(),
          })
        }}
        onTransformEnd={() => {
          const node = shapeRef.current
          if (!node) return
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()
          node.scaleX(1)
          node.scaleY(1)
          const rotation = rotateEnabled
            ? snapRotationToRightAngle(node.rotation())
            : 0
          node.rotation(rotation)
          onChange({
            x: node.x(),
            y: node.y(),
            rotation,
            width: Math.max(1, node.width() * scaleX),
            height: Math.max(1, node.height() * scaleY),
          })
        }}
      />
      {label ? (
        <Text
          x={object.x}
          y={object.y}
          width={object.width}
          height={object.height}
          rotation={snapRotationToRightAngle(object.rotation ?? 0)}
          text={label}
          align="center"
          verticalAlign="middle"
          fontSize={labelFontSize}
          lineHeight={LABEL_LINE_HEIGHT}
          fontFamily={LABEL_FONT_FAMILY}
          fill={appearance.labelFill ?? '#212529'}
          listening={false}
          wrap="char"
          ellipsis
          padding={labelPadding}
        />
      ) : null}
      {selected ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled={rotateEnabled}
          rotationSnaps={ROTATION_SNAPS}
          rotationSnapTolerance={45}
          strokeScaleEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 1 || newBox.height < 1) return oldBox
            return newBox
          }}
        />
      ) : null}
    </>
  )
}
