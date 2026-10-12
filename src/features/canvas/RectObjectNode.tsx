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

/** 矩形の短い辺に合わせて名称フォントを小さくする */
function labelFontSizeForRect(width: number, height: number): number {
  const shorter = Math.min(width, height)
  return Math.max(8, Math.min(16, Math.floor(shorter * 0.22)))
}

type RectObjectNodeProps = {
  object: RectObject
  selected: boolean
  listening?: boolean
  rotateEnabled?: boolean
  appearance?: RectAppearance
  onSelect: () => void
  onChange: (patch: Partial<RectObject>) => void
  onDblClick?: () => void
}

export function RectObjectNode({
  object,
  selected,
  listening = true,
  rotateEnabled = true,
  appearance = DEFAULT_APPEARANCE,
  onSelect,
  onChange,
  onDblClick,
}: RectObjectNodeProps) {
  const shapeRef = useRef<Konva.Rect>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const label = object.label?.trim()
  const labelFontSize = labelFontSizeForRect(object.width, object.height)
  const labelPadding = Math.max(2, Math.round(labelFontSize * 0.35))

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
        onDblClick={(event) => {
          event.cancelBubble = true
          onDblClick?.()
        }}
        onDblTap={(event) => {
          event.cancelBubble = true
          onDblClick?.()
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
          fontFamily={LABEL_FONT_FAMILY}
          fill={appearance.labelFill ?? '#212529'}
          listening={false}
          ellipsis
          wrap="none"
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
