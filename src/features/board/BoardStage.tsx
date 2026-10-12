import type { Point } from '../../lib/scale'
import { useBoardStore } from '../../stores/boardStore'
import { WorldStage } from '../canvas/WorldStage'

type BoardStageProps = {
  calibrating?: boolean
  draftPoints?: Point[]
  onCalibrationClick?: (point: Point) => void
}

export function BoardStage({
  calibrating = false,
  draftPoints = [],
  onCalibrationClick,
}: BoardStageProps) {
  const background = useBoardStore((s) => s.project.background)
  const scale = useBoardStore((s) => s.project.scale)
  const objects = useBoardStore((s) => s.project.objects)
  const selectedId = useBoardStore((s) => s.selectedId)
  const selectObject = useBoardStore((s) => s.selectObject)
  const updateObject = useBoardStore((s) => s.updateObject)
  const removeObject = useBoardStore((s) => s.removeObject)

  return (
    <WorldStage
      ariaLabel="平面ボード"
      backgroundDataUrl={background?.dataUrl}
      objects={objects}
      selectedId={selectedId}
      scaleCalibration={scale}
      calibrating={calibrating}
      draftPoints={draftPoints}
      onCalibrationClick={onCalibrationClick}
      onSelect={selectObject}
      onChangeObject={(id, patch) => updateObject(id, patch)}
      onDeleteSelected={() => {
        const id = useBoardStore.getState().selectedId
        if (id) removeObject(id)
      }}
    />
  )
}
