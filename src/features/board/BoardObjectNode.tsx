import type Konva from 'konva'
import { useEffect, useRef } from 'react'
import { Rect, Transformer } from 'react-konva'
import type { BoardObject } from '../../types/project'

type BoardObjectNodeProps = {
  object: BoardObject
  selected: boolean
  listening?: boolean
  onSelect: () => void
  onChange: (patch: Partial<BoardObject>) => void
}

export function BoardObjectNode({
  object,
  selected,
  listening = true,
  onSelect,
  onChange,
}: BoardObjectNodeProps) {
  const shapeRef = useRef<Konva.Rect>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

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
        fill="rgba(13, 110, 253, 0.25)"
        stroke="#0d6efd"
        strokeWidth={2}
        strokeScaleEnabled={false}
        listening={listening}
        draggable={listening}
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
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(20, node.width() * scaleX),
            height: Math.max(20, node.height() * scaleY),
          })
        }}
      />
      {selected ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          strokeScaleEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox
            return newBox
          }}
        />
      ) : null}
    </>
  )
}
