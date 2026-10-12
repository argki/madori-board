import Modal from 'react-bootstrap/Modal'
import { useBoardStore } from '../../stores/boardStore'
import { DimensionPanel } from '../board/DimensionPanel'
import { ElevationStage } from './ElevationStage'

type ElevationEditorModalProps = {
  show: boolean
  onHide: () => void
}

export function ElevationEditorModal({
  show,
  onHide,
}: ElevationEditorModalProps) {
  const project = useBoardStore((s) => s.project)
  const elevationBoardId = useBoardStore((s) => s.elevationBoardId)
  const boardObject = elevationBoardId
    ? (project.objects.find((object) => object.id === elevationBoardId) ?? null)
    : null
  const selectedElevationObjectId = useBoardStore(
    (s) => s.selectedElevationObjectId,
  )
  const updateElevationObject = useBoardStore((s) => s.updateElevationObject)

  const title = boardObject?.label?.trim() || '名称未設定の矩形'
  const selectedObject =
    boardObject?.elevation.objects.find(
      (object) => object.id === selectedElevationObjectId,
    ) ?? null

  return (
    <Modal
      show={show}
      onHide={onHide}
      enforceFocus={false}
      restoreFocus={false}
      className="elevation-modal"
      dialogClassName="elevation-modal-dialog"
      contentClassName="elevation-modal-content"
      aria-labelledby="elevation-editor-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="elevation-editor-title">立面 — {title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="board-workspace d-flex flex-column flex-grow-1 overflow-hidden p-3">
        <ElevationStage />
        <div className="dimension-overlay">
          <DimensionPanel
            mode="elevation"
            object={selectedObject}
            mmPerPixel={project.scale?.mmPerPixel}
            showLabelField
            onChangeSize={(size) => {
              if (!selectedElevationObjectId) return
              updateElevationObject(selectedElevationObjectId, size)
            }}
            onChangeLabel={(label) => {
              if (!selectedElevationObjectId) return
              updateElevationObject(selectedElevationObjectId, {
                label: label || undefined,
              })
            }}
          />
        </div>
      </Modal.Body>
    </Modal>
  )
}
