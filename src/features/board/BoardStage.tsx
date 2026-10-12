import type Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import { Image as KonvaImage, Layer, Stage } from 'react-konva'
import { useHtmlImage } from '../../lib/useHtmlImage'
import { useBoardStore } from '../../stores/boardStore'
import { BoardObjectNode } from './BoardObjectNode'

type Size = { width: number; height: number }

function fitBackgroundSize(
  stage: Size,
  image: HTMLImageElement,
): { width: number; height: number; x: number; y: number } {
  const scale = Math.min(
    stage.width / image.naturalWidth,
    stage.height / image.naturalHeight,
  )
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  return {
    width,
    height,
    x: (stage.width - width) / 2,
    y: (stage.height - height) / 2,
  }
}

export function BoardStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [size, setSize] = useState<Size>({ width: 800, height: 600 })

  const background = useBoardStore((s) => s.project.background)
  const objects = useBoardStore((s) => s.project.objects)
  const selectedId = useBoardStore((s) => s.selectedId)
  const selectObject = useBoardStore((s) => s.selectObject)
  const updateObject = useBoardStore((s) => s.updateObject)
  const removeObject = useBoardStore((s) => s.removeObject)

  const backgroundImage = useHtmlImage(background?.dataUrl)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({
        width: Math.max(1, Math.floor(width)),
        height: Math.max(1, Math.floor(height)),
      })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      const id = useBoardStore.getState().selectedId
      if (!id) return
      event.preventDefault()
      removeObject(id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [removeObject])

  const fitted =
    backgroundImage && size.width > 0
      ? fitBackgroundSize(size, backgroundImage)
      : null

  const clearSelectionIfStage = (target: Konva.Node) => {
    const stage = stageRef.current
    if (!stage) return
    if (target === stage) {
      selectObject(null)
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex-grow-1 border rounded bg-light overflow-hidden"
      aria-label="平面ボード"
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onMouseDown={(event) => clearSelectionIfStage(event.target)}
        onTouchStart={(event) => clearSelectionIfStage(event.target)}
      >
        <Layer>
          {backgroundImage && fitted ? (
            <KonvaImage
              image={backgroundImage}
              x={fitted.x}
              y={fitted.y}
              width={fitted.width}
              height={fitted.height}
              listening={false}
            />
          ) : null}
          {objects.map((object) => (
            <BoardObjectNode
              key={object.id}
              object={object}
              selected={object.id === selectedId}
              onSelect={() => selectObject(object.id)}
              onChange={(patch) => updateObject(object.id, patch)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
