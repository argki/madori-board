import type Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import Button from 'react-bootstrap/Button'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import { Image as KonvaImage, Layer, Rect, Stage } from 'react-konva'
import { snapAxisAligned, type Point } from '../../lib/scale'
import { useHtmlImage } from '../../lib/useHtmlImage'
import type { ScaleCalibration } from '../../types/project'
import { ReferenceLine } from '../board/ReferenceLine'
import {
  RectObjectNode,
  type RectAppearance,
  type RectObject,
} from './RectObjectNode'

type Size = { width: number; height: number }

type ViewTransform = {
  x: number
  y: number
  scale: number
}

export type WorldStageProps = {
  ariaLabel: string
  backgroundDataUrl?: string
  /** 背景が無いときの論理キャンバスサイズ（未指定ならステージ実寸） */
  emptyContentSize?: Size
  /** キャンバス枠の追加 class（見た目の区別用） */
  frameClassName?: string
  /**
   * コンテンツ座標での外形枠（立面の幅×高さなど）。
   * 指定時はこの矩形を縁として描画し、emptyContentSize の既定にも使う。
   */
  boundsFrame?: Size
  objects: RectObject[]
  selectedId: string | null
  scaleCalibration?: ScaleCalibration
  calibrating?: boolean
  draftPoints?: Point[]
  rotateEnabled?: boolean
  rectAppearance?: RectAppearance
  onCalibrationClick?: (point: Point) => void
  onSelect: (id: string | null) => void
  onChangeObject: (id: string, patch: Partial<RectObject>) => void
  onDeleteSelected: () => void
}

const MIN_VIEW_SCALE = 0.05
const MAX_VIEW_SCALE = 40
const PAN_THRESHOLD_PX = 4
const ZOOM_BUTTON_FACTOR = 1.2

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

function touchDistance(a: Touch, b: Touch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

function touchClientCenter(a: Touch, b: Touch): Point {
  return {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2,
  }
}

function zoomViewAtPoint(
  current: ViewTransform,
  pointer: Point,
  nextScale: number,
): ViewTransform {
  const worldX = (pointer.x - current.x) / current.scale
  const worldY = (pointer.y - current.y) / current.scale
  return {
    scale: nextScale,
    x: pointer.x - worldX * nextScale,
    y: pointer.y - worldY * nextScale,
  }
}

export function WorldStage({
  ariaLabel,
  backgroundDataUrl,
  emptyContentSize,
  frameClassName = '',
  boundsFrame,
  objects,
  selectedId,
  scaleCalibration,
  calibrating = false,
  draftPoints = [],
  rotateEnabled = true,
  rectAppearance,
  onCalibrationClick,
  onSelect,
  onChangeObject,
  onDeleteSelected,
}: WorldStageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const contentLayerRef = useRef<Konva.Layer>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })
  const [view, setView] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 })
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const fittedContentKeyRef = useRef<string | null>(null)
  const viewRef = useRef(view)
  viewRef.current = view

  const panSession = useRef<{
    pointerId: number
    startPointer: Point
    startView: ViewTransform
    moved: boolean
  } | null>(null)
  const pinchSession = useRef<{ lastDistance: number } | null>(null)
  /** 矩形ドラッグ後の pointerup が背景扱いになるのを防ぐ */
  const pointerDownOnBackgroundRef = useRef(false)

  const backgroundImage = useHtmlImage(backgroundDataUrl)

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
    const element = containerRef.current
    if (!element) return

    const stagePointFromClient = (client: Point): Point => {
      const rect = element.getBoundingClientRect()
      return { x: client.x - rect.left, y: client.y - rect.top }
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length < 2) return
      panSession.current = null
      setIsPanning(false)
      pointerDownOnBackgroundRef.current = false
      pinchSession.current = {
        lastDistance: touchDistance(event.touches[0], event.touches[1]),
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length < 2) return
      event.preventDefault()
      const a = event.touches[0]
      const b = event.touches[1]
      const distance = touchDistance(a, b)
      if (!(distance > 0)) return

      const session = pinchSession.current
      if (!session || !(session.lastDistance > 0)) {
        pinchSession.current = { lastDistance: distance }
        return
      }

      const current = viewRef.current
      const nextScale = clampViewScale(
        current.scale * (distance / session.lastDistance),
      )
      session.lastDistance = distance
      if (nextScale === current.scale) return

      const pointer = stagePointFromClient(touchClientCenter(a, b))
      const next = zoomViewAtPoint(current, pointer, nextScale)
      viewRef.current = next
      setView(next)
    }

    const endPinch = () => {
      pinchSession.current = null
    }

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    element.addEventListener('touchend', endPinch)
    element.addEventListener('touchcancel', endPinch)
    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
      element.removeEventListener('touchend', endPinch)
      element.removeEventListener('touchcancel', endPinch)
    }
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
      if (!selectedId) return
      event.preventDefault()
      onDeleteSelected()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [calibrating, selectedId, onDeleteSelected])

  const fallbackEmpty = boundsFrame ?? emptyContentSize
  const contentSize: Size = backgroundImage
    ? {
        width: backgroundImage.naturalWidth,
        height: backgroundImage.naturalHeight,
      }
    : (fallbackEmpty ?? size)

  const contentKey = backgroundImage
    ? `bg:${backgroundDataUrl ?? ''}:${backgroundImage.naturalWidth}x${backgroundImage.naturalHeight}`
    : fallbackEmpty
      ? `empty:${fallbackEmpty.width}x${fallbackEmpty.height}`
      : 'empty-stage'

  useEffect(() => {
    if (size.width <= 0 || contentSize.width <= 0) return
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

  const zoomByFactor = (factor: number, pointer?: Point) => {
    const current = viewRef.current
    const nextScale = clampViewScale(current.scale * factor)
    if (nextScale === current.scale) return
    const focus =
      pointer ??
      ({
        x: size.width / 2,
        y: size.height / 2,
      } satisfies Point)
    const next = zoomViewAtPoint(current, focus, nextScale)
    viewRef.current = next
    setView(next)
  }

  const onWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const direction = event.evt.deltaY > 0 ? -1 : 1
    const factor = event.evt.ctrlKey ? 1.08 : 1.12
    zoomByFactor(direction > 0 ? factor : 1 / factor, pointer)
  }

  const onPointerDown = (event: Konva.KonvaEventObject<PointerEvent>) => {
    if (pinchSession.current) return
    if (!isBackgroundTarget(event.target)) {
      pointerDownOnBackgroundRef.current = false
      panSession.current = null
      setIsPanning(false)
      return
    }
    pointerDownOnBackgroundRef.current = true
    panSession.current = {
      pointerId: event.evt.pointerId,
      startPointer: { x: event.evt.clientX, y: event.evt.clientY },
      startView: viewRef.current,
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

    if (pinchSession.current) return

    const session = panSession.current
    if (!session || session.pointerId !== event.evt.pointerId) return

    const dx = event.evt.clientX - session.startPointer.x
    const dy = event.evt.clientY - session.startPointer.y
    if (!session.moved) {
      if (Math.hypot(dx, dy) < PAN_THRESHOLD_PX) return
      session.moved = true
      setIsPanning(true)
    }

    const next = {
      scale: session.startView.scale,
      x: session.startView.x + dx,
      y: session.startView.y + dy,
    }
    viewRef.current = next
    setView(next)
  }

  const onPointerUp = (event: Konva.KonvaEventObject<PointerEvent>) => {
    const session = panSession.current
    const samePointer =
      session !== null && session.pointerId === event.evt.pointerId
    const wasPan = samePointer && session.moved
    const startedOnBackground = pointerDownOnBackgroundRef.current
    if (samePointer) {
      panSession.current = null
      setIsPanning(false)
    }
    pointerDownOnBackgroundRef.current = false

    // 矩形や Transformer 上で始めた操作のあと、pointerup の target が
    // 背景扱いになっても選択は外さない
    if (!startedOnBackground) return
    if (wasPan) return
    if (pinchSession.current) return

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

    onSelect(null)
  }

  const onPointerLeave = () => {
    setHoverPoint(null)
    panSession.current = null
    pointerDownOnBackgroundRef.current = false
    setIsPanning(false)
  }

  useEffect(() => {
    if (!calibrating || draftPoints.length !== 1) {
      setHoverPoint(null)
    }
  }, [calibrating, draftPoints.length])

  const savedReference = scaleCalibration?.reference
  const draftA = draftPoints[0]
  const draftB =
    draftPoints[1] ??
    (calibrating && draftPoints.length === 1 ? hoverPoint : null)

  const cursor = calibrating ? 'crosshair' : isPanning ? 'grabbing' : 'grab'

  return (
    <div
      ref={containerRef}
      className={`world-stage-frame flex-grow-1 border rounded overflow-hidden${calibrating ? ' border-warning' : ''} ${frameClassName || 'bg-light'}`.trim()}
      aria-label={ariaLabel}
      style={{ cursor, touchAction: 'none' }}
    >
      <ButtonGroup size="sm" className="world-stage-zoom" aria-label="表示倍率">
        <Button
          type="button"
          variant="light"
          title="拡大"
          aria-label="拡大"
          onClick={() => zoomByFactor(ZOOM_BUTTON_FACTOR)}
        >
          <i className="bi bi-zoom-in" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="light"
          title="縮小"
          aria-label="縮小"
          onClick={() => zoomByFactor(1 / ZOOM_BUTTON_FACTOR)}
        >
          <i className="bi bi-zoom-out" aria-hidden />
        </Button>
      </ButtonGroup>
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
          {boundsFrame ? (
            <Rect
              x={0}
              y={0}
              width={boundsFrame.width}
              height={boundsFrame.height}
              stroke="#495057"
              strokeWidth={2}
              strokeScaleEnabled={false}
              dash={[10, 6]}
              listening={false}
            />
          ) : null}
          {objects.map((object) => (
            <RectObjectNode
              key={object.id}
              object={object}
              selected={!calibrating && object.id === selectedId}
              listening={!calibrating}
              rotateEnabled={rotateEnabled}
              appearance={rectAppearance}
              onSelect={() => {
                if (calibrating) return
                onSelect(object.id)
              }}
              onChange={(patch) => onChangeObject(object.id, patch)}
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
