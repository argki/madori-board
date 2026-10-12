import { useBoardStore } from '../../stores/boardStore'
import { WorldStage } from '../canvas/WorldStage'

export function ElevationStage() {
  const elevationBoardId = useBoardStore((s) => s.elevationBoardId)
  const boardObject = useBoardStore((s) =>
    s.elevationBoardId
      ? (s.project.objects.find((object) => object.id === s.elevationBoardId) ??
        null)
      : null,
  )
  const selectedElevationObjectId = useBoardStore(
    (s) => s.selectedElevationObjectId,
  )
  const selectElevationObject = useBoardStore((s) => s.selectElevationObject)
  const updateElevationObject = useBoardStore((s) => s.updateElevationObject)
  const removeElevationObject = useBoardStore((s) => s.removeElevationObject)

  if (!elevationBoardId || !boardObject) {
    return (
      <div
        className="flex-grow-1 border rounded bg-light d-flex align-items-center justify-content-center text-secondary"
        aria-label="立面ボード"
      >
        立面を表示する平面の矩形がありません。
      </div>
    )
  }

  const boundsFrame = {
    width: Math.max(1, boardObject.width),
    height: Math.max(1, boardObject.objectHeight),
  }

  return (
    <WorldStage
      ariaLabel="立面ボード"
      boundsFrame={boundsFrame}
      frameClassName="bg-light"
      objects={boardObject.elevation.objects}
      selectedId={selectedElevationObjectId}
      rotateEnabled={false}
      onSelect={selectElevationObject}
      onChangeObject={(id, patch) => updateElevationObject(id, patch)}
      onDeleteSelected={() => {
        const id = useBoardStore.getState().selectedElevationObjectId
        if (id) removeElevationObject(id)
      }}
    />
  )
}
