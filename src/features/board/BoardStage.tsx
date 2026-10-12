import type Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import { Image as KonvaImage, Layer, Stage } from 'react-konva'
import { snapAxisAligned, type Point } from '../../lib/scale'
import { useHtmlImage } from '../../lib/useHtmlImage'
import { useBoardStore } from '../../stores/boardStore'
import { BoardObjectNode } from './BoardObjectNode'
import { ReferenceLine } from './ReferenceLine'

type Size = { width: number; height: number }

type ViewTransform = {
  x: number
  y: number
  scale: number
}

type BoardStageProps = {
  calibrating?: boolean
  draftPoints?: Point[]
  onCalibrationClick?: (point: Point) => void
}

const MIN_VIEW_SCALE = 0.05
const MAX_VIEW_SCALE = 40
const PAN_THRESHOLD_PX = 4

function fitContentTransform(stage: Size, content: Size): ViewTransform {
  const scale = Math.min(
    stage.width / content.width,
    stage.height / content.height,
  )
  const width = content.width * scale
  const height = content.height * scale
  return {
    scale,
    x: (stage.width - width) / 2,
    y: (stage.height - height) / 2,
  }
}

function clampViewScale(scale: number): number {
  return Math.min(MAX_VIEW_SCALE, Math.max(MIN_VIEW_SCALE, scale))
}

export function BoardStage({
  calibrating = false,
  draftPoints = [],
  onCalibrationClick,
}: BoardStageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const contentLayerRef = useRef<Konva.Layer>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })
  const [view, setView] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 })
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const fittedContentKeyRef = useRef<string | null>(null)

  const panSession = useRef<{
    pointerId: number
    startPointer: Point
    startView: ViewTransform
    moved: boolean
  } | null>(null)

  const background = useBoardStore((s) => s.project.background)
  const scale = useBoardStore((s) => s.project.scale)
  const objects = useBoardStore((s) => s.project.objects)
  const selectedId = useBoardStore((s) => s.selectedId)
  const selectObject = useBoardStore((s) => s.selectObject)
  const updateObject = useBoardStore((s) => s.updateObject)
  const removeObject = useBoardStore((s) => s.removeObject)

  const backgroundImage = useHtmlImage(background?.dataUrl)
  /** 矩形選択中は図面をドラッグ移動しない（Google マップで POI 選択中に近い） */
  const canPan = selectedId === null

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
      if (calibrating) return
      const id = useBoardStore.getState().selectedId
      if (!id) return
      event.preventDefault()
      removeObject(id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [removeObject, calibrating])

  const contentSize: Size = backgroundImage
    ? {
        width: backgroundImage.naturalWidth,
        height: backgroundImage.naturalHeight,
      }
    : size

  const contentKey = backgroundImage
    ? `bg:${background?.dataUrl ?? ''}:${backgroundImage.naturalWidth}x${backgroundImage.naturalHeight}`
    : 'empty'

  useEffect(() => {
    if (size.width <= 0 || contentSize.width <= 0) return
    // 背景の差し替え（または初回サイズ確定）のときだけ全体フィット。リサイズではパン/ズームを維持する
    if (fittedContentKeyRef.current === contentKey) return
    setView(fitContentTransform(size, contentSize))
    fittedContentKeyRef.current = contentKey
  }, [contentKey, size, contentSize])

  const pointerInContent = (): Point | null => {
    const layer = contentLayerRef.current
    if (!layer) return null
    const pos = layer.getRelativePointerPosition()
    if (!pos) return null
    return { x: pos.x, y: pos.y }
  }

  const isBackgroundTarget = (target: Konva.Node): boolean => {
    const stage = stageRef.current
    if (!stage) return false
    if (target === stage) return true
    return target === contentLayerRef.current
  }

  const onWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const direction = event.evt.deltaY > 0 ? -1 : 1
    const factor = event.evt.ctrlKey ? 1.08 : 1.12
    const oldScale = view.scale
    const nextScale = clampViewScale(
      direction > 0 ? oldScale * factor : oldScale / factor,
    )
    if (nextScale === oldScale) return

    const worldX = (pointer.x - view.x) / oldScale
    const worldY = (pointer.y - view.y) / oldScale
    setView({
      scale: nextScale,
      x: pointer.x - worldX * nextScale,
      y: pointer.y - worldY * nextScale,
    })
  }

  const onPointerDown = (event: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isBackgroundTarget(event.target)) return
    panSession.current = {
      pointerId: event.evt.pointerId,
      startPointer: { x: event.evt.clientX, y: event.evt.clientY },
      startView: view,
      moved: false,
    }
  }

  const onPointerMove = (event: Konva.KonvaEventObject<PointerEvent>) => {
    if (calibrating && draftPoints.length === 1) {
      const raw = pointerInContent()
      if (raw) {
        setHoverPoint(snapAxisAligned(draftPoints[0], raw))
      }
    }

    const session = panSession.current
    if (!session || session.pointerId !== event.evt.pointerId) return

    const dx = event.evt.clientX - session.startPointer.x
    const dy = event.evt.clientY - session.startPointer.y
    if (!session.moved) {
      if (Math.hypot(dx, dy) < PAN_THRESHOLD_PX) return
      if (!canPan) {
        panSession.current = null
        setIsPanning(false)
        return
      }
      session.moved = true
      setIsPanning(true)
    }

    setView({
      scale: session.startView.scale,
      x: session.startView.x + dx,
      y: session.startView.y + dy,
    })
  }

  const onPointerUp = (event: Konva.KonvaEventObject<PointerEvent>) => {
    const session = panSession.current
    const samePointer =
      session !== null && session.pointerId === event.evt.pointerId
    const wasPan = samePointer && session.moved
    if (samePointer) {
      panSession.current = null
      setIsPanning(false)
    }

    if (wasPan) return
    if (!isBackgroundTarget(event.target)) return

    if (calibrating) {
      const raw = pointerInContent()
      if (!raw) return
      if (draftPoints.length === 1) {
        onCalibrationClick?.(snapAxisAligned(draftPoints[0], raw))
      } else if (draftPoints.length === 0) {
        onCalibrationClick?.(raw)
      }
      return
    }

    selectObject(null)
  }

  const onPointerLeave = () => {
    setHoverPoint(null)
    panSession.current = null
    setIsPanning(false)
  }

  useEffect(() => {
    if (!calibrating || draftPoints.length !== 1) {
      setHoverPoint(null)
    }
  }, [calibrating, draftPoints.length])

  const savedReference = scale?.reference
  const draftA = draftPoints[0]
  const draftB =
    draftPoints[1] ??
    (calibrating && draftPoints.length === 1 ? hoverPoint : null)

  const cursor = calibrating
    ? 'crosshair'
    : isPanning
      ? 'grabbing'
      : canPan
        ? 'grab'
        : 'default'

  return (
    <div
      ref={containerRef}
      className={`flex-grow-1 border rounded bg-light overflow-hidden${calibrating ? ' border-warning' : ''}`}
      aria-label="平面ボード"
      style={{ cursor }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        <Layer
          ref={contentLayerRef}
          x={view.x}
          y={view.y}
          scaleX={view.scale}
          scaleY={view.scale}
        >
          {backgroundImage ? (
            <KonvaImage
              image={backgroundImage}
              x={0}
              y={0}
              width={backgroundImage.naturalWidth}
              height={backgroundImage.naturalHeight}
              listening={false}
            />
          ) : null}
          {objects.map((object) => (
            <BoardObjectNode
              key={object.id}
              object={object}
              selected={!calibrating && object.id === selectedId}
              listening={!calibrating}
              onSelect={() => {
                if (calibrating) return
                selectObject(object.id)
              }}
              onChange={(patch) => updateObject(object.id, patch)}
            />
          ))}
          {!calibrating && savedReference ? (
            <ReferenceLine
              a={{ x: savedReference.x1, y: savedReference.y1 }}
              b={{ x: savedReference.x2, y: savedReference.y2 }}
            />
          ) : null}
          {calibrating && draftA ? (
            <ReferenceLine a={draftA} b={draftB} draft />
          ) : null}
        </Layer>
      </Stage>
    </div>
  )
}
